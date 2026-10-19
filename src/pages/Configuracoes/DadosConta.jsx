import { useEffect, useRef, useState } from "react";
import { AlertCircle } from "lucide-react";
import Button from "../../components/Button/Button.jsx";
import TextField from "../../components/TextField/TextField.jsx";
import PasswordField from "../../components/PasswordField/PasswordField.jsx";
import SectionCard from "./SectionCard.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { MENSAGENS_CONTA } from "../../utils/contas.js";

const ORDEM_CAMPOS = ["nome", "email", "senhaAtual", "novaSenha"];

/** TL15 — cartão "Dados da conta" (RF41) com "Cadastrar nova conta" no cabeçalho. */
export default function DadosConta({ aoCadastrarConta }) {
  const { usuario, atualizarConta } = useAuth();
  const { mostrarToast } = useToast();
  const [valores, setValores] = useState({ nome: "", email: "", senhaAtual: "", novaSenha: "" });
  const [erros, setErros] = useState({});
  const refs = { nome: useRef(null), email: useRef(null), senhaAtual: useRef(null), novaSenha: useRef(null) };

  useEffect(() => {
    if (usuario) setValores({ nome: usuario.nome, email: usuario.email, senhaAtual: "", novaSenha: "" });
  }, [usuario]);

  function mudar(campo) {
    return (evento) => {
      setValores((atuais) => ({ ...atuais, [campo]: evento.target.value }));
      if (erros[campo]) setErros((atuais) => ({ ...atuais, [campo]: undefined }));
    };
  }

  function salvar(evento) {
    evento.preventDefault();
    const resultado = atualizarConta(valores);
    if (resultado.erros) {
      setErros(resultado.erros);
      refs[ORDEM_CAMPOS.find((campo) => resultado.erros[campo])]?.current?.focus();
      return;
    }
    setErros({});
    setValores((atuais) => ({ ...atuais, senhaAtual: "", novaSenha: "" }));
    mostrarToast({ variante: "sucesso", mensagem: "Alterações salvas." });
  }

  const temErros = Object.values(erros).some(Boolean);

  return (
    <SectionCard
      id="secao-dados-conta"
      titulo="Dados da conta"
      subtitulo="Atualize suas informações pessoais e credenciais."
      acao={
        <Button variante="secundario" onClick={aoCadastrarConta}>
          Cadastrar nova conta
        </Button>
      }
    >
      <form className="secao__formulario" onSubmit={salvar} noValidate>
        {temErros && (
          <p className="secao__erro" role="alert">
            <AlertCircle className="secao__icone-erro" aria-hidden="true" focusable="false" />
            {MENSAGENS_CONTA.erroSalvar}
          </p>
        )}
        <div className="secao__duas-colunas">
          <TextField
            ref={refs.nome}
            rotulo="Nome de usuário"
            obrigatorio
            autoComplete="name"
            value={valores.nome}
            onChange={mudar("nome")}
            erro={erros.nome}
          />
          <TextField
            ref={refs.email}
            rotulo="E-mail da conta"
            obrigatorio
            type="email"
            autoComplete="email"
            value={valores.email}
            onChange={mudar("email")}
            erro={erros.email}
          />
          <PasswordField
            ref={refs.senhaAtual}
            rotulo="Senha atual"
            autoComplete="current-password"
            value={valores.senhaAtual}
            onChange={mudar("senhaAtual")}
            erro={erros.senhaAtual}
          />
          <PasswordField
            ref={refs.novaSenha}
            rotulo="Nova senha"
            autoComplete="new-password"
            placeholder="Digite a nova senha"
            value={valores.novaSenha}
            onChange={mudar("novaSenha")}
            erro={erros.novaSenha}
          />
        </div>
        <div className="secao__rodape">
          <Button type="submit">Salvar alterações</Button>
        </div>
      </form>
    </SectionCard>
  );
}
