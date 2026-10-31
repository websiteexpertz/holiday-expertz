"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import {
  fetchOwnerPropertiesApi,
  PropertiesResponse,
} from "@/lib/propertyClient";
import { Property, PropertyDashboardStats } from "@backend/types/property";
import {
  Building2,
  CheckCircle2,
  Clock,
  XCircle,
  FileEdit,
  PlusCircle,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Eye,
  MapPin,
  Sparkles,
  Camera,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Loader2,
  RefreshCw,
} from "lucide-react";

export default function DashboardOverview() {
  const { owner } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [stats, setStats] = useState<PropertyDashboardStats>({
    total: 0,
    published: 0,
    pendingApproval: 0,
    rejected: 0,
    draft: 0,
  });

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res: PropertiesResponse = await fetchOwnerPropertiesApi();
      if (res.success) {
        setProperties(res.properties || []);
        if (res.stats) {
          setStats(res.stats);
        }
      }
    } catch (err) {
      console.error("Failed to load dashboard overview data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    fetchOwnerPropertiesApi().then((res) => {
      if (!isMounted) return;
      if (res.success) {
        setProperties(res.properties || []);
        if (res.stats) setStats(res.stats);
      }
      setLoading(false);
    }).catch((err) => {
      console.error("Failed to load overview data:", err);
      if (isMounted) setLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const getStatusBadge = (status: Property["status"]) => {
    switch (status) {
      case "approved":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Approved & Live
          </span>
        );
      case "pending_approval":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Under Audit
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            Needs Revision
          </span>
        );
      case "draft":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <FileEdit className="w-3.5 h-3.5 text-slate-500" />
            Draft
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* ── TOP HERO BANNER ── */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-slate-900 via-slate-800 to-teal-950 text-white p-6 sm:p-8 lg:p-10 shadow-xl border border-slate-700/50">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-64 h-64 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold tracking-wide border border-teal-500/30">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
              Verified HolidayExpertz Host Partner
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
              Welcome back,{" "}
              <span className="text-transparent bg-clip-text bg-linear-to-r from-teal-300 to-emerald-300">
                {owner?.fullName || "Property Partner"}
              </span>
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Track your property listings, monitor curation audits, manage reservations, and deliver world-class travel experiences across India.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => loadData(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/15 text-white font-medium text-sm rounded-xl transition-all border border-white/10 disabled:opacity-50"
              title="Refresh statistics"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <Link
              href="/dashboard/properties/new"
              className="inline-flex items-center gap-2 px-5 py-3 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-lg shadow-teal-500/25 hover:scale-[1.02] active:scale-[0.98]"
            >
              <PlusCircle className="w-4 h-4" />
              <span>List Your Property</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── STATS CARDS ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Portfolio Metrics</span>
            <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">Live sync</span>
          </h2>
          <Link
            href="/dashboard/properties"
            className="text-xs font-semibold text-teal-600 hover:text-teal-700 inline-flex items-center gap-1 group"
          >
            <span>View all listings</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
          {/* Total */}
          <Link
            href="/dashboard/properties"
            className="group p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-slate-300 hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500">Total Listings</span>
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center group-hover:bg-slate-200 transition-colors">
                <Building2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              {loading ? "-" : stats.total}
            </div>
            <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
              <span>All properties</span>
            </div>
          </Link>

          {/* Approved */}
          <Link
            href="/dashboard/properties?status=approved"
            className="group p-5 rounded-2xl bg-white border border-emerald-100/80 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-emerald-700">Approved & Live</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-700">
              {loading ? "-" : stats.published}
            </div>
            <div className="text-xs text-emerald-600/80 mt-1 flex items-center gap-1">
              <span>Bookable online</span>
            </div>
          </Link>

          {/* Pending */}
          <Link
            href="/dashboard/properties?status=pending_approval"
            className="group p-5 rounded-2xl bg-white border border-amber-100/80 shadow-xs hover:border-amber-300 hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-amber-700">In Verification</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-amber-700">
              {loading ? "-" : stats.pendingApproval}
            </div>
            <div className="text-xs text-amber-600/80 mt-1 flex items-center gap-1">
              <span>Audit in 24h</span>
            </div>
          </Link>

          {/* Rejected */}
          <Link
            href="/dashboard/properties?status=rejected"
            className="group p-5 rounded-2xl bg-white border border-rose-100/80 shadow-xs hover:border-rose-300 hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-rose-700">Needs Revision</span>
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center group-hover:bg-rose-100 transition-colors">
                <XCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-rose-700">
              {loading ? "-" : stats.rejected}
            </div>
            <div className="text-xs text-rose-600/80 mt-1 flex items-center gap-1">
              <span>Fix & resubmit</span>
            </div>
          </Link>

          {/* Drafts */}
          <Link
            href="/dashboard/properties?status=draft"
            className="group p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-slate-300 hover:shadow-md transition-all col-span-2 sm:col-span-1"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-600">Saved Drafts</span>
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center group-hover:bg-slate-200 transition-colors">
                <FileEdit className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-800">
              {loading ? "-" : stats.draft}
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <span>Ready to submit</span>
            </div>
          </Link>
        </div>
      </div>

      {/* ── RECENT PROPERTIES SECTION ── */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Your Recent Properties</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Review current listing statuses, preview media, or make instant updates.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/properties"
              className="text-xs font-bold text-teal-600 hover:text-teal-700 px-3 py-2 rounded-xl bg-teal-50 hover:bg-teal-100/70 transition-colors inline-flex items-center gap-1"
            >
              <span>Manage All ({properties.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-teal-600 mb-3" />
            <p className="text-sm">Loading your properties...</p>
          </div>
        ) : properties.length === 0 ? (
          <div className="p-12 text-center max-w-md mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-4 border border-teal-100">
              <Building2 className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">No properties listed yet</h3>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              Start by listing your first villa, resort, luxury hotel, or homestay. Once submitted, our team will audit and activate it within 24 hours.
            </p>
            <Link
              href="/dashboard/properties/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs rounded-xl shadow-md shadow-teal-600/20 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>List Your First Property</span>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {properties.slice(0, 4).map((prop) => {
              const coverImg = prop.images.find((i) => i.isCover)?.url || prop.images[0]?.url || "/placeholder-hotel.jpg";
              return (
                <div
                  key={prop.id}
                  className="p-5 sm:p-6 hover:bg-slate-50/70 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start sm:items-center gap-4">
                    {/* Thumbnail */}
                    <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                      <img
                        src={coverImg}
                        alt={prop.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=400&q=80";
                        }}
                      />
                      <span className="absolute bottom-1 right-1 text-[10px] font-bold bg-black/60 text-white px-1.5 py-0.5 rounded backdrop-blur-xs flex items-center gap-0.5">
                        <Camera className="w-2.5 h-2.5" />
                        {prop.images.length}
                      </span>
                    </div>

                    {/* Details */}
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md uppercase tracking-wider">
                          {prop.propertyType}
                        </span>
                        {getStatusBadge(prop.status)}
                      </div>
                      <h4 className="text-base font-bold text-slate-900 hover:text-teal-600 transition-colors">
                        <Link href={`/dashboard/properties/${prop.id}/edit`}>{prop.name}</Link>
                      </h4>
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>
                          {prop.location.city}, {prop.location.state}
                        </span>
                      </p>
                      <div className="text-xs font-semibold text-slate-700 pt-0.5">
                        ₹{prop.pricing.pricePerNight?.toLocaleString("en-IN") || 0}
                        <span className="text-slate-400 font-normal"> / night</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2.5 self-end md:self-center shrink-0">
                    {prop.status === "rejected" && (
                      <Link
                        href={`/dashboard/properties/${prop.id}/edit`}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-lg border border-rose-200 transition-colors flex items-center gap-1.5"
                      >
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Fix & Resubmit</span>
                      </Link>
                    )}
                    <Link
                      href={`/dashboard/properties/${prop.id}/edit`}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors"
                    >
                      Edit Listing
                    </Link>
                    <Link
                      href={`/dashboard/properties?view=${prop.id}`}
                      className="px-3.5 py-2 bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Preview</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── HOST SUCCESS GUIDELINES ── */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 tracking-tight mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-teal-600" />
          <span>Listing Success Handbook</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2">
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
              📸
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Professional Curation</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Upload at least 5 bright, daytime photographs showcasing suites, private washrooms, balconies, and outer architecture.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              ⚡
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Fast 24h Approval</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Ensure contact numbers and location pin codes are valid. Our safety team verifies every listing before taking it live to travelers.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              💎
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Transparent Pricing</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Include cleaning fees and standard occupancy to prevent guest surprises. High-rated hosts maintain 98%+ booking accuracy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
