import SectionCard from "./SectionCard.jsx";
import { useAcessibilidade } from "../../context/AcessibilidadeContext.jsx";

/** Preferência de daltonismo: formas e paleta em todo o sistema. */
export default function Acessibilidade() {
  const { daltonismo, setDaltonismo } = useAcessibilidade();

  return (
    <SectionCard
      id="secao-acessibilidade"
      titulo="Acessibilidade"
      subtitulo="Ajustes de cor para quem tem daltonismo."
    >
      <label className="acessibilidade__opcao">
        <span className="acessibilidade__texto">
          <span className="acessibilidade__nome">Modo para daltonismo</span>
          <span className="acessibilidade__ajuda" id="ajuda-daltonismo">
            Gráficos e selos de estoque passam a usar formas, além da cor. O verde de confirmação vira azul.
            A escolha vale para todo o sistema neste navegador.
          </span>
        </span>
        <input
          type="checkbox"
          checked={daltonismo}
          aria-describedby="ajuda-daltonismo"
          onChange={(evento) => setDaltonismo(evento.target.checked)}
        />
      </label>
    </SectionCard>
  );
}
