import { getIO } from "./io.js"

/**
 * Avisa clientes conectados que o board mudou. Payload minimo de proposito:
 * cada cliente refaz fetch do estado consistente em /api/v1, evitando
 * condicoes de corrida entre eventos concorrentes.
 */
export function emitBoardChanged(): void {
  getIO()?.to("board").emit("board:changed", { at: Date.now() })
}
