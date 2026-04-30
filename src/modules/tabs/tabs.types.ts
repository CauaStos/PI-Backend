import type { Types } from "mongoose";

export interface ITab {
    name: string;
    orders: Types.ObjectId[];
    status: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface ICreateTabDTO {
    name: string;
    orders?: Types.ObjectId[];
    status: string;
}

export interface IUpdateTabDTO {
    name?: string;
    orders?: Types.ObjectId[];
    status?: string;
}