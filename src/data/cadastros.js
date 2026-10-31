/*
 * Registros de cadastro (mock até existir back-end): os dados como estavam
 * no momento em que o produto ou o cliente foi cadastrado.
 */

export const cadastrosProdutos = [
  { id: 1, produtoId: 1, nome: "Buzina Caracol 12V Grave/Aguda (par)", categoria: "Buzinas", quantidadeInicial: 10, valor: 89.9, lucro: 27.9, data: "2026-09-01" },
  { id: 2, produtoId: 2, nome: "Buzina Paquerinha Individual 12V", categoria: "Buzinas", quantidadeInicial: 8, valor: 29.9, lucro: 11.4, data: "2026-09-01" },
  { id: 3, produtoId: 3, nome: "Buzina Paq. Toyota", categoria: "Buzinas", quantidadeInicial: 4, valor: 54.9, lucro: 19.9, data: "2026-09-01" },
  { id: 4, produtoId: 4, nome: "Chicote Farol H4 com Relé", categoria: "Chicotes", quantidadeInicial: 12, valor: 45, lucro: 17, data: "2026-09-02" },
  { id: 5, produtoId: 5, nome: "Chicote Lanterna Traseira Gol G5", categoria: "Chicotes", quantidadeInicial: 6, valor: 38.5, lucro: 16.5, data: "2026-09-02" },
  { id: 6, produtoId: 6, nome: "Chicote Rádio ISO Universal", categoria: "Chicotes", quantidadeInicial: 6, valor: 17.9, lucro: 8.4, data: "2026-09-02" },
  { id: 7, produtoId: 7, nome: "Soquete Lâmpada H7", categoria: "Soquetes", quantidadeInicial: 14, valor: 12.5, lucro: 6.5, data: "2026-09-03" },
  { id: 8, produtoId: 8, nome: "Soquete Painel Fusca Longo", categoria: "Soquetes", quantidadeInicial: 12, valor: 6, lucro: 2, data: "2026-09-03" },
  { id: 9, produtoId: 9, nome: "Soquete Pingo T10 Universal", categoria: "Soquetes", quantidadeInicial: 26, valor: 5.9, lucro: 3.4, data: "2026-09-03" },
  { id: 10, produtoId: 10, nome: "Lâmpada H4 12V 60/55W", categoria: "Lâmpadas", quantidadeInicial: 24, valor: 19.9, lucro: 8.9, data: "2026-09-04" },
  { id: 11, produtoId: 11, nome: "Lâmpada Pingo LED T10 Branca (par)", categoria: "Lâmpadas", quantidadeInicial: 16, valor: 14.9, lucro: 7.9, data: "2026-09-04" },
  { id: 12, produtoId: 12, nome: "Relé Auxiliar 12V 40A 5 Terminais", categoria: "Acessórios", quantidadeInicial: 9, valor: 24.9, lucro: 10.9, data: "2026-09-05" },
  { id: 13, produtoId: 13, nome: "Fusível Lâmina Mini 10A (cartela)", categoria: "Acessórios", quantidadeInicial: 10, valor: 7.5, lucro: 4.3, data: "2026-09-05" },
  { id: 14, produtoId: 14, nome: "Interruptor Pulsador para Buzina", categoria: "Acessórios", quantidadeInicial: 10, valor: 15.9, lucro: 7.9, data: "2026-09-05" },
];

export const cadastrosClientes = [
  { id: 1, clienteId: 1, tipo: "empresa", nome: "Eduardo Ribeiro", telefone: "(11) 90000-0001", descricao: "", dataCadastro: "2026-09-10", data: "2026-09-10" },
  { id: 2, clienteId: 2, tipo: "pessoa-fisica", nome: "Nicolas Mazza", telefone: "(11) 90000-0002", descricao: "", dataCadastro: "2026-09-12", data: "2026-09-12" },
  { id: 3, clienteId: 3, tipo: "pessoa-fisica", nome: "Miguel Igor", telefone: "(11) 90000-0003", descricao: "Dono de um Fusca 1972.", dataCadastro: "2026-09-15", data: "2026-09-15" },
  { id: 4, clienteId: 4, tipo: "pessoa-fisica", nome: "Ana Paula Souza", telefone: "(11) 97000-1111", descricao: "", dataCadastro: "2026-09-20", data: "2026-09-20" },
  { id: 5, clienteId: 5, tipo: "empresa", nome: "Oficina Dois Irmãos", telefone: "(11) 3456-7890", descricao: "Retira os pedidos no balcão às sextas.", dataCadastro: "2026-09-21", data: "2026-09-21" },
  { id: 6, clienteId: 6, tipo: "pessoa-fisica", nome: "Roberto Lima", telefone: "(11) 99876-5432", descricao: "", dataCadastro: "2026-10-01", data: "2026-10-01" },
  { id: 7, clienteId: 4, tipo: "pessoa-fisica", nome: "Ana Paula Souza", telefone: "(11) 98123-4567", descricao: "", dataCadastro: "2026-09-20", data: "2026-10-05" },
  { id: 8, clienteId: 1, tipo: "empresa", nome: "Eduardo Ribeiro", telefone: "(11) 90000-0001", descricao: "Mecânico parceiro; compra para a oficina.", dataCadastro: "2026-09-10", data: "2026-10-02" },
];
