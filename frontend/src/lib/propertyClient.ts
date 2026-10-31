import { apiUrl } from "@/lib/apiUrl";
import { Property, PropertyInput, PropertyDashboardStats } from "@backend/types/property";
import { PropertyOwner } from "@backend/types/auth";

export interface PropertiesResponse {
  success: boolean;
  properties: Property[];
  stats: PropertyDashboardStats;
  message?: string;
}

export interface SinglePropertyResponse {
  success: boolean;
  property?: Property;
  message?: string;
  errors?: Record<string, string>;
}

export interface UploadResponse {
  success: boolean;
  url?: string;
  message: string;
}

function getStoredOwnerId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("holiday_owner_id");
}

function authHeaders(): Record<string, string> {
  const id = getStoredOwnerId();
  return id ? { "x-owner-id": id } : {};
}

/**
 * Fetch owner properties and dashboard statistics
 */
export async function fetchOwnerPropertiesApi(options: {
  status?: string;
  propertyType?: string;
  search?: string;
} = {}): Promise<PropertiesResponse> {
  const params = new URLSearchParams();
  if (options.status) params.set("status", options.status);
  if (options.propertyType) params.set("propertyType", options.propertyType);
  if (options.search) params.set("search", options.search);

  const res = await fetch(apiUrl(`/api/properties?${params.toString()}`), {
    headers: { ...authHeaders() },
  });

  const data = await res.json();
  return data;
}

/**
 * Fetch a single property by ID
 */
export async function fetchPropertyByIdApi(id: string): Promise<SinglePropertyResponse> {
  const res = await fetch(apiUrl(`/api/properties/${id}`), {
    headers: { ...authHeaders() },
  });
  return res.json();
}

/**
 * Create a new property listing (draft or submitted)
 */
export async function createPropertyApi(
  input: PropertyInput,
  submitImmediately: boolean = false
): Promise<SinglePropertyResponse> {
  const res = await fetch(apiUrl("/api/properties"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify({ ...input, submitImmediately }),
  });
  return res.json();
}

/**
 * Update an existing property
 */
export async function updatePropertyApi(
  id: string,
  input: Partial<PropertyInput>,
  resubmit: boolean = false
): Promise<SinglePropertyResponse> {
  const res = await fetch(apiUrl(`/api/properties/${id}`), {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify({ ...input, resubmit }),
  });
  return res.json();
}

/**
 * Delete a property listing
 */
export async function deletePropertyApi(id: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(apiUrl(`/api/properties/${id}`), {
    method: "DELETE",
    headers: { ...authHeaders() },
  });
  return res.json();
}

/**
 * Moderate property status (approve or reject with reason)
 */
export async function moderatePropertyApi(
  id: string,
  status: "approved" | "rejected",
  rejectionReason?: string
): Promise<SinglePropertyResponse> {
  const res = await fetch(apiUrl(`/api/properties/${id}/status`), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify({ status, rejectionReason }),
  });
  return res.json();
}

/**
 * Upload property image
 */
export async function uploadImageApi(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(apiUrl("/api/upload"), {
    method: "POST",
    headers: { ...authHeaders() },
    body: formData,
  });
  return res.json();
}

/**
 * Get current authenticated owner profile
 */
export async function getOwnerSessionApi(): Promise<{ success: boolean; owner?: PropertyOwner }> {
  const res = await fetch(apiUrl("/api/auth/me"), {
    headers: { ...authHeaders() },
  });
  return res.json();
}

/**
 * Update owner profile
 */
export async function updateOwnerProfileApi(
  updates: Partial<PropertyOwner>
): Promise<{ success: boolean; owner?: PropertyOwner; message: string }> {
  const res = await fetch(apiUrl("/api/auth/me"), {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(updates),
  });
  return res.json();
}
