import type { Types } from "mongoose";

export interface IOrderProduct {
    product: Types.ObjectId;
    name: string;
    value: number;
    quantity: number;
}

export interface IOrder {
    id?: number,
    products: IOrderProduct[];
    total: number;
    status: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface ICreateOrderDTO{
    products: IOrderProduct[];
    total: number;
    status: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface IUpdateOrderDTO{
    products?: IOrderProduct[];
    status?: string;
}