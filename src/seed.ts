import "dotenv/config"
import { createLocalAccountIssuer } from "better-auth"
import mongoose, { Types } from "mongoose"
import { auth } from "./config/auth.js"
import database from "./config/database.js"
import Employee from "./modules/employees/employees.model.js"
import Order from "./modules/orders/orders.model.js"
import Product from "./modules/products/products.model.js"
import Song from "./modules/songs/songs.model.js"
import Tab from "./modules/tabs/tabs.model.js"
import { Role } from "./shared/enums/role.js"
import { toMinor } from "./shared/money.js"
import { STATUS } from "./shared/status.js"

/**
 * Seed de demonstracao. APAGA tudo (inclusive contas de login) e recria:
 * equipe com login, cardapio, 30 dias de historico relativo a hoje, comandas
 * abertas agora e fila de musicas. Todos os logins usam SEED_PASSWORD.
 * Deterministico: rodar de novo no mesmo dia gera os mesmos numeros.
 */

const PASSWORD = process.env.SEED_PASSWORD ?? "onstage2026"
const HISTORY_DAYS = 30

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR
const OFFSET = 3 * HOUR // UTC-3, ver dashboard.period.ts

if (PASSWORD.length < 8) throw new Error("SEED_PASSWORD precisa ter 8+ caracteres")

/** PRNG pequeno e deterministico (mulberry32). */
function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const TEAM = [
  { name: "Administrador", email: "admin@onstage.com", role: Role.ADMIN },
  { name: "Carla Mendes", email: "gerente@onstage.com", role: Role.GERENTE },
  { name: "Mariana Cardoso", email: "mariana@onstage.com", role: Role.OPERADOR },
  { name: "Ana Julia", email: "ana@onstage.com", role: Role.OPERADOR },
  { name: "Cauã", email: "caua@onstage.com", role: Role.OPERADOR },
]

/** weight = chance relativa de aparecer num pedido. */
const MENU = [
  { name: "X-Bacon", price: 29.9, category: "comida", stock: 60, weight: 6 },
  { name: "X-Salada", price: 24.9, category: "comida", stock: 60, weight: 5 },
  { name: "Hambúrguer Artesanal", price: 36.9, category: "comida", stock: 40, weight: 4 },
  { name: "Frango Grelhado", price: 32, category: "comida", stock: 30, weight: 2 },
  { name: "Batata Frita", price: 22, category: "porcao", stock: 80, weight: 7 },
  { name: "Isca de Frango", price: 36, category: "porcao", stock: 40, weight: 4 },
  { name: "Calabresa Acebolada", price: 34, category: "porcao", stock: 35, weight: 3 },
  { name: "Chopp 300ml", price: 12.9, category: "bebida", stock: 200, weight: 10 },
  { name: "Cerveja Long Neck", price: 11, category: "bebida", stock: 120, weight: 7 },
  { name: "Caipirinha", price: 18, category: "bebida", stock: 80, weight: 5 },
  { name: "Refrigerante", price: 7.5, category: "bebida", stock: 100, weight: 5 },
  { name: "Água", price: 5, category: "bebida", stock: 100, weight: 3 },
  { name: "Petit Gâteau", price: 19.9, category: "sobremesa", stock: 4, weight: 2 },
  { name: "Pudim", price: 12, category: "sobremesa", stock: 20, weight: 2 },
] as const

const SONGS = [
  "Evidências", "Tempo Perdido", "Garota de Ipanema", "Pais e Filhos",
  "Exagerado", "Flor de Lis", "Ai Se Eu Te Pego", "Como Nossos Pais",
  "Velha Infância", "Sozinho", "Anunciação", "Deixa a Vida Me Levar",
  "Trem-Bala", "Fico Assim Sem Você", "Ainda Bem", "Lanterna dos Afogados",
  "Eduardo e Mônica", "País Tropical", "Que País É Este", "Malandragem",
]
/** Algumas musicas sao bem mais pedidas que outras. */
const SONG_WEIGHTS = SONGS.map((_, i) => (i < 4 ? 6 : i < 10 ? 3 : 1))

/** Mais movimento no fim de semana (indice = dia da semana, 0 = domingo). */
const TABS_PER_NIGHT = [5, 2, 3, 3, 4, 7, 8]

function localMidnight(now: Date, daysAgo: number): Date {
  const local = new Date(now.getTime() - OFFSET)
  const midnight = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate())
  return new Date(midnight + OFFSET - daysAgo * DAY)
}

function localWeekday(date: Date): number {
  return new Date(date.getTime() - OFFSET).getUTCDay()
}

