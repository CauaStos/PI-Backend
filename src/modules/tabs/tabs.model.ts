import mongoose, { Schema } from "mongoose";
import type { IProduct } from "./tabs.types.js";

const productSchema = new Schema<IProduct>(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        description: {
            type: String,
            trim: true        
        },
        value: {
            type: Number,
            required: true,
            min: 1
        }
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

const Product = mongoose.model<IProduct>("Product", productSchema);

export default Product;