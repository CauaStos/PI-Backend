import { Router } from "express"
import { asyncHandler } from "../../shared/async-handler.js"
import orderController from "./orders.controller.js"
import { validate } from "../../shared/validate.js"
import { idParamSchema } from "../../shared/schemas.js"
import { createOrderSchema, updateOrderSchema } from "./orders.schemas.js"
import {
  allowKitchenStatusUpdate,
  requireRoles,
} from "../auth/auth.middleware.js"

const orderRoutes = Router()

/**
 * @openapi
 * /orders:
 *   post:
 *     summary: Registrar um novo pedido
 *     tags:
 *       - Pedidos
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tab
 *               - product
 *               - productName
 *               - unitPrice
 *               - employee
 *               - employeeName
 *               - employeeAvatar
 *               - quantity
 *             properties:
 *               tab:
 *                 type: string
 *               product:
 *                 type: string
 *               productName:
 *                 type: string
 *               unitPrice:
 *                 type: number
 *               employee:
 *                 type: string
 *               employeeName:
 *                 type: string
 *               employeeAvatar:
 *                 type: string
 *               quantity:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Pedido registrado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       400:
 *         description: Informações inválidas
 */
orderRoutes.post(
  "/",
  requireRoles("admin", "garcom"),
  validate({ body: createOrderSchema }),
  asyncHandler(orderController.create)
)

/**
 * @openapi
 * /orders:
 *   get:
 *     summary: Lista todos os pedidos
 *     tags:
 *       - Pedidos
 *     responses:
 *       200:
 *         description: Pedidos encontrados com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Order'
 */
orderRoutes.get("/", asyncHandler(orderController.getOrders))

/**
 * @openapi
 * /orders/{id}:
 *   get:
 *     summary: Encontra um pedido pelo ID
 *     tags:
 *       - Pedidos
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Pedido encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       404:
 *         description: Pedido não encontrado
 */
orderRoutes.get(
  "/:id",
  validate({ params: idParamSchema }),
  asyncHandler(orderController.getOrderById)
)

/**
 * @openapi
 * /orders/{id}:
 *   patch:
 *     summary: Atualiza um pedido (ex. mudar status para entregue)
 *     tags:
 *       - Pedidos
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
 *                 example: delivered
 *     responses:
 *       200:
 *         description: Pedido atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       404:
 *         description: Pedido não encontrado
 */
orderRoutes.patch(
  "/:id",
  requireRoles("admin", "garcom", "cozinha"),
  allowKitchenStatusUpdate,
  validate({ body: updateOrderSchema, params: idParamSchema }),
  asyncHandler(orderController.update)
)

/**
 * @openapi
 * /orders/{id}:
 *   delete:
 *     summary: Deleta um pedido
 *     tags:
 *       - Pedidos
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Pedido deletado com sucesso
 *       404:
 *         description: Pedido não encontrado
 */
orderRoutes.delete(
  "/:id",
  requireRoles("admin"),
  validate({ params: idParamSchema }),
  asyncHandler(orderController.delete)
)

export default orderRoutes
