import "dotenv/config"
import mongoose from "mongoose"
import database from "./config/database.js"
import Employee from "./modules/employees/employees.model.js"
import Order from "./modules/orders/orders.model.js"
import Product from "./modules/products/products.model.js"
import Tab from "./modules/tabs/tabs.model.js"
import { toMinor } from "./shared/money.js"
import { STATUS } from "./shared/status.js"

async function seed(): Promise<void> {
  await database.connect()

  await Promise.all([
    Order.deleteMany({}),
    Tab.deleteMany({}),
    Product.deleteMany({}),
    Employee.deleteMany({}),
  ])

  const employees = await Employee.create([
    {
      name: "Joao Pires",
      email: "joaopires@emaildash.com",
      role: "admin",
      avatar: "J",
    },
    {
      name: "Mariana Cardoso",
      email: "mariana@emaildash.com",
      role: "garcom",
      avatar: "M",
    },
    {
      name: "Mateus Silva",
      email: "mateus@emaildash.com",
      role: "garcom",
      avatar: "M",
    },
    {
      name: "Ana Julia",
      email: "ana@emaildash.com",
      role: "cozinha",
      avatar: "A",
    },
  ])

  const joao = employees[0]!
  const mariana = employees[1]!
  const mateus = employees[2]!
  const ana = employees[3]!

  const products = await Product.create([
    { name: "X-Bacon", price: toMinor(24.9), stock: 12 },
    { name: "X-Salada", price: toMinor(21.9), stock: 8 },
    { name: "Refrigerante", price: toMinor(7.5), stock: 32 },
    { name: "Batata Frita", price: toMinor(18.0), stock: 15 },
  ])

  const xBacon = products[0]!
  const xSalada = products[1]!
  const batata = products[3]!

  const mesa01 = await Tab.create({
    tableName: "Mesa 01",
    status: STATUS.IN_PROGRESS,
    members: [mariana, mateus, ana].map((e) => ({
      employee: e._id,
      name: e.name,
      avatar: e.avatar,
    })),
    openedAt: new Date("2026-04-24T20:24:00-03:00"),
  })

  await Tab.create({
    tableName: "Mesa 02",
    status: STATUS.OPEN,
    members: [joao, ana].map((e) => ({
      employee: e._id,
      name: e.name,
      avatar: e.avatar,
    })),
    openedAt: new Date("2026-04-24T20:40:00-03:00"),
  })

  const mesa03 = await Tab.create({
    tableName: "Mesa 03",
    status: STATUS.IN_PROGRESS,
    members: [mateus, mariana].map((e) => ({
      employee: e._id,
      name: e.name,
      avatar: e.avatar,
    })),
    openedAt: new Date("2026-04-24T21:10:00-03:00"),
  })

  const order1 = await Order.create({
    tab: mesa01._id,
    product: xBacon._id,
    productName: xBacon.name,
    unitPrice: xBacon.price,
    employee: mariana._id,
    employeeName: mariana.name,
    employeeAvatar: mariana.avatar,
    quantity: 1,
    status: STATUS.DELIVERED,
    orderedAt: new Date("2026-04-24T21:30:00-03:00"),
    deliveredAt: new Date("2026-04-24T21:47:00-03:00"),
  })

  const order2 = await Order.create({
    tab: mesa01._id,
    product: xSalada._id,
    productName: xSalada.name,
    unitPrice: xSalada.price,
    employee: mateus._id,
    employeeName: mateus.name,
    employeeAvatar: mateus.avatar,
    quantity: 1,
    status: STATUS.IN_PROGRESS,
    orderedAt: new Date("2026-04-24T22:59:00-03:00"),
    deliveredAt: null,
  })

  const order3 = await Order.create({
    tab: mesa03._id,
    product: batata._id,
    productName: batata.name,
    unitPrice: batata.price,
    employee: ana._id,
    employeeName: ana.name,
    employeeAvatar: ana.avatar,
    quantity: 2,
    status: STATUS.IN_PROGRESS,
    orderedAt: new Date("2026-04-24T22:20:00-03:00"),
    deliveredAt: null,
  })

  mesa01.orders = [order1._id, order2._id]
  mesa03.orders = [order3._id]
  await mesa01.save()
  await mesa03.save()

  xBacon.stock -= 1
  xSalada.stock -= 1
  batata.stock -= 2
  await Promise.all([xBacon.save(), xSalada.save(), batata.save()])

  console.log("Seed concluido com sucesso.")
  await mongoose.disconnect()
}

seed().catch(async (error) => {
  console.error("Erro ao executar o seed:", error)
  await mongoose.disconnect()
  process.exit(1)
})
