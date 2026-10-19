import { useMemo, useState } from "react";
import { Calendar, Filter } from "lucide-react";
import PageHeader from "../../components/PageHeader/PageHeader.jsx";
import Button from "../../components/Button/Button.jsx";
import StatCard from "../../components/StatCard/StatCard.jsx";
import DataTable from "../../components/DataTable/DataTable.jsx";
import StatusBadge from "../../components/StatusBadge/StatusBadge.jsx";
import EmptyState from "../../components/EmptyState/EmptyState.jsx";
import ProductCell from "../../components/ProductCell/ProductCell.jsx";
import BarChart from "../../components/BarChart/BarChart.jsx";
import DonutChart from "../../components/DonutChart/DonutChart.jsx";
import PeriodoModal from "./PeriodoModal.jsx";
import CategoriaModal from "./CategoriaModal.jsx";
import { useStock } from "../../context/StockContext.jsx";
import {
  MENSAGENS_DASHBOARD,
  calcularIndicadores,
  categoriasMaisVendidas,
  diasNoPeriodo,
  gravidadeDoEstado,
  niveisDeEstoque,
  periodoPadrao,
  produtosMaisVendidos,
  textoDiasFiltrados,
} from "../../utils/dashboard.js";
import { nomeCategoria } from "../../utils/estoque.js";
import { formatarData, formatarMoeda, hojeIso } from "../../utils/formatadores.js";
import "./Dashboard.css";

const ERRO = "Não conseguimos carregar as informações. Verifique sua conexão e tente novamente.";

function Painel({ id, titulo, acao, children, className = "" }) {
  return (
    <section className={`dashboard__painel ${className}`.trim()} aria-labelledby={id}>
      <div className="dashboard__cabecalho-painel">
        <h2 id={id} className="dashboard__titulo-painel">
          {titulo}
        </h2>
        {acao}
      </div>
      {children}
    </section>
  );
}

