import { Router } from "express";
import orderController from "./orders.controller.js";

const orderRoutes = Router();

orderRoutes.post("/", orderController.create);
orderRoutes.get("/", orderController.getOrders);
orderRoutes.get("/:id", orderController.getOrderById);
orderRoutes.patch("/:id", orderController.update);
orderRoutes.delete("/:id", orderController.delete);

export default orderRoutes;