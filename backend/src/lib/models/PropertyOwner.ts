import mongoose, { Model, Schema } from "mongoose";
import { PropertyOwnerRecord } from "../../types/auth";

export interface PropertyOwnerDocument extends PropertyOwnerRecord {
  emailNormalized: string;
  mobileNormalized: string;
}

const PropertyOwnerSchema = new Schema<PropertyOwnerDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    fullName: { type: String, required: true, trim: true },
    mobileNumber: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    emailNormalized: { type: String, required: true, unique: true, index: true },
    mobileNormalized: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    passwordSalt: { type: String, required: true },
    role: { type: String, enum: ["property_owner"], default: "property_owner" },
    status: { type: String, enum: ["active", "pending_review", "suspended"], default: "active" },
    avatar: { type: String },
    businessName: { type: String },
    address: { type: String },
    bio: { type: String },
    altPhone: { type: String },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true },
  },
  { collection: "propertyOwners", timestamps: false }
);

export const PropertyOwnerModel: Model<PropertyOwnerDocument> =
  mongoose.models.PropertyOwner ||
  mongoose.model<PropertyOwnerDocument>("PropertyOwner", PropertyOwnerSchema);
