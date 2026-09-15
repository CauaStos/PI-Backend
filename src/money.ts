import { z } from "zod"

/** Dinheiro e inteiro em unidades menores, escala 10^4. R$ 24,90 -> 249000. */
export const MONEY_SCALE = 10_000

export function toMinor(reais: number): number {
  return Math.round(reais * MONEY_SCALE)
}

export function isValidMoney(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0
}

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })

/** 249000 -> "R$ 24,90" */
export function format(minor: number): string {
  return brl.format(minor / MONEY_SCALE)
}

/** Parse "24,90" | "24.90" | "24" -> 249000. NaN se invalido. */
export function parseInput(raw: string): number {
  const reais = Number.parseFloat(raw.trim().replace(",", "."))
  if (!Number.isFinite(reais)) return Number.NaN
  return Math.round(reais * MONEY_SCALE)
}

export function multiply(minor: number, qty: number): number {
  return Math.round(minor * qty)
}

export function sum(minors: number[]): number {
  return minors.reduce((acc, v) => acc + v, 0)
}

export const moneySchema = z
  .number()
  .int("preco deve ser um inteiro em unidades menores")
  .min(0, "preco nao pode ser negativo")
