/**
 * Vocabulario de status compartilhado entre comandas (tabs) e pedidos (orders).
 *
 * As chaves sao em ingles; o frontend mapeia para rotulos em portugues na
 * camada de apresentacao.
 */
export const STATUS = {
  OPEN: "open",
  IN_PROGRESS: "in_progress",
  DELIVERED: "delivered",
  FINISHED: "finished",
  CANCELLED: "cancelled",
} as const

export type Status = (typeof STATUS)[keyof typeof STATUS]

/** Status validos para uma comanda. */
export const TAB_STATUSES = [
  STATUS.OPEN,
  STATUS.IN_PROGRESS,
  STATUS.FINISHED,
  STATUS.CANCELLED,
] as const

export type TabStatus = (typeof TAB_STATUSES)[number] & string

/** Status validos para um pedido. */
export const ORDER_STATUSES = [
  STATUS.IN_PROGRESS,
  STATUS.DELIVERED,
  STATUS.FINISHED,
  STATUS.CANCELLED,
] as const

export type OrderStatus = (typeof ORDER_STATUSES)[number] & string

/** Uma comanda so aceita alteracoes enquanto esta aberta ou em andamento. */
export function isTabOpen(status: string): boolean {
  return status === STATUS.OPEN || status === STATUS.IN_PROGRESS
}
