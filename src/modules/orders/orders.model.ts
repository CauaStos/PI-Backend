import mongoose, { Schema } from "mongoose"
import { ORDER_STATUSES, STATUS } from "../../shared/status.js"
import type { IOrder } from "./orders.types.js"

const orderSchema = new Schema<IOrder>(
  {
    tab: {
      type: Schema.Types.ObjectId,
      ref: "Tab",
      required: true,
    },
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    productName: {
      type: String,
      required: true,
      trim: true,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    employee: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    employeeName: {
      type: String,
      required: true,
      trim: true,
    },
    employeeAvatar: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    status: {
      type: String,
      enum: ORDER_STATUSES,
      required: true,
      default: STATUS.IN_PROGRESS,
    },
    orderedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    deliveredAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, unknown>) => {
        ret["id"] = ret["_id"]
        delete ret["_id"]
      },
    },
  }
)

const Order = mongoose.model<IOrder>("Order", orderSchema)

export default Order
