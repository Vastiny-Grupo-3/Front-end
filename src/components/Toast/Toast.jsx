import { useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import Button from "../Button/Button.jsx";
import "./Toast.css";

const DURACAO = 5000;

const ICONES = {
  sucesso: CheckCircle2,
  erro: AlertCircle,
  informacao: Info,
};

/**
 * Notificação curta. Some em 5 s (o tempo pausa com o mouse em cima ou com
 * foco dentro dela) e pode ser fechada pelo botão "Fechar".
 * variante: "sucesso" | "erro" | "informacao"
 */
export default function Toast({ variante = "informacao", mensagem, aoFechar }) {
  const [pausado, setPausado] = useState(false);
  const restanteRef = useRef(DURACAO);

  useEffect(() => {
    if (pausado) return undefined;
    const inicio = Date.now();
    const temporizador = setTimeout(aoFechar, restanteRef.current);
    return () => {
      clearTimeout(temporizador);
      restanteRef.current -= Date.now() - inicio;
    };
  }, [pausado, aoFechar]);

  const Icone = ICONES[variante];

  return (
    <div
      className={`toast toast--${variante}`}
      role={variante === "erro" ? "alert" : "status"}
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      onFocus={() => setPausado(true)}
      onBlur={() => setPausado(false)}
    >
      <Icone className="toast__icone" aria-hidden="true" focusable="false" />
      <p className="toast__mensagem">{mensagem}</p>
      <Button variante="icone" icone={X} aria-label="Fechar" onClick={aoFechar} />
    </div>
  );
}
