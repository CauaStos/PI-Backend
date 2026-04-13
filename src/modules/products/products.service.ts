import { createProduct,
        getProducts,
        getProductById,
        updateProduct,
        deleteProduct
 } from "../../repositories/productsRepositories.js";
import type { IProduct, 
    ICreateProductDTO, 
    IUpdateProductDTO } from "./products.types.js";

class productService{
    
    public async create(data: ICreateProductDTO){
        const product = await createProduct({
            name: data.name,
            value: data.value,
            description: data.description ?? ""
        });
        return product;
    }

    public async getProducts(){
        return getProducts();
    }

    public async getById(id: number){
        const product = await getProductById(id);

        if (!product || product !== null){
            throw new Error("Product not found");
        }

        return product;
    }

    public async update(id: number, data: IUpdateProductDTO){
        const existingProduct = await getProductById(id);

        if (!existingProduct) {
            throw new Error("Product not found");
        }

        const updatedProduct: IProduct = {
            id: existingProduct.id!,
            name: data.name ?? existingProduct.name,
            value: data.value ?? existingProduct.value,
            description: data.description ?? existingProduct.description
        };

        updateProduct(id, updatedProduct);
        return updateProduct;
    }

    public async delete(id: number){
        const existingProduct = await getProductById(id);

        if (!existingProduct) {
            throw new Error("Product not found");
        }

        deleteProduct(id);

        return existingProduct;
    }
}

export default new productService(); 