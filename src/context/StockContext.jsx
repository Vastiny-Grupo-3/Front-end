import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { dadosIniciais } from "../data/index.js";
import { useAuth } from "./AuthContext.jsx";
import { modoApi } from "../services/config.js";
import * as clientesApi from "../services/clientes.js";
import * as estoque from "../utils/estoque.js";
import { hojeIso } from "../utils/formatadores.js";

/*
 * Dados da empresa (produtos, categorias, clientes e histórico), os mesmos
 * para todas as contas. Mock em memória: recarregar a página volta aos dados
 * iniciais de src/data/.
 *
 * No modo API (VITE_API_URL) os clientes vêm da API: a lista começa vazia e é
 * carregada ao entrar, e cadastrar, editar e excluir passam a ser assíncronos.
 * O resto continua nos mocks. As vendas de exemplo perdem o vínculo com o cliente
 * (ids de exemplo não existem na API) mas mantêm o nome dele.
 *
 * Cada ação devolve o resultado da função pura: { erro?, erros?, registro? }.
 */

const StockContext = createContext(null);

const dadosDoModo = modoApi
  ? {
      ...dadosIniciais,
      clientes: [],
      cadastrosClientes: [],
      vendas: dadosIniciais.vendas.map((venda) => ({ ...venda, clienteId: null })),
    }
  : dadosIniciais;

export function StockProvider({ children }) {
  const { usuario } = useAuth();
  const [dados, setDados] = useState(dadosDoModo);
  const dadosRef = useRef(dadosDoModo);
  const [statusClientes, setStatusClientes] = useState(modoApi ? "carregando" : "pronto");

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

  // Carrega os clientes da API, mantendo a descrição que a API ainda não devolve.
  const carregarClientes = useCallback(async () => {
    if (!modoApi) return;
    setStatusClientes("carregando");
    try {
      const lista = await clientesApi.listarClientes();
      const atuais = dadosRef.current.clientes;
      const clientes = lista.map((cliente) => ({
        ...cliente,
        descricao: cliente.descricao ?? atuais.find((atual) => atual.id === cliente.id)?.descricao ?? "",
      }));
      dadosRef.current = { ...dadosRef.current, clientes };
      setDados(dadosRef.current);
      setStatusClientes("pronto");
    } catch {
      setStatusClientes("erro");
    }
  }, []);

  const idDaConta = usuario?.id ?? null;
  useEffect(() => {
    if (idDaConta != null) carregarClientes();
  }, [idDaConta, carregarClientes]);

  // Clientes pela API: validam no site, chamam a API e só então atualizam a lista.
  // Falhas de rede ou do servidor são lançadas (a tela mostra a mensagem de erro ao salvar).
  const acoesClientesApi = useMemo(
    () => ({
      cadastrarCliente: async (entrada) => {
        const erros = estoque.validarCliente(entrada);
        if (Object.keys(erros).length > 0) return { erros };
        const campos = estoque.camposCliente(entrada);
        const salvo = await clientesApi.criarCliente(campos);
        const cliente = { ...campos, ...salvo, descricao: salvo.descricao ?? campos.descricao };
        return aplicar((d) => estoque.incluirCliente(d, cliente, hojeIso()));
      },
      editarCliente: async (id, entrada) => {
        const erros = estoque.validarCliente(entrada);
        if (Object.keys(erros).length > 0) return { erros };
        await clientesApi.atualizarCliente(id, estoque.camposCliente(entrada));
        return aplicar((d) => estoque.editarCliente(d, id, entrada, hojeIso()));
      },
      excluirCliente: async (id) => {
        await clientesApi.excluirCliente(id);
        return aplicar((d) => estoque.excluirCliente(d, id));
      },
    }),
    [aplicar],
  );

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
      editarCliente: (id, entrada) => aplicar((d) => estoque.editarCliente(d, id, entrada, hojeIso())),
      excluirCliente: (id) => aplicar((d) => estoque.excluirCliente(d, id)),
      criarCategoria: (entrada) => aplicar((d) => estoque.criarCategoria(d, entrada)),
      editarCategoria: (id, entrada) => aplicar((d) => estoque.editarCategoria(d, id, entrada)),
      excluirCategoria: (id) => aplicar((d) => estoque.excluirCategoria(d, id)),
      ...(modoApi ? acoesClientesApi : {}),
    }),
    [aplicar, acoesClientesApi],
  );

  // Leitura dos dados mais recentes (útil para quem precisa calcular antes de agir).
  const lerDados = useCallback(() => dadosRef.current, []);

  // Situação do carregamento: "carregando" | "pronto" | "erro". Com os mocks é sempre "pronto";
  // o back-end vai alimentar este valor e `recarregar` ("Tentar novamente").
  const [status] = useState("pronto");
  const recarregar = useCallback(() => {}, []);

  // Os produtos chegam às telas com a faixa efetiva e o estado já calculados; por isso o
  // estado se atualiza sozinho após venda, entrada, saída ou edição de faixa.
  // `lerDados()` continua devolvendo os dados brutos (só o carrinho o usa).
  const produtos = useMemo(
    () => estoque.comEstoqueCalculado(dados.produtos, dados.categorias),
    [dados.produtos, dados.categorias],
  );

  // `statusClientes` e `recarregarClientes` são só da lista de clientes (vêm da API no modo API).
  const valor = useMemo(
    () => ({
      ...dados,
      produtos,
      ...acoes,
      lerDados,
      status,
      recarregar,
      statusClientes,
      recarregarClientes: carregarClientes,
    }),
    [dados, produtos, acoes, lerDados, status, recarregar, statusClientes, carregarClientes],
  );

  return <StockContext.Provider value={valor}>{children}</StockContext.Provider>;
}

export function useStock() {
  const contexto = useContext(StockContext);
  if (!contexto) throw new Error("useStock precisa estar dentro de StockProvider.");
  return contexto;
}
