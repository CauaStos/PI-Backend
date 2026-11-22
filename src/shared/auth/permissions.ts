import { Role } from "../enums/role.js"

export const Permission = {
  EMPLOYEE_READ: "employee.read",
  EMPLOYEE_READ_OWN: "employee.read_own",
  EMPLOYEE_CREATE: "employee.create",
  EMPLOYEE_UPDATE: "employee.update",
  EMPLOYEE_UPDATE_OWN: "employee.update_own",
  EMPLOYEE_MANAGE_ACCESS: "employee.manage_access",
  EMPLOYEE_DELETE: "employee.delete",
  PRODUCT_READ: "product.read",
  PRODUCT_MANAGE: "product.manage",
  ORDER_READ: "order.read",
  ORDER_CREATE: "order.create",
  ORDER_UPDATE: "order.update",
  ORDER_UPDATE_STATUS: "order.update_status",
  ORDER_DELETE: "order.delete",
  TAB_READ: "tab.read",
  TAB_CREATE: "tab.create",
  TAB_UPDATE: "tab.update",
  TAB_DELETE: "tab.delete",
  SONG_READ: "song.read",
  SONG_CREATE: "song.create",
  SONG_MANAGE: "song.manage",
  DASHBOARD_READ: "dashboard.read",
} as const

export type Permission = (typeof Permission)[keyof typeof Permission]

export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  [Role.ADMIN]: Object.values(Permission),
  [Role.GERENTE]: [
    Permission.EMPLOYEE_READ,
    Permission.EMPLOYEE_READ_OWN,
    Permission.EMPLOYEE_UPDATE_OWN,
    Permission.PRODUCT_READ,
    Permission.ORDER_READ,
    Permission.TAB_READ,
    Permission.SONG_READ,
    Permission.DASHBOARD_READ,
  ],
  [Role.OPERADOR]: [
    Permission.EMPLOYEE_READ,
    Permission.EMPLOYEE_READ_OWN,
    Permission.EMPLOYEE_UPDATE_OWN,
    Permission.PRODUCT_READ,
    Permission.ORDER_READ,
    Permission.ORDER_CREATE,
    Permission.ORDER_UPDATE,
    Permission.ORDER_UPDATE_STATUS,
    Permission.TAB_READ,
    Permission.TAB_CREATE,
    Permission.TAB_UPDATE,
    Permission.SONG_READ,
    Permission.SONG_CREATE,
    Permission.SONG_MANAGE,
  ],
  [Role.CLIENTE]: [
    Permission.EMPLOYEE_READ_OWN,
    Permission.EMPLOYEE_UPDATE_OWN,
  ],
}

export function hasPermission(
  role: Role,
  permission: Permission
): boolean {
  return ROLE_PERMISSIONS[role].includes(permission)
}
