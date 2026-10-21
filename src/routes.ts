import { Router } from "express"
import {
  requireAuth,
  requireRoles,
} from "./modules/auth/auth.middleware.js"
import employeeRoutes from "./modules/employees/employees.routes.js"
import orderRoutes from "./modules/orders/orders.routes.js"
import productRoutes from "./modules/products/products.routes.js"
import songRoutes from "./modules/songs/songs.routes.js"
import tabRoutes from "./modules/tabs/tabs.routes.js"
import { Role } from "./shared/enums/role.js"

const routes = Router()

routes.use(requireAuth)

routes.use("/employees", employeeRoutes)
routes.use(requireRoles(Role.ADMIN, Role.GERENTE, Role.OPERADOR))
routes.use("/products", productRoutes)
routes.use("/orders", orderRoutes)
routes.use("/tabs", tabRoutes)
routes.use("/songs", songRoutes)

export default routes
