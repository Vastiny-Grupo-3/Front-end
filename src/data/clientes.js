/**
 * Clientes (mock até existir back-end). `tipo` define o preço da venda: "empresa" paga o preço de
 * empresa/auto elétrica; "pessoa-fisica" (e venda sem cliente) paga o preço do consumidor.
 */
export const clientes = [
  { id: 1, nome: "Eduardo Ribeiro", telefone: "(11) 90000-0001", descricao: "Mecânico parceiro; compra para a oficina.", tipo: "empresa" },
  { id: 2, nome: "Nicolas Mazza", telefone: "(11) 90000-0002", descricao: "", tipo: "pessoa-fisica" },
  { id: 3, nome: "Miguel Igor", telefone: "(11) 90000-0003", descricao: "Dono de um Fusca 1972.", tipo: "pessoa-fisica" },
  { id: 4, nome: "Ana Paula Souza", telefone: "(11) 98123-4567", descricao: "", tipo: "pessoa-fisica" },
  { id: 5, nome: "Oficina Dois Irmãos", telefone: "(11) 3456-7890", descricao: "Retira os pedidos no balcão às sextas.", tipo: "empresa" },
  { id: 6, nome: "Roberto Lima", telefone: "(11) 99876-5432", descricao: "", tipo: "pessoa-fisica" },
];
