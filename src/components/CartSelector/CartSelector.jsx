import { Plus } from "lucide-react";
import SelectField from "../SelectField/SelectField.jsx";
import Button from "../Button/Button.jsx";
import { useCart } from "../../context/CartContext.jsx";
import "./CartSelector.css";

/**
 * Seletor de carrinho: lista para trocar o carrinho atual e "+" para criar um novo.
 * `rotulo` segue a copy de cada tela ("Trocar Carrinho" no TL02, "Trocar carrinho" no TL03).
 */
export default function CartSelector({ rotulo }) {
  const { carrinhos, carrinhoAtual, trocarCarrinho, criarCarrinho } = useCart();
  return (
    <div className="seletor-carrinho">
      <SelectField
        className="seletor-carrinho__lista"
        rotulo={rotulo}
        value={carrinhoAtual.id}
        onChange={(evento) => trocarCarrinho(Number(evento.target.value))}
        opcoes={carrinhos.map((item) => ({ valor: item.id, rotulo: item.nome }))}
      />
      <Button variante="icone" icone={Plus} aria-label="Novo carrinho" onClick={criarCarrinho} />
    </div>
  );
}
