import { useEffect, useId, useRef, useState } from "react";
import Modal from "../../components/Modal/Modal.jsx";
import Button from "../../components/Button/Button.jsx";
import TextField from "../../components/TextField/TextField.jsx";
import SelectField from "../../components/SelectField/SelectField.jsx";
import { useStock } from "../../context/StockContext.jsx";
import { CAMPOS_FAIXA, calcularLucro, textoCriterios } from "../../utils/estoque.js";
import { formatarDecimal, formatarMoeda, lerDecimal } from "../../utils/formatadores.js";

const VAZIO = { imagem: "", codigo: "", nome: "", categoriaId: "", valorCompra: "", valorVenda: "", quantidade: "" };
const FAIXA_VAZIA = { bom: "", medio: "", ruim: "", critico: "" };

function paraNumero(texto) {
  const valor = lerDecimal(texto);
  return Number.isNaN(valor) ? null : valor;
}

/* Os campos da faixa trabalham com texto; a faixa guardada tem números. */
function faixaParaTextos(faixa) {
  if (!faixa) return FAIXA_VAZIA;
  return {
    bom: String(faixa.bom),
    medio: String(faixa.medio),
    ruim: String(faixa.ruim),
    critico: String(faixa.critico),
  };
}

/**
 * TL13 — "Novo Produto" (sem `produto`) ou "Editar Produto".
 * Lucro = valor de venda − valor de compra, calculado e somente leitura.
 * Faixa de estoque: o produto usa a faixa da categoria ou tem a sua própria.
 */
