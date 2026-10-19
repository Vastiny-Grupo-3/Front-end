import Modal from "../../components/Modal/Modal.jsx";
import Button from "../../components/Button/Button.jsx";

/** TL05 — "Detalhes": todas as informações do cliente, com "X", "Fechar" e Esc. */
export default function ClienteDetalhesModal({ cliente, aoFechar }) {
  return (
    <Modal
      aberto={Boolean(cliente)}
      aoFechar={aoFechar}
      titulo="Detalhes"
      focoInicial="titulo"
      mostrarFechar
      rodape={
        <>
          <span />
          <Button variante="secundario" onClick={aoFechar}>
            Fechar
          </Button>
        </>
      }
    >
      {cliente && (
        <>
          <h3 className="cliente-detalhes__nome">{cliente.nome}</h3>
          <dl className="cliente-detalhes">
            <div>
              <dt>Nome</dt>
              <dd>{cliente.nome}</dd>
            </div>
            <div>
              <dt>Telefone</dt>
              <dd>{cliente.telefone}</dd>
            </div>
            <div>
              <dt>Qtd. Compras</dt>
              <dd>{cliente.compras}</dd>
            </div>
            <div>
              <dt>Descrição</dt>
              <dd>{cliente.descricao || "—"}</dd>
            </div>
          </dl>
        </>
      )}
    </Modal>
  );
}
