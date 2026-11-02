import { api } from "./http.js";

/*
 * Produtos pela API (somente leitura por enquanto; docs/contrato-api.md). A API chama de `descricao`
 * o que o site chama de `nome`. O estado e a faixa efetiva o site calcula (`comEstoqueCalculado`).
 */

function dosDados(produto) {
  return {
    id: produto.id,
    codigos: Array.isArray(produto.codigos)
      ? produto.codigos.filter((codigo) => typeof codigo === "string" && codigo.trim() !== "")
      : [],
    nome: produto.descricao ?? "",
    categoriaId: produto.categoriaId,
    imagem: produto.imagem ?? "",
    valorCompra: Number(produto.valorCompra ?? 0),
    precoEmpresa: Number(produto.precoEmpresa ?? 0),
    precoConsumidor: Number(produto.precoConsumidor ?? 0),
    quantidade: Number(produto.quantidade ?? 0),
    faixaPropria: produto.faixaPropria ?? null,
  };
}

export async function listarProdutos() {
  const { data: lista } = await api.get("/produtos");
  return Array.isArray(lista) ? lista.map(dosDados) : [];
}
