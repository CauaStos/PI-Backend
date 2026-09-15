import mongoose, { Schema } from "mongoose"
import { EMPLOYEE_ROLES, type IEmployee } from "./employees.types.js"

const employeeSchema = new Schema<IEmployee>(
  {
    authUserId: { type: String, unique: true, sparse: true },
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    role: {
      type: String,
      enum: EMPLOYEE_ROLES,
      required: true,
      default: "garcom",
    },
    avatar: { type: String, required: true, trim: true },
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

const Employee = mongoose.model<IEmployee>("Employee", employeeSchema)

export default Employee
