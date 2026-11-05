"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Compass,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Luggage,
  ShieldCheck,
  Edit3,
  Save,
  X,
  ArrowRight,
  LogOut,
  Building,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AuthModal from "@/components/layout/AuthModal";
import { useAuth } from "@/context/AuthContext";
import { getTravellerBookingsApi } from "@/lib/authClient";

interface BookingItem {
  id: string;
  bookingReference: string;
  propertyId: string;
  propertyName: string;
  propertyCoverImage?: string;
  propertyCity?: string;
  checkInDate: string;
  checkOutDate: string;
  guests: number;
  totalAmount: number;
  currency: string;
  bookingStatus: string;
  paymentStatus: string;
  specialRequests?: string;
  createdAt: string;
}

function TravellerDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { traveller, isAuthenticated, isLoading, logout, updateTraveller } = useAuth();

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "bookings">("profile");

  // Edit Profile form state
  const [isEditing, setIsEditing] = useState(false);
  const [editFullName, setEditFullName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editCountry, setEditCountry] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Bookings state
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);

  // Sync tab from query param
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "bookings") {
      setActiveTab("bookings");
    }
  }, [searchParams]);

  // Sync profile form state when traveller changes
  useEffect(() => {
    if (traveller) {
      setEditFullName(traveller.fullName || "");
      setEditPhone(traveller.phone || "");
      setEditCity(traveller.city || "");
      setEditCountry(traveller.country || "India");
    }
  }, [traveller]);

  // Fetch traveller bookings
  useEffect(() => {
    if (!traveller) return;
    let isMounted = true;
    setIsLoadingBookings(true);

    getTravellerBookingsApi(traveller.id, traveller.email)
      .then((res) => {
        if (!isMounted) return;
        if (res.success && Array.isArray(res.bookings)) {
          setBookings(res.bookings);
        }
      })
      .catch((err) => {
        console.warn("Error fetching traveller bookings:", err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingBookings(false);
      });

    return () => {
      isMounted = false;
    };
  }, [traveller]);

  // Handle Profile Save
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!traveller || isSaving) return;

    if (!editFullName.trim()) {
      setFeedbackMessage({ type: "error", text: "Full name cannot be empty." });
      return;
    }

    setIsSaving(true);
    setFeedbackMessage(null);

    const res = await updateTraveller({
      fullName: editFullName.trim(),
      phone: editPhone.trim(),
      city: editCity.trim(),
      country: editCountry.trim(),
    });

    setIsSaving(false);
    if (res.success) {
      setFeedbackMessage({ type: "success", text: "Your basic information has been updated!" });
      setIsEditing(false);
    } else {
      setFeedbackMessage({ type: "error", text: res.message || "Failed to update profile." });
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  // If loading authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex flex-col justify-between">
        <Header onOpenAuthModal={() => setAuthModalOpen(true)} />
        <div className="flex-1 flex items-center justify-center pt-28 pb-16">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-3 border-teal-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-semibold text-slate-500 font-editorial-sans">
              Loading your traveller dashboard...
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // If not logged in as traveller
  if (!isAuthenticated || !traveller) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex flex-col justify-between font-editorial-sans">
        <Header onOpenAuthModal={() => setAuthModalOpen(true)} />

        <main className="flex-1 max-w-xl mx-auto px-4 pt-32 pb-20 text-center flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-3xl bg-teal-50 border border-teal-200 text-[#009F8D] flex items-center justify-center mb-5 shadow-sm">
            <Luggage className="w-8 h-8" />
          </div>

          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#009F8D] mb-1">
            TRAVELLER ACCESS
          </span>
          <h1 className="font-editorial-serif text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight mb-3">
            Sign In to View Your Dashboard
          </h1>
          <p className="text-sm text-slate-600 max-w-md mx-auto mb-8 leading-relaxed font-light">
            Access your personal basic information, manage upcoming luxury stays, and explore reserved holiday memories.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-sm">
            <button
              type="button"
              onClick={() => setAuthModalOpen(true)}
              className="w-full py-3 px-6 rounded-2xl bg-[#009F8D] hover:bg-[#007F70] text-white font-bold text-sm shadow-md shadow-[#009F8D]/25 transition-all cursor-pointer"
            >
              Sign In / Register as Traveller
            </button>
            <Link
              href="/"
              className="w-full py-3 px-6 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-sm transition-all text-center"
            >
              Return Home
            </Link>
          </div>
        </main>

        <Footer />
        <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBFBFA] flex flex-col justify-between font-editorial-sans text-slate-900">
      <Header onOpenAuthModal={() => setAuthModalOpen(true)} />

      <main className="flex-1 pt-28 sm:pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* Welcome Hero Banner */}
        <div className="bg-gradient-to-r from-[#071f1d] via-[#092723] to-[#0d342f] rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden mb-8 border border-[#133d38]">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#009F8D]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4 sm:gap-5">
              {/* Avatar */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-[#006F66] to-[#009F8D] text-white flex items-center justify-center text-xl sm:text-2xl font-bold shadow-md shadow-[#009F8D]/30 border-2 border-white/20 shrink-0">
                {traveller.fullName ? traveller.fullName.charAt(0).toUpperCase() : "T"}
              </div>

              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-emerald-300 text-[10px] font-bold uppercase tracking-[0.2em] mb-2">
                  <Sparkles className="w-3 h-3 text-emerald-300" />
                  <span>HOLIDAY EXPERTZ TRAVELLER</span>
                </div>
                <h1 className="font-editorial-serif text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white">
                  Welcome, {traveller.fullName}
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 mt-1 font-light">
                  {traveller.email} &bull; Member since{" "}
                  {new Date(traveller.createdAt || Date.now()).toLocaleDateString("en-IN", {
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/properties"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#009F8D] hover:bg-[#008777] text-white font-bold text-xs transition-colors shadow-sm"
              >
                <Compass className="w-4 h-4" />
                <span>Explore Stays</span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-rose-950/40 hover:text-rose-300 border border-white/15 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
                title="Sign out of traveller account"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 mt-6 border-t border-white/10">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-3 border border-white/5">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-semibold">
                Total Bookings
              </span>
              <span className="text-xl sm:text-2xl font-bold text-white mt-0.5 block">
                {bookings.length}
              </span>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-3 border border-white/5">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-semibold">
                Confirmed Trips
              </span>
              <span className="text-xl sm:text-2xl font-bold text-emerald-300 mt-0.5 block">
                {bookings.filter((b) => b.bookingStatus === "confirmed").length}
              </span>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-3 border border-white/5">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-semibold">
                Account Status
              </span>
              <span className="text-sm sm:text-base font-bold text-white mt-1 inline-flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="capitalize">{traveller.status || "Active"}</span>
              </span>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-3 border border-white/5">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-semibold">
                Member Tier
              </span>
              <span className="text-sm sm:text-base font-bold text-teal-300 mt-1 block">
                Gold Traveller
              </span>
            </div>
          </div>
        </div>

        {/* Dashboard Navigation Tabs */}
        <div className="flex items-center gap-3 border-b border-slate-200 mb-8 pb-1">
          <button
            type="button"
            onClick={() => setActiveTab("profile")}
            className={`pb-3 px-2 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === "profile"
                ? "border-[#009F8D] text-[#006F66]"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <User className="w-4 h-4" />
            <span>Basic Information</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("bookings")}
            className={`pb-3 px-2 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === "bookings"
                ? "border-[#009F8D] text-[#006F66]"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <Luggage className="w-4 h-4" />
            <span>My Trips &amp; Bookings</span>
            {bookings.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#E7F6F3] text-[#006F66] border border-[#85D4C3]/60">
                {bookings.length}
              </span>
            )}
          </button>
        </div>

        {/* Feedback Alert */}
        {feedbackMessage && (
          <div
            className={`mb-6 p-4 rounded-2xl text-xs sm:text-sm font-medium flex items-center gap-3 animate-in fade-in ${
              feedbackMessage.type === "success"
                ? "bg-emerald-50 border border-emerald-200 text-emerald-900"
                : "bg-rose-50 border border-rose-200 text-rose-900"
            }`}
          >
            {feedbackMessage.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span>{feedbackMessage.text}</span>
          </div>
        )}

        {/* ── TAB 1: BASIC INFORMATION ─────────────────────────────────────── */}
        {activeTab === "profile" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left 2 Cols: Basic Details Card & Edit Form */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
                <div className="flex items-center justify-between pb-5 border-b border-slate-100 mb-6">
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                      Personal Details
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Your registered details used for reservation guarantees and booking confirmations.
                    </p>
                  </div>

                  {!isEditing ? (
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#F2FAF7] hover:bg-[#E4F5EF] text-[#006F66] text-xs font-bold border border-[#BDE8DE] transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Info</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        setEditFullName(traveller.fullName || "");
                        setEditPhone(traveller.phone || "");
                        setEditCity(traveller.city || "");
                        setEditCountry(traveller.country || "India");
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-slate-500 hover:text-slate-800 text-xs font-semibold cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Cancel</span>
                    </button>
                  )}
                </div>

                {!isEditing ? (
                  /* VIEW MODE */
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Full Name
                      </span>
                      <p className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                        <User className="w-4 h-4 text-[#009F8D]" />
                        <span>{traveller.fullName || "Not provided"}</span>
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Email Address
                      </span>
                      <p className="text-sm sm:text-base font-semibold text-slate-900 flex items-center gap-2">
                        <Mail className="w-4 h-4 text-[#009F8D]" />
                        <span>{traveller.email}</span>
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Contact Phone
                      </span>
                      <p className="text-sm sm:text-base font-semibold text-slate-900 flex items-center gap-2">
                        <Phone className="w-4 h-4 text-[#009F8D]" />
                        <span>{traveller.phone || "Not provided"}</span>
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Location / City
                      </span>
                      <p className="text-sm sm:text-base font-semibold text-slate-900 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-[#009F8D]" />
                        <span>
                          {[traveller.city, traveller.country].filter(Boolean).join(", ") ||
                            "Not provided"}
                        </span>
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Account Registered On
                      </span>
                      <p className="text-sm font-medium text-slate-600 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span>
                          {new Date(traveller.createdAt || Date.now()).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </span>
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Account ID
                      </span>
                      <p className="text-xs font-mono text-slate-500 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200/60 inline-block">
                        {traveller.id}
                      </p>
                    </div>
                  </div>
                ) : (
                  /* EDIT MODE FORM */
                  <form onSubmit={handleSaveProfile} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={editFullName}
                          onChange={(e) => setEditFullName(e.target.value)}
                          placeholder="Your full name"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#009F8D]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value)}
                          placeholder="+91 98765 43210"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#009F8D]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          City
                        </label>
                        <input
                          type="text"
                          value={editCity}
                          onChange={(e) => setEditCity(e.target.value)}
                          placeholder="e.g. New Delhi"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#009F8D]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Country
                        </label>
                        <input
                          type="text"
                          value={editCountry}
                          onChange={(e) => setEditCountry(e.target.value)}
                          placeholder="e.g. India"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#009F8D]"
                        />
                      </div>
                    </div>

                    <div className="pt-4 flex items-center gap-3">
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#009F8D] hover:bg-[#007F70] text-white font-bold text-xs transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                      >
                        <Save className="w-4 h-4" />
                        <span>{isSaving ? "Saving..." : "Save Basic Info"}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Host / Owner Promotion Card */}
              <div className="p-6 rounded-3xl bg-[#F2FAF7] border border-[#BDE8DE] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-white border border-[#BDE8DE] flex items-center justify-center text-[#009F8D] shadow-xs shrink-0">
                    <Building className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#006F66]">
                      Own a luxury property, villa, or boutique stay?
                    </h3>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Join HolidayExpertz as a Verified Host and welcome travellers from across the globe.
                    </p>
                  </div>
                </div>

                <Link
                  href="/subscription#owner-registration"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#009F8D] hover:bg-[#007F70] text-white text-xs font-bold transition-colors shadow-xs whitespace-nowrap"
                >
                  <span>List Your Property</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Right Column: Security & Preferences */}
            <div className="space-y-6">
              {/* Account Security Card */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-[#009F8D]" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Account Security
                  </h3>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Your profile and booking history are safeguarded with enterprise-grade encryption.
                </p>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-[11px] font-bold text-slate-700 block">
                    Verified Email
                  </span>
                  <span className="text-xs text-slate-500 block truncate">
                    {traveller.email}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-[11px] font-bold text-slate-700 block">
                    Privacy Protection
                  </span>
                  <span className="text-xs text-slate-500 block">
                    Contact details are only shared with hosts upon confirmed reservation.
                  </span>
                </div>
              </div>

              {/* Concierge Support Card */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#009F8D] block">
                  24/7 DEDICATED CONCIERGE
                </span>
                <h3 className="text-sm font-bold text-slate-900">
                  Need Help With a Trip?
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Our personal holiday specialists are available around the clock to tailor your itinerary.
                </p>
                <Link
                  href="/#contact"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#006F66] hover:text-[#009F8D] transition-colors"
                >
                  <span>Contact Holiday Concierge</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 2: MY TRIPS & BOOKINGS ───────────────────────────────────── */}
        {activeTab === "bookings" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  My Trips &amp; Reservations
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  View and manage your upcoming stays, itinerary receipts, and check-in details.
                </p>
              </div>

              <Link
                href="/properties"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#009F8D] hover:bg-[#007F70] text-white text-xs font-bold transition-colors shadow-xs"
              >
                <span>Book a New Stay</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {isLoadingBookings ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/80">
                <div className="w-8 h-8 border-2 border-[#009F8D] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs text-slate-500">Loading your reservations...</p>
              </div>
            ) : bookings.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 sm:p-14 border border-slate-200/80 text-center space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-teal-50 border border-teal-200 text-[#009F8D] flex items-center justify-center mx-auto shadow-xs">
                  <Luggage className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  No reservations yet
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                  You haven&apos;t booked any luxury retreats or heritage palace stays yet. Browse our handpicked collection and begin your next adventure!
                </p>
                <div className="pt-2">
                  <Link
                    href="/properties"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#009F8D] hover:bg-[#007F70] text-white text-xs font-bold transition-colors shadow-md shadow-[#009F8D]/25"
                  >
                    <Compass className="w-4 h-4" />
                    <span>Discover Handpicked Properties</span>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow flex flex-col md:flex-row items-start md:items-center justify-between gap-5"
                  >
                    <div className="flex items-center gap-4 sm:gap-5 min-w-0">
                      {booking.propertyCoverImage ? (
                        <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden shrink-0 shadow-xs bg-slate-100">
                          <Image
                            src={booking.propertyCoverImage}
                            alt={booking.propertyName}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-teal-50 border border-teal-200 text-[#009F8D] flex items-center justify-center shrink-0">
                          <Building className="w-8 h-8" />
                        </div>
                      )}

                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {booking.bookingStatus}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            Ref: {booking.bookingReference}
                          </span>
                        </div>

                        <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                          {booking.propertyName}
                        </h3>

                        {booking.propertyCity && (
                          <p className="text-xs text-slate-500 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-[#009F8D]" />
                            <span>{booking.propertyCity}</span>
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-600">
                          <span className="flex items-center gap-1 font-medium">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>
                              {booking.checkInDate} &rarr; {booking.checkOutDate}
                            </span>
                          </span>
                          <span>&bull;</span>
                          <span>{booking.guests} Guests</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex md:flex-col items-center md:items-end justify-between w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 gap-2">
                      <div className="text-left md:text-right">
                        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">
                          Total Paid
                        </span>
                        <span className="text-base sm:text-lg font-bold text-slate-900">
                          ₹{booking.totalAmount?.toLocaleString("en-IN") || 0}
                        </span>
                      </div>

                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                        Payment: {booking.paymentStatus || "Paid"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </div>
  );
}

export default function TravellerDashboardPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#009F8D] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <TravellerDashboardContent />
    </React.Suspense>
  );
}
