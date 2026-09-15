import { z } from "zod";
export declare const STATUS: {
    readonly OPEN: "open";
    readonly IN_PROGRESS: "in_progress";
    readonly DELIVERED: "delivered";
    readonly FINISHED: "finished";
    readonly CANCELLED: "cancelled";
};
export declare const TAB_STATUSES: readonly ["open", "in_progress", "finished", "cancelled"];
export declare const ORDER_STATUSES: readonly ["in_progress", "delivered", "finished", "cancelled"];
export declare const tabStatusSchema: z.ZodEnum<{
    open: "open";
    in_progress: "in_progress";
    finished: "finished";
    cancelled: "cancelled";
}>;
export declare const orderStatusSchema: z.ZodEnum<{
    in_progress: "in_progress";
    delivered: "delivered";
    finished: "finished";
    cancelled: "cancelled";
}>;
export type TabStatus = z.infer<typeof tabStatusSchema>;
export type OrderStatus = z.infer<typeof orderStatusSchema>;
/** Uma comanda so aceita alteracoes enquanto esta aberta ou em andamento. */
export declare function isTabOpen(status: string): boolean;
