import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/Button/Button.jsx";
import Modal from "../../components/Modal/Modal.jsx";
import PasswordField from "../../components/PasswordField/PasswordField.jsx";
import SectionCard from "./SectionCard.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

/*
 * Excluir a conta remove a conta e o acesso dela; os dados da empresa
 * (estoque, clientes e vendas) continuam. Por isso os textos não dizem
 * que os dados são removidos (decisão confirmada com a equipe).
 */

/** TL20 — "Excluir conta": confirmação com a senha atual (RF44). */
function ExcluirContaModal({ aberto, aoFechar }) {
  const { excluirConta } = useAuth();
  const navegar = useNavigate();
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [excluindo, setExcluindo] = useState(false);
  const senhaRef = useRef(null);

  useEffect(() => {
    if (!aberto) return;
    setSenha("");
    setErro("");
  }, [aberto]);

  async function excluir(evento) {
    evento.preventDefault();
    if (excluindo) return;
    setExcluindo(true);
    const resultado = await excluirConta(senha);
    setExcluindo(false);
    if (resultado.erro) {
      setErro(resultado.erro);
      senhaRef.current?.focus();
      return;
    }
    navegar("/login", { replace: true });
  }

  return (
    <Modal
      aberto={aberto}
      aoFechar={aoFechar}
      titulo="Excluir conta"
      tamanho="pequeno"
      rodape={
        <>
          <Button variante="secundario" onClick={aoFechar}>
            Cancelar
          </Button>
          <Button variante="destrutivo" type="submit" form="formulario-excluir-conta" carregando={excluindo}>
            Excluir conta
          </Button>
        </>
      }
    >
      <form id="formulario-excluir-conta" className="secao__formulario" onSubmit={excluir} noValidate>
        <p className="secao__texto">
          Tem certeza que deseja excluir sua conta? Você perderá o acesso. Esta ação não pode ser
          desfeita.
        </p>
        <PasswordField
          ref={senhaRef}
          rotulo="Senha atual"
          obrigatorio
          autoComplete="current-password"
          value={senha}
          onChange={(evento) => {
            setSenha(evento.target.value);
            setErro("");
          }}
          erro={erro}
        />
      </form>
    </Modal>
  );
}

/** TL15 — cartão "Ações da conta": "Sair da conta" e "Excluir conta". */
export default function AcoesConta() {
  const { sair } = useAuth();
  const navegar = useNavigate();
  const [excluindo, setExcluindo] = useState(false);

  function sairDaConta() {
    sair();
    navegar("/login", { replace: true });
  }

  return (
    <SectionCard
      id="secao-acoes-conta"
      titulo="Ações da conta"
      subtitulo="Sair encerra sua sessão. Excluir conta remove seu acesso."
      perigo
      acao={
        <div className="secao__botoes">
          <Button variante="secundario" onClick={sairDaConta}>
            Sair da conta
          </Button>
          <Button variante="destrutivo" onClick={() => setExcluindo(true)}>
            Excluir conta
          </Button>
        </div>
      }
    >
      <ExcluirContaModal aberto={excluindo} aoFechar={() => setExcluindo(false)} />
    </SectionCard>
  );
}
