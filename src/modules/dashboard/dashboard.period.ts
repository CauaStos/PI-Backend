/**
 * O OnStage opera no horario de Brasilia (UTC-3, sem horario de verao desde
 * 2019). "Cadastros do mes" e "pedidos por dia" precisam seguir o calendario
 * local, nao o UTC do servidor/container.
 */
export const BUSINESS_UTC_OFFSET = "-03:00"
const OFFSET_MS = 3 * 60 * 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000

function pad(value: number): string {
  return String(value).padStart(2, "0")
}

/** Desloca a data para que os campos UTC representem o horario local. */
function toLocalFields(date: Date): Date {
  return new Date(date.getTime() - OFFSET_MS)
}

/** Meia-noite local de (ano, mes, dia) como instante absoluto. */
function localMidnight(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month, day) + OFFSET_MS)
}

/** Chave YYYY-MM-DD do dia local de `date`. */
export function localDayKey(date: Date): string {
  const local = toLocalFields(date)
  return `${local.getUTCFullYear()}-${pad(local.getUTCMonth() + 1)}-${pad(local.getUTCDate())}`
}

export interface MonthPeriod {
  /** YYYY-MM do mes corrente. */
  month: string
  /** Inicio do mes corrente (inclusivo). */
  start: Date
  /** Inicio do mes anterior (inclusivo); termina em `start`. */
  previousStart: Date
  /** Dias do mes corrente ate hoje, em ordem: YYYY-MM-DD. */
  daysSoFar: string[]
}

export function currentMonthPeriod(now: Date): MonthPeriod {
  const local = toLocalFields(now)
  const year = local.getUTCFullYear()
  const month = local.getUTCMonth()
  const today = local.getUTCDate()
  const prefix = `${year}-${pad(month + 1)}`

  return {
    month: prefix,
    start: localMidnight(year, month, 1),
    previousStart: localMidnight(year, month - 1, 1),
    daysSoFar: Array.from({ length: today }, (_, i) => `${prefix}-${pad(i + 1)}`),
  }
}

export interface DaysWindow {
  /** Inicio do primeiro dia da janela (inclusivo). */
  start: Date
  /** Os `days` dias locais terminando hoje, em ordem: YYYY-MM-DD. */
  days: string[]
}

export function lastDaysWindow(now: Date, days: number): DaysWindow {
  const local = toLocalFields(now)
  const todayStart = localMidnight(
    local.getUTCFullYear(),
    local.getUTCMonth(),
    local.getUTCDate()
  )
  const start = new Date(todayStart.getTime() - (days - 1) * DAY_MS)
  return {
    start,
    days: Array.from({ length: days }, (_, i) =>
      localDayKey(new Date(start.getTime() + i * DAY_MS))
    ),
  }
}

/** Hora local (0-23) de `date`. */
export function localHour(date: Date): number {
  return toLocalFields(date).getUTCHours()
}

/** Preenche com zero os dias sem registro, mantendo a ordem de `days`. */
export function fillDailySeries(
  days: string[],
  rows: Array<{ _id: string; count: number }>
): Array<{ date: string; count: number }> {
  const counts = new Map(rows.map((row) => [row._id, row.count]))
  return days.map((date) => ({ date, count: counts.get(date) ?? 0 }))
}
