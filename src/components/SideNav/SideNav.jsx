import { useId } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  History,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  Settings,
  Users,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import "./SideNav.css";

/* Em TL02 e TL03 (fluxo de venda) o item ativo é "Catálogo". */
const ITENS_TOPO = [
  {
    rotulo: "Catálogo",
    para: "/",
    icone: LayoutGrid,
    ativo: (caminho) => caminho === "/" || caminho.startsWith("/carrinho"),
  },
  { rotulo: "Clientes", para: "/clientes", icone: Users, ativo: (caminho) => caminho.startsWith("/clientes") },
  {
    rotulo: "Histórico",
    para: "/historico",
    icone: History,
    ativo: (caminho) => caminho.startsWith("/historico"),
  },
];

const ITENS_OPERACOES = [
  {
    rotulo: "Entrada",
    para: "/entrada",
    icone: ArrowDownToLine,
    ativo: (caminho) => caminho.startsWith("/entrada"),
  },
  { rotulo: "Saída", para: "/saida", icone: ArrowUpFromLine, ativo: (caminho) => caminho.startsWith("/saida") },
];

const ITENS_BASE = [
  {
    rotulo: "Dashboard",
    para: "/dashboard",
    icone: LayoutDashboard,
    ativo: (caminho) => caminho.startsWith("/dashboard"),
  },
  {
    rotulo: "Configurações",
    para: "/configuracoes",
    icone: Settings,
    ativo: (caminho) => caminho.startsWith("/configuracoes"),
  },
];

function inicialDe(nome) {
  const letra = nome?.trim()?.[0];
  return letra ? letra.toLocaleUpperCase("pt-BR") : "?";
}

function Item({ item, caminho, aoNavegar }) {
  const ativo = item.ativo(caminho);
  const Icone = item.icone;
  return (
    <li>
      <Link
        to={item.para}
        className="menu__item"
        aria-current={ativo ? "page" : undefined}
        onClick={aoNavegar}
      >
        <Icone className="menu__icone" aria-hidden="true" focusable="false" />
        <span>{item.rotulo}</span>
      </Link>
    </li>
  );
}

/** Navegação lateral: saudação, itens, grupo "Operações" e "Sair" no rodapé. */
export default function SideNav({ id, aoNavegar }) {
  const { usuario, sair } = useAuth();
  const { pathname } = useLocation();
  const navegar = useNavigate();
  const idOperacoes = `menu-operacoes-${useId()}`;

  function encerrarSessao() {
    sair();
    navegar("/login", { replace: true });
  }

  return (
    <nav id={id} className="menu" aria-label="Menu principal">
      <div className="menu__topo">
        <img className="menu__logo" src="/logo-dmc.png" alt="DMC Eletropeças" />
      </div>

      <div className="menu__usuario">
        <span className="menu__avatar" aria-hidden="true">
          {inicialDe(usuario?.nome)}
        </span>
        <div className="menu__saudacao">
          <p className="menu__saudacao-linha">Bem-vindo!</p>
          <p className="menu__nome">{usuario?.nome}</p>
        </div>
      </div>

      <ul className="menu__lista">
        {ITENS_TOPO.map((item) => (
          <Item key={item.para} item={item} caminho={pathname} aoNavegar={aoNavegar} />
        ))}
        <li className="menu__grupo">
          <span id={idOperacoes} className="menu__grupo-rotulo">
            Operações
          </span>
          <ul className="menu__lista menu__lista--grupo" aria-labelledby={idOperacoes}>
            {ITENS_OPERACOES.map((item) => (
              <Item key={item.para} item={item} caminho={pathname} aoNavegar={aoNavegar} />
            ))}
          </ul>
        </li>
        {ITENS_BASE.map((item) => (
          <Item key={item.para} item={item} caminho={pathname} aoNavegar={aoNavegar} />
        ))}
      </ul>

      <div className="menu__rodape">
        <button type="button" className="menu__item menu__sair" onClick={encerrarSessao}>
          <LogOut className="menu__icone" aria-hidden="true" focusable="false" />
          <span>Sair</span>
        </button>
      </div>
    </nav>
  );
}
