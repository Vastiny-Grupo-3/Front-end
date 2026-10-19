const formatoMoeda = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const formatoDecimal = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatoPercentual = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 2,
});

/** 12.5 → "12,5" (percentual, sem o símbolo %) */
export function formatarPercentual(valor) {
  return formatoPercentual.format(valor);
}

/** 1234.5 → "R$ 1.234,50" */
export function formatarMoeda(valor) {
  return formatoMoeda.format(valor);
}

/** 1234.5 → "1.234,50" (sem o prefixo R$) */
export function formatarDecimal(valor) {
  return formatoDecimal.format(valor);
}

/** "1.234,50" → 1234.5; texto vazio ou inválido → NaN */
export function lerDecimal(texto) {
  const limpo = String(texto).trim().replace(/\./g, "").replace(",", ".");
  if (limpo === "") return NaN;
  return Number(limpo);
}

/** Arredonda para centavos. */
export function arredondar(valor) {
  return Math.round(valor * 100) / 100;
}

/** "2026-10-11" → "11/10/2026" */
export function formatarData(dataIso) {
  const [ano, mes, dia] = dataIso.slice(0, 10).split("-");
  return `${dia}/${mes}/${ano}`;
}

/** 7 → "007" (ids de transação e de cliente); `digitos` define o tamanho. */
export function formatarId(id, digitos = 3) {
  return String(id).padStart(digitos, "0");
}

/** 1 → "1 unidade"; 3 → "3 unidades" */
export function formatarUnidades(quantidade) {
  return `${quantidade} ${quantidade === 1 ? "unidade" : "unidades"}`;
}

/** Data de hoje no formato ISO (aaaa-mm-dd), no fuso local. */
export function hojeIso() {
  const agora = new Date();
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const dia = String(agora.getDate()).padStart(2, "0");
  return `${agora.getFullYear()}-${mes}-${dia}`;
}
