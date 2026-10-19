import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AlertCircle, X } from "lucide-react";
import Button from "../Button/Button.jsx";
import "./Modal.css";

const SELETOR_FOCAVEIS = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

const SELETOR_CAMPOS = "input:not([disabled]):not([type='hidden']), select:not([disabled]), textarea:not([disabled])";

function focaveis(elemento) {
  return [...elemento.querySelectorAll(SELETOR_FOCAVEIS)].filter(
    (item) => item.getClientRects().length > 0,
  );
}

/**
 * Modal acessível: foco preso, Esc fecha, foco volta ao gatilho e o restante
 * da página fica inerte enquanto ele está aberto.
 *
 * tamanho: "pequeno" (~480 px) | "medio" (~640 px) | "grande" (~960 px)
 * focoInicial: "campo" (primeiro campo) | "titulo" (confirmações e detalhes)
 */
export default function Modal({
  aberto,
  aoFechar,
  titulo,
  tamanho = "medio",
  focoInicial = "campo",
  mostrarFechar = false,
  erro,
  rodape,
  children,
}) {
  const idTitulo = `modal-titulo-${useId()}`;
  const painelRef = useRef(null);
  const tituloRef = useRef(null);
  const [container, setContainer] = useState(null);

  // Cria o nó do portal no body enquanto o modal estiver aberto.
  useLayoutEffect(() => {
    if (!aberto) return undefined;
    const no = document.createElement("div");
    no.className = "modal-portal";
    document.body.appendChild(no);
    setContainer(no);
    return () => {
      no.remove();
      setContainer(null);
    };
  }, [aberto]);

  // Deixa o restante da página inerte e devolve o foco ao gatilho ao fechar.
  useEffect(() => {
    if (!container) return undefined;
    const gatilho = document.activeElement;
    // Notificações (toast) continuam acessíveis sobre o modal.
    const irmaos = [...document.body.children].filter(
      (filho) =>
        filho !== container && !filho.inert && !filho.hasAttribute("data-fora-do-modal"),
    );
    irmaos.forEach((filho) => {
      filho.inert = true;
    });
    document.body.classList.add("modal-aberto");

    return () => {
      irmaos.forEach((filho) => {
        filho.inert = false;
      });
      if (!document.querySelector(".modal-portal")) {
        document.body.classList.remove("modal-aberto");
      }
      if (gatilho instanceof HTMLElement && gatilho.isConnected) gatilho.focus();
    };
  }, [container]);

  // Foco inicial: primeiro campo ou o título.
  useEffect(() => {
    if (!container || !painelRef.current) return;
    const primeiroCampo =
      focoInicial === "campo" ? painelRef.current.querySelector(SELETOR_CAMPOS) : null;
    (primeiroCampo ?? tituloRef.current)?.focus();
  }, [container, focoInicial]);

  function teclar(evento) {
    if (evento.key === "Escape") {
      evento.stopPropagation();
      aoFechar?.();
      return;
    }
    if (evento.key !== "Tab") return;

    const itens = focaveis(painelRef.current);
    if (itens.length === 0) {
      evento.preventDefault();
      tituloRef.current?.focus();
      return;
    }
    const primeiro = itens[0];
    const ultimo = itens[itens.length - 1];
    const ativo = document.activeElement;

    if (evento.shiftKey && (ativo === primeiro || ativo === tituloRef.current)) {
      evento.preventDefault();
      ultimo.focus();
    } else if (!evento.shiftKey && ativo === ultimo) {
      evento.preventDefault();
      primeiro.focus();
    }
  }

  if (!aberto || !container) return null;

  return createPortal(
    <div className="modal-sobreposicao">
      <div
        ref={painelRef}
        className={`modal modal--${tamanho}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        onKeyDown={teclar}
      >
        <div className="modal__cabecalho">
          <h2 id={idTitulo} ref={tituloRef} tabIndex={-1} className="modal__titulo">
            {titulo}
          </h2>
          {mostrarFechar && (
            <Button variante="icone" icone={X} aria-label="Fechar" onClick={aoFechar} />
          )}
        </div>
        {erro && (
          <p className="modal__erro" role="alert">
            <AlertCircle className="modal__icone-erro" aria-hidden="true" focusable="false" />
            {erro}
          </p>
        )}
        <div className="modal__conteudo">{children}</div>
        {rodape && <div className="modal__rodape">{rodape}</div>}
      </div>
    </div>,
    container,
  );
}
