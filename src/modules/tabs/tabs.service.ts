import Product from "./tabs.model.js";
import type { IProduct, 
    ICreateProductDTO, 
    IUpdateProductDTO } from "./tabs.types.js";

class productService{
    
    public async create(data: ICreateProductDTO){
        const product = await Product.create({
            name: data.name,
            value: data.value,
            description: data.description ?? ""
        });
        return product;
    }

    public async get(){
        return Product.find();
    }
    
    public async getById(id: number){
        return Product.findById(id);
    }

    public async update(id: number, data: IUpdateProductDTO){

        return await Product.findByIdAndUpdate(id, data, {
            new: true,
            runValidators: true,
        });
    }

    public async delete(id: number){
        Product.findByIdAndDelete(id);
    }
}

export default new productService(); 