import { useEffect, useId, useRef, useState } from "react";
import Modal from "../../components/Modal/Modal.jsx";
import Button from "../../components/Button/Button.jsx";
import TextField from "../../components/TextField/TextField.jsx";
import SelectField from "../../components/SelectField/SelectField.jsx";
import { useStock } from "../../context/StockContext.jsx";
import { CAMPOS_FAIXA, MAXIMO_CODIGOS, calcularLucro, textoCriterios } from "../../utils/estoque.js";
import { formatarDecimal, formatarMoeda, lerDecimal } from "../../utils/formatadores.js";

const VAZIO = {
  imagem: "",
  codigos: Array(MAXIMO_CODIGOS).fill(""),
  nome: "",
  categoriaId: "",
  valorCompra: "",
  precoConsumidor: "",
  precoEmpresa: "",
  quantidade: "",
};
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
  const [errosCodigos, setErrosCodigos] = useState([]);
  const [erro, setErro] = useState("");
  const [invalidos, setInvalidos] = useState([]);
  const refs = {
    codigo: useRef(null),
    codigo2: useRef(null),
    codigo3: useRef(null),
    codigo4: useRef(null),
    nome: useRef(null),
    categoriaId: useRef(null),
    valorCompra: useRef(null),
    precoConsumidor: useRef(null),
    precoEmpresa: useRef(null),
    quantidade: useRef(null),
  };
  const idImagem = `imagem-${useId()}`;
  const idLucroConsumidor = `lucro-consumidor-${useId()}`;
  const idLucroEmpresa = `lucro-empresa-${useId()}`;

  useEffect(() => {
    if (!aberto) return;
    setValores(
      produto
        ? {
            imagem: produto.imagem ?? "",
            codigos: Array.from({ length: MAXIMO_CODIGOS }, (_, indice) => produto.codigos[indice] ?? ""),
            nome: produto.nome,
            categoriaId: String(produto.categoriaId),
            valorCompra: formatarDecimal(produto.valorCompra),
            precoConsumidor: formatarDecimal(produto.precoConsumidor),
            precoEmpresa: formatarDecimal(produto.precoEmpresa),
            quantidade: String(produto.quantidade),
          }
        : VAZIO,
    );
    setFaixaModo(produto?.faixaPropria ? "propria" : "categoria");
    setFaixa(faixaParaTextos(produto?.faixaPropria));
    setErrosFaixa({});
    setErrosCodigos([]);
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

  function mudarCodigo(indice) {
    return (evento) => {
      const codigos = valores.codigos.map((atual, posicao) => (posicao === indice ? evento.target.value : atual));
      setValores((atuais) => ({ ...atuais, codigos }));
      setInvalidos((atuais) => atuais.filter((item) => item !== "codigo"));
      setErrosCodigos((atuais) => atuais.map((mensagem, posicao) => (posicao === indice ? "" : mensagem)));
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
  const consumidor = paraNumero(valores.precoConsumidor);
  const empresa = paraNumero(valores.precoEmpresa);
  const lucroConsumidor = compra != null && consumidor != null ? calcularLucro(consumidor, compra) : null;
  const lucroEmpresa = compra != null && empresa != null ? calcularLucro(empresa, compra) : null;

  function confirmar(evento) {
    evento.preventDefault();
    const quantidade = valores.quantidade === "" ? null : Number(valores.quantidade);
    const entrada = {
      imagem: valores.imagem,
      codigos: valores.codigos,
      nome: valores.nome,
      categoriaId: valores.categoriaId ? Number(valores.categoriaId) : null,
      valorCompra: compra,
      precoEmpresa: empresa,
      precoConsumidor: consumidor,
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
          !valores.codigos[0].trim() && "codigo",
          !valores.nome.trim() && "nome",
          entrada.categoriaId == null && "categoriaId",
          (compra == null || compra < 0) && "valorCompra",
          !editando && (quantidade == null || !Number.isInteger(quantidade)) && "quantidade",
          (consumidor == null || consumidor < 0) && "precoConsumidor",
          (empresa == null || empresa < 0) && "precoEmpresa",
        ].filter(Boolean)
      : [];
    setErro(resultado.erro ?? "");
    setInvalidos(faltando);
    setErrosFaixa(resultado.erros ?? {});
    setErrosCodigos(resultado.erros?.codigos ?? []);

    // O foco vai para o primeiro campo com problema, na ordem em que aparecem no formulário.
    const primeiroDaFaixa = CAMPOS_FAIXA.find(([chave]) => resultado.erros?.[chave])?.[0];
    const primeiroCodigo = (resultado.erros?.codigos ?? []).findIndex(Boolean);
    if (faltando[0]) refs[faltando[0]]?.current?.focus();
    else if (primeiroCodigo >= 0) refs[["codigo", "codigo2", "codigo3", "codigo4"][primeiroCodigo]]?.current?.focus();
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

        <div className="produto-formulario__duas-colunas">
          <TextField
            ref={refs.codigo}
            rotulo="Código"
            obrigatorio
            autoComplete="off"
            value={valores.codigos[0]}
            onChange={mudarCodigo(0)}
            erro={errosCodigos[0] || undefined}
            aria-invalid={invalido("codigo")}
          />
          <TextField
            ref={refs.codigo2}
            rotulo="Código 2"
            autoComplete="off"
            value={valores.codigos[1]}
            onChange={mudarCodigo(1)}
            erro={errosCodigos[1] || undefined}
          />
          <TextField
            ref={refs.codigo3}
            rotulo="Código 3"
            autoComplete="off"
            value={valores.codigos[2]}
            onChange={mudarCodigo(2)}
            erro={errosCodigos[2] || undefined}
          />
          <TextField
            ref={refs.codigo4}
            rotulo="Código 4"
            autoComplete="off"
            value={valores.codigos[3]}
            onChange={mudarCodigo(3)}
            erro={errosCodigos[3] || undefined}
          />
        </div>
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
        </div>
        <div className="produto-formulario__duas-colunas">
          <TextField
            ref={refs.precoConsumidor}
            rotulo="Valor de Venda — Pessoa Física"
            obrigatorio
            inputMode="decimal"
            autoComplete="off"
            placeholder="R$ 0,00"
            value={valores.precoConsumidor}
            onChange={mudar("precoConsumidor", /[^\d.,]/g)}
            aria-invalid={invalido("precoConsumidor")}
          />
          <TextField
            ref={refs.precoEmpresa}
            rotulo="Valor de Venda — Empresa"
            obrigatorio
            inputMode="decimal"
            autoComplete="off"
            placeholder="R$ 0,00"
            value={valores.precoEmpresa}
            onChange={mudar("precoEmpresa", /[^\d.,]/g)}
            aria-invalid={invalido("precoEmpresa")}
          />
        </div>
        <div className="produto-formulario__duas-colunas">
          <div className="campo">
            <span id={idLucroConsumidor} className="campo__rotulo">
              Lucro — Pessoa Física
            </span>
            <output className="produto-formulario__lucro" aria-labelledby={idLucroConsumidor}>
              {lucroConsumidor != null ? formatarMoeda(lucroConsumidor) : "—"}
            </output>
          </div>
          <div className="campo">
            <span id={idLucroEmpresa} className="campo__rotulo">
              Lucro — Empresa
            </span>
            <output className="produto-formulario__lucro" aria-labelledby={idLucroEmpresa}>
              {lucroEmpresa != null ? formatarMoeda(lucroEmpresa) : "—"}
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
