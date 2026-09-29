import { createServer } from "node:http"
import type { Server } from "node:http"
import { createServer as createNetServer } from "node:net"
import { MongoClient, ObjectId } from "mongodb"
import { afterAll, beforeAll, describe, expect, it } from "vitest"

/**
 * Teste de integracao do fluxo de autenticacao do professor.
 *
 * Precisa de um Mongo descartavel. Rode com:
 *   TEST_MONGO_URI=mongodb://127.0.0.1:27018/onstage_auth_test npm test
 * Sem a variavel o bloco inteiro e ignorado, entao o CI continua verde.
 */
const testMongoUri = process.env.TEST_MONGO_URI
const suite = testMongoUri ? describe : describe.skip

function getFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const probe = createNetServer()
    probe.once("error", reject)
    probe.listen(0, "127.0.0.1", () => {
      const address = probe.address()
      const port = typeof address === "object" && address ? address.port : 0
      probe.close(() => resolve(port))
    })
  })
}

function cookieFrom(response: Response): string {
  const cookies = response.headers.getSetCookie?.() ?? []
  return cookies.map((cookie) => cookie.split(";")[0] ?? "").filter(Boolean).join("; ")
}

function decodePayload(token: string): Record<string, unknown> {
  const part = token.split(".")[1] ?? ""
  return JSON.parse(Buffer.from(part, "base64url").toString("utf8"))
}

const PASSWORD = "senha-segura-123"

