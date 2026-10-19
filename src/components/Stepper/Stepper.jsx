import { useEffect, useId, useState } from "react";
import { AlertCircle, Minus, Plus } from "lucide-react";
import Button from "../Button/Button.jsx";
import "../Field/Field.css";
import "./Stepper.css";

const MENSAGEM_MAXIMO = "A quantidade não pode ser maior que o estoque disponível.";

/**
 * Controle de quantidade.
 * variante "padrao": − valor + (itens do carrinho)
 * variante "unitario": -1 valor +1 (modais de Entrada e Saída)
 */
export default function Stepper({
  rotulo = "Quantidade",
  rotuloOculto = false,
  valor,
  aoMudar,
  min = 0,
  max = Infinity,
  variante = "padrao",
  mensagemMaximo = MENSAGEM_MAXIMO,
  disabled = false,
  className = "",
}) {
  const id = `quantidade-${useId()}`;
  const idErro = `${id}-erro`;
  const [texto, setTexto] = useState(String(valor));
  const [erro, setErro] = useState("");

  useEffect(() => {
    setTexto(String(valor));
  }, [valor]);

  function aplicar(novo) {
    if (novo > max) {
      setErro(mensagemMaximo);
      return;
    }
    setErro("");
    aoMudar?.(Math.max(min, novo));
  }

  function digitar(evento) {
    const somenteDigitos = evento.target.value.replace(/\D/g, "");
    setTexto(somenteDigitos);
    if (somenteDigitos === "") return;
    aplicar(Number(somenteDigitos));
  }

  function sair() {
    if (texto === "" || Number(texto) < min) {
      setTexto(String(valor));
      setErro("");
    }
  }

  const unitario = variante === "unitario";

  return (
    <div className={`stepper ${className}`.trim()}>
      <label htmlFor={id} className={rotuloOculto ? "sr-only" : "campo__rotulo"}>
        {rotulo}
      </label>
      <div className="stepper__linha">
        <Button
          variante="passo"
          icone={unitario ? undefined : Minus}
          aria-label={unitario ? undefined : "Diminuir quantidade"}
          disabled={disabled || valor <= min}
          onClick={() => aplicar(valor - 1)}
        >
          {unitario && "-1"}
        </Button>
        <input
          id={id}
          type="text"
          inputMode="numeric"
          className="campo__entrada stepper__valor"
          value={texto}
          onChange={digitar}
          onBlur={sair}
          disabled={disabled}
          aria-invalid={erro ? true : undefined}
          aria-describedby={erro ? idErro : undefined}
        />
        <Button
          variante="passo"
          icone={unitario ? undefined : Plus}
          aria-label={unitario ? undefined : "Aumentar quantidade"}
          disabled={disabled || valor >= max}
          onClick={() => aplicar(valor + 1)}
        >
          {unitario && "+1"}
        </Button>
      </div>
      {erro && (
        <p id={idErro} className="campo__mensagem-erro" role="alert">
          <AlertCircle className="campo__icone-erro" aria-hidden="true" focusable="false" />
          {erro}
        </p>
      )}
    </div>
  );
}
