import { API_URL, modoApi } from "./config.js";
import { requisicao } from "./http.js";

/*
 * Imagem do produto. No modo API o arquivo vai para o servidor (`POST /imagens`, multipart) e o
 * produto guarda só o endereço devolvido; no modo mock a imagem fica em memória (data URL).
 * Regras iguais às do back-end: JPG, PNG ou WebP, até 2 MB (docs/planejamento-back-end.md).
 */

export const TIPOS_IMAGEM = ["image/jpeg", "image/png", "image/webp"];
export const TAMANHO_MAXIMO_IMAGEM = 2 * 1024 * 1024;

export const MENSAGENS_IMAGEM = {
  tipo: "Escolha uma imagem JPG, PNG ou WebP.",
  tamanho: "A imagem deve ter no máximo 2 MB.",
  envio: "Não conseguimos enviar a imagem. Verifique sua conexão e tente novamente.",
};

/** Mensagem de erro do arquivo escolhido, ou null se ele pode ser usado. */
export function validarImagem(arquivo) {
  if (!TIPOS_IMAGEM.includes(arquivo.type)) return MENSAGENS_IMAGEM.tipo;
  if (arquivo.size > TAMANHO_MAXIMO_IMAGEM) return MENSAGENS_IMAGEM.tamanho;
  return null;
}

/** Envia o arquivo ao servidor e devolve o endereço relativo guardado no produto. */
export async function enviarImagem(arquivo) {
  const dados = new FormData();
  dados.append("arquivo", arquivo);
  const resposta = await requisicao("/imagens", { metodo: "POST", corpo: dados });
  if (typeof resposta?.url !== "string" || !resposta.url) throw new Error("Resposta sem o endereço da imagem.");
  return resposta.url;
}

/** Endereço para usar em `<img src>`: endereços do servidor ganham o `VITE_API_URL` na frente. */
export function enderecoDaImagem(url) {
  if (!url) return "";
  if (/^(data:|blob:|https?:)/.test(url)) return url;
  return modoApi ? `${API_URL}${url.startsWith("/") ? url : `/${url}`}` : url;
}
