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
import { MENSAGENS_ESTOQUE, contarProdutosDaCategoria, textoCriterios } from "../../utils/estoque.js";

const CAMPOS_CRITERIO = [
  ["bom", "Estoque mínimo para Bom"],
  ["medio", "Estoque mínimo para Médio"],
  ["ruim", "Estoque mínimo para Ruim"],
  ["critico", "Estoque mínimo para Crítico"],
];

const CRITERIOS_VAZIOS = { bom: "", medio: "", ruim: "", critico: "" };

/** "Nova categoria" / "Editar categoria", com os mínimos de Bom, Médio, Ruim e Crítico. */
function CategoriaFormModal({ aberto, categoria, aoFechar }) {
  const { criarCategoria, editarCategoria } = useStock();
  const { mostrarToast } = useToast();
  const [nome, setNome] = useState("");
  const [criterios, setCriterios] = useState(CRITERIOS_VAZIOS);
  const [erros, setErros] = useState({});
  const nomeRef = useRef(null);

  useEffect(() => {
    if (!aberto) return;
    setNome(categoria?.nome ?? "");
    setCriterios(
      categoria?.criterios
        ? {
            bom: String(categoria.criterios.bom),
            medio: String(categoria.criterios.medio),
            ruim: String(categoria.criterios.ruim),
            critico: String(categoria.criterios.critico),
          }
        : CRITERIOS_VAZIOS,
    );
    setErros({});
  }, [aberto, categoria]);

  function alterarCriterio(chave, valor) {
    setCriterios((atual) => ({ ...atual, [chave]: valor }));
    setErros((atual) => ({ ...atual, [chave]: "" }));
  }

  function salvar(evento) {
    evento.preventDefault();
    const entrada = { nome, ...criterios };
    const resultado = categoria ? editarCategoria(categoria.id, entrada) : criarCategoria(entrada);
    if (resultado.erros || resultado.erro) {
      const mapa = resultado.erros ?? { nome: resultado.erro };
      setErros(mapa);
      const primeiro = ["nome", "bom", "medio", "ruim", "critico"].find((chave) => mapa[chave]);
      if (primeiro === "nome") nomeRef.current?.focus();
      else document.getElementById(`categoria-${primeiro}`)?.focus();
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
      tamanho="medio"
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
      <form id="formulario-categoria" className="secao__formulario" onSubmit={salvar} noValidate>
        <TextField
          ref={nomeRef}
          id="categoria-nome"
          rotulo="Nome da categoria"
          obrigatorio
          autoComplete="off"
          value={nome}
          onChange={(evento) => {
            setNome(evento.target.value);
            setErros((atual) => ({ ...atual, nome: "" }));
          }}
          erro={erros.nome}
        />
        <div className="secao__duas-colunas">
          {CAMPOS_CRITERIO.map(([chave, rotulo]) => (
            <TextField
              key={chave}
              id={`categoria-${chave}`}
              rotulo={rotulo}
              type="number"
              inputMode="numeric"
              min="0"
              step="1"
              obrigatorio
              value={criterios[chave]}
              onChange={(evento) => alterarCriterio(chave, evento.target.value)}
              erro={erros[chave]}
            />
          ))}
        </div>
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
      chave: "criterios",
      titulo: "Estoque mínimo",
      renderizar: (linha) => textoCriterios(linha.criterios),
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
