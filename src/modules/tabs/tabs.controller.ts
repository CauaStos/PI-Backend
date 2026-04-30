import type { Request, Response } from "express";
import tabService from "./tabs.service.js";

class TabController {

    public async create(request: Request, response: Response): Promise<Response> {
        const { name, orders, status } = request.body;

        const tab = await tabService.create({
            name,
            orders,
            status
        });

        return response.status(201).json(tab);
    }

    public async getTabs(request: Request, response: Response): Promise<Response> {
        const tabs = await tabService.get();

        return response.status(200).json(tabs);
    }

    public async getTabById(request: Request, response: Response): Promise<Response> {
        const { id } = request.params;

        if (!id || Array.isArray(id)) {
            return response.status(400).json({
                message: "Invalid tab id"
            });
        }

        const tab = await tabService.getById(id);

        if (!tab) {
            return response.status(404).json({
                message: "Tab not found"
            });
        }

        return response.status(200).json(tab);
    }

    public async update(request: Request, response: Response): Promise<Response> {
        const { id } = request.params;
        const { name, orders, status } = request.body;

        if (!id || Array.isArray(id)) {
            return response.status(400).json({
                message: "Invalid tab id"
            });
        }

        const originalTab = await tabService.getById(id);

        if (!originalTab) {
            return response.status(404).json({
                message: "Tab not found"
            });
        }

        const updatedTab = await tabService.update(id, {
            name,
            orders,
            status
        });

        return response.status(200).json(updatedTab);
    }

    public async delete(request: Request, response: Response): Promise<Response> {
        const { id } = request.params;

        if (!id || Array.isArray(id)) {
            return response.status(400).json({
                message: "Invalid tab id"
            });
        }

        const tab = await tabService.getById(id);

        if (!tab) {
            return response.status(404).json({
                message: "Tab not found"
            });
        }

        await tabService.delete(id);

        return response.status(204).send();
    }
}

export default new TabController();