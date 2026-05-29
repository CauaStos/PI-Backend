import { Router } from "express";
import { asyncHandler } from "../../shared/async-handler.js";
import productsController from "./products.controller.js";

const productRoutes = Router();

productRoutes.post("/", asyncHandler(productsController.create));
productRoutes.get("/", asyncHandler(productsController.getProducts));
productRoutes.get("/:id", asyncHandler(productsController.getProductById));
productRoutes.patch("/:id", asyncHandler(productsController.update));
productRoutes.delete("/:id", asyncHandler(productsController.delete));

export default productRoutes;
