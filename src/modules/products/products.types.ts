export interface IProduct {
  name: string
  description?: string
  image?: string
  /** Preco em unidades menores (inteiro, escala 10^4). Ex.: R$24,90 -> 249000. */
  price: number
  stock: number
  createdAt?: Date
  updatedAt?: Date
}

export interface ICreateProductDTO {
  name: string
  price: number
  description?: string
  image?: string
  stock?: number
}

export interface IUpdateProductDTO {
  name?: string
  price?: number
  description?: string
  image?: string
  stock?: number
}
