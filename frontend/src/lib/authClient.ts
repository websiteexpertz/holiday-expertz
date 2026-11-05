import { apiUrl } from "@/lib/apiUrl";
import { PropertyOwner, ApiResponse } from "@backend/types/auth";
import { CustomerUserRecord } from "@backend/types/admin";

export interface RegisterOwnerInput {
  fullName: string;
  mobileNumber: string;
  email: string;
  password: string;
  confirmPassword?: string;
}

export interface RegisterTravellerInput {
  fullName: string;
  email: string;
  phone?: string;
  password: string;
  city?: string;
  country?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

/**
 * Client service to register a property owner via /api/auth/register-owner
 */
export async function registerOwnerApi(
  input: RegisterOwnerInput
): Promise<ApiResponse<PropertyOwner>> {
  const response = await fetch(apiUrl("/api/auth/register-owner"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  const data = await response.json();
  return {
    ...data,
    success: response.ok && data.success,
  };
}

/**
 * Client service to authenticate a property owner via /api/auth/login
 */
export async function loginOwnerApi(
  input: LoginInput
): Promise<ApiResponse<PropertyOwner>> {
  const response = await fetch(apiUrl("/api/auth/login"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  const data = await response.json();
  return {
    ...data,
    success: response.ok && data.success,
  };
}

/**
 * Client service to register a new traveller via /api/auth/traveller/register
 */
export async function registerTravellerApi(
  input: RegisterTravellerInput
): Promise<{ success: boolean; message: string; traveller?: CustomerUserRecord }> {
  try {
    const response = await fetch(apiUrl("/api/auth/traveller/register"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const data = await response.json();
    return {
      ...data,
      success: response.ok && Boolean(data.success),
    };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Failed to connect to registration service",
    };
  }
}

/**
 * Client service to login as traveller via /api/auth/traveller/login
 */
export async function loginTravellerApi(
  input: LoginInput
): Promise<{ success: boolean; message: string; traveller?: CustomerUserRecord }> {
  try {
    const response = await fetch(apiUrl("/api/auth/traveller/login"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const data = await response.json();
    return {
      ...data,
      success: response.ok && Boolean(data.success),
    };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Failed to connect to login service",
    };
  }
}

/**
 * Fetch traveller profile
 */
export async function getTravellerProfileApi(
  id: string
): Promise<{ success: boolean; traveller?: CustomerUserRecord; message?: string }> {
  try {
    const response = await fetch(apiUrl(`/api/auth/traveller/profile?id=${encodeURIComponent(id)}`));
    const data = await response.json();
    return {
      ...data,
      success: response.ok && Boolean(data.success),
    };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Failed to load traveller profile",
    };
  }
}

/**
 * Update traveller basic profile
 */
export async function updateTravellerProfileApi(
  id: string,
  updates: Partial<CustomerUserRecord>
): Promise<{ success: boolean; message: string; traveller?: CustomerUserRecord }> {
  try {
    const response = await fetch(apiUrl("/api/auth/traveller/profile"), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...updates }),
    });
    const data = await response.json();
    return {
      ...data,
      success: response.ok && Boolean(data.success),
    };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Failed to update profile",
    };
  }
}

/**
 * Fetch traveller bookings
 */
export async function getTravellerBookingsApi(
  customerId: string,
  email?: string
): Promise<{ success: boolean; bookings?: any[]; message?: string }> {
  try {
    const q = new URLSearchParams({ customerId });
    if (email) q.set("email", email);
    const response = await fetch(apiUrl(`/api/auth/traveller/bookings?${q.toString()}`));
    const data = await response.json();
    return {
      ...data,
      success: response.ok && Boolean(data.success),
    };
  } catch (err) {
    return {
      success: false,
      bookings: [],
      message: err instanceof Error ? err.message : "Failed to load bookings",
    };
  }
}

