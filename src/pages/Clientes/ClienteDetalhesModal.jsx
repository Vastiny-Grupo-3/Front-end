import { useNavigate } from "react-router-dom";
import { Paperclip } from "lucide-react";
import Modal from "../../components/Modal/Modal.jsx";
import Button from "../../components/Button/Button.jsx";
import { formatarData, formatarId } from "../../utils/formatadores.js";

/** TL05 — "Detalhes": todas as informações do cliente, com "X", "Fechar" e Esc. */
export default function ClienteDetalhesModal({ cliente, aoFechar }) {
  const navegar = useNavigate();

  function irParaHistorico() {
    const clienteId = cliente?.id;
    aoFechar();
    navegar("/historico/clientes", { state: { clienteId } });
  }
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
              <dt>Id Cliente</dt>
              <dd>{formatarId(cliente.id)}</dd>
            </div>
            <div>
              <dt>Nome</dt>
              <dd>{cliente.nome}</dd>
            </div>
            <div>
              <dt>Telefone</dt>
              <dd>{cliente.telefone}</dd>
            </div>
            <div>
              <dt>Dt. Cadastro</dt>
              <dd>{cliente.dataCadastro ? formatarData(cliente.dataCadastro) : "—"}</dd>
            </div>
            <div>
              <dt>Qtd. Compras</dt>
              <dd className="cliente-detalhes__compras">
                <span>{cliente.compras}</span>
                <Button
                  variante="icone"
                  className="botao--leve cliente-detalhes__historico"
                  icone={Paperclip}
                  aria-label={`Ver histórico de compras de ${cliente.nome}`}
                  onClick={irParaHistorico}
                />
              </dd>
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
