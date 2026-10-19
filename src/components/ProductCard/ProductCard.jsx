import { useId } from "react";
import Button from "../Button/Button.jsx";
import { formatarMoeda } from "../../utils/formatadores.js";
import "./ProductCard.css";

/**
 * Card de produto.
 * variante: "catalogo" | "entrada" | "saida"
 * produto: { nome, categoria, imagem, valorVenda, quantidade }
 */
export default function ProductCard({
  produto,
  variante = "catalogo",
  noCarrinho = false,
  carregando = false,
  nivelTitulo = 2,
  aoAdicionar,
  aoRemover,
  aoEditar,
  aoAdicionarQtd,
  aoDarBaixa,
}) {
  const idNome = `produto-${useId()}`;
  const Titulo = `h${nivelTitulo}`;

  if (carregando) {
    return (
      <article className="produto produto--carregando" aria-busy="true">
        <span className="esqueleto produto__imagem" />
        <span className="esqueleto produto__esqueleto-linha" />
        <span className="esqueleto produto__esqueleto-linha produto__esqueleto-linha--curta" />
        <span className="esqueleto produto__esqueleto-botao" />
      </article>
    );
  }

  const semEstoque = produto.quantidade === 0;

  return (
    <article className="produto" aria-labelledby={idNome}>
      {produto.imagem ? (
        <img className="produto__imagem" src={produto.imagem} alt={produto.nome} />
      ) : (
        <div className="produto__imagem produto__imagem--vazia" aria-hidden="true" />
      )}
      <p className="produto__categoria">{produto.categoria}</p>
      <p className="produto__preco">
        {formatarMoeda(produto.valorVenda)} | {produto.quantidade} Qtd
      </p>
      <Titulo id={idNome} className="produto__nome">
        {produto.nome}
      </Titulo>

      <div className="produto__acoes">
        {variante === "catalogo" &&
          (noCarrinho ? (
            <Button variante="destrutivo" onClick={aoRemover} aria-describedby={idNome}>
              Excluir do Carrinho
            </Button>
          ) : (
            <Button
              variante="primario"
              onClick={aoAdicionar}
              disabled={semEstoque}
              aria-describedby={idNome}
            >
              Adicionar ao Carrinho
            </Button>
          ))}

        {variante === "entrada" && (
          <>
            <Button variante="secundario" onClick={aoEditar} aria-describedby={idNome}>
              Editar
            </Button>
            <Button variante="primario" onClick={aoAdicionarQtd} aria-describedby={idNome}>
              Adicionar Qtd.
            </Button>
          </>
        )}

        {variante === "saida" && (
          <Button variante="primario" onClick={aoDarBaixa} aria-describedby={idNome}>
            Dar Baixa
          </Button>
        )}
      </div>
    </article>
  );
}
