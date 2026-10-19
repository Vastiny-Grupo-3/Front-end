import Spinner from "../Spinner/Spinner.jsx";
import "./Button.css";

/**
 * Botão do Vastiny.
 * variante: "primario" | "secundario" | "destrutivo" | "icone" | "passo"
 * Botões só-ícone (variante "icone") precisam de `aria-label`.
 */
export default function Button({
  variante = "primario",
  icone: Icone,
  carregando = false,
  disabled = false,
  type = "button",
  className = "",
  children,
  ...props
}) {
  const classes = [
    "botao",
    `botao--${variante}`,
    carregando ? "botao--carregando" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || carregando}
      aria-busy={carregando || undefined}
      {...props}
    >
      <span className="botao__conteudo">
        {Icone && <Icone className="botao__icone" aria-hidden="true" focusable="false" />}
        {children}
      </span>
      {carregando && (
        <span className="botao__indicador">
          <Spinner />
        </span>
      )}
    </button>
  );
}
