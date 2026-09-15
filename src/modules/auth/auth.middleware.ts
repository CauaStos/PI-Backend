import { fromNodeHeaders } from "better-auth/node"
import type { NextFunction, Request, Response } from "express"
import { auth } from "../../config/auth.js"
import { AppError } from "../../shared/app-error.js"
import Employee from "../employees/employees.model.js"
import type { EmployeeRole } from "../employees/employees.types.js"

declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string
        employee: {
          id: string
          role: EmployeeRole
          name: string
          email: string
        }
      }
    }
  }
}

export async function requireAuth(
  request: Request,
  _response: Response,
  next: NextFunction
) {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(request.headers),
  })
  if (!session) return next(new AppError("Autenticacao necessaria.", 401))
  const employee = await Employee.findOne({
    $or: [
      { authUserId: session.user.id },
      { email: session.user.email.toLowerCase() },
    ],
  })
  if (!employee)
    return next(new AppError("Funcionario nao vinculado a esta conta.", 403))
  request.auth = {
    userId: session.user.id,
    employee: {
      id: String(employee._id),
      role: employee.role,
      name: employee.name,
      email: employee.email,
    },
  }
  return next()
}

export function requireRoles(...roles: EmployeeRole[]) {
  return (request: Request, _response: Response, next: NextFunction) => {
    if (!request.auth || !roles.includes(request.auth.employee.role))
      return next(new AppError("Permissao insuficiente.", 403))
    return next()
  }
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
