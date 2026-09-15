export const EMPLOYEE_ROLES = ["admin", "garcom", "cozinha"] as const

export type EmployeeRole = (typeof EMPLOYEE_ROLES)[number] & string

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
}
