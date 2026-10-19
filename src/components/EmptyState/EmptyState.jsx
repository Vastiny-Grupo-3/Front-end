import "./EmptyState.css";

/** Estado vazio: diz o que não há e, opcionalmente, oferece o próximo passo. */
export default function EmptyState({ mensagem, children, className = "" }) {
  return (
    <div className={`vazio ${className}`.trim()}>
      <p className="vazio__mensagem">{mensagem}</p>
      {children && <div className="vazio__acao">{children}</div>}
    </div>
  );
}
