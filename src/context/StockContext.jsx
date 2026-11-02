import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { dadosIniciais } from "../data/index.js";
import { useAuth } from "./AuthContext.jsx";
import { modoApi } from "../services/config.js";
import * as clientesApi from "../services/clientes.js";
import * as categoriasApi from "../services/categorias.js";
import * as produtosApi from "../services/produtos.js";
import { ErroApi } from "../services/http.js";
import * as estoque from "../utils/estoque.js";
import { hojeIso } from "../utils/formatadores.js";

/*
 * Dados da empresa (produtos, categorias, clientes e histórico), os mesmos
 * para todas as contas. Mock em memória: recarregar a página volta aos dados
 * iniciais de src/data/.
 *
 * No modo API (VITE_API_URL) clientes, categorias e produtos vêm da API: as listas começam
 * vazias e são carregadas ao entrar; cadastrar, editar e excluir clientes e categorias passam a
 * ser assíncronos. Produtos são só de leitura: cadastrar, entrada, saída e venda funcionam em
 * memória e somem ao recarregar, porque o back ainda não tem essas rotas. As vendas e os
 * históricos de exemplo não existem no modo API (os ids deles não são os do banco).
 *
 * Cada ação devolve o resultado da função pura: { erro?, erros?, registro? }.
 */

const StockContext = createContext(null);

const dadosDoModo = modoApi
  ? {
      categorias: [],
      produtos: [],
      clientes: [],
      vendas: [],
      entradas: [],
      saidas: [],
      cadastrosProdutos: [],
      cadastrosClientes: [],
    }
  : dadosIniciais;

/** Erro de uma chamada de categoria → { erros } do formulário; falhas de rede e do servidor são lançadas. */
function resultadoDeErroDeCategoria(erro) {
  if (erro instanceof ErroApi && ["validacao", "conflito"].includes(erro.tipo)) {
    const erros = categoriasApi.errosDosCampos(erro);
    if (Object.keys(erros).length > 0) return { erros };
  }
  throw erro;
}

export function StockProvider({ children }) {
  const { usuario } = useAuth();
  const [dados, setDados] = useState(dadosDoModo);
  const dadosRef = useRef(dadosDoModo);
  const [statusClientes, setStatusClientes] = useState(modoApi ? "carregando" : "pronto");
  // Categorias e produtos: "carregando" | "pronto" | "erro". Com os mocks é sempre "pronto".
  const [status, setStatus] = useState(modoApi ? "carregando" : "pronto");

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
        tipo: cliente.tipo ?? atuais.find((atual) => atual.id === cliente.id)?.tipo ?? "pessoa-fisica",
      }));
      dadosRef.current = { ...dadosRef.current, clientes };
      setDados(dadosRef.current);
      setStatusClientes("pronto");
    } catch {
      setStatusClientes("erro");
    }
  }, []);

  // Carrega categorias e produtos da API (a faixa e o estado dos produtos o site calcula).
  const carregarCadastros = useCallback(async () => {
    if (!modoApi) return;
    setStatus("carregando");
    try {
      const [categorias, produtos] = await Promise.all([
        categoriasApi.listarCategorias(),
        produtosApi.listarProdutos(),
      ]);
      dadosRef.current = { ...dadosRef.current, categorias, produtos };
      setDados(dadosRef.current);
      setStatus("pronto");
    } catch {
      setStatus("erro");
    }
  }, []);

  const idDaConta = usuario?.id ?? null;
  useEffect(() => {
    if (idDaConta == null) return;
    carregarClientes();
    carregarCadastros();
  }, [idDaConta, carregarClientes, carregarCadastros]);

  // Clientes pela API: validam no site, chamam a API e só então atualizam a lista.
  // Falhas de rede ou do servidor são lançadas (a tela mostra a mensagem de erro ao salvar).
  const acoesClientesApi = useMemo(
    () => ({
      cadastrarCliente: async (entrada) => {
        const erros = estoque.validarCliente(entrada);
        if (Object.keys(erros).length > 0) return { erros };
        const campos = estoque.camposCliente(entrada);
        const salvo = await clientesApi.criarCliente(campos);
        const cliente = {
          ...campos,
          ...salvo,
          descricao: salvo.descricao ?? campos.descricao,
          tipo: salvo.tipo ?? campos.tipo,
        };
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

  // Categorias pela API: validam no site (nome repetido e faixa), chamam a API e só então atualizam a lista.
  const acoesCategoriasApi = useMemo(
    () => ({
      criarCategoria: async (entrada) => {
        const montado = estoque.montarCategoria(dadosRef.current, entrada);
        if (montado.erros) return { erros: montado.erros };
        try {
          const salva = await categoriasApi.criarCategoria(montado);
          return aplicar((d) => ({ dados: { ...d, categorias: [...d.categorias, salva] }, registro: salva }));
        } catch (erro) {
          return resultadoDeErroDeCategoria(erro);
        }
      },
      editarCategoria: async (id, entrada) => {
        const montado = estoque.montarCategoria(dadosRef.current, entrada, id);
        if (montado.erros) return { erros: montado.erros };
        try {
          const salva = await categoriasApi.atualizarCategoria(id, montado);
          return aplicar((d) => ({
            dados: { ...d, categorias: d.categorias.map((categoria) => (categoria.id === id ? salva : categoria)) },
          }));
        } catch (erro) {
          return resultadoDeErroDeCategoria(erro);
        }
      },
      // Categoria com produtos (409): devolve a mensagem do servidor em `erro`.
      excluirCategoria: async (id) => {
        try {
          await categoriasApi.excluirCategoria(id);
        } catch (erro) {
          if (erro instanceof ErroApi && erro.tipo === "conflito") {
            return { erro: erro.erros.categoria ?? estoque.MENSAGENS_ESTOQUE.categoriaComProdutos(estoque.contarProdutosDaCategoria(dadosRef.current, id)) };
          }
          throw erro;
        }
        return aplicar((d) => ({ dados: { ...d, categorias: d.categorias.filter((categoria) => categoria.id !== id) } }));
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
      ...(modoApi ? { ...acoesClientesApi, ...acoesCategoriasApi } : {}),
    }),
    [aplicar, acoesClientesApi, acoesCategoriasApi],
  );

  // Leitura dos dados mais recentes (útil para quem precisa calcular antes de agir).
  const lerDados = useCallback(() => dadosRef.current, []);

  // `status` e `recarregar` ("Tentar novamente") são da carga de categorias e produtos.
  const recarregar = carregarCadastros;

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
