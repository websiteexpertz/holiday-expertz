import mongoose, { Schema, Model } from "mongoose";
import { CountryRecord, StateRecord, CityRecord, AreaRecord } from "../../types/admin";

// ── Country Schema ──
const CountrySchema = new Schema<CountryRecord>(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, index: true },
    code: { type: String, required: true, uppercase: true },
    description: { type: String, default: "" },
    image: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// ── State Schema ──
const StateSchema = new Schema<StateRecord>(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, index: true },
    countryId: { type: String, required: true, index: true },
    image: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// ── City Schema ──
const CitySchema = new Schema<CityRecord>(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, index: true },
    stateId: { type: String, required: true, index: true },
    countryId: { type: String, required: true, index: true },
    image: { type: String, default: "" },
    isPopular: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// ── Area / Locality Schema ──
const AreaSchema = new Schema<AreaRecord>(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, index: true },
    cityId: { type: String, required: true, index: true },
    stateId: { type: String, required: true, index: true },
    countryId: { type: String, required: true, index: true },
    postalCode: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const CountryModel: Model<CountryRecord> =
  mongoose.models.Country || mongoose.model<CountryRecord>("Country", CountrySchema);

export const StateModel: Model<StateRecord> =
  mongoose.models.State || mongoose.model<StateRecord>("State", StateSchema);

export const CityModel: Model<CityRecord> =
  mongoose.models.City || mongoose.model<CityRecord>("City", CitySchema);

export const AreaModel: Model<AreaRecord> =
  mongoose.models.Area || mongoose.model<AreaRecord>("Area", AreaSchema);