/** TL12 Dashboard: indicadores, vendas por categoria e produto, e estoque. */
export default function Dashboard() {
  const stock = useStock();
  const { vendas, produtos, categorias, status, recarregar } = stock;
  const [periodo, setPeriodo] = useState(() => periodoPadrao(vendas, hojeIso()));
  const [categoriaIds, setCategoriaIds] = useState(() => categorias.map((categoria) => categoria.id));
  const [modal, setModal] = useState(null); // "periodo" | "categoria" | null

  const filtros = { ...periodo, categoriaIds };
  const indicadores = calcularIndicadores({ vendas, produtos, ...filtros });
  const barras = categoriasMaisVendidas({ vendas, categorias, ...filtros });
  const maisVendidos = produtosMaisVendidos({ vendas, ...filtros });
  const estoque = useMemo(() => niveisDeEstoque(produtos), [produtos]);

  const carregando = status === "carregando";
  const comErro = status === "erro";
  const semVendas = indicadores.vendas === 0;
  const todasCategorias = categoriaIds.length === categorias.length;

  const estadoIndicador = carregando ? "carregando" : comErro ? "erro" : "padrao";
  const textoPeriodo = `${textoDiasFiltrados(diasNoPeriodo(periodo.inicio, periodo.fim))}: ${formatarData(periodo.inicio)} a ${formatarData(periodo.fim)}`;

  function conteudoVendas(conteudo) {
    if (carregando) return <span className="esqueleto dashboard__esqueleto" aria-hidden="true" />;
    if (comErro) {
      return (
        <EmptyState mensagem={ERRO}>
          <Button variante="secundario" onClick={recarregar}>
            Tentar novamente
          </Button>
        </EmptyState>
      );
    }
    if (semVendas) return <EmptyState mensagem={MENSAGENS_DASHBOARD.semVendas} />;
    return conteudo;
  }

  const colunasMaisVendidos = [
    { chave: "posicao", titulo: "#" },
    {
      chave: "produto",
      titulo: "Produto",
      renderizar: (linha) => <ProductCell nome={linha.nome} codigo={linha.codigo} imagem={linha.imagem} />,
    },
    {
      chave: "categoria",
      titulo: "Categoria",
      renderizar: (linha) => nomeCategoria(stock, linha.categoriaId) || linha.categoria,
    },
    { chave: "quantidade", titulo: "Qtd. Vendidas", alinhamento: "direita" },
    { chave: "faturado", titulo: "Faturado", alinhamento: "direita", renderizar: (l) => formatarMoeda(l.faturado) },
    { chave: "lucro", titulo: "Lucro", alinhamento: "direita", renderizar: (l) => formatarMoeda(l.lucro) },
  ];

  const colunasEstoque = [
    {
      chave: "nome",
      titulo: "Produto",
      ordenavel: true,
      renderizar: (linha) => <ProductCell nome={linha.nome} codigo={linha.codigo} imagem={linha.imagem} />,
    },
    {
      chave: "categoria",
      titulo: "Categoria",
      ordenavel: true,
      valorOrdenacao: (linha) => nomeCategoria(stock, linha.categoriaId),
      renderizar: (linha) => nomeCategoria(stock, linha.categoriaId),
    },
    { chave: "quantidade", titulo: "Estoque atual", ordenavel: true, alinhamento: "direita" },
    {
      chave: "estoqueMinimo",
      titulo: "Mínimo",
      ordenavel: true,
      alinhamento: "direita",
      valorOrdenacao: (linha) => linha.estoqueMinimo ?? -1,
      renderizar: (linha) => linha.estoqueMinimo ?? "—",
    },
    {
      chave: "estado",
      titulo: "Estado",
      ordenavel: true,
      valorOrdenacao: (linha) => gravidadeDoEstado(linha.estado),
      renderizar: (linha) => (linha.estado ? <StatusBadge estado={linha.estado} /> : "—"),
    },
  ];

  return (
    <>
      <PageHeader
        titulo="Dashboard"
        subtitulo="Resumo do Negócio - Período Selecionado"
        acao={
          <Button variante="secundario" icone={Calendar} onClick={() => setModal("periodo")}>
            Filtro Temporal
          </Button>
        }
      />

      <p className="dashboard__filtros-ativos" aria-live="polite">
        <span>{textoPeriodo}</span>
        {!todasCategorias && (
          <span>
            Categoria:{" "}
            {categoriaIds.length > 0
              ? categorias.filter((c) => categoriaIds.includes(c.id)).map((c) => c.nome).join(", ")
              : "—"}
          </span>
        )}
      </p>

      <div className="dashboard__indicadores">
        <StatCard rotulo="Vendas no período" valor={indicadores.vendas} estado={estadoIndicador} />
        <StatCard
          rotulo="Faturamento do período"
          valor={formatarMoeda(indicadores.faturamento)}
          estado={estadoIndicador}
        />
        <StatCard
          rotulo="Preço médio das vendas"
          valor={indicadores.precoMedio != null ? formatarMoeda(indicadores.precoMedio) : null}
          estado={estadoIndicador === "padrao" && indicadores.precoMedio == null ? "vazio" : estadoIndicador}
        />
        <StatCard rotulo="Produtos ativos" valor={indicadores.produtosAtivos} estado={estadoIndicador} />
      </div>

      <div className="dashboard__linha">
        <Painel id="painel-categorias" titulo="Categorias mais vendidas">
          {conteudoVendas(<BarChart dados={barras} legendaTabela="Categorias mais vendidas" />)}
        </Painel>

        <Painel
          id="painel-produtos"
          titulo="Produtos mais Vendidos"
          acao={
            <Button
              variante="icone"
              icone={Filter}
              aria-label="Filtrar por categoria"
              onClick={() => setModal("categoria")}
            />
          }
        >
          {conteudoVendas(
            <DataTable
              className="dashboard__tabela"
              legenda="Produtos mais Vendidos"
              colunas={colunasMaisVendidos}
              linhas={maisVendidos.map((linha, indice) => ({ ...linha, posicao: indice + 1 }))}
            />,
          )}
        </Painel>
      </div>

      <hr className="dashboard__divisoria" />

      <div className="dashboard__linha">
        <Painel id="painel-estoque" titulo="Estoque">
          <DataTable
            className="dashboard__tabela"
            legenda="Estoque"
            colunas={colunasEstoque}
            linhas={produtos}
            estado={carregando || comErro ? status : "padrao"}
            aoTentarNovamente={recarregar}
          />
        </Painel>

        <Painel id="painel-niveis" titulo="Níveis de Estoque Atual">
          {carregando ? (
            <span className="esqueleto dashboard__esqueleto" aria-hidden="true" />
          ) : (
            <DonutChart niveis={estoque.niveis} total={estoque.total} legendaTabela="Níveis de Estoque Atual" />
          )}
        </Painel>
      </div>

      <PeriodoModal
        aberto={modal === "periodo"}
        periodo={periodo}
        aoConfirmar={setPeriodo}
        aoFechar={() => setModal(null)}
      />
      <CategoriaModal
        aberto={modal === "categoria"}
        categorias={categorias}
        selecionadas={categoriaIds}
        aoMudar={setCategoriaIds}
        aoFechar={() => setModal(null)}
      />
    </>
  );
}
