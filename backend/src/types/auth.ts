export interface PropertyOwnerRegistrationInput {
  fullName: string;
  mobileNumber: string;
  email: string;
  password: string;
}

export interface PropertyOwner {
  id: string;
  fullName: string;
  mobileNumber: string;
  email: string;
  role: "property_owner";
  status: "active" | "pending_review" | "suspended";
  avatar?: string;
  businessName?: string;
  address?: string;
  bio?: string;
  altPhone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PropertyOwnerRecord {
  id: string;
  fullName: string;
  mobileNumber: string;
  email: string;
  passwordHash: string;
  passwordSalt: string;
  role: "property_owner";
  status: "active" | "pending_review" | "suspended";
  avatar?: string;
  businessName?: string;
  address?: string;
  bio?: string;
  altPhone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  owner?: T;
  errors?: Record<string, string>;
}
