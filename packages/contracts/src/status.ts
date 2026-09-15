import { z } from "zod"

export const STATUS = {
  OPEN: "open",
  IN_PROGRESS: "in_progress",
  DELIVERED: "delivered",
  FINISHED: "finished",
  CANCELLED: "cancelled",
} as const

export const TAB_STATUSES = [
  STATUS.OPEN,
  STATUS.IN_PROGRESS,
  STATUS.FINISHED,
  STATUS.CANCELLED,
] as const

export const ORDER_STATUSES = [
  STATUS.IN_PROGRESS,
  STATUS.DELIVERED,
  STATUS.FINISHED,
  STATUS.CANCELLED,
] as const

export const tabStatusSchema = z.enum(TAB_STATUSES)
export const orderStatusSchema = z.enum(ORDER_STATUSES)

export type TabStatus = z.infer<typeof tabStatusSchema>
export type OrderStatus = z.infer<typeof orderStatusSchema>

/** Uma comanda so aceita alteracoes enquanto esta aberta ou em andamento. */
export function isTabOpen(status: string): boolean {
  return status === STATUS.OPEN || status === STATUS.IN_PROGRESS
}
