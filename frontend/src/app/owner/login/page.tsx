"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { loginOwnerApi } from "@/lib/authClient";
import BrandLogo from "@/components/common/BrandLogo";
import {
  Building2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  Loader2,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

export default function OwnerLoginPage() {
  const router = useRouter();
  const { owner, login, isAuthenticated, isLoading: authLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already logged in as owner, redirect to host dashboard
  useEffect(() => {
    if (!authLoading && isAuthenticated && owner) {
      router.replace("/dashboard");
    }
  }, [authLoading, isAuthenticated, owner, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setErrorMessage("Please enter both your property owner email and password.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await loginOwnerApi({ email: cleanEmail, password });
      if (res.success && res.owner) {
        login(res.owner);
        setSuccessMessage(`Welcome back, ${res.owner.fullName}! Opening your host dashboard...`);
        setTimeout(() => {
          router.push("/dashboard");
        }, 600);
        return;
      }

      setErrorMessage(res.message || "Invalid email address or password for property owner.");
      setIsSubmitting(false);
    } catch {
      setErrorMessage("A network error occurred. Please check your connection and try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#071f1d] flex flex-col justify-between text-slate-100 font-editorial-sans relative overflow-hidden">
      {/* Background Ambience / Gradient Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-[#009F8D]/15 via-[#006F66]/10 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Top Navbar */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between">
        <BrandLogo variant="header" />
        <Link
          href="/"
          className="text-xs sm:text-sm text-white/80 hover:text-white transition-colors flex items-center gap-1.5"
        >
          <span>Back to Website</span>
        </Link>
      </header>

      {/* Main Login Card */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-md">
          {/* Card Header */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-[#006F66] to-[#009F8D] text-white flex items-center justify-center shadow-lg shadow-[#009F8D]/25 mb-4">
              <Building2 className="w-7 h-7" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#00c9b3] block mb-1">
              PROPERTY OWNER PORTAL
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Host Sign In
            </h1>
            <p className="text-xs sm:text-sm text-slate-300/80 mt-1.5 max-w-sm mx-auto">
              Sign in to manage your luxury properties, reservations, calendar, and host payouts.
            </p>
          </div>

          {/* Form Box */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
            {successMessage && (
              <div className="mb-5 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm flex items-center gap-3 animate-in fade-in">
                <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
                <span>{successMessage}</span>
              </div>
            )}

            {errorMessage && (
              <div className="mb-5 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs sm:text-sm flex items-start gap-3 animate-in fade-in">
                <AlertCircle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1.5">
                  Owner Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="host@luxuryestate.com"
                    required
                    disabled={isSubmitting}
                    className="w-full pl-10 pr-4 py-3 bg-slate-950/70 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#009F8D] focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1.5">
                  Owner Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your account password"
                    required
                    disabled={isSubmitting}
                    className="w-full pl-10 pr-11 py-3 bg-slate-950/70 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#009F8D] focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors p-1"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-[#006F66] to-[#009F8D] hover:from-[#005a53] hover:to-[#008979] active:scale-[0.99] transition-all shadow-lg shadow-[#009F8D]/30 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed mt-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing In to Host Dashboard...</span>
                  </>
                ) : (
                  <>
                    <Building2 className="w-4 h-4" />
                    <span>Sign In to Owner Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Prompt to register */}
            <div className="mt-6 pt-5 border-t border-slate-800 text-center">
              <p className="text-xs text-slate-400">
                Don&apos;t have a property owner account yet?{" "}
                <Link
                  href="/subscription#owner-registration"
                  className="font-bold text-[#00c9b3] hover:underline transition-colors"
                >
                  List Your Property
                </Link>
              </p>
            </div>
          </div>

          {/* Secure badge */}
          <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-slate-400">
            <ShieldCheck className="w-4 h-4 text-teal-400" />
            <span>Secure 256-bit Host Authentication</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full py-4 text-center text-xs text-slate-400 border-t border-white/5">
        <p>&copy; 2026 Holiday Expertz. All rights reserved.</p>
      </footer>
    </div>
  );
}
