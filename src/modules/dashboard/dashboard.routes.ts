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
 *       Fluxo de dinheiro (faturamento da janela vs janela anterior, hoje,
 *       ticket medio, por dia, categoria, produto, funcionario e hora), musicas
 *       (tocadas, fila, espera media, pedidos por hora, mais pedidas, mesas que
 *       mais pedem) e operacao (comandas abertas, pedidos em preparo,
 *       permanencia media). Faturamento = pedidos nao cancelados de comandas
 *       finalizadas. Datas seguem UTC-3. Valores em unidades menores (10^4).
 *     tags:
 *       - Dashboard
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           enum: [7, 14, 30]
 *           default: 7
 *         description: Tamanho da janela em dias, terminando hoje
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
