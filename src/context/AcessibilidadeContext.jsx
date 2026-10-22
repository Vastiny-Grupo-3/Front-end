import { createContext, useContext, useLayoutEffect, useState } from "react";

const CHAVE = "vastiny:daltonismo";
const AcessibilidadeContext = createContext(null);

function lerPreferencia() {
  return localStorage.getItem(CHAVE) === "ativo";
}

/** Preferência visual de daltonismo, salva neste navegador. */
export function AcessibilidadeProvider({ children }) {
  const [daltonismo, setDaltonismo] = useState(lerPreferencia);

  useLayoutEffect(() => {
    document.documentElement.dataset.daltonismo = daltonismo ? "ativo" : "inativo";
    localStorage.setItem(CHAVE, daltonismo ? "ativo" : "inativo");
  }, [daltonismo]);

  return (
    <AcessibilidadeContext.Provider value={{ daltonismo, setDaltonismo }}>
      {children}
    </AcessibilidadeContext.Provider>
  );
}

export function useAcessibilidade() {
  const valor = useContext(AcessibilidadeContext);
  if (!valor) throw new Error("useAcessibilidade precisa do AcessibilidadeProvider");
  return valor;
}
