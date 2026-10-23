import { useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import HistoryTable from "../../components/HistoryTable/HistoryTable.jsx";
import { useStock } from "../../context/StockContext.jsx";
import { resumirVendasPorCliente } from "../../utils/estoque.js";
import { ABAS_HISTORICO, pesquisarNaAba } from "./abasHistorico.js";

/** Linha do Histórico de Clientes para abrir o detalhe, mesmo sem compras. */
function linhaDoCliente(dados, clienteId) {
  const existente = resumirVendasPorCliente(dados).find((linha) => linha.clienteId === clienteId);
  if (existente) return { ...existente, id: existente.clienteId };
  const cliente = dados.clientes.find((atual) => atual.id === clienteId);
  if (!cliente) return null;
  return {
    id: cliente.id,
    clienteId: cliente.id,
    nome: cliente.nome,
    quantidadeVendas: 0,
    valorTotal: 0,
    lucroTotal: 0,
    vendas: [],
  };
}

/** Conteúdo de uma aba do Histórico, filtrado pela pesquisa do cabeçalho. */
export default function HistoricoAba({ id }) {
  const dados = useStock();
  const { pesquisa, clienteId } = useOutletContext();
  const aba = ABAS_HISTORICO.find((item) => item.id === id);
  const linhas = pesquisarNaAba(aba, aba.linhas(dados), pesquisa);
  const linhaInicial = useMemo(() => {
    if (aba.id !== "clientes" || clienteId == null) return null;
    return linhaDoCliente(dados, clienteId);
  }, [aba.id, clienteId, dados]);
  const estado = dados.status === "carregando" || dados.status === "erro" ? dados.status : "padrao";

  return (
    <HistoryTable
      aba={aba}
      linhas={linhas}
      estado={estado}
      aoTentarNovamente={dados.recarregar}
      linhaInicial={linhaInicial}
    />
  );
}
