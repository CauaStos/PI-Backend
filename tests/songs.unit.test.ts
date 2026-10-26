import type { ClientSession } from "mongoose"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { AppError } from "../src/shared/app-error.js"

const sessionStub = { id: "tx-1" } as unknown as ClientSession
let activeSession: ClientSession | null = null

vi.mock("../src/shared/with-transaction.js", () => ({
  withTransaction: vi.fn((fn: (s: ClientSession | null) => Promise<unknown>) =>
    fn(activeSession)
  ),
}))

vi.mock("../src/modules/songs/songs.model.js", () => ({
  default: {
    findById: vi.fn(),
    find: vi.fn(),
    updateOne: vi.fn(),
  },
}))

import Song from "../src/modules/songs/songs.model.js"
import {
  createSongSchema,
  updateSongPositionSchema,
} from "../src/modules/songs/songs.schemas.js"
import songService, {
  moveQueuedItem,
} from "../src/modules/songs/songs.service.js"

const findByIdMock = vi.mocked(Song.findById)
const findMock = vi.mocked(Song.find)
const updateOneMock = vi.mocked(Song.updateOne)

function chainableDoc<T>(doc: T) {
  return {
    session: vi.fn().mockResolvedValue(doc),
  }
}

function chainableSort<T>(docs: T[]) {
  return {
    sort: vi.fn().mockReturnValue({
      session: vi.fn().mockResolvedValue(docs),
    }),
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  activeSession = null
})

describe("moveQueuedItem", () => {
  it("move musica do fim para o topo da fila", () => {
    expect(moveQueuedItem(["s1", "s2", "s3", "s4"], 3, 1)).toEqual([
      "s4",
      "s1",
      "s2",
      "s3",
    ])
  })

  it("move musica para baixo mantendo a ordem relativa das demais", () => {
    expect(moveQueuedItem(["s1", "s2", "s3", "s4"], 0, 3)).toEqual([
      "s2",
      "s3",
      "s1",
      "s4",
    ])
  })

  it("mantem a fila intacta quando a posicao alvo e a mesma", () => {
    expect(moveQueuedItem(["s1", "s2", "s3"], 1, 2)).toEqual([
      "s1",
      "s2",
      "s3",
    ])
  })

  it("rejeita posicoes fora do intervalo da fila", () => {
    expect(() => moveQueuedItem(["s1", "s2"], 0, 0)).toThrow(AppError)
    expect(() => moveQueuedItem(["s1", "s2"], 0, 3)).toThrow(AppError)
    expect(() => moveQueuedItem(["s1", "s2"], 0, 1.5)).toThrow(AppError)
    expect(() => moveQueuedItem([], 0, 1)).toThrow(AppError)
  })
})

describe("schemas de musicas", () => {
  it("valida criacao de musica com trim", () => {
    expect(
      createSongSchema.parse({
        title: "  Evidencias  ",
        tab: "  tab-1  ",
      })
    ).toEqual({
      title: "Evidencias",
      tab: "tab-1",
    })
    expect(createSongSchema.safeParse({ title: "   ", tab: "tab-1" }).success).toBe(
      false
    )
  })

  it("exige posicao inteira positiva na reordenacao", () => {
    expect(updateSongPositionSchema.parse({ position: 1 })).toEqual({
      position: 1,
    })
    expect(updateSongPositionSchema.safeParse({ position: 0 }).success).toBe(
      false
    )
    expect(updateSongPositionSchema.safeParse({ position: -2 }).success).toBe(
      false
    )
    expect(updateSongPositionSchema.safeParse({ position: 1.2 }).success).toBe(
      false
    )
    expect(updateSongPositionSchema.safeParse({ position: "1" }).success).toBe(
      false
    )
  })
})

describe("songService.updatePosition", () => {
  it("retorna 404 quando a musica nao existe", async () => {
    findByIdMock.mockReturnValue(chainableDoc(null) as never)

    await expect(songService.updatePosition("missing", 1)).rejects.toMatchObject(
      {
        status: 404,
      }
    )
  })

  it("retorna 409 quando a musica ja esta tocando ou encerrada", async () => {
    findByIdMock.mockReturnValue(
      chainableDoc({ _id: "s0", status: "playing", position: 0 }) as never
    )

    await expect(songService.updatePosition("s0", 1)).rejects.toMatchObject({
      status: 409,
    })
  })

  it("retorna 400 quando a nova posicao excede o tamanho da fila", async () => {
    const queued = [
      { _id: "s1", status: "queued", position: 1 },
      { _id: "s2", status: "queued", position: 2 },
    ]
    findByIdMock.mockReturnValue(chainableDoc(queued[0]) as never)
    findMock.mockReturnValueOnce(chainableSort(queued) as never)

    await expect(songService.updatePosition("s1", 5)).rejects.toMatchObject({
      status: 400,
    })
    expect(updateOneMock).not.toHaveBeenCalled()
  })

  it("recalcula todas as posicoes pendentes e propaga a sessao da transacao", async () => {
    activeSession = sessionStub
    const queued = [
      { _id: "s1", title: "Musica 1", status: "queued", position: 1 },
      { _id: "s2", title: "Musica 2", status: "queued", position: 2 },
      { _id: "s3", title: "Musica 3", status: "queued", position: 3 },
    ]
    const updatedQueue = [
      { _id: "s0", title: "Tocando", status: "playing", position: 0 },
      { _id: "s3", title: "Musica 3", status: "queued", position: 1 },
      { _id: "s1", title: "Musica 1", status: "queued", position: 2 },
      { _id: "s2", title: "Musica 2", status: "queued", position: 3 },
    ]

    findByIdMock.mockReturnValue(chainableDoc(queued[2]) as never)
    findMock
      .mockReturnValueOnce(chainableSort(queued) as never)
      .mockReturnValueOnce(chainableSort(updatedQueue) as never)
    updateOneMock.mockResolvedValue({ acknowledged: true } as never)

    const result = await songService.updatePosition("s3", 1)

    expect(updateOneMock).toHaveBeenCalledTimes(3)
    expect(updateOneMock).toHaveBeenNthCalledWith(
      1,
      { _id: "s3" },
      { position: 1 },
      { session: sessionStub }
    )
    expect(updateOneMock).toHaveBeenNthCalledWith(
      2,
      { _id: "s1" },
      { position: 2 },
      { session: sessionStub }
    )
    expect(updateOneMock).toHaveBeenNthCalledWith(
      3,
      { _id: "s2" },
      { position: 3 },
      { session: sessionStub }
    )
    expect(result).toEqual(updatedQueue)
  })
})
