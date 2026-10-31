import { useEffect, useRef, useState } from "react";
import Modal from "../../components/Modal/Modal.jsx";
import Button from "../../components/Button/Button.jsx";
import TextField from "../../components/TextField/TextField.jsx";
import TextArea from "../../components/TextArea/TextArea.jsx";
import SelectField from "../../components/SelectField/SelectField.jsx";
import { useStock } from "../../context/StockContext.jsx";
import { TIPOS_CLIENTE, TIPO_CLIENTE_PADRAO } from "../../utils/estoque.js";

const ERRO_SALVAR = "Não conseguimos salvar. Verifique sua conexão e tente novamente.";
const VAZIO = { nome: "", telefone: "", tipo: TIPO_CLIENTE_PADRAO, descricao: "" };

/**
 * TL05 — "Cadastrar Novo Cliente" (sem `cliente`) ou "Editar dados do cliente".
 * Nome e Telefone obrigatórios (RF12); o foco vai para o primeiro campo inválido.
 */
export default function ClienteFormModal({ aberto, cliente, aoFechar }) {
  const { cadastrarCliente, editarCliente } = useStock();
  const [valores, setValores] = useState(VAZIO);
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState("");
  const [enviando, setEnviando] = useState(false);
  const nomeRef = useRef(null);
  const telefoneRef = useRef(null);
  const editando = Boolean(cliente);

  useEffect(() => {
    if (!aberto) return;
    setValores(
      cliente
        ? {
            nome: cliente.nome,
            telefone: cliente.telefone,
            tipo: cliente.tipo ?? TIPO_CLIENTE_PADRAO,
            descricao: cliente.descricao ?? "",
          }
        : VAZIO,
    );
    setErros({});
    setErroGeral("");
  }, [aberto, cliente]);

  function mudar(campo) {
    return (evento) => {
      setValores((atuais) => ({ ...atuais, [campo]: evento.target.value }));
      if (erros[campo]) setErros((atuais) => ({ ...atuais, [campo]: undefined }));
    };
  }

  async function confirmar(evento) {
    evento.preventDefault();
    if (enviando) return;
    setEnviando(true);
    setErroGeral("");
    let resultado;
    try {
      resultado = await (editando ? editarCliente(cliente.id, valores) : cadastrarCliente(valores));
    } catch {
      setEnviando(false);
      setErroGeral(ERRO_SALVAR);
      return;
    }
    setEnviando(false);
    if (resultado.erros) {
      setErros(resultado.erros);
      (resultado.erros.nome ? nomeRef : telefoneRef).current?.focus();
      return;
    }
    aoFechar();
  }

  const idFormulario = "formulario-cliente";

  return (
    <Modal
      aberto={aberto}
      aoFechar={aoFechar}
      titulo={editando ? "Editar dados do cliente" : "Cadastrar Novo Cliente"}
      erro={erroGeral}
      rodape={
        <>
          <Button variante="secundario" onClick={aoFechar}>
            Cancelar
          </Button>
          <Button type="submit" form={idFormulario} carregando={enviando}>
            Confirmar
          </Button>
        </>
      }
    >
      <form id={idFormulario} className="cliente-formulario" onSubmit={confirmar} noValidate>
        <TextField
          ref={nomeRef}
          rotulo="Nome"
          obrigatorio
          autoComplete="off"
          value={valores.nome}
          onChange={mudar("nome")}
          erro={erros.nome}
        />
        <TextField
          ref={telefoneRef}
          rotulo="Telefone"
          type="tel"
          obrigatorio
          autoComplete="off"
          value={valores.telefone}
          onChange={mudar("telefone")}
          erro={erros.telefone}
        />
        <SelectField
          rotulo="Tipo de cliente"
          obrigatorio
          value={valores.tipo}
          onChange={mudar("tipo")}
          opcoes={TIPOS_CLIENTE.map((tipo) => ({ valor: tipo.valor, rotulo: tipo.rotulo }))}
        />
        <TextArea rotulo="Descrição" value={valores.descricao} onChange={mudar("descricao")} />
      </form>
    </Modal>
  );
}
