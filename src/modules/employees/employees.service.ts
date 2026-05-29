import { AppError } from "../../shared/app-error.js";
import Employee from "./employees.model.js";
import type {
    ICreateEmployeeDTO,
    IUpdateEmployeeDTO,
} from "./employees.types.js";

class EmployeeService {
    public async create(data: ICreateEmployeeDTO) {
        const name = data.name?.trim();
        if (!name) {
            throw new AppError("Nome do funcionario e obrigatorio.");
        }

        return Employee.create({
            name,
            email: data.email,
            role: data.role ?? "garcom",
            avatar: data.avatar?.trim() || name.charAt(0).toUpperCase(),
        });
    }

    public async get() {
        return Employee.find().sort({ createdAt: 1 });
    }

    public async getById(id: string) {
        return Employee.findById(id);
    }

    public async update(id: string, data: IUpdateEmployeeDTO) {
        const employee = await Employee.findByIdAndUpdate(id, data, {
            new: true,
            runValidators: true,
        });
        if (!employee) {
            throw new AppError("Funcionario nao encontrado.", 404);
        }
        return employee;
    }

    public async delete(id: string) {
        const employee = await Employee.findByIdAndDelete(id);
        if (!employee) {
            throw new AppError("Funcionario nao encontrado.", 404);
        }
        return employee;
    }
}

export default new EmployeeService();
