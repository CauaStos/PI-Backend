import { Router } from "express";

const routes = Router();

routes.get("/teste", (request, response) => {
    return response.status(200).json({
        message: "Endpoint de teste"
    })
})

export default routes;