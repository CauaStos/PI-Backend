import { z } from "zod"
import {
  employeeSchema,
  orderSchema,
  productSchema,
  songSchema,
  tabMemberSchema,
  tabSchema,
} from "@pi/contracts"
import swaggerJsdoc from "swagger-jsdoc"

/**
 * Os schemas de resposta sao gerados dos zod schemas do @pi/contracts,
 * entao contrato compartilhado e documentacao nunca dessincronizam.
 * Zod gera JSON Schema (draft 2020-12); OpenAPI 3.0 nao aceita
 * "type": [t, "null"] nem "$schema", entao normalizamos para `nullable`.
 */
function toOpenApi(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(toOpenApi)
  if (typeof node !== "object" || node === null) return node

  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(node)) {
    if (key === "$schema") continue
    if (key === "type" && Array.isArray(value)) {
      const types = value.filter((t) => t !== "null") as string[]
      out.type = types[0]
      if (types.length < value.length) out.nullable = true
      continue
    }
    out[key] = toOpenApi(value)
  }

  if (Array.isArray(out.anyOf)) {
    const members = (out.anyOf as Record<string, unknown>[]).filter(
      (member) => member?.type !== "null"
    )
    if (members.length !== (out.anyOf as unknown[]).length) {
      delete out.anyOf
      out.nullable = true
      if (members.length === 1) Object.assign(out, toOpenApi(members[0]))
      else out.anyOf = members.map(toOpenApi)
    }
  }
  return out
}

const componentSchemas = {
  Product: productSchema,
  Employee: employeeSchema,
  TabMember: tabMemberSchema,
  Tab: tabSchema,
  Order: orderSchema,
  Song: songSchema,
} satisfies Record<string, z.ZodType>

const schemas = Object.fromEntries(
  Object.entries(componentSchemas).map(([name, schema]) => [
    name,
    toOpenApi(z.toJSONSchema(schema)),
  ])
)

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "OnStage API",
      version: "1.0.0",
      description: "API do OnStage - comandas, pedidos e fila de musicas.",
    },
    servers: [
      {
        url: "http://localhost:3000/api/v1",
      },
    ],
    components: {
      schemas,
    },
  },
  apis: ["./src/modules/**/*.routes.ts"],
}

export const swaggerSpec = swaggerJsdoc(options)
