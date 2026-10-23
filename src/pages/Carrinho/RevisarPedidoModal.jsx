import Modal from "../../components/Modal/Modal.jsx";
import Button from "../../components/Button/Button.jsx";
import CartTotals from "../../components/CartTotals/CartTotals.jsx";
import { formatarMoeda, formatarPercentual } from "../../utils/formatadores.js";
import "./RevisarPedidoModal.css";

/**
 * Revisão do pedido antes de concluir a venda.
 * itens: linhas já calculadas do carrinho atual.
 */
export default function RevisarPedidoModal({ aberto, cliente, itens, resumo, erro, aoVoltar, aoFinalizar }) {
  return (
    <Modal
      aberto={aberto}
      aoFechar={aoVoltar}
      titulo="Revisar pedido"
      tamanho="largo"
      focoInicial="titulo"
      mostrarFechar
      erro={erro}
      rodape={
        <>
          <Button variante="secundario" onClick={aoVoltar}>
            Voltar
          </Button>
          <Button onClick={aoFinalizar}>Finalizar Compra</Button>
        </>
      }
    >
      <div className="revisar-pedido">
        <p className="revisar-pedido__cliente">
          <span className="revisar-pedido__rotulo">Cliente</span>
          {cliente}
        </p>
        <ul className="revisar-pedido__lista">
          {itens.map((item) => (
            <li key={item.produtoId} className="revisar-pedido__item">
              <p className="revisar-pedido__nome">{item.produto.nome}</p>
              <div className="revisar-pedido__valores">
                <p>
                  <span className="revisar-pedido__rotulo">Quantidade</span>
                  {item.quantidade}
                </p>
                <p>
                  <span className="revisar-pedido__rotulo">Preço por Unidade</span>
                  {formatarMoeda(item.precoUnitario)}
                </p>
                <p>
                  <span className="revisar-pedido__rotulo">Desconto</span>
                  {formatarMoeda(item.desconto)} ({formatarPercentual(item.percentualDesconto)}%)
                </p>
                <p>
                  <span className="revisar-pedido__rotulo">Total</span>
                  {formatarMoeda(item.total)}
                </p>
              </div>
            </li>
          ))}
        </ul>
        <CartTotals resumo={resumo} />
      </div>
    </Modal>
  );
}
