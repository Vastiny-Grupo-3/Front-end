import { Navigate, Route, Routes } from "react-router-dom";
import AppShell from "./components/AppShell/AppShell.jsx";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import Login from "./pages/Login/Login.jsx";
import Catalogo from "./pages/Catalogo/Catalogo.jsx";
import Carrinho from "./pages/Carrinho/Carrinho.jsx";
import Clientes from "./pages/Clientes/Clientes.jsx";
import Historico from "./pages/Historico/Historico.jsx";
import HistoricoAba from "./pages/Historico/HistoricoAba.jsx";
import Dashboard from "./pages/Dashboard/Dashboard.jsx";
import Entrada from "./pages/Entrada/Entrada.jsx";
import Saida from "./pages/Saida/Saida.jsx";
import Configuracoes from "./pages/Configuracoes/Configuracoes.jsx";
import Componentes from "./pages/Componentes/Componentes.jsx";

/* Com sessão aberta, o Login leva direto ao Catálogo. */
function RotaLogin() {
  const { usuario } = useAuth();
  return usuario ? <Navigate to="/" replace /> : <Login />;
}

export default function App() {
  return (
    <>
      <a className="skip-link" href="#conteudo-principal">
        Pular para o conteúdo principal
      </a>
      <Routes>
        <Route path="/login" element={<RotaLogin />} />

        {/* Página temporária da Etapa 4, sem login: remover quando as telas estiverem prontas. */}
        <Route
          path="/componentes"
          element={
            <main id="conteudo-principal" tabIndex={-1}>
              <Componentes />
            </main>
          }
        />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route index element={<Catalogo />} />
            <Route path="carrinho" element={<Carrinho />} />
            <Route path="clientes" element={<Clientes />} />
            <Route path="historico" element={<Historico />}>
              <Route index element={<HistoricoAba key="vendas" id="vendas" />} />
              {["clientes", "entrada", "saida", "cadastro-produtos", "cadastro-clientes"].map((id) => (
                <Route key={id} path={id} element={<HistoricoAba key={id} id={id} />} />
              ))}
            </Route>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="entrada" element={<Entrada />} />
            <Route path="saida" element={<Saida />} />
            <Route path="configuracoes" element={<Configuracoes />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
