import { api } from "./http.js";

/*
 * Dashboard pela API (docs/contrato-api.md): indicadores, categorias e produtos mais vendidos do
 * período. `categoriaIds` só vai na chamada quando é uma seleção parcial das categorias: todas
 * (ou a lista ainda vazia) significa sem filtro. Nenhuma categoria marcada pede a categoria 0, que
 * não existe, para receber as vendas zeradas e o gráfico de categorias completo.
 * `signal` (AbortController) cancela a chamada quando o filtro muda antes da resposta chegar.
 */
export async function buscarDashboard({ inicio, fim, categoriaIds, totalDeCategorias }, { signal } = {}) {
  const params = { inicio, fim };
  if (totalDeCategorias > 0 && categoriaIds.length < totalDeCategorias) {
    params.categorias = categoriaIds.length > 0 ? categoriaIds.join(",") : "0";
  }
  const { data } = await api.get("/dashboard", { params, signal });
  return data;
}
