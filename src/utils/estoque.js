import { arredondar } from "./formatadores.js";
import { calcularLucroUnitario } from "./carrinho.js";

/*
 * Funções puras dos dados da empresa (produtos, categorias, clientes e
 * registros do histórico). Recebem `dados` e devolvem uma cópia nova:
 *   { dados, erro?, erros?, registro? }
 * Quando há erro, `dados` volta sem alteração.
 *
 * O `estado` do produto (Crítico, Ruim, Médio, Bom) não é guardado: é calculado
 * pela quantidade e pela faixa efetiva (ver "Faixas de estoque", no fim do arquivo).
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
  estoqueMinimo: (nivel) => `Informe o estoque mínimo para ${nivel}.`,
  estoqueMinimoOrdem:
    "O mínimo de Bom deve ser maior ou igual ao de Médio, o de Médio ao de Ruim e o de Ruim ao de Crítico.",
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

/**
 * Valida e normaliza os campos do produto. Retorna { campos } e, quando algo não passa:
 *   erro  → algum campo obrigatório está vazio ou inválido;
 *   erros → a faixa própria é inválida (mensagens por nível: bom, medio, ruim, critico).
 * `faixaPropria` vazia (null) significa "usar a faixa da categoria".
 */
function montarProduto(entrada, exigirQuantidade) {
  const campos = {
    codigo: texto(entrada.codigo),
    nome: texto(entrada.nome),
    categoriaId: entrada.categoriaId,
    imagem: entrada.imagem ?? "",
    valorCompra: entrada.valorCompra,
    valorVenda: entrada.valorVenda,
    faixaPropria: null,
  };
  const completo =
    campos.codigo &&
    campos.nome &&
    campos.categoriaId != null &&
    numeroValido(campos.valorCompra) &&
    numeroValido(campos.valorVenda) &&
    (!exigirQuantidade || (Number.isInteger(entrada.quantidade) && entrada.quantidade >= 0));

  const resultado = { campos };
  if (!completo) resultado.erro = MENSAGENS_ESTOQUE.produtoIncompleto;
  if (entrada.faixaPropria) {
    const faixa = validarCriterios(entrada.faixaPropria);
    if (faixa.erros) resultado.erros = faixa.erros;
    else campos.faixaPropria = faixa.valores;
  }
  return resultado;
}

/** Lucro = valor de venda − valor de compra. */
export function calcularLucro(valorVenda, valorCompra) {
  return arredondar(valorVenda - valorCompra);
}

