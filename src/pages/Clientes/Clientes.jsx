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
import { formatarData, formatarId } from "../../utils/formatadores.js";
import "./Clientes.css";

const VAZIO = "Nenhum cliente cadastrado. Use “Cadastrar Novo Cliente” para começar.";
const VAZIO_PESQUISA = "Nenhum cliente encontrado. Tente buscar por outro nome.";
const ERRO_EXCLUIR = "Não conseguimos excluir. Verifique sua conexão e tente novamente.";

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
  const { clientes, cadastrosClientes, statusClientes, recarregarClientes, excluirCliente } = stock;
  // modal: { tipo: "cadastrar" | "editar" | "detalhes" | "excluir", cliente? } | null
  const [modal, setModal] = useState(null);
  const [erroExclusao, setErroExclusao] = useState("");
  const [excluindo, setExcluindo] = useState(false);
  const [pesquisa, setPesquisa] = useState("");
  // Depois de excluir, o botão que abriu o modal some: o foco vai para a lista.
  const listaRef = useRef(null);

  function fechar() {
    setModal(null);
    setErroExclusao("");
  }

  async function confirmarExclusao() {
    setExcluindo(true);
    setErroExclusao("");
    try {
      await excluirCliente(modal.cliente.id);
    } catch {
      setExcluindo(false);
      setErroExclusao(ERRO_EXCLUIR);
      return;
    }
    setExcluindo(false);
    fechar();
  }

  const termo = normalizar(pesquisa);
  const linhas = clientes
    .map((cliente) => ({
      ...cliente,
      compras: contarComprasDoCliente(stock, cliente.id),
      dataCadastro:
        cliente.dataCadastro ??
        cadastrosClientes.find((cadastro) => cadastro.clienteId === cliente.id)?.dataCadastro ??
        cadastrosClientes.find((cadastro) => cadastro.clienteId === cliente.id)?.data ??
        null,
    }))
    .filter((cliente) => {
      if (!termo) return true;
      return normalizar(`${formatarId(cliente.id)} ${cliente.id} ${cliente.nome} ${cliente.telefone}`).includes(termo);
    });

  const colunas = [
    {
      chave: "id",
      titulo: "Id Cliente",
      ordenavel: true,
      primeiraDirecao: "asc",
      largura: "14%",
      renderizar: (linha) => formatarId(linha.id),
    },
    {
      chave: "nome",
      titulo: "Nome",
      ordenavel: true,
      primeiraDirecao: "asc",
      largura: "26%",
      renderizar: (linha) => <span id={`cliente-${linha.id}`}>{linha.nome}</span>,
    },
    { chave: "telefone", titulo: "Telefone", ordenavel: true, largura: "20%" },
    {
      chave: "dataCadastro",
      titulo: "Dt. Cadastro",
      ordenavel: true,
      primeiraDirecao: "desc",
      largura: "16%",
      valorOrdenacao: (linha) => linha.dataCadastro ?? "",
      renderizar: (linha) => (linha.dataCadastro ? formatarData(linha.dataCadastro) : "—"),
    },
    {
      chave: "compras",
      titulo: "Qtd. Compras",
      ordenavel: true,
      primeiraDirecao: "desc",
      largura: "12%",
      renderizar: (linha) => linha.compras,
    },
    {
      chave: "acoes",
      titulo: "Ações",
      largura: "12%",
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
          estado={statusClientes === "carregando" || statusClientes === "erro" ? statusClientes : "padrao"}
          aoTentarNovamente={recarregarClientes}
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
        carregando={excluindo}
        erro={erroExclusao}
      />
    </>
  );
}
