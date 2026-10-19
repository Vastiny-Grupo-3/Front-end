import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import Field from "../Field/Field.jsx";
import Button from "../Button/Button.jsx";
import "./PasswordField.css";

/** Campo de senha com botão para mostrar ou ocultar o que foi digitado. */
export default function PasswordField({
  id,
  rotulo,
  rotuloOculto,
  ajuda,
  erro,
  obrigatorio,
  className,
  ...props
}) {
  const [visivel, setVisivel] = useState(false);

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
          <input
            type={visivel ? "text" : "password"}
            className="campo__entrada senha__entrada"
            autoCapitalize="none"
            spellCheck={false}
            {...propsControle}
            {...props}
          />
          <Button
            variante="icone"
            icone={visivel ? EyeOff : Eye}
            className="senha__alternar"
            aria-label={visivel ? "Ocultar senha" : "Mostrar senha"}
            aria-controls={propsControle.id}
            disabled={props.disabled}
            onClick={() => setVisivel((atual) => !atual)}
          />
        </>
      )}
    </Field>
  );
}
