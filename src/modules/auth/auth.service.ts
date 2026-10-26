import { auth } from "../../config/auth.js"
import type { AccessTokenPayload } from "./auth.types.js"

/**
 * Verifica assinatura, expiracao, issuer e audience do access token usando o
 * endpoint server-only do plugin jwt. Devolve o payload ou `null`.
 */
export async function verifyAccessToken(
  token: string
): Promise<AccessTokenPayload | null> {
  const result = await auth.api.verifyJWT({ body: { token } })
  const payload = result?.payload as AccessTokenPayload | null | undefined
  return payload ?? null
}

/**
 * Confere se a sessao do JWT ainda existe e nao expirou. E o gancho que faz
 * logout e reset de senha invalidarem tokens ja emitidos.
 */
export async function isSessionActive(
  sessionId: string,
  userId: string
): Promise<boolean> {
  const context = await auth.$context
  const session = await context.adapter.findOne<{
    userId?: string
    expiresAt?: Date | string
  }>({
    model: "session",
    where: [{ field: "id", value: sessionId }],
  })
  if (!session?.userId || session.userId !== userId) return false
  if (!session.expiresAt) return false
  return new Date(session.expiresAt).getTime() > Date.now()
}
