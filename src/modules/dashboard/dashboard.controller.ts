import type { Request, Response } from "express"
import { AppError } from "../../shared/app-error.js"
import dashboardService from "./dashboard.service.js"
import { dashboardQuerySchema } from "./dashboard.types.js"

class DashboardController {
  public async get(request: Request, response: Response): Promise<Response> {
    // Express 5: request.query e somente leitura, entao valida aqui.
    const query = dashboardQuerySchema.safeParse(request.query)
    if (!query.success) {
      throw new AppError(query.error.issues.map((i) => i.message).join("; "), 400)
    }
    const dashboard = await dashboardService.get(query.data.days)
    return response.status(200).json(dashboard)
  }
}

export default new DashboardController()
