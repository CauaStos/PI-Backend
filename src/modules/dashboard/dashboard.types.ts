import { z } from "zod"
import { PRODUCT_CATEGORIES } from "../products/products.types.js"

const dailyCountSchema = z.object({
  date: z.string().describe("Dia local (UTC-3) no formato YYYY-MM-DD"),
  count: z.number().int().min(0),
})

/** Resposta de GET /dashboard. Tambem alimenta o schema do Swagger. */
export const dashboardSchema = z.object({
  generatedAt: z.string().datetime(),
  activeUsers: z.object({
    count: z
      .number()
      .int()
      .describe("Usuarios distintos com sessao valida (nao expirada)"),
    total: z.number().int().describe("Total de funcionarios cadastrados"),
  }),
  monthlySignups: z.object({
    month: z.string().describe("Mes corrente no formato YYYY-MM"),
    count: z.number().int().describe("Funcionarios cadastrados no mes"),
    previousMonth: z.number().int().describe("Cadastros no mes anterior"),
    daily: z.array(dailyCountSchema),
  }),
  pendingRecords: z.object({
    total: z.number().int(),
    orders: z.number().int().describe("Pedidos em preparo"),
    tabs: z.number().int().describe("Comandas abertas ou em andamento"),
    songs: z.number().int().describe("Musicas aguardando na fila"),
  }),
  byCategory: z.array(
    z.object({
      category: z.enum(PRODUCT_CATEGORIES),
      products: z.number().int().describe("Produtos cadastrados na categoria"),
      itemsSold: z
        .number()
        .int()
        .describe("Itens pedidos na categoria (exceto cancelados)"),
    })
  ),
  ordersLast7Days: z.array(dailyCountSchema),
})

export type Dashboard = z.infer<typeof dashboardSchema>
