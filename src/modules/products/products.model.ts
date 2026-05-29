import mongoose, { Schema } from "mongoose";
import type { IProduct } from "./products.types.js";

const productSchema = new Schema<IProduct>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
            default: "",
        },
        price: {
            type: Number,
            required: true,
            min: 0,
            validate: {
                validator: Number.isInteger,
                message: "O preco deve ser um inteiro (unidades menores, escala 10^4).",
            },
        },
        stock: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
            validate: {
                validator: Number.isInteger,
                message: "O estoque deve ser um inteiro.",
            },
        },
    },
    {
        timestamps: true,
        versionKey: false,
        toJSON: {
            virtuals: true,
            transform: (_doc, ret: Record<string, unknown>) => {
                ret["id"] = ret["_id"];
                delete ret["_id"];
            },
        },
    }
);

const Product = mongoose.model<IProduct>("Product", productSchema);

export default Product;
