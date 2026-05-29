export const EMPLOYEE_ROLES = ["admin", "garcom", "cozinha"] as const;

export type EmployeeRole = (typeof EMPLOYEE_ROLES)[number] & string;

export interface IEmployee {
    name: string;
    email: string;
    role: EmployeeRole;
    avatar: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface ICreateEmployeeDTO {
    name: string;
    email: string;
    role?: EmployeeRole;
    avatar?: string;
}

export interface IUpdateEmployeeDTO {
    name?: string;
    email?: string;
    role?: EmployeeRole;
    avatar?: string;
}
