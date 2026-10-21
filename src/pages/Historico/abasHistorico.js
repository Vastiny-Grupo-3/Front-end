import { resumirVendasPorCliente } from "../../utils/estoque.js";
import {
  arredondar,
  formatarData,
  formatarId,
  formatarMoeda,
  formatarUnidades,
} from "../../utils/formatadores.js";

/*
 * Configuração das seis abas do Histórico (TL06–TL11), usada por um único
 * componente de tabela. Cada aba define:
 *   linhas(dados)      → registros exibidos
 *   colunas            → colunas da tabela (copy oficial)
 *   identificador(l)   → texto da linha que descreve o botão "…"
 *   textoPesquisa(l)   → onde a pesquisa procura (nome, id ou transação)
 *   detalhes(l)        → { campos, vendas? } do painel de detalhes
 */

const ID_PRODUTO = 4;
const ID_CURTO = 3;

const SEM_CLIENTE = "Sem Cliente";

/** Primeiro clique: nomes de A a Z; números, datas e ids do maior para o menor. */
function direcaoInicial(coluna) {
  if (
    coluna.chave === "id" ||
    coluna.chave === "data" ||
    coluna.chave === "valor" ||
    coluna.chave === "lucro" ||
    coluna.chave === "valorTotal" ||
    coluna.chave === "lucroTotal" ||
    coluna.chave.endsWith("Id") ||
    coluna.chave.startsWith("quantidade")
  ) {
    return "desc";
  }
  return "asc";
}

/** Cabeçalho clicável. `valor` é o dado cru, não o texto já formatado. */
function ordenavel(coluna, valor = (linha) => linha[coluna.chave]) {
  return { ...coluna, ordenavel: true, valorOrdenacao: valor, primeiraDirecao: direcaoInicial(coluna) };
}

/** No mesmo dia, o id maior é o registro mais recente. */
function recencia(linha) {
  return `${linha.data}-${String(linha.id).padStart(6, "0")}`;
}

/* Produtos de uma venda com preço e lucro da época. */
function produtosDaVenda(venda) {
  return venda.itens.map((item) => ({
    id: item.produtoId,
    nome: item.nome,
    preco: formatarMoeda(item.precoUnitario),
    lucro: formatarMoeda(item.lucroUnitario),
    unidades: item.quantidade,
    valorTotal: formatarMoeda(item.valorLinha),
  }));
}

function vendaDetalhada(venda) {
  const total = arredondar(venda.itens.reduce((soma, item) => soma + item.valorLinha, 0));
  return {
    id: venda.id,
    titulo: `Transação: ${formatarId(venda.id, ID_CURTO)} · Data da Venda: ${formatarData(venda.data)}`,
    produtos: produtosDaVenda(venda),
    total: formatarMoeda(total),
  };
}

const colunasMovimentacao = (rotuloQuantidade, rotuloData) => [
  ordenavel({ chave: "produtoId", titulo: "Id", renderizar: (l) => formatarId(l.produtoId, ID_PRODUTO) }),
  ordenavel({ chave: "nome", titulo: "Nome" }),
  ordenavel({ chave: "categoria", titulo: "Categoria" }),
  ordenavel({ chave: "quantidadeAntes", titulo: "Qtd. Antes" }),
  ordenavel({ chave: "quantidadeDepois", titulo: "Qtd. Depois" }),
  ordenavel({ chave: "quantidade", titulo: rotuloQuantidade }),
  ordenavel({ chave: "data", titulo: rotuloData, renderizar: (l) => formatarData(l.data) }, recencia),
];

