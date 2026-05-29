import { Router } from "express";
import { asyncHandler } from "../../shared/async-handler.js";
import employeeController from "./employees.controller.js";

const employeeRoutes = Router();

employeeRoutes.post("/", asyncHandler(employeeController.create));
employeeRoutes.get("/", asyncHandler(employeeController.getEmployees));
employeeRoutes.get("/:id", asyncHandler(employeeController.getEmployeeById));
employeeRoutes.patch("/:id", asyncHandler(employeeController.update));
employeeRoutes.delete("/:id", asyncHandler(employeeController.delete));

export default employeeRoutes;
