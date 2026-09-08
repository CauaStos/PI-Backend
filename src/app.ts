import cors from "cors";
import express from "express";
import type { Express } from "express";
import { errorMiddleware } from "./middlewares/error.middleware.js";
import routes from "./routes.js";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./docs/swagger.js";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./config/auth.js";

class App {
    public server: Express;

    constructor() {
        this.server = express();
        this.middleware();
        this.routes();
        this.errorHandling();
        this.server.use(
            "/api-docs",
            swaggerUi.serve,
            swaggerUi.setup(swaggerSpec)
        );
    }

    private middleware(): void {
        this.server.use(
            cors({
                origin: (process.env.FRONTEND_ORIGIN ?? "http://localhost:5173").split(","),
                credentials: true,
                methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
            })
        );
        this.server.all("/api/auth/*splat", toNodeHandler(auth));
        this.server.use(express.json({ limit: "8mb" }));
        this.server.use(express.urlencoded({ extended: true }));
    }

    private routes(): void {
        this.server.use("/api/v1", routes);
    }

    private errorHandling(): void {
        this.server.use(errorMiddleware);
    }
}

export default new App().server;
