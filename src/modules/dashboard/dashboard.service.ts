import mongoose from "mongoose"
import Employee from "../employees/employees.model.js"
import Order from "../orders/orders.model.js"
import Product from "../products/products.model.js"
import {
  PRODUCT_CATEGORIES,
  type ProductCategory,
} from "../products/products.types.js"
import Song from "../songs/songs.model.js"
import Tab from "../tabs/tabs.model.js"
import { STATUS } from "../../shared/status.js"
import {
  BUSINESS_UTC_OFFSET,
  currentMonthPeriod,
  fillDailySeries,
  lastDaysWindow,
} from "./dashboard.period.js"
import type { Dashboard } from "./dashboard.types.js"

type DayRow = { _id: string; count: number }
type CategoryRow = { _id: ProductCategory; count: number }

/** Agrupa documentos por dia local a partir do campo de data informado. */
function groupByLocalDay(field: string) {
  return {
    $group: {
      _id: {
        $dateToString: {
          format: "%Y-%m-%d",
          date: `$${field}`,
          timezone: BUSINESS_UTC_OFFSET,
        },
      },
      count: { $sum: 1 },
    },
  }
}

class DashboardService {
  /**
   * Usuarios ativos = contas com ao menos uma sessao do Better Auth ainda
   * valida. A colecao `session` e do Better Auth (mesmo banco do Mongoose).
   */
  private async countActiveUsers(now: Date): Promise<number> {
    const db = mongoose.connection.db
    if (!db) return 0
    const userIds = await db
      .collection("session")
      .distinct("userId", { expiresAt: { $gt: now } })
    return userIds.length
  }

  private async countByCategory(): Promise<Dashboard["byCategory"]> {
    const [productRows, soldRows] = await Promise.all([
      Product.aggregate<CategoryRow>([
        {
          $group: {
            _id: { $ifNull: ["$category", "outros"] },
            count: { $sum: 1 },
          },
        },
      ]),
      Order.aggregate<CategoryRow>([
        { $match: { status: { $ne: STATUS.CANCELLED } } },
        {
          $lookup: {
            from: Product.collection.name,
            localField: "product",
            foreignField: "_id",
            as: "productDoc",
          },
        },
        {
          $group: {
            _id: {
              $ifNull: [{ $first: "$productDoc.category" }, "outros"],
            },
            count: { $sum: "$quantity" },
          },
        },
      ]),
    ])

    const products = new Map(productRows.map((row) => [row._id, row.count]))
    const sold = new Map(soldRows.map((row) => [row._id, row.count]))
    return PRODUCT_CATEGORIES.map((category) => ({
      category,
      products: products.get(category) ?? 0,
      itemsSold: sold.get(category) ?? 0,
    }))
  }

  public async get(now = new Date()): Promise<Dashboard> {
    const month = currentMonthPeriod(now)
    const week = lastDaysWindow(now, 7)

    const [
      activeUsers,
      totalEmployees,
      signupsThisMonth,
      signupsPreviousMonth,
      signupRows,
      pendingOrders,
      pendingTabs,
      pendingSongs,
      byCategory,
      orderRows,
    ] = await Promise.all([
      this.countActiveUsers(now),
      Employee.countDocuments(),
      Employee.countDocuments({ createdAt: { $gte: month.start } }),
      Employee.countDocuments({
        createdAt: { $gte: month.previousStart, $lt: month.start },
      }),
      Employee.aggregate<DayRow>([
        { $match: { createdAt: { $gte: month.start } } },
        groupByLocalDay("createdAt"),
      ]),
      Order.countDocuments({ status: STATUS.IN_PROGRESS }),
      Tab.countDocuments({ status: { $in: [STATUS.OPEN, STATUS.IN_PROGRESS] } }),
      Song.countDocuments({ status: "queued" }),
      this.countByCategory(),
      Order.aggregate<DayRow>([
        { $match: { orderedAt: { $gte: week.start } } },
        groupByLocalDay("orderedAt"),
      ]),
    ])

    return {
      generatedAt: now.toISOString(),
      activeUsers: { count: activeUsers, total: totalEmployees },
      monthlySignups: {
        month: month.month,
        count: signupsThisMonth,
        previousMonth: signupsPreviousMonth,
        daily: fillDailySeries(month.daysSoFar, signupRows),
      },
      pendingRecords: {
        total: pendingOrders + pendingTabs + pendingSongs,
        orders: pendingOrders,
        tabs: pendingTabs,
        songs: pendingSongs,
      },
      byCategory,
      ordersLast7Days: fillDailySeries(week.days, orderRows),
    }
  }
}

export default new DashboardService()
