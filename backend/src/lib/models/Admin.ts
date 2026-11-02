import mongoose, { Schema, Model } from "mongoose";
import { AdminRecord } from "../../types/admin";

const AdminSchema = new Schema<AdminRecord>(
  {
    id: { type: String, required: true, unique: true, index: true },
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    passwordSalt: { type: String, required: true },
    role: { type: String, enum: ["super_admin", "custom_admin"], default: "super_admin" },
    permissions: [{ type: String }],
    status: { type: String, enum: ["active", "inactive", "suspended"], default: "active" },
    avatar: { type: String },
    department: { type: String, default: "Executive Leadership" },
    lastLoginAt: { type: String },
  },
  { timestamps: true }
);

export const AdminModel: Model<AdminRecord> =
  mongoose.models.Admin || mongoose.model<AdminRecord>("Admin", AdminSchema);
