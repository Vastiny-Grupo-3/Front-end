import Modal from "../Modal/Modal.jsx";
import DataTable from "../DataTable/DataTable.jsx";
import "./HistoryDetailsModal.css";

const COLUNAS_ALTERACAO = [
  { chave: "nome", titulo: "Nome" },
  { chave: "telefone", titulo: "Telefone" },
  { chave: "descricao", titulo: "Descrição" },
];

const COLUNAS_PRODUTOS = [
  { chave: "nome", titulo: "Nome do Produto", largura: "32%" },
  { chave: "preco", titulo: "Preço unitário", largura: "17%" },
  { chave: "unidades", titulo: "Unidades compradas", largura: "18%" },
  { chave: "valorTotal", titulo: "Valor total", largura: "17%" },
  { chave: "lucro", titulo: "Lucro", largura: "16%" },
];

/**
 * Painel de detalhes do Histórico (aberto pelo "…"), com "X" e Esc.
 * detalhes: { campos, alteracoes?: [{ id, titulo, nome, telefone, descricao }], vendas? }
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

          {detalhes.alteracoes?.map((alteracao) => (
            <section key={alteracao.id} className="detalhes-historico__venda detalhes-historico__alteracao">
              <h3 className="detalhes-historico__titulo-venda">{alteracao.titulo}</h3>
              <DataTable
                legenda={alteracao.titulo}
                colunas={COLUNAS_ALTERACAO}
                linhas={[alteracao]}
              />
            </section>
          ))}

          {detalhes.vendas?.map((venda) => (
            <section key={venda.id} className="detalhes-historico__venda">
              {venda.titulo && <h3 className="detalhes-historico__titulo-venda">{venda.titulo}</h3>}
              <DataTable
                legenda={venda.titulo ?? "Produtos da venda"}
                colunas={COLUNAS_PRODUTOS}
                linhas={venda.produtos}
              />
              {venda.titulo && venda.total && (
                <p className="detalhes-historico__total">
                  <span>Total da venda</span>
                  <strong>{venda.total}</strong>
                </p>
              )}
            </section>
          ))}
        </div>
      )}
    </Modal>
  );
}
