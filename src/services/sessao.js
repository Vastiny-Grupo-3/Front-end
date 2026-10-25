/*
 * Sessão do modo API: o token JWT e o usuário ficam no sessionStorage
 * (somem ao fechar a aba). O token expirado é descartado ao ler.
 */

const CHAVE = "vastiny:api-sessao";

/** Instante de expiração do token em milissegundos, ou null se não houver `exp`. */
export function expiracaoDoToken(token) {
  try {
    const carga = String(token).split(".")[1];
    const base64 = carga.replace(/-/g, "+").replace(/_/g, "/");
    const bytes = Uint8Array.from(atob(base64), (letra) => letra.charCodeAt(0));
    const { exp } = JSON.parse(new TextDecoder().decode(bytes));
    return typeof exp === "number" ? exp * 1000 : null;
  } catch {
    return null;
  }
}

export function tokenExpirado(token, agora = Date.now()) {
  const expiracao = expiracaoDoToken(token);
  return expiracao != null && expiracao <= agora;
}

export function limparSessao() {
  try {
    sessionStorage.removeItem(CHAVE);
  } catch {
    // Sem armazenamento disponível: nada a limpar.
  }
}

export function gravarSessao({ token, usuario }) {
  try {
    sessionStorage.setItem(CHAVE, JSON.stringify({ token, usuario }));
  } catch {
    // Sem armazenamento disponível: o login vale só até recarregar a página.
  }
}

/** { token, usuario } da sessão guardada, ou null se não houver ou se o token expirou. */
export function lerSessao() {
  try {
    const salva = JSON.parse(sessionStorage.getItem(CHAVE) ?? "null");
    if (!salva?.token || !salva.usuario) return null;
    if (tokenExpirado(salva.token)) {
      limparSessao();
      return null;
    }
    return salva;
  } catch {
    return null;
  }
}

export function lerToken() {
  return lerSessao()?.token ?? null;
}
