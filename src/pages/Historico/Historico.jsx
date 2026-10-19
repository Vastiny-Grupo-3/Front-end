import { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import PageHeader from "../../components/PageHeader/PageHeader.jsx";
import Tabs from "../../components/Tabs/Tabs.jsx";
import { ABAS_HISTORICO } from "./abasHistorico.js";

/** TL06–TL11 Histórico: cabeçalho com pesquisa, abas (sub-rotas) e a tabela da aba ativa. */
export default function Historico() {
  const { pathname } = useLocation();
  const navegar = useNavigate();
  const [pesquisa, setPesquisa] = useState("");
  const abaAtiva =
    ABAS_HISTORICO.find((aba) => aba.caminho === pathname.replace(/\/$/, ""))?.id ?? "vendas";

  function mudarAba(id) {
    navegar(ABAS_HISTORICO.find((aba) => aba.id === id).caminho);
  }

  return (
    <>
      <PageHeader
        titulo="Histórico"
        pesquisa={{
          rotulo: "Pesquisar no histórico",
          placeholder: "Pesquisar no histórico",
          valor: pesquisa,
          aoMudar: setPesquisa,
        }}
        carrinho={{}}
      />
      <Tabs rotulo="Histórico" abas={ABAS_HISTORICO} abaAtiva={abaAtiva} aoMudar={mudarAba}>
        <Outlet context={{ pesquisa }} />
      </Tabs>
    </>
  );
}
