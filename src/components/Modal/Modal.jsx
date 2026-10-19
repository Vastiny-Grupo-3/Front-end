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

/* Modais abertos, do mais antigo ao mais recente: só o do topo responde ao teclado. */
const pilhaDeModais = [];

function focaveis(elemento) {
  return [...elemento.querySelectorAll(SELETOR_FOCAVEIS)].filter(
    (item) => item.getClientRects().length > 0,
  );
}

/**
 * Modal acessível: foco preso, Esc fecha, foco volta ao gatilho e o restante
 * da página fica inerte enquanto ele está aberto.
 *
 * tamanho: "pequeno" (~480 px) | "medio" (~640 px) | "largo" (~720 px) | "grande" (~960 px)
 * focoInicial: "campo" (primeiro campo) | "titulo" (confirmações e detalhes)
 * tituloOculto: o título só existe para leitores de tela (quando o wireframe não o mostra)
 * subtitulo: texto de apoio sob o título
 * rodapeADireita: botões do rodapé alinhados à direita (padrão: Cancelar à esquerda)
 * focoAoFechar: ref do elemento que recebe o foco se o gatilho deixar de existir (ex.: item excluído)
 */
export default function Modal({
  aberto,
  aoFechar,
  titulo,
  subtitulo,
  tituloOculto = false,
  tamanho = "medio",
  focoInicial = "campo",
  mostrarFechar = false,
  rodapeADireita = false,
  focoAoFechar,
  erro,
  rodape,
  children,
}) {
  const idTitulo = `modal-titulo-${useId()}`;
  const painelRef = useRef(null);
  const tituloRef = useRef(null);
  const [container, setContainer] = useState(null);
  const aoFecharRef = useRef(aoFechar);
  aoFecharRef.current = aoFechar;
  const focoAoFecharRef = useRef(focoAoFechar);
  focoAoFecharRef.current = focoAoFechar;

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
      else focoAoFecharRef.current?.current?.focus();
    };
  }, [container]);

  // Foco inicial: primeiro campo ou o título. Com título oculto, o foco não pode ficar
  // num elemento invisível: vai para o primeiro controle do modal.
  useEffect(() => {
    if (!container || !painelRef.current) return;
    const primeiroCampo =
      focoInicial === "campo" ? painelRef.current.querySelector(SELETOR_CAMPOS) : null;
    const alvoTitulo = tituloOculto ? focaveis(painelRef.current)[0] : tituloRef.current;
    (primeiroCampo ?? alvoTitulo ?? tituloRef.current)?.focus();
  }, [container, focoInicial, tituloOculto]);

  // Teclado ouvido no documento: Esc e Tab funcionam mesmo se o elemento focado
  // sair da tela (ex.: item removido) e o foco cair no body.
  useEffect(() => {
    if (!container) return undefined;
    const identificador = {};
    pilhaDeModais.push(identificador);

    function teclar(evento) {
      if (pilhaDeModais.at(-1) !== identificador || !painelRef.current) return;
      if (evento.key === "Escape") {
        evento.preventDefault();
        aoFecharRef.current?.();
        return;
      }
      if (evento.key !== "Tab") return;

      const itens = focaveis(painelRef.current);
      const ativo = document.activeElement;
      if (itens.length === 0) {
        evento.preventDefault();
        tituloRef.current?.focus();
        return;
      }
      const primeiro = itens[0];
      const ultimo = itens[itens.length - 1];
      const dentro = painelRef.current.contains(ativo);

      if (!dentro) {
        evento.preventDefault();
        (evento.shiftKey ? ultimo : primeiro).focus();
      } else if (evento.shiftKey && (ativo === primeiro || ativo === tituloRef.current)) {
        evento.preventDefault();
        ultimo.focus();
      } else if (!evento.shiftKey && ativo === ultimo) {
        evento.preventDefault();
        primeiro.focus();
      }
    }

    document.addEventListener("keydown", teclar);
    return () => {
      document.removeEventListener("keydown", teclar);
      pilhaDeModais.splice(pilhaDeModais.indexOf(identificador), 1);
    };
  }, [container]);

  if (!aberto || !container) return null;

  return createPortal(
    <div className="modal-sobreposicao">
      <div
        ref={painelRef}
        className={`modal modal--${tamanho}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
      >
        <div className={`modal__cabecalho ${tituloOculto ? "modal__cabecalho--sem-titulo" : ""}`.trim()}>
          <div>
            <h2
              id={idTitulo}
              ref={tituloRef}
              tabIndex={-1}
              className={tituloOculto ? "sr-only" : "modal__titulo"}
            >
              {titulo}
            </h2>
            {subtitulo && <p className="modal__subtitulo">{subtitulo}</p>}
          </div>
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
        {rodape && (
          <div className={`modal__rodape ${rodapeADireita ? "modal__rodape--direita" : ""}`.trim()}>
            {rodape}
          </div>
        )}
      </div>
    </div>,
    container,
  );
}
