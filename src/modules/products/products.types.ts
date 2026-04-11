export interface IProduct {
    id?: number,
    name: string,
    value: number,
    description: string
}

export interface ICreateProductDTO{
    name: string,
    value: number,
    description?: string
}

export interface IUpdateProductDTO{
    name?: string,
    value?: number,
    description?: string
}