async function wipe(): Promise<void> {
  const db = mongoose.connection.db
  if (!db) throw new Error("Sem conexao com o banco")
  await Promise.all([
    Order.deleteMany({}),
    Tab.deleteMany({}),
    Song.deleteMany({}),
    Product.deleteMany({}),
    Employee.deleteMany({}),
    // Contas do Better Auth: sem isso sobram logins sem funcionario.
    ...["user", "account", "session", "verification"].map((name) =>
      db.collection(name).deleteMany({})
    ),
  ])
}

async function createTeam() {
  const context = await auth.$context
  const hash = await context.password.hash(PASSWORD)
  const employees = []
  for (const member of TEAM) {
    const user = await context.internalAdapter.createUser(
      {
        email: member.email,
        emailVerified: true,
        name: member.name,
        role: member.role === Role.ADMIN ? "admin" : "user", // plugin admin do Better Auth
        employeeRole: member.role,
      },
      { method: "admin" }
    )
    await context.internalAdapter.linkAccount({
      accountId: user.id,
      issuer: createLocalAccountIssuer("credential"),
      password: hash,
      providerId: "credential",
      userId: user.id,
    })
    employees.push(
      await Employee.create({
        authUserId: user.id,
        name: member.name,
        email: member.email,
        role: member.role,
        avatar: member.name.charAt(0).toUpperCase(),
      })
    )
  }
  return employees
}

