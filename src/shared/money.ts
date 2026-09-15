/**
 * Dinheiro e sempre representado como inteiro em "unidades menores",
 * com escala 10^4 (os ultimos 4 digitos sao a parte decimal).
 * Ex.: R$ 24,90 -> 249000. Isso elimina erros de ponto flutuante.
 *
 * O frontend tem seu proprio modulo de Money para input/formatacao; aqui
 * mantemos apenas o necessario para o seed e validacao no servidor.
 */
export const MONEY_SCALE = 10_000

/** Converte um valor em reais (ex.: 24.9) para inteiro de unidades menores. */
export function toMinor(reais: number): number {
  return Math.round(reais * MONEY_SCALE)
}

/** Valida se um valor e um inteiro de dinheiro valido (>= 0). */
export function isValidMoney(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0
}
