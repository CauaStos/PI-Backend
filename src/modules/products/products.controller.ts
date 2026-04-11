import type { Request, Response } from "express";
import productService from "./products.service.js";

class ProductController {

    public async create(request: Request, response: Response): Promise<Response>{
        const {name, value, description} = request.body;
        
        const product = await productService.create({
            name,
            value,
            description
        });
        return response.status(201).json(product);
    }
}

export default new ProductController();