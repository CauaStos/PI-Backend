import { Router } from "express"
import { asyncHandler } from "../../shared/async-handler.js"
import { requirePermission } from "../auth/auth.middleware.js"
import dashboardController from "./dashboard.controller.js"

const dashboardRoutes = Router()

/**
 * @openapi
 * /dashboard:
 *   get:
 *     summary: Indicadores do dashboard
 *     description: >
 *       Usuarios ativos (sessao valida), cadastros do mes, registros pendentes
 *       (pedidos em preparo, comandas abertas e musicas na fila) e quantidade
 *       de produtos/itens vendidos por categoria. Datas seguem UTC-3.
 *     tags:
 *       - Dashboard
 *     responses:
 *       200:
 *         description: Indicadores calculados
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Dashboard'
 *       401:
 *         description: Token ausente ou invalido
 *       403:
 *         description: Sem a permissao dashboard.read (apenas ADMIN e GERENTE)
 */
dashboardRoutes.get(
  "/",
  requirePermission("dashboard.read"),
  asyncHandler(dashboardController.get)
)

export default dashboardRoutes
