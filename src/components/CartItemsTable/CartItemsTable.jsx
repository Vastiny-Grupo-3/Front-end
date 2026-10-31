import { useEffect, useRef } from "react";
import { Trash2 } from "lucide-react";
import DataTable from "../DataTable/DataTable.jsx";
import Stepper from "../Stepper/Stepper.jsx";
import MoneyPercentField from "../MoneyPercentField/MoneyPercentField.jsx";
import Button from "../Button/Button.jsx";
import ProductCell from "../ProductCell/ProductCell.jsx";
import { useCart } from "../../context/CartContext.jsx";
import { useStock } from "../../context/StockContext.jsx";
import { nomeCategoria } from "../../utils/estoque.js";
import { formatarMoeda } from "../../utils/formatadores.js";
import "./CartItemsTable.css";

const VAZIO = "Este carrinho está vazio. Adicione produtos pelo catálogo.";

/**
 * Itens do carrinho atual (TL02 e TL03): quantidade limitada ao estoque,
 * desconto em R$ e % vinculados, total do item e lixeira.
 * `itens` permite mostrar só parte dos itens (pesquisa da TL03).
 */
export default function CartItemsTable({ itens }) {
  const stock = useStock();
  const { itens: todos, alterarQuantidade, alterarDesconto, removerProduto } = useCart();
  const conteinerRef = useRef(null);
  const indiceRemovido = useRef(null);

  // Ao remover um item, o foco vai para a lixeira que ocupou o lugar (ou para a tabela, se esvaziar).
  useEffect(() => {
    if (indiceRemovido.current == null) return;
    const lixeiras = conteinerRef.current?.querySelectorAll(".itens-carrinho__remover") ?? [];
    const alvo = lixeiras[Math.min(indiceRemovido.current, lixeiras.length - 1)];
    (alvo ?? conteinerRef.current)?.focus();
    indiceRemovido.current = null;
  });

  function remover(linha) {
    indiceRemovido.current = linhas.findIndex((atual) => atual.produtoId === linha.produtoId);
    removerProduto(linha.produtoId);
  }

  const linhas = (itens ?? todos).map((item) => ({
    ...item,
    id: item.produtoId,
    posicao: todos.indexOf(item) + 1,
  }));

  const colunas = [
    { chave: "posicao", titulo: "#" },
    {
      chave: "produto",
      titulo: "Produto",
      renderizar: (linha) => (
        <ProductCell
          nome={linha.produto.nome}
          codigo={linha.produto.codigos?.[0]}
          imagem={linha.produto.imagem}
        />
      ),
    },
    {
      chave: "categoria",
      titulo: "Categoria",
      renderizar: (linha) => nomeCategoria(stock, linha.produto.categoriaId),
    },
    {
      chave: "quantidade",
      titulo: "Quantidade",
      renderizar: (linha) => (
        <Stepper
          className="stepper--compacto"
          rotulo={`Quantidade de ${linha.produto.nome}`}
          rotuloOculto
          valor={linha.quantidade}
          min={1}
          max={linha.produto.quantidade}
          aoMudar={(quantidade) => alterarQuantidade(linha.produtoId, quantidade)}
        />
      ),
    },
    {
      chave: "preco",
      titulo: "Preço por Unidade",
      renderizar: (linha) => formatarMoeda(linha.precoUnitario),
    },
    {
      chave: "desconto",
      titulo: "Desconto",
      renderizar: (linha) => (
        <MoneyPercentField
          className="itens-carrinho__desconto"
          rotulo={`Desconto de ${linha.produto.nome}`}
          rotuloOculto
          valorLinha={linha.valorLinha}
          desconto={linha.desconto}
          aoMudar={(desconto) => alterarDesconto(linha.produtoId, desconto)}
        />
      ),
    },
    {
      chave: "total",
      titulo: "Total",
      renderizar: (linha) => formatarMoeda(linha.total),
    },
    {
      chave: "remover",
      titulo: <span className="sr-only">Remover</span>,
      rotulo: "Remover",
      renderizar: (linha) => (
        <Button
          variante="icone"
          icone={Trash2}
          className="itens-carrinho__remover botao--leve"
          aria-label={`Remover ${linha.produto.nome} do carrinho`}
          onClick={() => remover(linha)}
        />
      ),
    },
  ];

  return (
    <div ref={conteinerRef} className="itens-carrinho__conteiner" tabIndex={-1}>
      <DataTable
        className="itens-carrinho"
        legenda="Itens do carrinho"
        colunas={colunas}
        linhas={linhas}
        mensagemVazio={VAZIO}
      />
    </div>
  );
}
