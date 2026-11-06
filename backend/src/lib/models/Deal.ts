import mongoose, { Model, Schema } from "mongoose";
import { DealRecord } from "../../types/admin";

const DealSchema = new Schema<DealRecord>(
  {
    id: { type: String, required: true, unique: true, index: true },
    slug: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    promoImage: { type: String, required: true },
    discountType: { type: String, enum: ["percentage", "fixed"], required: true },
    discountValue: { type: Number, required: true },
    couponCode: { type: String },
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
    applicableCategory: { type: String },
    applicablePropertyIds: [{ type: String }],
    status: { type: String, enum: ["active", "inactive", "expired"], required: true },
    featured: { type: Boolean, required: true },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true },
  },
  { versionKey: false }
);

export const DealModel: Model<DealRecord> =
  mongoose.models.Deal || mongoose.model<DealRecord>("Deal", DealSchema);
