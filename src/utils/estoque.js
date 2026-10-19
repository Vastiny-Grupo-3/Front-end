import { arredondar } from "./formatadores.js";
import { calcularLucroUnitario } from "./carrinho.js";

/*
 * Funções puras dos dados da empresa (produtos, categorias, clientes e
 * registros do histórico). Recebem `dados` e devolvem uma cópia nova:
 *   { dados, erro?, erros?, registro? }
 * Quando há erro, `dados` volta sem alteração.
 *
 * O campo `estado` do produto vem pronto do banco: estas funções não o calculam.
 */

export const MENSAGENS_ESTOQUE = {
  produtoIncompleto: "Preencha código, nome, categoria, valor de compra, valor de venda e quantidade.",
  quantidadeMaiorQueZero: "Informe uma quantidade maior que zero.",
  quantidadeMaiorQueEstoque: "A quantidade não pode ser maior que o estoque disponível.",
  justificativa: "Informe uma justificativa.",
  nomeCliente: "Informe o nome do cliente.",
  telefoneCliente: "Informe o telefone do cliente.",
  nomeCategoria: "Informe o nome da categoria.",
  categoriaRepetida: "Já existe uma categoria com esse nome.",
  categoriaComProdutos: (quantidade) =>
    `Esta categoria tem ${quantidade} produtos associados. Mude a categoria deles antes de excluir.`,
};

/** Próximo id numérico de uma lista. */
export function proximoId(lista) {
  return lista.reduce((maior, item) => Math.max(maior, item.id), 0) + 1;
}

export function nomeCategoria(dados, categoriaId) {
  return dados.categorias.find((categoria) => categoria.id === categoriaId)?.nome ?? "";
}

function texto(valor) {
  return String(valor ?? "").trim();
}

function numeroValido(valor) {
  return typeof valor === "number" && Number.isFinite(valor) && valor >= 0;
}

/* ---------- Produtos ---------- */

function camposProduto(entrada, exigirQuantidade) {
  const campos = {
    codigo: texto(entrada.codigo),
    nome: texto(entrada.nome),
    categoriaId: entrada.categoriaId,
    imagem: entrada.imagem ?? "",
    valorCompra: entrada.valorCompra,
    valorVenda: entrada.valorVenda,
  };
  const completo =
    campos.codigo &&
    campos.nome &&
    campos.categoriaId != null &&
    numeroValido(campos.valorCompra) &&
    numeroValido(campos.valorVenda) &&
    (!exigirQuantidade || (Number.isInteger(entrada.quantidade) && entrada.quantidade >= 0));
  return completo ? campos : null;
}

/** Lucro = valor de venda − valor de compra. */
export function calcularLucro(valorVenda, valorCompra) {
  return arredondar(valorVenda - valorCompra);
}

/** Cadastra produto e cria o registro em "Cadastro de Produtos". */
export function cadastrarProduto(dados, entrada, data) {
  const campos = camposProduto(entrada, true);
  if (!campos) return { dados, erro: MENSAGENS_ESTOQUE.produtoIncompleto };

  const produto = {
    id: proximoId(dados.produtos),
    ...campos,
    quantidade: entrada.quantidade,
    estoqueMinimo: entrada.estoqueMinimo ?? null,
    estado: entrada.estado ?? null,
  };
  const registro = {
    id: proximoId(dados.cadastrosProdutos),
    produtoId: produto.id,
    nome: produto.nome,
    categoria: nomeCategoria(dados, produto.categoriaId),
    quantidadeInicial: produto.quantidade,
    valor: produto.valorVenda,
    lucro: calcularLucroUnitario(produto),
    data,
  };
  return {
    dados: {
      ...dados,
      produtos: [...dados.produtos, produto],
      cadastrosProdutos: [...dados.cadastrosProdutos, registro],
    },
    registro,
  };
}

/** Edita os dados do produto (a quantidade muda só por Entrada, Saída ou venda). */
export function editarProduto(dados, produtoId, entrada) {
  const campos = camposProduto(entrada, false);
  if (!campos) return { dados, erro: MENSAGENS_ESTOQUE.produtoIncompleto };
  return {
    dados: {
      ...dados,
      produtos: dados.produtos.map((produto) =>
        produto.id === produtoId ? { ...produto, ...campos } : produto,
      ),
    },
  };
}

