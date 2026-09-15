import { z } from "zod"
import { TAB_STATUSES } from "../../shared/status.js"

export const createTabSchema = z.object({
  tableName: z
    .string({ message: "Nome da mesa e obrigatorio." })
    .trim()
    .min(1, "Nome da mesa e obrigatorio."),
  memberIds: z.array(z.string()).optional(),
})

export const updateTabSchema = z
  .object({
    tableName: z
      .string()
      .trim()
      .min(1, "Nome da mesa e obrigatorio.")
      .optional(),
    status: z.enum(TAB_STATUSES).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Nenhum campo para atualizar.",
  })