export default function ProdutoFormModal({ aberto, produto, aoFechar }) {
  const { categorias, cadastrarProduto, editarProduto } = useStock();
  const editando = Boolean(produto);
  const [valores, setValores] = useState(VAZIO);
  const [faixaModo, setFaixaModo] = useState("categoria"); // "categoria" | "propria"
  const [faixa, setFaixa] = useState(FAIXA_VAZIA);
  const [errosFaixa, setErrosFaixa] = useState({});
  const [erro, setErro] = useState("");
  const [invalidos, setInvalidos] = useState([]);
  const refs = {
    codigo: useRef(null),
    nome: useRef(null),
    categoriaId: useRef(null),
    valorCompra: useRef(null),
    valorVenda: useRef(null),
    quantidade: useRef(null),
  };
  const idImagem = `imagem-${useId()}`;
  const idLucro = `lucro-${useId()}`;

  useEffect(() => {
    if (!aberto) return;
    setValores(
      produto
        ? {
            imagem: produto.imagem ?? "",
            codigo: produto.codigo,
            nome: produto.nome,
            categoriaId: String(produto.categoriaId),
            valorCompra: formatarDecimal(produto.valorCompra),
            valorVenda: formatarDecimal(produto.valorVenda),
            quantidade: String(produto.quantidade),
          }
        : VAZIO,
    );
    setFaixaModo(produto?.faixaPropria ? "propria" : "categoria");
    setFaixa(faixaParaTextos(produto?.faixaPropria));
    setErrosFaixa({});
    setErro("");
    setInvalidos([]);
  }, [aberto, produto]);

  const faixaDaCategoria =
    categorias.find((categoria) => String(categoria.id) === valores.categoriaId)?.criterios ?? null;

  function escolherModo(modo) {
    setFaixaModo(modo);
    // Ao definir a faixa própria pela primeira vez, parte dos valores da categoria.
    if (modo === "propria" && Object.values(faixa).every((valor) => valor === "")) {
      setFaixa(faixaParaTextos(faixaDaCategoria));
    }
    setErrosFaixa({});
  }

  function mudarFaixa(chave, valor) {
    setFaixa((atual) => ({ ...atual, [chave]: valor }));
    setErrosFaixa((atual) => ({ ...atual, [chave]: undefined }));
  }

  function mudar(campo, filtro) {
    return (evento) => {
      const valor = filtro ? evento.target.value.replace(filtro, "") : evento.target.value;
      setValores((atuais) => ({ ...atuais, [campo]: valor }));
      setInvalidos((atuais) => atuais.filter((item) => item !== campo));
    };
  }

  function escolherImagem(evento) {
    const arquivo = evento.target.files?.[0];
    if (!arquivo) return;
    const leitor = new FileReader();
    leitor.onload = () => setValores((atuais) => ({ ...atuais, imagem: String(leitor.result) }));
    leitor.readAsDataURL(arquivo);
  }

  const compra = paraNumero(valores.valorCompra);
  const venda = paraNumero(valores.valorVenda);
  const lucro = compra != null && venda != null ? calcularLucro(venda, compra) : null;

  function confirmar(evento) {
    evento.preventDefault();
    const quantidade = valores.quantidade === "" ? null : Number(valores.quantidade);
    const entrada = {
      imagem: valores.imagem,
      codigo: valores.codigo,
      nome: valores.nome,
      categoriaId: valores.categoriaId ? Number(valores.categoriaId) : null,
      valorCompra: compra,
      valorVenda: venda,
      quantidade,
      faixaPropria: faixaModo === "propria" ? faixa : null,
    };
    const resultado = editando ? editarProduto(produto.id, entrada) : cadastrarProduto(entrada);
    if (!resultado.erro && !resultado.erros) {
      aoFechar();
      return;
    }

    const faltando = resultado.erro
      ? [
          !valores.codigo.trim() && "codigo",
          !valores.nome.trim() && "nome",
          entrada.categoriaId == null && "categoriaId",
          (compra == null || compra < 0) && "valorCompra",
          (venda == null || venda < 0) && "valorVenda",
          !editando && (quantidade == null || !Number.isInteger(quantidade)) && "quantidade",
        ].filter(Boolean)
      : [];
    setErro(resultado.erro ?? "");
    setInvalidos(faltando);
    setErrosFaixa(resultado.erros ?? {});

    // O foco vai para o primeiro campo com problema, na ordem em que aparecem no formulário.
    const primeiroDaFaixa = CAMPOS_FAIXA.find(([chave]) => resultado.erros?.[chave])?.[0];
    if (faltando[0]) refs[faltando[0]]?.current?.focus();
    else if (primeiroDaFaixa) document.getElementById(`produto-faixa-${primeiroDaFaixa}`)?.focus();
  }

  const idFormulario = "formulario-produto";
  const invalido = (campo) => (invalidos.includes(campo) ? true : undefined);

  return (
    <Modal
      aberto={aberto}
      aoFechar={aoFechar}
      titulo={editando ? "Editar Produto" : "Novo Produto"}
      erro={erro}
      rodape={
        <>
          <Button variante="secundario" onClick={aoFechar}>
            Cancelar
          </Button>
          <Button type="submit" form={idFormulario}>
            {editando ? "Editar" : "Cadastrar"}
          </Button>
        </>
      }
    >
      <form id={idFormulario} className="produto-formulario" onSubmit={confirmar} noValidate>
        <div className="campo produto-formulario__imagem">
          <label htmlFor={idImagem} className="campo__rotulo">
            Imagem
          </label>
          <div className="produto-formulario__linha-imagem">
            {valores.imagem ? (
              <img className="produto-formulario__previa" src={valores.imagem} alt="" />
            ) : (
              <span className="produto-formulario__previa" aria-hidden="true" />
            )}
            <input
              id={idImagem}
              type="file"
              accept="image/*"
              className="produto-formulario__arquivo"
              onChange={escolherImagem}
            />
          </div>
        </div>

        <TextField
          ref={refs.codigo}
          rotulo="Código"
          obrigatorio
          autoComplete="off"
          value={valores.codigo}
          onChange={mudar("codigo")}
          aria-invalid={invalido("codigo")}
        />
        <TextField
          ref={refs.nome}
          rotulo="Nome"
          obrigatorio
          autoComplete="off"
          value={valores.nome}
          onChange={mudar("nome")}
          aria-invalid={invalido("nome")}
        />
        <SelectField
          ref={refs.categoriaId}
          rotulo="Categoria"
          obrigatorio
          value={valores.categoriaId}
          onChange={mudar("categoriaId")}
          aria-invalid={invalido("categoriaId")}
          opcoes={[
            { valor: "", rotulo: "—" },
            ...categorias.map((categoria) => ({ valor: String(categoria.id), rotulo: categoria.nome })),
          ]}
        />
        <div className="produto-formulario__duas-colunas">
          <TextField
            ref={refs.valorCompra}
            rotulo="Valor de Compra"
            obrigatorio
            inputMode="decimal"
            autoComplete="off"
            placeholder="R$ 0,00"
            value={valores.valorCompra}
            onChange={mudar("valorCompra", /[^\d.,]/g)}
            aria-invalid={invalido("valorCompra")}
          />
          <TextField
            ref={refs.valorVenda}
            rotulo="Valor de Venda"
            obrigatorio
            inputMode="decimal"
            autoComplete="off"
            placeholder="R$ 0,00"
            value={valores.valorVenda}
            onChange={mudar("valorVenda", /[^\d.,]/g)}
            aria-invalid={invalido("valorVenda")}
          />
        </div>
        <div className="produto-formulario__duas-colunas">
          {!editando && (
            <TextField
              ref={refs.quantidade}
              rotulo="Quantidade"
              obrigatorio
              inputMode="numeric"
              autoComplete="off"
              value={valores.quantidade}
              onChange={mudar("quantidade", /\D/g)}
              aria-invalid={invalido("quantidade")}
            />
          )}
          <div className="campo">
            <span id={idLucro} className="campo__rotulo">
              Lucro
            </span>
            <output className="produto-formulario__lucro" aria-labelledby={idLucro}>
              {lucro != null ? formatarMoeda(lucro) : "—"}
            </output>
          </div>
        </div>

        <fieldset className="produto-formulario__faixa">
          <legend className="campo__rotulo">Faixa de estoque</legend>
          <label className="produto-formulario__opcao">
            <input
              type="radio"
              name="faixa-modo"
              checked={faixaModo === "categoria"}
              onChange={() => escolherModo("categoria")}
            />
            <span>Usar a faixa da categoria</span>
          </label>
          {faixaModo === "categoria" && (
            <p className="produto-formulario__faixa-texto">
              {faixaDaCategoria
                ? `Faixa da categoria: ${textoCriterios(faixaDaCategoria)}`
                : "Escolha a categoria para ver a faixa."}
            </p>
          )}
          <label className="produto-formulario__opcao">
            <input
              type="radio"
              name="faixa-modo"
              checked={faixaModo === "propria"}
              onChange={() => escolherModo("propria")}
            />
            <span>Definir faixa própria</span>
          </label>
          {faixaModo === "propria" && (
            <div className="produto-formulario__duas-colunas">
              {CAMPOS_FAIXA.map(([chave, rotulo]) => (
                <TextField
                  key={chave}
                  id={`produto-faixa-${chave}`}
                  rotulo={rotulo}
                  type="number"
                  inputMode="numeric"
                  min="0"
                  step="1"
                  obrigatorio
                  value={faixa[chave]}
                  onChange={(evento) => mudarFaixa(chave, evento.target.value)}
                  erro={errosFaixa[chave]}
                />
              ))}
            </div>
          )}
        </fieldset>
      </form>
    </Modal>
  );
}
