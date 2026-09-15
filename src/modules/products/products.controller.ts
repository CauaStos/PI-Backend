import type { Request, Response } from "express";
import { AppError } from "../../shared/app-error.js";
import productService from "./products.service.js";

class ProductController {
    public async create(request: Request, response: Response): Promise<Response> {
        const { name, price, description, image, stock } = request.body;
        const product = await productService.create({ name, price, description, image, stock });
        return response.status(201).json(product);
    }

    public async getProducts(_request: Request, response: Response): Promise<Response> {
        const products = await productService.get();
        return response.status(200).json(products);
    }

    public async getProductById(request: Request, response: Response): Promise<Response> {
        const { id } = request.params;
        const product = await productService.getById(String(id));
        if (!product) {
            throw new AppError("Produto nao encontrado.", 404);
        }
        return response.status(200).json(product);
    }

    public async update(request: Request, response: Response): Promise<Response> {
        const { id } = request.params;
        const { name, price, description, image, stock } = request.body;
        const product = await productService.update(String(id), {
            name,
            price,
            description,
            image,
            stock,
        });
        return response.status(200).json(product);
    }

    public async delete(request: Request, response: Response): Promise<Response> {
        const { id } = request.params;
        await productService.delete(String(id));
        return response.status(204).send();
    }
}

export default new ProductController();
