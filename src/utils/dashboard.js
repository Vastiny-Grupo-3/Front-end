import { arredondar } from "./formatadores.js";

/*
 * Cálculos do Dashboard (TL12). Funções puras.
 * Período em datas ISO (aaaa-mm-dd), inclusivo nas duas pontas.
 * `categoriaIds` = categorias selecionadas no filtro do funil; vale para os
 * indicadores e para os painéis de vendas (não para os painéis de estoque).
 */

export const MENSAGENS_DASHBOARD = {
  periodoInvalido: "A data inicial não pode ser depois da data final.",
  semVendas: "Sem vendas no período selecionado.",
};

export const ESTADOS_ESTOQUE = ["Bom", "Médio", "Ruim", "Crítico"];

/** Barras exibidas antes de agrupar o resto em "Outros". */
export const MAXIMO_CATEGORIAS = 6;
/** Linhas da tabela "Top 10 Produtos mais Vendidos" (a tabela rola por dentro, sem crescer o painel). */
export const MAXIMO_PRODUTOS = 10;

const UM_DIA = 24 * 60 * 60 * 1000;

function paraData(iso) {
  const [ano, mes, dia] = iso.split("-").map(Number);
  return Date.UTC(ano, mes - 1, dia);
}

/** Dias do período, contando o inicial e o final. */
export function diasNoPeriodo(inicio, fim) {
  return Math.round((paraData(fim) - paraData(inicio)) / UM_DIA) + 1;
}

/** "1 dia filtrado" · "30 dias filtrados" */
export function textoDiasFiltrados(dias) {
  return dias === 1 ? "1 dia filtrado" : `${dias} dias filtrados`;
}

export function validarPeriodo(inicio, fim) {
  return inicio && fim && inicio > fim ? MENSAGENS_DASHBOARD.periodoInvalido : null;
}

/** Período padrão: da primeira venda registrada até hoje. */
export function periodoPadrao(vendas, hoje) {
  const primeira = vendas.reduce((menor, venda) => (venda.data < menor ? venda.data : menor), hoje);
  return { inicio: primeira, fim: hoje };
}

/** Itens vendidos no período, só das categorias selecionadas, com a data da venda. */
function itensDoPeriodo(vendas, { inicio, fim, categoriaIds }) {
  return vendas
    .filter((venda) => venda.data >= inicio && venda.data <= fim)
    .flatMap((venda) =>
      venda.itens
        .filter((item) => categoriaIds.includes(item.categoriaId))
        .map((item) => ({ ...item, vendaId: venda.id })),
    );
}

/**
 * Indicadores do período. `precoMedio` é null quando não há vendas.
 * `lucro` = soma do lucro de cada item vendido (já descontado o desconto do item).
 */
export function calcularIndicadores({ vendas, produtos, inicio, fim, categoriaIds }) {
  const itens = itensDoPeriodo(vendas, { inicio, fim, categoriaIds });
  const quantidadeVendas = new Set(itens.map((item) => item.vendaId)).size;
  const faturamento = arredondar(itens.reduce((soma, item) => soma + item.total, 0));
  return {
    vendas: quantidadeVendas,
    faturamento,
    lucro: arredondar(itens.reduce((soma, item) => soma + item.lucro, 0)),
    precoMedio: quantidadeVendas > 0 ? arredondar(faturamento / quantidadeVendas) : null,
    produtosAtivos: produtos.filter((produto) => categoriaIds.includes(produto.categoriaId)).length,
  };
}

/**
 * Faturamento por categoria, do maior para o menor; acima de MAXIMO_CATEGORIAS,
 * o resto vira "Outros". A cor segue a categoria (posição na lista), não o ranking.
 * [{ id, nome, valor, indiceCor }] — indiceCor de 1 a 6; "Outros" usa 7.
 */
export function categoriasMaisVendidas({ vendas, categorias, inicio, fim, categoriaIds }) {
  const itens = itensDoPeriodo(vendas, { inicio, fim, categoriaIds });
  const porCategoria = new Map();
  itens.forEach((item) => {
    porCategoria.set(item.categoriaId, (porCategoria.get(item.categoriaId) ?? 0) + item.total);
  });

  const ordenadas = [...porCategoria.entries()]
    .map(([id, valor]) => {
      const posicao = categorias.findIndex((categoria) => categoria.id === id);
      const nome =
        categorias[posicao]?.nome ?? itens.find((item) => item.categoriaId === id)?.categoria ?? "";
      return { id, nome, valor: arredondar(valor), indiceCor: (Math.max(posicao, 0) % 6) + 1 };
    })
    .sort((a, b) => b.valor - a.valor);

  if (ordenadas.length <= MAXIMO_CATEGORIAS + 1) return ordenadas;
  const principais = ordenadas.slice(0, MAXIMO_CATEGORIAS);
  const resto = ordenadas.slice(MAXIMO_CATEGORIAS);
  return [
    ...principais,
    {
      id: "outros",
      nome: "Outros",
      valor: arredondar(resto.reduce((soma, item) => soma + item.valor, 0)),
      indiceCor: 7,
    },
  ];
}

/** Produtos mais vendidos no período (por quantidade): Qtd. Vendidas, Faturado e Lucro. */
export function produtosMaisVendidos({ vendas, inicio, fim, categoriaIds, limite = MAXIMO_PRODUTOS }) {
  const porProduto = new Map();
  itensDoPeriodo(vendas, { inicio, fim, categoriaIds }).forEach((item) => {
    const atual = porProduto.get(item.produtoId) ?? {
      id: item.produtoId,
      nome: item.nome,
      codigo: item.codigo,
      imagem: item.imagem ?? "",
      categoriaId: item.categoriaId,
      categoria: item.categoria,
      quantidade: 0,
      faturado: 0,
      lucro: 0,
    };
    porProduto.set(item.produtoId, {
      ...atual,
      quantidade: atual.quantidade + item.quantidade,
      faturado: arredondar(atual.faturado + item.total),
      lucro: arredondar(atual.lucro + item.lucro),
    });
  });
  return [...porProduto.values()]
    .sort((a, b) => b.quantidade - a.quantidade || b.faturado - a.faturado)
    .slice(0, limite);
}

/**
 * Produtos com quantidade abaixo do mínimo cadastrado e o custo parado
 * no estoque (quantidade × valor de compra).
 */
export function resumoEstoque(produtos) {
  const abaixoDoMinimo = produtos.filter(
    (produto) => produto.estoqueMinimo != null && produto.quantidade < produto.estoqueMinimo,
  ).length;
  const custo = arredondar(
    produtos.reduce((soma, produto) => soma + produto.quantidade * (produto.valorCompra ?? 0), 0),
  );
  return { abaixoDoMinimo, custo };
}

/**
 * Níveis de estoque atual: quantos produtos em cada estado (vindo do banco).
 * Produtos sem estado informado ficam de fora.
 */
export function niveisDeEstoque(produtos) {
  const contagem = ESTADOS_ESTOQUE.map((estado) => ({
    estado,
    quantidade: produtos.filter((produto) => produto.estado === estado).length,
  }));
  const total = contagem.reduce((soma, item) => soma + item.quantidade, 0);
  return {
    total,
    niveis: contagem.map((item) => ({
      ...item,
      percentual: total > 0 ? (item.quantidade / total) * 100 : 0,
    })),
  };
}

/** Ordem de gravidade para ordenar a coluna "Estado": Crítico primeiro. */
export function gravidadeDoEstado(estado) {
  const ordem = ["Crítico", "Ruim", "Médio", "Bom"];
  const posicao = ordem.indexOf(estado);
  return posicao === -1 ? ordem.length : posicao;
}
