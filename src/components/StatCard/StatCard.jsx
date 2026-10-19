import "./StatCard.css";

/**
 * Indicador (KPI): rótulo acima do valor.
 * estado: "padrao" | "carregando" | "vazio" | "erro"
 */
export default function StatCard({ rotulo, valor, estado = "padrao", className = "" }) {
  let conteudo = valor;
  if (estado === "vazio") conteudo = "—";
  if (estado === "erro") conteudo = "Indisponível";

  return (
    <dl
      className={`indicador indicador--${estado} ${className}`.trim()}
      aria-busy={estado === "carregando" || undefined}
    >
      <dt className="indicador__rotulo">{rotulo}</dt>
      <dd className="indicador__valor">
        {estado === "carregando" ? (
          <span className="esqueleto indicador__esqueleto" />
        ) : (
          conteudo
        )}
      </dd>
    </dl>
  );
}
