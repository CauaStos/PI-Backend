import { z } from "zod"
import { EMPLOYEE_ROLES } from "./employees.types.js"

export const createEmployeeSchema = z.object({
  name: z
    .string({ message: "Nome do funcionario e obrigatorio." })
    .trim()
    .min(1, "Nome do funcionario e obrigatorio."),
  email: z.string().email("Email invalido."),
  role: z.enum(EMPLOYEE_ROLES).optional(),
  avatar: z.string().optional(),
  password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres."),
})

export const updateEmployeeSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Nome do funcionario e obrigatorio.")
      .optional(),
    email: z.string().email("Email invalido.").optional(),
    role: z.enum(EMPLOYEE_ROLES).optional(),
    avatar: z.string().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Nenhum campo para atualizar.",
  })
