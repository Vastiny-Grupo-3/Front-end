import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/Button/Button.jsx";
import TextField from "../../components/TextField/TextField.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import "./Login.css";

/**
 * TL18 Login — versão mínima para a autenticação simulada.
 * O layout completo (mostrar/ocultar senha e erros de credenciais) entra na Etapa 7.
 */
export default function Login() {
  const { entrar } = useAuth();
  const navegar = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erros, setErros] = useState({});
  const emailRef = useRef(null);
  const senhaRef = useRef(null);

  useEffect(() => {
    document.title = "Vastiny";
  }, []);

  function enviar(evento) {
    evento.preventDefault();
    const novosErros = {};
    if (!email.trim()) novosErros.email = "Informe seu e-mail.";
    if (!senha) novosErros.senha = "Informe sua senha.";
    setErros(novosErros);

    if (novosErros.email) {
      emailRef.current?.focus();
      return;
    }
    if (novosErros.senha) {
      senhaRef.current?.focus();
      return;
    }
    if (entrar(email, senha)) navegar("/", { replace: true });
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
            rotulo="E-mail"
            type="email"
            autoComplete="email"
            placeholder="exemplo@email.com"
            value={email}
            onChange={(evento) => setEmail(evento.target.value)}
            erro={erros.email}
            ref={emailRef}
          />
          <TextField
            rotulo="Senha"
            type="password"
            autoComplete="current-password"
            placeholder="Digite sua senha"
            value={senha}
            onChange={(evento) => setSenha(evento.target.value)}
            erro={erros.senha}
            ref={senhaRef}
          />
          <Button type="submit" className="login__entrar">
            Entrar
          </Button>
        </form>
      </div>
    </main>
  );
}
