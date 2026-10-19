import Modal from "../Modal/Modal.jsx";
import Button from "../Button/Button.jsx";
import "./ConfirmModal.css";

/**
 * Confirmação de ação (ex.: exclusão). Modal pequeno com foco inicial no título.
 * `destrutivo` usa a variante destrutiva no botão de confirmação.
 */
export default function ConfirmModal({
  aberto,
  aoCancelar,
  aoConfirmar,
  titulo,
  mensagem,
  rotuloConfirmar = "Confirmar",
  rotuloCancelar = "Cancelar",
  destrutivo = false,
  carregando = false,
  erro,
  children,
}) {
  return (
    <Modal
      aberto={aberto}
      aoFechar={carregando ? undefined : aoCancelar}
      titulo={titulo}
      tamanho="pequeno"
      focoInicial="titulo"
      erro={erro}
      rodape={
        <>
          <Button variante="secundario" onClick={aoCancelar} disabled={carregando}>
            {rotuloCancelar}
          </Button>
          <Button
            variante={destrutivo ? "destrutivo" : "primario"}
            onClick={aoConfirmar}
            carregando={carregando}
          >
            {rotuloConfirmar}
          </Button>
        </>
      }
    >
      {mensagem && <p className="confirmacao__mensagem">{mensagem}</p>}
      {children}
    </Modal>
  );
}
