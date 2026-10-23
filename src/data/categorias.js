/**
 * Categorias de produtos (mock até existir back-end).
 * `criterios` é a quantidade mínima de estoque para cada nível:
 * Bom, Médio, Ruim e Crítico, em ordem decrescente.
 */
export const categorias = [
  { id: 1, nome: "Buzinas", criterios: { bom: 8, medio: 5, ruim: 2, critico: 0 } },
  { id: 2, nome: "Chicotes", criterios: { bom: 10, medio: 6, ruim: 3, critico: 0 } },
  { id: 3, nome: "Soquetes", criterios: { bom: 15, medio: 10, ruim: 5, critico: 0 } },
  { id: 4, nome: "Lâmpadas", criterios: { bom: 15, medio: 8, ruim: 4, critico: 0 } },
  { id: 5, nome: "Acessórios", criterios: { bom: 8, medio: 5, ruim: 2, critico: 0 } },
];
