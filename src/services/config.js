/*
 * Modo de funcionamento do site. Sem VITE_API_URL ele usa os dados de exemplo
 * (src/data/); com ela, login, contas e clientes usam a API (docs/contrato-api.md).
 */
export const API_URL = String(import.meta.env?.VITE_API_URL ?? "").trim().replace(/\/+$/, "");

export const modoApi = API_URL !== "";
