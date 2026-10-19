import { useEffect, useRef, useState } from "react";
import Modal from "../../components/Modal/Modal.jsx";
import Button from "../../components/Button/Button.jsx";
import TextField from "../../components/TextField/TextField.jsx";
import PasswordField from "../../components/PasswordField/PasswordField.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";

const VAZIO = { nome: "", email: "", senha: "", confirmacao: "" };
const ORDEM_CAMPOS = ["nome", "email", "senha", "confirmacao"];

/**
 * TL16 — "Cadastrar nova conta". Todas as contas têm o mesmo acesso.
 * Ao cadastrar, o modal fecha e aparece o toast "Conta cadastrada com sucesso.".
 */
export default function CadastroContaModal({ aberto, aoFechar }) {
  const { cadastrarConta } = useAuth();
  const { mostrarToast } = useToast();
  const [valores, setValores] = useState(VAZIO);
  const [erros, setErros] = useState({});
  const refs = { nome: useRef(null), email: useRef(null), senha: useRef(null), confirmacao: useRef(null) };

  useEffect(() => {
    if (!aberto) return;
    setValores(VAZIO);
    setErros({});
  }, [aberto]);

  function mudar(campo) {
    return (evento) => {
      setValores((atuais) => ({ ...atuais, [campo]: evento.target.value }));
      if (erros[campo]) setErros((atuais) => ({ ...atuais, [campo]: undefined }));
    };
  }

  function cadastrar(evento) {
    evento.preventDefault();
    const resultado = cadastrarConta(valores);
    if (resultado.erros) {
      setErros(resultado.erros);
      refs[ORDEM_CAMPOS.find((campo) => resultado.erros[campo])]?.current?.focus();
      return;
    }
    aoFechar();
    mostrarToast({ variante: "sucesso", mensagem: "Conta cadastrada com sucesso." });
  }

  const idFormulario = "formulario-nova-conta";

  return (
    <Modal
      aberto={aberto}
      aoFechar={aoFechar}
      titulo="Cadastrar nova conta"
      subtitulo="Preencha os campos abaixo para cadastrar um novo usuário."
      tamanho="largo"
      mostrarFechar
      rodapeADireita
      rodape={
        <>
          <Button variante="secundario" onClick={aoFechar}>
            Cancelar
          </Button>
          <Button type="submit" form={idFormulario} className="nova-conta__cadastrar">
            Cadastrar conta
          </Button>
        </>
      }
    >
      <form id={idFormulario} className="nova-conta" onSubmit={cadastrar} noValidate>
        <div className="secao__duas-colunas">
          <TextField
            ref={refs.nome}
            rotulo="Nome de usuário"
            obrigatorio
            autoComplete="off"
            placeholder="Digite o nome completo"
            value={valores.nome}
            onChange={mudar("nome")}
            erro={erros.nome}
          />
          <TextField
            ref={refs.email}
            rotulo="E-mail da conta"
            type="email"
            obrigatorio
            autoComplete="off"
            placeholder="exemplo@email.com"
            value={valores.email}
            onChange={mudar("email")}
            erro={erros.email}
          />
          <PasswordField
            ref={refs.senha}
            rotulo="Senha"
            obrigatorio
            autoComplete="new-password"
            placeholder="Crie uma senha"
            ajuda="A senha deve atender aos requisitos de segurança definidos pelo sistema."
            value={valores.senha}
            onChange={mudar("senha")}
            erro={erros.senha}
          />
          <PasswordField
            ref={refs.confirmacao}
            rotulo="Confirmar senha"
            obrigatorio
            autoComplete="new-password"
            placeholder="Digite novamente a senha"
            value={valores.confirmacao}
            onChange={mudar("confirmacao")}
            erro={erros.confirmacao}
          />
        </div>
        <div className="nova-conta__acesso">
          <h3 className="nova-conta__titulo-acesso">Acesso</h3>
          <p className="nova-conta__texto">A nova conta poderá acessar as funcionalidades do sistema.</p>
        </div>
      </form>
    </Modal>
  );
}
