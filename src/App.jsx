import Componentes from "./pages/Componentes/Componentes.jsx";

// Rota provisória: o react-router-dom entra na Etapa 5.
const paginaAtual = window.location.pathname;

export default function App() {
  return (
    <>
      <a className="skip-link" href="#conteudo-principal">
        Pular para o conteúdo principal
      </a>
      <main id="conteudo-principal" tabIndex="-1">
        {paginaAtual === "/componentes" && <Componentes />}
      </main>
    </>
  );
}
