import { describe, expect, it } from "vitest"
import {
  averageMinutes,
  rangeWindows,
  summarizeMoney,
  summarizeSongs,
  type RevenueRow,
  type SongRow,
} from "../src/modules/dashboard/dashboard.summary.js"
import { dashboardQuerySchema } from "../src/modules/dashboard/dashboard.types.js"
import { localHour } from "../src/modules/dashboard/dashboard.period.js"

// 25/11/2026 15:00 em Brasilia. Janela de 7 dias: 19/11 a 25/11; anterior: 12/11 a 18/11.
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

describe("rangeWindows", () => {
  it("monta a janela atual e a anterior de mesmo tamanho", () => {
    const w = rangeWindows(NOW, 7)
    expect(w.start.toISOString()).toBe("2026-11-19T03:00:00.000Z")
    expect(w.previousStart.toISOString()).toBe("2026-11-12T03:00:00.000Z")
    expect(w.today).toBe("2026-11-25")
    expect(w.days).toHaveLength(7)
    expect(rangeWindows(NOW, 30).days[0]).toBe("2026-10-27")
  })
})

describe("dashboardQuerySchema", () => {
  it("aceita 7, 14 e 30 e usa 7 por padrao", () => {
    expect(dashboardQuerySchema.parse({}).days).toBe(7)
    expect(dashboardQuerySchema.parse({ days: "14" }).days).toBe(14)
    expect(dashboardQuerySchema.safeParse({ days: "10" }).success).toBe(false)
  })
})

describe("summarizeMoney", () => {
  const rows = [
    row("2026-11-25T17:00:00Z", 100_000), // hoje
    row("2026-11-25T02:00:00Z", 50_000, { productName: "Batata", category: "porcao", employeeName: "Bia" }), // 24/11 23h local
    row("2026-11-15T20:00:00Z", 200_000, { quantity: 2 }), // janela anterior
    row("2026-11-01T20:00:00Z", 70_000), // fora das duas janelas
  ]
  const money = summarizeMoney(rows, 2, NOW, 7)

  it("separa janela, janela anterior e hoje pelo dia local", () => {
    expect(money.total).toBe(150_000)
    expect(money.previousTotal).toBe(200_000)
    expect(money.today).toBe(100_000)
    expect(money.averageTicket).toBe(75_000)
    expect(summarizeMoney([], 0, NOW, 7).averageTicket).toBe(0)
  })

  it("serie diaria tem um ponto por dia da janela", () => {
    expect(money.daily).toHaveLength(7)
    expect(money.daily.at(-1)).toEqual({ date: "2026-11-25", revenue: 100_000 })
    expect(money.daily.at(-2)).toEqual({ date: "2026-11-24", revenue: 50_000 })
    expect(summarizeMoney(rows, 3, NOW, 14).total).toBe(350_000)
  })

  it("agrupa a janela por categoria, produto, funcionario e hora", () => {
    expect(money.byCategory.find((c) => c.category === "bebida")).toEqual({
      category: "bebida",
      revenue: 100_000,
      items: 1,
    })
    expect(money.topProducts.map((p) => p.name)).toEqual(["Cerveja", "Batata"])
    expect(money.byEmployee).toEqual([
      { name: "Ana", revenue: 100_000, orders: 1 },
      { name: "Bia", revenue: 50_000, orders: 1 },
    ])
    expect(money.byHour).toHaveLength(24)
    expect(money.byHour[23]?.value).toBe(50_000)
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
      song({
        title: "Antiga",
        requestedAt: new Date("2026-11-14T20:00:00Z"),
        startedAt: new Date("2026-11-14T20:05:00Z"),
        finishedAt: new Date("2026-11-14T20:09:00Z"),
      }),
    ],
    3,
    "Garota de Ipanema",
    NOW,
    7
  )

  it("conta tocadas, fila e cancelamentos da janela", () => {
    expect(songs.played).toBe(3)
    expect(songs.previousPlayed).toBe(1)
    expect(songs.playedToday).toBe(2)
    expect(songs.queued).toBe(3)
    expect(songs.playing).toBe("Garota de Ipanema")
    expect(songs.requested).toBe(4)
    expect(songs.cancelled).toBe(1)
    expect(songs.daily.at(-2)).toEqual({ date: "2026-11-24", count: 1 })
    expect(songs.requestsByHour[13]?.value).toBe(4) // 16:00Z = 13h local
  })

  it("calcula espera media e rankings sem canceladas nem fora da janela", () => {
    expect(songs.averageWaitMinutes).toBe(17) // (10 + 30 + 10) / 3
    expect(songs.topSongs[0]).toEqual({ title: "Evidencias", count: 2 })
    expect(songs.topSongs.some((s) => s.title === "Pais e Filhos" || s.title === "Antiga")).toBe(false)
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
