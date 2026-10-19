import { useId, useState } from "react";
import { MoreHorizontal } from "lucide-react";
import DataTable from "../DataTable/DataTable.jsx";
import Button from "../Button/Button.jsx";
import HistoryDetailsModal from "../HistoryDetailsModal/HistoryDetailsModal.jsx";
import "./HistoryTable.css";

const VAZIO = "Nenhum registro por aqui ainda.";

/**
 * Tabela de histórico (as seis abas), no contêiner com a cor da aba,
 * com o botão "…" que abre o painel de detalhes.
 * aba: configuração de abasHistorico.js
 */
export default function HistoryTable({ aba, linhas, estado = "padrao", aoTentarNovamente }) {
  const base = useId();
  const [selecionada, setSelecionada] = useState(null);
  const idIdentificador = (linha) => `${base}-linha-${linha.id}`;

  const colunas = [
    ...aba.colunas.map((coluna, indice) =>
      indice === 0
        ? {
            ...coluna,
            renderizar: (linha) => (
              <span id={idIdentificador(linha)}>
                {coluna.renderizar ? coluna.renderizar(linha) : linha[coluna.chave]}
              </span>
            ),
          }
        : coluna,
    ),
    {
      chave: "detalhes",
      titulo: <span className="sr-only">Detalhes</span>,
      rotulo: "Detalhes",
      renderizar: (linha) => (
        <Button
          variante="icone"
          icone={MoreHorizontal}
          aria-label="Ver detalhes"
          aria-describedby={idIdentificador(linha)}
          onClick={() => setSelecionada(linha)}
        />
      ),
    },
  ];

  return (
    <>
      <DataTable
        className="historico-tabela"
        legenda={aba.rotulo}
        colunas={colunas}
        linhas={linhas}
        estado={estado}
        aoTentarNovamente={aoTentarNovamente}
        mensagemVazio={VAZIO}
        variante="conteiner"
        corFundo={aba.cor}
        linhaSelecionada={selecionada?.id}
      />
      <HistoryDetailsModal
        titulo={selecionada ? `Detalhes: ${aba.identificador(selecionada)}` : ""}
        detalhes={selecionada ? aba.detalhes(selecionada) : null}
        aoFechar={() => setSelecionada(null)}
      />
    </>
  );
}
