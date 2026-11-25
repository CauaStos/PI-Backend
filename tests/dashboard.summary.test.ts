import { describe, expect, it } from "vitest"
import {
  averageMinutes,
  summarizeMoney,
  summarizeSongs,
  type RevenueRow,
  type SongRow,
} from "../src/modules/dashboard/dashboard.summary.js"
import { localHour } from "../src/modules/dashboard/dashboard.period.js"

// 25/11/2026 15:00 em Brasilia.
const NOW = new Date("2026-11-25T18:00:00Z")

function row(closedAt: string, amount: number, extra: Partial<RevenueRow> = {}): RevenueRow {
  return {
    closedAt: new Date(closedAt),
    orderedAt: new Date(closedAt),
    amount,
    quantity: 1,
    productName: "Cerveja",
    employeeName: "Ana",
    category: "bebida",
    ...extra,
  }
}

describe("summarizeMoney", () => {
  const rows = [
    row("2026-11-25T17:00:00Z", 100_000), // hoje
    row("2026-11-25T02:00:00Z", 50_000, { productName: "Batata", category: "porcao", employeeName: "Bia" }), // 24/11 23h local
    row("2026-11-10T20:00:00Z", 200_000, { quantity: 2 }), // mes, fora dos 7 dias
    row("2026-10-31T20:00:00Z", 70_000), // mes anterior
  ]
  const money = summarizeMoney(rows, 4, NOW)

  it("separa hoje, 7 dias, mes e mes anterior pelo dia local", () => {
    expect(money.month).toBe("2026-11")
    expect(money.today).toBe(100_000)
    expect(money.last7Days).toBe(150_000)
    expect(money.monthTotal).toBe(350_000)
    expect(money.previousMonthTotal).toBe(70_000)
  })

  it("calcula ticket medio pelas comandas finalizadas", () => {
    expect(money.averageTicketMonth).toBe(87_500)
    expect(summarizeMoney([], 0, NOW).averageTicketMonth).toBe(0)
  })

  it("monta a serie de 30 dias com zero nos dias vazios", () => {
    expect(money.dailyLast30Days).toHaveLength(30)
    expect(money.dailyLast30Days.at(-1)).toEqual({ date: "2026-11-25", revenue: 100_000 })
    expect(money.dailyLast30Days.at(-2)).toEqual({ date: "2026-11-24", revenue: 50_000 })
    expect(money.dailyLast30Days.find((d) => d.date === "2026-11-20")?.revenue).toBe(0)
  })

  it("agrupa o mes por categoria, produto, funcionario e hora", () => {
    expect(money.byCategory.find((c) => c.category === "bebida")).toEqual({
      category: "bebida",
      revenue: 300_000,
      items: 3,
    })
    expect(money.topProducts[0]).toEqual({ name: "Cerveja", revenue: 300_000, quantity: 3 })
    expect(money.byEmployee).toEqual([
      { name: "Ana", revenue: 300_000, orders: 2 },
      { name: "Bia", revenue: 50_000, orders: 1 },
    ])
    expect(money.byHour).toHaveLength(24)
    expect(money.byHour[23]?.revenue).toBe(50_000)
  })
})

describe("summarizeSongs", () => {
  const song = (s: Partial<SongRow>): SongRow => ({
    title: "Evidencias",
    tabName: "Mesa 01",
    status: "finished",
    requestedAt: new Date("2026-11-25T16:00:00Z"),
    startedAt: new Date("2026-11-25T16:10:00Z"),
    finishedAt: new Date("2026-11-25T16:14:00Z"),
    ...s,
  })
  const songs = summarizeSongs(
    [
      song({}),
      song({ title: "Evidencias ", tabName: "Mesa 02", startedAt: new Date("2026-11-25T16:30:00Z") }),
      song({ title: "Pais e Filhos", status: "cancelled", startedAt: null, finishedAt: null }),
      song({ title: "Tempo Perdido", finishedAt: new Date("2026-11-24T22:00:00Z") }),
    ],
    3,
    "Garota de Ipanema",
    NOW
  )

  it("conta tocadas hoje, fila e cancelamentos do mes", () => {
    expect(songs.playedToday).toBe(2)
    expect(songs.queued).toBe(3)
    expect(songs.playing).toBe("Garota de Ipanema")
    expect(songs.requestedMonth).toBe(4)
    expect(songs.cancelledMonth).toBe(1)
    expect(songs.playedLast7Days.at(-2)).toEqual({ date: "2026-11-24", count: 1 })
  })

  it("calcula espera media e rankings sem canceladas", () => {
    expect(songs.averageWaitMinutes).toBe(17) // (10 + 30 + 10) / 3
    expect(songs.topSongs[0]).toEqual({ title: "Evidencias", count: 2 })
    expect(songs.topSongs.some((s) => s.title === "Pais e Filhos")).toBe(false)
    expect(songs.topTabs[0]).toEqual({ tabName: "Mesa 01", count: 2 })
  })
})

describe("helpers", () => {
  it("averageMinutes ignora comandas sem fechamento", () => {
    expect(
      averageMinutes([
        { openedAt: new Date("2026-11-25T10:00:00Z"), closedAt: new Date("2026-11-25T11:30:00Z") },
        { openedAt: new Date("2026-11-25T10:00:00Z"), closedAt: null },
      ])
    ).toBe(90)
    expect(averageMinutes([])).toBeNull()
  })

  it("localHour usa UTC-3", () => {
    expect(localHour(new Date("2026-11-25T02:00:00Z"))).toBe(23)
  })
})
