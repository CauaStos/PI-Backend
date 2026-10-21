import type { NextFunction, Request, Response } from "express"
import { AppError } from "../../shared/app-error.js"
import Employee from "../employees/employees.model.js"
import { toAccessRole } from "../employees/employees.types.js"
import type { EmployeeRole } from "../employees/employees.types.js"
import { Role } from "../../shared/enums/role.js"
import { isSessionActive, verifyAccessToken } from "./auth.service.js"
import type { RequestAuth } from "./auth.types.js"

declare global {
  namespace Express {
    interface Request {
      auth?: RequestAuth
    }
  }
}

/**
 * Extrai o token do header `Authorization: Bearer <jwt>`.
 * Retorna `null` quando o esquema nao e Bearer, sem olhar cookies.
 */
export function getBearerToken(request: Request): string | null {
  const header = request.headers.authorization
  if (!header) return null
  const [scheme, token] = header.split(" ")
  if (scheme?.toLowerCase() !== "bearer" || !token) return null
  const trimmed = token.trim()
  return trimmed || null
}

/**
 * Autentica as rotas REST via JWT Bearer. Nao aceita cookie como fallback:
 * a API `/api/v1` so responde a um access token valido emitido por
 * `/api/auth/token`. O cookie continua valido para refresh/socket.
 */
export async function requireAuth(
  request: Request,
  _response: Response,
  next: NextFunction
) {
  const token = getBearerToken(request)
  if (!token) {
    return next(new AppError("Token de acesso ausente.", 401))
  }

  let payload
  try {
    payload = await verifyAccessToken(token)
  } catch {
    payload = null
  }

  const userId = typeof payload?.sub === "string" ? payload.sub : ""
  const sessionId = typeof payload?.sessionId === "string" ? payload.sessionId : ""
  if (!payload || !userId || !sessionId) {
    return next(new AppError("Token de acesso invalido ou expirado.", 401))
  }

  if (!(await isSessionActive(sessionId, userId))) {
    return next(new AppError("Sessao expirada ou revogada.", 401))
  }

  const employee = await Employee.findOne({ authUserId: userId })
  if (!employee) {
    return next(new AppError("Funcionario nao vinculado a esta conta.", 403))
  }

  request.auth = {
    userId,
    sessionId,
    role: toAccessRole(employee.role),
    employee: {
      id: String(employee._id),
      role: employee.role,
      name: employee.name,
      email: employee.email,
    },
  }
  return next()
}

export function requireRoles(...roles: Role[]) {
  return (request: Request, _response: Response, next: NextFunction) => {
    if (!request.auth || !roles.includes(request.auth.role))
      return next(new AppError("Permissao insuficiente.", 403))
    return next()
  }
}

export function requireEmployeeReadAccess(
  request: Request,
  _response: Response,
  next: NextFunction
) {
  const role = request.auth?.role
  const canReadAll =
    role === Role.ADMIN || role === Role.GERENTE || role === Role.OPERADOR
  const isSelf =
    !request.params["id"] ||
    request.auth?.employee.id === request.params["id"]
  if (!request.auth || (!canReadAll && !isSelf)) {
    return next(new AppError("Permissao insuficiente.", 403))
  }
  return next()
}

export function requireEmployeeUpdateAccess(
  request: Request,
  _response: Response,
  next: NextFunction
) {
  const auth = request.auth
  if (!auth) return next(new AppError("Permissao insuficiente.", 403))

  if (auth.role === Role.ADMIN) return next()

  if (Object.hasOwn(request.body ?? {}, "role")) {
    return next(new AppError("Somente ADMIN pode alterar papéis.", 403))
  }

  if (auth.role === Role.GERENTE) return next()

  const isSelf =
    auth.employee.id === (request.params["id"] ?? auth.employee.id)
  const isProfileOnly = Object.keys(request.body ?? {}).every((key) =>
    ["name", "avatar"].includes(key)
  )
  if (isSelf && isProfileOnly) return next()
  return next(new AppError("Permissao insuficiente.", 403))
}

export function allowKitchenStatusUpdate(
  request: Request,
  _response: Response,
  next: NextFunction
) {
  if (request.auth?.employee.role === "cozinha") {
    const keys = Object.keys(request.body ?? {})
    if (keys.length !== 1 || keys[0] !== "status")
      return next(
        new AppError("A cozinha pode alterar apenas o status do pedido.", 403)
      )
  }
  return next()
}
