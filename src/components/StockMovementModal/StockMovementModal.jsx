import { useEffect, useRef, useState } from "react";
import { AlertCircle } from "lucide-react";
import Modal from "../Modal/Modal.jsx";
import Button from "../Button/Button.jsx";
import Stepper from "../Stepper/Stepper.jsx";
import TextArea from "../TextArea/TextArea.jsx";
import { useStock } from "../../context/StockContext.jsx";
import { formatarMoeda } from "../../utils/formatadores.js";
import "./StockMovementModal.css";

const TEXTOS = {
  entrada: { titulo: "Adicionar Quantidade", passo: "Adicionar" },
  saida: { titulo: "Diminuir Quantidade", passo: "Diminuir" },
};

/**
 * TL13 "Adicionar Quantidade" (tipo "entrada") e TL14 "Diminuir Quantidade"
 * (tipo "saida", com justificativa obrigatória e limite do estoque).
 * Cada confirmação gera o registro no Histórico (Entrada ou Saída).
 */
export default function StockMovementModal({ tipo, produto, aoFechar }) {
  const { registrarEntrada, registrarSaida } = useStock();
  const [quantidade, setQuantidade] = useState(1);
  const [justificativa, setJustificativa] = useState("");
  const [erros, setErros] = useState({});
  const justificativaRef = useRef(null);
  const textos = TEXTOS[tipo];
  const saida = tipo === "saida";

  useEffect(() => {
    if (!produto) return;
    setQuantidade(1);
    setJustificativa("");
    setErros({});
  }, [produto]);

  const atual = produto?.quantidade ?? 0;
  const final = saida ? atual - quantidade : atual + quantidade;

  function confirmar() {
    const resultado = saida
      ? registrarSaida(produto.id, quantidade, justificativa)
      : registrarEntrada(produto.id, quantidade);
    const novosErros = resultado.erros ?? (resultado.erro ? { quantidade: resultado.erro } : null);
    if (novosErros) {
      setErros(novosErros);
      if (novosErros.quantidade) {
        document.getElementById("movimento-quantidade")?.querySelector("input")?.focus();
      } else {
        justificativaRef.current?.focus();
      }
      return;
    }
    aoFechar();
  }

  return (
    <Modal
      aberto={Boolean(produto)}
      aoFechar={aoFechar}
      titulo={textos.titulo}
      rodape={
        <>
          <Button variante="secundario" onClick={aoFechar}>
            Cancelar
          </Button>
          <Button onClick={confirmar}>Confirmar</Button>
        </>
      }
    >
      {produto && (
        <>
          <dl className="movimento__produto">
            <div>
              <dt className="sr-only">Código</dt>
              <dd>{produto.codigos?.join(", ")}</dd>
            </div>
            <div>
              <dt className="sr-only">Nome</dt>
              <dd>{produto.nome}</dd>
            </div>
            <div>
              <dt>Valor Compra</dt>
              <dd>{formatarMoeda(produto.valorCompra)}</dd>
            </div>
            <div>
              <dt>Venda (Pessoa Física)</dt>
              <dd>{formatarMoeda(produto.precoConsumidor)}</dd>
            </div>
            <div>
              <dt>Venda (Empresa)</dt>
              <dd>{formatarMoeda(produto.precoEmpresa)}</dd>
            </div>
          </dl>

          <dl className="movimento__quantidades" aria-live="polite">
            <div>
              <dt>Quantidade Atual:</dt>
              <dd>{atual}</dd>
            </div>
            <div>
              <dt>Quantidade Final:</dt>
              <dd>{final}</dd>
            </div>
          </dl>

          <div id="movimento-quantidade" className="movimento__passo">
            <Stepper
              rotulo={`${textos.passo}:`}
              variante="unitario"
              valor={quantidade}
              min={0}
              max={saida ? atual : Infinity}
              aoMudar={(valor) => {
                setQuantidade(valor);
                setErros((atuais) => ({ ...atuais, quantidade: undefined }));
              }}
            />
            {erros.quantidade && (
              <p className="campo__mensagem-erro" role="alert">
                <AlertCircle className="campo__icone-erro" aria-hidden="true" focusable="false" />
                {erros.quantidade}
              </p>
            )}
          </div>

          {saida && (
            <TextArea
              ref={justificativaRef}
              rotulo="Justificativa"
              obrigatorio
              rows={3}
              value={justificativa}
              onChange={(evento) => {
                setJustificativa(evento.target.value);
                setErros((atuais) => ({ ...atuais, justificativa: undefined }));
              }}
              erro={erros.justificativa}
            />
          )}
        </>
      )}
    </Modal>
  );
}
