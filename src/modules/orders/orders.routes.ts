import { Router } from "express";
import { asyncHandler } from "../../shared/async-handler.js";
import orderController from "./orders.controller.js";

const orderRoutes = Router();

orderRoutes.post("/", asyncHandler(orderController.create));
orderRoutes.get("/", asyncHandler(orderController.getOrders));
orderRoutes.get("/:id", asyncHandler(orderController.getOrderById));
orderRoutes.patch("/:id", asyncHandler(orderController.update));
orderRoutes.delete("/:id", asyncHandler(orderController.delete));

export default orderRoutes;
