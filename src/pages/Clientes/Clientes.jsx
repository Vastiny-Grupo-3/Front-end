import { useRef, useState } from "react";
import { Eye, Pencil, Trash2 } from "lucide-react";
import PageHeader from "../../components/PageHeader/PageHeader.jsx";
import Button from "../../components/Button/Button.jsx";
import DataTable from "../../components/DataTable/DataTable.jsx";
import ConfirmModal from "../../components/ConfirmModal/ConfirmModal.jsx";
import ClienteFormModal from "./ClienteFormModal.jsx";
import ClienteDetalhesModal from "./ClienteDetalhesModal.jsx";
import { useStock } from "../../context/StockContext.jsx";
import { contarComprasDoCliente } from "../../utils/estoque.js";
import "./Clientes.css";

const VAZIO = "Nenhum cliente cadastrado. Use “Cadastrar Novo Cliente” para começar.";

/** TL04 Clientes: lista com Detalhes, Editar e Excluir (modais da TL05). */
export default function Clientes() {
  const stock = useStock();
  const { clientes, status, recarregar, excluirCliente } = stock;
  // modal: { tipo: "cadastrar" | "editar" | "detalhes" | "excluir", cliente? } | null
  const [modal, setModal] = useState(null);
  // Depois de excluir, o botão que abriu o modal some: o foco vai para a lista.
  const listaRef = useRef(null);

  function fechar() {
    setModal(null);
  }

  function confirmarExclusao() {
    excluirCliente(modal.cliente.id);
    setModal(null);
  }

  const linhas = clientes.map((cliente) => ({
    ...cliente,
    compras: contarComprasDoCliente(stock, cliente.id),
  }));

  const colunas = [
    {
      chave: "nome",
      titulo: "Nome",
      largura: `${(5 / 12) * 100}%`,
      renderizar: (linha) => <span id={`cliente-${linha.id}`}>{linha.nome}</span>,
    },
    { chave: "telefone", titulo: "Telefone", largura: `${(3 / 12) * 100}%` },
    { chave: "compras", titulo: "Qtd. Compras", alinhamento: "direita", largura: `${(2 / 12) * 100}%` },
    {
      chave: "acoes",
      titulo: "Ações",
      largura: `${(2 / 12) * 100}%`,
      renderizar: (linha) => (
        <div className="clientes__acoes">
          <Button
            variante="icone"
            icone={Eye}
            aria-label="Detalhes"
            aria-describedby={`cliente-${linha.id}`}
            onClick={() => setModal({ tipo: "detalhes", cliente: linha })}
          />
          <Button
            variante="icone"
            icone={Pencil}
            aria-label="Editar"
            aria-describedby={`cliente-${linha.id}`}
            onClick={() => setModal({ tipo: "editar", cliente: linha })}
          />
          <Button
            variante="icone"
            icone={Trash2}
            className="clientes__excluir"
            aria-label="Excluir"
            aria-describedby={`cliente-${linha.id}`}
            onClick={() => setModal({ tipo: "excluir", cliente: linha })}
          />
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        titulo="Todos os clientes"
        acao={
          <Button className="clientes__cadastrar" onClick={() => setModal({ tipo: "cadastrar" })}>
            Cadastrar Novo Cliente
          </Button>
        }
      />

      <div ref={listaRef} tabIndex={-1} className="clientes__lista">
        <DataTable
          legenda="Todos os clientes"
          colunas={colunas}
          linhas={linhas}
          estado={status === "carregando" || status === "erro" ? status : "padrao"}
          aoTentarNovamente={recarregar}
          mensagemVazio={VAZIO}
        />
      </div>

      <ClienteFormModal
        aberto={modal?.tipo === "cadastrar" || modal?.tipo === "editar"}
        cliente={modal?.tipo === "editar" ? modal.cliente : null}
        aoFechar={fechar}
      />

      <ClienteDetalhesModal
        cliente={modal?.tipo === "detalhes" ? modal.cliente : null}
        aoFechar={fechar}
      />

      <ConfirmModal
        aberto={modal?.tipo === "excluir"}
        aoCancelar={fechar}
        aoConfirmar={confirmarExclusao}
        focoAoFechar={listaRef}
        titulo={`Tem certeza que deseja excluir o cliente '${modal?.cliente?.nome ?? ""}'?`}
        destrutivo
      />
    </>
  );
}
