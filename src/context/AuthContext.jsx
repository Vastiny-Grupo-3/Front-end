import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { modoApi } from "../services/config.js";
import { aoExpirarSessao } from "../services/http.js";
import { servicoApi } from "../services/contas/api.js";
import { criarServicoMock } from "../services/contas/mock.js";

/*
 * Autenticação. Com VITE_API_URL a conta e a sessão (JWT) vêm da API; sem ela usa
 * as contas mockadas de src/data/contas.js. As duas formas (src/services/contas/)
 * têm as mesmas operações assíncronas; este contexto só guarda o usuário da sessão.
 * Excluir uma conta remove só aquela conta (e o acesso dela); os dados da empresa ficam.
 */

const AuthContext = createContext(null);

const SEM_RECUPERACAO = { erro: "A recuperação de senha não está disponível." };

export function AuthProvider({ children }) {
  const [servico] = useState(() => (modoApi ? servicoApi : criarServicoMock()));
  const [usuario, setUsuario] = useState(() => servico.usuarioAtual());

  // A API recusou o token (vencido ou inválido): encerra a sessão e o acesso volta ao login.
  useEffect(() => aoExpirarSessao(() => setUsuario(null)), []);

  /** Resolve com { ok: true } ou { ok: false, motivo: "credenciais" | "conexao" }. */
  const entrar = useCallback(
    async (email, senha) => {
      const resultado = await servico.entrar(email, senha);
      if (resultado.ok) setUsuario(resultado.usuario);
      return { ok: resultado.ok, motivo: resultado.motivo };
    },
    [servico],
  );

  const sair = useCallback(() => {
    servico.sair();
    setUsuario(null);
  }, [servico]);

  /** Cada operação resolve com { erros } (por campo), { erroGeral } ou sem nada, quando deu certo. */
  const cadastrarConta = useCallback((dados) => servico.cadastrarConta(dados), [servico]);

  const atualizarConta = useCallback(
    async (dados) => {
      const resultado = await servico.atualizarConta(dados);
      if (resultado.usuario) setUsuario(resultado.usuario);
      return { erros: resultado.erros, erroGeral: resultado.erroGeral };
    },
    [servico],
  );

  const excluirConta = useCallback(
    async (senhaAtual) => {
      const resultado = await servico.excluirConta(senhaAtual);
      if (!resultado.erro) setUsuario(null);
      return resultado;
    },
    [servico],
  );

  const localizarConta = useCallback((email) => servico.localizarConta?.(email) ?? SEM_RECUPERACAO, [servico]);

  const redefinirSenha = useCallback(
    (email, senha, confirmacao) =>
      servico.redefinirSenha?.(email, senha, confirmacao) ?? { erros: { email: SEM_RECUPERACAO.erro } },
    [servico],
  );

  const valor = useMemo(
    () => ({
      usuario,
      recuperacaoDisponivel: servico.recuperacaoDisponivel,
      entrar,
      sair,
      cadastrarConta,
      atualizarConta,
      excluirConta,
      localizarConta,
      redefinirSenha,
    }),
    [usuario, servico, entrar, sair, cadastrarConta, atualizarConta, excluirConta, localizarConta, redefinirSenha],
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto) throw new Error("useAuth precisa estar dentro de AuthProvider.");
  return contexto;
}