export function excluirProduto(dados, produtoId) {
  return { dados: { ...dados, produtos: dados.produtos.filter((produto) => produto.id !== produtoId) } };
}

/* ---------- Movimentações ---------- */

function movimentar(dados, produtoId, quantidade, sinal, extras, lista) {
  const produto = dados.produtos.find((atual) => atual.id === produtoId);
  const registro = {
    id: proximoId(dados[lista]),
    produtoId,
    nome: produto.nome,
    categoria: nomeCategoria(dados, produto.categoriaId),
    quantidadeAntes: produto.quantidade,
    quantidadeDepois: produto.quantidade + sinal * quantidade,
    quantidade,
    ...extras,
  };
  return {
    dados: {
      ...dados,
      produtos: dados.produtos.map((atual) =>
        atual.id === produtoId ? { ...atual, quantidade: registro.quantidadeDepois } : atual,
      ),
      [lista]: [...dados[lista], registro],
    },
    registro,
  };
}

/** Entrada de estoque (tela Entrada → "Adicionar Quantidade"). */
export function registrarEntrada(dados, produtoId, quantidade, data) {
  if (!Number.isInteger(quantidade) || quantidade <= 0) {
    return { dados, erro: MENSAGENS_ESTOQUE.quantidadeMaiorQueZero };
  }
  return movimentar(dados, produtoId, quantidade, 1, { data }, "entradas");
}

/**
 * Saída de estoque (tela Saída → "Diminuir Quantidade"), com justificativa obrigatória.
 * Retorna `erros` por campo: { quantidade?, justificativa? }.
 */
export function registrarSaida(dados, produtoId, quantidade, justificativa, data) {
  const produto = dados.produtos.find((atual) => atual.id === produtoId);
  const erros = {};
  if (!Number.isInteger(quantidade) || quantidade <= 0) {
    erros.quantidade = MENSAGENS_ESTOQUE.quantidadeMaiorQueZero;
  } else if (quantidade > produto.quantidade) {
    erros.quantidade = MENSAGENS_ESTOQUE.quantidadeMaiorQueEstoque;
  }
  if (!texto(justificativa)) erros.justificativa = MENSAGENS_ESTOQUE.justificativa;
  if (Object.keys(erros).length > 0) return { dados, erros };

  return movimentar(
    dados,
    produtoId,
    quantidade,
    -1,
    { data, justificativa: texto(justificativa) },
    "saidas",
  );
}

/** Registra a venda e baixa o estoque dos itens vendidos. */
export function registrarVenda(dados, venda) {
  const semEstoque = venda.itens.some((item) => {
    const produto = dados.produtos.find((atual) => atual.id === item.produtoId);
    return !produto || item.quantidade > produto.quantidade;
  });
  if (semEstoque) return { dados, erro: MENSAGENS_ESTOQUE.quantidadeMaiorQueEstoque };

  return {
    dados: {
      ...dados,
      produtos: dados.produtos.map((produto) => {
        const vendido = venda.itens.find((item) => item.produtoId === produto.id);
        return vendido ? { ...produto, quantidade: produto.quantidade - vendido.quantidade } : produto;
      }),
      vendas: [...dados.vendas, venda],
    },
    registro: venda,
  };
}

/* ---------- Clientes ---------- */

function validarCliente(entrada) {
  const erros = {};
  if (!texto(entrada.nome)) erros.nome = MENSAGENS_ESTOQUE.nomeCliente;
  if (!texto(entrada.telefone)) erros.telefone = MENSAGENS_ESTOQUE.telefoneCliente;
  return erros;
}

function camposCliente(entrada) {
  return {
    nome: texto(entrada.nome),
    telefone: texto(entrada.telefone),
    descricao: texto(entrada.descricao),
  };
}

