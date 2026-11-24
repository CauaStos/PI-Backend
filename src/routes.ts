import { Router } from "express"
import { requireAuth } from "./modules/auth/auth.middleware.js"
import dashboardRoutes from "./modules/dashboard/dashboard.routes.js"
import employeeRoutes from "./modules/employees/employees.routes.js"
import orderRoutes from "./modules/orders/orders.routes.js"
import productRoutes from "./modules/products/products.routes.js"
import songRoutes from "./modules/songs/songs.routes.js"
import tabRoutes from "./modules/tabs/tabs.routes.js"

const routes = Router()

routes.use(requireAuth)

routes.use("/employees", employeeRoutes)
routes.use("/products", productRoutes)
routes.use("/orders", orderRoutes)
routes.use("/tabs", tabRoutes)
routes.use("/songs", songRoutes)
routes.use("/dashboard", dashboardRoutes)

export default routes
