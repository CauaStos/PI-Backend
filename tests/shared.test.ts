import type { NextFunction, Request, Response } from "express"
import { describe, expect, it, vi } from "vitest"
import { z } from "zod"
import { AppError } from "../src/shared/app-error.js"
import { isTabOpen, STATUS } from "../src/shared/status.js"
import { validate } from "../src/shared/validate.js"

describe("isTabOpen", () => {
  it("aberta e em andamento aceitam mudancas", () => {
    expect(isTabOpen(STATUS.OPEN)).toBe(true)
    expect(isTabOpen(STATUS.IN_PROGRESS)).toBe(true)
    expect(isTabOpen(STATUS.FINISHED)).toBe(false)
    expect(isTabOpen(STATUS.CANCELLED)).toBe(false)
  })
})

describe("AppError", () => {
  it("status default e 400", () => {
    const error = new AppError("Coisa ruim.")
    expect(error.status).toBe(400)
    expect(error.message).toBe("Coisa ruim.")
  })

  it("aceita status customizado", () => {
    expect(new AppError("Sumiu.", 404).status).toBe(404)
  })
})

describe("validate middleware", () => {
  const schema = z.object({
    name: z.string().trim().min(1),
    quantity: z.coerce.number().int().min(1),
  })

  function run(body: unknown) {
    const request = { body } as unknown as Request
    const next = vi.fn() as unknown as NextFunction
    validate({ body: schema })(request, {} as Response, next)
    return { request, next }
  }

  it("passa o body parseado (trim e coerce)", () => {
    const { request, next } = run({ name: "  Coca  ", quantity: "2" })
    expect(next).toHaveBeenCalledTimes(1)
    expect(request.body).toEqual({ name: "Coca", quantity: 2 })
  })

  it("body invalido vira AppError 400 no next", () => {
    const { next } = run({ name: "", quantity: 0 })
    expect(next).toHaveBeenCalledTimes(1)
    const error = (next as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as AppError
    expect(error).toBeInstanceOf(AppError)
    expect(error.status).toBe(400)
  })

  it("erro que nao e zod repassa intacto", () => {
    const boom = new Error("boom")
    const evilSchema = {
      parse: () => {
        throw boom
      },
    } as unknown as z.ZodType
    const request = { body: { name: "x" } } as unknown as Request
    const next = vi.fn((err: unknown) => {
      throw err
    }) as unknown as NextFunction
    expect(() =>
      validate({ body: evilSchema })(request, {} as Response, next)
    ).toThrow("boom")
  })
})
