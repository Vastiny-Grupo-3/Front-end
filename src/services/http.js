import { API_URL } from "./config.js";
import { lerToken, limparSessao } from "./sessao.js";

/*
 * Cliente HTTP do modo API (fetch nativo). Envia o JWT em `Authorization: Bearer`
 * e traduz as falhas em ErroApi, com `tipo` (conexao, nao-autorizado, validacao,
 * conflito, nao-encontrado ou servidor) e `erros` por campo quando a API manda.
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

/**
 * requisicao("/clientes", { metodo, corpo, autenticado })
 * Devolve o JSON da resposta (ou null quando não há corpo). `autenticado: false`
 * é para o login: um 401 ali é "credenciais inválidas", não sessão vencida.
 */
export async function requisicao(caminho, { metodo = "GET", corpo, autenticado = true } = {}) {
  const cabecalhos = { Accept: "application/json" };
  if (corpo !== undefined) cabecalhos["Content-Type"] = "application/json";
  const token = autenticado ? lerToken() : null;
  if (token) cabecalhos.Authorization = `Bearer ${token}`;

  let resposta;
  try {
    resposta = await fetch(`${API_URL}${caminho}`, {
      method: metodo,
      headers: cabecalhos,
      body: corpo === undefined ? undefined : JSON.stringify(corpo),
    });
  } catch {
    throw new ErroApi("conexao");
  }

  let dados = null;
  try {
    dados = resposta.status === 204 ? null : await resposta.json();
  } catch {
    dados = null;
  }
  if (resposta.ok) return dados;

  const tipo = tipoDoStatus(resposta.status);
  if (tipo === "nao-autorizado" && autenticado) {
    limparSessao();
    quemOuveExpiracao.forEach((aoExpirar) => aoExpirar());
  }
  throw new ErroApi(tipo, {
    status: resposta.status,
    erros: dados?.erros && typeof dados.erros === "object" ? dados.erros : {},
    mensagem: typeof dados?.erro === "string" ? dados.erro : "",
  });
}
