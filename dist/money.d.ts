import { z } from "zod";
/** Dinheiro e inteiro em unidades menores, escala 10^4. R$ 24,90 -> 249000. */
export declare const MONEY_SCALE = 10000;
export declare function toMinor(reais: number): number;
export declare function isValidMoney(value: unknown): value is number;
/** 249000 -> "R$ 24,90" */
export declare function format(minor: number): string;
/** Parse "24,90" | "24.90" | "24" -> 249000. NaN se invalido. */
export declare function parseInput(raw: string): number;
export declare function multiply(minor: number, qty: number): number;
export declare function sum(minors: number[]): number;
export declare const moneySchema: z.ZodNumber;
