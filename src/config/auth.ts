import { MongoClient } from "mongodb"
import { betterAuth } from "better-auth"
import { mongodbAdapter } from "better-auth/adapters/mongodb"
import { APIError, createAuthMiddleware } from "better-auth/api"
import { admin, jwt } from "better-auth/plugins"
import Employee from "../modules/employees/employees.model.js"
import {
  getBaseUrl,
  getJwtAudience,
  getJwtIssuer,
  getTrustedOrigins,
  isPasswordResetConsoleEnabled,
  validateAuthSecret,
} from "./env.js"

const mongoUri = process.env.MONGO_URI
if (!mongoUri) throw new Error("MONGO_URI is required")
const mongoClient = new MongoClient(mongoUri)
const databaseName = new URL(mongoUri).pathname.replace(/^\//, "") || "onstage"

const secret = validateAuthSecret()

/**
 * Email ja vinculado a uma conta ou a um funcionario. Usado no hook de signup
 * para devolver 409 limpo antes do check interno (que responde 422 generico).
 */
async function emailJaCadastrado(email: string): Promise<boolean> {
  const context = await auth.$context
  const account = await context.internalAdapter.findUserByEmail(email)
  if (account?.user) return true
  const employee = await Employee.findOne({ email }).select("_id").lean()
  return Boolean(employee)
}

export const auth = betterAuth({
  database: mongodbAdapter(mongoClient.db(databaseName), {
    client: mongoClient,
    // O adapter abre uma transacao por operacao e cria varias colecoes novas
    // (user/account/session) de forma implicita. No MongoDB 7.0 isso estoura
    // WriteConflict "collection namespace is already in use". Como as rotas de
    // auth nao precisam de atomicidade multi-documento, desligamos a transacao
    // do adapter e mantemos a consistencia por compensacao nos databaseHooks.
    transaction: false,
  }),
  secret,
  baseURL: getBaseUrl(),
  trustedOrigins: getTrustedOrigins(),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    // Hash padrao do Better Auth (scrypt). Nao sobrescrevemos.
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      if (!isPasswordResetConsoleEnabled()) return
      console.log(`[auth] Link de redefinicao de senha para ${user.email}: ${url}`)
    },
  },
  user: {
    additionalFields: {
      // `input: false` impede que o cliente defina o papel no signup.
      employeeRole: { type: "string", required: false, input: false },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user, context) => {
          const data: Record<string, unknown> = {}
          if (typeof user.email === "string") {
            data["email"] = user.email.trim().toLowerCase()
          }
          if (context?.path === "/sign-up/email") {
            // Papel sempre servidor: o signup publico cria apenas garcom.
            data["employeeRole"] = "garcom"
          }
          return { data }
        },
        after: async (user, context) => {
          if (context?.path !== "/sign-up/email") return
          const name = typeof user.name === "string" ? user.name : user.email
          try {
            await Employee.create({
              authUserId: user.id,
              name,
              email: user.email,
              role: "garcom",
              avatar: name.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase(),
            })
          } catch (error) {
            // Provisionamento consistente: se o Employee falhar, remove o
            // usuario criado para nao deixar conta sem funcionario vinculado.
            await context.context.internalAdapter
              .deleteUser(user.id)
              .catch(() => undefined)
            throw error
          }
        },
      },
      delete: {
        after: async (user) => {
          await Employee.deleteOne({ authUserId: user.id }).catch(() => undefined)
        },
      },
    },
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-up/email") return
      const body = ctx.body as Record<string, unknown> | undefined
      if (!body) return
      // Campos controlados pelo servidor nunca vem do cliente. Removemos antes
      // da validacao para que uma tentativa de escalonamento seja ignorada
      // (200 com garcom) em vez de virar erro 400 de campo nao permitido.
      for (const field of [
        "employeeRole",
        "role",
        "banned",
        "banReason",
        "banExpires",
      ]) {
        delete body[field]
      }
      if (typeof body["email"] !== "string") return
      const email = body["email"].trim().toLowerCase()
      // Normaliza o valor recebido antes da validacao do endpoint.
      body["email"] = email
      if (await emailJaCadastrado(email)) {
        throw new APIError("CONFLICT", {
          message: "Este email ja esta cadastrado.",
          code: "EMAIL_ALREADY_REGISTERED",
        })
      }
    }),
  },
  plugins: [
    admin(),
    jwt({
      jwt: {
        issuer: getJwtIssuer(),
        audience: getJwtAudience(),
        expirationTime: "15m",
        // Liga o JWT a sessao ativa: permite revogar no logout/reset.
        definePayload: ({ user, session }) => ({
          sessionId: session.id,
          email: user.email,
        }),
      },
    }),
  ],
})
