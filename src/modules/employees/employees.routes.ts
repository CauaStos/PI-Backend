import { Router } from "express"
import { asyncHandler } from "../../shared/async-handler.js"
import employeeController from "./employees.controller.js"
import {
  requireEmployeeReadAccess,
  requireEmployeeUpdateAccess,
  requireRoles,
} from "../auth/auth.middleware.js"
import { validate } from "../../shared/validate.js"
import { idParamSchema } from "../../shared/schemas.js"
import {
  createEmployeeSchema,
  updateEmployeeSchema,
} from "./employees.schemas.js"
import { Role } from "../../shared/enums/role.js"

const employeeRoutes = Router()

/**
 * @openapi
 * /employees:
 *   post:
 *     summary: Cadastrar um funcionário
 *     tags:
 *       - Funcionários
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - role
 *               - avatar
 *             properties:
 *               name:
 *                 type: string
 *                 example: João Silva
 *               email:
 *                 type: string
 *                 example: joao@karaoke.com
 *               role:
 *                 type: string
 *                 example: garcom
 *                 enum: [admin, garcom, cozinha, ADMIN, GERENTE, OPERADOR, CLIENTE]
 *               avatar:
 *                 type: string
 *                 example: https://avatar.url/joao.png
 *     responses:
 *       201:
 *         description: Funcionário cadastrado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Employee'
 *       400:
 *         description: Informações inválidas
 */
employeeRoutes.post(
  "/",
  requireRoles(Role.ADMIN),
  validate({ body: createEmployeeSchema }),
  asyncHandler(employeeController.create)
)

/**
 * @openapi
 * /employees:
 *   get:
 *     summary: Lista todos os funcionários
 *     tags:
 *       - Funcionários
 *     responses:
 *       200:
 *         description: Funcionários encontrados com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Employee'
 */
employeeRoutes.get(
  "/",
  requireRoles(Role.ADMIN, Role.GERENTE, Role.OPERADOR),
  asyncHandler(employeeController.getEmployees)
)

employeeRoutes.get("/me", asyncHandler(employeeController.getEmployeeById))
employeeRoutes.patch(
  "/me",
  validate({ body: updateEmployeeSchema }),
  requireEmployeeUpdateAccess,
  asyncHandler(employeeController.update)
)

/**
 * @openapi
 * /employees/me:
 *   get:
 *     summary: Consulta o próprio perfil
 *     tags:
 *       - Funcionários
 *     responses:
 *       200:
 *         description: Perfil do usuário autenticado
 *       401:
 *         description: Usuário não autenticado
 */

/**
 * @openapi
 * /employees/{id}:
 *   get:
 *     summary: Encontra um funcionário pelo ID
 *     tags:
 *       - Funcionários
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Funcionário encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Employee'
 *       404:
 *         description: Funcionário não encontrado
 */
employeeRoutes.get(
  "/:id",
  validate({ params: idParamSchema }),
  requireEmployeeReadAccess,
  asyncHandler(employeeController.getEmployeeById)
)

/**
 * @openapi
 * /employees/{id}:
 *   patch:
 *     summary: Atualiza um funcionário
 *     tags:
 *       - Funcionários
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
 *               name:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [admin, garcom, cozinha, ADMIN, GERENTE, OPERADOR, CLIENTE]
 *     responses:
 *       200:
 *         description: Funcionário atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Employee'
 *       404:
 *         description: Funcionário não encontrado
 */
employeeRoutes.patch(
  "/:id",
  validate({ body: updateEmployeeSchema, params: idParamSchema }),
  requireEmployeeUpdateAccess,
  asyncHandler(employeeController.update)
)

/**
 * @openapi
 * /employees/{id}:
 *   delete:
 *     summary: Deleta um funcionário
 *     tags:
 *       - Funcionários
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Funcionário deletado com sucesso
 *       404:
 *         description: Funcionário não encontrado
 */
employeeRoutes.delete(
  "/:id",
  requireRoles(Role.ADMIN),
  validate({ params: idParamSchema }),
  asyncHandler(employeeController.delete)
)

export default employeeRoutes
