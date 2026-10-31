import { PropertyOwner, ApiResponse } from "@backend/types/auth";

export interface RegisterOwnerInput {
  fullName: string;
  mobileNumber: string;
  email: string;
  password: string;
  confirmPassword?: string;
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
  const response = await fetch("/api/auth/register-owner", {
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
  const response = await fetch("/api/auth/login", {
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
