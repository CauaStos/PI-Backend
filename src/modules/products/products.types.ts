export const PRODUCT_CATEGORIES = [
  "comida",
  "bebida",
  "porcao",
  "sobremesa",
  "outros",
] as const

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number]

export interface IProduct {
  name: string
  description?: string
  image?: string
  /** Preco em unidades menores (inteiro, escala 10^4). Ex.: R$24,90 -> 249000. */
  price: number
  stock: number
  category: ProductCategory
  createdAt?: Date
  updatedAt?: Date
}

export interface ICreateProductDTO {
  name: string
  price: number
  description?: string
  image?: string
  stock?: number
  category?: ProductCategory
}

export interface IUpdateProductDTO {
  name?: string
  price?: number
  description?: string
  image?: string
  stock?: number
  category?: ProductCategory
}
