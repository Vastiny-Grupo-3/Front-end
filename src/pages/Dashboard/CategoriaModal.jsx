import Modal from "../../components/Modal/Modal.jsx";

/**
 * Painel de filtro por categoria (aberto pelo funil): caixas de seleção que
 * valem na hora; "X" e Esc fecham.
 */
export default function CategoriaModal({ aberto, categorias, selecionadas, aoMudar, aoFechar }) {
  function alternar(id) {
    aoMudar(selecionadas.includes(id) ? selecionadas.filter((atual) => atual !== id) : [...selecionadas, id]);
  }

  return (
    <Modal aberto={aberto} aoFechar={aoFechar} titulo="Categoria" tamanho="pequeno" mostrarFechar>
      <fieldset className="dashboard__categorias">
        <legend className="sr-only">Categoria</legend>
        {categorias.map((categoria) => (
          <label key={categoria.id} className="dashboard__categoria">
            <input
              type="checkbox"
              checked={selecionadas.includes(categoria.id)}
              onChange={() => alternar(categoria.id)}
            />
            <span>{categoria.nome}</span>
          </label>
        ))}
      </fieldset>
    </Modal>
  );
}
