import { useId, useState } from "react";
import { useAcessibilidade } from "../../context/AcessibilidadeContext.jsx";
import { formatarPercentual } from "../../utils/formatadores.js";
import "./DonutChart.css";

const TAMANHO = 200;
const RAIO_EXTERNO = 96;
const RAIO_INTERNO = 62;
const CENTRO = TAMANHO / 2;

/* Cor de cada nível. As texturas seguem as barras e só entram com o modo para daltonismo. */
const ESTILOS = {
  Bom: { cor: "var(--cor-estoque-bom)", tinta: "var(--cor-estoque-bom-tinta)", forma: "listra" },
  Médio: { cor: "var(--cor-estoque-medio)", tinta: "var(--cor-estoque-medio-tinta)", forma: "circulo" },
  Ruim: { cor: "var(--cor-estoque-ruim)", tinta: "var(--cor-estoque-ruim-tinta)", forma: "x" },
  Crítico: { cor: "var(--cor-estoque-critico)", tinta: "var(--cor-estoque-critico-tinta)", forma: "triangulo" },
};

/* Mesma marca do gráfico de barras, num tile de 8 px. */
function Marca({ forma, tinta }) {
  if (forma === "listra") return <path d="M0,8 L8,0 M-2,2 L2,-2 M6,10 L10,6" stroke={tinta} strokeWidth="1.6" />;
  if (forma === "circulo") return <circle cx="4" cy="4" r="2.4" fill={tinta} />;
  if (forma === "x") return <path d="M1.2,1.2 L6.8,6.8 M6.8,1.2 L1.2,6.8" stroke={tinta} strokeWidth="1.6" />;
  return <path d="M4,1.2 L7.2,6.8 L0.8,6.8 Z" fill={tinta} />;
}

function Padrao({ id, estilo }) {
  return (
    <pattern id={id} width="8" height="8" patternUnits="userSpaceOnUse">
      <rect width="8" height="8" fill={estilo.cor} />
      <Marca forma={estilo.forma} tinta={estilo.tinta} />
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
 * estadosSelecionados: níveis marcados no filtro (vazio = todos)
 * aoEscolherEstado(estado): clique na legenda filtra o estoque
 * aoEscolherTodos(): clique no centro ("Total Produto") volta a mostrar todos os estados
 */
export default function DonutChart({
  niveis,
  total,
  legendaTabela,
  estadosSelecionados = [],
  aoEscolherEstado,
  aoEscolherTodos,
}) {
  const { daltonismo } = useAcessibilidade();
  const [destaque, setDestaque] = useState(null);
  const base = useId().replace(/:/g, "");
  const idPadrao = (estado) => `${base}-padrao-${ESTILOS[estado].forma}`;
  const preenchimento = (estado) => (daltonismo ? `url(#${idPadrao(estado)})` : ESTILOS[estado].cor);
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
    <figure
      className="rosca"
      onMouseLeave={() => setDestaque(null)}
    >
      <figcaption className="sr-only">{resumo}</figcaption>
      <div className="rosca__grafico">
      <svg
        className="rosca__svg"
        width={TAMANHO}
        height={TAMANHO}
        viewBox={`0 0 ${TAMANHO} ${TAMANHO}`}
        aria-hidden="true"
        focusable="false"
      >
        {daltonismo && (
          <defs>
            {niveis.map((nivel) => (
              <Padrao key={nivel.estado} id={idPadrao(nivel.estado)} estilo={ESTILOS[nivel.estado]} />
            ))}
          </defs>
        )}
        {total === 0 && (
          <circle className="rosca__vazio" cx={CENTRO} cy={CENTRO} r={(RAIO_EXTERNO + RAIO_INTERNO) / 2} />
        )}
        {setores.map((setor) => (
          <path
            key={setor.estado}
            className={`rosca__setor ${destaque === setor.estado ? "rosca__setor--destaque" : ""}`.trim()}
            d={caminhoSetor(setor.inicio, setor.fim)}
            fill={preenchimento(setor.estado)}
            onMouseEnter={() => setDestaque(setor.estado)}
            onClick={() => aoEscolherEstado?.(setor.estado)}
          >
            <title>{`${setor.estado}: ${setor.quantidade} (${formatarPercentual(setor.percentual)}%)`}</title>
          </path>
        ))}
      </svg>
      <button
        type="button"
        className="rosca__centro"
        aria-pressed={estadosSelecionados.length === 0}
        aria-label={`Total Produto: ${total}. Mostrar todos os estados`}
        onClick={() => aoEscolherTodos?.()}
      >
        <span className="rosca__rotulo-centro" aria-hidden="true">
          Total Produto:
        </span>
        <span className="rosca__total" aria-hidden="true">
          {total}
        </span>
      </button>
      </div>

      <ul className="rosca__legenda">
        {niveis.map((nivel) => (
          <li key={nivel.estado}>
            <button
              type="button"
              className={`rosca__nivel-botao ${destaque === nivel.estado ? "rosca__nivel-botao--destaque" : ""}`.trim()}
              aria-pressed={estadosSelecionados.includes(nivel.estado)}
              onMouseEnter={() => setDestaque(nivel.estado)}
              onClick={() => aoEscolherEstado?.(nivel.estado)}
            >
              <svg className="rosca__amostra" width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
                <rect width="20" height="20" rx="4" fill={preenchimento(nivel.estado)} />
              </svg>
              <span className="rosca__nivel">{nivel.estado}</span>
              <span className="rosca__quantidade">{nivel.quantidade}</span>
              <span className="rosca__percentual">{formatarPercentual(nivel.percentual)}%</span>
            </button>
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
