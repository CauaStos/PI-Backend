const DEFAULT_BASE_URL = "http://localhost:3000"
const DEFAULT_FRONTEND_ORIGIN = "http://localhost:5173"

export function isProduction(): boolean {
  return process.env.NODE_ENV === "production"
}

/**
 * Valida o secret da autenticacao na inicializacao. Sem secret forte o
 * processo nem sobe, evitando rodar com assinatura de JWT previsivel.
 */
export function validateAuthSecret(
  value: string | undefined = process.env.BETTER_AUTH_SECRET
): string {
  const secret = value?.trim() ?? ""
  if (!secret) {
    throw new Error(
      "BETTER_AUTH_SECRET nao foi definida. Gere um valor aleatorio com pelo menos 32 caracteres."
    )
  }
  if (secret.length < 32) {
    throw new Error(
      "BETTER_AUTH_SECRET precisa ter pelo menos 32 caracteres."
    )
  }
  return secret
}

export function getBaseUrl(): string {
  return process.env.BETTER_AUTH_URL?.trim() || DEFAULT_BASE_URL
}

export function getTrustedOrigins(): string[] {
  return (process.env.FRONTEND_ORIGIN ?? DEFAULT_FRONTEND_ORIGIN)
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
}

export function getJwtIssuer(): string {
  return process.env.JWT_ISSUER?.trim() || getBaseUrl()
}

export function getJwtAudience(): string {
  return process.env.JWT_AUDIENCE?.trim() || getBaseUrl()
}

/**
 * O link de redefinicao so vai para o console quando pedido de forma explicita
 * (`AUTH_PASSWORD_RESET_CONSOLE_URL=true`) e nunca em producao. Nao existe
 * SMTP: sem esse flag ativo o envio e um no-op silencioso.
 */
export function isPasswordResetConsoleEnabled(): boolean {
  return (
    !isProduction() && process.env.AUTH_PASSWORD_RESET_CONSOLE_URL === "true"
  )
}
