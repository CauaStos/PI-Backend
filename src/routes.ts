import { Router } from "express";
import productRoutes from "./modules/products/products.routes.js";
import orderRoutes from "./modules/orders/orders.routes.js";
import tabRoutes from "./modules/tabs/tabs.routes.js";

const routes = Router();

routes.get("/teste", (request, response) => {
    return response.status(200).json({
        message: "Endpoint de teste"
    })
})

routes.use("/products", productRoutes);
routes.use("/orders", orderRoutes);
routes.use("/tabs", tabRoutes);


export default routes;