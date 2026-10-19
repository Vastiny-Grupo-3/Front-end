import { useEffect, useId, useState } from "react";
import { AlertCircle } from "lucide-react";
import {
  arredondar,
  formatarDecimal,
  formatarPercentual,
  lerDecimal,
} from "../../utils/formatadores.js";
import "../Field/Field.css";
import "./MoneyPercentField.css";

const MENSAGEM_ERRO = "O desconto não pode ser maior que o valor do produto.";

/* Aceita só dígitos, vírgula e ponto: impede valores negativos. */
function sanitizar(texto) {
  return texto.replace(/[^\d.,]/g, "");
}

function percentualDe(desconto, valorLinha) {
  return valorLinha > 0 ? (desconto / valorLinha) * 100 : 0;
}

/**
 * Desconto duplo vinculado: R$ e %. Alterar um recalcula o outro com base
 * no valor da linha (quantidade × preço por unidade).
 * `desconto` e `aoMudar` trabalham sempre em reais.
 */
export default function MoneyPercentField({
  rotulo = "Desconto",
  rotuloOculto = false,
  valorLinha,
  desconto,
  aoMudar,
  disabled = false,
  className = "",
}) {
  const id = `desconto-${useId()}`;
  const idErro = `${id}-erro`;
  const [textoReais, setTextoReais] = useState(formatarDecimal(desconto));
  const [textoPercentual, setTextoPercentual] = useState(
    formatarPercentual(percentualDe(desconto, valorLinha)),
  );
  const [erro, setErro] = useState("");
  const [campoEmEdicao, setCampoEmEdicao] = useState(null);

  // Sincroniza com o valor externo (ex.: quantidade alterada) fora da digitação.
  // Com erro na tela, mantém o valor digitado até a pessoa corrigi-lo.
  useEffect(() => {
    if (erro) return;
    if (campoEmEdicao !== "reais") setTextoReais(formatarDecimal(desconto));
    if (campoEmEdicao !== "percentual") {
      setTextoPercentual(formatarPercentual(percentualDe(desconto, valorLinha)));
    }
  }, [desconto, valorLinha, campoEmEdicao, erro]);

  function mudarReais(evento) {
    const texto = sanitizar(evento.target.value);
    setTextoReais(texto);
    const valor = texto === "" ? 0 : lerDecimal(texto);
    if (Number.isNaN(valor)) return;
    if (valor > valorLinha) {
      setErro(MENSAGEM_ERRO);
      return;
    }
    setErro("");
    setTextoPercentual(formatarPercentual(percentualDe(valor, valorLinha)));
    aoMudar?.(arredondar(valor));
  }

  function mudarPercentual(evento) {
    const texto = sanitizar(evento.target.value);
    setTextoPercentual(texto);
    const percentual = texto === "" ? 0 : lerDecimal(texto);
    if (Number.isNaN(percentual)) return;
    if (percentual > 100) {
      setErro(MENSAGEM_ERRO);
      return;
    }
    setErro("");
    const valor = arredondar((valorLinha * percentual) / 100);
    setTextoReais(formatarDecimal(valor));
    aoMudar?.(valor);
  }

  function sair() {
    setCampoEmEdicao(null);
    if (!erro) {
      setTextoReais(formatarDecimal(desconto));
      setTextoPercentual(formatarPercentual(percentualDe(desconto, valorLinha)));
    }
  }

  const propsComuns = {
    type: "text",
    inputMode: "decimal",
    autoComplete: "off",
    disabled,
    "aria-invalid": erro ? true : undefined,
    "aria-describedby": erro ? idErro : undefined,
    onBlur: sair,
  };

  return (
    <fieldset className={`desconto ${className}`.trim()}>
      <legend className={rotuloOculto ? "sr-only" : "campo__rotulo"}>{rotulo}</legend>
      <div className="desconto__linha">
        <div className="desconto__parte">
          <span className="desconto__adorno" aria-hidden="true">
            R$
          </span>
          <label htmlFor={`${id}-reais`} className="sr-only">
            {rotulo} em reais
          </label>
          <input
            id={`${id}-reais`}
            className="campo__entrada desconto__entrada desconto__entrada--reais"
            value={textoReais}
            onChange={mudarReais}
            onFocus={() => setCampoEmEdicao("reais")}
            {...propsComuns}
          />
        </div>
        <div className="desconto__parte">
          <label htmlFor={`${id}-percentual`} className="sr-only">
            {rotulo} em percentual
          </label>
          <input
            id={`${id}-percentual`}
            className="campo__entrada desconto__entrada desconto__entrada--percentual"
            value={textoPercentual}
            onChange={mudarPercentual}
            onFocus={() => setCampoEmEdicao("percentual")}
            {...propsComuns}
          />
          <span className="desconto__adorno desconto__adorno--sufixo" aria-hidden="true">
            %
          </span>
        </div>
      </div>
      {erro && (
        <p id={idErro} className="campo__mensagem-erro">
          <AlertCircle className="campo__icone-erro" aria-hidden="true" focusable="false" />
          {erro}
        </p>
      )}
    </fieldset>
  );
}