suite("auth de professor (integracao)", () => {
  let server: Server
  let origin: string
  let mongo: MongoClient
  let dbName: string

  async function post(path: string, body: unknown, headers: Record<string, string> = {}) {
    return fetch(`${origin}${path}`, {
      method: "POST",
      headers: { "content-type": "application/json", origin, ...headers },
      body: JSON.stringify(body),
    })
  }

  async function tokenFor(cookie: string): Promise<string> {
    const response = await fetch(`${origin}/api/auth/token`, { headers: { cookie, origin } })
    expect(response.status).toBe(200)
    const body = (await response.json()) as { token: string }
    return body.token
  }

  function signUp(email: string, extra: Record<string, unknown> = {}) {
    return post("/api/auth/sign-up/email", {
      name: "Professor Teste",
      email,
      password: PASSWORD,
      ...extra,
    })
  }

  beforeAll(async () => {
    const port = await getFreePort()
    origin = `http://127.0.0.1:${port}`
    dbName = `onstage_auth_test_${process.pid}_${Date.now()}`
    const uri = new URL(testMongoUri!)
    uri.pathname = `/${dbName}`

    process.env["NODE_ENV"] = "test"
    process.env["MONGO_URI"] = uri.toString()
    process.env["BETTER_AUTH_SECRET"] = "integration-secret-0123456789abcdefghij"
    process.env["BETTER_AUTH_URL"] = origin
    process.env["FRONTEND_ORIGIN"] = origin
    process.env["AUTH_PASSWORD_RESET_CONSOLE_URL"] = "false"

    const [{ default: app }, { default: database }, mongoose] = await Promise.all([
      import("../src/app.js"),
      import("../src/config/database.js"),
      import("mongoose"),
    ])
    await database.connect()
    server = createServer(app)
    await new Promise<void>((resolve) => server.listen(port, "127.0.0.1", resolve))
    mongo = new MongoClient(testMongoUri!)
    await mongo.connect()
    void mongoose
  })

  afterAll(async () => {
    await new Promise<void>((resolve) => server?.close(() => resolve()))
    const mongoose = await import("mongoose")
    await mongoose.default.disconnect()
    if (mongo) {
      await mongo.db(dbName).dropDatabase()
      await mongo.close()
    }
  })

  it("cadastro publico normaliza email e cria garcom vinculado", async () => {
    const response = await signUp("  Prof.MixCase@Example.com  ")
    expect(response.status).toBe(200)
    const body = (await response.json()) as { user: { id: string; email: string; role?: string } }
    expect(body.user.email).toBe("prof.mixcase@example.com")
    expect(body.user.role ?? null).not.toBe("admin")

    const employee = await mongo
      .db(dbName)
      .collection("employees")
      .findOne({ email: "prof.mixcase@example.com" })
    expect(employee?.role).toBe("garcom")
    expect(employee?.authUserId).toBe(body.user.id)
  })

  it("nao permite elevacao de papel via cliente", async () => {
    const response = await signUp("escalada@example.com", {
      employeeRole: "admin",
      role: "admin",
    })
    expect(response.status).toBe(200)
    const employee = await mongo
      .db(dbName)
      .collection("employees")
      .findOne({ email: "escalada@example.com" })
    expect(employee?.role).toBe("garcom")
    const user = await mongo.db(dbName).collection("user").findOne({ email: "escalada@example.com" })
    expect(user?.role ?? "user").not.toBe("admin")
  })

  it("email duplicado responde 409", async () => {
    const response = await signUp("dup@example.com")
    expect(response.status).toBe(200)
    const duplicate = await signUp("DUP@EXAMPLE.COM")
    expect(duplicate.status).toBe(409)
  })

  it("emite JWT com sub e sessionId a partir da sessao do cookie", async () => {
    const response = await signUp("jwt@example.com")
    expect(response.status).toBe(200)
    const body = (await response.json()) as { user: { id: string } }
    const token = await tokenFor(cookieFrom(response))
    const payload = decodePayload(token)
    expect(payload["sub"]).toBe(body.user.id)
    expect(typeof payload["sessionId"]).toBe("string")
    expect(payload["iss"]).toBe(origin)
    expect(payload["aud"]).toBe(origin)
  })

  it("protege /api/v1 com Bearer e ignora cookie", async () => {
    const response = await signUp("rest@example.com")
    const cookie = cookieFrom(response)
    const token = await tokenFor(cookie)

    const comToken = await fetch(`${origin}/api/v1/employees`, {
      headers: { authorization: `Bearer ${token}` },
    })
    expect(comToken.status).toBe(200)

    const soCookie = await fetch(`${origin}/api/v1/employees`, { headers: { cookie } })
    expect(soCookie.status).toBe(401)

    const semHeader = await fetch(`${origin}/api/v1/employees`)
    expect(semHeader.status).toBe(401)

    const tokenser = await fetch(`${origin}/api/v1/employees`, {
      headers: { authorization: `Bearer ${token.slice(0, -2)}xx` },
    })
    expect(tokenser.status).toBe(401)
  })

  it("reset de senha revoga sessoes e troca a senha", async () => {
    const email = "reset@example.com"
    const signup = await signUp(email)
    const cookie = cookieFrom(signup)
    const oldToken = await tokenFor(cookie)

    const requestReset = await post("/api/auth/request-password-reset", { email })
    expect(requestReset.status).toBe(200)

    const verification = await mongo
      .db(dbName)
      .collection("verification")
      .findOne({ identifier: { $regex: "^reset-password:" } })
    expect(verification?.identifier).toBeTruthy()
    const token = String(verification!.identifier).replace("reset-password:", "")

    const reset = await post("/api/auth/reset-password", {
      newPassword: "nova-senha-segura-123",
      token,
    })
    expect(reset.status).toBe(200)

    const revoked = await fetch(`${origin}/api/v1/employees`, {
      headers: { authorization: `Bearer ${oldToken}` },
    })
    expect(revoked.status).toBe(401)

    const oldLogin = await post("/api/auth/sign-in/email", { email, password: PASSWORD })
    expect(oldLogin.status).toBeGreaterThanOrEqual(400)

    const newLogin = await post("/api/auth/sign-in/email", {
      email,
      password: "nova-senha-segura-123",
    })
    expect(newLogin.status).toBe(200)
    const newToken = await tokenFor(cookieFrom(newLogin))
    const ok = await fetch(`${origin}/api/v1/employees`, {
      headers: { authorization: `Bearer ${newToken}` },
    })
    expect(ok.status).toBe(200)
  })

  it("logout revoga a sessao e invalida o JWT emitido", async () => {
    const signup = await signUp("logout@example.com")
    const cookie = cookieFrom(signup)
    const token = await tokenFor(cookie)

    const antes = await fetch(`${origin}/api/v1/employees`, {
      headers: { authorization: `Bearer ${token}` },
    })
    expect(antes.status).toBe(200)

    const logout = await post("/api/auth/sign-out", {}, { cookie })
    expect(logout.status).toBe(200)

    const depois = await fetch(`${origin}/api/v1/employees`, {
      headers: { authorization: `Bearer ${token}` },
    })
    expect(depois.status).toBe(401)
  })

  it("cria funcionario admin sem duplicar provisionamento do signup", async () => {
    const adminEmail = "admin.integration@example.com"
    const signup = await signUp(adminEmail)
    const adminId = ((await signup.json()) as { user: { id: string } }).user.id

    await mongo
      .db(dbName)
      .collection("user")
      .updateOne({ _id: new ObjectId(adminId) }, { $set: { role: "admin" } })
    await mongo
      .db(dbName)
      .collection("employees")
      .updateOne({ authUserId: adminId }, { $set: { role: "admin" } })

    const login = await post("/api/auth/sign-in/email", { email: adminEmail, password: PASSWORD })
    const cookie = cookieFrom(login)
    const token = await tokenFor(cookie)

    const created = await post(
      "/api/v1/employees",
      {
        name: "Cozinha Nova",
        email: "cozinha.nova@example.com",
        role: "cozinha",
        password: PASSWORD,
      },
      { authorization: `Bearer ${token}`, cookie }
    )
    expect(created.status).toBe(201)
    const createdBody = (await created.json()) as { role: string }
    expect(createdBody.role).toBe("cozinha")

    const count = await mongo
      .db(dbName)
      .collection("employees")
      .countDocuments({ email: "cozinha.nova@example.com" })
    expect(count).toBe(1)
  })
})
