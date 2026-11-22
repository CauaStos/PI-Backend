import type { Request, Response } from "express"
import dashboardService from "./dashboard.service.js"

class DashboardController {
  public async get(_request: Request, response: Response): Promise<Response> {
    const dashboard = await dashboardService.get()
    return response.status(200).json(dashboard)
  }
}

export default new DashboardController()
