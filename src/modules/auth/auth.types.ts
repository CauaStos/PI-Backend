import type { EmployeeRole } from "../employees/employees.types.js"
import type { Role } from "../../shared/enums/role.js"

/**
 * Claims relevantes do JWT emitido pelo plugin jwt do Better Auth.
 * `sub` e o id do usuario e `sessionId` liga o token a sessao persistida.
 */
export interface AccessTokenPayload {
  sub?: string
  sessionId?: string
  email?: string
  role?: Role
  iat?: number
  exp?: number
  iss?: string
  aud?: string | string[]
}

export interface RequestAuth {
  userId: string
  sessionId: string
  role: Role
  employee: {
    id: string
    role: EmployeeRole
    name: string
    email: string
  }
}
