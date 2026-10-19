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
