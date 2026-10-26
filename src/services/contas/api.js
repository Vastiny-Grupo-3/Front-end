import { ErroApi, requisicao } from "../http.js";
import { gravarSessao, lerSessao, limparSessao } from "../sessao.js";
import { MENSAGENS_CONTA, emailValido, senhaValida } from "../../utils/contas.js";

/*
 * Contas do modo API (contrato em docs/contrato-api.md). O site valida os campos
 * antes de enviar; a API valida de novo e os erros dela chegam por campo.
 * Mesma forma do serviço mock (./mock.js).
 */

const texto = (valor) => String(valor ?? "").trim();

/** Erro de uma chamada → { erros } (campos), { erroGeral } (conexão e falhas do servidor). */
function falha(erro) {
  if (erro instanceof ErroApi && Object.keys(erro.erros).length > 0) return { erros: erro.erros };
  return { erroGeral: MENSAGENS_CONTA.erroConexao };
}

export const servicoApi = {
  recuperacaoDisponivel: false,

  usuarioAtual() {
    return lerSessao()?.usuario ?? null;
  },

  /** Resolve com { ok: true, usuario } ou { ok: false, motivo: "credenciais" | "conexao" }. */
  async entrar(email, senha) {
    try {
      const dados = await requisicao("/auth/login", {
        metodo: "POST",
        corpo: { email: texto(email), senha },
        autenticado: false,
      });
      if (!dados?.token || !dados.usuario) return { ok: false, motivo: "conexao" };
      gravarSessao({ token: dados.token, usuario: dados.usuario });
      return { ok: true, usuario: dados.usuario };
    } catch (erro) {
      const recusado = erro instanceof ErroApi && ["nao-autorizado", "validacao"].includes(erro.tipo);
      return { ok: false, motivo: recusado ? "credenciais" : "conexao" };
    }
  },

  sair() {
    limparSessao();
  },

  async cadastrarConta({ nome, email, senha, confirmacao }) {
    const erros = {};
    if (!texto(nome)) erros.nome = MENSAGENS_CONTA.nome;
    if (!emailValido(email)) erros.email = MENSAGENS_CONTA.emailInvalido;
    if (!senhaValida(senha)) erros.senha = MENSAGENS_CONTA.senhaRequisitos;
    if (senha !== confirmacao) erros.confirmacao = MENSAGENS_CONTA.senhasDiferentes;
    if (Object.keys(erros).length > 0) return { erros };

    try {
      await requisicao("/usuarios", { metodo: "POST", corpo: { nome: texto(nome), email: texto(email), senha } });
      return {};
    } catch (erro) {
      return falha(erro);
    }
  },

  async atualizarConta({ nome, email, senhaAtual, novaSenha }) {
    const erros = {};
    if (!texto(nome)) erros.nome = MENSAGENS_CONTA.nome;
    if (!emailValido(email)) erros.email = MENSAGENS_CONTA.emailInvalido;
    if (novaSenha) {
      if (!senhaAtual) erros.senhaAtual = MENSAGENS_CONTA.senhaAtual;
      if (!senhaValida(novaSenha)) erros.novaSenha = MENSAGENS_CONTA.senhaRequisitos;
    }
    if (Object.keys(erros).length > 0) return { erros };

    try {
      const corpo = { nome: texto(nome), email: texto(email) };
      if (novaSenha) Object.assign(corpo, { senhaAtual, novaSenha });
      const usuario = await requisicao("/usuarios/me", { metodo: "PUT", corpo });
      const sessao = lerSessao();
      if (sessao && usuario) gravarSessao({ token: sessao.token, usuario });
      return { usuario: usuario ?? sessao?.usuario };
    } catch (erro) {
      return falha(erro);
    }
  },

  async excluirConta(senhaAtual) {
    if (!senhaAtual) return { erro: MENSAGENS_CONTA.senhaAtual };
    try {
      await requisicao("/usuarios/me", { metodo: "DELETE", corpo: { senhaAtual } });
      limparSessao();
      return {};
    } catch (erro) {
      if (erro instanceof ErroApi && ["validacao", "nao-autorizado"].includes(erro.tipo)) {
        return { erro: MENSAGENS_CONTA.senhaAtual };
      }
      return { erro: MENSAGENS_CONTA.erroConexao };
    }
  },
};
