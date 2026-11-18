import type { ReviewRecord } from "./admin";
export type { ReviewRecord };

export type PropertyStatus = "draft" | "pending_approval" | "approved" | "rejected" | "paused";

export type PropertyTypeCategory =
  | "Luxury Hotels"
  | "Resorts"
  | "Villas"
  | "Homestays"
  | "Palace Stays"
  | "Boutique Stays"
  | "Guesthouses"
  | "Apartments";

export interface PropertyImage {
  id: string;
  url: string;
  isCover: boolean;
  caption?: string;
  title?: string;
}

export interface PropertyLocation {
  country: string;
  state: string;
  city: string;
  locality: string;
  address: string;
  postalCode: string;
  countryId?: string;
  stateId?: string;
  cityId?: string;
  areaId?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
    lat?: number;
    lng?: number;
  };
}

export interface SeasonalPricingRule {
  id: string;
  name: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  nightlyRate: number;
}

export interface SpecialDatePricingRule {
  id: string;
  name: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  nightlyRate: number;
}

export type PaidActivityChargeType = "PER_BOOKING" | "PER_PERSON" | "PER_SESSION" | "PER_TRIP";

export interface PaidActivity {
  id: string;
  name: string;
  price: number;
  chargeType: PaidActivityChargeType;
}

export interface PropertyPricing {
  pricePerNight: number;
  currency: string; // e.g. "USD"
  originalPrice?: number;
  weekdayRate?: number;
  weekendRate?: number;
  weekendDays?: number[]; // [5, 6] = Fri, Sat
  seasonalRates?: SeasonalPricingRule[];
  specialDateRates?: SpecialDatePricingRule[];
  paidActivities?: PaidActivity[];
  historicalInrPricing?: {
    pricePerNight?: number;
    originalPrice?: number;
    convertedAt?: string;
    rateUsed?: number;
  };
}

export interface PropertyCapacity {
  maxGuests: number;
  bedrooms: number;
  bathrooms: number;
  checkInTime: string; // e.g. "14:00"
  checkOutTime: string; // e.g. "11:00"
}

export interface PropertyContact {
  contactPerson: string;
  mobileNumber: string;
  email: string;
  altPhone?: string;
}

export interface PropertyPolicies {
  generalPolicy?: string;
  refundPolicy?: string;
  contractPolicy?: string;
  additionalNotes?: string;
}

export interface Property {
  id: string;
  propertyNumber?: string; // Unique permanent sequence identifier, e.g. "HE-000001"
  ownerId: string;
  ownerNumber?: string;
  owner?: {
    id: string;
    fullName: string;
    email?: string;
    mobileNumber?: string;
    avatar?: string;
    profileImage?: string | null;
    languagesSpoken?: string[];
    aboutOwner?: string;
    bio?: string;
    ownerNumber?: string;
    businessName?: string;
  };
  name: string;
  propertyType: PropertyTypeCategory;
  shortDescription: string;
  detailedDescription: string;
  location: PropertyLocation;
  images: PropertyImage[];
  pricing: PropertyPricing;
  capacity: PropertyCapacity;
  amenities: string[];
  contactDetails: PropertyContact;
  policies?: PropertyPolicies;
  reviews?: ReviewRecord[];
  status: PropertyStatus;
  rejectionReason?: string;
  featured?: boolean;
  handpicked?: boolean;
  isFeatured?: boolean;
  isHandpicked?: boolean;
  propertySize?: number;
  propertySizeUnit?: string;
  countryId?: string;
  stateId?: string;
  cityId?: string;
  areaId?: string;
  rating?: number;
  reviewCount?: number;
  createdByRole?: "admin" | "owner";
  createdById?: string;
  submittedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PropertyInput {
  name: string;
  propertyType: PropertyTypeCategory;
  shortDescription: string;
  detailedDescription: string;
  location: PropertyLocation;
  images: PropertyImage[];
  pricing: PropertyPricing;
  capacity: PropertyCapacity;
  amenities: string[];
  contactDetails: PropertyContact;
  policies?: PropertyPolicies;
  reviews?: ReviewRecord[];
  propertySize?: number;
  propertySizeUnit?: string;
  status?: PropertyStatus; // defaults to 'draft' or 'pending_approval'
}

export interface PropertyDashboardStats {
  total: number;
  published: number; // approved
  pendingApproval: number;
  rejected: number;
  draft: number;
}
