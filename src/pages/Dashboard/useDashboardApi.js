import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { buscarDashboard } from "../../services/dashboard.js";
import { dashboardDaApi } from "../../utils/dashboard.js";

/*
 * Dados de vendas do Dashboard no modo API. Busca ao abrir e a cada mudança de período ou de
 * categorias; uma resposta antiga nunca substitui a de um filtro mais novo (a chamada anterior é
 * cancelada). `ativo` só liga depois que as categorias e os produtos foram carregados, porque a
 * resposta usa essas listas. Devolve { status, dados, recarregar }, com `dados` no formato de
 * `dashboardDaApi` e `status` "carregando" | "pronto" | "erro".
 */
export function useDashboardApi({ ativo, periodo, categoriaIds, categorias, produtos }) {
  const [estado, setEstado] = useState({ status: "carregando", resposta: null });
  const [tentativa, setTentativa] = useState(0);
  const selecao = categoriaIds.join(",");

  useEffect(() => {
    if (!ativo) return undefined;
    const controle = new AbortController();
    setEstado((atual) => ({ ...atual, status: "carregando" }));
    buscarDashboard(
      { inicio: periodo.inicio, fim: periodo.fim, categoriaIds, totalDeCategorias: categorias.length },
      { signal: controle.signal },
    )
      .then((resposta) => setEstado({ status: "pronto", resposta }))
      .catch((erro) => {
        if (axios.isCancel(erro)) return;
        setEstado((atual) => ({ ...atual, status: "erro" }));
      });
    return () => controle.abort();
    // `categoriaIds` entra pela chave `selecao`: a lista é recriada a cada renderização.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ativo, periodo.inicio, periodo.fim, selecao, categorias.length, tentativa]);

  const dados = useMemo(
    () => (estado.resposta ? dashboardDaApi(estado.resposta, { categorias, produtos, categoriaIds }) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [estado.resposta, categorias, produtos, selecao],
  );

  const recarregar = useCallback(() => setTentativa((numero) => numero + 1), []);
  return { status: estado.status, dados, recarregar };
}
