import type { Request, Response } from "express";
import { AppError } from "../../shared/app-error.js";
import orderService from "./orders.service.js";

class OrderController {
    public async create(request: Request, response: Response): Promise<Response> {
        const { tab, product, employee, quantity } = request.body;
        const order = await orderService.create({ tab, product, employee, quantity });
        return response.status(201).json(order);
    }

    public async getOrders(_request: Request, response: Response): Promise<Response> {
        const orders = await orderService.get();
        return response.status(200).json(orders);
    }

    public async getOrderById(request: Request, response: Response): Promise<Response> {
        const { id } = request.params;
        const order = await orderService.getById(String(id));
        if (!order) throw new AppError("Pedido nao encontrado.", 404);
        return response.status(200).json(order);
    }

    public async update(request: Request, response: Response): Promise<Response> {
        const { id } = request.params;
        const { product, employee, quantity, status } = request.body;
        const order = await orderService.update(String(id), {
            product,
            employee,
            quantity,
            status,
        });
        return response.status(200).json(order);
    }

    public async delete(request: Request, response: Response): Promise<Response> {
        const { id } = request.params;
        await orderService.delete(String(id));
        return response.status(204).send();
    }
}

export default new OrderController();
