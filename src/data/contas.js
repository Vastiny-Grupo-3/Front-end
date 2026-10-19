/**
 * Contas de acesso (mock até existir back-end). Todas têm as mesmas permissões
 * e compartilham os mesmos dados da empresa.
 *
 * Conta de teste para entrar no sistema durante o desenvolvimento:
 *   e-mail: cleber@autoeletrica.test · senha: vastiny2026
 * (senha em texto só porque é mock; o back-end vai guardar apenas o hash.)
 */
export const contas = [
  { id: 1, nome: "Cleber", email: "cleber@autoeletrica.test", senha: "vastiny2026" },
];
