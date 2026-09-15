import { z } from "zod"
import { ORDER_STATUSES } from "../../shared/status.js"

export const createOrderSchema = z.object({
  tab: z.string().min(1, "Comanda obrigatoria."),
  product: z.string().min(1, "Produto obrigatorio."),
  employee: z.string().min(1, "Funcionario obrigatorio."),
  quantity: z
    .number({ message: "Quantidade invalida." })
    .int("Quantidade invalida.")
    .min(1, "Quantidade invalida."),
})

export const updateOrderSchema = z
  .object({
    product: z.string().optional(),
    employee: z.string().optional(),
    quantity: z
      .number()
      .int("Quantidade invalida.")
      .min(1, "Quantidade invalida.")
      .optional(),
    status: z.enum(ORDER_STATUSES).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Nenhum campo para atualizar.",
  })
