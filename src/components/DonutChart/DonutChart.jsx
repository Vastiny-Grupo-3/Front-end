import { useId } from "react";
import { formatarPercentual } from "../../utils/formatadores.js";
import "./DonutChart.css";

const TAMANHO = 200;
const RAIO_EXTERNO = 96;
const RAIO_INTERNO = 62;
const CENTRO = TAMANHO / 2;

/*
 * Cada nível tem cor (token de estado) e um padrão de forma próprio, para
 * não depender só da cor. As formas usam cor-texto sobre fundos claros
 * (Médio, Ruim) e cor-superficie sobre fundos escuros (Bom, Crítico).
 */
const ESTILOS = {
  Bom: { cor: "var(--cor-sucesso)", tinta: "var(--cor-superficie)", forma: "quadrado" },
  Médio: { cor: "var(--cor-estado-medio)", tinta: "var(--cor-texto)", forma: "circulo" },
  Ruim: { cor: "var(--cor-alerta)", tinta: "var(--cor-texto)", forma: "losango" },
  Crítico: { cor: "var(--cor-erro)", tinta: "var(--cor-superficie)", forma: "triangulo" },
};

function Forma({ forma, tinta, x, y, r }) {
  if (forma === "quadrado") return <rect x={x - r} y={y - r} width={r * 2} height={r * 2} fill={tinta} />;
  if (forma === "circulo") return <circle cx={x} cy={y} r={r} fill={tinta} />;
  if (forma === "losango") {
    return <path d={`M${x},${y - r * 1.3} L${x + r * 1.3},${y} L${x},${y + r * 1.3} L${x - r * 1.3},${y} Z`} fill={tinta} />;
  }
  return <path d={`M${x},${y - r * 1.3} L${x + r * 1.3},${y + r} L${x - r * 1.3},${y + r} Z`} fill={tinta} />;
}

function Padrao({ id, estilo }) {
  return (
    <pattern id={id} width="10" height="10" patternUnits="userSpaceOnUse">
      <rect width="10" height="10" fill={estilo.cor} />
      <Forma forma={estilo.forma} tinta={estilo.tinta} x={5} y={5} r={1.6} />
    </pattern>
  );
}

function ponto(angulo, raio) {
  return [CENTRO + raio * Math.sin(angulo), CENTRO - raio * Math.cos(angulo)];
}

/* Setor de anel entre dois ângulos (radianos, a partir do topo, sentido horário). */
function caminhoSetor(inicio, fim) {
  const grande = fim - inicio > Math.PI ? 1 : 0;
  const [x1, y1] = ponto(inicio, RAIO_EXTERNO);
  const [x2, y2] = ponto(fim, RAIO_EXTERNO);
  const [x3, y3] = ponto(fim, RAIO_INTERNO);
  const [x4, y4] = ponto(inicio, RAIO_INTERNO);
  return [
    `M${x1},${y1}`,
    `A${RAIO_EXTERNO},${RAIO_EXTERNO} 0 ${grande} 1 ${x2},${y2}`,
    `L${x3},${y3}`,
    `A${RAIO_INTERNO},${RAIO_INTERNO} 0 ${grande} 0 ${x4},${y4}`,
    "Z",
  ].join(" ");
}

/**
 * Gráfico de rosca dos níveis de estoque, com "Total Produto" no centro e legenda
 * com quantidade e percentual. Tabela equivalente para leitores de tela.
 * niveis: [{ estado, quantidade, percentual }], total
 */
export default function DonutChart({ niveis, total, legendaTabela }) {
  const base = useId().replace(/:/g, "");
  const idPadrao = (estado) => `${base}-padrao-${ESTILOS[estado].forma}`;
  const comValor = niveis.filter((nivel) => nivel.quantidade > 0);

  let acumulado = 0;
  const setores = comValor.map((nivel) => {
    const inicio = (acumulado / total) * 2 * Math.PI;
    acumulado += nivel.quantidade;
    // Um setor de 100% vira dois meios, porque um arco não fecha um círculo inteiro.
    const fim = (acumulado / total) * 2 * Math.PI - (comValor.length === 1 ? 0.0001 : 0);
    return { ...nivel, inicio, fim };
  });

  const resumo = `${legendaTabela}: Total Produto ${total}; ${niveis
    .map((nivel) => `${nivel.estado}, ${nivel.quantidade} (${formatarPercentual(nivel.percentual)}%)`)
    .join("; ")}.`;

  return (
    <figure className="rosca">
      <figcaption className="sr-only">{resumo}</figcaption>
      <svg
        className="rosca__svg"
        width={TAMANHO}
        height={TAMANHO}
        viewBox={`0 0 ${TAMANHO} ${TAMANHO}`}
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          {niveis.map((nivel) => (
            <Padrao key={nivel.estado} id={idPadrao(nivel.estado)} estilo={ESTILOS[nivel.estado]} />
          ))}
        </defs>
        {total === 0 && (
          <circle className="rosca__vazio" cx={CENTRO} cy={CENTRO} r={(RAIO_EXTERNO + RAIO_INTERNO) / 2} />
        )}
        {setores.map((setor) => (
          <path
            key={setor.estado}
            className={`rosca__setor ${setor.estado === "Médio" ? "rosca__setor--contorno" : ""}`.trim()}
            d={caminhoSetor(setor.inicio, setor.fim)}
            fill={`url(#${idPadrao(setor.estado)})`}
          >
            <title>{`${setor.estado}: ${setor.quantidade} (${formatarPercentual(setor.percentual)}%)`}</title>
          </path>
        ))}
        <text className="rosca__rotulo-centro" x={CENTRO} y={CENTRO - 8}>
          Total Produto
        </text>
        <text className="rosca__total" x={CENTRO} y={CENTRO + 18}>
          {total}
        </text>
      </svg>

      <ul className="rosca__legenda">
        {niveis.map((nivel) => (
          <li key={nivel.estado} className="rosca__item-legenda">
            <svg className="rosca__amostra" width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
              <rect
                width="20"
                height="20"
                rx="4"
                fill={`url(#${idPadrao(nivel.estado)})`}
                className={nivel.estado === "Médio" ? "rosca__setor--contorno" : undefined}
              />
            </svg>
            <span className="rosca__nivel">{nivel.estado}</span>
            <span className="rosca__quantidade">{nivel.quantidade}</span>
            <span className="rosca__percentual">{formatarPercentual(nivel.percentual)}%</span>
          </li>
        ))}
      </ul>

      <table className="sr-only">
        <caption>{legendaTabela}</caption>
        <thead>
          <tr>
            <th scope="col">Estado</th>
            <th scope="col">Quantidade</th>
            <th scope="col">Percentual</th>
          </tr>
        </thead>
        <tbody>
          {niveis.map((nivel) => (
            <tr key={nivel.estado}>
              <td>{nivel.estado}</td>
              <td>{nivel.quantidade}</td>
              <td>{formatarPercentual(nivel.percentual)}%</td>
            </tr>
          ))}
          <tr>
            <td>Total Produto</td>
            <td>{total}</td>
            <td>100%</td>
          </tr>
        </tbody>
      </table>
    </figure>
  );
}
