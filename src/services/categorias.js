import { api } from "./http.js";
import { MENSAGENS_ESTOQUE } from "../utils/estoque.js";

/*
 * Categorias pela API (docs/contrato-api.md): { id, nome, criterios: { bom, medio, ruim, critico } },
 * o mesmo formato que o site usa.
 */

function dosDados(categoria) {
  const criterios = categoria.criterios ?? {};
  return {
    id: categoria.id,
    nome: categoria.nome ?? "",
    criterios: {
      bom: Number(criterios.bom ?? 0),
      medio: Number(criterios.medio ?? 0),
      ruim: Number(criterios.ruim ?? 0),
      critico: Number(criterios.critico ?? 0),
    },
  };
}

export async function listarCategorias() {
  const { data: lista } = await api.get("/categorias");
  return Array.isArray(lista) ? lista.map(dosDados) : [];
}

export async function criarCategoria({ nome, criterios }) {
  const { data } = await api.post("/categorias", { nome, criterios });
  return dosDados(data);
}

export async function atualizarCategoria(id, { nome, criterios }) {
  const { data } = await api.put(`/categorias/${id}`, { nome, criterios });
  return dosDados(data);
}

export async function excluirCategoria(id) {
  await api.delete(`/categorias/${id}`);
}

/**
 * Erros de campo da API → erros do formulário do site. `criterios.bom` vira `bom`; nome repetido
 * (409) usa a mensagem do site. Devolve só os campos que o formulário tem.
 */
export function errosDosCampos(erro) {
  const erros = {};
  Object.entries(erro.erros).forEach(([campo, mensagem]) => {
    const chave = campo.replace(/^criterios\./, "");
    if (["nome", "bom", "medio", "ruim", "critico"].includes(chave)) erros[chave] = mensagem;
  });
  if (erro.tipo === "conflito" && erros.nome) erros.nome = MENSAGENS_ESTOQUE.categoriaRepetida;
  return erros;
}
