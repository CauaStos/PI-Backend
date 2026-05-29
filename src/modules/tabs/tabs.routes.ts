import { Router } from "express";
import { asyncHandler } from "../../shared/async-handler.js";
import tabController from "./tabs.controller.js";

const tabRoutes = Router();

tabRoutes.post("/", asyncHandler(tabController.create));
tabRoutes.get("/", asyncHandler(tabController.getTabs));
tabRoutes.get("/:id", asyncHandler(tabController.getTabById));
tabRoutes.patch("/:id", asyncHandler(tabController.update));
tabRoutes.delete("/:id", asyncHandler(tabController.delete));

export default tabRoutes;
