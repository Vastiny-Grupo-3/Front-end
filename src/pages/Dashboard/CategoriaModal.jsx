import Modal from "../../components/Modal/Modal.jsx";
import CheckboxGroup from "../../components/CheckboxGroup/CheckboxGroup.jsx";

/**
 * Painel de filtro por categoria (aberto pelo funil): caixas de seleção que
 * valem na hora, com "Selecionar todas as opções"; "X" e Esc fecham.
 */
export default function CategoriaModal({ aberto, categorias, selecionadas, aoMudar, aoFechar }) {
  return (
    <Modal aberto={aberto} aoFechar={aoFechar} titulo="Categoria" tamanho="pequeno" mostrarFechar>
      <CheckboxGroup
        legenda="Categoria"
        legendaOculta
        opcoes={categorias.map((categoria) => ({ valor: categoria.id, rotulo: categoria.nome }))}
        selecionados={selecionadas}
        aoMudar={aoMudar}
      />
    </Modal>
  );
}
