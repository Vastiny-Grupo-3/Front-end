import { categorias } from "./categorias.js";
import { clientes } from "./clientes.js";
import { produtos } from "./produtos.js";
import { criarItensVenda, criarItemCarrinho, calcularItem, montarVenda } from "../utils/carrinho.js";

/*
 * Vendas (mock até existir back-end). Cada item guarda o preço e o lucro
 * do momento da venda. Os totais são calculados com as mesmas funções do
 * carrinho para ficarem sempre coerentes.
 */

// [produtoId, quantidade, desconto em R$]
function venda(id, data, clienteId, linhas) {
  const cliente = clientes.find((atual) => atual.id === clienteId) ?? null;
  const itensDetalhados = linhas.map(([produtoId, quantidade, desconto = 0]) => {
    const produto = produtos.find((atual) => atual.id === produtoId);
    const item = criarItemCarrinho(produto, cliente, quantidade, desconto);
    return { ...item, produto, ...calcularItem(item) };
  });
  return montarVenda({ id, numero: id, data, cliente, itens: criarItensVenda(itensDetalhados, categorias) });
}

export const vendas = [
  venda(1, "2026-09-22", null, [[7, 2]]),
  venda(2, "2026-09-24", 1, [[4, 1], [12, 2]]),
  venda(3, "2026-09-27", 3, [[8, 4], [9, 6]]),
  venda(4, "2026-09-30", null, [[10, 2]]),
  venda(5, "2026-10-02", 2, [[1, 1, 4.9]]),
  venda(6, "2026-10-05", 5, [[5, 2], [6, 3], [13, 5, 2.5]]),
  venda(7, "2026-10-08", 1, [[11, 4], [9, 10, 4]]),
  venda(8, "2026-10-11", null, [[2, 1]]),
  venda(9, "2026-10-14", 4, [[14, 1], [12, 1]]),
  venda(10, "2026-10-16", 5, [[7, 5], [4, 2, 10]]),
  venda(11, "2026-10-17", 6, [[10, 1], [11, 2]]),
];
