import mongoose, { Schema, Model } from "mongoose";
import { Property } from "../../types/property";

const PropertySchema = new Schema<Property>(
  {
    id: { type: String, required: true, unique: true, index: true },
    propertyNumber: {
      type: String,
      unique: true,
      index: true,
      sparse: true,
      immutable: true,
    },
    ownerId: { type: String, required: true, index: true },
    name: { type: String, required: true, index: true },
    propertyType: { type: String, required: true },
    shortDescription: { type: String, default: "" },
    detailedDescription: { type: String, default: "" },
    location: {
      country: { type: String, required: true },
      state: { type: String, required: true },
      city: { type: String, required: true },
      locality: { type: String, default: "" },
      address: { type: String, default: "" },
      postalCode: { type: String, default: "" },
      countryId: { type: String, index: true },
      stateId: { type: String, index: true },
      cityId: { type: String, index: true },
      areaId: { type: String, index: true },
      coordinates: {
        latitude: { type: Number },
        longitude: { type: Number },
        lat: { type: Number },
        lng: { type: Number },
      },
    },
    pricing: {
      pricePerNight: { type: Number, required: true },
      currency: { type: String, default: "USD" },
      originalPrice: { type: Number },
      weekdayRate: { type: Number },
      weekendRate: { type: Number },
      weekendDays: [{ type: Number }],
      seasonalRates: [
        {
          id: { type: String },
          name: { type: String },
          startDate: { type: String },
          endDate: { type: String },
          nightlyRate: { type: Number },
        },
      ],
      specialDateRates: [
        {
          id: { type: String },
          name: { type: String },
          startDate: { type: String },
          endDate: { type: String },
          nightlyRate: { type: Number },
        },
      ],
      paidActivities: [
        {
          id: { type: String },
          name: { type: String },
          price: { type: Number },
          chargeType: { type: String },
        },
      ],
    },
    capacity: {
      maxGuests: { type: Number, default: 2 },
      bedrooms: { type: Number, default: 1 },
      bathrooms: { type: Number, default: 1 },
      checkInTime: { type: String, default: "14:00" },
      checkOutTime: { type: String, default: "11:00" },
    },
    amenities: [{ type: String }],
    images: [
      {
        id: { type: String },
        url: { type: String, required: true },
        isCover: { type: Boolean, default: false },
        caption: { type: String },
        title: { type: String, default: "" },
      },
    ],
    contactDetails: {
      contactPerson: { type: String, default: "" },
      mobileNumber: { type: String, default: "" },
      email: { type: String, default: "" },
      altPhone: { type: String },
    },
    policies: {
      generalPolicy: { type: String, default: "" },
      refundPolicy: { type: String, default: "" },
      contractPolicy: { type: String, default: "" },
      additionalNotes: { type: String, default: "" },
    },
    status: {
      type: String,
      enum: ["draft", "pending_approval", "approved", "rejected", "paused"],
      default: "pending_approval",
      index: true,
    },
    rating: { type: Number, default: 4.8 },
    reviewCount: { type: Number, default: 0 },
    featured: { type: Boolean, default: false, index: true },
    handpicked: { type: Boolean, default: false, index: true },
    isFeatured: { type: Boolean, default: false },
    isHandpicked: { type: Boolean, default: false },
    propertySize: { type: Number },
    propertySizeUnit: { type: String, default: "sq ft" },
    countryId: { type: String, index: true },
    stateId: { type: String, index: true },
    cityId: { type: String, index: true },
    areaId: { type: String, index: true },
    createdByRole: { type: String, enum: ["admin", "owner"], default: "owner", index: true },
    createdById: { type: String, index: true },
    submittedAt: { type: String },
    approvedAt: { type: String },
    rejectedAt: { type: String },
    rejectionReason: { type: String },
  },
  { timestamps: true }
);

export const PropertyModel: Model<Property> =
  mongoose.models.Property || mongoose.model<Property>("Property", PropertySchema);
