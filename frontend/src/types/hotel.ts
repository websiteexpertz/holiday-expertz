export type PropertyType =
  | "Luxury Hotels"
  | "Resorts"
  | "Homestays"
  | "Villas"
  | "Budget Hotels"
  | "Boutique Stays";

export interface Hotel {
  id: string;
  name: string;
  tagline?: string;
  location: string;
  city: string;
  state: string;
  country: string;
  locality?: string;
  countryId?: string;
  stateId?: string;
  cityId?: string;
  areaId?: string;
  rating: number; // e.g. 4.8
  reviewScore: string; // e.g. "Excellent" | "Superb" | "Wonderful"
  reviewCount: number;
  pricePerNight: number; // INR
  originalPrice?: number; // INR
  currency: string; // "INR"
  featuredImage: string;
  galleryImages: string[];
  description: string;
  amenities: string[];
  propertyType: PropertyType;
  tags: string[]; // e.g. ["Luxury", "Mountain View", "Breakfast Included"]
  featured?: boolean;
  dealTag?: string;
  availableRooms: number;
}

export interface PropertyCategory {
  id: string;
  name: PropertyType;
  slug: string;
  propertyCount: number;
  image: string;
  description: string;
}

export interface Deal {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  discountText: string;
  badge: string;
  validTill: string;
  image: string;
  highlightColor?: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string;
  author: {
    name: string;
    avatar: string;
    role: string;
  };
  publishedDate: string;
  readTime: string;
  category: string;
  isInformative?: boolean;
}

export type LocationType = "country" | "state" | "city" | "area" | "property";

export interface AutocompleteSuggestion {
  id: string;
  type: LocationType;
  name: string;
  fullPath: string;
  parentPath: string;
  countryId?: string;
  stateId?: string;
  cityId?: string;
  areaId?: string;
  countryName?: string;
  stateName?: string;
  cityName?: string;
  areaName?: string;
  propertyCount?: number;
  propertyType?: string;
  pricePerNight?: number;
}

export interface SearchState {
  destination: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  rooms: number;
  locationId?: string;
  locationType?: LocationType;
  countryId?: string;
  stateId?: string;
  cityId?: string;
  areaId?: string;
  fullLocationPath?: string;
}
