import { z } from "zod";
export const STATUS = {
    OPEN: "open",
    IN_PROGRESS: "in_progress",
    DELIVERED: "delivered",
    FINISHED: "finished",
    CANCELLED: "cancelled",
};
export const TAB_STATUSES = [
    STATUS.OPEN,
    STATUS.IN_PROGRESS,
    STATUS.FINISHED,
    STATUS.CANCELLED,
];
export const ORDER_STATUSES = [
    STATUS.IN_PROGRESS,
    STATUS.DELIVERED,
    STATUS.FINISHED,
    STATUS.CANCELLED,
];
export const tabStatusSchema = z.enum(TAB_STATUSES);
export const orderStatusSchema = z.enum(ORDER_STATUSES);
/** Uma comanda so aceita alteracoes enquanto esta aberta ou em andamento. */
export function isTabOpen(status) {
    return status === STATUS.OPEN || status === STATUS.IN_PROGRESS;
}
