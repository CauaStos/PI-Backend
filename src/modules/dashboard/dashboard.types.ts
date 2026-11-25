import { z } from "zod"
import { PRODUCT_CATEGORIES } from "../products/products.types.js"

const day = z.string().describe("Dia local (UTC-3) no formato YYYY-MM-DD")
const money = z
  .number()
  .int()
  .describe("Valor em unidades menores (escala 10^4, ver @pi/contracts/money)")

/** Resposta de GET /dashboard. Tambem alimenta o schema do Swagger. */
export const dashboardSchema = z.object({
  generatedAt: z.string().datetime(),
  money: z
    .object({
      month: z.string().describe("Mes corrente no formato YYYY-MM"),
      today: money.describe("Faturamento de hoje"),
      last7Days: money.describe("Faturamento dos ultimos 7 dias (inclui hoje)"),
      monthTotal: money.describe("Faturamento do mes corrente"),
      previousMonthTotal: money.describe("Faturamento do mes anterior inteiro"),
      finishedTabsMonth: z.number().int().describe("Comandas finalizadas no mes"),
      averageTicketMonth: money.describe("Faturamento do mes / comandas finalizadas"),
      dailyLast30Days: z.array(z.object({ date: day, revenue: money })),
      byCategory: z.array(
        z.object({
          category: z.enum(PRODUCT_CATEGORIES),
          revenue: money,
          items: z.number().int(),
        })
      ),
      topProducts: z.array(
        z.object({ name: z.string(), revenue: money, quantity: z.number().int() })
      ),
      byEmployee: z.array(
        z.object({ name: z.string(), revenue: money, orders: z.number().int() })
      ),
      byHour: z
        .array(z.object({ hour: z.number().int().min(0).max(23), revenue: money }))
        .describe("Faturamento do mes pela hora local em que o pedido foi feito"),
    })
    .describe(
      "Faturamento = pedidos nao cancelados de comandas finalizadas, pela data de fechamento da comanda (mesma regra do historico)"
    ),
  songs: z.object({
    playedToday: z.number().int().describe("Musicas que terminaram de tocar hoje"),
    queued: z.number().int().describe("Musicas aguardando na fila agora"),
    playing: z.string().nullable().describe("Titulo da musica tocando agora"),
    requestedMonth: z.number().int(),
    cancelledMonth: z.number().int(),
    averageWaitMinutes: z
      .number()
      .nullable()
      .describe("Media de espera (pedido -> inicio) das musicas iniciadas no mes"),
    playedLast7Days: z.array(z.object({ date: day, count: z.number().int() })),
    topSongs: z.array(z.object({ title: z.string(), count: z.number().int() })),
    topTabs: z.array(z.object({ tabName: z.string(), count: z.number().int() })),
  }),
  operations: z.object({
    openTabs: z.number().int().describe("Comandas abertas ou em andamento"),
    ordersInProgress: z.number().int().describe("Pedidos em preparo"),
    averageTabMinutes: z
      .number()
      .nullable()
      .describe("Tempo medio de permanencia das comandas finalizadas no mes"),
  }),
})

export type Dashboard = z.infer<typeof dashboardSchema>
