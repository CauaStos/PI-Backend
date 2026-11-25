import {
  PRODUCT_CATEGORIES,
  type ProductCategory,
} from "../products/products.types.js"
import { lastDaysWindow, localDayKey, localHour } from "./dashboard.period.js"
import type { Dashboard } from "./dashboard.types.js"

const TOP_N = 5
const MINUTE_MS = 60_000
const DAY_MS = 24 * 60 * MINUTE_MS

/** Um pedido nao cancelado de uma comanda finalizada. */
export interface RevenueRow {
  closedAt: Date
  orderedAt: Date
  amount: number
  quantity: number
  productName: string
  employeeName: string
  category: ProductCategory
}

export interface SongRow {
  title: string
  tabName: string
  status: "queued" | "playing" | "finished" | "cancelled"
  requestedAt: Date
  startedAt: Date | null
  finishedAt: Date | null
}

/** Janela de `days` dias terminando hoje e a janela anterior, de mesmo tamanho. */
export function rangeWindows(now: Date, days: number) {
  const current = lastDaysWindow(now, days)
  const previousStart = new Date(current.start.getTime() - days * DAY_MS)
  return { ...current, previousStart, today: current.days.at(-1)! }
}

/** Soma `value` por chave e devolve os N maiores, desempate por nome. */
function topBy<T extends string>(
  entries: Array<{ key: T; value: number; extra: number }>,
  limit = TOP_N
) {
  const totals = new Map<T, { value: number; extra: number }>()
  for (const { key, value, extra } of entries) {
    const current = totals.get(key) ?? { value: 0, extra: 0 }
    current.value += value
    current.extra += extra
    totals.set(key, current)
  }
  return [...totals.entries()]
    .map(([key, t]) => ({ key, ...t }))
    .sort((a, b) => b.value - a.value || a.key.localeCompare(b.key))
    .slice(0, limit)
}

function average(values: number[]): number | null {
  if (values.length === 0) return null
  return Math.round(values.reduce((s, v) => s + v, 0) / values.length)
}

function hours() {
  return Array.from({ length: 24 }, () => 0)
}

export function summarizeMoney(
  rows: RevenueRow[],
  finishedTabs: number,
  now: Date,
  days: number
): Dashboard["money"] {
  const w = rangeWindows(now, days)
  const daily = new Map(w.days.map((d) => [d, 0]))
  const byCategory = new Map(
    PRODUCT_CATEGORIES.map((c) => [c, { revenue: 0, items: 0 }])
  )
  const byHour = hours()
  const inWindow: RevenueRow[] = []
  let total = 0
  let previousTotal = 0
  let today = 0

  for (const row of rows) {
    if (row.closedAt >= w.start) {
      inWindow.push(row)
      total += row.amount
      const key = localDayKey(row.closedAt)
      daily.set(key, (daily.get(key) ?? 0) + row.amount)
      if (key === w.today) today += row.amount
      const cat = byCategory.get(row.category) ?? byCategory.get("outros")!
      cat.revenue += row.amount
      cat.items += row.quantity
      byHour[localHour(row.orderedAt)]! += row.amount
    } else if (row.closedAt >= w.previousStart) {
      previousTotal += row.amount
    }
  }

  return {
    total,
    previousTotal,
    today,
    finishedTabs,
    averageTicket: finishedTabs > 0 ? Math.round(total / finishedTabs) : 0,
    daily: w.days.map((date) => ({ date, revenue: daily.get(date) ?? 0 })),
    byCategory: PRODUCT_CATEGORIES.map((category) => ({
      category,
      ...byCategory.get(category)!,
    })),
    topProducts: topBy(
      inWindow.map((r) => ({ key: r.productName, value: r.amount, extra: r.quantity }))
    ).map((t) => ({ name: t.key, revenue: t.value, quantity: t.extra })),
    byEmployee: topBy(
      inWindow.map((r) => ({ key: r.employeeName, value: r.amount, extra: 1 }))
    ).map((t) => ({ name: t.key, revenue: t.value, orders: t.extra })),
    byHour: byHour.map((value, hour) => ({ hour, value })),
  }
}

export function summarizeSongs(
  rows: SongRow[],
  queued: number,
  playing: string | null,
  now: Date,
  days: number
): Dashboard["songs"] {
  const w = rangeWindows(now, days)
  const daily = new Map(w.days.map((d) => [d, 0]))
  const requestsByHour = hours()
  let played = 0
  let previousPlayed = 0
  let playedToday = 0

  for (const row of rows) {
    if (row.status !== "finished" || !row.finishedAt) continue
    if (row.finishedAt >= w.start) {
      played += 1
      const key = localDayKey(row.finishedAt)
      daily.set(key, (daily.get(key) ?? 0) + 1)
      if (key === w.today) playedToday += 1
    } else if (row.finishedAt >= w.previousStart) {
      previousPlayed += 1
    }
  }

  const requested = rows.filter((r) => r.requestedAt >= w.start)
  for (const r of requested) requestsByHour[localHour(r.requestedAt)]! += 1
  const notCancelled = requested.filter((r) => r.status !== "cancelled")
  const waits = requested
    .filter((r) => r.startedAt)
    .map((r) => (r.startedAt!.getTime() - r.requestedAt.getTime()) / MINUTE_MS)
    .filter((m) => m >= 0)

  return {
    played,
    previousPlayed,
    playedToday,
    queued,
    playing,
    requested: requested.length,
    cancelled: requested.length - notCancelled.length,
    averageWaitMinutes: average(waits),
    daily: w.days.map((date) => ({ date, count: daily.get(date) ?? 0 })),
    requestsByHour: requestsByHour.map((value, hour) => ({ hour, value })),
    topSongs: topBy(
      notCancelled.map((r) => ({ key: r.title.trim(), value: 1, extra: 0 }))
    ).map((t) => ({ title: t.key, count: t.value })),
    topTabs: topBy(
      notCancelled.map((r) => ({ key: r.tabName, value: 1, extra: 0 }))
    ).map((t) => ({ tabName: t.key, count: t.value })),
  }
}

export function averageMinutes(
  spans: Array<{ openedAt: Date; closedAt: Date | null }>
): number | null {
  return average(
    spans
      .filter((s) => s.closedAt)
      .map((s) => (s.closedAt!.getTime() - s.openedAt.getTime()) / MINUTE_MS)
      .filter((m) => m >= 0)
  )
}
