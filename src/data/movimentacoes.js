/*
 * Movimentações de estoque (mock até existir back-end).
 * Entradas vêm da tela Entrada; saídas, da tela Saída (motivos que não são venda).
 * Cada registro guarda nome e categoria do produto no momento da movimentação.
 */

export const entradas = [
  { id: 1, produtoId: 9, nome: "Soquete Pingo T10 Universal", categoria: "Soquetes", quantidadeAntes: 26, quantidadeDepois: 56, quantidade: 30, data: "2026-09-25" },
  { id: 2, produtoId: 7, nome: "Soquete Lâmpada H7", categoria: "Soquetes", quantidadeAntes: 12, quantidadeDepois: 32, quantidade: 20, data: "2026-10-01" },
  { id: 3, produtoId: 1, nome: "Buzina Caracol 12V Grave/Aguda (par)", categoria: "Buzinas", quantidadeAntes: 8, quantidadeDepois: 15, quantidade: 7, data: "2026-10-03" },
  { id: 4, produtoId: 11, nome: "Lâmpada Pingo LED T10 Branca (par)", categoria: "Lâmpadas", quantidadeAntes: 16, quantidadeDepois: 36, quantidade: 20, data: "2026-10-06" },
  { id: 5, produtoId: 5, nome: "Chicote Lanterna Traseira Gol G5", categoria: "Chicotes", quantidadeAntes: 6, quantidadeDepois: 14, quantidade: 8, data: "2026-10-09" },
  { id: 6, produtoId: 12, nome: "Relé Auxiliar 12V 40A 5 Terminais", categoria: "Acessórios", quantidadeAntes: 9, quantidadeDepois: 14, quantidade: 5, data: "2026-10-12" },
];

export const saidas = [
  { id: 1, produtoId: 3, nome: "Buzina Paq. Toyota", categoria: "Buzinas", quantidadeAntes: 2, quantidadeDepois: 0, quantidade: 2, data: "2026-09-29", justificativa: "Produto com defeito de fábrica; devolvido ao fornecedor." },
  { id: 2, produtoId: 6, nome: "Chicote Rádio ISO Universal", categoria: "Chicotes", quantidadeAntes: 6, quantidadeDepois: 5, quantidade: 1, data: "2026-10-04", justificativa: "Usado na instalação do carro da oficina." },
  { id: 3, produtoId: 10, nome: "Lâmpada H4 12V 60/55W", categoria: "Lâmpadas", quantidadeAntes: 22, quantidadeDepois: 21, quantidade: 1, data: "2026-10-10", justificativa: "Lâmpada quebrada no transporte." },
  { id: 4, produtoId: 8, nome: "Soquete Painel Fusca Longo", categoria: "Soquetes", quantidadeAntes: 12, quantidadeDepois: 11, quantidade: 1, data: "2026-10-15", justificativa: "Ajuste de inventário." },
];