export const ABAS_HISTORICO = [
  {
    id: "vendas",
    rotulo: "Vendas",
    cor: "var(--cor-aba-vendas)",
    caminho: "/historico",
    ordemInicial: "id",
    linhas: (dados) => dados.vendas,
    colunas: [
      ordenavel({ chave: "id", titulo: "Transação", renderizar: (l) => formatarId(l.id, ID_CURTO) }),
      ordenavel(
        { chave: "cliente", titulo: "Cliente", renderizar: (l) => l.clienteNome ?? SEM_CLIENTE },
        (l) => l.clienteNome ?? SEM_CLIENTE,
      ),
      ordenavel(
        { chave: "valor", titulo: "Valor", renderizar: (l) => formatarMoeda(l.valor) },
      ),
      ordenavel(
        { chave: "lucro", titulo: "Lucro", renderizar: (l) => formatarMoeda(l.lucro) },
      ),
      ordenavel({
        chave: "quantidadeProdutos",
        titulo: "Qtd. Produtos",
        renderizar: (l) => formatarUnidades(l.quantidadeProdutos),
      }),
      ordenavel({ chave: "data", titulo: "Dt. Venda", renderizar: (l) => formatarData(l.data) }),
    ],
    identificador: (l) => `Transação ${formatarId(l.id, ID_CURTO)}`,
    textoPesquisa: (l) => [formatarId(l.id, ID_CURTO), l.clienteNome ?? SEM_CLIENTE].join(" "),
    detalhes: (l) => ({
      campos: [
        ["Transação", formatarId(l.id, ID_CURTO)],
        ["Cliente", l.clienteNome ?? SEM_CLIENTE],
        ["Valor Total", formatarMoeda(l.valor)],
        ["Lucro", formatarMoeda(l.lucro)],
        ["Qtd. Produtos", formatarUnidades(l.quantidadeProdutos)],
        ["Data da Venda", formatarData(l.data)],
      ],
      vendas: [{ ...vendaDetalhada(l), titulo: null }],
    }),
  },
  {
    id: "clientes",
    rotulo: "Clientes",
    cor: "var(--cor-aba-clientes)",
    caminho: "/historico/clientes",
    ordemInicial: "clienteId",
    linhas: (dados) => resumirVendasPorCliente(dados).map((l) => ({ ...l, id: l.clienteId })),
    colunas: [
      ordenavel({
        chave: "clienteId",
        titulo: "Id Cliente",
        renderizar: (l) => formatarId(l.clienteId, ID_CURTO),
      }),
      ordenavel({ chave: "nome", titulo: "Nome" }),
      ordenavel({ chave: "quantidadeVendas", titulo: "Qtd. Vendas" }),
      ordenavel({
        chave: "valorTotal",
        titulo: "Valor Total",
        renderizar: (l) => formatarMoeda(l.valorTotal),
      }),
      ordenavel({
        chave: "lucroTotal",
        titulo: "Lucro Total",
        renderizar: (l) => formatarMoeda(l.lucroTotal),
      }),
    ],
    identificador: (l) => l.nome,
    textoPesquisa: (l) => [formatarId(l.clienteId, ID_CURTO), l.nome].join(" "),
    detalhes: (l) => ({
      campos: [
        ["Id Cliente", formatarId(l.clienteId, ID_CURTO)],
        ["Cliente", l.nome],
        ["Qtd. Vendas", l.quantidadeVendas],
        ["Valor Total", formatarMoeda(l.valorTotal)],
        ["Lucro Total", formatarMoeda(l.lucroTotal)],
      ],
      vendas: l.vendas.map(vendaDetalhada),
    }),
  },
  {
    id: "entrada",
    rotulo: "Entrada",
    cor: "var(--cor-aba-entrada)",
    caminho: "/historico/entrada",
    ordemInicial: "data",
    linhas: (dados) => dados.entradas,
    colunas: colunasMovimentacao("Entrou", "Dt. Entrada"),
    identificador: (l) => l.nome,
    textoPesquisa: (l) => [formatarId(l.produtoId, ID_PRODUTO), l.nome].join(" "),
    detalhes: (l) => ({
      campos: [
        ["Id do Produto", formatarId(l.produtoId, ID_PRODUTO)],
        ["Nome do Produto", l.nome],
        ["Categoria do Produto", l.categoria],
        ["Quantidade antes da adição", l.quantidadeAntes],
        ["Quantidade depois da adição", l.quantidadeDepois],
        ["Quantidade adicionada", l.quantidade],
        ["Data da adição", formatarData(l.data)],
      ],
    }),
  },
  {
    id: "saida",
    rotulo: "Saída",
    cor: "var(--cor-aba-saida)",
    caminho: "/historico/saida",
    ordemInicial: "data",
    linhas: (dados) => dados.saidas,
    colunas: colunasMovimentacao("Saiu", "Dt. Saída"),
    identificador: (l) => l.nome,
    textoPesquisa: (l) => [formatarId(l.produtoId, ID_PRODUTO), l.nome].join(" "),
    detalhes: (l) => ({
      campos: [
        ["Id do Produto", formatarId(l.produtoId, ID_PRODUTO)],
        ["Nome do Produto", l.nome],
        ["Categoria do Produto", l.categoria],
        ["Quantidade antes da subtração", l.quantidadeAntes],
        ["Quantidade depois da subtração", l.quantidadeDepois],
        ["Quantidade removida", l.quantidade],
        ["Data da subtração", formatarData(l.data)],
        ...(l.justificativa ? [["Justificativa", l.justificativa]] : []),
      ],
    }),
  },
  {
    id: "cadastro-produtos",
    rotulo: "Cadastro de Produtos",
    cor: "var(--cor-aba-cadastro-produtos)",
    caminho: "/historico/cadastro-produtos",
    ordemInicial: "produtoId",
    linhas: (dados) => dados.cadastrosProdutos,
    colunas: [
      ordenavel({ chave: "produtoId", titulo: "Id", renderizar: (l) => formatarId(l.produtoId, ID_PRODUTO) }),
      ordenavel({ chave: "nome", titulo: "Nome" }),
      ordenavel({ chave: "categoria", titulo: "Categoria" }),
      ordenavel({ chave: "quantidadeInicial", titulo: "Qtd. Inicial" }),
      ordenavel({ chave: "valor", titulo: "Valor", renderizar: (l) => formatarMoeda(l.valor) }),
      ordenavel({ chave: "lucro", titulo: "Lucro", renderizar: (l) => formatarMoeda(l.lucro) }),
      ordenavel({ chave: "data", titulo: "Dt. Cadastro", renderizar: (l) => formatarData(l.data) }, recencia),
    ],
    identificador: (l) => l.nome,
    textoPesquisa: (l) => [formatarId(l.produtoId, ID_PRODUTO), l.nome].join(" "),
    detalhes: (l) => ({
      campos: [
        ["Id do Produto", formatarId(l.produtoId, ID_PRODUTO)],
        ["Nome do Produto", l.nome],
        ["Categoria do Produto", l.categoria],
        ["Quantidade inicial", l.quantidadeInicial],
        ["Valor no cadastro", formatarMoeda(l.valor)],
        ["Lucro no cadastro", formatarMoeda(l.lucro)],
        ["Data do cadastro", formatarData(l.data)],
      ],
    }),
  },
  {
    id: "cadastro-clientes",
    rotulo: "Cadastro de Clientes",
    cor: "var(--cor-aba-cadastro-clientes)",
    caminho: "/historico/cadastro-clientes",
    ordemInicial: "clienteId",
    linhas: (dados) => dados.cadastrosClientes,
    colunas: [
      ordenavel({ chave: "clienteId", titulo: "Id", renderizar: (l) => formatarId(l.clienteId, ID_PRODUTO) }),
      ordenavel({ chave: "nome", titulo: "Nome" }),
      ordenavel({ chave: "telefone", titulo: "Telefone" }),
      ordenavel({ chave: "data", titulo: "Dt. Cadastro", renderizar: (l) => formatarData(l.data) }, recencia),
    ],
    identificador: (l) => l.nome,
    textoPesquisa: (l) => [formatarId(l.clienteId, ID_PRODUTO), l.nome].join(" "),
    detalhes: (l) => ({
      campos: [
        ["Id do Cliente", formatarId(l.clienteId, ID_PRODUTO)],
        ["Nome do Cliente", l.nome],
        ["Telefone do Cliente", l.telefone],
        ["Data do cadastro", formatarData(l.data)],
      ],
    }),
  },
];

function normalizar(texto) {
  return String(texto).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

/** RF51: filtra os registros da aba pelo texto de pesquisa (nome, id ou transação). */
export function pesquisarNaAba(aba, linhas, pesquisa) {
  const termo = normalizar(pesquisa);
  if (!termo) return linhas;
  return linhas.filter((linha) => normalizar(aba.textoPesquisa(linha)).includes(termo));
}
