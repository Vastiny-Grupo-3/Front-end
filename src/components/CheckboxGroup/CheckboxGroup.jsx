import { useEffect, useRef } from "react";
import "./CheckboxGroup.css";

/**
 * Grupo de caixas de seleção com "Selecionar todas as opções" no topo.
 * A caixa geral fica marcada com tudo selecionado, indeterminada com parte e
 * desmarcada sem nenhuma; clicar nela marca tudo (ou desmarca, se já estava tudo marcado).
 *
 * opcoes: [{ valor, rotulo }]
 * selecionados: valores marcados
 * aoMudar(novosSelecionados): chamado a cada alteração, na hora
 * legendaOculta: só leitores de tela leem a legenda (quando o título do modal já a repete)
 */
export default function CheckboxGroup({
  legenda,
  legendaOculta = false,
  opcoes,
  selecionados,
  aoMudar,
  className = "",
}) {
  const geralRef = useRef(null);
  const marcadas = opcoes.filter((opcao) => selecionados.includes(opcao.valor)).length;
  const todas = opcoes.length > 0 && marcadas === opcoes.length;
  const parcial = marcadas > 0 && !todas;

  // `indeterminate` só existe como propriedade do elemento, não como atributo.
  useEffect(() => {
    if (geralRef.current) geralRef.current.indeterminate = parcial;
  }, [parcial]);

  function alternarTodas() {
    aoMudar(todas ? [] : opcoes.map((opcao) => opcao.valor));
  }

  function alternar(valor) {
    aoMudar(selecionados.includes(valor) ? selecionados.filter((atual) => atual !== valor) : [...selecionados, valor]);
  }

  return (
    <fieldset className={`grupo-caixas ${className}`.trim()}>
      <legend className={legendaOculta ? "sr-only" : "grupo-caixas__legenda"}>{legenda}</legend>
      <label className="grupo-caixas__opcao grupo-caixas__opcao--todas">
        <input ref={geralRef} type="checkbox" checked={todas} onChange={alternarTodas} />
        <span>Selecionar todas as opções</span>
      </label>
      {opcoes.map((opcao) => (
        <label key={opcao.valor} className="grupo-caixas__opcao">
          <input
            type="checkbox"
            checked={selecionados.includes(opcao.valor)}
            onChange={() => alternar(opcao.valor)}
          />
          <span>{opcao.rotulo}</span>
        </label>
      ))}
    </fieldset>
  );
}
