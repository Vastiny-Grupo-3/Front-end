import { useState } from "react";
import PageHeader from "../../components/PageHeader/PageHeader.jsx";
import CartSummary from "../../components/CartSummary/CartSummary.jsx";
import ProductBrowser from "../../components/ProductBrowser/ProductBrowser.jsx";
import { useStock } from "../../context/StockContext.jsx";
import { useCart } from "../../context/CartContext.jsx";

/** TL01 Catálogo: produtos disponíveis para adicionar ao carrinho. */
export default function Catalogo() {
  const { status } = useStock();
  const {
    carrinhoAtual,
    resumo,
    estaNoCarrinho,
    adicionarProduto,
    removerProduto,
    alterarQuantidade,
    abrirModal,
  } = useCart();
  const [pesquisa, setPesquisa] = useState("");

  return (
    <>
      <PageHeader
        titulo="Catálogo"
        pesquisa={{
          rotulo: "Pesquisar produtos",
          placeholder: "Pesquisar produtos",
          valor: pesquisa,
          aoMudar: setPesquisa,
        }}
        carrinho={{}}
      />

      <CartSummary
        nome={carrinhoAtual.nome}
        valorTotal={resumo.totalFinal}
        quantidadeProdutos={resumo.quantidadeProdutos}
        aoAlterar={abrirModal}
        carregando={status === "carregando"}
      />

      <ProductBrowser
        pesquisa={pesquisa}
        variante="catalogo"
        mostrarCarrinho
        estaNoCarrinho={estaNoCarrinho}
        propsDoCard={(produto) => ({
          noCarrinho: estaNoCarrinho(produto.id),
          quantidadeNoCarrinho:
            carrinhoAtual.itens.find((item) => item.produtoId === produto.id)?.quantidade ?? 0,
          aoAdicionar: () => adicionarProduto(produto.id),
          aoRemover: () => removerProduto(produto.id),
          aoAlterarQuantidade: (quantidade) => alterarQuantidade(produto.id, quantidade),
        })}
      />
    </>
  );
}
