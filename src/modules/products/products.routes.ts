import { Router } from "express";
import productsController from "./products.controller.js";

const productRoutes = Router();

productRoutes.post("/", productsController.create);

export default productRoutes;