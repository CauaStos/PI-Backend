import Order from "../orders/orders.model.js"
import Product from "../products/products.model.js"
import Song from "../songs/songs.model.js"
import Tab from "../tabs/tabs.model.js"
import { STATUS } from "../../shared/status.js"
import { currentMonthPeriod, lastDaysWindow } from "./dashboard.period.js"
import {
  averageMinutes,
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

  public async get(now = new Date()): Promise<Dashboard> {
    const month = currentMonthPeriod(now)
    const last30 = lastDaysWindow(now, 30)
    const last7 = lastDaysWindow(now, 7)
    const revenueSince = new Date(
      Math.min(month.previousStart.getTime(), last30.start.getTime())
    )
    const songsSince = new Date(
      Math.min(month.start.getTime(), last7.start.getTime())
    )

    const [
      revenueRows,
      finishedTabsMonth,
      finishedTabSpans,
      songRows,
      queued,
      playing,
      openTabs,
      ordersInProgress,
    ] = await Promise.all([
      this.revenueRows(revenueSince),
      Tab.countDocuments({
        status: STATUS.FINISHED,
        closedAt: { $gte: month.start },
      }),
      Tab.find(
        { status: STATUS.FINISHED, closedAt: { $gte: month.start } },
        { openedAt: 1, closedAt: 1 }
      ).lean(),
      Song.find(
        {
          $or: [
            { requestedAt: { $gte: songsSince } },
            { finishedAt: { $gte: songsSince } },
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
      money: summarizeMoney(revenueRows, finishedTabsMonth, now),
      songs: summarizeSongs(songRows, queued, playing?.title ?? null, now),
      operations: {
        openTabs,
        ordersInProgress,
        averageTabMinutes: averageMinutes(finishedTabSpans),
      },
    }
  }
}

export default new DashboardService()
