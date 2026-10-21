import type express from "express"
import { AppError } from "../../shared/app-error.js"
import employeeService from "./employees.service.js"
import { fromNodeHeaders } from "better-auth/node"
import { emitBoardChanged } from "../../realtime/bus.js"

function getEmployeeId(request: express.Request): string {
  const id = request.params["id"]
  if (id === undefined) return request.auth!.employee.id
  if (typeof id !== "string") {
    throw new AppError("Identificador invalido.", 400)
  }
  return id
}

class EmployeeController {
  public async create(
    request: express.Request,
    response: express.Response
  ): Promise<express.Response> {
    const { name, email, role, avatar, password } = request.body
    const employee = await employeeService.create({
      name,
      email,
      role,
      avatar,
      password,
      headers: fromNodeHeaders(request.headers),
    })
    emitBoardChanged()
    return response.status(201).json(employee)
  }

  public async getEmployees(
    _request: express.Request,
    response: express.Response
  ): Promise<express.Response> {
    const employees = await employeeService.get()
    return response.status(200).json(employees)
  }

  public async getEmployeeById(
    request: express.Request,
    response: express.Response
  ): Promise<express.Response> {
    const employee = await employeeService.getById(getEmployeeId(request))
    if (!employee) {
      throw new AppError("Funcionario nao encontrado.", 404)
    }
    return response.status(200).json(employee)
  }

  public async update(
    request: express.Request,
    response: express.Response
  ): Promise<express.Response> {
    const id = getEmployeeId(request)
    const { name, email, role, avatar } = request.body
    const employee = await employeeService.update(String(id), {
      name,
      email,
      role,
      avatar,
      headers: fromNodeHeaders(request.headers),
      actorUserId: request.auth!.userId,
      actorRole: request.auth!.role,
    })
    emitBoardChanged()
    return response.status(200).json(employee)
  }

  public async delete(
    request: express.Request,
    response: express.Response
  ): Promise<express.Response> {
    await employeeService.delete(getEmployeeId(request), {
      headers: fromNodeHeaders(request.headers),
      actorUserId: request.auth!.userId,
    })
    emitBoardChanged()
    return response.status(204).send()
  }
}

export default new EmployeeController()
