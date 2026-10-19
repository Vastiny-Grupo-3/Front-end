import { useId, useRef } from "react";
import "./Tabs.css";

/**
 * Abas (padrão ARIA tablist). Setas, Home e End movem o foco e ativam a aba.
 * abas: [{ id, rotulo, cor }] — `cor` é o token da aba (ex.: "var(--cor-aba-vendas)").
 * `children` é o conteúdo do painel da aba ativa.
 */
export default function Tabs({ rotulo, abas, abaAtiva, aoMudar, children, className = "" }) {
  const base = `abas-${useId()}`;
  const refs = useRef({});

  function idAba(id) {
    return `${base}-aba-${id}`;
  }

  function ativar(indice) {
    const aba = abas[(indice + abas.length) % abas.length];
    aoMudar?.(aba.id);
    refs.current[aba.id]?.focus();
  }

  function teclar(evento, indice) {
    const acoes = {
      ArrowRight: () => ativar(indice + 1),
      ArrowLeft: () => ativar(indice - 1),
      Home: () => ativar(0),
      End: () => ativar(abas.length - 1),
    };
    const acao = acoes[evento.key];
    if (acao) {
      evento.preventDefault();
      acao();
    }
  }

  return (
    <div className={`abas ${className}`.trim()}>
      <div className="abas__lista" role="tablist" aria-label={rotulo}>
        {abas.map((aba, indice) => {
          const ativa = aba.id === abaAtiva;
          return (
            <button
              key={aba.id}
              ref={(elemento) => {
                refs.current[aba.id] = elemento;
              }}
              id={idAba(aba.id)}
              type="button"
              role="tab"
              className="abas__aba"
              style={aba.cor ? { "--aba-cor": aba.cor } : undefined}
              aria-selected={ativa}
              aria-controls={`${base}-painel`}
              tabIndex={ativa ? 0 : -1}
              onClick={() => aoMudar?.(aba.id)}
              onKeyDown={(evento) => teclar(evento, indice)}
            >
              {aba.rotulo}
            </button>
          );
        })}
      </div>
      <div
        id={`${base}-painel`}
        className="abas__painel"
        role="tabpanel"
        aria-labelledby={idAba(abaAtiva)}
        tabIndex={0}
      >
        {children}
      </div>
    </div>
  );
}
