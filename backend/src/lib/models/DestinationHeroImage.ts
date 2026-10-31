import mongoose, { Schema, Model } from "mongoose";
import { DestinationHeroImage } from "../../types/admin";

const DestinationHeroImageSchema = new Schema<DestinationHeroImage>(
  {
    id: { type: String, required: true, unique: true, index: true },
    destinationType: { type: String, required: true, enum: ["country", "state"], index: true },
    countryId: { type: String, required: true, index: true },
    stateId: { type: String, index: true, default: "" },
    title: { type: String, required: true },
    locationName: { type: String, default: "" },
    imageUrl: { type: String, required: true },
    altText: { type: String, default: "" },
    order: { type: Number, default: 0, index: true },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

// Compound indexes for fast slideshow querying
DestinationHeroImageSchema.index({ destinationType: 1, countryId: 1, stateId: 1, isActive: 1, order: 1 });

export const DestinationHeroImageModel: Model<DestinationHeroImage> =
  mongoose.models.DestinationHeroImage ||
  mongoose.model<DestinationHeroImage>("DestinationHeroImage", DestinationHeroImageSchema);

export default DestinationHeroImageModel;

