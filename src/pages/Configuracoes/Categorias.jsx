import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Pencil, Trash2 } from "lucide-react";
import Button from "../../components/Button/Button.jsx";
import DataTable from "../../components/DataTable/DataTable.jsx";
import Modal from "../../components/Modal/Modal.jsx";
import ConfirmModal from "../../components/ConfirmModal/ConfirmModal.jsx";
import TextField from "../../components/TextField/TextField.jsx";
import SectionCard from "./SectionCard.jsx";
import { useStock } from "../../context/StockContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { MENSAGENS_ESTOQUE, contarProdutosDaCategoria } from "../../utils/estoque.js";

/** TL20 — "Nova categoria" / "Editar categoria" (modal pequeno com "Nome da categoria"). */
function CategoriaFormModal({ aberto, categoria, aoFechar }) {
  const { criarCategoria, editarCategoria } = useStock();
  const { mostrarToast } = useToast();
  const [nome, setNome] = useState("");
  const [erro, setErro] = useState("");
  const nomeRef = useRef(null);

  useEffect(() => {
    if (!aberto) return;
    setNome(categoria?.nome ?? "");
    setErro("");
  }, [aberto, categoria]);

  function salvar(evento) {
    evento.preventDefault();
    const resultado = categoria ? editarCategoria(categoria.id, nome) : criarCategoria(nome);
    if (resultado.erro) {
      setErro(resultado.erro);
      nomeRef.current?.focus();
      return;
    }
    aoFechar();
    mostrarToast({ variante: "sucesso", mensagem: "Categoria salva." });
  }

  return (
    <Modal
      aberto={aberto}
      aoFechar={aoFechar}
      titulo={categoria ? "Editar categoria" : "Nova categoria"}
      tamanho="pequeno"
      rodape={
        <>
          <Button variante="secundario" onClick={aoFechar}>
            Cancelar
          </Button>
          <Button type="submit" form="formulario-categoria">
            Salvar
          </Button>
        </>
      }
    >
      <form id="formulario-categoria" onSubmit={salvar} noValidate>
        <TextField
          ref={nomeRef}
          rotulo="Nome da categoria"
          obrigatorio
          autoComplete="off"
          value={nome}
          onChange={(evento) => {
            setNome(evento.target.value);
            setErro("");
          }}
          erro={erro}
        />
      </form>
    </Modal>
  );
}

/** TL15 — cartão "Categorias de produtos" (RF42). */
export default function Categorias() {
  const stock = useStock();
  const { categorias, excluirCategoria } = stock;
  const { mostrarToast } = useToast();
  // modal: { tipo: "nova" | "editar" | "excluir", categoria? } | null
  const [modal, setModal] = useState(null);
  const listaRef = useRef(null);
  const fechar = () => setModal(null);

  const associados = modal?.tipo === "excluir" ? contarProdutosDaCategoria(stock, modal.categoria.id) : 0;

  function confirmarExclusao() {
    const resultado = excluirCategoria(modal.categoria.id);
    if (resultado.erro) return;
    setModal(null);
    mostrarToast({ variante: "sucesso", mensagem: "Categoria excluída." });
  }

  const colunas = [
    {
      chave: "nome",
      titulo: "Categoria",
      renderizar: (linha) => <span id={`categoria-${linha.id}`}>{linha.nome}</span>,
    },
    {
      chave: "associados",
      titulo: "Produtos associados",
      renderizar: (linha) => contarProdutosDaCategoria(stock, linha.id),
    },
    {
      chave: "acoes",
      titulo: "Ações",
      renderizar: (linha) => (
        <div className="secao__acoes-linha">
          <Button
            variante="icone"
            className="botao--leve"
            icone={Pencil}
            aria-label="Editar"
            aria-describedby={`categoria-${linha.id}`}
            onClick={() => setModal({ tipo: "editar", categoria: linha })}
          />
          <Button
            variante="icone"
            icone={Trash2}
            className="secao__excluir botao--leve"
            aria-label="Excluir"
            aria-describedby={`categoria-${linha.id}`}
            onClick={() => setModal({ tipo: "excluir", categoria: linha })}
          />
        </div>
      ),
    },
  ];

  return (
    <SectionCard
      id="secao-categorias"
      titulo="Categorias de produtos"
      subtitulo="Cadastre e mantenha as categorias usadas no catálogo."
      acao={
        <Button variante="secundario" onClick={() => setModal({ tipo: "nova" })}>
          + Nova categoria
        </Button>
      }
    >
      <div ref={listaRef} tabIndex={-1} className="secao__lista">
        <DataTable legenda="Categorias de produtos" colunas={colunas} linhas={categorias} />
      </div>

      <CategoriaFormModal
        aberto={modal?.tipo === "nova" || modal?.tipo === "editar"}
        categoria={modal?.tipo === "editar" ? modal.categoria : null}
        aoFechar={fechar}
      />

      <ConfirmModal
        aberto={modal?.tipo === "excluir"}
        aoCancelar={fechar}
        aoConfirmar={confirmarExclusao}
        titulo={`Tem certeza que deseja excluir a categoria '${modal?.categoria?.nome ?? ""}'?`}
        destrutivo
        confirmarDesabilitado={associados > 0}
        focoAoFechar={listaRef}
      >
        {associados > 0 && (
          <p className="secao__aviso" role="alert">
            <AlertTriangle className="secao__icone-erro" aria-hidden="true" focusable="false" />
            {MENSAGENS_ESTOQUE.categoriaComProdutos(associados)}
          </p>
        )}
      </ConfirmModal>
    </SectionCard>
  );
}
