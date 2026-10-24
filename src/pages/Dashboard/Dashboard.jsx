import { useMemo, useState } from "react";
import {
  AlertTriangle,
  BadgeDollarSign,
  Calendar,
  Filter,
  Package,
  Receipt,
  ShoppingBag,
  TrendingUp,
  Wallet,
} from "lucide-react";
import PageHeader from "../../components/PageHeader/PageHeader.jsx";
import Tabs from "../../components/Tabs/Tabs.jsx";
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
import EstoqueFiltroModal from "./EstoqueFiltroModal.jsx";
import { useStock } from "../../context/StockContext.jsx";
import {
  ESTADOS_ESTOQUE,
  MAXIMO_PRODUTOS,
  MENSAGENS_DASHBOARD,
  calcularIndicadores,
  categoriasMaisVendidas,
  diasNoPeriodo,
  gravidadeDoEstado,
  niveisDeEstoque,
  periodoPadrao,
  resumoEstoque,
  produtosMaisVendidos,
  textoDiasFiltrados,
} from "../../utils/dashboard.js";
import { nomeCategoria, textoFaixa } from "../../utils/estoque.js";
import { formatarData, formatarMoeda, hojeIso } from "../../utils/formatadores.js";
import "./Dashboard.css";

const ERRO = "Não conseguimos carregar as informações. Verifique sua conexão e tente novamente.";
const TITULO_PRODUTOS = `Top ${MAXIMO_PRODUTOS} Produtos mais Vendidos`;

