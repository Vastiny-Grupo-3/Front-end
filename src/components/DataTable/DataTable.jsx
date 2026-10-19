import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import Button from "../Button/Button.jsx";
import EmptyState from "../EmptyState/EmptyState.jsx";
import "./DataTable.css";

const MENSAGEM_ERRO =
  "Não conseguimos carregar as informações. Verifique sua conexão e tente novamente.";
const LINHAS_ESQUELETO = 3;

const comparadorTexto = new Intl.Collator("pt-BR", { numeric: true, sensitivity: "base" });

function comparar(a, b) {
  if (typeof a === "number" && typeof b === "number") return a - b;
  return comparadorTexto.compare(String(a ?? ""), String(b ?? ""));
}

const ARIA_SORT = { asc: "ascending", desc: "descending" };

/**
 * Tabela de dados. Em telas estreitas cada linha vira um cartão "rótulo: valor".
 *
 * colunas: [{ chave, titulo, renderizar?(linha), ordenavel?, valorOrdenacao?(linha), alinhamento? }]
 * estado: "padrao" | "carregando" | "erro"
 * variante: "padrao" | "conteiner" (histórico, raio-16)
 * corFundo: cor do contêiner (ex.: "var(--cor-aba-vendas)")
 */
export default function DataTable({
  legenda,
  legendaOculta = true,
  colunas,
  linhas = [],
  chaveLinha = "id",
  estado = "padrao",
  mensagemVazio = "Nenhum registro por aqui ainda.",
  aoTentarNovamente,
  linhaSelecionada,
  variante = "padrao",
  corFundo,
  className = "",
}) {
  const [ordem, setOrdem] = useState({ chave: null, direcao: "asc" });

  const linhasOrdenadas = useMemo(() => {
    const coluna = colunas.find((item) => item.chave === ordem.chave);
    if (!coluna) return linhas;
    const valor = coluna.valorOrdenacao ?? ((linha) => linha[coluna.chave]);
    const fator = ordem.direcao === "asc" ? 1 : -1;
    return [...linhas].sort((a, b) => comparar(valor(a), valor(b)) * fator);
  }, [linhas, colunas, ordem]);

  function ordenarPor(chave) {
    setOrdem((atual) => ({
      chave,
      direcao: atual.chave === chave && atual.direcao === "asc" ? "desc" : "asc",
    }));
  }

  function chaveDe(linha) {
    return typeof chaveLinha === "function" ? chaveLinha(linha) : linha[chaveLinha];
  }

  const classes = [
    "tabela",
    `tabela--${variante}`,
    corFundo ? "tabela--colorida" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={classes}
      style={corFundo ? { "--tabela-fundo": corFundo } : undefined}
      aria-busy={estado === "carregando" || undefined}
    >
      <div className="tabela__rolagem">
        <table className="tabela__tabela">
          <caption className={legendaOculta ? "sr-only" : "tabela__legenda"}>{legenda}</caption>
          <thead>
            <tr>
              {colunas.map((coluna) => {
                const ativa = ordem.chave === coluna.chave;
                const IconeOrdem = !ativa ? ArrowUpDown : ordem.direcao === "asc" ? ArrowUp : ArrowDown;
                return (
                  <th
                    key={coluna.chave}
                    scope="col"
                    className={coluna.alinhamento === "direita" ? "tabela__celula--direita" : undefined}
                    aria-sort={coluna.ordenavel ? (ativa ? ARIA_SORT[ordem.direcao] : "none") : undefined}
                  >
                    {coluna.ordenavel ? (
                      <button
                        type="button"
                        className="tabela__ordenar"
                        onClick={() => ordenarPor(coluna.chave)}
                      >
                        {coluna.titulo}
                        <IconeOrdem className="tabela__icone-ordem" aria-hidden="true" focusable="false" />
                      </button>
                    ) : (
                      coluna.titulo
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {estado === "carregando" &&
              Array.from({ length: LINHAS_ESQUELETO }, (_, indice) => (
                <tr key={`esqueleto-${indice}`} className="tabela__linha">
                  {colunas.map((coluna) => (
                    <td key={coluna.chave} data-rotulo={coluna.titulo}>
                      <span className="esqueleto tabela__esqueleto" />
                    </td>
                  ))}
                </tr>
              ))}

            {estado === "erro" && (
              <tr className="tabela__linha-mensagem">
                <td colSpan={colunas.length}>
                  <EmptyState mensagem={MENSAGEM_ERRO} className="tabela__mensagem">
                    {aoTentarNovamente && (
                      <Button variante="secundario" onClick={aoTentarNovamente}>
                        Tentar novamente
                      </Button>
                    )}
                  </EmptyState>
                </td>
              </tr>
            )}

            {estado === "padrao" && linhasOrdenadas.length === 0 && (
              <tr className="tabela__linha-mensagem">
                <td colSpan={colunas.length}>
                  <EmptyState mensagem={mensagemVazio} className="tabela__mensagem" />
                </td>
              </tr>
            )}

            {estado === "padrao" &&
              linhasOrdenadas.map((linha) => {
                const chave = chaveDe(linha);
                const selecionada = linhaSelecionada !== undefined && chave === linhaSelecionada;
                return (
                  <tr
                    key={chave}
                    className={`tabela__linha ${selecionada ? "tabela__linha--selecionada" : ""}`.trim()}
                  >
                    {colunas.map((coluna) => (
                      <td
                        key={coluna.chave}
                        data-rotulo={coluna.titulo}
                        className={coluna.alinhamento === "direita" ? "tabela__celula--direita" : undefined}
                      >
                        {coluna.renderizar ? coluna.renderizar(linha) : linha[coluna.chave]}
                      </td>
                    ))}
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
