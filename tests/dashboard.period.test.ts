import { describe, expect, it } from "vitest"
import {
  currentMonthPeriod,
  fillDailySeries,
  lastDaysWindow,
  localDayKey,
} from "../src/modules/dashboard/dashboard.period.js"

describe("dashboard period (UTC-3)", () => {
  it("usa o dia local, nao o UTC", () => {
    // 01/12 02:00 UTC ainda e 30/11 23:00 em Brasilia.
    expect(localDayKey(new Date("2026-12-01T02:00:00Z"))).toBe("2026-11-30")
    expect(localDayKey(new Date("2026-12-01T03:00:00Z"))).toBe("2026-12-01")
  })

  it("calcula o mes corrente no fuso local", () => {
    const period = currentMonthPeriod(new Date("2026-12-01T02:00:00Z"))
    expect(period.month).toBe("2026-11")
    expect(period.start.toISOString()).toBe("2026-11-01T03:00:00.000Z")
    expect(period.previousStart.toISOString()).toBe("2026-10-01T03:00:00.000Z")
    expect(period.daysSoFar).toHaveLength(30)
    expect(period.daysSoFar.at(-1)).toBe("2026-11-30")
  })

  it("vira o ano em janeiro", () => {
    const period = currentMonthPeriod(new Date("2027-01-05T12:00:00Z"))
    expect(period.month).toBe("2027-01")
    expect(period.previousStart.toISOString()).toBe("2026-12-01T03:00:00.000Z")
    expect(period.daysSoFar).toEqual([
      "2027-01-01",
      "2027-01-02",
      "2027-01-03",
      "2027-01-04",
      "2027-01-05",
    ])
  })

  it("monta a janela dos ultimos N dias terminando hoje", () => {
    const window = lastDaysWindow(new Date("2026-11-22T15:00:00Z"), 7)
    expect(window.start.toISOString()).toBe("2026-11-16T03:00:00.000Z")
    expect(window.days).toEqual([
      "2026-11-16",
      "2026-11-17",
      "2026-11-18",
      "2026-11-19",
      "2026-11-20",
      "2026-11-21",
      "2026-11-22",
    ])
  })

  it("preenche dias sem registro com zero", () => {
    expect(
      fillDailySeries(["2026-11-01", "2026-11-02"], [{ _id: "2026-11-02", count: 3 }])
    ).toEqual([
      { date: "2026-11-01", count: 0 },
      { date: "2026-11-02", count: 3 },
    ])
  })
})

describe("dashboard.read", () => {
  it("libera o dashboard so para ADMIN e GERENTE", async () => {
    const { hasPermission, Permission } = await import(
      "../src/shared/auth/permissions.js"
    )
    const { Role
})


