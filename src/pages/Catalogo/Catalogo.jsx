import { useMemo, useRef, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import PageHeader from "../../components/PageHeader/PageHeader.jsx";
import CartSummary from "../../components/CartSummary/CartSummary.jsx";
import Button from "../../components/Button/Button.jsx";
import FilterModal from "../../components/FilterModal/FilterModal.jsx";
import FilterChips from "../../components/FilterChips/FilterChips.jsx";
import ProductCard from "../../components/ProductCard/ProductCard.jsx";
import EmptyState from "../../components/EmptyState/EmptyState.jsx";
import { useStock } from "../../context/StockContext.jsx";
import { useCart } from "../../context/CartContext.jsx";
import {
  FILTROS_PADRAO,
  MENSAGENS_FILTROS,
  filtrarProdutos,
  listarFiltrosAtivos,
  temFiltrosAtivos,
} from "../../utils/filtros.js";
import { nomeCategoria } from "../../utils/estoque.js";
import "./Catalogo.css";

const ERRO_CARREGAR = "Não conseguimos carregar os produtos. Verifique sua conexão e tente novamente.";
const CARDS_ESQUELETO = 6;

/** TL01 Catálogo: produtos disponíveis para adicionar ao carrinho. */
export default function Catalogo() {
  const stock = useStock();
  const { produtos, categorias, status, recarregar } = stock;
  const { carrinhoAtual, resumo, estaNoCarrinho, adicionarProduto, removerProduto, abrirModal } =
    useCart();
  const [pesquisa, setPesquisa] = useState("");
  const [filtros, setFiltros] = useState(FILTROS_PADRAO);
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);
  const botaoFiltrosRef = useRef(null);

  const visiveis = useMemo(
    () => filtrarProdutos(produtos, { pesquisa, filtros, estaNoCarrinho }),
    [produtos, pesquisa, filtros, estaNoCarrinho],
  );
  const etiquetas = listarFiltrosAtivos(filtros, categorias);
  const carregando = status === "carregando";

  function conteudo() {
    if (carregando) {
      return (
        <div className="catalogo__grade" aria-busy="true">
          {Array.from({ length: CARDS_ESQUELETO }, (_, indice) => (
            <ProductCard key={indice} carregando />
          ))}
        </div>
      );
    }
    if (status === "erro") {
      return (
        <EmptyState mensagem={ERRO_CARREGAR}>
          <Button variante="secundario" onClick={recarregar}>
            Tentar novamente
          </Button>
        </EmptyState>
      );
    }
    if (visiveis.length === 0) {
      return (
        <EmptyState
          mensagem={
            temFiltrosAtivos(filtros)
              ? MENSAGENS_FILTROS.semResultadoFiltros
              : MENSAGENS_FILTROS.semResultadoPesquisa
          }
        />
      );
    }
    return (
      <ul className="catalogo__grade">
        {visiveis.map((produto) => (
          <li key={produto.id}>
            <ProductCard
              produto={{ ...produto, categoria: nomeCategoria(stock, produto.categoriaId) }}
              noCarrinho={estaNoCarrinho(produto.id)}
              aoAdicionar={() => adicionarProduto(produto.id)}
              aoRemover={() => removerProduto(produto.id)}
            />
          </li>
        ))}
      </ul>
    );
  }

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
        carregando={carregando}
      />

      <div className="catalogo__filtros">
        <Button
          ref={botaoFiltrosRef}
          variante="secundario"
          icone={SlidersHorizontal}
          onClick={() => setFiltrosAbertos(true)}
        >
          Filtros
        </Button>
        <FilterChips etiquetas={etiquetas} aoRemover={setFiltros} focoAoEsvaziar={botaoFiltrosRef} />
      </div>

      {conteudo()}

      <FilterModal
        aberto={filtrosAbertos}
        aoFechar={() => setFiltrosAbertos(false)}
        filtros={filtros}
        aoAplicar={setFiltros}
        categorias={categorias}
        mostrarCarrinho
      />
    </>
  );
}
