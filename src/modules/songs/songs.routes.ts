import { Router } from "express";
import { asyncHandler } from "../../shared/async-handler.js";
import songController from "./songs.controller.js";

const songRoutes = Router();

/**
 * @openapi
 * /songs:
 *   get:
 *     summary: Lista a musica atual e a fila de musicas pendentes
 *     tags:
 *       - Musicas
 *     responses:
 *       200:
 *         description: Fila de musicas encontrada
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Song'
 */
songRoutes.get("/", asyncHandler(songController.getSongs));

/**
 * @openapi
 * /songs:
 *   post:
 *     summary: Adiciona uma musica ao fim da fila
 *     tags:
 *       - Musicas
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - tab
 *             properties:
 *               title:
 *                 type: string
 *                 example: Evidencias - Chitaozinho & Xororo
 *               tab:
 *                 type: string
 *                 example: 60d0fe4f5311236168a109cc
 *     responses:
 *       201:
 *         description: Musica adicionada a fila
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Song'
 */
songRoutes.post("/", asyncHandler(songController.create));

/**
 * @openapi
 * /songs/advance:
 *   post:
 *     summary: Finaliza a musica atual e inicia a proxima da fila
 *     tags:
 *       - Musicas
 *     responses:
 *       200:
 *         description: Fila avancada com sucesso
 */
songRoutes.post("/advance", asyncHandler(songController.advance));

/**
 * @openapi
 * /songs/{id}:
 *   delete:
 *     summary: Cancela uma musica pendente da fila
 *     tags:
 *       - Musicas
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Musica cancelada com sucesso
 *       404:
 *         description: Musica nao encontrada
 *       409:
 *         description: Musica ja esta tocando ou foi finalizada
 */
songRoutes.delete("/:id", asyncHandler(songController.cancel));

export default songRoutes;
