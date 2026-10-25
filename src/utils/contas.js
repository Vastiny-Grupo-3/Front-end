/*
 * Regras das contas de acesso (TL15, TL16, TL18 e TL20). Funções puras:
 * recebem a lista de contas e devolvem uma nova, com `erros` por campo
 * quando algo não passa na validação.
 *
 * Senha (regra confirmada): obrigatória, mínimo de 8 caracteres e pelo
 * menos uma letra e um número; a confirmação deve ser igual.
 */

export const MENSAGENS_CONTA = {
  nome: "Informe o nome de usuário.",
  emailInvalido: "Informe um e-mail válido.",
  emailEmUso: "Este e-mail já está em uso.",
  senhaRequisitos: "A senha não atende aos requisitos de segurança.",
  senhasDiferentes: "As senhas não são iguais. Digite novamente.",
  senhaAtual: "A senha atual não confere.",
  erroSalvar: "Não conseguimos salvar. Verifique os campos destacados e tente novamente.",
  erroConexao: "Não conseguimos falar com o servidor. Verifique sua conexão e tente novamente.",
  emailObrigatorio: "Informe seu e-mail.",
  emailNaoEncontrado: "Não encontramos uma conta com esse e-mail.",
};

const TAMANHO_MINIMO_SENHA = 8;

function texto(valor) {
  return String(valor ?? "").trim();
}

function mesmoEmail(a, b) {
  return texto(a).toLowerCase() === texto(b).toLowerCase();
}

export function emailValido(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(texto(email));
}

export function senhaValida(senha) {
  return (
    typeof senha === "string" &&
    senha.length >= TAMANHO_MINIMO_SENHA &&
    /[A-Za-zÀ-ÿ]/.test(senha) &&
    /\d/.test(senha)
  );
}

function proximoId(contas) {
  return contas.reduce((maior, conta) => Math.max(maior, conta.id), 0) + 1;
}

function emailEmUso(contas, email, idIgnorado) {
  return contas.some((conta) => conta.id !== idIgnorado && mesmoEmail(conta.email, email));
}

/** Localiza a conta pelo e-mail, sem devolver a senha. */
export function localizarConta(contas, email) {
  if (!texto(email)) return { erro: MENSAGENS_CONTA.emailObrigatorio };
  if (!emailValido(email)) return { erro: MENSAGENS_CONTA.emailInvalido };
  const conta = contas.find((item) => mesmoEmail(item.email, email));
  if (!conta) return { erro: MENSAGENS_CONTA.emailNaoEncontrado };
  return { email: conta.email };
}

/**
 * Redefine a senha de uma conta já existente (fluxo "Esqueceu sua senha?").
 * Retorna { contas } ou { contas, erros }.
 */
export function redefinirSenha(contas, { email, senha, confirmacao }) {
  const localizada = localizarConta(contas, email);
  const erros = {};
  if (localizada.erro) erros.email = localizada.erro;
  if (!senhaValida(senha)) erros.senha = MENSAGENS_CONTA.senhaRequisitos;
  if (senha !== confirmacao) erros.confirmacao = MENSAGENS_CONTA.senhasDiferentes;
  if (Object.keys(erros).length > 0) return { contas, erros };

  return {
    contas: contas.map((conta) => (mesmoEmail(conta.email, email) ? { ...conta, senha } : conta)),
  };
}

/** Conta com e-mail e senha informados, ou null (sem dizer qual campo está errado). */
export function autenticar(contas, email, senha) {
  return contas.find((conta) => mesmoEmail(conta.email, email) && conta.senha === senha) ?? null;
}

/** TL16: cadastrar nova conta. Retorna { contas, conta } ou { contas, erros }. */
export function cadastrarConta(contas, { nome, email, senha, confirmacao }) {
  const erros = {};
  if (!texto(nome)) erros.nome = MENSAGENS_CONTA.nome;
  if (!emailValido(email)) erros.email = MENSAGENS_CONTA.emailInvalido;
  else if (emailEmUso(contas, email)) erros.email = MENSAGENS_CONTA.emailEmUso;
  if (!senhaValida(senha)) erros.senha = MENSAGENS_CONTA.senhaRequisitos;
  if (senha !== confirmacao) erros.confirmacao = MENSAGENS_CONTA.senhasDiferentes;
  if (Object.keys(erros).length > 0) return { contas, erros };

  const conta = { id: proximoId(contas), nome: texto(nome), email: texto(email), senha };
  return { contas: [...contas, conta], conta };
}

/**
 * TL15 "Dados da conta": nome e e-mail; a troca de senha exige a senha atual (RF41).
 * Retorna { contas } ou { contas, erros }.
 */
export function atualizarConta(contas, id, { nome, email, senhaAtual, novaSenha }) {
  const atual = contas.find((conta) => conta.id === id);
  const erros = {};
  if (!texto(nome)) erros.nome = MENSAGENS_CONTA.nome;
  if (!emailValido(email)) erros.email = MENSAGENS_CONTA.emailInvalido;
  else if (emailEmUso(contas, email, id)) erros.email = MENSAGENS_CONTA.emailEmUso;
  if (novaSenha) {
    if (senhaAtual !== atual.senha) erros.senhaAtual = MENSAGENS_CONTA.senhaAtual;
    if (!senhaValida(novaSenha)) erros.novaSenha = MENSAGENS_CONTA.senhaRequisitos;
  }
  if (Object.keys(erros).length > 0) return { contas, erros };

  return {
    contas: contas.map((conta) =>
      conta.id === id
        ? { ...conta, nome: texto(nome), email: texto(email), senha: novaSenha || conta.senha }
        : conta,
    ),
  };
}

/**
 * TL20 "Excluir conta": confirma com a senha atual e remove só a conta
 * (o acesso dela). Os dados da empresa não são afetados.
 */
export function excluirConta(contas, id, senhaAtual) {
  const atual = contas.find((conta) => conta.id === id);
  if (!atual || atual.senha !== senhaAtual) return { contas, erro: MENSAGENS_CONTA.senhaAtual };
  return { contas: contas.filter((conta) => conta.id !== id) };
}
