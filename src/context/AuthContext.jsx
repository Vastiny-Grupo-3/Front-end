import { createContext, useCallback, useContext, useMemo, useState } from "react";

/*
 * Autenticação simulada até existir back-end: qualquer e-mail e senha
 * preenchidos entram. A sessão fica no sessionStorage para sobreviver ao
 * recarregamento da página.
 */

const CHAVE_SESSAO = "vastiny:sessao";

const AuthContext = createContext(null);

function lerSessao() {
  try {
    const salva = sessionStorage.getItem(CHAVE_SESSAO);
    return salva ? JSON.parse(salva) : null;
  } catch {
    return null;
  }
}

function gravarSessao(usuario) {
  try {
    if (usuario) sessionStorage.setItem(CHAVE_SESSAO, JSON.stringify(usuario));
    else sessionStorage.removeItem(CHAVE_SESSAO);
  } catch {
    // Sem armazenamento disponível: a sessão vale só enquanto a página estiver aberta.
  }
}

/* Provisório: o nome vem do e-mail até existirem os dados das contas. */
function nomeDoEmail(email) {
  const parte = email.split("@")[0];
  return parte.charAt(0).toUpperCase() + parte.slice(1);
}

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(lerSessao);

  const entrar = useCallback((email, senha) => {
    const emailLimpo = email.trim();
    if (!emailLimpo || !senha) return false;
    const novoUsuario = { email: emailLimpo, nome: nomeDoEmail(emailLimpo) };
    gravarSessao(novoUsuario);
    setUsuario(novoUsuario);
    return true;
  }, []);

  const sair = useCallback(() => {
    gravarSessao(null);
    setUsuario(null);
  }, []);

  const valor = useMemo(() => ({ usuario, entrar, sair }), [usuario, entrar, sair]);

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto) throw new Error("useAuth precisa estar dentro de AuthProvider.");
  return contexto;
}
