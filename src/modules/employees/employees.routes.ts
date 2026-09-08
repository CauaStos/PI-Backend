import { Router } from "express";
import { asyncHandler } from "../../shared/async-handler.js";
import employeeController from "./employees.controller.js";
import { requireRoles } from "../auth/auth.middleware.js";

const employeeRoutes = Router();

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
employeeRoutes.post("/", requireRoles("admin"), asyncHandler(employeeController.create));

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
employeeRoutes.get("/", asyncHandler(employeeController.getEmployees));

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
employeeRoutes.get("/:id", asyncHandler(employeeController.getEmployeeById));

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
employeeRoutes.patch("/:id", requireRoles("admin"), asyncHandler(employeeController.update));

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
employeeRoutes.delete("/:id", requireRoles("admin"), asyncHandler(employeeController.delete));

export default employeeRoutes;