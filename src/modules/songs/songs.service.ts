import { AppError } from "../../shared/app-error.js"
import { isTabOpen } from "../../shared/status.js"
import { withTransaction } from "../../shared/with-transaction.js"
import Tab from "../tabs/tabs.model.js"
import Song from "./songs.model.js"
import type { ICreateSongDTO } from "./songs.types.js"

export function moveQueuedItem<T>(
  items: readonly T[],
  fromIndex: number,
  targetPosition: number
): T[] {
  const toIndex = targetPosition - 1
  if (
    !Number.isInteger(targetPosition) ||
    fromIndex < 0 ||
    fromIndex >= items.length ||
    toIndex < 0 ||
    toIndex >= items.length
  ) {
    throw new AppError(
      items.length === 0
        ? "Nao ha musicas na fila para reordenar."
        : `A posicao deve estar entre 1 e ${items.length}.`,
      400
    )
  }

  const next = [...items]
  const [moved] = next.splice(fromIndex, 1)
  if (moved !== undefined) {
    next.splice(toIndex, 0, moved)
  }
  return next
}

class SongService {
  public async create(data: ICreateSongDTO) {
    const title = data.title?.trim()
    if (!title) throw new AppError("Nome da musica e obrigatorio.")

    const tab = await Tab.findById(data.tab)
    if (!tab) throw new AppError("Comanda nao encontrada.", 404)
    if (!isTabOpen(tab.status)) {
      throw new AppError(
        "A comanda precisa estar aberta para adicionar musicas.",
        409
      )
    }

    const lastSong = await Song.findOne({ status: "queued" }).sort({
      position: -1,
    })
    const song = await Song.create({
      title,
      tab: tab._id,
      tabName: tab.tableName,
      status: "queued",
      position: (lastSong?.position ?? 0) + 1,
      requestedAt: new Date(),
    })

    return song
  }

  public async get() {
    return Song.find({ status: { $in: ["playing", "queued"] } }).sort({
      status: 1,
      position: 1,
      requestedAt: 1,
    })
  }

  public async updatePosition(id: string, position: number) {
    return withTransaction(async (session) => {
      const song = await Song.findById(id).session(session)
      if (!song) throw new AppError("Musica nao encontrada.", 404)
      if (song.status !== "queued") {
        throw new AppError(
          "Apenas musicas pendentes na fila podem ter sua posicao alterada.",
          409
        )
      }

      const queuedSongs = await Song.find({ status: "queued" })
        .sort({ position: 1, requestedAt: 1 })
        .session(session)

      const currentIndex = queuedSongs.findIndex(
        (item) => String(item._id) === String(song._id)
      )
      if (currentIndex === -1) {
        throw new AppError(
          "Apenas musicas pendentes na fila podem ter sua posicao alterada.",
          409
        )
      }

      const reordered = moveQueuedItem(queuedSongs, currentIndex, position)
      await Promise.all(
        reordered.map((item, index) =>
          session
            ? Song.updateOne(
                { _id: item._id },
                { position: index + 1 },
                { session }
              )
            : Song.updateOne({ _id: item._id }, { position: index + 1 })
        )
      )

      return Song.find({ status: { $in: ["playing", "queued"] } })
        .sort({
          status: 1,
          position: 1,
          requestedAt: 1,
        })
        .session(session)
    })
  }

  public async cancel(id: string) {
    const song = await Song.findById(id)
    if (!song) throw new AppError("Musica nao encontrada.", 404)
    if (song.status !== "queued") {
      throw new AppError(
        "A musica atual ou ja finalizada nao pode ser cancelada.",
        409
      )
    }

    song.status = "cancelled"
    song.position = null
    song.cancelledAt = new Date()
    await song.save()
    await this.reorganizeQueue()

    return song
  }

  public async advance() {
    const current = await Song.findOne({ status: "playing" })
    if (current) {
      current.status = "finished"
      current.position = null
      current.finishedAt = new Date()
      await current.save()
    }

    const next = await Song.findOne({ status: "queued" }).sort({
      position: 1,
      requestedAt: 1,
    })
    if (next) {
      next.status = "playing"
      next.position = 0
      next.startedAt = new Date()
      await next.save()
    }

    await this.reorganizeQueue()
    return { current: next, queue: await this.get() }
  }

  private async reorganizeQueue(): Promise<void> {
    const queuedSongs = await Song.find({ status: "queued" }).sort({
      position: 1,
      requestedAt: 1,
    })
    await Promise.all(
      queuedSongs.map((song, index) =>
        Song.updateOne({ _id: song._id }, { position: index + 1 })
      )
    )
  }
}

export default new SongService()
