import type { Request, Response } from "express";
import orderService from "./orders.service.js";

class OrderController {

    public async create(request: Request, response: Response): Promise<Response> {
        const { products, total, status } = request.body;

        const order = await orderService.create({
            products,
            total,
            status
        });

        return response.status(201).json(order);
    }

    public async getOrders(request: Request, response: Response): Promise<Response> {
        const orders = await orderService.get();

        return response.status(200).json(orders);
    }

    public async getOrderById(request: Request, response: Response): Promise<Response> {
        const { id } = request.params;
        if (!id || Array.isArray(id)) {
            return response.status(400).json({
                message: "Invalid order id"
            });
        }
        
        const order = await orderService.getById(id);

        if (!order) {
            return response.status(404).json({
                message: "Order not found"
            });
        }

        return response.status(200).json(order);
    }

    public async update(request: Request, response: Response): Promise<Response> {
        const { id } = request.params;
        const { products, status } = request.body;

        if (!id || Array.isArray(id)) {
            return response.status(400).json({
                message: "Invalid order id"
            });
        }

        const originalOrder = await orderService.getById(id);

        if (!originalOrder) {
            return response.status(404).json({
                message: "Order not found"
            });
        }

        const updatedOrder = await orderService.update(id, {
            products,
            status
        });

        return response.status(200).json(updatedOrder);
    }

    public async delete(request: Request, response: Response): Promise<Response> {
        const { id } = request.params;

        if (!id || Array.isArray(id)) {
            return response.status(400).json({
            message: "Invalid order id"
        });
        }

        const order = await orderService.getById(id);

        if (!order) {
            return response.status(404).json({
                message: "Order not found"
            });
        }

        await orderService.delete(id);

        return response.status(204).send();
    }

}

export default new OrderController();