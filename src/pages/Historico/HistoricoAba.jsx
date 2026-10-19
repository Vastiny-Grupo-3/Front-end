import { useOutletContext } from "react-router-dom";
import HistoryTable from "../../components/HistoryTable/HistoryTable.jsx";
import { useStock } from "../../context/StockContext.jsx";
import { ABAS_HISTORICO, pesquisarNaAba } from "./abasHistorico.js";

/** Conteúdo de uma aba do Histórico, filtrado pela pesquisa do cabeçalho. */
export default function HistoricoAba({ id }) {
  const dados = useStock();
  const { pesquisa } = useOutletContext();
  const aba = ABAS_HISTORICO.find((item) => item.id === id);
  const linhas = pesquisarNaAba(aba, aba.linhas(dados), pesquisa);
  const estado = dados.status === "carregando" || dados.status === "erro" ? dados.status : "padrao";

  return <HistoryTable aba={aba} linhas={linhas} estado={estado} aoTentarNovamente={dados.recarregar} />;
}
