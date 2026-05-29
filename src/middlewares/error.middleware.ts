import type { NextFunction, Request, Response } from "express";
import { Error as MongooseError } from "mongoose";
import { AppError } from "../shared/app-error.js";

/**
 * Middleware de erro central. Traduz AppError e erros do Mongoose em uma
 * resposta JSON uniforme: { error: { message, status } }.
 *
 * Deve ser registrado DEPOIS das rotas em app.ts.
 */
export function errorMiddleware(
    error: unknown,
    _request: Request,
    response: Response,
    _next: NextFunction
): Response {
    if (error instanceof AppError) {
        return response.status(error.status).json({
            error: { message: error.message, status: error.status },
        });
    }

    if (error instanceof MongooseError.ValidationError) {
        const message = Object.values(error.errors)
            .map((field) => field?.message ?? "")
            .filter(Boolean)
            .join("; ");
        return response.status(400).json({
            error: { message: message || "Dados invalidos.", status: 400 },
        });
    }

    if (error instanceof MongooseError.CastError) {
        return response.status(400).json({
            error: { message: "Identificador invalido.", status: 400 },
        });
    }

    console.error("Erro nao tratado:", error);
    return response.status(500).json({
        error: { message: "Erro interno do servidor.", status: 500 },
    });
}
