import { formatarMoeda } from "../../utils/formatadores.js";
import "./CartSummary.css";

/**
 * Faixa de resumo do carrinho (Catálogo): carrinho atual, valor total,
 * quantidade de produtos e "Alterar carrinho" alinhado à direita.
 */
export default function CartSummary({ nome, valorTotal, quantidadeProdutos, aoAlterar, carregando = false }) {
  if (carregando) {
    return (
      <div className="resumo-carrinho" aria-busy="true">
        {[1, 2, 3].map((item) => (
          <span key={item} className="esqueleto resumo-carrinho__esqueleto" />
        ))}
      </div>
    );
  }

  return (
    <section className="resumo-carrinho" aria-label="Resumo do carrinho">
      <dl className="resumo-carrinho__dados">
        <div className="resumo-carrinho__item">
          <dt>Carrinho Atual:</dt>
          <dd>{nome}</dd>
        </div>
        <div className="resumo-carrinho__item">
          <dt>Valor Total:</dt>
          <dd>{formatarMoeda(valorTotal)}</dd>
        </div>
        <div className="resumo-carrinho__item">
          <dt>Quantidade de Produtos:</dt>
          <dd>{quantidadeProdutos}</dd>
        </div>
      </dl>
      <button type="button" className="resumo-carrinho__alterar" onClick={aoAlterar}>
        Alterar carrinho
      </button>
    </section>
  );
}
