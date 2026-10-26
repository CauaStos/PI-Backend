import type { NextFunction, Request, Response } from "express"
import { AppError } from "../../shared/app-error.js"
import Employee from "../employees/employees.model.js"
import { toAccessRole } from "../employees/employees.types.js"
import {
  hasPermission,
  Permission,
  type Permission as PermissionType,
} from "../../shared/auth/permissions.js"
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
  const role = toAccessRole(employee.role)
  if (!role) {
    return next(new AppError("Papel do funcionario invalido.", 403))
  }

  request.auth = {
    userId,
    sessionId,
    role,
    employee: {
      id: String(employee._id),
      role: employee.role,
      name: employee.name,
      email: employee.email,
    },
  }
  return next()
}

export function requirePermission(permission: PermissionType) {
  return (request: Request, _response: Response, next: NextFunction) => {
    if (!request.auth || !hasPermission(request.auth.role, permission)) {
      return next(new AppError("Permissao insuficiente.", 403))
    }
    return next()
  }
}

export function requireEmployeeReadAccess(
  request: Request,
  _response: Response,
  next: NextFunction
) {
  const auth = request.auth
  const employeeId = request.params["id"]
  const permission =
    auth &&
    (!employeeId || employeeId === auth.employee.id
      ? hasPermission(auth.role, Permission.EMPLOYEE_READ_OWN) ||
        hasPermission(auth.role, Permission.EMPLOYEE_READ)
      : hasPermission(auth.role, Permission.EMPLOYEE_READ))
  if (!auth || !permission) {
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

  const employeeId = request.params["id"] ?? auth.employee.id
  const isSelf = auth.employee.id === employeeId
  const hasUpdatePermission = isSelf
    ? hasPermission(auth.role, Permission.EMPLOYEE_UPDATE_OWN) ||
      hasPermission(auth.role, Permission.EMPLOYEE_UPDATE)
    : hasPermission(auth.role, Permission.EMPLOYEE_UPDATE)
  if (!hasUpdatePermission) {
    return next(new AppError("Permissao insuficiente.", 403))
  }

  const updatesAccess = Object.hasOwn(request.body ?? {}, "email")
    ? hasPermission(auth.role, Permission.EMPLOYEE_MANAGE_ACCESS)
    : !Object.hasOwn(request.body ?? {}, "role") ||
      hasPermission(auth.role, Permission.EMPLOYEE_MANAGE_ACCESS)
  if (!updatesAccess) {
    return next(
      new AppError("Somente usuários autorizados podem alterar o papel.", 403)
    )
  }
  return next()
}

export function requireOrderUpdatePermission(
  request: Request,
  _response: Response,
  next: NextFunction
) {
  const fields = Object.keys(request.body ?? {})
  const permission =
    fields.length === 1 && fields[0] === "status"
      ? Permission.ORDER_UPDATE_STATUS
      : Permission.ORDER_UPDATE
  if (!request.auth || !hasPermission(request.auth.role, permission)) {
    return next(new AppError("Permissao insuficiente.", 403))
  }
  return next()
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
