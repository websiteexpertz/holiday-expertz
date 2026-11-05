import mongoose, { Schema, Model } from "mongoose";
import { HeroBannerContentSlot } from "../../types/admin";

export interface HeroBannerContentDoc {
  slotIndex: number; // 0, 1, 2, 3
  slideNumber: number; // 1, 2, 3, 4
  heading: string;
  description: string;
  updatedAt: string;
}

const HeroBannerContentSchema = new Schema<HeroBannerContentDoc>(
  {
    slotIndex: { type: Number, required: true, unique: true, index: true },
    slideNumber: { type: Number, required: true },
    heading: { type: String, required: true },
    description: { type: String, required: true },
    updatedAt: { type: String, default: () => new Date().toISOString() },
  },
  { timestamps: true }
);

export const HeroBannerContentModel: Model<HeroBannerContentDoc> =
  mongoose.models.HeroBannerContent ||
  mongoose.model<HeroBannerContentDoc>("HeroBannerContent", HeroBannerContentSchema);

export default HeroBannerContentModel;

