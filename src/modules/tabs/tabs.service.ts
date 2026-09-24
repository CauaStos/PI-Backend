import type { HydratedDocument } from "mongoose"
import { AppError } from "../../shared/app-error.js"
import { isTabOpen, STATUS, type TabStatus } from "../../shared/status.js"
import { withTransaction } from "../../shared/with-transaction.js"
import type { ClientSession } from "mongoose"
import Employee from "../employees/employees.model.js"
import Order from "../orders/orders.model.js"
import Product from "../products/products.model.js"
import Tab from "./tabs.model.js"
import type {
  ICreateTabDTO,
  ITab,
  ITabMember,
  IUpdateTabDTO,
} from "./tabs.types.js"

class TabService {
  public async create(data: ICreateTabDTO) {
    const tableName = data.tableName?.trim()
    if (!tableName) throw new AppError("Nome da mesa e obrigatorio.")

    const employees =
      data.memberIds && data.memberIds.length > 0
        ? await Employee.find({ _id: { $in: data.memberIds } })
        : await Employee.find().sort({ createdAt: 1 }).limit(3)

    const members: ITabMember[] = employees.map((e) => ({
      employee: e._id,
      name: e.name,
      avatar: e.avatar,
    }))

    return Tab.create({
      tableName,
      status: STATUS.OPEN,
      members,
      orders: [],
      openedAt: new Date(),
      closedAt: null,
    })
  }

  public async get() {
    return Tab.find().sort({ openedAt: 1 }).populate("orders")
  }

  public async getById(id: string) {
    return Tab.findById(id).populate("orders")
  }

  public async update(id: string, data: IUpdateTabDTO) {
    return withTransaction(async (session) => {
      const tab = await Tab.findById(id).session(session)
      if (!tab) throw new AppError("Comanda nao encontrada.", 404)

      if (data.tableName !== undefined) {
        const tableName = data.tableName.trim()
        if (!tableName) throw new AppError("Nome da mesa e obrigatorio.")
        tab.tableName = tableName
      }

      if (data.status !== undefined && data.status !== tab.status) {
        await this.applyStatusTransition(tab, data.status, session)
      }

      await tab.save({ session })
      return tab.populate("orders")
    })
  }

  public async delete(id: string) {
    return withTransaction(async (session) => {
      const tab = await Tab.findById(id).session(session)
      if (!tab) throw new AppError("Comanda nao encontrada.", 404)

      const orders = await Order.find({ tab: tab._id }).session(session)
      for (const order of orders) {
        if (order.status !== STATUS.CANCELLED) {
          const product = await Product.findById(order.product).session(session)
          if (product) {
            product.stock += order.quantity
            await product.save({ session })
          }
        }
      }

      await (session
        ? Order.deleteMany({ tab: tab._id }, { session })
        : Order.deleteMany({ tab: tab._id }))
      await tab.deleteOne({ session })
      return tab
    })
  }

  private async applyStatusTransition(
    tab: HydratedDocument<ITab>,
    nextStatus: TabStatus,
    session: ClientSession | null
  ): Promise<void> {
    if (nextStatus === STATUS.FINISHED || nextStatus === STATUS.CANCELLED) {
      if (!isTabOpen(tab.status)) {
        throw new AppError("Comanda nao esta aberta para esta operacao.", 409)
      }
    }

    const orders = await Order.find({ tab: tab._id }).session(session)

    if (nextStatus === STATUS.FINISHED) {
      for (const order of orders) {
        if (order.status === STATUS.IN_PROGRESS) {
          order.status = STATUS.DELIVERED
          order.deliveredAt = order.deliveredAt ?? new Date()
          await order.save({ session })
        }
      }
      tab.status = STATUS.FINISHED
      tab.closedAt = new Date()
      return
    }

    if (nextStatus === STATUS.CANCELLED) {
      for (const order of orders) {
        if (order.status !== STATUS.CANCELLED) {
          const product = await Product.findById(order.product).session(session)
          if (product) {
            product.stock += order.quantity
            await product.save({ session })
          }
          order.status = STATUS.CANCELLED
          await order.save({ session })
        }
      }
      tab.status = STATUS.CANCELLED
      tab.closedAt = new Date()
      return
    }

    tab.status = nextStatus
  }
}

export default new TabService()
