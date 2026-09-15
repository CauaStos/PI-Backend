import { Router } from "express"
import { asyncHandler } from "../../shared/async-handler.js"
import tabController from "./tabs.controller.js"
import { requireRoles } from "../auth/auth.middleware.js"

const tabRoutes = Router()

/**
 * @openapi
 * /tabs:
 *   post:
 *     summary: Abrir uma nova comanda (Tab)
 *     tags:
 *       - Comandas
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tableName
 *             properties:
 *               tableName:
 *                 type: string
 *                 example: Mesa 04
 *     responses:
 *       201:
 *         description: Comanda aberta com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Tab'
 *       400:
 *         description: Informações inválidas
 */
tabRoutes.post(
  "/",
  requireRoles("admin", "garcom"),
  asyncHandler(tabController.create)
)

/**
 * @openapi
 * /tabs:
 *   get:
 *     summary: Lista todas as comandas
 *     tags:
 *       - Comandas
 *     responses:
 *       200:
 *         description: Comandas encontradas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Tab'
 */
tabRoutes.get("/", asyncHandler(tabController.getTabs))

/**
 * @openapi
 * /tabs/{id}:
 *   get:
 *     summary: Encontra uma comanda pelo ID
 *     tags:
 *       - Comandas
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Comanda encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Tab'
 *       404:
 *         description: Comanda não encontrada
 */
tabRoutes.get("/:id", asyncHandler(tabController.getTabById))

/**
 * @openapi
 * /tabs/{id}:
 *   patch:
 *     summary: Atualiza uma comanda
 *     tags:
 *       - Comandas
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 example: closed
 *     responses:
 *       200:
 *         description: Comanda atualizada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Tab'
 *       404:
 *         description: Comanda não encontrada
 */
tabRoutes.patch(
  "/:id",
  requireRoles("admin", "garcom"),
  asyncHandler(tabController.update)
)

/**
 * @openapi
 * /tabs/{id}:
 *   delete:
 *     summary: Deleta uma comanda
 *     tags:
 *       - Comandas
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Comanda deletada com sucesso
 *       404:
 *         description: Comanda não encontrada
 */
tabRoutes.delete(
  "/:id",
  requireRoles("admin"),
  asyncHandler(tabController.delete)
)

export default tabRoutes
