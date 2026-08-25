import cors from "cors";
import express from "express";
import type { Express } from "express";
import { errorMiddleware } from "./middlewares/error.middleware.js";
import routes from "./routes.js";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./docs/swagger.js";

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
        this.server.use(cors());
        this.server.use(express.json());
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
