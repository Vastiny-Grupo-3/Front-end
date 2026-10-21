import { BadgeDollarSign, Package, ShoppingCart } from "lucide-react";
import Button from "../Button/Button.jsx";
import { formatarMoeda } from "../../utils/formatadores.js";
import "./CartSummary.css";

/**
 * Faixa de resumo do carrinho (Catálogo): carrinho atual, valor total,
 * quantidade de produtos e "Alterar carrinho".
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
          <span className="resumo-carrinho__icone" aria-hidden="true">
            <ShoppingCart />
          </span>
          <div>
            <dt>Carrinho Atual</dt>
            <dd>{nome}</dd>
          </div>
        </div>
        <div className="resumo-carrinho__item resumo-carrinho__item--total">
          <span className="resumo-carrinho__icone" aria-hidden="true">
            <BadgeDollarSign />
          </span>
          <div>
            <dt>Valor Total</dt>
            <dd>{formatarMoeda(valorTotal)}</dd>
          </div>
        </div>
        <div className="resumo-carrinho__item">
          <span className="resumo-carrinho__icone" aria-hidden="true">
            <Package />
          </span>
          <div>
            <dt>Quantidade de Produtos</dt>
            <dd>{quantidadeProdutos}</dd>
          </div>
        </div>
      </dl>
      <Button variante="secundario" onClick={aoAlterar}>
        Alterar carrinho
      </Button>
    </section>
  );
}
