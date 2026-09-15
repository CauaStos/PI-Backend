import type { Types } from "mongoose"
import type { OrderStatus } from "../../shared/status.js"

export interface IOrder {
  tab: Types.ObjectId
  product: Types.ObjectId
  productName: string
  /** Preco unitario (inteiro, escala 10^4) capturado no momento do pedido. */
  unitPrice: number
  employee: Types.ObjectId
  employeeName: string
  employeeAvatar: string
  quantity: number
  status: OrderStatus
  orderedAt: Date
  deliveredAt: Date | null
  createdAt?: Date
  updatedAt?: Date
}

export interface ICreateOrderDTO {
  tab: string
  product: string
  employee: string
  quantity: number
}

export interface IUpdateOrderDTO {
  product?: string
  employee?: string
  quantity?: number
  status?: OrderStatus
}
