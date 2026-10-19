import { Outlet, useLocation, useNavigate } from "react-router-dom";
import PageHeader from "../../components/PageHeader/PageHeader.jsx";
import Tabs from "../../components/Tabs/Tabs.jsx";

/* TL06 (Vendas) é a aba padrão; TL07 a TL11 são sub-rotas. */
export const ABAS_HISTORICO = [
  { id: "vendas", rotulo: "Vendas", cor: "var(--cor-aba-vendas)", caminho: "/historico" },
  { id: "clientes", rotulo: "Clientes", cor: "var(--cor-aba-clientes)", caminho: "/historico/clientes" },
  { id: "entrada", rotulo: "Entrada", cor: "var(--cor-aba-entrada)", caminho: "/historico/entrada" },
  { id: "saida", rotulo: "Saída", cor: "var(--cor-aba-saida)", caminho: "/historico/saida" },
  {
    id: "cadastro-produtos",
    rotulo: "Cadastro de Produtos",
    cor: "var(--cor-aba-cadastro-produtos)",
    caminho: "/historico/cadastro-produtos",
  },
  {
    id: "cadastro-clientes",
    rotulo: "Cadastro de Clientes",
    cor: "var(--cor-aba-cadastro-clientes)",
    caminho: "/historico/cadastro-clientes",
  },
];

/** TL06–TL11 Histórico: cabeçalho e abas; o conteúdo de cada aba entra na Etapa 11. */
export default function Historico() {
  const { pathname } = useLocation();
  const navegar = useNavigate();
  const abaAtiva =
    ABAS_HISTORICO.find((aba) => aba.caminho === pathname.replace(/\/$/, ""))?.id ?? "vendas";

  function mudarAba(id) {
    navegar(ABAS_HISTORICO.find((aba) => aba.id === id).caminho);
  }

  return (
    <>
      <PageHeader titulo="Histórico" carrinho={{}} />
      <Tabs rotulo="Histórico" abas={ABAS_HISTORICO} abaAtiva={abaAtiva} aoMudar={mudarAba}>
        <Outlet />
      </Tabs>
    </>
  );
}
