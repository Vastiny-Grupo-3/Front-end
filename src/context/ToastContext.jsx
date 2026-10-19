import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Toast from "../components/Toast/Toast.jsx";

const ToastContext = createContext(null);

/** Disponibiliza `mostrarToast({ variante, mensagem })` para a aplicação. */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const proximoId = useRef(1);

  const fecharToast = useCallback((id) => {
    setToasts((atuais) => atuais.filter((toast) => toast.id !== id));
  }, []);

  const mostrarToast = useCallback(({ variante = "informacao", mensagem }) => {
    const id = proximoId.current++;
    setToasts((atuais) => [...atuais, { id, variante, mensagem }]);
    return id;
  }, []);

  const valor = useMemo(() => ({ mostrarToast, fecharToast }), [mostrarToast, fecharToast]);

  return (
    <ToastContext.Provider value={valor}>
      {children}
      {createPortal(
        <div className="toasts" data-fora-do-modal="">
          {toasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} aoFechar={fecharToast} />
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, aoFechar }) {
  const fechar = useCallback(() => aoFechar(toast.id), [aoFechar, toast.id]);
  return <Toast variante={toast.variante} mensagem={toast.mensagem} aoFechar={fechar} />;
}

export function useToast() {
  const contexto = useContext(ToastContext);
  if (!contexto) throw new Error("useToast precisa estar dentro de ToastProvider.");
  return contexto;
}
