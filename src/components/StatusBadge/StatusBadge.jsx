import "./StatusBadge.css";

const CLASSES = {
  Crítico: "selo--critico",
  Ruim: "selo--ruim",
  Médio: "selo--medio",
  Bom: "selo--bom",
};

/** Selo de estado do estoque. `estado` vem pronto dos dados. */
export default function StatusBadge({ estado }) {
  return <span className={`selo ${CLASSES[estado] ?? ""}`.trim()}>{estado}</span>;
}
