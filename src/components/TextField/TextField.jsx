import Field from "../Field/Field.jsx";

/** Campo de texto, e-mail, senha, número ou data, com rótulo, ajuda e erro. */
export default function TextField({
  id,
  rotulo,
  rotuloOculto,
  ajuda,
  erro,
  obrigatorio,
  carregando,
  type = "text",
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
        <input type={type} className="campo__entrada" {...propsControle} {...props} />
      )}
    </Field>
  );
}
