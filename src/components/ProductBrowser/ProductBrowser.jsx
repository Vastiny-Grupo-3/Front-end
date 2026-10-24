import { useMemo, useRef, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import Button from "../Button/Button.jsx";
import FilterModal from "../FilterModal/FilterModal.jsx";
import FilterChips from "../FilterChips/FilterChips.jsx";
import ProductCard from "../ProductCard/ProductCard.jsx";
import EmptyState from "../EmptyState/EmptyState.jsx";
import { useStock } from "../../context/StockContext.jsx";
import {
  FILTROS_PADRAO,
  MENSAGENS_FILTROS,
  filtrarProdutos,
  listarFiltrosAtivos,
  temFiltrosAtivos,
} from "../../utils/filtros.js";
import { nomeCategoria } from "../../utils/estoque.js";
import "./ProductBrowser.css";

const ERRO_CARREGAR = "Não conseguimos carregar os produtos. Verifique sua conexão e tente novamente.";
const CARDS_ESQUELETO = 6;

/**
 * Botão "Filtros" (TL17), etiquetas dos filtros ativos e grade de cards
 * (Catálogo, Entrada e Saída), com os estados carregando, vazio e erro.
 *
 * pesquisa: texto do campo de pesquisa do cabeçalho
 * variante: "catalogo" | "entrada" | "saida" (ProductCard)
 * propsDoCard(produto): props de ação do card (aoAdicionar, aoEditar…)
 * mostrarCarrinho / estaNoCarrinho: seção "Carrinho" do filtro (só Catálogo)
 * mostrarReposicao: opção "Precisam de reposição" (Entrada e Saída)
 */
export default function ProductBrowser({
  pesquisa,
  variante,
  propsDoCard,
  mostrarCarrinho = false,
  estaNoCarrinho,
  mostrarReposicao = false,
}) {
  const stock = useStock();
  const { produtos, categorias, status, recarregar } = stock;
  const [filtros, setFiltros] = useState(FILTROS_PADRAO);
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);
  const botaoFiltrosRef = useRef(null);

  const visiveis = useMemo(
    () => filtrarProdutos(produtos, { pesquisa, filtros, estaNoCarrinho }),
    [produtos, pesquisa, filtros, estaNoCarrinho],
  );
  const etiquetas = listarFiltrosAtivos(filtros, categorias);

  function conteudo() {
    if (status === "carregando") {
      return (
        <div className="produtos__grade" aria-busy="true">
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
      <ul className="produtos__grade">
        {visiveis.map((produto) => (
          <li key={produto.id}>
            <ProductCard
              produto={{ ...produto, categoria: nomeCategoria(stock, produto.categoriaId) }}
              variante={variante}
              {...propsDoCard(produto)}
            />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <>
      <div className="produtos__filtros">
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
        mostrarCarrinho={mostrarCarrinho}
        mostrarReposicao={mostrarReposicao}
      />
    </>
  );
}
