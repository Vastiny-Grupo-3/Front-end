import { useId } from "react";
import { Package } from "lucide-react";
import Button from "../Button/Button.jsx";
import Stepper from "../Stepper/Stepper.jsx";
import { formatarMoeda } from "../../utils/formatadores.js";
import "./ProductCard.css";

/**
 * Card de produto.
 * variante: "catalogo" | "entrada" | "saida"
 * produto: { nome, categoria, imagem, precoConsumidor, quantidade }
 */
export default function ProductCard({
  produto,
  variante = "catalogo",
  noCarrinho = false,
  quantidadeNoCarrinho = 0,
  carregando = false,
  nivelTitulo = 2,
  aoAdicionar,
  aoRemover,
  aoAlterarQuantidade,
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
    <article
      className={variante === "entrada" ? "produto produto--entrada" : "produto"}
      aria-labelledby={idNome}
    >
      {produto.imagem ? (
        <img className="produto__imagem" src={produto.imagem} alt={produto.nome} />
      ) : (
        <div className="produto__imagem produto__imagem--vazia" aria-hidden="true">
          <Package className="produto__icone-vazio" />
        </div>
      )}
      <p className="produto__categoria">{produto.categoria}</p>
      <Titulo id={idNome} className="produto__nome">
        {produto.nome}
      </Titulo>
      <div className="produto__valores">
        <p className="produto__preco">
          <span className="produto__valor-rotulo">Preço</span>
          <span className="produto__valor">{formatarMoeda(produto.precoConsumidor)}</span>
        </p>
        <p className={`produto__estoque ${semEstoque ? "produto__estoque--vazio" : ""}`.trim()}>
          <span className="produto__valor-rotulo">Estoque</span>
          <span className="produto__valor">{produto.quantidade}</span>
        </p>
      </div>

      <div className="produto__acoes">
        {variante === "catalogo" && semEstoque && !noCarrinho && (
          <p className="produto__indisponivel">Produto indisponível no momento.</p>
        )}

        {variante === "catalogo" && noCarrinho && (
          <div className="produto__no-carrinho">
            <Stepper
              className="stepper--compacto"
              rotulo={`Quantidade de ${produto.nome} no carrinho`}
              rotuloOculto
              valor={quantidadeNoCarrinho}
              min={1}
              max={Math.max(produto.quantidade, quantidadeNoCarrinho)}
              aoMudar={aoAlterarQuantidade}
            />
            <Button variante="destrutivo" onClick={aoRemover} aria-describedby={idNome}>
              Excluir do Carrinho
            </Button>
          </div>
        )}

        {variante === "catalogo" && !semEstoque && !noCarrinho && (
          <Button variante="primario" onClick={aoAdicionar} aria-describedby={idNome}>
            Adicionar ao Carrinho
          </Button>
        )}

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
