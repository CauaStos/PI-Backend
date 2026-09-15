import { AppError } from "../../shared/app-error.js"
import { isValidMoney } from "../../shared/money.js"
import Product from "./products.model.js"
import type { ICreateProductDTO, IUpdateProductDTO } from "./products.types.js"

class ProductService {
  public async create(data: ICreateProductDTO) {
    const name = data.name?.trim()
    if (!name) {
      throw new AppError("Nome do produto e obrigatorio.")
    }
    if (!isValidMoney(data.price)) {
      throw new AppError(
        "Preco invalido. Use um inteiro em unidades menores (escala 10^4)."
      )
    }

    return Product.create({
      name,
      price: data.price,
      description: data.description ?? "",
      ...(data.image ? { image: data.image } : {}),
      stock: data.stock ?? 0,
    })
  }

  public async get() {
    return Product.find().sort({ createdAt: 1 })
  }

  public async getById(id: string) {
    return Product.findById(id)
  }

  public async update(id: string, data: IUpdateProductDTO) {
    if (data.price !== undefined && !isValidMoney(data.price)) {
      throw new AppError("Preco invalido.")
    }

    const product = await Product.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    })
    if (!product) {
      throw new AppError("Produto nao encontrado.", 404)
    }
    return product
  }

  public async delete(id: string) {
    const product = await Product.findByIdAndDelete(id)
    if (!product) {
      throw new AppError("Produto nao encontrado.", 404)
    }
    return product
  }
}

export default new ProductService()
