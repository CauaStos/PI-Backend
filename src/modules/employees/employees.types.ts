import { Role } from "../../shared/enums/role.js"

export const LEGACY_EMPLOYEE_ROLES = ["admin", "garcom", "cozinha"] as const
export const EMPLOYEE_ROLES = [
  ...LEGACY_EMPLOYEE_ROLES,
  ...Object.values(Role),
] as const

export type EmployeeRole = (typeof EMPLOYEE_ROLES)[number] & string

export function toAccessRole(role: string): Role | null {
  switch (role) {
    case "admin":
    case Role.ADMIN:
      return Role.ADMIN
    case "garcom":
    case "cozinha":
    case Role.OPERADOR:
      return Role.OPERADOR
    case Role.GERENTE:
      return Role.GERENTE
    case Role.CLIENTE:
      return Role.CLIENTE
    default:
      return null
  }
}

export function isAdminRole(role: EmployeeRole): boolean {
  return toAccessRole(role) === Role.ADMIN
}

export interface IEmployee {
  authUserId?: string
  name: string
  email: string
  role: EmployeeRole
  avatar: string
  createdAt?: Date
  updatedAt?: Date
}

export interface ICreateEmployeeDTO {
  name: string
  email: string
  role?: EmployeeRole
  avatar?: string
  password?: string
  headers: Headers
}

export interface IUpdateEmployeeDTO {
  name?: string
  email?: string
  role?: EmployeeRole
  avatar?: string
  headers: Headers
  actorUserId?: string
  actorRole?: Role
}
