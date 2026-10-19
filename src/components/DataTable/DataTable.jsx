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

function rotuloDaCelula(coluna) {
  return typeof coluna.titulo === "string" ? coluna.titulo : (coluna.rotulo ?? "");
}

/**
 * Tabela de dados. Em telas estreitas cada linha vira um cartão "rótulo: valor".
 *
 * colunas: [{ chave, titulo, rotulo?, renderizar?(linha), ordenavel?, valorOrdenacao?(linha), alinhamento? }]
 *   `rotulo` (texto) substitui `titulo` no modo cartão quando o título não é texto.
 *   `largura` (ex.: "25%") fixa a largura da coluna no modo tabela.
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
        {/* Papéis explícitos: no modo cartão (display: block) a tabela continua sendo tabela */}
        <table className="tabela__tabela" role="table">
          <caption className={legendaOculta ? "sr-only" : "tabela__legenda"}>{legenda}</caption>
          <thead role="rowgroup">
            <tr role="row">
              {colunas.map((coluna) => {
                const ativa = ordem.chave === coluna.chave;
                const IconeOrdem = !ativa ? ArrowUpDown : ordem.direcao === "asc" ? ArrowUp : ArrowDown;
                return (
                  <th
                    key={coluna.chave}
                    scope="col"
                    role="columnheader"
                    style={coluna.largura ? { width: coluna.largura } : undefined}
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
          <tbody role="rowgroup">
            {estado === "carregando" &&
              Array.from({ length: LINHAS_ESQUELETO }, (_, indice) => (
                <tr key={`esqueleto-${indice}`} className="tabela__linha" role="row">
                  {colunas.map((coluna) => (
                    <td key={coluna.chave} role="cell" data-rotulo={rotuloDaCelula(coluna)}>
                      <span className="esqueleto tabela__esqueleto" />
                    </td>
                  ))}
                </tr>
              ))}

            {estado === "erro" && (
              <tr className="tabela__linha-mensagem" role="row">
                <td colSpan={colunas.length} role="cell">
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
              <tr className="tabela__linha-mensagem" role="row">
                <td colSpan={colunas.length} role="cell">
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
                    role="row"
                  >
                    {colunas.map((coluna) => (
                      <td
                        key={coluna.chave}
                        role="cell"
                        data-rotulo={rotuloDaCelula(coluna)}
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
