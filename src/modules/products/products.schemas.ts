import { z } from "zod"
import { moneySchema } from "@pi/contracts"
import { PRODUCT_CATEGORIES } from "./products.types.js"

const categorySchema = z.enum(PRODUCT_CATEGORIES, {
  message: "Categoria invalida.",
})

export const createProductSchema = z.object({
  name: z
    .string({ message: "Nome do produto e obrigatorio." })
    .trim()
    .min(1, "Nome do produto e obrigatorio."),
  price: moneySchema,
  description: z.string().optional(),
  image: z.string().optional(),
  stock: z.number().int().min(0).optional(),
  category: categorySchema.optional(),
})

export const updateProductSchema = z
  .object({
    name: z.string().trim().min(1, "Nome do produto e obrigatorio.").optional(),
    price: moneySchema.optional(),
    description: z.string().optional(),
    image: z.string().optional(),
    stock: z.number().int().min(0).optional(),
    category: categorySchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Nenhum campo para atualizar.",
  })
