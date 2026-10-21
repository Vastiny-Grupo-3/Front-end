import Modal from "../../components/Modal/Modal.jsx";
import { ESTADOS_ESTOQUE } from "../../utils/dashboard.js";

/**
 * Filtro do painel Estoque: categorias e estados. As caixas valem na hora.
 */
export default function EstoqueFiltroModal({
  aberto,
  categorias,
  categoriasSelecionadas,
  aoMudarCategorias,
  estadosSelecionados,
  aoMudarEstados,
  aoFechar,
}) {
  function alternarCategoria(id) {
    aoMudarCategorias(
      categoriasSelecionadas.includes(id)
        ? categoriasSelecionadas.filter((atual) => atual !== id)
        : [...categoriasSelecionadas, id],
    );
  }

  function alternarEstado(estado) {
    aoMudarEstados(
      estadosSelecionados.includes(estado)
        ? estadosSelecionados.filter((atual) => atual !== estado)
        : [...estadosSelecionados, estado],
    );
  }

  return (
    <Modal aberto={aberto} aoFechar={aoFechar} titulo="Filtrar estoque" tamanho="pequeno" mostrarFechar>
      <fieldset className="dashboard__filtro-grupo">
        <legend>Categoria</legend>
        {categorias.map((categoria) => (
          <label key={categoria.id} className="dashboard__categoria">
            <input
              type="checkbox"
              checked={categoriasSelecionadas.includes(categoria.id)}
              onChange={() => alternarCategoria(categoria.id)}
            />
            <span>{categoria.nome}</span>
          </label>
        ))}
      </fieldset>
      <fieldset className="dashboard__filtro-grupo">
        <legend>Estado</legend>
        {ESTADOS_ESTOQUE.map((estado) => (
          <label key={estado} className="dashboard__categoria">
            <input
              type="checkbox"
              checked={estadosSelecionados.includes(estado)}
              onChange={() => alternarEstado(estado)}
            />
            <span>{estado}</span>
          </label>
        ))}
      </fieldset>
    </Modal>
  );
}
