import type { NextFunction, Request, Response } from "express"
import { ZodError, type ZodType } from "zod"
import { AppError } from "./app-error.js"

type ValidationSchemas = {
  body?: ZodType
  params?: ZodType
  query?: ZodType
}

/**
 * Middleware de validacao com zod. Parsed bodies/params/queries substituem os
 * originais (com trim/coercion aplicados). Falhas viram AppError 400 com a
 * mensagem do primeiro problema, mantendo o formato { error: { message } }.
 */
export function validate(schemas: ValidationSchemas) {
  return (request: Request, _response: Response, next: NextFunction) => {
    try {
      if (schemas.body)
        request.body = schemas.body.parse(request.body) as typeof request.body
      if (schemas.params)
        request.params = schemas.params.parse(
          request.params
        ) as typeof request.params
      if (schemas.query)
        request.query = schemas.query.parse(
          request.query
        ) as typeof request.query
      next()
    } catch (error) {
      if (error instanceof ZodError) {
        const message =
          error.issues
            .map((issue) => issue.message)
            .filter(Boolean)
            .join("; ") || "Dados invalidos."
        next(new AppError(message, 400))
        return
      }
      next(error)
    }
  }
}
