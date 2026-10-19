import { useId } from "react";
import { Search } from "lucide-react";
import Button from "../Button/Button.jsx";
import "../Field/Field.css";
import "./SearchField.css";

/**
 * Pesquisa: campo + botão-lupa dentro de um formulário `role="search"`.
 * `rotulo` é o nome acessível (ex.: "Pesquisar produtos"); fica oculto por padrão.
 */
export default function SearchField({
  rotulo,
  rotuloOculto = true,
  valor,
  aoMudar,
  aoPesquisar,
  placeholder,
  className = "",
  ...props
}) {
  const id = `pesquisa-${useId()}`;

  function enviar(evento) {
    evento.preventDefault();
    aoPesquisar?.(valor);
  }

  return (
    <form role="search" className={`pesquisa ${className}`.trim()} onSubmit={enviar}>
      <label htmlFor={id} className={rotuloOculto ? "sr-only" : "campo__rotulo"}>
        {rotulo}
      </label>
      <div className="pesquisa__linha">
        <input
          id={id}
          type="search"
          className="campo__entrada pesquisa__entrada"
          value={valor}
          onChange={(evento) => aoMudar?.(evento.target.value)}
          placeholder={placeholder}
          {...props}
        />
        <Button type="submit" variante="icone" icone={Search} aria-label="Pesquisar" />
      </div>
    </form>
  );
}
