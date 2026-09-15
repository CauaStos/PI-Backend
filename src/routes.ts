import { Router } from "express"
import { requireAuth } from "./modules/auth/auth.middleware.js"
import employeeRoutes from "./modules/employees/employees.routes.js"
import orderRoutes from "./modules/orders/orders.routes.js"
import productRoutes from "./modules/products/products.routes.js"
import songRoutes from "./modules/songs/songs.routes.js"
import tabRoutes from "./modules/tabs/tabs.routes.js"

const routes = Router()

routes.use(requireAuth)

routes.get("/teste", (_request, response) => {
  return response.status(200).json({
    message: "Endpoint de teste",
  })
})

routes.use("/products", productRoutes)
routes.use("/orders", orderRoutes)
routes.use("/tabs", tabRoutes)
routes.use("/employees", employeeRoutes)
routes.use("/songs", songRoutes)

export default routes
