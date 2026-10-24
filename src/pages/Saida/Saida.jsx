import { useState } from "react";
import PageHeader from "../../components/PageHeader/PageHeader.jsx";
import ProductBrowser from "../../components/ProductBrowser/ProductBrowser.jsx";
import StockMovementModal from "../../components/StockMovementModal/StockMovementModal.jsx";

/** TL14 Saída: dar baixa no estoque com justificativa (motivos que não são venda). */
export default function Saida() {
  const [pesquisa, setPesquisa] = useState("");
  const [produto, setProduto] = useState(null);

  return (
    <>
      <PageHeader
        titulo="Saída"
        pesquisa={{
          rotulo: "Pesquisar produtos",
          placeholder: "Pesquisar produtos",
          valor: pesquisa,
          aoMudar: setPesquisa,
        }}
      />

      <ProductBrowser
        pesquisa={pesquisa}
        variante="saida"
        mostrarReposicao
        propsDoCard={(item) => ({ aoDarBaixa: () => setProduto(item) })}
      />

      <StockMovementModal tipo="saida" produto={produto} aoFechar={() => setProduto(null)} />
    </>
  );
}
