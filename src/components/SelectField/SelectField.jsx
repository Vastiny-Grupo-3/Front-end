import { ChevronDown } from "lucide-react";
import Field from "../Field/Field.jsx";
import "./SelectField.css";

/**
 * Lista suspensa com rótulo, ajuda e erro.
 * opcoes: [{ valor, rotulo }]
 */
export default function SelectField({
  id,
  rotulo,
  rotuloOculto,
  ajuda,
  erro,
  obrigatorio,
  opcoes,
  className,
  ...props
}) {
  return (
    <Field
      id={id}
      rotulo={rotulo}
      rotuloOculto={rotuloOculto}
      ajuda={ajuda}
      erro={erro}
      obrigatorio={obrigatorio}
      className={className}
    >
      {(propsControle) => (
        <>
          <select className="campo__entrada lista" {...propsControle} {...props}>
            {opcoes.map((opcao) => (
              <option key={opcao.valor} value={opcao.valor}>
                {opcao.rotulo}
              </option>
            ))}
          </select>
          <ChevronDown className="lista__seta" aria-hidden="true" focusable="false" />
        </>
      )}
    </Field>
  );
}
