import mongoose, { Schema } from "mongoose";
import type { ITab } from "./tabs.types.js";

const tabSchema = new Schema<ITab>(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        orders: [
            {
                type: Schema.Types.ObjectId,
                ref: "Order"
            }
        ],
        status: {
            type: String,
            required: true,
            default: "open" 
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

const Tab = mongoose.model<ITab>("Tab", tabSchema);

export default Tab;