/** Cadastra cliente e cria o registro em "Cadastro de Clientes". */
export function cadastrarCliente(dados, entrada, data) {
  const erros = validarCliente(entrada);
  if (Object.keys(erros).length > 0) return { dados, erros };

  const cliente = { id: proximoId(dados.clientes), ...camposCliente(entrada) };
  const registro = {
    id: proximoId(dados.cadastrosClientes),
    clienteId: cliente.id,
    nome: cliente.nome,
    telefone: cliente.telefone,
    data,
  };
  return {
    dados: {
      ...dados,
      clientes: [...dados.clientes, cliente],
      cadastrosClientes: [...dados.cadastrosClientes, registro],
    },
    registro,
  };
}

export function editarCliente(dados, clienteId, entrada) {
  const erros = validarCliente(entrada);
  if (Object.keys(erros).length > 0) return { dados, erros };
  return {
    dados: {
      ...dados,
      clientes: dados.clientes.map((cliente) =>
        cliente.id === clienteId ? { ...cliente, ...camposCliente(entrada) } : cliente,
      ),
    },
  };
}

/** Exclui o cliente; as vendas já registradas continuam com o nome dele. */
export function excluirCliente(dados, clienteId) {
  return { dados: { ...dados, clientes: dados.clientes.filter((cliente) => cliente.id !== clienteId) } };
}

/** Quantidade de compras do cliente (coluna "Qtd. Compras"). */
export function contarComprasDoCliente(dados, clienteId) {
  return dados.vendas.filter((venda) => venda.clienteId === clienteId).length;
}

/**
 * Histórico de Clientes: totais por cliente que já comprou.
 * [{ clienteId, nome, quantidadeVendas, valorTotal, lucroTotal, vendas }]
 */
export function resumirVendasPorCliente(dados) {
  const porCliente = new Map();
  dados.vendas
    .filter((venda) => venda.clienteId != null)
    .forEach((venda) => {
      const atual = porCliente.get(venda.clienteId) ?? {
        clienteId: venda.clienteId,
        nome: venda.clienteNome,
        quantidadeVendas: 0,
        valorTotal: 0,
        lucroTotal: 0,
        vendas: [],
      };
      porCliente.set(venda.clienteId, {
        ...atual,
        quantidadeVendas: atual.quantidadeVendas + 1,
        valorTotal: arredondar(atual.valorTotal + venda.valor),
        lucroTotal: arredondar(atual.lucroTotal + venda.lucro),
        vendas: [...atual.vendas, venda],
      });
    });
  return [...porCliente.values()].sort((a, b) => a.clienteId - b.clienteId);
}

/* ---------- Categorias ---------- */

export function contarProdutosDaCategoria(dados, categoriaId) {
  return dados.produtos.filter((produto) => produto.categoriaId === categoriaId).length;
}

function validarNomeCategoria(dados, nome, idIgnorado) {
  const limpo = texto(nome);
  if (!limpo) return MENSAGENS_ESTOQUE.nomeCategoria;
  const repetido = dados.categorias.some(
    (categoria) =>
      categoria.id !== idIgnorado &&
      categoria.nome.localeCompare(limpo, "pt-BR", { sensitivity: "base" }) === 0,
  );
  return repetido ? MENSAGENS_ESTOQUE.categoriaRepetida : null;
}

export function criarCategoria(dados, nome) {
  const erro = validarNomeCategoria(dados, nome);
  if (erro) return { dados, erro };
  const categoria = { id: proximoId(dados.categorias), nome: texto(nome) };
  return { dados: { ...dados, categorias: [...dados.categorias, categoria] }, registro: categoria };
}

export function editarCategoria(dados, categoriaId, nome) {
  const erro = validarNomeCategoria(dados, nome, categoriaId);
  if (erro) return { dados, erro };
  return {
    dados: {
      ...dados,
      categorias: dados.categorias.map((categoria) =>
        categoria.id === categoriaId ? { ...categoria, nome: texto(nome) } : categoria,
      ),
    },
  };
}

/** Exclui a categoria; bloqueada quando há produtos associados. */
export function excluirCategoria(dados, categoriaId) {
  const quantidade = contarProdutosDaCategoria(dados, categoriaId);
  if (quantidade > 0) return { dados, erro: MENSAGENS_ESTOQUE.categoriaComProdutos(quantidade) };
  return {
    dados: { ...dados, categorias: dados.categorias.filter((categoria) => categoria.id !== categoriaId) },
  };
}
