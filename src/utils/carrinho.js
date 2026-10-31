import { arredondar, formatarId } from "./formatadores.js";

/*
 * Funções puras do carrinho. Nenhuma altera os objetos recebidos: todas
 * devolvem cópias novas. Valores em reais, arredondados para centavos.
 *
 * carrinho: { id, nome, clienteId, itens: [{ produtoId, quantidade, desconto, tipoPreco, precoUnitario, custoUnitario }] }
 * O preço, o custo e o tipo de preço do item são gravados quando ele entra no carrinho (preço da época):
 * mudar o preço do produto depois não muda o item, e trocar o cliente do carrinho também não.
 * `desconto` é sempre em reais; o percentual é derivado do valor da linha.
 */

export const MENSAGENS_CARRINHO = {
  quantidadeMaiorQueEstoque: "A quantidade não pode ser maior que o estoque disponível.",
  descontoMaiorQueValor: "O desconto não pode ser maior que o valor do produto.",
  erroFinalizar: "Não conseguimos finalizar a compra. Verifique os itens e tente novamente.",
};

/** Lucro por unidade ao preço do consumidor (usado no registro de cadastro do produto). */
export function calcularLucroUnitario(produto) {
  return arredondar(produto.precoConsumidor - produto.valorCompra);
}

/**
 * Preço de venda pelo tipo do cliente: cliente "empresa" paga o preço de empresa/auto elétrica;
 * pessoa física e venda sem cliente pagam o preço do consumidor.
 */
export function precoParaCliente(produto, cliente) {
  const empresa = cliente?.tipo === "empresa";
  return {
    tipoPreco: empresa ? "empresa" : "pessoa-fisica",
    precoUnitario: empresa ? produto.precoEmpresa : produto.precoConsumidor,
  };
}

/** Item novo do carrinho, com o preço, o custo e o tipo de preço da hora em que entra. */
export function criarItemCarrinho(produto, cliente, quantidade = 1, desconto = 0) {
  return {
    produtoId: produto.id,
    quantidade,
    desconto,
    ...precoParaCliente(produto, cliente),
    custoUnitario: produto.valorCompra,
  };
}

/** Cria um carrinho vazio com o número informado ("Carrinho 001", "Carrinho 002"…). */
export function criarCarrinho(id) {
  return { id, nome: `Carrinho ${formatarId(id)}`, clienteId: null, itens: [] };
}

export function encontrarItem(carrinho, produtoId) {
  return carrinho.itens.find((item) => item.produtoId === produtoId);
}

/**
 * Adiciona 1 unidade do produto, ao preço do tipo do cliente do carrinho (`cliente` pode ser null).
 * Sem estoque ou já no carrinho: nada muda.
 */
export function adicionarItem(carrinho, produto, cliente = null) {
  if (produto.quantidade <= 0 || encontrarItem(carrinho, produto.id)) return carrinho;
  return {
    ...carrinho,
    itens: [...carrinho.itens, criarItemCarrinho(produto, cliente)],
  };
}

export function removerItem(carrinho, produtoId) {
  return { ...carrinho, itens: carrinho.itens.filter((item) => item.produtoId !== produtoId) };
}

/**
 * Altera a quantidade (mínimo 1, máximo o estoque do produto).
 * Se o desconto ficar maior que o novo valor da linha, ele é reduzido ao valor da linha.
 * Retorna { carrinho, erro }.
 */
export function alterarQuantidade(carrinho, produto, quantidade) {
  if (quantidade > produto.quantidade) {
    return { carrinho, erro: MENSAGENS_CARRINHO.quantidadeMaiorQueEstoque };
  }
  const atual = encontrarItem(carrinho, produto.id);
  if (!atual) return { carrinho, erro: null };
  const novaQuantidade = Math.max(1, Math.floor(quantidade));
  const valorLinha = arredondar(novaQuantidade * atual.precoUnitario);
  return {
    carrinho: {
      ...carrinho,
      itens: carrinho.itens.map((item) =>
        item.produtoId === produto.id
          ? { ...item, quantidade: novaQuantidade, desconto: Math.min(item.desconto, valorLinha) }
          : item,
      ),
    },
    erro: null,
  };
}

/** Altera o desconto em reais (entre 0 e o valor da linha). Retorna { carrinho, erro }. */
export function alterarDesconto(carrinho, produto, desconto) {
  const item = encontrarItem(carrinho, produto.id);
  if (!item) return { carrinho, erro: null };
  const valorLinha = arredondar(item.quantidade * item.precoUnitario);
  if (desconto < 0 || desconto > valorLinha) {
    return { carrinho, erro: MENSAGENS_CARRINHO.descontoMaiorQueValor };
  }
  return {
    carrinho: {
      ...carrinho,
      itens: carrinho.itens.map((atual) =>
        atual.produtoId === produto.id ? { ...atual, desconto: arredondar(desconto) } : atual,
      ),
    },
    erro: null,
  };
}

