import { useId } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import "./SideNav.css";

/* Em TL02 e TL03 (fluxo de venda) o item ativo é "Catálogo". */
const ITENS_TOPO = [
  { rotulo: "Catálogo", para: "/", ativo: (caminho) => caminho === "/" || caminho.startsWith("/carrinho") },
  { rotulo: "Clientes", para: "/clientes", ativo: (caminho) => caminho.startsWith("/clientes") },
  { rotulo: "Histórico", para: "/historico", ativo: (caminho) => caminho.startsWith("/historico") },
];

const ITENS_OPERACOES = [
  { rotulo: "Entrada", para: "/entrada", ativo: (caminho) => caminho.startsWith("/entrada") },
  { rotulo: "Saída", para: "/saida", ativo: (caminho) => caminho.startsWith("/saida") },
];

const ITENS_BASE = [
  { rotulo: "Dashboard", para: "/dashboard", ativo: (caminho) => caminho.startsWith("/dashboard") },
  {
    rotulo: "Configurações",
    para: "/configuracoes",
    ativo: (caminho) => caminho.startsWith("/configuracoes"),
  },
];

function Item({ item, caminho, aoNavegar }) {
  const ativo = item.ativo(caminho);
  return (
    <li>
      <Link
        to={item.para}
        className="menu__item"
        aria-current={ativo ? "page" : undefined}
        onClick={aoNavegar}
      >
        {item.rotulo}
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
      <div className="menu__saudacao">
        <p className="menu__saudacao-linha">Bem-vindo!</p>
        <p className="menu__saudacao-linha">{usuario?.nome}</p>
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

      <button type="button" className="menu__item menu__sair" onClick={encerrarSessao}>
        <LogOut className="menu__icone" aria-hidden="true" focusable="false" />
        Sair
      </button>
    </nav>
  );
}
