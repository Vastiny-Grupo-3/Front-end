/**
 * Produtos (mock até existir back-end).
 * `estado` vem pronto do banco ("Crítico" | "Ruim" | "Médio" | "Bom"); o front só exibe.
 * `imagem` vazia: o card mostra o espaço reservado até existirem as fotos.
 */
export const produtos = [
  { id: 1, codigo: "BZ-001", nome: "Buzina Caracol 12V Grave/Aguda (par)", categoriaId: 1, imagem: "", valorCompra: 62, valorVenda: 89.9, quantidade: 14, estoqueMinimo: 5, estado: "Bom" },
  { id: 2, codigo: "BZ-002", nome: "Buzina Paquerinha Individual 12V", categoriaId: 1, imagem: "", valorCompra: 18.5, valorVenda: 29.9, quantidade: 4, estoqueMinimo: 6, estado: "Ruim" },
  { id: 3, codigo: "BZ-003", nome: "Buzina Paq. Toyota", categoriaId: 1, imagem: "", valorCompra: 35, valorVenda: 54.9, quantidade: 0, estoqueMinimo: 4, estado: "Crítico" },
  { id: 4, codigo: "CH-001", nome: "Chicote Farol H4 com Relé", categoriaId: 2, imagem: "", valorCompra: 28, valorVenda: 45, quantidade: 9, estoqueMinimo: 5, estado: "Médio" },
  { id: 5, codigo: "CH-002", nome: "Chicote Lanterna Traseira Gol G5", categoriaId: 2, imagem: "", valorCompra: 22, valorVenda: 38.5, quantidade: 12, estoqueMinimo: 4, estado: "Bom" },
  { id: 6, codigo: "CH-003", nome: "Chicote Rádio ISO Universal", categoriaId: 2, imagem: "", valorCompra: 9.5, valorVenda: 17.9, quantidade: 2, estoqueMinimo: 6, estado: "Crítico" },
  { id: 7, codigo: "SQ-001", nome: "Soquete Lâmpada H7", categoriaId: 3, imagem: "", valorCompra: 6, valorVenda: 12.5, quantidade: 25, estoqueMinimo: 10, estado: "Bom" },
  { id: 8, codigo: "SQ-002", nome: "Soquete Painel Fusca Longo", categoriaId: 3, imagem: "", valorCompra: 4, valorVenda: 6, quantidade: 7, estoqueMinimo: 8, estado: "Ruim" },
  { id: 9, codigo: "SQ-003", nome: "Soquete Pingo T10 Universal", categoriaId: 3, imagem: "", valorCompra: 2.5, valorVenda: 5.9, quantidade: 40, estoqueMinimo: 15, estado: "Bom" },
  { id: 10, codigo: "LP-001", nome: "Lâmpada H4 12V 60/55W", categoriaId: 4, imagem: "", valorCompra: 11, valorVenda: 19.9, quantidade: 18, estoqueMinimo: 10, estado: "Médio" },
  { id: 11, codigo: "LP-002", nome: "Lâmpada Pingo LED T10 Branca (par)", categoriaId: 4, imagem: "", valorCompra: 7, valorVenda: 14.9, quantidade: 30, estoqueMinimo: 10, estado: "Bom" },
  { id: 12, codigo: "AC-001", nome: "Relé Auxiliar 12V 40A 5 Terminais", categoriaId: 5, imagem: "", valorCompra: 14, valorVenda: 24.9, quantidade: 11, estoqueMinimo: 6, estado: "Bom" },
  { id: 13, codigo: "AC-002", nome: "Fusível Lâmina Mini 10A (cartela)", categoriaId: 5, imagem: "", valorCompra: 3.2, valorVenda: 7.5, quantidade: 5, estoqueMinimo: 10, estado: "Ruim" },
  { id: 14, codigo: "AC-003", nome: "Interruptor Pulsador para Buzina", categoriaId: 5, imagem: "", valorCompra: 8, valorVenda: 15.9, quantidade: 9, estoqueMinimo: 4, estado: "Bom" },
];
