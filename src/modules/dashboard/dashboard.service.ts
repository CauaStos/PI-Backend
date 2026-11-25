import Order from "../orders/orders.model.js"
import Product from "../products/products.model.js"
import Song from "../songs/songs.model.js"
import Tab from "../tabs/tabs.model.js"
import { STATUS } from "../../shared/status.js"
import {
  averageMinutes,
  rangeWindows,
  summarizeMoney,
  summarizeSongs,
  type RevenueRow,
  type SongRow,
} from "./dashboard.summary.js"
import type { Dashboard } from "./dashboard.types.js"

class DashboardService {
  /**
   * Pedidos nao cancelados de comandas finalizadas desde `since` (pela data de
   * fechamento da comanda). Mesma regra de receita do historico de comandas.
   */
  private revenueRows(since: Date): Promise<RevenueRow[]> {
    return Order.aggregate<RevenueRow>([
      { $match: { status: { $ne: STATUS.CANCELLED } } },
      {
        $lookup: {
          from: Tab.collection.name,
          localField: "tab",
          foreignField: "_id",
          pipeline: [{ $project: { status: 1, closedAt: 1 } }],
          as: "tabDoc",
        },
      },
      { $unwind: "$tabDoc" },
      {
        $match: {
          "tabDoc.status": STATUS.FINISHED,
          "tabDoc.closedAt": { $gte: since },
        },
      },
      {
        $lookup: {
          from: Product.collection.name,
          localField: "product",
          foreignField: "_id",
          pipeline: [{ $project: { category: 1 } }],
          as: "productDoc",
        },
      },
      {
        $project: {
          _id: 0,
          closedAt: "$tabDoc.closedAt",
          orderedAt: 1,
          amount: { $round: [{ $multiply: ["$unitPrice", "$quantity"] }, 0] },
          quantity: 1,
          productName: 1,
          employeeName: 1,
          category: { $ifNull: [{ $first: "$productDoc.category" }, "outros"] },
        },
      },
    ])
  }

  public async get(days: number, now = new Date()): Promise<Dashboard> {
    const w = rangeWindows(now, days)
    const finishedInWindow = {
      status: STATUS.FINISHED,
      closedAt: { $gte: w.start },
    }

    const [
      revenueRows,
      finishedTabs,
      finishedTabSpans,
      songRows,
      queued,
      playing,
      openTabs,
      ordersInProgress,
    ] = await Promise.all([
      this.revenueRows(w.previousStart),
      Tab.countDocuments(finishedInWindow),
      Tab.find(finishedInWindow, { openedAt: 1, closedAt: 1 }).lean(),
      Song.find(
        {
          $or: [
            { requestedAt: { $gte: w.previousStart } },
            { finishedAt: { $gte: w.previousStart } },
          ],
        },
        { title: 1, tabName: 1, status: 1, requestedAt: 1, startedAt: 1, finishedAt: 1 }
      ).lean<SongRow[]>(),
      Song.countDocuments({ status: "queued" }),
      Song.findOne({ status: "playing" }, { title: 1 }).lean(),
      Tab.countDocuments({ status: { $in: [STATUS.OPEN, STATUS.IN_PROGRESS] } }),
      Order.countDocuments({ status: STATUS.IN_PROGRESS }),
    ])

    return {
      generatedAt: now.toISOString(),
      days,
      money: summarizeMoney(revenueRows, finishedTabs, now, days),
      songs: summarizeSongs(songRows, queued, playing?.title ?? null, now, days),
      operations: {
        openTabs,
        ordersInProgress,
        averageTabMinutes: averageMinutes(finishedTabSpans),
      },
    }
  }
}

export default new DashboardService()
