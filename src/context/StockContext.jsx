import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { dadosIniciais } from "../data/index.js";
import * as estoque from "../utils/estoque.js";
import { hojeIso } from "../utils/formatadores.js";

/*
 * Dados da empresa (produtos, categorias, clientes e histórico), os mesmos
 * para todas as contas. Mock em memória: recarregar a página volta aos dados
 * iniciais de src/data/.
 *
 * Cada ação devolve o resultado da função pura: { erro?, erros?, registro? }.
 */

const StockContext = createContext(null);

export function StockProvider({ children }) {
  const [dados, setDados] = useState(dadosIniciais);
  const dadosRef = useRef(dadosIniciais);

  // Aplica uma função pura sobre os dados mais recentes e guarda o resultado.
  const aplicar = useCallback((operacao) => {
    const resultado = operacao(dadosRef.current);
    if (resultado.dados !== dadosRef.current) {
      dadosRef.current = resultado.dados;
      setDados(resultado.dados);
    }
    const { dados: _ignorado, ...retorno } = resultado;
    return retorno;
  }, []);

  const acoes = useMemo(
    () => ({
      cadastrarProduto: (entrada) => aplicar((d) => estoque.cadastrarProduto(d, entrada, hojeIso())),
      editarProduto: (id, entrada) => aplicar((d) => estoque.editarProduto(d, id, entrada)),
      excluirProduto: (id) => aplicar((d) => estoque.excluirProduto(d, id)),
      registrarEntrada: (id, quantidade) =>
        aplicar((d) => estoque.registrarEntrada(d, id, quantidade, hojeIso())),
      registrarSaida: (id, quantidade, justificativa) =>
        aplicar((d) => estoque.registrarSaida(d, id, quantidade, justificativa, hojeIso())),
      registrarVenda: (venda) => aplicar((d) => estoque.registrarVenda(d, venda)),
      cadastrarCliente: (entrada) => aplicar((d) => estoque.cadastrarCliente(d, entrada, hojeIso())),
      editarCliente: (id, entrada) => aplicar((d) => estoque.editarCliente(d, id, entrada)),
      excluirCliente: (id) => aplicar((d) => estoque.excluirCliente(d, id)),
      criarCategoria: (nome) => aplicar((d) => estoque.criarCategoria(d, nome)),
      editarCategoria: (id, nome) => aplicar((d) => estoque.editarCategoria(d, id, nome)),
      excluirCategoria: (id) => aplicar((d) => estoque.excluirCategoria(d, id)),
    }),
    [aplicar],
  );

  // Leitura dos dados mais recentes (útil para quem precisa calcular antes de agir).
  const lerDados = useCallback(() => dadosRef.current, []);

  // Situação do carregamento: "carregando" | "pronto" | "erro". Com os mocks é sempre "pronto";
  // o back-end vai alimentar este valor e `recarregar` ("Tentar novamente").
  const [status] = useState("pronto");
  const recarregar = useCallback(() => {}, []);

  const valor = useMemo(
    () => ({ ...dados, ...acoes, lerDados, status, recarregar }),
    [dados, acoes, lerDados, status, recarregar],
  );

  return <StockContext.Provider value={valor}>{children}</StockContext.Provider>;
}

export function useStock() {
  const contexto = useContext(StockContext);
  if (!contexto) throw new Error("useStock precisa estar dentro de StockProvider.");
  return contexto;
}
