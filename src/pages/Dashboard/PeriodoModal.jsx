import { useEffect, useRef, useState } from "react";
import Modal from "../../components/Modal/Modal.jsx";
import Button from "../../components/Button/Button.jsx";
import TextField from "../../components/TextField/TextField.jsx";
import { diasNoPeriodo, textoDiasFiltrados, validarPeriodo } from "../../utils/dashboard.js";

/**
 * Modal "Seleção do período" (aberto por "Filtro Temporal"). O cabeçalho mostra
 * "[n] dia(s) filtrado(s)"; Confirmar aplica, Cancelar e Esc descartam.
 */
export default function PeriodoModal({ aberto, periodo, aoConfirmar, aoFechar }) {
  const [inicio, setInicio] = useState(periodo.inicio);
  const [fim, setFim] = useState(periodo.fim);
  const [erro, setErro] = useState("");
  const inicioRef = useRef(null);

  useEffect(() => {
    if (!aberto) return;
    setInicio(periodo.inicio);
    setFim(periodo.fim);
    setErro("");
  }, [aberto, periodo]);

  const valido = inicio && fim && !validarPeriodo(inicio, fim);
  const titulo = valido ? textoDiasFiltrados(diasNoPeriodo(inicio, fim)) : "Seleção do período";

  function confirmar() {
    const mensagem = validarPeriodo(inicio, fim);
    if (mensagem || !inicio || !fim) {
      setErro(mensagem ?? "");
      inicioRef.current?.focus();
      return;
    }
    aoConfirmar({ inicio, fim });
    aoFechar();
  }

  return (
    <Modal
      aberto={aberto}
      aoFechar={aoFechar}
      titulo={titulo}
      tamanho="medio"
      rodape={
        <>
          <Button variante="secundario" onClick={aoFechar}>
            Cancelar
          </Button>
          <Button onClick={confirmar}>Confirmar</Button>
        </>
      }
    >
      <div className="periodo__campos">
        <TextField
          ref={inicioRef}
          rotulo="Data Início"
          type="date"
          value={inicio}
          onChange={(evento) => {
            setInicio(evento.target.value);
            setErro("");
          }}
          erro={erro}
        />
        <TextField
          rotulo="Data Fim"
          type="date"
          value={fim}
          onChange={(evento) => {
            setFim(evento.target.value);
            setErro("");
          }}
        />
      </div>
    </Modal>
  );
}
