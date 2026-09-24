import { describe, expect, it } from "vitest";
import { employeeSchema, format, isValidMoney, moneySchema, multiply, orderSchema, parseInput, productSchema, sum, tabSchema, toMinor, } from "@pi/contracts";
describe("money", () => {
    it("parseInput aceita virgula e ponto decimal", () => {
        expect(parseInput("24,90")).toBe(249_000);
        expect(parseInput("24.90")).toBe(249_000);
        expect(parseInput("24")).toBe(240_000);
    });
    it("parseInput devolve NaN para lixo", () => {
        expect(parseInput("abc")).toBeNaN();
        expect(parseInput("")).toBeNaN();
    });
    it("format exibe em reais", () => {
        expect(format(249_000)).toContain("24,90");
        expect(format(0)).toContain("0,00");
    });
    it("toMinor converte reais para unidades menores", () => {
        expect(toMinor(24.9)).toBe(249_000);
        expect(toMinor(0.1)).toBe(1_000);
    });
    it("multiply e sum operam em inteiros sem drift", () => {
        expect(multiply(249_000, 3)).toBe(747_000);
        expect(sum([249_000, 747_000, 1_000])).toBe(997_000);
    });
    it("isValidMoney so aceita inteiro >= 0", () => {
        expect(isValidMoney(249_000)).toBe(true);
        expect(isValidMoney(0)).toBe(true);
        expect(isValidMoney(-1)).toBe(false);
        expect(isValidMoney(24.9)).toBe(false);
        expect(isValidMoney("249000")).toBe(false);
    });
});
describe("schemas de dominio", () => {
    const baseProduct = {
        id: "p1",
        name: "Coca-Cola",
        price: 249_000,
        stock: 10,
        createdAt: new Date().toISOString(),
    };
    it("productSchema aceita produto valido", () => {
        expect(productSchema.safeParse(baseProduct).success).toBe(true);
    });
    it("productSchema rejeita preco negativo e estoque negativo", () => {
        expect(productSchema.safeParse({ ...baseProduct, price: -1 }).success).toBe(false);
        expect(productSchema.safeParse({ ...baseProduct, stock: -5 }).success).toBe(false);
    });
    it("moneySchema rejeita fracionado", () => {
        expect(moneySchema.safeParse(24.9).success).toBe(false);
    });
    it("employeeSchema rejeita email invalido", () => {
        const parsed = employeeSchema.safeParse({
            id: "e1",
            name: "Joao",
            email: "nao-e-email",
            role: "garcom",
            avatar: "a.png",
            createdAt: new Date().toISOString(),
        });
        expect(parsed.success).toBe(false);
    });
    it("orderSchema rejeita quantidade menor que 1", () => {
        const parsed = orderSchema.safeParse({
            id: "o1",
            tab: "t1",
            product: "p1",
            productName: "Coca-Cola",
            unitPrice: 249_000,
            employee: "e1",
            employeeName: "Joao",
            employeeAvatar: "a.png",
            quantity: 0,
            status: "in_progress",
            orderedAt: new Date().toISOString(),
            deliveredAt: null,
        });
        expect(parsed.success).toBe(false);
    });
    it("tabSchema aceita comanda aberta e rejeita status desconhecido", () => {
        const base = {
            id: "t1",
            tableName: "Mesa 04",
            status: "open",
            members: [],
            orders: [],
            openedAt: new Date().toISOString(),
            closedAt: null,
        };
        expect(tabSchema.safeParse(base).success).toBe(true);
        expect(tabSchema.safeParse({ ...base, status: "fechada" }).success).toBe(false);
    });
});
//# sourceMappingURL=contracts.test.js.map