import mongoose from "mongoose"

type SessionFn<T> = (
  session: mongoose.ClientSession | null
) => Promise<T>

/**
 * Executa `fn` dentro de uma transacao do Mongo, garantindo atomicidade
 * entre as escritas (pedido + estoque + comanda).
 *
 * Transacoes exigem replica set. Se o deployment nao suportar (mongod
 * standalone de desenvolvimento), cai para o modo legado sem sessao,
 * com o mesmo comportamento atomico de "ou rodou tudo, ou nada nao
 * garantido" de antes da migracao.
 */
export async function withTransaction<T>(fn: SessionFn<T>): Promise<T> {
  const session = await mongoose.connection.startSession()
  try {
    try {
      return await session.withTransaction(() => fn(session))
    } catch (error) {
      if (isUnsupportedTransaction(error)) return await fn(null)
      throw error
    }
  } finally {
    await session.endSession()
  }
}

function isUnsupportedTransaction(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error)
  return /Transaction numbers are only allowed|replica set|replicaSet/i.test(
    message
  )
}
