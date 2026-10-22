import { useState } from "react";
import PageHeader from "../../components/PageHeader/PageHeader.jsx";
import DadosConta from "./DadosConta.jsx";
import Categorias from "./Categorias.jsx";
import Acessibilidade from "./Acessibilidade.jsx";
import AcoesConta from "./AcoesConta.jsx";
import CadastroContaModal from "./CadastroContaModal.jsx";
import "./Configuracoes.css";

/** TL15 Configurações: dados da conta, categorias e ações da conta. */
export default function Configuracoes() {
  const [cadastrandoConta, setCadastrandoConta] = useState(false);

  return (
    <>
      <PageHeader
        titulo="Configurações"
        subtitulo="Gerencie seus dados de acesso e as categorias dos produtos."
      />
      <DadosConta aoCadastrarConta={() => setCadastrandoConta(true)} />
      <Categorias />
      <Acessibilidade />
      <AcoesConta />
      <CadastroContaModal aberto={cadastrandoConta} aoFechar={() => setCadastrandoConta(false)} />
    </>
  );
}
