import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { AppError } from "../src/shared/app-error.js";
import { isTabOpen, STATUS } from "../src/shared/status.js";
import { validate } from "../src/shared/validate.js";
describe("isTabOpen", () => {
    it("aberta e em andamento aceitam mudancas", () => {
        expect(isTabOpen(STATUS.OPEN)).toBe(true);
        expect(isTabOpen(STATUS.IN_PROGRESS)).toBe(true);
        expect(isTabOpen(STATUS.FINISHED)).toBe(false);
        expect(isTabOpen(STATUS.CANCELLED)).toBe(false);
    });
});
describe("AppError", () => {
    it("status default e 400", () => {
        const error = new AppError("Coisa ruim.");
        expect(error.status).toBe(400);
        expect(error.message).toBe("Coisa ruim.");
    });
    it("aceita status customizado", () => {
        expect(new AppError("Sumiu.", 404).status).toBe(404);
    });
});
describe("validate middleware", () => {
    const schema = z.object({
        name: z.string().trim().min(1),
        quantity: z.coerce.number().int().min(1),
    });
    function run(body) {
        const request = { body };
        const next = vi.fn();
        validate({ body: schema })(request, {}, next);
        return { request, next };
    }
    it("passa o body parseado (trim e coerce)", () => {
        const { request, next } = run({ name: "  Coca  ", quantity: "2" });
        expect(next).toHaveBeenCalledTimes(1);
        expect(request.body).toEqual({ name: "Coca", quantity: 2 });
    });
    it("body invalido vira AppError 400 no next", () => {
        const { next } = run({ name: "", quantity: 0 });
        expect(next).toHaveBeenCalledTimes(1);
        const error = next.mock.calls[0]?.[0];
        expect(error).toBeInstanceOf(AppError);
        expect(error.status).toBe(400);
    });
    it("erro que nao e zod repassa intacto", () => {
        const boom = new Error("boom");
        const evilSchema = {
            parse: () => {
                throw boom;
            },
        };
        const request = { body: { name: "x" } };
        const next = vi.fn((err) => {
            throw err;
        });
        expect(() => validate({ body: evilSchema })(request, {}, next)).toThrow("boom");
    });
});
//# sourceMappingURL=shared.test.js.map