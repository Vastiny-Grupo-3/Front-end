import { CheckCircle2 } from "lucide-react";
import Modal from "../Modal/Modal.jsx";
import Button from "../Button/Button.jsx";
import { formatarId, formatarMoeda } from "../../utils/formatadores.js";
import "./PurchaseCompleteModal.css";

/**
 * TL19 Compra Finalizada. "Voltar ao catálogo" e Esc levam ao Catálogo;
 * "Ver no histórico" leva ao Histórico de Vendas.
 */
export default function PurchaseCompleteModal({ venda, aoVoltarAoCatalogo, aoVerNoHistorico }) {
  return (
    <Modal
      aberto={Boolean(venda)}
      aoFechar={aoVoltarAoCatalogo}
      titulo={
        <span className="compra-finalizada__titulo">
          <CheckCircle2 className="compra-finalizada__icone" aria-hidden="true" focusable="false" />
          Compra finalizada
        </span>
      }
      tamanho="pequeno"
      focoInicial="titulo"
      rodape={
        <>
          <Button variante="secundario" onClick={aoVerNoHistorico}>
            Ver no histórico
          </Button>
          <Button onClick={aoVoltarAoCatalogo}>Voltar ao catálogo</Button>
        </>
      }
    >
      {venda && (
        <>
          <p className="compra-finalizada__texto">A venda foi registrada e o estoque foi atualizado.</p>
          <dl className="compra-finalizada__resumo">
            <div>
              <dt>Transação:</dt>
              <dd>{formatarId(venda.id)}</dd>
            </div>
            <div>
              <dt>Cliente:</dt>
              <dd>{venda.clienteNome ?? "Sem Cliente"}</dd>
            </div>
            <div>
              <dt>Qtd. Produtos:</dt>
              <dd>{venda.quantidadeProdutos}</dd>
            </div>
            <div>
              <dt>Total Final:</dt>
              <dd>{formatarMoeda(venda.valor)}</dd>
            </div>
            <div>
              <dt>Lucro:</dt>
              <dd>{formatarMoeda(venda.lucro)}</dd>
            </div>
          </dl>
        </>
      )}
    </Modal>
  );
}