const ABAS = [
  { id: "vendas", rotulo: "Vendas", cor: "var(--cor-aba-vendas)" },
  { id: "estoque", rotulo: "Estoque", cor: "var(--cor-aba-cadastro-produtos)" },
];

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
  const todas = () => categorias.map((categoria) => categoria.id);
  const [categoriaIds, setCategoriaIds] = useState(todas);
  const [categoriaEstoqueIds, setCategoriaEstoqueIds] = useState(todas);
  const [estadoEstoque, setEstadoEstoque] = useState(ESTADOS_ESTOQUE);
  const [aba, setAba] = useState("vendas");
  const [modal, setModal] = useState(null); // "periodo" | "categoria" | "estoque" | null

  const todasIds = categorias.map((categoria) => categoria.id);
  const indicadores = calcularIndicadores({ vendas, produtos, ...periodo, categoriaIds });
  const vendasNoPeriodo = calcularIndicadores({ vendas, produtos, ...periodo, categoriaIds: todasIds }).vendas;
  const barras = categoriasMaisVendidas({ vendas, categorias, ...periodo, categoriaIds: todasIds });
  const maisVendidos = produtosMaisVendidos({ vendas, ...periodo, categoriaIds });
  const produtosEstoque = useMemo(
    () =>
      produtos.filter(
        (produto) =>
          categoriaEstoqueIds.includes(produto.categoriaId) && estadoEstoque.includes(produto.estado),
      ),
    [produtos, categoriaEstoqueIds, estadoEstoque],
  );
  const estoque = useMemo(() => niveisDeEstoque(produtos), [produtos]);
  const estoqueResumo = useMemo(() => resumoEstoque(produtos), [produtos]);

  const carregando = status === "carregando";
  const comErro = status === "erro";
  const semVendas = indicadores.vendas === 0;
  const semVendasNoPeriodo = vendasNoPeriodo === 0;
  const todasCategorias = categoriaIds.length === categorias.length;
  const todoEstoque = categoriaEstoqueIds.length === categorias.length;
  const todosEstados = estadoEstoque.length === ESTADOS_ESTOQUE.length;

  function escolherCategoria(id) {
    setCategoriaIds((atual) => (atual.length === 1 && atual[0] === id ? todasIds : [id]));
    document.getElementById("painel-produtos")?.closest("section")?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }

  function escolherEstado(estado) {
    setEstadoEstoque((atual) =>
      atual.length === 1 && atual[0] === estado ? [...ESTADOS_ESTOQUE] : [estado],
    );
    document.getElementById("painel-estoque")?.closest("section")?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }

  const estadoIndicador = carregando ? "carregando" : comErro ? "erro" : "padrao";
  const textoPeriodo = `${textoDiasFiltrados(diasNoPeriodo(periodo.inicio, periodo.fim))}: ${formatarData(periodo.inicio)} a ${formatarData(periodo.fim)}`;

  function conteudoVendas(conteudo, { vazio = semVendas } = {}) {
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
    if (vazio) return <EmptyState mensagem={MENSAGENS_DASHBOARD.semVendas} />;
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
    { chave: "quantidade", titulo: "Qtd. Vendidas" },
    { chave: "faturado", titulo: "Faturado", renderizar: (l) => formatarMoeda(l.faturado) },
    { chave: "lucro", titulo: "Lucro", renderizar: (l) => formatarMoeda(l.lucro) },
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
    { chave: "quantidade", titulo: "Estoque atual", ordenavel: true },
    {
      chave: "faixa",
      titulo: "Faixa de estoque",
      ordenavel: true,
      valorOrdenacao: (linha) => linha.faixa?.bom ?? -1,
      renderizar: (linha) =>
        linha.faixa ? (
          <span className="dashboard__faixa">
            {textoFaixa(linha.faixa)}
            <span className="dashboard__faixa-origem">
              {linha.faixaOrigem === "propria" ? "(própria)" : "(da categoria)"}
            </span>
          </span>
        ) : (
          "—"
        ),
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
        subtitulo={
          aba === "vendas" ? "Resumo do Negócio - Período Selecionado" : "Situação atual do estoque"
        }
        acao={
          aba === "vendas" || !todoEstoque || !todosEstados ? (
          <div className="dashboard__acao">
            <p className="dashboard__filtros-ativos" aria-live="polite">
              {aba === "vendas" ? (
                <>
                  <span>{textoPeriodo}</span>
                  {!todasCategorias && (
                    <span>
                      Categoria:{" "}
                      {categoriaIds.length > 0
                        ? categorias.filter((c) => categoriaIds.includes(c.id)).map((c) => c.nome).join(", ")
                        : "—"}
                    </span>
                  )}
                </>
              ) : (
                <>
                  {!todoEstoque && (
                    <span>
                      Categoria:{" "}
                      {categoriaEstoqueIds.length > 0
                        ? categorias.filter((c) => categoriaEstoqueIds.includes(c.id)).map((c) => c.nome).join(", ")
                        : "—"}
                    </span>
                  )}
                  {!todosEstados && (
                    <span>
                      Estado:{" "}
                      {ESTADOS_ESTOQUE.filter((estado) => estadoEstoque.includes(estado)).join(", ") || "—"}
                    </span>
                  )}
                </>
              )}
            </p>
            {aba === "vendas" && (
              <Button variante="secundario" icone={Calendar} onClick={() => setModal("periodo")}>
                Filtro Temporal
              </Button>
            )}
          </div>
          ) : null
        }
      />

      <Tabs className="dashboard__abas" rotulo="Dashboards" abas={ABAS} abaAtiva={aba} aoMudar={setAba}>
        {aba === "vendas" ? (
          <>
            <div className="dashboard__indicadores">
              <StatCard
                rotulo="Vendas no período"
                valor={indicadores.vendas}
                icone={ShoppingBag}
                estado={estadoIndicador}
              />
              <StatCard
                rotulo="Faturamento do período"
                valor={formatarMoeda(indicadores.faturamento)}
                icone={BadgeDollarSign}
                estado={estadoIndicador}
              />
              <StatCard
                rotulo="Lucro no período"
                valor={formatarMoeda(indicadores.lucro)}
                icone={TrendingUp}
                estado={estadoIndicador}
              />
              <StatCard
                rotulo="Preço médio das vendas"
                valor={indicadores.precoMedio != null ? formatarMoeda(indicadores.precoMedio) : null}
                icone={Receipt}
                estado={estadoIndicador === "padrao" && indicadores.precoMedio == null ? "vazio" : estadoIndicador}
              />
            </div>

            <div className="dashboard__linha">
              <Painel id="painel-categorias" titulo="Categorias mais vendidas">
                {conteudoVendas(
                  <BarChart
                    dados={barras}
                    legendaTabela="Categorias mais vendidas"
                    selecionadas={todasCategorias ? [] : categoriaIds}
                    aoEscolher={escolherCategoria}
                  />,
                  { vazio: semVendasNoPeriodo },
                )}
              </Painel>

              <Painel
                id="painel-produtos"
                titulo={TITULO_PRODUTOS}
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
                    legenda={TITULO_PRODUTOS}
                    colunas={colunasMaisVendidos}
                    linhas={maisVendidos.map((linha, indice) => ({ ...linha, posicao: indice + 1 }))}
                    mensagemVazio={
                      todasCategorias
                        ? "Nenhum registro por aqui ainda."
                        : "Nenhum produto encontrado com esses filtros. Tente remover algum deles."
                    }
                  />,
                  { vazio: semVendasNoPeriodo },
                )}
              </Painel>
            </div>
          </>
        ) : (
          <>
            <div className="dashboard__indicadores dashboard__indicadores--tres">
              <StatCard
                rotulo="Produtos ativos"
                valor={estoque.total}
                icone={Package}
                estado={estadoIndicador}
              />
              <StatCard
                rotulo="Precisam de reposição"
                valor={estoqueResumo.reposicao}
                icone={AlertTriangle}
                estado={estadoIndicador}
              />
              <StatCard
                rotulo="Custo em estoque"
                valor={formatarMoeda(estoqueResumo.custo)}
                icone={Wallet}
                estado={estadoIndicador}
              />
            </div>

            <div className="dashboard__linha">
              <Painel id="painel-niveis" className="dashboard__painel--centro" titulo="Níveis de Estoque Atual">
                {carregando ? (
                  <span className="esqueleto dashboard__esqueleto" aria-hidden="true" />
                ) : (
                  <DonutChart
                    niveis={estoque.niveis}
                    total={estoque.total}
                    legendaTabela="Níveis de Estoque Atual"
                    estadosSelecionados={todosEstados ? [] : estadoEstoque}
                    aoEscolherEstado={escolherEstado}
                  />
                )}
              </Painel>

              <Painel
                id="painel-estoque"
                titulo="Estoque"
                acao={
                  <Button
                    variante="icone"
                    icone={Filter}
                    aria-label="Filtrar estoque"
                    onClick={() => setModal("estoque")}
                  />
                }
              >
                <DataTable
                  className="dashboard__tabela"
                  legenda="Estoque"
                  colunas={colunasEstoque}
                  linhas={produtosEstoque}
                  estado={carregando || comErro ? status : "padrao"}
                  aoTentarNovamente={recarregar}
                  mensagemVazio={
                    todoEstoque && todosEstados
                      ? "Nenhum registro por aqui ainda."
                      : "Nenhum produto encontrado com esses filtros. Tente remover algum deles."
                  }
                />
              </Painel>
            </div>
          </>
        )}
      </Tabs>

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
      <EstoqueFiltroModal
        aberto={modal === "estoque"}
        categorias={categorias}
        categoriasSelecionadas={categoriaEstoqueIds}
        aoMudarCategorias={setCategoriaEstoqueIds}
        estadosSelecionados={estadoEstoque}
        aoMudarEstados={setEstadoEstoque}
        aoFechar={() => setModal(null)}
      />
    </>
  );
}
