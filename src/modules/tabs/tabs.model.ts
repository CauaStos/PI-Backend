import mongoose, { Schema } from "mongoose";
import { STATUS, TAB_STATUSES } from "../../shared/status.js";
import type { ITab, ITabMember } from "./tabs.types.js";

const tabMemberSchema = new Schema<ITabMember>(
    {
        employee: {
            type: Schema.Types.ObjectId,
            ref: "Employee",
            required: true,
        },
        name: { type: String, required: true, trim: true },
        avatar: { type: String, required: true, trim: true },
    },
    { _id: false }
);

const tabSchema = new Schema<ITab>(
    {
        tableName: {
            type: String,
            required: true,
            trim: true,
        },
        status: {
            type: String,
            enum: TAB_STATUSES,
            required: true,
            default: STATUS.OPEN,
        },
        members: { type: [tabMemberSchema], default: [] },
        orders: [{ type: Schema.Types.ObjectId, ref: "Order" }],
        openedAt: { type: Date, required: true, default: Date.now },
        closedAt: { type: Date, default: null },
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

const Tab = mongoose.model<ITab>("Tab", tabSchema);

export default Tab;
