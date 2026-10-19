import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import "./FilterChips.css";

/**
 * Etiquetas removíveis dos filtros ativos.
 * etiquetas: [{ id, rotulo, filtrosSemEste }] (ver listarFiltrosAtivos)
 * focoAoEsvaziar: ref do elemento que recebe o foco quando a última etiqueta é removida.
 */
export default function FilterChips({ etiquetas, aoRemover, focoAoEsvaziar }) {
  const listaRef = useRef(null);
  const indiceRemovido = useRef(null);

  // Depois de remover, o foco vai para a etiqueta que ocupou o lugar (ou a anterior).
  useEffect(() => {
    if (indiceRemovido.current == null) return;
    const botoes = listaRef.current?.querySelectorAll(".etiqueta__remover") ?? [];
    const alvo = botoes[Math.min(indiceRemovido.current, botoes.length - 1)];
    (alvo ?? focoAoEsvaziar?.current)?.focus();
    indiceRemovido.current = null;
  }, [etiquetas, focoAoEsvaziar]);

  function remover(etiqueta, indice) {
    indiceRemovido.current = indice;
    aoRemover(etiqueta.filtrosSemEste);
  }

  if (etiquetas.length === 0) return null;
  return (
    <ul ref={listaRef} className="etiquetas" aria-label="Filtros ativos">
      {etiquetas.map((etiqueta, indice) => (
        <li key={etiqueta.id} className="etiqueta">
          <span>{etiqueta.rotulo}</span>
          <button
            type="button"
            className="etiqueta__remover"
            aria-label={`Remover filtro ${etiqueta.rotulo}`}
            onClick={() => remover(etiqueta, indice)}
          >
            <X aria-hidden="true" focusable="false" />
          </button>
        </li>
      ))}
    </ul>
  );
}
