export type MemorySource = "admin_created" | "guest_submitted";
export type MemoryStatus = "draft" | "pending" | "approved" | "rejected";

export interface MemoryImage {
  id: string;
  url: string;
  caption?: string;
  isCover?: boolean;
}

export interface MemoryRecord {
  id: string;
  guestName: string;
  guestEmail?: string;         // Kept private — never sent in public API responses
  profileImage?: string;
  title: string;
  shortDescription: string;
  story: string;
  countryId?: string;
  stateId?: string;
  cityId?: string;
  areaId?: string;
  destinationName: string;     // e.g. "Mussoorie, Uttarakhand"
  propertyId?: string;
  propertyName?: string;
  travelDate?: string;
  images: MemoryImage[];
  coverImage: string;
  source: MemorySource;
  status: MemoryStatus;
  isPublished: boolean;
  isActive: boolean;
  displayOrder: number;
  isDemo?: boolean;            // Identifies demo records for safe cleanup
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MemoryInput {
  guestName: string;
  guestEmail?: string;
  profileImage?: string;
  title: string;
  shortDescription: string;
  story: string;
  countryId?: string;
  stateId?: string;
  cityId?: string;
  areaId?: string;
  destinationName: string;
  propertyId?: string;
  propertyName?: string;
  travelDate?: string;
  images: (MemoryImage | string)[];
  coverImage?: string;
  source?: MemorySource;
  status?: MemoryStatus;
  isPublished?: boolean;
  isActive?: boolean;
  displayOrder?: number;
  isDemo?: boolean;
  rejectionReason?: string;
}