async function seed(): Promise<void> {
  await database.connect()
  await wipe()

  const now = new Date()
  const random = rng(Number(now.toISOString().slice(0, 10).replaceAll("-", "")))
  const between = (min: number, max: number) => min + random() * (max - min)
  const int = (min: number, max: number) => Math.floor(between(min, max + 1))
  const chance = (p: number) => random() < p
  const pick = <T>(items: readonly T[], weights?: readonly number[]): T => {
    if (!weights) return items[Math.floor(random() * items.length)]!
    let roll = random() * weights.reduce((s, w) => s + w, 0)
    for (let i = 0; i < items.length; i++) {
      roll -= weights[i]!
      if (roll <= 0) return items[i]!
    }
    return items.at(-1)!
  }

  const employees = await createTeam()
  const operators = employees.filter((e) => e.role === Role.OPERADOR)

  const products = await Product.create(
    MENU.map(({ weight: _w, price, ...p }) => ({ ...p, price: toMinor(price) }))
  )
  const productWeights = MENU.map((p) => p.weight)

  const tabs: Array<Record<string, unknown>> = []
  const orders: Array<Record<string, unknown>> = []
  const songs: Array<Record<string, unknown>> = []

  /** Cria uma comanda com pedidos e musicas entre `openedAt` e `until`. */
  function addTab(opts: {
    openedAt: Date
    until: Date
    status: "open" | "in_progress" | "finished" | "cancelled"
    tableName: string
    lines: number
  }) {
    const tabId = new Types.ObjectId()
    const members = Array.from(new Set([pick(operators), pick(operators)]))
    const closed = opts.status === STATUS.FINISHED || opts.status === STATUS.CANCELLED
    const span = opts.until.getTime() - opts.openedAt.getTime()
    const orderIds: Types.ObjectId[] = []

    for (let i = 0; i < opts.lines; i++) {
      const product = pick(products, productWeights)
      const orderedAt = new Date(opts.openedAt.getTime() + random() * Math.max(span - 15 * MINUTE, MINUTE))
      const deliveredAt = new Date(
        Math.min(orderedAt.getTime() + between(8, 25) * MINUTE, opts.until.getTime())
      )
      const delivered = closed || deliveredAt.getTime() < now.getTime() - 2 * MINUTE
      const status =
        opts.status === STATUS.CANCELLED || (closed && chance(0.04))
          ? STATUS.CANCELLED
          : delivered && (closed || chance(0.6))
            ? STATUS.DELIVERED
            : STATUS.IN_PROGRESS
      const employee = pick(members)
      const id = new Types.ObjectId()
      orderIds.push(id)
      orders.push({
        _id: id,
        tab: tabId,
        product: product._id,
        productName: product.name,
        unitPrice: product.price,
        employee: employee._id,
        employeeName: employee.name,
        employeeAvatar: employee.avatar,
        quantity: product.category === "bebida" ? int(1, 4) : int(1, 2),
        status,
        orderedAt,
        deliveredAt: status === STATUS.DELIVERED ? deliveredAt : null,
      })
    }

    // 0 a 3 musicas por comanda, pedidas enquanto a mesa estava aberta.
    if (closed) {
      for (let i = int(0, 3); i > 0; i--) {
        const requestedAt = new Date(opts.openedAt.getTime() + random() * Math.max(span - 20 * MINUTE, MINUTE))
        const cancelled = chance(0.08)
        const startedAt = new Date(requestedAt.getTime() + between(3, 25) * MINUTE)
        songs.push({
          title: pick(SONGS, SONG_WEIGHTS),
          tab: tabId,
          tabName: opts.tableName,
          status: cancelled ? "cancelled" : "finished",
          position: null,
          requestedAt,
          startedAt: cancelled ? null : startedAt,
          finishedAt: cancelled ? null : new Date(startedAt.getTime() + between(3, 5) * MINUTE),
          cancelledAt: cancelled ? new Date(requestedAt.getTime() + 5 * MINUTE) : null,
        })
      }
    }

    tabs.push({
      _id: tabId,
      tableName: opts.tableName,
      status: opts.lines === 0 && !closed ? STATUS.OPEN : opts.status,
      members: members.map((e) => ({ employee: e._id, name: e.name, avatar: e.avatar })),
      orders: orderIds,
      openedAt: opts.openedAt,
      closedAt: closed ? opts.until : null,
    })
    return tabId
  }

  const table = () => `Mesa ${String(int(1, 25)).padStart(2, "0")}`

  // Historico: almoco (11h30-14h30) e noite (18h-22h30) de cada dia.
  for (let daysAgo = HISTORY_DAYS - 1; daysAgo >= 0; daysAgo--) {
    const midnight = localMidnight(now, daysAgo)
    const night = TABS_PER_NIGHT[localWeekday(midnight)]!
    const slots = [
      ...Array.from({ length: int(0, 2) }, () => between(11.5, 14.5)),
      ...Array.from({ length: Math.max(1, night + int(-1, 1)) }, () => between(18, 22.5)),
    ]
    for (const hour of slots) {
      const openedAt = new Date(midnight.getTime() + hour * HOUR)
      const closedAt = new Date(openedAt.getTime() + between(35, 150) * MINUTE)
      if (closedAt.getTime() > now.getTime() - 10 * MINUTE) continue // ainda nao fechou
      addTab({
        openedAt,
        until: closedAt,
        status: chance(0.08) ? STATUS.CANCELLED : STATUS.FINISHED,
        tableName: table(),
        lines: int(2, 6),
      })
    }
  }

  // Agora: 4 mesas abertas (uma ainda sem pedidos).
  const openNow = ["Mesa 04", "Mesa 09", "Mesa 12", "Mesa 17"].map((tableName, i) =>
    addTab({
      openedAt: new Date(now.getTime() - between(20, 100) * MINUTE),
      until: now,
      status: STATUS.IN_PROGRESS,
      tableName,
      lines: i === 3 ? 0 : int(2, 5),
    })
  )

  // Fila de musicas agora: uma tocando e tres aguardando.
  const live = [
    { status: "playing", startedAt: new Date(now.getTime() - 2 * MINUTE), position: 0 },
    { status: "queued", startedAt: null, position: 1 },
    { status: "queued", startedAt: null, position: 2 },
    { status: "queued", startedAt: null, position: 3 },
  ] as const
  live.forEach((entry, i) => {
    const tabIndex = i % 3
    songs.push({
      title: pick(SONGS, SONG_WEIGHTS),
      tab: openNow[tabIndex],
      tabName: ["Mesa 04", "Mesa 09", "Mesa 12"][tabIndex],
      status: entry.status,
      position: entry.position,
      requestedAt: new Date(now.getTime() - (16 - i * 3) * MINUTE),
      startedAt: entry.startedAt,
      finishedAt: null,
      cancelledAt: null,
    })
  })

  await Tab.insertMany(tabs)
  await Order.insertMany(orders)
  await Song.insertMany(songs)

  // Estoque: desconta o que as mesas abertas consumiram (historico ja foi reposto).
  for (const order of orders) {
    if (!openNow.some((id) => id.equals(order["tab"] as Types.ObjectId))) continue
    if (order["status"] === STATUS.CANCELLED) continue
    await Product.updateOne(
      { _id: order["product"] },
      { $inc: { stock: -(order["quantity"] as number) } }
    )
  }

  await Product.updateMany({ stock: { $lt: 0 } }, { $set: { stock: 0 } })

  console.log(
    `Seed concluido: ${employees.length} funcionarios, ${products.length} produtos, ` +
      `${tabs.length} comandas, ${orders.length} pedidos, ${songs.length} musicas.`
  )
  console.log(`Logins (senha ${process.env.SEED_PASSWORD ? "SEED_PASSWORD" : PASSWORD}):`)
  for (const member of TEAM) console.log(`  ${member.role.padEnd(8)} ${member.email}`)
  await mongoose.disconnect()
  // O Better Auth abre o proprio MongoClient; sem exit o processo fica pendurado.
  process.exit(0)
}

seed().catch(async (error) => {
  console.error("Erro ao executar o seed:", error)
  await mongoose.disconnect()
  process.exit(1)
})
