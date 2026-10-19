import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import PageHeader from "../../components/PageHeader/PageHeader.jsx";
import CartSelector from "../../components/CartSelector/CartSelector.jsx";
import CartItemsTable from "../../components/CartItemsTable/CartItemsTable.jsx";
import CartTotals from "../../components/CartTotals/CartTotals.jsx";
import SelectField from "../../components/SelectField/SelectField.jsx";
import Button from "../../components/Button/Button.jsx";
import ConfirmModal from "../../components/ConfirmModal/ConfirmModal.jsx";
import PurchaseCompleteModal from "../../components/PurchaseCompleteModal/PurchaseCompleteModal.jsx";
import { useCart } from "../../context/CartContext.jsx";
import { useStock } from "../../context/StockContext.jsx";
import "./Carrinho.css";

function normalizar(texto) {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

/** TL03 Carrinho: revisar itens e valores e concluir ou excluir o carrinho. */
export default function Carrinho() {
  const navegar = useNavigate();
  const { clientes } = useStock();
  const { carrinhoAtual, itens, resumo, definirCliente, excluirCarrinho, finalizarCompra } = useCart();
  const [pesquisa, setPesquisa] = useState("");
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
  const [erro, setErro] = useState("");
  const [vendaFinalizada, setVendaFinalizada] = useState(null);

  // A pesquisa do cabeçalho filtra os itens do carrinho pelo nome do produto.
  const termo = normalizar(pesquisa);
  const itensVisiveis = termo ? itens.filter((item) => normalizar(item.produto.nome).includes(termo)) : itens;

  function finalizar() {
    const resultado = finalizarCompra();
    if (resultado.erro) {
      setErro(resultado.erro);
      return;
    }
    setErro("");
    setVendaFinalizada(resultado.venda);
  }

  function confirmarExclusao() {
    excluirCarrinho(carrinhoAtual.id);
    setConfirmandoExclusao(false);
    navegar("/");
  }

  const opcoesCliente = [
    { valor: "", rotulo: "Sem Cliente" },
    ...clientes.map((cliente) => ({ valor: cliente.id, rotulo: cliente.nome })),
  ];

  return (
    <>
      <PageHeader
        titulo="Carrinho"
        pesquisa={{
          rotulo: "Pesquisar no carrinho",
          placeholder: "",
          valor: pesquisa,
          aoMudar: setPesquisa,
        }}
        carrinho={{ ativo: true }}
      />

      <CartSelector rotulo="Trocar carrinho" />

      <section className="carrinho__itens" aria-labelledby="carrinho-titulo-lista">
        <h2 id="carrinho-titulo-lista" className="carrinho__titulo-lista">
          Carrinho ({resumo.quantidadeItens})
        </h2>
        <CartItemsTable itens={itensVisiveis} />
      </section>

      <div className="carrinho__fechamento">
        <SelectField
          className="carrinho__cliente"
          rotulo="Cliente"
          value={carrinhoAtual.clienteId ?? ""}
          onChange={(evento) => definirCliente(evento.target.value ? Number(evento.target.value) : null)}
          opcoes={opcoesCliente}
        />
        <CartTotals resumo={resumo} />
      </div>

      {erro && (
        <p className="carrinho__erro" role="alert">
          <AlertCircle className="carrinho__icone-erro" aria-hidden="true" focusable="false" />
          {erro}
        </p>
      )}

      <div className="carrinho__acoes">
        <Button variante="destrutivo" onClick={() => setConfirmandoExclusao(true)}>
          Excluir Carrinho
        </Button>
        <Button variante="secundario" onClick={() => navegar("/")}>
          Continuar comprando
        </Button>
        <Button className="carrinho__finalizar" onClick={finalizar}>
          Finalizar Compra
        </Button>
      </div>

      <ConfirmModal
        aberto={confirmandoExclusao}
        aoCancelar={() => setConfirmandoExclusao(false)}
        aoConfirmar={confirmarExclusao}
        titulo={`Tem certeza que deseja excluir o carrinho '${carrinhoAtual.nome}'? Todos os itens serão removidos.`}
        destrutivo
      />

      <PurchaseCompleteModal
        venda={vendaFinalizada}
        aoVoltarAoCatalogo={() => navegar("/")}
        aoVerNoHistorico={() => navegar("/historico")}
      />
    </>
  );
}
