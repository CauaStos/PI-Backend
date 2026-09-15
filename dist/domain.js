import { z } from "zod";
import { moneySchema } from "./money.js";
import { orderStatusSchema, tabStatusSchema } from "./status.js";
export const employeeRoleSchema = z.enum(["admin", "garcom", "cozinha"]);
export const employeeSchema = z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().email(),
    role: employeeRoleSchema,
    avatar: z.string(),
    createdAt: z.string().datetime(),
});
export const productSchema = z.object({
    id: z.string(),
    name: z.string(),
    price: moneySchema,
    stock: z.number().int().min(0),
    description: z.string().optional(),
    image: z.string().optional(),
    createdAt: z.string().datetime(),
});
export const tabMemberSchema = z.object({
    employee: z.string(),
    name: z.string(),
    avatar: z.string(),
});
export const orderSchema = z.object({
    id: z.string(),
    tab: z.string(),
    product: z.string(),
    productName: z.string(),
    unitPrice: moneySchema,
    employee: z.string(),
    employeeName: z.string(),
    employeeAvatar: z.string(),
    quantity: z.number().int().min(1),
    status: orderStatusSchema,
    orderedAt: z.string().datetime(),
    deliveredAt: z.string().datetime().nullable(),
});
export const tabSchema = z.object({
    id: z.string(),
    tableName: z.string(),
    status: tabStatusSchema,
    members: z.array(tabMemberSchema),
    orders: z.array(orderSchema),
    openedAt: z.string().datetime(),
    closedAt: z.string().datetime().nullable(),
});
export const songStatusSchema = z.enum(["queued", "playing", "finished", "cancelled"]);
export const songSchema = z.object({
    id: z.string(),
    title: z.string(),
    tab: z.string(),
    tabName: z.string(),
    status: songStatusSchema,
    position: z.number().int().nullable(),
    requestedAt: z.string().datetime(),
    startedAt: z.string().datetime().nullable(),
    finishedAt: z.string().datetime().nullable(),
    cancelledAt: z.string().datetime().nullable(),
});
export const boardDataSchema = z.object({
    employees: z.array(employeeSchema),
    products: z.array(productSchema),
    comandas: z.array(tabSchema),
    songs: z.array(songSchema),
});
