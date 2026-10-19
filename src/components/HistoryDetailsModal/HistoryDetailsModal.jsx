import Modal from "../Modal/Modal.jsx";
import DataTable from "../DataTable/DataTable.jsx";
import "./HistoryDetailsModal.css";

const COLUNAS_PRODUTOS = [
  { chave: "nome", titulo: "Nome do Produto" },
  { chave: "preco", titulo: "Preço na época", alinhamento: "direita" },
  { chave: "lucro", titulo: "Lucro na época", alinhamento: "direita" },
  { chave: "unidades", titulo: "Unidades compradas", alinhamento: "direita" },
];

/**
 * Painel de detalhes do Histórico (aberto pelo "…"), com "X" e Esc.
 * detalhes: { campos: [[rotulo, valor]], vendas?: [{ id, titulo, produtos }] }
 */
export default function HistoryDetailsModal({ titulo, detalhes, aoFechar }) {
  return (
    <Modal
      aberto={Boolean(detalhes)}
      aoFechar={aoFechar}
      titulo={titulo}
      tituloOculto
      tamanho="grande"
      focoInicial="titulo"
      mostrarFechar
    >
      {detalhes && (
        <div className="detalhes-historico">
          <dl className="detalhes-historico__campos">
            {detalhes.campos.map(([rotulo, valor]) => (
              <div key={rotulo} className="detalhes-historico__campo">
                <dt>{rotulo}</dt>
                <dd>{valor}</dd>
              </div>
            ))}
          </dl>

          {detalhes.vendas?.map((venda) => (
            <section key={venda.id} className="detalhes-historico__venda">
              {venda.titulo && <h3 className="detalhes-historico__titulo-venda">{venda.titulo}</h3>}
              <DataTable
                legenda={venda.titulo ?? "Produtos da venda"}
                colunas={COLUNAS_PRODUTOS}
                linhas={venda.produtos}
              />
            </section>
          ))}
        </div>
      )}
    </Modal>
  );
}
