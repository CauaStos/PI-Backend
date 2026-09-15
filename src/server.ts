import "dotenv/config"
import app from "./app.js"
import database from "./config/database.js"

const PORT = process.env.PORT || 3000

async function startServer(): Promise<void> {
  await database.connect()

  app.listen(PORT, () => {
    console.log(`Servidor rodando, porta: ${PORT}`)
  })
}

startServer()
