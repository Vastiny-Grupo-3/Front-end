import { useState } from "react";
import PageHeader from "../../components/PageHeader/PageHeader.jsx";
import Button from "../../components/Button/Button.jsx";
import ProductBrowser from "../../components/ProductBrowser/ProductBrowser.jsx";
import StockMovementModal from "../../components/StockMovementModal/StockMovementModal.jsx";
import ProdutoFormModal from "./ProdutoFormModal.jsx";
import "./Entrada.css";

/** TL13 Entrada: cadastrar produto, editar e adicionar quantidade ao estoque. */
export default function Entrada() {
  const [pesquisa, setPesquisa] = useState("");
  // modal: { tipo: "novo" | "editar" | "adicionar", produto? } | null
  const [modal, setModal] = useState(null);
  const fechar = () => setModal(null);

  return (
    <>
      <PageHeader
        titulo="Entrada"
        pesquisa={{
          rotulo: "Pesquisar produtos",
          placeholder: "Pesquisar produtos",
          valor: pesquisa,
          aoMudar: setPesquisa,
        }}
        acao={
          <Button className="entrada__cadastrar" onClick={() => setModal({ tipo: "novo" })}>
            Cadastrar Novo Produto
          </Button>
        }
      />

      <ProductBrowser
        pesquisa={pesquisa}
        variante="entrada"
        mostrarReposicao
        propsDoCard={(produto) => ({
          aoEditar: () => setModal({ tipo: "editar", produto }),
          aoAdicionarQtd: () => setModal({ tipo: "adicionar", produto }),
        })}
      />

      <ProdutoFormModal
        aberto={modal?.tipo === "novo" || modal?.tipo === "editar"}
        produto={modal?.tipo === "editar" ? modal.produto : null}
        aoFechar={fechar}
      />
      <StockMovementModal
        tipo="entrada"
        produto={modal?.tipo === "adicionar" ? modal.produto : null}
        aoFechar={fechar}
      />
    </>
  );
}
