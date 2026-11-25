import { z } from "zod"
import { PRODUCT_CATEGORIES } from "../products/products.types.js"

export const DASHBOARD_RANGES = [7, 14, 30] as const
export type DashboardRange = (typeof DASHBOARD_RANGES)[number]

/** Query de GET /dashboard: `?days=7|14|30` (padrao 7). */
export const dashboardQuerySchema = z.object({
  days: z.coerce
    .number()
    .int()
    .refine((d): d is DashboardRange => (DASHBOARD_RANGES as readonly number[]).includes(d), {
      message: "days deve ser 7, 14 ou 30",
    })
    .default(7),
})

const day = z.string().describe("Dia local (UTC-3) no formato YYYY-MM-DD")
const money = z
  .number()
  .int()
  .describe("Valor em unidades menores (escala 10^4, ver @pi/contracts/money)")
const hourly = <T extends z.ZodTypeAny>(value: T) =>
  z.array(z.object({ hour: z.number().int().min(0).max(23), value }))

/** Resposta de GET /dashboard. Tambem alimenta o schema do Swagger. */
export const dashboardSchema = z.object({
  generatedAt: z.string().datetime(),
  days: z.number().int().describe("Tamanho da janela, em dias (inclui hoje)"),
  money: z
    .object({
      total: money.describe("Faturamento da janela"),
      previousTotal: money.describe("Faturamento da janela anterior, de mesmo tamanho"),
      today: money.describe("Faturamento de hoje"),
      finishedTabs: z.number().int().describe("Comandas finalizadas na janela"),
      averageTicket: money.describe("Faturamento / comandas finalizadas na janela"),
      daily: z.array(z.object({ date: day, revenue: money })),
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
      byHour: hourly(money).describe("Faturamento pela hora local do pedido"),
    })
    .describe(
      "Faturamento = pedidos nao cancelados de comandas finalizadas, pela data de fechamento da comanda (mesma regra do historico)"
    ),
  songs: z.object({
    played: z.number().int().describe("Musicas que terminaram de tocar na janela"),
    previousPlayed: z.number().int().describe("Tocadas na janela anterior"),
    playedToday: z.number().int(),
    queued: z.number().int().describe("Musicas aguardando na fila agora"),
    playing: z.string().nullable().describe("Titulo da musica tocando agora"),
    requested: z.number().int().describe("Musicas pedidas na janela"),
    cancelled: z.number().int().describe("Pedidas na janela e canceladas"),
    averageWaitMinutes: z
      .number()
      .nullable()
      .describe("Media de espera (pedido -> inicio) das pedidas na janela"),
    daily: z.array(z.object({ date: day, count: z.number().int() })),
    requestsByHour: hourly(z.number().int()).describe("Pedidos pela hora local"),
    topSongs: z.array(z.object({ title: z.string(), count: z.number().int() })),
    topTabs: z.array(z.object({ tabName: z.string(), count: z.number().int() })),
  }),
  operations: z.object({
    openTabs: z.number().int().describe("Comandas abertas ou em andamento agora"),
    ordersInProgress: z.number().int().describe("Pedidos em preparo agora"),
    averageTabMinutes: z
      .number()
      .nullable()
      .describe("Permanencia media das comandas finalizadas na janela"),
  }),
})

export type Dashboard = z.infer<typeof dashboardSchema>
