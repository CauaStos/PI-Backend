import mongoose from "mongoose"

class Database {
  public async connect(): Promise<void> {
    const mongoUri = process.env.MONGO_URI

    if (!mongoUri) {
      throw new Error(
        "MONGO_URI nao foi definida. Crie o arquivo .env a partir de .env.example."
      )
    }

    try {
      await mongoose.connect(mongoUri)
      console.log("Mongo conectado com sucesso")
    } catch (error) {
      console.error("Erro ao conectar ao MongoDB", error)
      process.exit(1)
    }
  }
}

export default new Database()
