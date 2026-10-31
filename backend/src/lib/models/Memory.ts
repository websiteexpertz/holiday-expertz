import mongoose, { Schema, Model } from "mongoose";
import { MemoryRecord } from "../../types/memory";

const MemorySchema = new Schema<MemoryRecord>(
  {
    id: { type: String, required: true, unique: true, index: true },
    guestName: { type: String, required: true },
    guestEmail: { type: String },
    profileImage: { type: String },
    title: { type: String, required: true, index: true },
    shortDescription: { type: String, default: "" },
    story: { type: String, default: "" },
    countryId: { type: String, index: true },
    stateId: { type: String, index: true },
    cityId: { type: String, index: true },
    areaId: { type: String, index: true },
    destinationName: { type: String, required: true },
    propertyId: { type: String, index: true },
    propertyName: { type: String },
    travelDate: { type: String },
    images: [
      {
        id: { type: String },
        url: { type: String, required: true },
        caption: { type: String },
        isCover: { type: Boolean, default: false },
      },
    ],
    coverImage: { type: String, required: true },
    source: {
      type: String,
      enum: ["admin_created", "guest_submitted"],
      default: "admin_created",
      index: true,
    },
    status: {
      type: String,
      enum: ["draft", "pending", "approved", "rejected"],
      default: "approved",
      index: true,
    },
    isPublished: { type: Boolean, default: true, index: true },
    isActive: { type: Boolean, default: true, index: true },
    displayOrder: { type: Number, default: 0, index: true },
    isDemo: { type: Boolean, default: false, index: true },
    rejectionReason: { type: String },
  },
  { timestamps: true }
);

export const MemoryModel: Model<MemoryRecord> =
  mongoose.models.Memory || mongoose.model<MemoryRecord>("Memory", MemorySchema);

