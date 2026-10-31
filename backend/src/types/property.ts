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

export interface PropertyPricing {
  pricePerNight: number;
  currency: string; // e.g. "INR"
  originalPrice?: number;
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

export interface Property {
  id: string;
  ownerId: string;
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
  status: PropertyStatus;
  rejectionReason?: string;
  featured?: boolean;
  handpicked?: boolean;
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
  status?: PropertyStatus; // defaults to 'draft' or 'pending_approval'
}

export interface PropertyDashboardStats {
  total: number;
  published: number; // approved
  pendingApproval: number;
  rejected: number;
  draft: number;
}
