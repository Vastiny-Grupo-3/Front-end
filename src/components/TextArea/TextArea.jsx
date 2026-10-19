import Field from "../Field/Field.jsx";
import "./TextArea.css";

/** Área de texto (Descrição, Justificativa), com rótulo, ajuda e erro. */
export default function TextArea({
  id,
  rotulo,
  rotuloOculto,
  ajuda,
  erro,
  obrigatorio,
  carregando,
  rows = 4,
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
      carregando={carregando}
      className={className}
    >
      {(propsControle) => (
        <textarea
          rows={rows}
          className="campo__entrada area-texto"
          {...propsControle}
          {...props}
        />
      )}
    </Field>
  );
}
