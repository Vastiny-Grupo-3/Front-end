import { categorias } from "./categorias.js";
import { produtos } from "./produtos.js";
import { clientes } from "./clientes.js";
import { vendas } from "./vendas.js";
import { entradas, saidas } from "./movimentacoes.js";
import { cadastrosProdutos, cadastrosClientes } from "./cadastros.js";

/** Dados iniciais da empresa (compartilhados por todas as contas). */
export const dadosIniciais = {
  categorias,
  produtos,
  clientes,
  vendas,
  entradas,
  saidas,
  cadastrosProdutos,
  cadastrosClientes,
};
