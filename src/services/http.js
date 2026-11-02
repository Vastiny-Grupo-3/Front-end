import axios from "axios";
import { API_URL } from "./config.js";
import { lerToken, limparSessao } from "./sessao.js";

/*
 * Cliente HTTP do modo API (axios). Envia o JWT em `Authorization: Bearer` e traduz as
 * falhas em ErroApi, com `tipo` (conexao, nao-autorizado, validacao, conflito,
 * nao-encontrado ou servidor) e `erros` por campo quando a API manda.
 *
 * Os serviços usam a instância `api`: api.get(caminho), api.post(caminho, corpo),
 * api.put(caminho, corpo) e api.delete(caminho), e leem `.data` da resposta. Um corpo
 * FormData (envio de arquivo) vai como está, o axios acrescenta o separador do multipart.
 * `{ autenticado: false }` no config é para o login: um 401 ali é "credenciais inválidas",
 * não sessão vencida. Uma chamada cancelada (AbortController) lança o cancelamento do axios,
 * que quem cancelou reconhece com `axios.isCancel`.
 */

export class ErroApi extends Error {
  constructor(tipo, { status = 0, erros = {}, mensagem = "" } = {}) {
    super(mensagem || tipo);
    this.tipo = tipo;
    this.status = status;
    this.erros = erros;
  }
}

const quemOuveExpiracao = new Set();

/** Chama `aoExpirar` quando a API recusa o token (sessão vencida ou inválida). Devolve a função que cancela. */
export function aoExpirarSessao(aoExpirar) {
  quemOuveExpiracao.add(aoExpirar);
  return () => quemOuveExpiracao.delete(aoExpirar);
}

function tipoDoStatus(status) {
  if (status === 400) return "validacao";
  if (status === 401 || status === 403) return "nao-autorizado";
  if (status === 404) return "nao-encontrado";
  if (status === 409) return "conflito";
  return "servidor";
}

export const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { Accept: "application/json" },
});

api.interceptors.request.use((config) => {
  if (config.autenticado !== false) {
    const token = lerToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (resposta) => {
    if (resposta.status === 204) resposta.data = null;
    return resposta;
  },
  (erro) => {
    if (axios.isCancel(erro) || erro instanceof ErroApi) return Promise.reject(erro);

    const resposta = erro.response;
    if (!resposta) return Promise.reject(new ErroApi("conexao"));

    const tipo = tipoDoStatus(resposta.status);
    if (tipo === "nao-autorizado" && erro.config?.autenticado !== false) {
      limparSessao();
      quemOuveExpiracao.forEach((aoExpirar) => aoExpirar());
    }
    const dados = resposta.data;
    return Promise.reject(
      new ErroApi(tipo, {
        status: resposta.status,
        erros: dados?.erros && typeof dados.erros === "object" ? dados.erros : {},
        mensagem: typeof dados?.erro === "string" ? dados.erro : "",
      }),
    );
  },
);
