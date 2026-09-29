import type { NextFunction, Request, Response } from "express"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import {
  getJwtAudience,
  getJwtIssuer,
  isPasswordResetConsoleEnabled,
  validateAuthSecret,
} from "../src/config/env.js"
import { AppError } from "../src/shared/app-error.js"

vi.mock("../src/modules/auth/auth.service.js", () => ({
  verifyAccessToken: vi.fn(),
  isSessionActive: vi.fn(),
}))

vi.mock("../src/modules/employees/employees.model.js", () => ({
  default: { findOne: vi.fn() },
}))

import { getBearerToken, requireAuth, requireRoles } from "../src/modules/auth/auth.middleware.js"
import { isSessionActive, verifyAccessToken } from "../src/modules/auth/auth.service.js"
import Employee from "../src/modules/employees/employees.model.js"

const verifyMock = vi.mocked(verifyAccessToken)
const sessionMock = vi.mocked(isSessionActive)
const findOneMock = vi.mocked(Employee.findOne)

function makeRequest(headers: Record<string, string> = {}): Request {
  return { headers, body: {} } as unknown as Request
}

async function runAuth(request: Request) {
  const next = vi.fn() as unknown as NextFunction
  await requireAuth(request, {} as Response, next)
  return (next as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as
    | AppError
    | undefined
}

const employee = {
  _id: "emp-1",
  authUserId: "user-1",
  name: "Garcom",
  email: "garcom@onstage.dev",
  role: "garcom" as const,
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("getBearerToken", () => {
  it("aceita esquema Bearer", () => {
    expect(
      getBearerToken(makeRequest({ authorization: "Bearer abc.def.ghi" }))
    ).toBe("abc.def.ghi")
  })

  it("ignora cookies e esquemas diferentes", () => {
    expect(
      getBearerToken(makeRequest({ cookie: "better-auth.session_token=x" }))
    ).toBeNull()
    expect(
      getBearerToken(makeRequest({ authorization: "Basic abc" }))
    ).toBeNull()
  })
})

describe("requireAuth", () => {
  it("rejeita requisicao sem Authorization", async () => {
    const error = await runAuth(makeRequest())
    expect(error).toBeInstanceOf(AppError)
    expect(error?.status).toBe(401)
  })

  it("nao usa cookie como fallback", async () => {
    const error = await runAuth(
      makeRequest({ cookie: "better-auth.session_token=valido" })
    )
    expect(error?.status).toBe(401)
    expect(verifyMock).not.toHaveBeenCalled()
  })

  it("rejeita token invalido", async () => {
    verifyMock.mockResolvedValue(null)
    const error = await runAuth(makeRequest({ authorization: "Bearer ruim" }))
    expect(error?.status).toBe(401)
  })

  it("rejeita payload sem sessionId", async () => {
    verifyMock.mockResolvedValue({ sub: "user-1" })
    const error = await runAuth(makeRequest({ authorization: "Bearer ok" }))
    expect(error?.status).toBe(401)
    expect(sessionMock).not.toHaveBeenCalled()
  })

  it("rejeita sessao revogada", async () => {
    verifyMock.mockResolvedValue({ sub: "user-1", sessionId: "s-1" })
    sessionMock.mockResolvedValue(false)
    const error = await runAuth(makeRequest({ authorization: "Bearer ok" }))
    expect(error?.status).toBe(401)
  })

  it("rejeita usuario sem Employee vinculado", async () => {
    verifyMock.mockResolvedValue({ sub: "user-1", sessionId: "s-1" })
    sessionMock.mockResolvedValue(true)
    findOneMock.mockResolvedValue(null)
    const error = await runAuth(makeRequest({ authorization: "Bearer ok" }))
    expect(error?.status).toBe(403)
  })

  it("preenche request.auth com Employee e sessao validos", async () => {
    verifyMock.mockResolvedValue({ sub: "user-1", sessionId: "s-1" })
    sessionMock.mockResolvedValue(true)
    findOneMock.mockResolvedValue(employee as never)
    const request = makeRequest({ authorization: "Bearer ok" })
    const next = vi.fn() as unknown as NextFunction
    await requireAuth(request, {} as Response, next)
    expect(next).toHaveBeenCalledWith()
    expect(request.auth).toEqual({
      userId: "user-1",
      sessionId: "s-1",
      employee: {
        id: "emp-1",
        role: "garcom",
        name: "Garcom",
        email: "garcom@onstage.dev",
      },
    })
  })
})

describe("requireRoles", () => {
  function call(role: "admin" | "garcom") {
    const request = {
      auth: { employee: { role } },
    } as unknown as Request
    const next = vi.fn() as unknown as NextFunction
    requireRoles("admin")(request, {} as Response, next)
    return (next as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as
      | AppError
      | undefined
  }

  it("bloqueia garcom", () => {
    expect(call("garcom")?.status).toBe(403)
  })

  it("libera admin", () => {
    expect(call("admin")).toBeUndefined()
  })
})

describe("env de autenticacao", () => {
  const original = { ...process.env }

  afterEach(() => {
    process.env = { ...original }
  })

  it("valida secret ausente e curto", () => {
    expect(() => validateAuthSecret("")).toThrow(/BETTER_AUTH_SECRET/)
    expect(() => validateAuthSecret("curto")).toThrow(/32 caracteres/)
    expect(validateAuthSecret("a".repeat(32))).toHaveLength(32)
  })

  it("issuer/audience caem em BETTER_AUTH_URL por padrao", () => {
    process.env["BETTER_AUTH_URL"] = "https://api.onstage.dev"
    delete process.env["JWT_ISSUER"]
    delete process.env["JWT_AUDIENCE"]
    expect(getJwtIssuer()).toBe("https://api.onstage.dev")
    expect(getJwtAudience()).toBe("https://api.onstage.dev")
    process.env["JWT_ISSUER"] = "https://issuer.dev"
    expect(getJwtIssuer()).toBe("https://issuer.dev")
  })

  it("so loga reset no console fora de producao e com flag explicito", () => {
    process.env["NODE_ENV"] = "development"
    delete process.env["AUTH_PASSWORD_RESET_CONSOLE_URL"]
    expect(isPasswordResetConsoleEnabled()).toBe(false)
    process.env["AUTH_PASSWORD_RESET_CONSOLE_URL"] = "true"
    expect(isPasswordResetConsoleEnabled()).toBe(true)
    process.env["NODE_ENV"] = "production"
    expect(isPasswordResetConsoleEnabled()).toBe(false)
  })
})
