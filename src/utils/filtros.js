import { formatarMoeda } from "./formatadores.js";

/*
 * Filtros de produtos (TL17), usados no Catálogo, na Entrada e na Saída.
 * Funções puras: recebem os filtros e devolvem novos valores.
 */

export const OPCOES_ESTOQUE = [
  { valor: "todos", rotulo: "Todos" },
  { valor: "com", rotulo: "Com estoque" },
  { valor: "sem", rotulo: "Sem estoque" },
  { valor: "abaixo-minimo", rotulo: "Estoque abaixo do mínimo" },
];

export const OPCOES_CARRINHO = [
  { valor: "todos", rotulo: "Todos" },
  { valor: "no-carrinho", rotulo: "No carrinho" },
  { valor: "fora-carrinho", rotulo: "Fora do carrinho" },
];

export const OPCOES_ORDEM = [
  { valor: "nome", rotulo: "Nome (A–Z)" },
  { valor: "menor-preco", rotulo: "Menor preço" },
  { valor: "maior-preco", rotulo: "Maior preço" },
  { valor: "maior-estoque", rotulo: "Maior estoque" },
  { valor: "menor-estoque", rotulo: "Menor estoque" },
];

export const FILTROS_PADRAO = {
  categorias: [],
  precoMinimo: null,
  precoMaximo: null,
  estoque: "todos",
  carrinho: "todos",
  ordem: "nome",
};

export const MENSAGENS_FILTROS = {
  precoInvalido: "O preço mínimo não pode ser maior que o máximo.",
  semResultadoPesquisa: "Nenhum produto encontrado. Tente buscar por outro nome.",
  semResultadoFiltros: "Nenhum produto encontrado com esses filtros. Tente remover algum deles.",
};

const comparadorNome = new Intl.Collator("pt-BR", { sensitivity: "base", numeric: true });

/* Ignora maiúsculas e acentos: "lampada" encontra "Lâmpada". */
function normalizar(texto) {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

/** Retorna a mensagem de erro dos filtros ou null. */
export function validarFiltros(filtros) {
  const { precoMinimo, precoMaximo } = filtros;
  if (precoMinimo != null && precoMaximo != null && precoMinimo > precoMaximo) {
    return MENSAGENS_FILTROS.precoInvalido;
  }
  return null;
}

/** Há algum filtro diferente do padrão? (a ordenação não conta como filtro) */
export function temFiltrosAtivos(filtros) {
  return (
    filtros.categorias.length > 0 ||
    filtros.precoMinimo != null ||
    filtros.precoMaximo != null ||
    filtros.estoque !== "todos" ||
    filtros.carrinho !== "todos"
  );
}

const ORDENACOES = {
  nome: (a, b) => comparadorNome.compare(a.nome, b.nome),
  "menor-preco": (a, b) => a.valorVenda - b.valorVenda,
  "maior-preco": (a, b) => b.valorVenda - a.valorVenda,
  "maior-estoque": (a, b) => b.quantidade - a.quantidade,
  "menor-estoque": (a, b) => a.quantidade - b.quantidade,
};

/**
 * Aplica pesquisa por nome, filtros e ordenação.
 * `estaNoCarrinho(produtoId)` só é usado pelo filtro "Carrinho" (Catálogo).
 */
export function filtrarProdutos(produtos, { pesquisa = "", filtros = FILTROS_PADRAO, estaNoCarrinho } = {}) {
  const termo = normalizar(pesquisa);
  const resultado = produtos.filter((produto) => {
    if (termo && !normalizar(produto.nome).includes(termo)) return false;
    if (filtros.categorias.length > 0 && !filtros.categorias.includes(produto.categoriaId)) return false;
    if (filtros.precoMinimo != null && produto.valorVenda < filtros.precoMinimo) return false;
    if (filtros.precoMaximo != null && produto.valorVenda > filtros.precoMaximo) return false;

    if (filtros.estoque === "com" && produto.quantidade <= 0) return false;
    if (filtros.estoque === "sem" && produto.quantidade > 0) return false;
    if (
      filtros.estoque === "abaixo-minimo" &&
      !(produto.estoqueMinimo != null && produto.quantidade < produto.estoqueMinimo)
    ) {
      return false;
    }

    if (filtros.carrinho !== "todos" && estaNoCarrinho) {
      const noCarrinho = estaNoCarrinho(produto.id);
      if (filtros.carrinho === "no-carrinho" && !noCarrinho) return false;
      if (filtros.carrinho === "fora-carrinho" && noCarrinho) return false;
    }
    return true;
  });

  const ordenar = ORDENACOES[filtros.ordem] ?? ORDENACOES.nome;
  return [...resultado].sort((a, b) => ordenar(a, b) || ORDENACOES.nome(a, b));
}

function rotuloDe(opcoes, valor) {
  return opcoes.find((opcao) => opcao.valor === valor)?.rotulo ?? "";
}

/**
 * Etiquetas dos filtros ativos, cada uma com os filtros resultantes ao removê-la.
 * [{ id, rotulo, filtrosSemEste }]
 */
export function listarFiltrosAtivos(filtros, categorias) {
  const etiquetas = filtros.categorias.map((categoriaId) => ({
    id: `categoria-${categoriaId}`,
    rotulo: categorias.find((categoria) => categoria.id === categoriaId)?.nome ?? "",
    filtrosSemEste: { ...filtros, categorias: filtros.categorias.filter((id) => id !== categoriaId) },
  }));
  if (filtros.precoMinimo != null) {
    etiquetas.push({
      id: "preco-minimo",
      rotulo: `Mínimo: ${formatarMoeda(filtros.precoMinimo)}`,
      filtrosSemEste: { ...filtros, precoMinimo: null },
    });
  }
  if (filtros.precoMaximo != null) {
    etiquetas.push({
      id: "preco-maximo",
      rotulo: `Máximo: ${formatarMoeda(filtros.precoMaximo)}`,
      filtrosSemEste: { ...filtros, precoMaximo: null },
    });
  }
  if (filtros.estoque !== "todos") {
    etiquetas.push({
      id: "estoque",
      rotulo: rotuloDe(OPCOES_ESTOQUE, filtros.estoque),
      filtrosSemEste: { ...filtros, estoque: "todos" },
    });
  }
  if (filtros.carrinho !== "todos") {
    etiquetas.push({
      id: "carrinho",
      rotulo: rotuloDe(OPCOES_CARRINHO, filtros.carrinho),
      filtrosSemEste: { ...filtros, carrinho: "todos" },
    });
  }
  if (filtros.ordem !== FILTROS_PADRAO.ordem) {
    etiquetas.push({
      id: "ordem",
      rotulo: rotuloDe(OPCOES_ORDEM, filtros.ordem),
      filtrosSemEste: { ...filtros, ordem: FILTROS_PADRAO.ordem },
    });
  }
  return etiquetas;
}
