import { formatarMoeda, formatarPercentual } from "../../utils/formatadores.js";
import "./CartTotals.css";

/**
 * Resumo financeiro do carrinho: Subtotal · Descontos (somente leitura, R$ e %) · Total Final.
 * resumo: resultado de calcularTotais
 */
export default function CartTotals({ resumo }) {
  return (
    <dl className="totais-carrinho">
      <div className="totais-carrinho__item">
        <dt>Subtotal:</dt>
        <dd>{formatarMoeda(resumo.subtotal)}</dd>
      </div>
      <div className="totais-carrinho__item totais-carrinho__item--descontos">
        <dt>Descontos:</dt>
        <dd className="totais-carrinho__descontos">
          {formatarMoeda(resumo.descontos)} ({formatarPercentual(resumo.percentualDescontos)}%)
        </dd>
      </div>
      <div className="totais-carrinho__item totais-carrinho__item--final">
        <dt>Total Final:</dt>
        <dd>{formatarMoeda(resumo.totalFinal)}</dd>
      </div>
    </dl>
  );
}
