import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import Button from "../../components/Button/Button.jsx";
import TextField from "../../components/TextField/TextField.jsx";
import PasswordField from "../../components/PasswordField/PasswordField.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { MENSAGENS_CONTA } from "../../utils/contas.js";
import "./Login.css";

const MENSAGENS = {
  email: MENSAGENS_CONTA.emailObrigatorio,
  senha: "Informe sua senha.",
  credenciais: "E-mail ou senha incorretos. Confira os dados e tente novamente.",
  conexao: "Não conseguimos entrar. Verifique sua conexão e tente novamente.",
  redefinida: "Senha redefinida. Entre com a nova senha.",
};

const AJUDA_SENHA = "A senha deve atender aos requisitos de segurança definidos pelo sistema.";

function gerarCodigo() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/** TL18 Login: cartão central com e-mail, senha e "Entrar". Sucesso leva ao Catálogo. */
export default function Login() {
  const { entrar, localizarConta, redefinirSenha } = useAuth();
  const navegar = useNavigate();
  const [etapa, setEtapa] = useState("entrar");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [codigo, setCodigo] = useState("");
  const [codigoEnviado, setCodigoEnviado] = useState("");
  const [avisoCodigo, setAvisoCodigo] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState("");
  const [aviso, setAviso] = useState("");
  const [entrando, setEntrando] = useState(false);
  const [falhas, setFalhas] = useState(0);
  const emailRef = useRef(null);
  const senhaRef = useRef(null);
  const codigoRef = useRef(null);
  const novaSenhaRef = useRef(null);
  const avisoRef = useRef(null);

  useEffect(() => {
    document.title = etapa === "entrar" ? "Entrar" : "Redefinir senha";
  }, [etapa]);

  // Após uma tentativa sem sucesso (campos já reativados), o foco volta ao e-mail.
  useEffect(() => {
    if (falhas > 0) emailRef.current?.focus();
  }, [falhas]);

  const primeiraEtapa = useRef(true);
  const avisoAtual = useRef(aviso);
  avisoAtual.current = aviso;
  useEffect(() => {
    if (primeiraEtapa.current) {
      primeiraEtapa.current = false;
      return;
    }
    if (etapa === "email") emailRef.current?.focus();
    else if (etapa === "codigo") codigoRef.current?.focus();
    else if (etapa === "senha") novaSenhaRef.current?.focus();
    else if (!avisoAtual.current) emailRef.current?.focus();
  }, [etapa]);

  useEffect(() => {
    if (aviso) avisoRef.current?.focus();
  }, [aviso]);

  function mudarEmail(evento) {
    setEmail(evento.target.value);
    if (erros.email) setErros((atuais) => ({ ...atuais, email: undefined }));
  }

  function mudarSenha(evento) {
    setSenha(evento.target.value);
    if (erros.senha) setErros((atuais) => ({ ...atuais, senha: undefined }));
  }

  function abrirRecuperacao() {
    setEtapa("email");
    setErros({});
    setErroGeral("");
    setAviso("");
    setSenha("");
    setCodigo("");
    setCodigoEnviado("");
    setAvisoCodigo("");
    setNovaSenha("");
    setConfirmacao("");
  }

  function voltarAoLogin(mensagem = "") {
    setEtapa("entrar");
    setErros({});
    setErroGeral("");
    setAviso(mensagem);
    setSenha("");
    setCodigo("");
    setCodigoEnviado("");
    setAvisoCodigo("");
    setNovaSenha("");
    setConfirmacao("");
  }

  function enviarCodigo(emailConta) {
    setEmail(emailConta);
    setCodigo("");
    setCodigoEnviado(gerarCodigo());
    setAvisoCodigo("");
    setErros({});
    setEtapa("codigo");
  }

  function continuarRecuperacao(evento) {
    evento.preventDefault();
    const resultado = localizarConta(email);
    if (resultado.erro) {
      setErros({ email: resultado.erro });
      emailRef.current?.focus();
      return;
    }
    enviarCodigo(resultado.email);
  }

  function confirmarCodigo(evento) {
    evento.preventDefault();
    const informado = codigo.trim();
    if (!informado) {
      setErros({ codigo: "Informe o código de confirmação." });
      codigoRef.current?.focus();
      return;
    }
    if (informado !== codigoEnviado) {
      setErros({ codigo: "O código não confere. Confira e tente novamente." });
      codigoRef.current?.focus();
      return;
    }
    setErros({});
    setAvisoCodigo("");
    setEtapa("senha");
  }

  function reenviarCodigo() {
    setCodigoEnviado(gerarCodigo());
    setCodigo("");
    setErros({});
    setAvisoCodigo("Enviamos um novo código para o e-mail informado.");
    codigoRef.current?.focus();
  }

  function salvarNovaSenha(evento) {
    evento.preventDefault();
    const resultado = redefinirSenha(email, novaSenha, confirmacao);
    if (resultado.erros) {
      setErros(resultado.erros);
      if (resultado.erros.email) setEtapa("email");
      else if (resultado.erros.senha) novaSenhaRef.current?.focus();
      return;
    }
    voltarAoLogin(MENSAGENS.redefinida);
  }

  async function enviar(evento) {
    evento.preventDefault();
    if (entrando) return;

    const novosErros = {};
    if (!email.trim()) novosErros.email = MENSAGENS.email;
    if (!senha) novosErros.senha = MENSAGENS.senha;
    setErros(novosErros);
    setErroGeral("");
    setAviso("");

    if (novosErros.email) {
      emailRef.current?.focus();
      return;
    }
    if (novosErros.senha) {
      senhaRef.current?.focus();
      return;
    }

    setEntrando(true);
    let resultado;
    try {
      resultado = await entrar(email, senha);
    } catch {
      resultado = { ok: false, motivo: "conexao" };
    }

    if (resultado.ok) {
      navegar("/", { replace: true });
      return;
    }
    setEntrando(false);
    setErroGeral(resultado.motivo === "conexao" ? MENSAGENS.conexao : MENSAGENS.credenciais);
    setFalhas((atual) => atual + 1);
  }

  return (
    <main id="conteudo-principal" tabIndex={-1} className="login">
      <div className="login__cartao">
        <div className="login__marca">
          {etapa === "entrar" ? (
            <h1 className="login__titulo">
              <img className="login__logo" src="/logo-dmc.png" alt="DMC Eletropeças" />
            </h1>
          ) : (
            <>
              <img className="login__logo" src="/logo-dmc.png" alt="" />
              <h1 className="login__titulo">Redefinir senha</h1>
            </>
          )}
          <p className="login__frase">
            {etapa === "entrar" && "Organize seu estoque e visualize suas vendas."}
            {etapa === "email" && "Informe o e-mail da conta. Enviaremos um código de confirmação."}
            {etapa === "codigo" && `Enviamos um código de 6 dígitos para ${email}.`}
            {etapa === "senha" && "Crie uma nova senha para esta conta."}
          </p>
        </div>

        {etapa === "entrar" && (
          <form className="login__formulario" onSubmit={enviar} noValidate>
            {aviso && (
              <p className="login__aviso" role="status" tabIndex={-1} ref={avisoRef}>
                {aviso}
              </p>
            )}
            <TextField
              ref={emailRef}
              rotulo="E-mail"
              obrigatorio
              type="email"
              autoComplete="email"
              inputMode="email"
              placeholder="exemplo@email.com"
              value={email}
              onChange={mudarEmail}
              erro={erros.email}
              disabled={entrando}
            />
            <PasswordField
              ref={senhaRef}
              rotulo="Senha"
              obrigatorio
              autoComplete="current-password"
              placeholder="Digite sua senha"
              value={senha}
              onChange={mudarSenha}
              erro={erros.senha}
              disabled={entrando}
            />
            <button type="button" className="login__esqueci" onClick={abrirRecuperacao}>
              Esqueceu sua senha?
            </button>
            {erroGeral && (
              <p className="login__erro" role="alert">
                <AlertCircle className="login__icone-erro" aria-hidden="true" focusable="false" />
                {erroGeral}
              </p>
            )}
            <Button type="submit" className="login__entrar" carregando={entrando}>
              Entrar
            </Button>
          </form>
        )}

        {etapa === "email" && (
          <form className="login__formulario" onSubmit={continuarRecuperacao} noValidate>
            <TextField
              ref={emailRef}
              rotulo="E-mail"
              obrigatorio
              type="email"
              autoComplete="email"
              inputMode="email"
              placeholder="exemplo@email.com"
              value={email}
              onChange={mudarEmail}
              erro={erros.email}
            />
            <Button type="submit" className="login__entrar">
              Continuar
            </Button>
            <button type="button" className="login__voltar" onClick={() => voltarAoLogin()}>
              Voltar ao login
            </button>
          </form>
        )}

        {etapa === "codigo" && (
          <form className="login__formulario" onSubmit={confirmarCodigo} noValidate>
            <p className="login__simulacao">
              O envio de e-mail ainda não está disponível. O código enviado para {email} é{" "}
              <strong className="login__codigo">{codigoEnviado}</strong>.
            </p>
            {avisoCodigo && (
              <p className="login__aviso" role="status">
                {avisoCodigo}
              </p>
            )}
            <TextField
              ref={codigoRef}
              rotulo="Código de confirmação"
              obrigatorio
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="000000"
              value={codigo}
              onChange={(evento) => {
                setCodigo(evento.target.value.replace(/\D/g, "").slice(0, 6));
                if (erros.codigo) setErros((atuais) => ({ ...atuais, codigo: undefined }));
              }}
              erro={erros.codigo}
            />
            <Button type="submit" className="login__entrar">
              Confirmar código
            </Button>
            <button type="button" className="login__voltar" onClick={reenviarCodigo}>
              Reenviar código
            </button>
            <button
              type="button"
              className="login__voltar"
              onClick={() => {
                setErros({});
                setAvisoCodigo("");
                setEtapa("email");
              }}
            >
              Voltar
            </button>
          </form>
        )}

        {etapa === "senha" && (
          <form className="login__formulario" onSubmit={salvarNovaSenha} noValidate>
            <PasswordField
              ref={novaSenhaRef}
              rotulo="Nova senha"
              obrigatorio
              autoComplete="new-password"
              placeholder="Crie uma senha"
              ajuda={AJUDA_SENHA}
              value={novaSenha}
              onChange={(evento) => {
                setNovaSenha(evento.target.value);
                if (erros.senha) setErros((atuais) => ({ ...atuais, senha: undefined }));
              }}
              erro={erros.senha}
            />
            <PasswordField
              rotulo="Confirmar senha"
              obrigatorio
              autoComplete="new-password"
              placeholder="Digite novamente a senha"
              value={confirmacao}
              onChange={(evento) => {
                setConfirmacao(evento.target.value);
                if (erros.confirmacao) setErros((atuais) => ({ ...atuais, confirmacao: undefined }));
              }}
              erro={erros.confirmacao}
            />
            <Button type="submit" className="login__entrar">
              Salvar nova senha
            </Button>
            <button
              type="button"
              className="login__voltar"
              onClick={() => {
                setErros({});
                setEtapa("codigo");
              }}
            >
              Voltar
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
