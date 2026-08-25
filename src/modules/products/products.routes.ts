import { Router } from "express";
import { asyncHandler } from "../../shared/async-handler.js";
import productsController from "./products.controller.js";

const productRoutes = Router();

/**
 * @openapi
 * /products:
 *   post:
 *     summary: Cadastrar um produto
 *     tags:
 *       - Produtos
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *             properties:
 *               name:
 *                 type: string
 *                 example: Coca-Cola
 *               price:
 *                 type: number
 *                 example: 7.5
 *
 *     responses:
 *       201:
 *         description: Produto cadastrado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *
 *       400:
 *         description: Informações inválidas
 */
productRoutes.post("/", asyncHandler(productsController.create));

/**
 * @openapi
 * /products:
 *   get:
 *     summary: Lista todos os produtos
 *     tags:
 *       - Produtos
 *     responses:
 *       200:
 *         description: Produtos encontrados com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 */
productRoutes.get("/", asyncHandler(productsController.getProducts));

/**
 * @openapi
 * /products/{id}:
 *   get:
 *     summary: Encontre um produto pelo ID
 *     tags:
 *       - Produtos
 *
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *
 *     responses:
 *       200:
 *         description: Produto encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *
 *       404:
 *         description: Produto não encontrado
 */
productRoutes.get("/:id", asyncHandler(productsController.getProductById));

/**
 * @openapi
 * /products/{id}:
 *   patch:
 *     summary: Atualize um produto
 *     tags:
 *       - Produtos
 *
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Coca-Cola Zero
 *               price:
 *                 type: number
 *                 example: 8.5
 *
 *     responses:
 *       200:
 *         description: Produto atualizado com sucesso!
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *
 *       404:
 *         description: Produto não encontrado
 */
productRoutes.patch("/:id", asyncHandler(productsController.update));

/**
 * @openapi
 * /products/{id}:
 *   delete:
 *     summary: Delete um produto
 *     tags:
 *       - Produtos
 *
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *
 *     responses:
 *       204:
 *         description: Produto deletado com sucesso
 *
 *       404:
 *         description: Produto não encontrado
 */
productRoutes.delete("/:id", asyncHandler(productsController.delete));

export default productRoutes;
