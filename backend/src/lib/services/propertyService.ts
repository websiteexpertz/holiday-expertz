import crypto from "crypto";
import {
  Property,
  PropertyInput,
  PropertyStatus,
  PropertyDashboardStats,
} from "../../types/property";
import {
  getPropertiesByOwnerId,
  getPropertyById,
  createPropertyRecord,
  updatePropertyRecord,
  deletePropertyRecord,
  getOwnerDashboardStats,
} from "../storage/propertyStore";
import { getAllDestinations } from "../storage/destinationStore";

export interface PropertyServiceResult<T = Property> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string>;
}

/**
 * Validates property input data
 */
export function validatePropertyInput(input: Partial<PropertyInput>): {
  isValid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  if (!input.name || !input.name.trim()) {
    errors.name = "Property name is required.";
  } else if (input.name.trim().length < 3) {
    errors.name = "Property name must be at least 3 characters.";
  }

  if (!input.propertyType) {
    errors.propertyType = "Please select a valid property type.";
  }

  if (!input.shortDescription || !input.shortDescription.trim()) {
    errors.shortDescription = "Short description is required.";
  }

  if (!input.detailedDescription || !input.detailedDescription.trim()) {
    errors.detailedDescription = "Detailed description is required.";
  }

  // Location
  if (!input.location?.country?.trim()) errors["location.country"] = "Country is required.";
  if (!input.location?.state?.trim()) errors["location.state"] = "State is required.";
  if (!input.location?.city?.trim()) errors["location.city"] = "City is required.";
  if (!input.location?.address?.trim()) errors["location.address"] = "Full address is required.";

  // Pricing
  if (input.pricing?.pricePerNight === undefined || Number.isNaN(input.pricing.pricePerNight) || input.pricing.pricePerNight <= 0) {
    errors["pricing.pricePerNight"] = "Please enter a valid price per night greater than 0.";
  }

  // Capacity
  if (!input.capacity?.maxGuests || input.capacity.maxGuests < 1) {
    errors["capacity.maxGuests"] = "Maximum guests must be at least 1.";
  }
  if (!input.capacity?.bedrooms || input.capacity.bedrooms < 1) {
    errors["capacity.bedrooms"] = "Bedrooms count must be at least 1.";
  }
  if (!input.capacity?.bathrooms || input.capacity.bathrooms < 1) {
    errors["capacity.bathrooms"] = "Bathrooms count must be at least 1.";
  }

  // Contact
  if (!input.contactDetails?.contactPerson?.trim()) {
    errors["contactDetails.contactPerson"] = "Contact person name is required.";
  }
  if (!input.contactDetails?.mobileNumber?.trim()) {
    errors["contactDetails.mobileNumber"] = "Contact mobile number is required.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Creates a new property for an authenticated owner
 */
export function createOwnerProperty(
  ownerId: string,
  input: PropertyInput,
  submitImmediately: boolean = false
): PropertyServiceResult<Property> {
  // If submitting immediately, enforce full validation. If draft, allow partial input.
  if (submitImmediately) {
    const { isValid, errors } = validatePropertyInput(input);
    if (!isValid) {
      return {
        success: false,
        message: "Please complete all required fields before submitting for approval.",
        errors,
      };
    }
  } else if (!input.name?.trim()) {
    return {
      success: false,
      message: "Please provide at least a property name to save a draft.",
      errors: { name: "Property name is required." },
    };
  }

  const now = new Date().toISOString();
  const initialStatus: PropertyStatus = submitImmediately ? "pending_approval" : (input.status || "draft");

  const dest = getAllDestinations();
  const inputCountry = (input.location?.country || "").trim().toLowerCase();
  const inputState = (input.location?.state || "").trim().toLowerCase();
  const inputCity = (input.location?.city || "").trim().toLowerCase();

  const countryRecord = dest.countries.find(
    (c) => c.name.toLowerCase() === inputCountry || c.code.toLowerCase() === inputCountry
  );
  const stateRecord = dest.states.find(
    (s) =>
      s.name.toLowerCase() === inputState &&
      (!countryRecord || s.countryId === countryRecord.id)
  );
  const cityRecord = dest.cities.find(
    (ci) =>
      ci.name.toLowerCase() === inputCity &&
      (!stateRecord || ci.stateId === stateRecord.id)
  );

  const countryName = input.location?.country?.trim() || countryRecord?.name || "India";

  const newProperty: Property = {
    id: `prop_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`,
    ownerId,
    name: input.name.trim(),
    propertyType: input.propertyType || "Luxury Hotels",
    shortDescription: input.shortDescription?.trim() || "",
    detailedDescription: input.detailedDescription?.trim() || "",
    countryId: countryRecord?.id,
    stateId: stateRecord?.id,
    cityId: cityRecord?.id,
    createdByRole: "owner",
    createdById: ownerId,
    location: {
      country: countryName,
      state: input.location?.state?.trim() || "",
      city: input.location?.city?.trim() || "",
      locality: input.location?.locality?.trim() || "",
      address: input.location?.address?.trim() || "",
      postalCode: input.location?.postalCode?.trim() || "",
      countryId: countryRecord?.id,
      stateId: stateRecord?.id,
      cityId: cityRecord?.id,
      coordinates: input.location?.coordinates
        ? {
            latitude: Number(input.location.coordinates.latitude ?? input.location.coordinates.lat),
            longitude: Number(input.location.coordinates.longitude ?? input.location.coordinates.lng),
            lat: Number(input.location.coordinates.lat ?? input.location.coordinates.latitude),
            lng: Number(input.location.coordinates.lng ?? input.location.coordinates.longitude),
          }
        : undefined,
    },
    images: Array.isArray(input.images) ? input.images : [],
    pricing: {
      pricePerNight: Number(input.pricing?.pricePerNight) || 0,
      currency: input.pricing?.currency || "INR",
      originalPrice: input.pricing?.originalPrice ? Number(input.pricing.originalPrice) : undefined,
    },
    capacity: {
      maxGuests: Number(input.capacity?.maxGuests) || 2,
      bedrooms: Number(input.capacity?.bedrooms) || 1,
      bathrooms: Number(input.capacity?.bathrooms) || 1,
      checkInTime: input.capacity?.checkInTime || "14:00",
      checkOutTime: input.capacity?.checkOutTime || "11:00",
    },
    amenities: Array.isArray(input.amenities) ? input.amenities : [],
    contactDetails: {
      contactPerson: input.contactDetails?.contactPerson || "",
      mobileNumber: input.contactDetails?.mobileNumber || "",
      email: input.contactDetails?.email || "",
      altPhone: input.contactDetails?.altPhone || "",
    },
    status: initialStatus,
    submittedAt: submitImmediately ? now : undefined,
    createdAt: now,
    updatedAt: now,
  };

  createPropertyRecord(newProperty);

  return {
    success: true,
    message: submitImmediately
      ? "Property successfully submitted for review! Our audit team will review it within 24-48 hours."
      : "Property draft successfully saved.",
    data: newProperty,
  };
}

/**
 * Updates an existing property with strict ownership check
 */
export function updateOwnerProperty(
  ownerId: string,
  propertyId: string,
  updates: Partial<PropertyInput>,
  resubmit: boolean = false
): PropertyServiceResult<Property> {
  const existing = getPropertyById(propertyId);
  if (!existing) {
    return { success: false, message: "Property not found." };
  }

  if (existing.ownerId !== ownerId) {
    return { success: false, message: "Unauthorized. You can only edit your own properties." };
  }

  const now = new Date().toISOString();
  const newStatus: PropertyStatus = resubmit ? "pending_approval" : (updates.status || existing.status);

  const updated = updatePropertyRecord(propertyId, {
    ...updates,
    status: newStatus,
    rejectionReason: resubmit ? undefined : existing.rejectionReason,
    submittedAt: resubmit ? now : existing.submittedAt,
    updatedAt: now,
  });

  if (!updated) {
    return { success: false, message: "Failed to update property." };
  }

  return {
    success: true,
    message: resubmit
      ? "Property updated and resubmitted for approval."
      : "Property details updated successfully.",
    data: updated,
  };
}

/**
 * Deletes a property with strict ownership check
 */
export function deleteOwnerProperty(ownerId: string, propertyId: string): PropertyServiceResult<void> {
  const existing = getPropertyById(propertyId);
  if (!existing) {
    return { success: false, message: "Property not found." };
  }

  if (existing.ownerId !== ownerId) {
    return { success: false, message: "Unauthorized. You can only delete your own properties." };
  }

  const deleted = deletePropertyRecord(propertyId);
  if (!deleted) {
    return { success: false, message: "Failed to delete property." };
  }

  return {
    success: true,
    message: "Property listing successfully deleted.",
  };
}

/**
 * Administrative action to approve or reject a property
 */
export function moderatePropertyStatus(
  propertyId: string,
  newStatus: "approved" | "rejected",
  rejectionReason?: string
): PropertyServiceResult<Property> {
  const existing = getPropertyById(propertyId);
  if (!existing) {
    return { success: false, message: "Property not found." };
  }

  const now = new Date().toISOString();
  const updated = updatePropertyRecord(propertyId, {
    status: newStatus,
    approvedAt: newStatus === "approved" ? now : undefined,
    rejectedAt: newStatus === "rejected" ? now : undefined,
    rejectionReason: newStatus === "rejected" ? (rejectionReason || "Listing requires additional details.") : undefined,
    updatedAt: now,
  });

  return {
    success: true,
    message: newStatus === "approved" ? "Property approved and published!" : "Property marked as rejected.",
    data: updated!,
  };
}

/**
 * Retrieves dashboard stats and filtered properties for an owner
 */
export function getOwnerPropertiesAndStats(
  ownerId: string,
  options: {
    status?: string;
    search?: string;
    propertyType?: string;
  } = {}
): {
  properties: Property[];
  stats: PropertyDashboardStats;
} {
  let list = getPropertiesByOwnerId(ownerId);
  const stats = getOwnerDashboardStats(ownerId);

  // Status Filter
  if (options.status && options.status !== "all") {
    list = list.filter((p) => p.status === options.status);
  }

  // Type Filter
  if (options.propertyType && options.propertyType !== "all") {
    list = list.filter((p) => p.propertyType === options.propertyType);
  }

  // Search Filter
  if (options.search && options.search.trim()) {
    const q = options.search.toLowerCase().trim();
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.location.city.toLowerCase().includes(q) ||
        p.location.state.toLowerCase().includes(q) ||
        p.propertyType.toLowerCase().includes(q)
    );
  }

  return {
    properties: list,
    stats,
  };
}
