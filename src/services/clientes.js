import { requisicao } from "./http.js";

/*
 * Clientes pela API (docs/contrato-api.md). A descrição só volta se o back-end a
 * guardar; sem ela, `descricao` fica indefinida e quem chama mantém a que já tem.
 */

function dosDados(cliente) {
  return {
    id: cliente.id,
    nome: cliente.nome ?? "",
    telefone: cliente.telefone ?? "",
    descricao: typeof cliente.descricao === "string" ? cliente.descricao : undefined,
    dataCadastro: cliente.dataCadastro ?? null,
  };
}

export async function listarClientes() {
  const lista = await requisicao("/clientes");
  return Array.isArray(lista) ? lista.map(dosDados) : [];
}

export async function criarCliente(campos) {
  return dosDados(await requisicao("/clientes", { metodo: "POST", corpo: campos }));
}

export async function atualizarCliente(id, campos) {
  return dosDados(await requisicao(`/clientes/${id}`, { metodo: "PUT", corpo: campos }));
}

export async function excluirCliente(id) {
  await requisicao(`/clientes/${id}`, { metodo: "DELETE" });
}
