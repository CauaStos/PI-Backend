import mongoose, { Schema } from "mongoose";
import type { IOrder, IOrderProduct } from "./orders.types.js";

const orderProductSchema = new Schema<IOrderProduct>(
    {
        product: {
            type: Schema.Types.ObjectId,
            ref: "Product",
            required: true
        },
        name: {
            type: String,
            required: true,
            trim: true
        },
        value: {
            type: Number,
            required: true,
            min: 1
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        }
    },
    {
        _id: false
    }
);

const orderSchema = new Schema<IOrder>(
    {
        products: {
            type: [orderProductSchema],
            required: true,
            validate: {
                validator: (products: IOrderProduct[]) => products.length > 0,
                message: "An order must have at least one product"
            }
        },
        total: {
            type: Number,
            required: true,
            min: 1
        },
        status: {
            type: String,
            required: true
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

const Order = mongoose.model<IOrder>("Order", orderSchema);

export default Order;