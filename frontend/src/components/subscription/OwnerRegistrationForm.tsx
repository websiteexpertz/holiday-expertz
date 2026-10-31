import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  User,
  Phone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { PropertyOwner } from "@backend/types/auth";
import { registerOwnerApi } from "@/lib/authClient";

interface OwnerRegistrationFormProps {
  onOpenSignIn?: () => void;
  onRegistrationSuccess?: (owner: PropertyOwner) => void;
}

export default function OwnerRegistrationForm({
  onOpenSignIn,
  onRegistrationSuccess,
}: OwnerRegistrationFormProps) {
  const router = useRouter();
  const { login } = useAuth();
  // Form State
  const [formData, setFormData] = useState({
    fullName: "",
    mobileNumber: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // UI States
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [registeredOwner, setRegisteredOwner] = useState<PropertyOwner | null>(null);

  // Field change handler
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear specific field error when user starts correcting it
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
    if (serverError) setServerError(null);
  };

  // Client-side Validation
  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    // 1. Full Name
    if (!formData.fullName.trim()) {
      errors.fullName = "Please enter your full name.";
    } else if (formData.fullName.trim().length < 2) {
      errors.fullName = "Full name must be at least 2 characters.";
    }

    // 2. Mobile Number (10 to 15 digits)
    const cleanedMobile = formData.mobileNumber.replace(/[\s-]/g, "");
    if (!formData.mobileNumber.trim()) {
      errors.mobileNumber = "Please enter your mobile number.";
    } else if (!/^\+?[0-9]{10,15}$/.test(cleanedMobile)) {
      errors.mobileNumber = "Please enter a valid 10-digit mobile number (e.g. 9876543210).";
    }

    // 3. Email Address
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      errors.email = "Please enter your email address.";
    } else if (!emailRegex.test(formData.email.trim())) {
      errors.email = "Please enter a valid email address (e.g. host@example.com).";
    }

    // 4. Password
    if (!formData.password) {
      errors.password = "Please enter a password.";
    } else if (formData.password.length < 8) {
      errors.password = "Password must be at least 8 characters long.";
    } else if (!/[A-Za-z]/.test(formData.password) || !/[0-9]/.test(formData.password)) {
      errors.password = "Password must include at least one letter and one number.";
    }

    // 5. Confirm Password
    if (!formData.confirmPassword) {
      errors.confirmPassword = "Please confirm your password.";
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match. Please re-enter.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;
    setServerError(null);

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const data = await registerOwnerApi({
        fullName: formData.fullName,
        mobileNumber: formData.mobileNumber,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      });

      if (!data.success || !data.owner) {
        if (data.errors) {
          setFieldErrors(data.errors);
        }
        setServerError(data.message || "Registration failed. Please check your details.");
        setIsSubmitting(false);
        return;
      }

      // Success
      login(data.owner);
      setRegisteredOwner(data.owner);
      setIsSubmitting(false);
      onRegistrationSuccess?.(data.owner);

      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch (err) {
      console.error("Submission network error:", err);
      setServerError("Network error occurred. Please verify your connection and try again.");
      setIsSubmitting(false);
    }
  };

  // Reset form to register another property or edit
  const handleReset = () => {
    setRegisteredOwner(null);
    setFormData({
      fullName: "",
      mobileNumber: "",
      email: "",
      password: "",
      confirmPassword: "",
    });
    setFieldErrors({});
    setServerError(null);
  };

  // Success Confirmation State
  if (registeredOwner) {
    return (
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-teal-200 shadow-xl space-y-6 text-center animate-in fade-in zoom-in-95 duration-300">
        <div className="w-16 h-16 mx-auto rounded-3xl bg-teal-50 border border-teal-200 text-teal-600 flex items-center justify-center shadow-sm">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-100/70 border border-teal-200 text-teal-800 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-700" />
            <span>Registration Verified</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome, {registeredOwner.fullName}!
          </h3>
          <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
            Your property owner partner account has been created successfully. You can now proceed to list your resort, palace, or private villa on HolidayExpertz.
          </p>
        </div>

        {/* Account Details Summary */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 text-left text-xs sm:text-sm space-y-2.5">
          <div className="flex justify-between items-center py-1 border-b border-slate-200/80">
            <span className="text-slate-500 font-medium">Account ID</span>
            <span className="font-mono font-bold text-slate-800">{registeredOwner.id}</span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-slate-200/80">
            <span className="text-slate-500 font-medium">Registered Email</span>
            <span className="font-semibold text-slate-900">{registeredOwner.email}</span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-slate-200/80">
            <span className="text-slate-500 font-medium">Mobile Number</span>
            <span className="font-semibold text-slate-900">{registeredOwner.mobileNumber}</span>
          </div>
          <div className="flex justify-between items-center py-1">
            <span className="text-slate-500 font-medium">Partner Tier</span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
              Verified Host
            </span>
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="w-full sm:w-auto px-6 py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95 inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Access Owner Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="w-full sm:w-auto px-5 py-3.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-semibold text-sm rounded-xl transition-colors"
          >
            Register Another Account
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 lg:p-9 border border-slate-200/90 shadow-xl transition-all">
      {/* Header Banner */}
      <div className="space-y-2 mb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold uppercase tracking-wider">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
          <span>Property Owner Registration</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          List Your Property With Us
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          Create your verified host account to showcase your luxury stays to premium leisure travelers across India and abroad.
        </p>
      </div>

      {/* Global Server Error Banner */}
      {serverError && (
        <div
          role="alert"
          className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-3 animate-in fade-in"
        >
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold">Registration Alert</p>
            <p className="mt-0.5 text-rose-700">{serverError}</p>
          </div>
        </div>
      )}

      {/* Registration Form with fields in exact specified order */}
      <form onSubmit={handleSubmit} noValidate className="space-y-4 sm:space-y-4.5">
        {/* Field 1: Full Name */}
        <div>
          <label
            htmlFor="fullName"
            className="block text-xs sm:text-sm font-bold text-slate-900 mb-1.5"
          >
            Full Name <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <User className="w-4 h-4" />
            </div>
            <input
              id="fullName"
              name="fullName"
              type="text"
              required
              disabled={isSubmitting}
              autoComplete="name"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="e.g. Vikramaditya Rathore"
              className={`w-full pl-10 pr-4 py-2.5 sm:py-3 text-sm text-slate-900 bg-white rounded-xl border transition-all placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                fieldErrors.fullName
                  ? "border-rose-400 focus:ring-rose-400 bg-rose-50/20"
                  : "border-slate-300 focus:border-teal-500 focus:ring-teal-500/20"
              }`}
            />
          </div>
          {fieldErrors.fullName && (
            <p className="mt-1 text-xs text-rose-600 font-medium flex items-center gap-1">
              <span>{fieldErrors.fullName}</span>
            </p>
          )}
        </div>

        {/* Field 2: Mobile Number */}
        <div>
          <label
            htmlFor="mobileNumber"
            className="block text-xs sm:text-sm font-bold text-slate-900 mb-1.5"
          >
            Mobile Number <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Phone className="w-4 h-4" />
            </div>
            <input
              id="mobileNumber"
              name="mobileNumber"
              type="tel"
              required
              disabled={isSubmitting}
              autoComplete="tel"
              value={formData.mobileNumber}
              onChange={handleChange}
              placeholder="e.g. 9876543210"
              className={`w-full pl-10 pr-4 py-2.5 sm:py-3 text-sm text-slate-900 bg-white rounded-xl border transition-all placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                fieldErrors.mobileNumber
                  ? "border-rose-400 focus:ring-rose-400 bg-rose-50/20"
                  : "border-slate-300 focus:border-teal-500 focus:ring-teal-500/20"
              }`}
            />
          </div>
          {fieldErrors.mobileNumber && (
            <p className="mt-1 text-xs text-rose-600 font-medium flex items-center gap-1">
              <span>{fieldErrors.mobileNumber}</span>
            </p>
          )}
        </div>

        {/* Field 3: Email Address */}
        <div>
          <label
            htmlFor="email"
            className="block text-xs sm:text-sm font-bold text-slate-900 mb-1.5"
          >
            Email Address <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Mail className="w-4 h-4" />
            </div>
            <input
              id="email"
              name="email"
              type="email"
              required
              disabled={isSubmitting}
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="e.g. host@heritagehaven.com"
              className={`w-full pl-10 pr-4 py-2.5 sm:py-3 text-sm text-slate-900 bg-white rounded-xl border transition-all placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                fieldErrors.email
                  ? "border-rose-400 focus:ring-rose-400 bg-rose-50/20"
                  : "border-slate-300 focus:border-teal-500 focus:ring-teal-500/20"
              }`}
            />
          </div>
          {fieldErrors.email && (
            <p className="mt-1 text-xs text-rose-600 font-medium flex items-center gap-1">
              <span>{fieldErrors.email}</span>
            </p>
          )}
        </div>

        {/* Field 4: Password with Show/Hide Toggle */}
        <div>
          <label
            htmlFor="password"
            className="block text-xs sm:text-sm font-bold text-slate-900 mb-1.5"
          >
            Password <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-4 h-4" />
            </div>
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              disabled={isSubmitting}
              autoComplete="new-password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Minimum 8 characters with letters & numbers"
              className={`w-full pl-10 pr-11 py-2.5 sm:py-3 text-sm text-slate-900 bg-white rounded-xl border transition-all placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                fieldErrors.password
                  ? "border-rose-400 focus:ring-rose-400 bg-rose-50/20"
                  : "border-slate-300 focus:border-teal-500 focus:ring-teal-500/20"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 transition-colors focus:outline-none"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {fieldErrors.password && (
            <p className="mt-1 text-xs text-rose-600 font-medium flex items-center gap-1">
              <span>{fieldErrors.password}</span>
            </p>
          )}
        </div>

        {/* Field 5: Confirm Password with Show/Hide Toggle */}
        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-xs sm:text-sm font-bold text-slate-900 mb-1.5"
          >
            Confirm Password <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-4 h-4" />
            </div>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              required
              disabled={isSubmitting}
              autoComplete="new-password"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Re-enter your password"
              className={`w-full pl-10 pr-11 py-2.5 sm:py-3 text-sm text-slate-900 bg-white rounded-xl border transition-all placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                fieldErrors.confirmPassword
                  ? "border-rose-400 focus:ring-rose-400 bg-rose-50/20"
                  : "border-slate-300 focus:border-teal-500 focus:ring-teal-500/20"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 transition-colors focus:outline-none"
              aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {fieldErrors.confirmPassword && (
            <p className="mt-1 text-xs text-rose-600 font-medium flex items-center gap-1">
              <span>{fieldErrors.confirmPassword}</span>
            </p>
          )}
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-5 rounded-xl font-bold text-sm text-white bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 active:scale-95 transition-all shadow-md shadow-teal-600/25 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creating Partner Account...</span>
              </>
            ) : (
              <>
                <span>Sign Up as Property Owner</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* Existing User Prompt */}
        <div className="pt-3 text-center border-t border-slate-100">
          <p className="text-xs sm:text-sm text-slate-600">
            Already have an account?{" "}
            <button
              type="button"
              onClick={onOpenSignIn}
              className="font-bold text-teal-600 hover:text-teal-700 hover:underline transition-colors focus:outline-none"
            >
              Sign In
            </button>
          </p>
        </div>
      </form>
    </div>
  );
}
