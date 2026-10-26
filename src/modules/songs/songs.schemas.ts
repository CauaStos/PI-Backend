import { z } from "zod"

export const createSongSchema = z.object({
  title: z
    .string({ message: "Nome da musica e obrigatorio." })
    .trim()
    .min(1, "Nome da musica e obrigatorio.")
    .max(160, "Nome da musica deve ter no maximo 160 caracteres."),
  tab: z
    .string({ message: "Comanda obrigatoria." })
    .trim()
    .min(1, "Comanda obrigatoria."),
})

export const updateSongPositionSchema = z.object({
  position: z
    .number({ message: "Posicao invalida." })
    .int("A posicao deve ser um numero inteiro.")
    .min(1, "A posicao deve ser pelo menos 1."),
})
