export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MOBILE_REGEX = /^\+?[0-9]{10,15}$/;

export interface OwnerRegistrationValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  cleanedData?: {
    fullName: string;
    mobileNumber: string;
    email: string;
    password: string;
  };
}

export function validateOwnerRegistration(input: unknown): OwnerRegistrationValidationResult {
  const errors: Record<string, string> = {};

  if (!input || typeof input !== "object") {
    return {
      isValid: false,
      errors: { form: "Invalid request payload." },
    };
  }

  const { fullName, mobileNumber, email, password, confirmPassword } = input as Record<string, unknown>;

  // 1. Full Name
  if (!fullName || typeof fullName !== "string" || !fullName.trim()) {
    errors.fullName = "Full name is required.";
  } else if (fullName.trim().length < 2) {
    errors.fullName = "Full name must be at least 2 characters long.";
  } else if (fullName.trim().length > 100) {
    errors.fullName = "Full name cannot exceed 100 characters.";
  }

  // 2. Mobile Number
  let cleanedMobile = "";
  if (!mobileNumber || typeof mobileNumber !== "string" || !mobileNumber.trim()) {
    errors.mobileNumber = "Mobile number is required.";
  } else {
    cleanedMobile = mobileNumber.replace(/[\s-]/g, "");
    if (!MOBILE_REGEX.test(cleanedMobile)) {
      errors.mobileNumber = "Please enter a valid mobile number (10 to 15 digits).";
    }
  }

  // 3. Email Address
  let cleanedEmail = "";
  if (!email || typeof email !== "string" || !email.trim()) {
    errors.email = "Email address is required.";
  } else {
    cleanedEmail = email.toLowerCase().trim();
    if (!EMAIL_REGEX.test(cleanedEmail)) {
      errors.email = "Please enter a valid email address (e.g. host@example.com).";
    }
  }

  // 4. Password
  if (!password || typeof password !== "string") {
    errors.password = "Password is required.";
  } else if (password.length < 8) {
    errors.password = "Password must be at least 8 characters long.";
  } else if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    errors.password = "Password must include at least one letter and one number.";
  }

  // 5. Confirm Password
  if (!confirmPassword || typeof confirmPassword !== "string") {
    errors.confirmPassword = "Confirm password is required.";
  } else if (password !== confirmPassword) {
    errors.confirmPassword = "Passwords do not match.";
  }

  if (Object.keys(errors).length > 0) {
    return { isValid: false, errors };
  }

  return {
    isValid: true,
    errors: {},
    cleanedData: {
      fullName: (fullName as string).trim(),
      mobileNumber: cleanedMobile,
      email: cleanedEmail,
      password: password as string,
    },
  };
}

export function validateLoginInput(input: unknown): {
  isValid: boolean;
  errors: Record<string, string>;
  cleanedData?: { email: string; password: string };
} {
  const errors: Record<string, string> = {};

  if (!input || typeof input !== "object") {
    return { isValid: false, errors: { form: "Invalid request payload." } };
  }

  const { email, password } = input as Record<string, unknown>;

  if (!email || typeof email !== "string" || !email.trim()) {
    errors.email = "Email address is required.";
  }

  if (!password || typeof password !== "string") {
    errors.password = "Password is required.";
  }

  if (Object.keys(errors).length > 0) {
    return { isValid: false, errors };
  }

  return {
    isValid: true,
    errors: {},
    cleanedData: {
      email: (email as string).toLowerCase().trim(),
      password: password as string,
    },
  };
}
