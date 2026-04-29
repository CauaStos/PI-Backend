import type { Request, Response } from "express";
import productService from "./tabs.service.js";
import type { IProduct } from "./tabs.types.js";

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

    public async getProducts(request: Request, response: Response): Promise<Response>{
        const products = await productService.get();

        return response.status(200).json(products);
    }

    public async getProductById(request: Request, response: Response): Promise<Response>{
        const {id} = request.params;

        const product = await productService.getById(Number(id));

        if(!product || product === null){
            return response.status(404).json({
                "message" : "Product not found"
            })
        }

        return response.json(200).json(product);
    }

    public async update(request: Request, response: Response): Promise<Response>{
        const { id } = request.params;
        const {name, value, description} = request.body;
        
        const originalProduct = productService.getById(Number(id));

        if(!originalProduct || originalProduct === null){
            return response.status(404).json({
                "message": "Product not found"
            })
        }

        const newProduct = productService.update(Number(id), {name, value, description});

        return response.status(201).json(newProduct);
    }

    public async delete(request: Request, response: Response): Promise<Response>{
        const {id} = request.params;
        const product = productService.getById(Number(id));

        if(!product || product === null){
            return response.status(404).json({
                "message": "Product not found"
            })
        }
        productService.delete(Number(id));

        return response.status(204);
    }
}

export default new ProductController();