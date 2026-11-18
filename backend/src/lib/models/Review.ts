import mongoose, { Model, Schema } from "mongoose";
import { ReviewRecord } from "../../types/admin";

const ReviewSchema = new Schema<ReviewRecord>(
  {
    id: { type: String, required: true, unique: true, index: true },
    author: { type: String, required: true, trim: true },
    avatar: { type: String },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, trim: true },
    comment: { type: String, required: true, trim: true },
    propertyName: { type: String, trim: true },
    propertyId: { type: String, index: true },
    location: { type: String, default: "Guest" },
    date: { type: String },
    status: {
      type: String,
      enum: ["approved", "pending", "hidden"],
      default: "approved",
      index: true,
    },
    featured: { type: Boolean, default: false },
    source: {
      type: String,
      enum: ["ADMIN_IMPORTED", "PLATFORM_GUEST"],
      default: "ADMIN_IMPORTED",
    },
    verificationStatus: {
      type: String,
      enum: ["VERIFIED", "UNVERIFIED"],
      default: "UNVERIFIED",
    },
    createdAt: { type: String, required: true },
    updatedAt: { type: String },
  },
  { versionKey: false, timestamps: true }
);

export const ReviewModel: Model<ReviewRecord> =
  mongoose.models.Review || mongoose.model<ReviewRecord>("Review", ReviewSchema);