/** Cadastra produto e cria o registro em "Cadastro de Produtos". */
export function cadastrarProduto(dados, entrada, data) {
  const { campos, erro, erros } = montarProduto(entrada, true);
  if (erro || erros) return { dados, erro, erros };

  const produto = {
    id: proximoId(dados.produtos),
    ...campos,
    quantidade: entrada.quantidade,
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
  const { campos, erro, erros } = montarProduto(entrada, false);
  if (erro || erros) return { dados, erro, erros };
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

/** Cadastra cliente e cria a primeira alteração em "Alteração de Clientes". */
export function cadastrarCliente(dados, entrada, data) {
  const erros = validarCliente(entrada);
  if (Object.keys(erros).length > 0) return { dados, erros };

  const cliente = { id: proximoId(dados.clientes), ...camposCliente(entrada) };
  const registro = {
    id: proximoId(dados.cadastrosClientes),
    clienteId: cliente.id,
    nome: cliente.nome,
    telefone: cliente.telefone,
    descricao: cliente.descricao,
    dataCadastro: data,
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

export function editarCliente(dados, clienteId, entrada, data) {
  const erros = validarCliente(entrada);
  if (Object.keys(erros).length > 0) return { dados, erros };
  const campos = camposCliente(entrada);
  const anteriores = dados.cadastrosClientes.filter((item) => item.clienteId === clienteId);
  const ultimo = anteriores[anteriores.length - 1];
  const mudou =
    !ultimo ||
    ultimo.nome !== campos.nome ||
    ultimo.telefone !== campos.telefone ||
    (ultimo.descricao ?? "") !== campos.descricao;
  const dataCadastro = anteriores.reduce((menor, item) => {
    const atual = item.dataCadastro ?? item.data;
    return atual < menor ? atual : menor;
  }, ultimo?.dataCadastro ?? ultimo?.data ?? data);
  const registro = mudou
    ? { id: proximoId(dados.cadastrosClientes), clienteId, ...campos, dataCadastro, data }
    : null;
  return {
    dados: {
      ...dados,
      clientes: dados.clientes.map((cliente) =>
        cliente.id === clienteId ? { ...cliente, ...campos } : cliente,
      ),
      cadastrosClientes: registro ? [...dados.cadastrosClientes, registro] : dados.cadastrosClientes,
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

export function textoCriterios(criterios) {
  if (!criterios) return "—";
  return `Bom ${criterios.bom} · Médio ${criterios.medio} · Ruim ${criterios.ruim} · Crítico ${criterios.critico}`;
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

export const NIVEIS_ESTOQUE = [
  ["bom", "Bom"],
  ["medio", "Médio"],
  ["ruim", "Ruim"],
  ["critico", "Crítico"],
];

/** Campos da faixa de estoque, na ordem do formulário: [chave, rótulo]. */
export const CAMPOS_FAIXA = NIVEIS_ESTOQUE.map(([chave, nivel]) => [chave, `Estoque mínimo para ${nivel}`]);

/**
 * Valida os 4 limites (inteiros ≥ 0, em ordem decrescente). Aceita textos ou números.
 * Retorna { valores } ou { erros } com a mensagem de cada nível.
 */
export function validarCriterios(entrada) {
  const erros = {};
  const valores = {};
  for (const [chave, rotulo] of NIVEIS_ESTOQUE) {
    const informado = texto(entrada?.[chave]);
    if (!/^\d+$/.test(informado)) {
      erros[chave] = MENSAGENS_ESTOQUE.estoqueMinimo(rotulo);
      continue;
    }
    valores[chave] = Number(informado);
  }
  if (Object.keys(erros).length > 0) return { erros };
  const { bom, medio, ruim, critico } = valores;
  if (!(bom >= medio && medio >= ruim && ruim >= critico)) {
    return { erros: { bom: MENSAGENS_ESTOQUE.estoqueMinimoOrdem } };
  }
  return { valores };
}

function montarCategoria(dados, entrada, idIgnorado) {
  const erros = {};
  const erroNome = validarNomeCategoria(dados, entrada?.nome, idIgnorado);
  if (erroNome) erros.nome = erroNome;
  const criterios = validarCriterios(entrada);
  Object.assign(erros, criterios.erros ?? {});
  if (Object.keys(erros).length > 0) return { erros };
  return { nome: texto(entrada.nome), criterios: criterios.valores };
}

export function criarCategoria(dados, entrada) {
  const montado = montarCategoria(dados, entrada);
  if (montado.erros) return { dados, erros: montado.erros };
  const categoria = { id: proximoId(dados.categorias), nome: montado.nome, criterios: montado.criterios };
  return { dados: { ...dados, categorias: [...dados.categorias, categoria] }, registro: categoria };
}

export function editarCategoria(dados, categoriaId, entrada) {
  const montado = montarCategoria(dados, entrada, categoriaId);
  if (montado.erros) return { dados, erros: montado.erros };
  return {
    dados: {
      ...dados,
      categorias: dados.categorias.map((categoria) =>
        categoria.id === categoriaId
          ? { ...categoria, nome: montado.nome, criterios: montado.criterios }
          : categoria,
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

/* ---------- Faixas de estoque ---------- */

/*
 * Cada categoria tem uma faixa (`criterios`): o estoque mínimo para cada nível.
 * O produto herda a faixa da categoria ou tem a sua (`faixaPropria`). Um item de
 * giro alto precisa de mais estoque que um de giro baixo, por exemplo.
 *
 * Uma faixa { bom: 8, medio: 5, ruim: 2, critico: 0 } quer dizer: quantidade ≥ 8 é
 * Bom; de 5 a 7, Médio; de 2 a 4, Ruim; abaixo de 2, Crítico.
 */

/**
 * Faixa que vale para o produto: a própria, se tiver uma; senão a da categoria.
 * Retorna { faixa, origem: "propria" | "categoria" }, ou { faixa: null, origem: null }.
 */
export function faixaEfetiva(produto, categorias) {
  if (produto.faixaPropria) return { faixa: produto.faixaPropria, origem: "propria" };
  const categoria = categorias.find((item) => item.id === produto.categoriaId);
  if (categoria?.criterios) return { faixa: categoria.criterios, origem: "categoria" };
  return { faixa: null, origem: null };
}

/** Estado do estoque pela quantidade e pela faixa; null quando não há faixa. */
export function calcularEstado(quantidade, faixa) {
  if (!faixa) return null;
  if (quantidade >= faixa.bom) return "Bom";
  if (quantidade >= faixa.medio) return "Médio";
  if (quantidade >= faixa.ruim) return "Ruim";
  return "Crítico";
}

/** Acrescenta a cada produto a faixa efetiva (`faixa`, `faixaOrigem`) e o `estado` calculado. */
export function comEstoqueCalculado(produtos, categorias) {
  return produtos.map((produto) => {
    const { faixa, origem } = faixaEfetiva(produto, categorias);
    return { ...produto, faixa, faixaOrigem: origem, estado: calcularEstado(produto.quantidade, faixa) };
  });
}

/** "Bom ≥ 8 · Médio ≥ 5 · Ruim ≥ 2" (o Crítico é tudo o que fica abaixo do Ruim). */
export function textoFaixa(faixa) {
  if (!faixa) return "—";
  return `Bom ≥ ${faixa.bom} · Médio ≥ ${faixa.medio} · Ruim ≥ ${faixa.ruim}`;
}
