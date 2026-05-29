import type { Request, Response } from "express";
import { AppError } from "../../shared/app-error.js";
import employeeService from "./employees.service.js";

class EmployeeController {
    public async create(request: Request, response: Response): Promise<Response> {
        const { name, email, role, avatar } = request.body;
        const employee = await employeeService.create({ name, email, role, avatar });
        return response.status(201).json(employee);
    }

    public async getEmployees(_request: Request, response: Response): Promise<Response> {
        const employees = await employeeService.get();
        return response.status(200).json(employees);
    }

    public async getEmployeeById(request: Request, response: Response): Promise<Response> {
        const { id } = request.params;
        const employee = await employeeService.getById(String(id));
        if (!employee) {
            throw new AppError("Funcionario nao encontrado.", 404);
        }
        return response.status(200).json(employee);
    }

    public async update(request: Request, response: Response): Promise<Response> {
        const { id } = request.params;
        const { name, email, role, avatar } = request.body;
        const employee = await employeeService.update(String(id), {
            name,
            email,
            role,
            avatar,
        });
        return response.status(200).json(employee);
    }

    public async delete(request: Request, response: Response): Promise<Response> {
        const { id } = request.params;
        await employeeService.delete(String(id));
        return response.status(204).send();
    }
}

export default new EmployeeController();
