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
const VAZIO_PESQUISA = "Nenhum cliente encontrado. Tente buscar por outro nome.";

function normalizar(texto) {
  return String(texto ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/** TL04 Clientes: lista com Detalhes, Editar e Excluir (modais da TL05). */
export default function Clientes() {
  const stock = useStock();
  const { clientes, status, recarregar, excluirCliente } = stock;
  // modal: { tipo: "cadastrar" | "editar" | "detalhes" | "excluir", cliente? } | null
  const [modal, setModal] = useState(null);
  const [pesquisa, setPesquisa] = useState("");
  // Depois de excluir, o botão que abriu o modal some: o foco vai para a lista.
  const listaRef = useRef(null);

  function fechar() {
    setModal(null);
  }

  function confirmarExclusao() {
    excluirCliente(modal.cliente.id);
    setModal(null);
  }

  const termo = normalizar(pesquisa);
  const linhas = clientes
    .map((cliente) => ({
      ...cliente,
      compras: contarComprasDoCliente(stock, cliente.id),
    }))
    .filter((cliente) => {
      if (!termo) return true;
      return normalizar(`${cliente.nome} ${cliente.telefone}`).includes(termo);
    });

  const colunas = [
    {
      chave: "nome",
      titulo: "Nome",
      ordenavel: true,
      primeiraDirecao: "asc",
      largura: `${(5 / 12) * 100}%`,
      renderizar: (linha) => <span id={`cliente-${linha.id}`}>{linha.nome}</span>,
    },
    { chave: "telefone", titulo: "Telefone", ordenavel: true, largura: `${(3 / 12) * 100}%` },
    {
      chave: "compras",
      titulo: "Qtd. Compras",
      ordenavel: true,
      primeiraDirecao: "desc",
      largura: `${(2 / 12) * 100}%`,
    },
    {
      chave: "acoes",
      titulo: "Ações",
      largura: `${(2 / 12) * 100}%`,
      renderizar: (linha) => (
        <div className="clientes__acoes">
          <Button
            variante="icone"
            className="botao--leve"
            icone={Eye}
            aria-label="Detalhes"
            aria-describedby={`cliente-${linha.id}`}
            onClick={() => setModal({ tipo: "detalhes", cliente: linha })}
          />
          <Button
            variante="icone"
            className="botao--leve"
            icone={Pencil}
            aria-label="Editar"
            aria-describedby={`cliente-${linha.id}`}
            onClick={() => setModal({ tipo: "editar", cliente: linha })}
          />
          <Button
            variante="icone"
            icone={Trash2}
            className="clientes__excluir botao--leve"
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
        pesquisa={{
          rotulo: "Pesquisar clientes",
          placeholder: "Pesquisar clientes",
          valor: pesquisa,
          aoMudar: setPesquisa,
        }}
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
          mensagemVazio={termo ? VAZIO_PESQUISA : VAZIO}
          ordemInicial={{ chave: "nome", direcao: "asc" }}
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
