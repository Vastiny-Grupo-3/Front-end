import { useId } from "react";
import { AlertCircle } from "lucide-react";
import Spinner from "../Spinner/Spinner.jsx";
import "./Field.css";

/**
 * Casca comum dos campos: rótulo acima, controle, texto de ajuda e erro.
 * `children` recebe as props de acessibilidade a aplicar no controle.
 */
export default function Field({
  id,
  rotulo,
  rotuloOculto = false,
  ajuda,
  erro,
  obrigatorio = false,
  carregando = false,
  className = "",
  children,
}) {
  const idGerado = useId();
  const idCampo = id ?? `campo-${idGerado}`;
  const idAjuda = ajuda ? `${idCampo}-ajuda` : undefined;
  const idErro = erro ? `${idCampo}-erro` : undefined;
  const descritoPor = [idAjuda, idErro].filter(Boolean).join(" ") || undefined;

  const propsControle = {
    id: idCampo,
    "aria-describedby": descritoPor,
    "aria-invalid": erro ? true : undefined,
    "aria-required": obrigatorio || undefined,
    required: obrigatorio,
    "aria-busy": carregando || undefined,
  };

  return (
    <div className={`campo ${erro ? "campo--erro" : ""} ${className}`.trim()}>
      <label htmlFor={idCampo} className={rotuloOculto ? "sr-only" : "campo__rotulo"}>
        {rotulo}
        {obrigatorio && <span className="campo__obrigatorio"> (obrigatório)</span>}
      </label>
      <div className="campo__controle">
        {children(propsControle)}
        {carregando && (
          <span className="campo__indicador">
            <Spinner />
          </span>
        )}
      </div>
      {ajuda && (
        <p id={idAjuda} className="campo__ajuda">
          {ajuda}
        </p>
      )}
      {erro && (
        <p id={idErro} className="campo__mensagem-erro">
          <AlertCircle className="campo__icone-erro" aria-hidden="true" focusable="false" />
          {erro}
        </p>
      )}
    </div>
  );
}
