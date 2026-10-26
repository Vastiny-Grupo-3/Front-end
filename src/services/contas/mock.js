import { contas as contasIniciais } from "../../data/contas.js";
import * as regras from "../../utils/contas.js";

/*
 * Contas do modo mock: as contas de src/data/contas.js, guardadas (com a sessão)
 * no sessionStorage para sobreviver ao recarregamento da página. As operações
 * são assíncronas para terem a mesma forma do serviço da API (./api.js).
 * Excluir uma conta remove só aquela conta (e o acesso dela); os dados da empresa ficam.
 */

const CHAVE_SESSAO = "vastiny:sessao";
const CHAVE_CONTAS = "vastiny:contas";

function ler(chave, padrao) {
  try {
    const salvo = sessionStorage.getItem(chave);
    return salvo ? JSON.parse(salvo) : padrao;
  } catch {
    return padrao;
  }
}

function gravar(chave, valor) {
  try {
    if (valor == null) sessionStorage.removeItem(chave);
    else sessionStorage.setItem(chave, JSON.stringify(valor));
  } catch {
    // Sem armazenamento disponível: os dados valem só enquanto a página estiver aberta.
  }
}

export function criarServicoMock() {
  let contas = ler(CHAVE_CONTAS, contasIniciais);
  let idSessao = ler(CHAVE_SESSAO, null)?.id ?? null;

  function guardarContas(novas) {
    contas = novas;
    gravar(CHAVE_CONTAS, novas);
  }

  function abrirSessao(id) {
    idSessao = id;
    gravar(CHAVE_SESSAO, id == null ? null : { id });
  }

  function usuarioAtual() {
    const conta = contas.find((item) => item.id === idSessao);
    return conta ? { id: conta.id, nome: conta.nome, email: conta.email } : null;
  }

  return {
    recuperacaoDisponivel: true,
    usuarioAtual,

    /** Resolve com { ok: true, usuario } ou { ok: false, motivo: "credenciais" }. */
    async entrar(email, senha) {
      const encontrada = regras.autenticar(contas, email, senha);
      if (!encontrada) return { ok: false, motivo: "credenciais" };
      abrirSessao(encontrada.id);
      return { ok: true, usuario: usuarioAtual() };
    },

    sair() {
      abrirSessao(null);
    },

    async cadastrarConta(dados) {
      const resultado = regras.cadastrarConta(contas, dados);
      if (resultado.erros) return { erros: resultado.erros };
      guardarContas(resultado.contas);
      return {};
    },

    async atualizarConta(dados) {
      const resultado = regras.atualizarConta(contas, idSessao, dados);
      if (resultado.erros) return { erros: resultado.erros };
      guardarContas(resultado.contas);
      return { usuario: usuarioAtual() };
    },

    async excluirConta(senhaAtual) {
      const resultado = regras.excluirConta(contas, idSessao, senhaAtual);
      if (resultado.erro) return { erro: resultado.erro };
      guardarContas(resultado.contas);
      abrirSessao(null);
      return {};
    },

    // Recuperação de senha: só existe no mock (com a API ela precisa de e-mail e validação no servidor).
    localizarConta: (email) => regras.localizarConta(contas, email),

    redefinirSenha(email, senha, confirmacao) {
      const resultado = regras.redefinirSenha(contas, { email, senha, confirmacao });
      if (!resultado.erros) guardarContas(resultado.contas);
      return { erros: resultado.erros };
    },
  };
}
