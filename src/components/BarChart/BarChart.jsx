import { useEffect, useRef, useState } from "react";
import { formatarMoeda } from "../../utils/formatadores.js";
import "./BarChart.css";

/* Medidas em px (o SVG é desenhado na largura real, sem escalar o texto). */
const ALTURA = 280;
const MARGEM = { topo: 28, direita: 8, base: 48, esquerda: 64 };
const LARGURA_BARRA = 24;
const RAIO = 4;
const LARGURA_MINIMA_POR_BARRA = 68;
const MARCAS_EIXO = 4;

const formatoEixo = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  notation: "compact",
  maximumFractionDigits: 1,
});

/* Passo "redondo" (1, 2 ou 5 × 10^n) para as marcas do eixo vertical. */
function passoRedondo(maximo) {
  const bruto = maximo / MARCAS_EIXO;
  const potencia = 10 ** Math.floor(Math.log10(bruto));
  const fator = [1, 2, 5, 10].find((f) => f * potencia >= bruto);
  return fator * potencia;
}

/* Barra com ponta arredondada (4 px) e base reta. */
function caminhoBarra(x, y, largura, altura) {
  const r = Math.min(RAIO, altura, largura / 2);
  return [
    `M${x},${y + altura}`,
    `V${y + r}`,
    `Q${x},${y} ${x + r},${y}`,
    `H${x + largura - r}`,
    `Q${x + largura},${y} ${x + largura},${y + r}`,
    `V${y + altura}`,
    "Z",
  ].join(" ");
}

/* Quebra o nome da categoria em até duas linhas. */
function linhasDoRotulo(texto, maximoCaracteres) {
  if (texto.length <= maximoCaracteres) return [texto];
  const palavras = texto.split(" ");
  const primeira = [];
  while (palavras.length && [...primeira, palavras[0]].join(" ").length <= maximoCaracteres) {
    primeira.push(palavras.shift());
  }
  if (primeira.length === 0) primeira.push(palavras.shift());
  const resto = palavras.join(" ");
  return resto ? [primeira.join(" "), resto.length > maximoCaracteres ? `${resto.slice(0, maximoCaracteres - 1)}…` : resto] : [primeira.join(" ")];
}

function useLargura() {
  const ref = useRef(null);
  const [largura, setLargura] = useState(0);
  useEffect(() => {
    if (!ref.current) return undefined;
    const observador = new ResizeObserver(([entrada]) => setLargura(entrada.contentRect.width));
    observador.observe(ref.current);
    return () => observador.disconnect();
  }, []);
  return [ref, largura];
}

/**
 * Gráfico de barras verticais (valor em reais sobre cada barra, categoria no eixo).
 * dados: [{ id, nome, valor, indiceCor }] — cor = `--cor-grafico-{indiceCor}`.
 * O SVG é decorativo para leitores de tela: a tabela equivalente fica ao lado.
 */
export default function BarChart({ dados, legendaTabela }) {
  const [conteinerRef, larguraConteiner] = useLargura();
  const largura = Math.max(
    larguraConteiner,
    MARGEM.esquerda + MARGEM.direita + dados.length * LARGURA_MINIMA_POR_BARRA,
  );

  const maximo = Math.max(...dados.map((item) => item.valor), 0);
  const passo = maximo > 0 ? passoRedondo(maximo) : 1;
  const topoEixo = passo * Math.max(1, Math.ceil(maximo / passo));
  const alturaUtil = ALTURA - MARGEM.topo - MARGEM.base;
  const larguraUtil = largura - MARGEM.esquerda - MARGEM.direita;
  const faixa = larguraUtil / Math.max(dados.length, 1);
  const y = (valor) => MARGEM.topo + alturaUtil - (valor / topoEixo) * alturaUtil;
  const marcas = Array.from({ length: Math.round(topoEixo / passo) + 1 }, (_, i) => i * passo);
  const caracteresPorLinha = Math.max(6, Math.floor(faixa / 7));

  const resumo = `${legendaTabela}: ${dados.map((item) => `${item.nome}, ${formatarMoeda(item.valor)}`).join("; ")}.`;

  return (
    <figure className="grafico-barras">
      <figcaption className="sr-only">{resumo}</figcaption>
      <div ref={conteinerRef} className="grafico-barras__rolagem">
        {larguraConteiner > 0 && (
          <svg
            className="grafico-barras__svg"
            width={largura}
            height={ALTURA}
            viewBox={`0 0 ${largura} ${ALTURA}`}
            aria-hidden="true"
            focusable="false"
          >
            {marcas.map((marca) => (
              <g key={marca}>
                <line
                  className={marca === 0 ? "grafico-barras__base" : "grafico-barras__grade"}
                  x1={MARGEM.esquerda}
                  x2={largura - MARGEM.direita}
                  y1={y(marca)}
                  y2={y(marca)}
                />
                <text className="grafico-barras__eixo" x={MARGEM.esquerda - 8} y={y(marca)} dy="0.32em">
                  {formatoEixo.format(marca)}
                </text>
              </g>
            ))}

            {dados.map((item, indice) => {
              const centro = MARGEM.esquerda + faixa * indice + faixa / 2;
              const topo = y(item.valor);
              const altura = MARGEM.topo + alturaUtil - topo;
              return (
                <g key={item.id} className="grafico-barras__item">
                  <title>{`${item.nome}: ${formatarMoeda(item.valor)}`}</title>
                  {/* Área de hover maior que a barra */}
                  <rect
                    className="grafico-barras__alvo"
                    x={centro - faixa / 2}
                    y={MARGEM.topo}
                    width={faixa}
                    height={alturaUtil}
                  />
                  <path
                    className="grafico-barras__barra"
                    style={{ fill: `var(--cor-grafico-${item.indiceCor})` }}
                    d={caminhoBarra(centro - LARGURA_BARRA / 2, topo, LARGURA_BARRA, altura)}
                  />
                  <text className="grafico-barras__valor" x={centro} y={topo - 8}>
                    {formatarMoeda(item.valor)}
                  </text>
                  {linhasDoRotulo(item.nome, caracteresPorLinha).map((linha, i) => (
                    <text
                      key={linha}
                      className="grafico-barras__categoria"
                      x={centro}
                      y={ALTURA - MARGEM.base + 18 + i * 16}
                    >
                      {linha}
                    </text>
                  ))}
                </g>
              );
            })}
          </svg>
        )}
      </div>

      <table className="sr-only">
        <caption>{legendaTabela}</caption>
        <thead>
          <tr>
            <th scope="col">Categoria</th>
            <th scope="col">Faturado</th>
          </tr>
        </thead>
        <tbody>
          {dados.map((item) => (
            <tr key={item.id}>
              <td>{item.nome}</td>
              <td>{formatarMoeda(item.valor)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
