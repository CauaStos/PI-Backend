import { Router } from "express"
import { asyncHandler } from "../../shared/async-handler.js"
import { idParamSchema } from "../../shared/schemas.js"
import { validate } from "../../shared/validate.js"
import { requirePermission } from "../auth/auth.middleware.js"
import songController from "./songs.controller.js"
import {
  createSongSchema,
  updateSongPositionSchema,
} from "./songs.schemas.js"

const songRoutes = Router()

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
songRoutes.get(
  "/",
  requirePermission("song.read"),
  asyncHandler(songController.getSongs)
)

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
songRoutes.post(
  "/",
  requirePermission("song.create"),
  validate({ body: createSongSchema }),
  asyncHandler(songController.create)
)

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
songRoutes.post(
  "/advance",
  requirePermission("song.manage"),
  asyncHandler(songController.advance)
)

/**
 * @openapi
 * /songs/{id}/position:
 *   patch:
 *     summary: Altera manualmente a posicao de uma musica pendente na fila
 *     tags:
 *       - Musicas
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
 *             required:
 *               - position
 *             properties:
 *               position:
 *                 type: integer
 *                 minimum: 1
 *                 example: 1
 *     responses:
 *       200:
 *         description: Fila reorganizada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Song'
 *       400:
 *         description: Posicao invalida para a fila atual
 *       404:
 *         description: Musica nao encontrada
 *       409:
 *         description: Musica nao esta pendente na fila
 */
songRoutes.patch(
  "/:id/position",
  requirePermission("song.manage"),
  validate({ params: idParamSchema, body: updateSongPositionSchema }),
  asyncHandler(songController.updatePosition)
)

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
songRoutes.delete(
  "/:id",
  requirePermission("song.manage"),
  validate({ params: idParamSchema }),
  asyncHandler(songController.cancel)
)

export default songRoutes
