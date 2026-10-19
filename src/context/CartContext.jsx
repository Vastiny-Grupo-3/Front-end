import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { useStock } from "./StockContext.jsx";
import * as carrinho from "../utils/carrinho.js";
import { proximoId } from "../utils/estoque.js";
import { hojeIso } from "../utils/formatadores.js";

/*
 * Vários carrinhos abertos ao mesmo tempo, com um carrinho atual.
 * Sempre existe pelo menos um carrinho: ao excluir ou finalizar o último,
 * um novo carrinho vazio é criado e passa a ser o atual. A numeração só
 * cresce (`ultimoNumero`), para nenhum nome de carrinho se repetir.
 */

const CartContext = createContext(null);

function estadoInicial() {
  const primeiro = carrinho.criarCarrinho(1);
  return { carrinhos: [primeiro], atualId: primeiro.id, ultimoNumero: 1 };
}

/* Acrescenta um carrinho vazio e o torna o atual. */
function comNovoCarrinho(estado, carrinhos = estado.carrinhos) {
  const novo = carrinho.criarCarrinho(estado.ultimoNumero + 1);
  return { carrinhos: [...carrinhos, novo], atualId: novo.id, ultimoNumero: novo.id };
}

/* Remove um carrinho e garante que reste um carrinho atual. */
function semCarrinho(estado, id) {
  const restantes = estado.carrinhos.filter((atual) => atual.id !== id);
  if (restantes.length === 0) return comNovoCarrinho(estado, []);
  const atualId = estado.atualId === id ? restantes[0].id : estado.atualId;
  return { ...estado, carrinhos: restantes, atualId };
}

export function CartProvider({ children }) {
  const stock = useStock();
  const { produtos, lerDados, registrarVenda } = stock;
  const [estado, setEstado] = useState(estadoInicial);
  const estadoRef = useRef(estado);
  // Modal do carrinho (TL02): aberto pelo ícone do carrinho e por "Alterar carrinho".
  const [modalAberto, setModalAberto] = useState(false);
  const abrirModal = useCallback(() => setModalAberto(true), []);
  const fecharModal = useCallback(() => setModalAberto(false), []);

  const guardar = useCallback((novo) => {
    estadoRef.current = novo;
    setEstado(novo);
  }, []);

  // Aplica uma alteração ao carrinho atual. `operacao` devolve o carrinho novo ou { carrinho, erro }.
  const alterarAtual = useCallback(
    (operacao) => {
      const atual = estadoRef.current;
      const alvo = atual.carrinhos.find((item) => item.id === atual.atualId);
      const resultado = operacao(alvo);
      const { carrinho: novo, erro = null } = "itens" in resultado ? { carrinho: resultado } : resultado;
      if (novo !== alvo) {
        guardar({
          ...atual,
          carrinhos: atual.carrinhos.map((item) => (item.id === alvo.id ? novo : item)),
        });
      }
      return { erro };
    },
    [guardar],
  );

  const produtoPorId = useCallback(
    (id) => lerDados().produtos.find((produto) => produto.id === id),
    [lerDados],
  );

  const acoes = useMemo(
    () => ({
      adicionarProduto: (produtoId) => {
        const produto = produtoPorId(produtoId);
        return produto ? alterarAtual((atual) => carrinho.adicionarItem(atual, produto)) : { erro: null };
      },
      removerProduto: (produtoId) => alterarAtual((atual) => carrinho.removerItem(atual, produtoId)),
      alterarQuantidade: (produtoId, quantidade) =>
        alterarAtual((atual) => carrinho.alterarQuantidade(atual, produtoPorId(produtoId), quantidade)),
      alterarDesconto: (produtoId, desconto) =>
        alterarAtual((atual) => carrinho.alterarDesconto(atual, produtoPorId(produtoId), desconto)),
      definirCliente: (clienteId) => alterarAtual((atual) => carrinho.definirCliente(atual, clienteId)),

      criarCarrinho: () => {
        const novoEstado = comNovoCarrinho(estadoRef.current);
        guardar(novoEstado);
        return novoEstado.carrinhos.at(-1);
      },
      trocarCarrinho: (id) => {
        const atual = estadoRef.current;
        if (atual.carrinhos.some((item) => item.id === id)) guardar({ ...atual, atualId: id });
      },
      excluirCarrinho: (id) => guardar(semCarrinho(estadoRef.current, id)),

      /**
       * Finaliza o carrinho atual: registra a venda (cliente opcional), baixa o
       * estoque e cria o registro no Histórico. Retorna { venda } ou { erro }.
       */
      finalizarCompra: () => {
        const atual = estadoRef.current;
        const alvo = atual.carrinhos.find((item) => item.id === atual.atualId);
        const dados = lerDados();

        const erro = carrinho.validarFinalizacao(alvo, dados.produtos);
        if (erro) return { erro };

        const venda = carrinho.criarVenda(alvo, {
          produtos: dados.produtos,
          clientes: dados.clientes,
          categorias: dados.categorias,
          id: proximoId(dados.vendas),
          data: hojeIso(),
        });
        const resultado = registrarVenda(venda);
        if (resultado.erro) return { erro: carrinho.MENSAGENS_CARRINHO.erroFinalizar };

        // Após a compra, o atual passa a ser um novo carrinho vazio (TL19).
        const restantes = atual.carrinhos.filter((item) => item.id !== alvo.id);
        guardar(comNovoCarrinho(atual, restantes));
        return { venda };
      },
    }),
    [alterarAtual, guardar, lerDados, produtoPorId, registrarVenda],
  );

  const carrinhoAtual = estado.carrinhos.find((item) => item.id === estado.atualId);

  const valor = useMemo(() => {
    const itens = carrinho.detalharItens(carrinhoAtual, produtos);
    return {
      carrinhos: estado.carrinhos,
      carrinhoAtual,
      itens,
      resumo: carrinho.calcularTotais(itens),
      estaNoCarrinho: (produtoId) => Boolean(carrinho.encontrarItem(carrinhoAtual, produtoId)),
      modalAberto,
      abrirModal,
      fecharModal,
      ...acoes,
    };
  }, [estado.carrinhos, carrinhoAtual, produtos, acoes, modalAberto, abrirModal, fecharModal]);

  return <CartContext.Provider value={valor}>{children}</CartContext.Provider>;
}

export function useCart() {
  const contexto = useContext(CartContext);
  if (!contexto) throw new Error("useCart precisa estar dentro de CartProvider.");
  return contexto;
}
