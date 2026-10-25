import Modal from "../../components/Modal/Modal.jsx";
import CheckboxGroup from "../../components/CheckboxGroup/CheckboxGroup.jsx";
import { ESTADOS_ESTOQUE } from "../../utils/dashboard.js";

/**
 * Filtro do painel Estoque: estados (fixos) e, abaixo, categorias (podem ser muitas).
 * As caixas valem na hora, com "Selecionar todas as opções" em cada grupo.
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
  return (
    <Modal aberto={aberto} aoFechar={aoFechar} titulo="Filtrar estoque" tamanho="pequeno" mostrarFechar>
      <CheckboxGroup
        legenda="Estado"
        opcoes={ESTADOS_ESTOQUE.map((estado) => ({ valor: estado, rotulo: estado }))}
        selecionados={estadosSelecionados}
        aoMudar={aoMudarEstados}
      />
      <CheckboxGroup
        legenda="Categoria"
        opcoes={categorias.map((categoria) => ({ valor: categoria.id, rotulo: categoria.nome }))}
        selecionados={categoriasSelecionadas}
        aoMudar={aoMudarCategorias}
      />
    </Modal>
  );
}
