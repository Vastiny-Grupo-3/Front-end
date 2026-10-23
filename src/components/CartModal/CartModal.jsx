import { useNavigate } from "react-router-dom";
import Modal from "../Modal/Modal.jsx";
import Button from "../Button/Button.jsx";
import CartSelector from "../CartSelector/CartSelector.jsx";
import CartItemsTable from "../CartItemsTable/CartItemsTable.jsx";
import CartTotals from "../CartTotals/CartTotals.jsx";
import { useCart } from "../../context/CartContext.jsx";
import "./CartModal.css";

/**
 * TL02 Modal do Carrinho (grande). "X" e Esc voltam à tela que o abriu;
 * "Ir para Carrinho" abre a tela inteira (TL03).
 */
export default function CartModal() {
  const navegar = useNavigate();
  const { modalAberto, fecharModal, carrinhoAtual, resumo } = useCart();

  function irParaCarrinho() {
    fecharModal();
    navegar("/carrinho");
  }

  return (
    <Modal
      aberto={modalAberto}
      aoFechar={fecharModal}
      titulo={carrinhoAtual.nome}
      tituloOculto
      tamanho="grande"
      mostrarFechar
    >
      <div className="modal-carrinho__acoes">
        <CartSelector rotulo="Trocar Carrinho" />
      </div>
      <CartItemsTable />
      <div className="modal-carrinho__rodape">
        <CartTotals resumo={resumo} />
        <Button onClick={irParaCarrinho}>Ir para Carrinho</Button>
      </div>
    </Modal>
  );
}
