/**
 * Produtos (mock até existir back-end).
 *
 * O estado do estoque ("Crítico" | "Ruim" | "Médio" | "Bom") não é dado: é calculado
 * pela quantidade e pela faixa do produto (`comEstoqueCalculado`, em utils/estoque.js).
 * `faixaPropria: null` significa "usa a faixa da categoria"; um objeto
 * { bom, medio, ruim, critico } é a faixa só deste produto.
 * `imagem` vazia: o card mostra o espaço reservado até existirem as fotos.
 * Preços: `valorCompra` é o que a empresa pagou; `precoEmpresa` é a venda para empresa/auto elétrica e
 * `precoConsumidor` a venda para pessoa física (e venda sem cliente).
 * `codigos`: de 1 a 4 códigos do produto; o primeiro é o principal. Nenhum código se repete.
 */
export const produtos = [
  { id: 1, codigos: ["BZ-001", "CARACOL-12V"], nome: "Buzina Caracol 12V Grave/Aguda (par)", categoriaId: 1, imagem: "", valorCompra: 62, precoEmpresa: 78.74, precoConsumidor: 89.9, quantidade: 14, faixaPropria: null },
  // Giro baixo: precisa de menos estoque que o resto das buzinas.
  { id: 2, codigos: ["BZ-002"], nome: "Buzina Paquerinha Individual 12V", categoriaId: 1, imagem: "", valorCompra: 18.5, precoEmpresa: 25.34, precoConsumidor: 29.9, quantidade: 4, faixaPropria: { bom: 4, medio: 3, ruim: 1, critico: 0 } },
  { id: 3, codigos: ["BZ-003"], nome: "Buzina Paq. Toyota", categoriaId: 1, imagem: "", valorCompra: 35, precoEmpresa: 46.94, precoConsumidor: 54.9, quantidade: 0, faixaPropria: null },
  { id: 4, codigos: ["CH-001"], nome: "Chicote Farol H4 com Relé", categoriaId: 2, imagem: "", valorCompra: 28, precoEmpresa: 38.2, precoConsumidor: 45, quantidade: 9, faixaPropria: null },
  { id: 5, codigos: ["CH-002"], nome: "Chicote Lanterna Traseira Gol G5", categoriaId: 2, imagem: "", valorCompra: 22, precoEmpresa: 31.9, precoConsumidor: 38.5, quantidade: 12, faixaPropria: null },
  { id: 6, codigos: ["CH-003"], nome: "Chicote Rádio ISO Universal", categoriaId: 2, imagem: "", valorCompra: 9.5, precoEmpresa: 14.54, precoConsumidor: 17.9, quantidade: 2, faixaPropria: null },
  // Giro alto: precisa de mais estoque que o resto dos soquetes.
  { id: 7, codigos: ["SQ-001", "H7-UNIV"], nome: "Soquete Lâmpada H7", categoriaId: 3, imagem: "", valorCompra: 6, precoEmpresa: 9.9, precoConsumidor: 12.5, quantidade: 25, faixaPropria: { bom: 30, medio: 20, ruim: 10, critico: 0 } },
  { id: 8, codigos: ["SQ-002"], nome: "Soquete Painel Fusca Longo", categoriaId: 3, imagem: "", valorCompra: 4, precoEmpresa: 5.2, precoConsumidor: 6, quantidade: 7, faixaPropria: null },
  { id: 9, codigos: ["SQ-003"], nome: "Soquete Pingo T10 Universal", categoriaId: 3, imagem: "", valorCompra: 2.5, precoEmpresa: 4.54, precoConsumidor: 5.9, quantidade: 40, faixaPropria: null },
  { id: 10, codigos: ["LP-001"], nome: "Lâmpada H4 12V 60/55W", categoriaId: 4, imagem: "", valorCompra: 11, precoEmpresa: 16.34, precoConsumidor: 19.9, quantidade: 18, faixaPropria: null },
  { id: 11, codigos: ["LP-002"], nome: "Lâmpada Pingo LED T10 Branca (par)", categoriaId: 4, imagem: "", valorCompra: 7, precoEmpresa: 11.74, precoConsumidor: 14.9, quantidade: 30, faixaPropria: null },
  { id: 12, codigos: ["AC-001"], nome: "Relé Auxiliar 12V 40A 5 Terminais", categoriaId: 5, imagem: "", valorCompra: 14, precoEmpresa: 20.54, precoConsumidor: 24.9, quantidade: 11, faixaPropria: null },
  { id: 13, codigos: ["AC-002"], nome: "Fusível Lâmina Mini 10A (cartela)", categoriaId: 5, imagem: "", valorCompra: 3.2, precoEmpresa: 5.78, precoConsumidor: 7.5, quantidade: 5, faixaPropria: null },
  { id: 14, codigos: ["AC-003"], nome: "Interruptor Pulsador para Buzina", categoriaId: 5, imagem: "", valorCompra: 8, precoEmpresa: 12.74, precoConsumidor: 15.9, quantidade: 9, faixaPropria: null },
];
