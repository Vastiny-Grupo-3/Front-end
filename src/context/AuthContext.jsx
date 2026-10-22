import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { contas as contasIniciais } from "../data/contas.js";
import * as regras from "../utils/contas.js";

/*
 * Autenticação com as contas mockadas de src/data/contas.js até existir back-end.
 * Contas e sessão ficam no sessionStorage para sobreviver ao recarregamento da página.
 * Excluir uma conta remove só aquela conta (e o acesso dela); os dados da empresa ficam.
 */

const CHAVE_SESSAO = "vastiny:sessao";
const CHAVE_CONTAS = "vastiny:contas";

const AuthContext = createContext(null);

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

export function AuthProvider({ children }) {
  const [contas, setContas] = useState(() => ler(CHAVE_CONTAS, contasIniciais));
  const [idSessao, setIdSessao] = useState(() => ler(CHAVE_SESSAO, null)?.id ?? null);
  const contasRef = useRef(contas);

  const guardarContas = useCallback((novas) => {
    contasRef.current = novas;
    gravar(CHAVE_CONTAS, novas);
    setContas(novas);
  }, []);

  const abrirSessao = useCallback((id) => {
    gravar(CHAVE_SESSAO, id == null ? null : { id });
    setIdSessao(id);
  }, []);

  const conta = contas.find((item) => item.id === idSessao) ?? null;
  const usuario = useMemo(
    () => (conta ? { id: conta.id, nome: conta.nome, email: conta.email } : null),
    [conta],
  );

  /**
   * Autentica o usuário. Assíncrona para já ter o formato do back-end.
   * Resolve com { ok: true } ou { ok: false, motivo: "credenciais" | "conexao" }.
   */
  const localizarConta = useCallback((email) => regras.localizarConta(contasRef.current, email), []);

  const redefinirSenha = useCallback(
    (email, senha, confirmacao) => {
      const resultado = regras.redefinirSenha(contasRef.current, { email, senha, confirmacao });
      if (!resultado.erros) guardarContas(resultado.contas);
      return { erros: resultado.erros };
    },
    [guardarContas],
  );

  const entrar = useCallback(
    async (email, senha) => {
      const encontrada = regras.autenticar(contasRef.current, email, senha);
      if (!encontrada) return { ok: false, motivo: "credenciais" };
      abrirSessao(encontrada.id);
      return { ok: true };
    },
    [abrirSessao],
  );

  const sair = useCallback(() => abrirSessao(null), [abrirSessao]);

  const cadastrarConta = useCallback(
    (dados) => {
      const resultado = regras.cadastrarConta(contasRef.current, dados);
      if (!resultado.erros) guardarContas(resultado.contas);
      return { erros: resultado.erros, conta: resultado.conta };
    },
    [guardarContas],
  );

  const atualizarConta = useCallback(
    (dados) => {
      const resultado = regras.atualizarConta(contasRef.current, idSessao, dados);
      if (!resultado.erros) guardarContas(resultado.contas);
      return { erros: resultado.erros };
    },
    [guardarContas, idSessao],
  );

  const excluirConta = useCallback(
    (senhaAtual) => {
      const resultado = regras.excluirConta(contasRef.current, idSessao, senhaAtual);
      if (resultado.erro) return { erro: resultado.erro };
      guardarContas(resultado.contas);
      abrirSessao(null);
      return {};
    },
    [guardarContas, abrirSessao, idSessao],
  );

  const valor = useMemo(
    () => ({
      usuario,
      entrar,
      sair,
      cadastrarConta,
      atualizarConta,
      excluirConta,
      localizarConta,
      redefinirSenha,
    }),
    [usuario, entrar, sair, cadastrarConta, atualizarConta, excluirConta, localizarConta, redefinirSenha],
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto) throw new Error("useAuth precisa estar dentro de AuthProvider.");
  return contexto;
}
