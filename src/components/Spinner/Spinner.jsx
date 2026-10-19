import { LoaderCircle } from "lucide-react";
import "./Spinner.css";

/* Indicador de progresso decorativo; o texto acessível fica com quem o usa. */
export default function Spinner({ className = "" }) {
  return (
    <LoaderCircle
      className={`spinner ${className}`.trim()}
      aria-hidden="true"
      focusable="false"
    />
  );
}
