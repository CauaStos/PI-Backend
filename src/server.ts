import "dotenv/config"
import { createServer } from "http"
import app from "./app.js"
import database from "./config/database.js"
import { initRealtime } from "./realtime/io.js"

const PORT = process.env.PORT || 3000

async function startServer(): Promise<void> {
  await database.connect()

  const httpServer = createServer(app)
  initRealtime(httpServer)

  httpServer.listen(PORT, () => {
    console.log(`Servidor rodando, porta: ${PORT}`)
  })
}

startServer()
