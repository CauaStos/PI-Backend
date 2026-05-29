import type { NextFunction, Request, Response } from "express";

type AsyncRouteHandler = (
    request: Request,
    response: Response,
    next: NextFunction
) => Promise<unknown>;

/**
 * Envolve um handler assincrono e encaminha qualquer rejeicao para o
 * error.middleware, evitando try/catch repetido em cada controller.
 */
export function asyncHandler(handler: AsyncRouteHandler) {
    return (request: Request, response: Response, next: NextFunction): void => {
        handler(request, response, next).catch(next);
    };
}
