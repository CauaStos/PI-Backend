import { z } from "zod";
export declare const employeeRoleSchema: z.ZodEnum<{
    admin: "admin";
    garcom: "garcom";
    cozinha: "cozinha";
}>;
export type EmployeeRole = z.infer<typeof employeeRoleSchema>;
export declare const employeeSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    email: z.ZodString;
    role: z.ZodEnum<{
        admin: "admin";
        garcom: "garcom";
        cozinha: "cozinha";
    }>;
    avatar: z.ZodString;
    createdAt: z.ZodString;
}, z.core.$strip>;
export type Employee = z.infer<typeof employeeSchema>;
export declare const productSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    price: z.ZodNumber;
    stock: z.ZodNumber;
    description: z.ZodOptional<z.ZodString>;
    image: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodString;
}, z.core.$strip>;
export type Product = z.infer<typeof productSchema>;
export declare const tabMemberSchema: z.ZodObject<{
    employee: z.ZodString;
    name: z.ZodString;
    avatar: z.ZodString;
}, z.core.$strip>;
export type TabMember = z.infer<typeof tabMemberSchema>;
export declare const orderSchema: z.ZodObject<{
    id: z.ZodString;
    tab: z.ZodString;
    product: z.ZodString;
    productName: z.ZodString;
    unitPrice: z.ZodNumber;
    employee: z.ZodString;
    employeeName: z.ZodString;
    employeeAvatar: z.ZodString;
    quantity: z.ZodNumber;
    status: z.ZodEnum<{
        in_progress: "in_progress";
        delivered: "delivered";
        finished: "finished";
        cancelled: "cancelled";
    }>;
    orderedAt: z.ZodString;
    deliveredAt: z.ZodNullable<z.ZodString>;
}, z.core.$strip>;
export type ComandaOrder = z.infer<typeof orderSchema>;
export declare const tabSchema: z.ZodObject<{
    id: z.ZodString;
    tableName: z.ZodString;
    status: z.ZodEnum<{
        open: "open";
        in_progress: "in_progress";
        finished: "finished";
        cancelled: "cancelled";
    }>;
    members: z.ZodArray<z.ZodObject<{
        employee: z.ZodString;
        name: z.ZodString;
        avatar: z.ZodString;
    }, z.core.$strip>>;
    orders: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        tab: z.ZodString;
        product: z.ZodString;
        productName: z.ZodString;
        unitPrice: z.ZodNumber;
        employee: z.ZodString;
        employeeName: z.ZodString;
        employeeAvatar: z.ZodString;
        quantity: z.ZodNumber;
        status: z.ZodEnum<{
            in_progress: "in_progress";
            delivered: "delivered";
            finished: "finished";
            cancelled: "cancelled";
        }>;
        orderedAt: z.ZodString;
        deliveredAt: z.ZodNullable<z.ZodString>;
    }, z.core.$strip>>;
    openedAt: z.ZodString;
    closedAt: z.ZodNullable<z.ZodString>;
}, z.core.$strip>;
export type Comanda = z.infer<typeof tabSchema>;
export declare const songStatusSchema: z.ZodEnum<{
    finished: "finished";
    cancelled: "cancelled";
    queued: "queued";
    playing: "playing";
}>;
export type SongStatus = z.infer<typeof songStatusSchema>;
export declare const songSchema: z.ZodObject<{
    id: z.ZodString;
    title: z.ZodString;
    tab: z.ZodString;
    tabName: z.ZodString;
    status: z.ZodEnum<{
        finished: "finished";
        cancelled: "cancelled";
        queued: "queued";
        playing: "playing";
    }>;
    position: z.ZodNullable<z.ZodNumber>;
    requestedAt: z.ZodString;
    startedAt: z.ZodNullable<z.ZodString>;
    finishedAt: z.ZodNullable<z.ZodString>;
    cancelledAt: z.ZodNullable<z.ZodString>;
}, z.core.$strip>;
export type Song = z.infer<typeof songSchema>;
export declare const boardDataSchema: z.ZodObject<{
    employees: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        email: z.ZodString;
        role: z.ZodEnum<{
            admin: "admin";
            garcom: "garcom";
            cozinha: "cozinha";
        }>;
        avatar: z.ZodString;
        createdAt: z.ZodString;
    }, z.core.$strip>>;
    products: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        price: z.ZodNumber;
        stock: z.ZodNumber;
        description: z.ZodOptional<z.ZodString>;
        image: z.ZodOptional<z.ZodString>;
        createdAt: z.ZodString;
    }, z.core.$strip>>;
    comandas: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        tableName: z.ZodString;
        status: z.ZodEnum<{
            open: "open";
            in_progress: "in_progress";
            finished: "finished";
            cancelled: "cancelled";
        }>;
        members: z.ZodArray<z.ZodObject<{
            employee: z.ZodString;
            name: z.ZodString;
            avatar: z.ZodString;
        }, z.core.$strip>>;
        orders: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            tab: z.ZodString;
            product: z.ZodString;
            productName: z.ZodString;
            unitPrice: z.ZodNumber;
            employee: z.ZodString;
            employeeName: z.ZodString;
            employeeAvatar: z.ZodString;
            quantity: z.ZodNumber;
            status: z.ZodEnum<{
                in_progress: "in_progress";
                delivered: "delivered";
                finished: "finished";
                cancelled: "cancelled";
            }>;
            orderedAt: z.ZodString;
            deliveredAt: z.ZodNullable<z.ZodString>;
        }, z.core.$strip>>;
        openedAt: z.ZodString;
        closedAt: z.ZodNullable<z.ZodString>;
    }, z.core.$strip>>;
    songs: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        title: z.ZodString;
        tab: z.ZodString;
        tabName: z.ZodString;
        status: z.ZodEnum<{
            finished: "finished";
            cancelled: "cancelled";
            queued: "queued";
            playing: "playing";
        }>;
        position: z.ZodNullable<z.ZodNumber>;
        requestedAt: z.ZodString;
        startedAt: z.ZodNullable<z.ZodString>;
        finishedAt: z.ZodNullable<z.ZodString>;
        cancelledAt: z.ZodNullable<z.ZodString>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type BoardData = z.infer<typeof boardDataSchema>;
