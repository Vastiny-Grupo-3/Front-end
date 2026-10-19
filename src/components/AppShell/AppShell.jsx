import { useEffect, useRef, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import Button from "../Button/Button.jsx";
import SideNav from "../SideNav/SideNav.jsx";
import CartModal from "../CartModal/CartModal.jsx";
import "./AppShell.css";

const ID_MENU = "menu-principal";

/* Primeiro segmento da rota: trocar de aba no Histórico não conta como troca de tela. */
function secaoDe(caminho) {
  return caminho.split("/")[1] ?? "";
}

/**
 * Casca da aplicação (TL01–TL15): navegação lateral fixa a partir de 1024 px
 * e gaveta aberta por botão em telas menores.
 */
export default function AppShell() {
  const { pathname } = useLocation();
  const [gavetaAberta, setGavetaAberta] = useState(false);
  const mainRef = useRef(null);
  const botaoMenuRef = useRef(null);
  const gavetaRef = useRef(null);
  const secaoAnterior = useRef(secaoDe(pathname));

  // Ao trocar de tela, leva o foco ao conteúdo principal (leitores de tela anunciam a nova tela).
  useEffect(() => {
    const secao = secaoDe(pathname);
    if (secao !== secaoAnterior.current) mainRef.current?.focus();
    secaoAnterior.current = secao;
  }, [pathname]);

  // Gaveta: foco no primeiro item, Esc fecha e devolve o foco ao botão de menu.
  useEffect(() => {
    if (!gavetaAberta) return undefined;
    gavetaRef.current?.querySelector("a, button")?.focus();

    function teclar(evento) {
      if (evento.key === "Escape") fecharGaveta();
    }
    // Se a janela crescer até o layout com barra fixa, a gaveta deixa de existir.
    const telaLarga = window.matchMedia("(min-width: 1024px)");
    function aoMudarLargura(evento) {
      if (evento.matches) setGavetaAberta(false);
    }

    document.addEventListener("keydown", teclar);
    telaLarga.addEventListener("change", aoMudarLargura);
    return () => {
      document.removeEventListener("keydown", teclar);
      telaLarga.removeEventListener("change", aoMudarLargura);
    };
  }, [gavetaAberta]);

  function fecharGaveta() {
    setGavetaAberta(false);
    botaoMenuRef.current?.focus();
  }

  return (
    <div className={`casca ${gavetaAberta ? "casca--gaveta-aberta" : ""}`.trim()}>
      <div className="casca__barra-topo">
        <Button
          ref={botaoMenuRef}
          variante="icone"
          icone={Menu}
          aria-label="Abrir menu"
          aria-expanded={gavetaAberta}
          aria-controls={ID_MENU}
          onClick={() => setGavetaAberta(true)}
        />
        <span className="casca__marca">Vastiny</span>
      </div>

      <div className="casca__lateral" ref={gavetaRef}>
        <div className="casca__fechar-gaveta">
          <Button variante="icone" icone={X} aria-label="Fechar menu" onClick={fecharGaveta} />
        </div>
        <SideNav id={ID_MENU} aoNavegar={() => setGavetaAberta(false)} />
      </div>

      {gavetaAberta && (
        <div className="casca__sobreposicao" aria-hidden="true" onClick={fecharGaveta} />
      )}

      <main
        id="conteudo-principal"
        ref={mainRef}
        tabIndex={-1}
        className="casca__conteudo"
        inert={gavetaAberta || undefined}
      >
        <Outlet />
      </main>

      <CartModal />
    </div>
  );
}
