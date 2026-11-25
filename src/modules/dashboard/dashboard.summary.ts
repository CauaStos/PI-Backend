import {
  PRODUCT_CATEGORIES,
  type ProductCategory,
} from "../products/products.types.js"
import {
  currentMonthPeriod,
  lastDaysWindow,
  localDayKey,
  localHour,
} from "./dashboard.period.js"
import type { Dashboard } from "./dashboard.types.js"

const TOP_N = 5
const MINUTE_MS = 60_000

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

export function summarizeMoney(
  rows: RevenueRow[],
  finishedTabsMonth: number,
  now: Date
): Dashboard["money"] {
  const month = currentMonthPeriod(now)
  const last30 = lastDaysWindow(now, 30)
  const last7 = lastDaysWindow(now, 7)
  const today = last7.days.at(-1)

  let todayTotal = 0
  let last7Total = 0
  let monthTotal = 0
  let previousMonthTotal = 0
  const daily = new Map(last30.days.map((d) => [d, 0]))
  const monthRows: RevenueRow[] = []

  for (const row of rows) {
    const key = localDayKey(row.closedAt)
    if (daily.has(key)) daily.set(key, daily.get(key)! + row.amount)
    if (key === today) todayTotal += row.amount
    if (row.closedAt >= last7.start) last7Total += row.amount
    if (row.closedAt >= month.start) {
      monthTotal += row.amount
      monthRows.push(row)
    } else if (row.closedAt >= month.previousStart) {
      previousMonthTotal += row.amount
    }
  }

  const byCategory = new Map(
    PRODUCT_CATEGORIES.map((c) => [c, { revenue: 0, items: 0 }])
  )
  const byHour = Array.from({ length: 24 }, () => 0)
  for (const row of monthRows) {
    const cat = byCategory.get(row.category) ?? byCategory.get("outros")!
    cat.revenue += row.amount
    cat.items += row.quantity
    byHour[localHour(row.orderedAt)]! += row.amount
  }

  return {
    month: month.month,
    today: todayTotal,
    last7Days: last7Total,
    monthTotal,
    previousMonthTotal,
    finishedTabsMonth,
    averageTicketMonth:
      finishedTabsMonth > 0 ? Math.round(monthTotal / finishedTabsMonth) : 0,
    dailyLast30Days: last30.days.map((date) => ({
      date,
      revenue: daily.get(date) ?? 0,
    })),
    byCategory: PRODUCT_CATEGORIES.map((category) => ({
      category,
      ...byCategory.get(category)!,
    })),
    topProducts: topBy(
      monthRows.map((r) => ({ key: r.productName, value: r.amount, extra: r.quantity }))
    ).map((t) => ({ name: t.key, revenue: t.value, quantity: t.extra })),
    byEmployee: topBy(
      monthRows.map((r) => ({ key: r.employeeName, value: r.amount, extra: 1 }))
    ).map((t) => ({ name: t.key, revenue: t.value, orders: t.extra })),
    byHour: byHour.map((revenue, hour) => ({ hour, revenue })),
  }
}

export function summarizeSongs(
  rows: SongRow[],
  queued: number,
  playing: string | null,
  now: Date
): Dashboard["songs"] {
  const month = currentMonthPeriod(now)
  const last7 = lastDaysWindow(now, 7)
  const today = last7.days.at(-1)
  const played = new Map(last7.days.map((d) => [d, 0]))

  const monthRows = rows.filter((r) => r.requestedAt >= month.start)
  let playedToday = 0
  for (const row of rows) {
    if (row.status !== "finished" || !row.finishedAt) continue
    const key = localDayKey(row.finishedAt)
    if (played.has(key)) played.set(key, played.get(key)! + 1)
    if (key === today) playedToday += 1
  }

  const waits = monthRows
    .filter((r) => r.startedAt)
    .map((r) => (r.startedAt!.getTime() - r.requestedAt.getTime()) / MINUTE_MS)
    .filter((m) => m >= 0)
  const notCancelled = monthRows.filter((r) => r.status !== "cancelled")

  return {
    playedToday,
    queued,
    playing,
    requestedMonth: monthRows.length,
    cancelledMonth: monthRows.length - notCancelled.length,
    averageWaitMinutes: average(waits),
    playedLast7Days: last7.days.map((date) => ({
      date,
      count: played.get(date) ?? 0,
    })),
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
