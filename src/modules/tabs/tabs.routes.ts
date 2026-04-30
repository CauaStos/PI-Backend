import { Router } from "express";
import tabController from "./tabs.controller.js";

const tabRoutes = Router();

tabRoutes.post("/", tabController.create);
tabRoutes.get("/", tabController.getTabs);
tabRoutes.get("/:id", tabController.getTabById);
tabRoutes.patch("/:id", tabController.update);
tabRoutes.delete("/:id", tabController.delete);

export default tabRoutes;