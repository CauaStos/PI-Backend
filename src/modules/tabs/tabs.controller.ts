import type { Request, Response } from "express"
import { AppError } from "../../shared/app-error.js"
import tabService from "./tabs.service.js"

class TabController {
  public async create(request: Request, response: Response): Promise<Response> {
    const { tableName, memberIds } = request.body
    const tab = await tabService.create({ tableName, memberIds })
    return response.status(201).json(tab)
  }

  public async getTabs(
    _request: Request,
    response: Response
  ): Promise<Response> {
    const tabs = await tabService.get()
    return response.status(200).json(tabs)
  }

  public async getTabById(
    request: Request,
    response: Response
  ): Promise<Response> {
    const { id } = request.params
    const tab = await tabService.getById(String(id))
    if (!tab) throw new AppError("Comanda nao encontrada.", 404)
    return response.status(200).json(tab)
  }

  public async update(request: Request, response: Response): Promise<Response> {
    const { id } = request.params
    const { tableName, status } = request.body
    const tab = await tabService.update(String(id), { tableName, status })
    return response.status(200).json(tab)
  }

  public async delete(request: Request, response: Response): Promise<Response> {
    const { id } = request.params
    await tabService.delete(String(id))
    return response.status(204).send()
  }
}

export default new TabController()
