import { Router } from "express";
import productsController from "./orders.controller.js";

const productRoutes = Router();

productRoutes.post("/", productsController.create);
productRoutes.get("/", productsController.getProducts);
productRoutes.get("/:id", productsController.getProductById);
productRoutes.patch("/:id", productsController.update);
productRoutes.delete("/:id", productsController.delete);

export default productRoutes;