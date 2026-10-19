import { resumirVendasPorCliente } from "../../utils/estoque.js";
import {
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

/* Produtos de uma venda com preço e lucro da época. */
function produtosDaVenda(venda) {
  return venda.itens.map((item) => ({
    id: item.produtoId,
    nome: item.nome,
    preco: formatarMoeda(item.precoUnitario),
    lucro: formatarMoeda(item.lucroUnitario),
    unidades: item.quantidade,
  }));
}

function vendaDetalhada(venda) {
  return {
    id: venda.id,
    titulo: `Transação: ${formatarId(venda.id, ID_CURTO)} · Data da Venda: ${formatarData(venda.data)}`,
    produtos: produtosDaVenda(venda),
  };
}

const colunasMovimentacao = (rotuloQuantidade, rotuloData) => [
  { chave: "produtoId", titulo: "Id", renderizar: (l) => formatarId(l.produtoId, ID_PRODUTO) },
  { chave: "nome", titulo: "Nome" },
  { chave: "categoria", titulo: "Categoria" },
  { chave: "quantidadeAntes", titulo: "Qtd. Antes", alinhamento: "direita" },
  { chave: "quantidadeDepois", titulo: "Qtd. Depois", alinhamento: "direita" },
  { chave: "quantidade", titulo: rotuloQuantidade, alinhamento: "direita" },
  { chave: "data", titulo: rotuloData, renderizar: (l) => formatarData(l.data) },
];

export const ABAS_HISTORICO = [
  {
    id: "vendas",
    rotulo: "Vendas",
    cor: "var(--cor-aba-vendas)",
    caminho: "/historico",
    linhas: (dados) => dados.vendas,
    colunas: [
      { chave: "id", titulo: "Transação", renderizar: (l) => formatarId(l.id, ID_CURTO) },
      { chave: "cliente", titulo: "Cliente", renderizar: (l) => l.clienteNome ?? SEM_CLIENTE },
      { chave: "valor", titulo: "Valor", alinhamento: "direita", renderizar: (l) => formatarMoeda(l.valor) },
      { chave: "lucro", titulo: "Lucro", alinhamento: "direita", renderizar: (l) => formatarMoeda(l.lucro) },
      {
        chave: "quantidadeProdutos",
        titulo: "Qtd. Produtos",
        renderizar: (l) => formatarUnidades(l.quantidadeProdutos),
      },
      { chave: "data", titulo: "Dt. Venda", renderizar: (l) => formatarData(l.data) },
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
    linhas: (dados) => resumirVendasPorCliente(dados).map((l) => ({ ...l, id: l.clienteId })),
    colunas: [
      { chave: "clienteId", titulo: "Id Cliente", renderizar: (l) => formatarId(l.clienteId, ID_CURTO) },
      { chave: "nome", titulo: "Nome" },
      { chave: "quantidadeVendas", titulo: "Qtd. Vendas", alinhamento: "direita" },
      {
        chave: "valorTotal",
        titulo: "Valor Total",
        alinhamento: "direita",
        renderizar: (l) => formatarMoeda(l.valorTotal),
      },
      {
        chave: "lucroTotal",
        titulo: "Lucro Total",
        alinhamento: "direita",
        renderizar: (l) => formatarMoeda(l.lucroTotal),
      },
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
    linhas: (dados) => dados.cadastrosProdutos,
    colunas: [
      { chave: "produtoId", titulo: "Id", renderizar: (l) => formatarId(l.produtoId, ID_PRODUTO) },
      { chave: "nome", titulo: "Nome" },
      { chave: "categoria", titulo: "Categoria" },
      { chave: "quantidadeInicial", titulo: "Qtd. Inicial", alinhamento: "direita" },
      { chave: "valor", titulo: "Valor", alinhamento: "direita", renderizar: (l) => formatarMoeda(l.valor) },
      { chave: "lucro", titulo: "Lucro", alinhamento: "direita", renderizar: (l) => formatarMoeda(l.lucro) },
      { chave: "data", titulo: "Dt. Cadastro", renderizar: (l) => formatarData(l.data) },
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
    linhas: (dados) => dados.cadastrosClientes,
    colunas: [
      { chave: "clienteId", titulo: "Id", renderizar: (l) => formatarId(l.clienteId, ID_PRODUTO) },
      { chave: "nome", titulo: "Nome" },
      { chave: "telefone", titulo: "Telefone" },
      { chave: "data", titulo: "Dt. Cadastro", renderizar: (l) => formatarData(l.data) },
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
