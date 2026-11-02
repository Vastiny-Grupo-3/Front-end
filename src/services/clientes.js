import { api } from "./http.js";

/*
 * Clientes pela API (docs/contrato-api.md). A descrição só volta se o back-end a
 * guardar; sem ela, `descricao` fica indefinida e quem chama mantém a que já tem.
 */

/* O site usa "pessoa-fisica" e "empresa"; a API, PESSOA_FISICA e EMPRESA. */
const tipoParaApi = (tipo) => (tipo === "empresa" ? "EMPRESA" : "PESSOA_FISICA");

function dosDados(cliente) {
  return {
    id: cliente.id,
    nome: cliente.nome ?? "",
    telefone: cliente.telefone ?? "",
    descricao: typeof cliente.descricao === "string" ? cliente.descricao : undefined,
    tipo: cliente.tipo === "EMPRESA" ? "empresa" : cliente.tipo === "PESSOA_FISICA" ? "pessoa-fisica" : undefined,
    dataCadastro: cliente.dataCadastro ?? null,
  };
}

export async function listarClientes() {
  const { data: lista } = await api.get("/clientes");
  return Array.isArray(lista) ? lista.map(dosDados) : [];
}

export async function criarCliente(campos) {
  const { data } = await api.post("/clientes", { ...campos, tipo: tipoParaApi(campos.tipo) });
  return dosDados(data);
}

export async function atualizarCliente(id, campos) {
  const { data } = await api.put(`/clientes/${id}`, { ...campos, tipo: tipoParaApi(campos.tipo) });
  return dosDados(data);
}

export async function excluirCliente(id) {
  await api.delete(`/clientes/${id}`);
}
