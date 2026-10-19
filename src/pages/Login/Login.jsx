import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import Button from "../../components/Button/Button.jsx";
import TextField from "../../components/TextField/TextField.jsx";
import PasswordField from "../../components/PasswordField/PasswordField.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import "./Login.css";

const MENSAGENS = {
  email: "Informe seu e-mail.",
  senha: "Informe sua senha.",
  credenciais: "E-mail ou senha incorretos. Confira os dados e tente novamente.",
  conexao: "Não conseguimos entrar. Verifique sua conexão e tente novamente.",
};

/** TL18 Login: cartão central com e-mail, senha e "Entrar". Sucesso leva ao Catálogo. */
export default function Login() {
  const { entrar } = useAuth();
  const navegar = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState("");
  const [entrando, setEntrando] = useState(false);
  const [falhas, setFalhas] = useState(0);
  const emailRef = useRef(null);
  const senhaRef = useRef(null);

  useEffect(() => {
    document.title = "Vastiny";
  }, []);

  // Após uma tentativa sem sucesso (campos já reativados), o foco volta ao e-mail.
  useEffect(() => {
    if (falhas > 0) emailRef.current?.focus();
  }, [falhas]);

  function mudarEmail(evento) {
    setEmail(evento.target.value);
    if (erros.email) setErros((atuais) => ({ ...atuais, email: undefined }));
  }

  function mudarSenha(evento) {
    setSenha(evento.target.value);
    if (erros.senha) setErros((atuais) => ({ ...atuais, senha: undefined }));
  }

  async function enviar(evento) {
    evento.preventDefault();
    if (entrando) return;

    const novosErros = {};
    if (!email.trim()) novosErros.email = MENSAGENS.email;
    if (!senha) novosErros.senha = MENSAGENS.senha;
    setErros(novosErros);
    setErroGeral("");

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
          <h1>Vastiny</h1>
          <p className="login__frase">Organize seu estoque e visualize suas vendas.</p>
        </div>
        <form className="login__formulario" onSubmit={enviar} noValidate>
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
      </div>
    </main>
  );
}