export function definirCliente(carrinho, clienteId) {
  return { ...carrinho, clienteId: clienteId ?? null };
}

/** Valores de uma linha, pelo preço gravado no item: valor da linha, desconto (R$ e %) e total. */
export function calcularItem(item) {
  const valorLinha = arredondar(item.quantidade * item.precoUnitario);
  return {
    precoUnitario: item.precoUnitario,
    valorLinha,
    desconto: item.desconto,
    percentualDesconto: valorLinha > 0 ? (item.desconto / valorLinha) * 100 : 0,
    total: arredondar(valorLinha - item.desconto),
  };
}

/**
 * Totais de um conjunto de linhas já calculadas ({ valorLinha, desconto, quantidade }).
 * Subtotal = soma de quantidade × preço; Total Final = Subtotal − Descontos.
 */
export function calcularTotais(linhas) {
  const subtotal = arredondar(linhas.reduce((soma, linha) => soma + linha.valorLinha, 0));
  const descontos = arredondar(linhas.reduce((soma, linha) => soma + linha.desconto, 0));
  return {
    subtotal,
    descontos,
    percentualDescontos: subtotal > 0 ? (descontos / subtotal) * 100 : 0,
    totalFinal: arredondar(subtotal - descontos),
    quantidadeProdutos: linhas.reduce((soma, linha) => soma + linha.quantidade, 0),
    quantidadeItens: linhas.length,
  };
}

/** Itens do carrinho com os dados do produto; ignora produtos que não existem mais. */
export function detalharItens(carrinho, produtos) {
  return carrinho.itens.flatMap((item) => {
    const produto = produtos.find((atual) => atual.id === item.produtoId);
    return produto ? [{ ...item, produto, ...calcularItem(item) }] : [];
  });
}

/** Resumo financeiro do carrinho (Subtotal, Descontos, Total Final e quantidades). */
export function calcularResumo(carrinho, produtos) {
  return calcularTotais(detalharItens(carrinho, produtos));
}

/** Confere se o carrinho pode ser finalizado. Retorna a mensagem de erro ou null. */
export function validarFinalizacao(carrinho, produtos) {
  const itens = detalharItens(carrinho, produtos);
  if (itens.length === 0 || itens.length !== carrinho.itens.length) {
    return MENSAGENS_CARRINHO.erroFinalizar;
  }
  const invalido = itens.some(
    (item) =>
      item.quantidade < 1 ||
      item.quantidade > item.produto.quantidade ||
      item.desconto < 0 ||
      item.desconto > item.valorLinha,
  );
  return invalido ? MENSAGENS_CARRINHO.erroFinalizar : null;
}

/**
 * Linhas da venda com preço, custo e lucro registrados no momento em que o item entrou no carrinho.
 * Lucro do item = quantidade × lucro por unidade − desconto do item.
 */
export function criarItensVenda(itensDetalhados, categorias) {
  return itensDetalhados.map((item) => {
    const lucroUnitario = arredondar(item.precoUnitario - item.custoUnitario);
    return {
      produtoId: item.produto.id,
      codigo: item.produto.codigos[0],
      nome: item.produto.nome,
      imagem: item.produto.imagem ?? "",
      categoriaId: item.produto.categoriaId,
      categoria: categorias.find((categoria) => categoria.id === item.produto.categoriaId)?.nome ?? "",
      quantidade: item.quantidade,
      tipoPreco: item.tipoPreco,
      precoUnitario: item.precoUnitario,
      custoUnitario: item.custoUnitario,
      lucroUnitario,
      desconto: item.desconto,
      valorLinha: arredondar(item.quantidade * item.precoUnitario),
      total: arredondar(item.quantidade * item.precoUnitario - item.desconto),
      lucro: arredondar(item.quantidade * lucroUnitario - item.desconto),
    };
  });
}

/**
 * Monta o registro de venda a partir das linhas já criadas. O `numero` (sequencial, "Transação")
 * só existe depois de finalizar: `registrarVenda` o atribui; as vendas de exemplo já o trazem.
 */
export function montarVenda({ id, numero = null, data, cliente, itens }) {
  const totais = calcularTotais(itens);
  return {
    id,
    numero,
    data,
    clienteId: cliente?.id ?? null,
    clienteNome: cliente?.nome ?? null,
    itens,
    subtotal: totais.subtotal,
    descontos: totais.descontos,
    valor: totais.totalFinal,
    lucro: arredondar(itens.reduce((soma, item) => soma + item.lucro, 0)),
    quantidadeProdutos: totais.quantidadeProdutos,
  };
}

/** Cria a venda do carrinho (sem alterar estoque; isso fica em `registrarVenda`). */
export function criarVenda(carrinho, { produtos, clientes, categorias, id, data }) {
  const itens = criarItensVenda(detalharItens(carrinho, produtos), categorias);
  const cliente = clientes.find((atual) => atual.id === carrinho.clienteId) ?? null;
  return montarVenda({ id, data, cliente, itens });
}
