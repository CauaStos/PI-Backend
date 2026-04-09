import "dotenv/config";
import app from "./app.js";

const PORT = process.env.PORT || 3000;

async function startServer(): Promise<void>{
    app.listen(PORT, () => {
        console.log(`Servidor rodando, porta: ${PORT}`);
    })
}

startServer();