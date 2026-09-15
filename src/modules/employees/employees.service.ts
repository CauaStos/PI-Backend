import { AppError } from "../../shared/app-error.js"
import Employee from "./employees.model.js"
import { auth } from "../../config/auth.js"
import type {
  ICreateEmployeeDTO,
  IUpdateEmployeeDTO,
} from "./employees.types.js"

class EmployeeService {
  public async create(data: ICreateEmployeeDTO) {
    const name = data.name?.trim()
    if (!name) {
      throw new AppError("Nome do funcionario e obrigatorio.")
    }

    if (!data.password || data.password.length < 8) {
      throw new AppError("A senha deve ter pelo menos 8 caracteres.")
    }
    const account = await auth.api.createUser({
      body: {
        email: data.email,
        password: data.password,
        name,
        role: data.role === "admin" ? "admin" : "user",
        data: {
          employeeRole: data.role ?? "garcom",
          emailVerified: true,
        },
      },
      headers: data.headers,
    })
    if (!account?.user?.id)
      throw new AppError("Nao foi possivel criar a conta.", 500)
    try {
      return await Employee.create({
        authUserId: account.user.id,
        name,
        email: data.email,
        role: data.role ?? "garcom",
        avatar: data.avatar?.trim() || name.charAt(0).toUpperCase(),
      })
    } catch (error) {
      await auth.api.removeUser({
        body: { userId: account.user.id },
        headers: data.headers,
      })
      throw error
    }
  }

  public async get() {
    return Employee.find().sort({ createdAt: 1 })
  }

  public async getById(id: string) {
    return Employee.findById(id)
  }

  public async update(id: string, data: IUpdateEmployeeDTO) {
    const employee = await Employee.findById(id)
    if (!employee) {
      throw new AppError("Funcionario nao encontrado.", 404)
    }
    if (!employee.authUserId) {
      throw new AppError("Funcionario nao possui conta vinculada.", 409)
    }
    const { headers, actorUserId: _actorUserId, ...employeeData } = data
    await auth.api.adminUpdateUser({
      body: {
        userId: employee.authUserId,
        data: {
          ...(data.name ? { name: data.name } : {}),
          ...(data.email ? { email: data.email } : {}),
          ...(data.role ? { employeeRole: data.role } : {}),
        },
      },
      headers,
    })
    if (data.role) {
      await auth.api.setRole({
        body: {
          userId: employee.authUserId,
          role: data.role === "admin" ? "admin" : "user",
        },
        headers,
      })
    }
    return Employee.findByIdAndUpdate(id, employeeData, {
      new: true,
      runValidators: true,
    })
  }

  public async delete(
    id: string,
    data: Pick<IUpdateEmployeeDTO, "headers" | "actorUserId">
  ) {
    const employee = await Employee.findById(id)
    if (!employee) {
      throw new AppError("Funcionario nao encontrado.", 404)
    }
    if (!employee.authUserId) {
      throw new AppError("Funcionario nao possui conta vinculada.", 409)
    }
    if (employee.authUserId === data.actorUserId) {
      throw new AppError("Voce nao pode remover sua propria conta.", 409)
    }
    if (
      employee.role === "admin" &&
      (await Employee.countDocuments({ role: "admin" })) <= 1
    ) {
      throw new AppError("Nao e possivel remover o ultimo administrador.", 409)
    }
    await auth.api.removeUser({
      body: { userId: employee.authUserId },
      headers: data.headers,
    })
    await employee.deleteOne()
    return employee
  }
}

export default new EmployeeService()
