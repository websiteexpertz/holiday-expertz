"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  fetchOwnerPropertiesApi,
  deletePropertyApi,
  moderatePropertyApi,
} from "@/lib/propertyClient";
import { Property, PropertyStatus, PropertyTypeCategory } from "@backend/types/property";
import {
  Building2,
  Search,
  Filter,
  PlusCircle,
  Clock,
  CheckCircle2,
  XCircle,
  FileEdit,
  Trash2,
  Eye,
  Edit,
  MapPin,
  Camera,
  Users,
  Bed,
  Bath,
  IndianRupee,
  MoreVertical,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  ChevronDown,
  LayoutGrid,
  List,
  ShieldAlert,
  ShieldCheck,
  Check,
  X,
  ExternalLink,
} from "lucide-react";

const PROPERTY_TYPES: PropertyTypeCategory[] = [
  "Luxury Hotels",
  "Resorts",
  "Villas",
  "Homestays",
  "Palace Stays",
  "Boutique Stays",
  "Guesthouses",
  "Apartments",
];

export default function PropertyList() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialStatus = searchParams.get("status") || "all";
  const previewIdFromUrl = searchParams.get("view");

  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters & Sorting
  const [searchTerm, setSearchTerm] = useState("");
  const statusFilter = searchParams.get("status") || "all";
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "price_asc" | "price_desc" | "name">("newest");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  // Modals state
  const [previewProperty, setPreviewProperty] = useState<Property | null>(null);
  const [previewActiveImageIdx, setPreviewActiveImageIdx] = useState(0);
  const [deletePropertyTarget, setDeletePropertyTarget] = useState<Property | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Admin simulation modal
  const [moderationTarget, setModerationTarget] = useState<Property | null>(null);
  const [moderationStatus, setModerationStatus] = useState<"approved" | "rejected">("approved");
  const [rejectionReasonInput, setRejectionReasonInput] = useState("");
  const [isModerating, setIsModerating] = useState(false);

  // Action toast / alert
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Load properties
  const loadProperties = async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await fetchOwnerPropertiesApi();
      if (res.success && res.properties) {
        setProperties(res.properties);

        // Check if a view ID was passed in query
        if (previewIdFromUrl) {
          const target = res.properties.find((p) => p.id === previewIdFromUrl);
          if (target) setPreviewProperty(target);
        }
      }
    } catch (err) {
      console.error("Failed to load properties:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    fetchOwnerPropertiesApi().then((res) => {
      if (!isMounted) return;
      if (res.success && res.properties) {
        setProperties(res.properties);
        if (previewIdFromUrl) {
          const target = res.properties.find((p) => p.id === previewIdFromUrl);
          if (target) setPreviewProperty(target);
        }
      }
      setLoading(false);
    }).catch(() => {
      if (isMounted) setLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [previewIdFromUrl]);

  // Filtered & Sorted properties
  const filteredProperties = useMemo(() => {
    return properties
      .filter((p) => {
        // Status filter
        if (statusFilter !== "all" && p.status !== statusFilter) {
          return false;
        }
        // Type filter
        if (typeFilter !== "all" && p.propertyType !== typeFilter) {
          return false;
        }
        // Search query
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matchName = p.name.toLowerCase().includes(q);
          const matchCity = p.location.city.toLowerCase().includes(q);
          const matchState = p.location.state.toLowerCase().includes(q);
          const matchAddress = p.location.address?.toLowerCase().includes(q);
          if (!matchName && !matchCity && !matchState && !matchAddress) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "newest":
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          case "oldest":
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          case "price_asc":
            return (a.pricing?.pricePerNight || 0) - (b.pricing?.pricePerNight || 0);
          case "price_desc":
            return (b.pricing?.pricePerNight || 0) - (a.pricing?.pricePerNight || 0);
          case "name":
            return a.name.localeCompare(b.name);
          default:
            return 0;
        }
      });
  }, [properties, statusFilter, typeFilter, searchTerm, sortBy]);

  // Delete handler
  const handleDeleteConfirm = async () => {
    if (!deletePropertyTarget) return;
    setIsDeleting(true);
    try {
      const res = await deletePropertyApi(deletePropertyTarget.id);
      if (res.success) {
        setFeedbackMessage({ type: "success", text: "Property listing removed successfully." });
        setDeletePropertyTarget(null);
        await loadProperties(true);
      } else {
        setFeedbackMessage({ type: "error", text: res.message || "Failed to delete property." });
      }
    } catch {
      setFeedbackMessage({ type: "error", text: "An error occurred while deleting." });
    } finally {
      setIsDeleting(false);
    }
  };

  // Moderation simulation handler
  const handleModerateSubmit = async () => {
    if (!moderationTarget) return;
    setIsModerating(true);
    try {
      const res = await moderatePropertyApi(
        moderationTarget.id,
        moderationStatus,
        moderationStatus === "rejected" ? rejectionReasonInput || "Listing missing required photos and government registry ID." : undefined
      );

      if (res.success) {
        setFeedbackMessage({
          type: "success",
          text: `Status updated to ${moderationStatus === "approved" ? "Approved & Live" : "Rejected"} successfully!`,
        });
        setModerationTarget(null);
        await loadProperties(true);
      } else {
        setFeedbackMessage({ type: "error", text: res.message || "Moderation update failed." });
      }
    } catch {
      setFeedbackMessage({ type: "error", text: "Failed to update moderation status." });
    } finally {
      setIsModerating(false);
    }
  };

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

  const statusCounts = useMemo(() => {
    return {
      all: properties.length,
      approved: properties.filter((p) => p.status === "approved").length,
      pending_approval: properties.filter((p) => p.status === "pending_approval").length,
      rejected: properties.filter((p) => p.status === "rejected").length,
      draft: properties.filter((p) => p.status === "draft").length,
    };
  }, [properties]);

  return (
    <div className="space-y-6 pb-16">
      {/* ── HEADER & CTA ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            My Properties
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage, edit, preview, and track curation approvals for all your properties across India.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadProperties(true)}
            disabled={refreshing}
            className="p-2.5 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-xl transition-all shadow-xs"
            title="Refresh listings"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-teal-600" : ""}`} />
          </button>

          <Link
            href="/dashboard/properties/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md shadow-teal-600/20 hover:scale-[1.02]"
          >
            <PlusCircle className="w-4 h-4" />
            <span>List Your Property</span>
          </Link>
        </div>
      </div>

      {/* ── NOTIFICATION TOAST ── */}
      {feedbackMessage && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between text-xs sm:text-sm font-medium ${
            feedbackMessage.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            )}
            <span>{feedbackMessage.text}</span>
          </div>
          <button
            onClick={() => setFeedbackMessage(null)}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── STATUS TABS ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-slate-200">
        {[
          { key: "all", label: "All Properties", count: statusCounts.all },
          { key: "approved", label: "Approved & Live", count: statusCounts.approved },
          { key: "pending_approval", label: "In Verification", count: statusCounts.pending_approval },
          { key: "rejected", label: "Needs Revision", count: statusCounts.rejected },
          { key: "draft", label: "Drafts", count: statusCounts.draft },
        ].map((tab) => {
          const isActive = statusFilter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => {
                const params = new URLSearchParams(window.location.search);
                if (tab.key === "all") params.delete("status");
                else params.set("status", tab.key);
                router.replace(`/dashboard/properties?${params.toString()}`);
              }}
              className={`pb-3 px-3 text-xs sm:text-sm font-semibold whitespace-nowrap transition-all border-b-2 flex items-center gap-2 ${
                isActive
                  ? "border-teal-600 text-teal-700"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                  isActive ? "bg-teal-100 text-teal-800" : "bg-slate-100 text-slate-600"
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── SEARCH, FILTER & VIEW CONTROLS ── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search properties by name, city, locality..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filters and View mode */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Type filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
          >
            <option value="all">All Stay Types</option>
            {PROPERTY_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) =>
              setSortBy(
                e.target.value as "newest" | "oldest" | "price_asc" | "price_desc" | "name"
              )
            }
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="name">Name (A-Z)</option>
          </select>

          {/* List/Grid View Switch */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === "list"
                  ? "bg-white text-teal-700 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
              title="List view (Default)"
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">List</span>
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === "grid"
                  ? "bg-white text-teal-700 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
              title="Grid view"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Grid</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── CONTENT AREA ── */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin text-teal-600 mb-3" />
          <p className="text-sm font-medium">Loading your listings...</p>
        </div>
      ) : filteredProperties.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center max-w-lg mx-auto shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">No matching properties</h3>
          <p className="text-xs sm:text-sm text-slate-500 mb-6 leading-relaxed">
            {searchTerm || statusFilter !== "all" || typeFilter !== "all"
              ? "We couldn't find any properties matching your current filter criteria. Try resetting your search or filters."
              : "You haven't listed any properties yet. Start your journey with HolidayExpertz by adding your luxury stay today."}
          </p>
          {searchTerm || statusFilter !== "all" || typeFilter !== "all" ? (
            <button
              onClick={() => {
                setSearchTerm("");
                setTypeFilter("all");
                router.replace("/dashboard/properties");
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-all"
            >
              Reset Filters
            </button>
          ) : (
            <Link
              href="/dashboard/properties/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl shadow-md shadow-teal-600/20"
            >
              <PlusCircle className="w-4 h-4" />
              <span>List Your First Property</span>
            </Link>
          )}
        </div>
      ) : viewMode === "grid" ? (
        /* ── GRID VIEW ── */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProperties.map((prop) => {
            const coverImg =
              prop.images.find((i) => i.isCover)?.url ||
              prop.images[0]?.url ||
              "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80";

            return (
              <div
                key={prop.id}
                className="group bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
              >
                <div>
                  {/* Image Container */}
                  <div className="relative h-48 sm:h-52 bg-slate-100 overflow-hidden">
                    <img
                      src={coverImg}
                      alt={prop.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80";
                      }}
                    />
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 items-center">
                      <span className="text-[10px] font-black uppercase tracking-wider bg-slate-900/80 text-white px-2.5 py-1 rounded-md backdrop-blur-xs">
                        {prop.propertyType}
                      </span>
                    </div>

                    <div className="absolute top-3 right-3">{getStatusBadge(prop.status)}</div>

                    <div className="absolute bottom-3 left-3 text-white text-xs font-semibold bg-black/60 backdrop-blur-xs px-2.5 py-1 rounded-md flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5" />
                      <span>{prop.images.length} Photos</span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-3">
                    <div>
                      <h3 className="font-bold text-slate-900 text-base line-clamp-1 group-hover:text-teal-600 transition-colors">
                        {prop.name}
                      </h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">
                          {prop.location.locality ? `${prop.location.locality}, ` : ""}
                          {prop.location.city}, {prop.location.state}
                        </span>
                      </p>
                    </div>

                    {/* Rejection notice if any */}
                    {prop.status === "rejected" && prop.rejectionReason && (
                      <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-rose-800 text-xs">
                        <div className="font-bold flex items-center gap-1 mb-1 text-rose-900">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                          <span>Audit Feedback</span>
                        </div>
                        <p className="line-clamp-2 leading-relaxed">{prop.rejectionReason}</p>
                      </div>
                    )}

                    {/* Capacity Specs */}
                    <div className="flex items-center gap-3 pt-2 text-xs text-slate-600 border-t border-slate-100">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        {prop.capacity.maxGuests} Guests
                      </span>
                      <span className="flex items-center gap-1">
                        <Bed className="w-3.5 h-3.5 text-slate-400" />
                        {prop.capacity.bedrooms} Beds
                      </span>
                      <span className="flex items-center gap-1">
                        <Bath className="w-3.5 h-3.5 text-slate-400" />
                        {prop.capacity.bathrooms} Baths
                      </span>
                    </div>

                    {/* Pricing */}
                    <div className="flex items-baseline justify-between pt-1">
                      <div>
                        <span className="text-lg font-black text-slate-900">
                          ₹{prop.pricing.pricePerNight?.toLocaleString("en-IN") || 0}
                        </span>
                        <span className="text-xs text-slate-500"> / night</span>
                      </div>

                      {prop.pricing.originalPrice && prop.pricing.originalPrice > prop.pricing.pricePerNight && (
                        <span className="text-xs text-slate-400 line-through">
                          ₹{prop.pricing.originalPrice.toLocaleString("en-IN")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        setPreviewProperty(prop);
                        setPreviewActiveImageIdx(0);
                      }}
                      className="p-2 text-slate-600 hover:text-teal-600 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200"
                      title="Quick Preview"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <Link
                      href={`/dashboard/properties/${prop.id}/edit`}
                      className="p-2 text-slate-600 hover:text-teal-600 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200"
                      title="Edit Listing"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => setDeletePropertyTarget(prop)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete Property"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Admin Simulation Button (For Evaluation & Testing) */}
                    <button
                      onClick={() => {
                        setModerationTarget(prop);
                        setModerationStatus(prop.status === "approved" ? "rejected" : "approved");
                        setRejectionReasonInput(prop.rejectionReason || "");
                      }}
                      className="text-[11px] font-semibold px-2.5 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors flex items-center gap-1"
                      title="Simulate Admin Approval/Rejection"
                    >
                      <ShieldAlert className="w-3 h-3 text-slate-500" />
                      <span>Audit Sim</span>
                    </button>

                    {prop.status === "rejected" ? (
                      <Link
                        href={`/dashboard/properties/${prop.id}/edit`}
                        className="text-xs font-bold px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition-colors shadow-xs"
                      >
                        Resubmit
                      </Link>
                    ) : (
                      <Link
                        href={`/dashboard/properties/${prop.id}/edit`}
                        className="text-xs font-semibold px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-lg transition-colors"
                      >
                        Manage
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── LIST VIEW (Default: Full-Width Horizontal Rows) ── */
        <div className="space-y-4">
          {filteredProperties.map((prop) => {
            const coverImg =
              prop.images.find((i) => i.isCover)?.url ||
              prop.images[0]?.url ||
              "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80";

            return (
              <div
                key={prop.id}
                className="group bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:border-slate-300 hover:shadow-md transition-all p-4 sm:p-5 flex flex-col md:flex-row gap-4 sm:gap-5 items-start md:items-center justify-between"
              >
                {/* ── LEFT: Property Image Thumbnail ── */}
                <div className="relative w-full sm:w-56 md:w-64 h-44 sm:h-48 md:h-40 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                  <img
                    src={coverImg}
                    alt={prop.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80";
                    }}
                  />
                  <div className="absolute top-2.5 left-2.5">
                    <span className="text-[10px] font-black uppercase tracking-wider bg-slate-900/80 text-white px-2 py-0.5 rounded-md backdrop-blur-xs">
                      {prop.propertyType}
                    </span>
                  </div>

                  <div className="absolute bottom-2.5 left-2.5 text-white text-[11px] font-semibold bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded-md flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5" />
                    <span>{prop.images.length} Photos</span>
                  </div>
                </div>

                {/* ── MIDDLE: Property Details ── */}
                <div className="flex-1 min-w-0 space-y-2 w-full">
                  {/* Status & Type Badges */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {getStatusBadge(prop.status)}
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {prop.propertyType}
                    </span>
                  </div>

                  {/* Property Name */}
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-teal-600 transition-colors line-clamp-1">
                    <Link href={`/dashboard/properties/${prop.id}/edit`}>
                      {prop.name}
                    </Link>
                  </h3>

                  {/* Location */}
                  <p className="text-xs text-slate-500 flex items-center gap-1.5 truncate">
                    <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    <span className="truncate">
                      {prop.location.locality ? `${prop.location.locality}, ` : ""}
                      {prop.location.city}, {prop.location.state}
                    </span>
                  </p>

                  {/* Rejection Notice if any */}
                  {prop.status === "rejected" && prop.rejectionReason && (
                    <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-200 text-rose-800 text-xs">
                      <div className="font-bold flex items-center gap-1 mb-0.5 text-rose-900">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                        <span>Audit Feedback</span>
                      </div>
                      <p className="line-clamp-2 leading-relaxed text-[11px]">{prop.rejectionReason}</p>
                    </div>
                  )}

                  {/* Capacity Specs & Pricing Row */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-1 text-xs text-slate-600">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>{prop.capacity.maxGuests} Guests</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Bed className="w-3.5 h-3.5 text-slate-400" />
                      <span>{prop.capacity.bedrooms} Beds</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Bath className="w-3.5 h-3.5 text-slate-400" />
                      <span>{prop.capacity.bathrooms} Baths</span>
                    </span>
                    <span className="text-slate-300">•</span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-sm sm:text-base font-black text-slate-900">
                        ₹{prop.pricing.pricePerNight?.toLocaleString("en-IN") || 0}
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">/ night</span>
                      {prop.pricing.originalPrice && prop.pricing.originalPrice > prop.pricing.pricePerNight && (
                        <span className="text-[11px] text-slate-400 line-through ml-1">
                          ₹{prop.pricing.originalPrice.toLocaleString("en-IN")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── RIGHT: Property Actions ── */}
                <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center gap-2.5 w-full md:w-auto shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                  <div className="flex items-center gap-1.5">
                    {/* View Live Property Details (if approved) */}
                    {prop.status === "approved" && (
                      <Link
                        href={`/properties/${prop.id}`}
                        target="_blank"
                        className="p-2 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-xl transition-colors border border-transparent hover:border-teal-200"
                        title="View Public Details Page"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    )}

                    {/* Preview Modal Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewProperty(prop);
                        setPreviewActiveImageIdx(0);
                      }}
                      className="p-2 text-slate-600 hover:text-teal-600 hover:bg-slate-50 rounded-xl transition-colors border border-slate-200"
                      title="Quick Preview"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    {/* Edit Property Button */}
                    <Link
                      href={`/dashboard/properties/${prop.id}/edit`}
                      className="p-2 text-slate-600 hover:text-teal-600 hover:bg-slate-50 rounded-xl transition-colors border border-slate-200"
                      title="Edit Listing"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>

                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={() => setDeletePropertyTarget(prop)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors border border-transparent hover:border-rose-200"
                      title="Delete Listing"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Primary Action Buttons */}
                  <div className="flex items-center gap-2">
                    {/* Admin Simulation Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setModerationTarget(prop);
                        setModerationStatus(prop.status === "approved" ? "rejected" : "approved");
                        setRejectionReasonInput(prop.rejectionReason || "");
                      }}
                      className="text-[11px] font-semibold px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1 border border-slate-200"
                      title="Simulate Admin Approval/Rejection"
                    >
                      <ShieldAlert className="w-3.5 h-3.5 text-slate-500" />
                      <span>Audit Sim</span>
                    </button>

                    {prop.status === "rejected" ? (
                      <Link
                        href={`/dashboard/properties/${prop.id}/edit`}
                        className="text-xs font-bold px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl transition-all shadow-xs"
                      >
                        Resubmit
                      </Link>
                    ) : (
                      <Link
                        href={`/dashboard/properties/${prop.id}/edit`}
                        className="text-xs font-bold px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl transition-all shadow-xs"
                      >
                        Manage
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── PREVIEW MODAL ── */}
      {previewProperty && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-teal-700 bg-teal-100 px-2.5 py-0.5 rounded-md uppercase">
                  {previewProperty.propertyType}
                </span>
                {getStatusBadge(previewProperty.status)}
              </div>
              <button
                onClick={() => setPreviewProperty(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Photo Showcase */}
              <div className="space-y-3">
                <div className="relative h-64 sm:h-80 rounded-2xl overflow-hidden bg-slate-900 border border-slate-200">
                  <img
                    src={
                      previewProperty.images[previewActiveImageIdx]?.url ||
                      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1000&q=80"
                    }
                    alt={previewProperty.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1000&q=80";
                    }}
                  />
                  {previewProperty.images[previewActiveImageIdx]?.caption && (
                    <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-xs text-white text-xs px-3 py-1.5 rounded-lg">
                      {previewProperty.images[previewActiveImageIdx].caption}
                    </div>
                  )}
                </div>

                {previewProperty.images.length > 1 && (
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {previewProperty.images.map((img, idx) => (
                      <button
                        key={img.id || idx}
                        onClick={() => setPreviewActiveImageIdx(idx)}
                        className={`relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                          previewActiveImageIdx === idx ? "border-teal-600 scale-105" : "border-transparent opacity-70 hover:opacity-100"
                        }`}
                      >
                        <img src={img.url} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Title & Location */}
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                  {previewProperty.name}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 flex items-center gap-1 mt-1">
                  <MapPin className="w-4 h-4 text-teal-600" />
                  <span>
                    {previewProperty.location.address}, {previewProperty.location.locality},{" "}
                    {previewProperty.location.city}, {previewProperty.location.state} -{" "}
                    {previewProperty.location.postalCode}
                  </span>
                </p>
              </div>

              {/* Rejection notice in modal */}
              {previewProperty.status === "rejected" && previewProperty.rejectionReason && (
                <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200 text-rose-800 text-xs sm:text-sm">
                  <div className="font-bold flex items-center gap-1.5 mb-1 text-rose-900">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>Curation Team Feedback</span>
                  </div>
                  <p>{previewProperty.rejectionReason}</p>
                </div>
              )}

              {/* Pricing & Key Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <div className="text-[11px] text-slate-500 font-medium">Nightly Rate</div>
                  <div className="text-base font-black text-slate-900">
                    ₹{previewProperty.pricing.pricePerNight?.toLocaleString("en-IN")}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500 font-medium">Capacity</div>
                  <div className="text-base font-bold text-slate-900">
                    {previewProperty.capacity.maxGuests} Guests
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500 font-medium">Rooms</div>
                  <div className="text-base font-bold text-slate-900">
                    {previewProperty.capacity.bedrooms} Bed · {previewProperty.capacity.bathrooms} Bath
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500 font-medium">Check-In / Out</div>
                  <div className="text-xs font-bold text-slate-900">
                    {previewProperty.capacity.checkInTime} / {previewProperty.capacity.checkOutTime}
                  </div>
                </div>
              </div>

              {/* Descriptions */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 text-sm">About This Stay</h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {previewProperty.detailedDescription || previewProperty.shortDescription}
                </p>
              </div>

              {/* Amenities */}
              {previewProperty.amenities && previewProperty.amenities.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-900 text-sm">Amenities & Features</h4>
                  <div className="flex flex-wrap gap-2">
                    {previewProperty.amenities.map((amenity, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-teal-50 text-teal-800 text-xs font-medium rounded-lg border border-teal-100 flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5 text-teal-600" />
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Host Contact */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs sm:text-sm space-y-1">
                <div className="font-bold text-slate-900">Host Contact Information</div>
                <div className="text-slate-600">
                  {previewProperty.contactDetails.contactPerson} ·{" "}
                  {previewProperty.contactDetails.mobileNumber} ·{" "}
                  {previewProperty.contactDetails.email}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => setPreviewProperty(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold text-xs rounded-xl transition-all"
              >
                Close Preview
              </button>
              <Link
                href={`/dashboard/properties/${previewProperty.id}/edit`}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl shadow-xs transition-all"
              >
                Edit Listing
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRMATION DIALOG ── */}
      {deletePropertyTarget && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900">Delete Property Listing?</h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
                Are you sure you want to permanently delete{" "}
                <span className="font-bold text-slate-800">
                  &ldquo;{deletePropertyTarget.name}&rdquo;
                </span>
                ? This action removes all photos, pricing rules, and booking associations.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeletePropertyTarget(null)}
                disabled={isDeleting}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-rose-600/20 disabled:opacity-50 flex items-center gap-2"
              >
                {isDeleting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Delete Property</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ADMIN MODERATION SIMULATION MODAL (Evaluator / Test Feature) ── */}
      {moderationTarget && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Curation Review Simulation</h3>
                <p className="text-xs text-slate-500">Test property approval and rejection lifecycle</p>
              </div>
            </div>

            <div className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Decision</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setModerationStatus("approved")}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      moderationStatus === "approved"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-300 ring-2 ring-emerald-500/20"
                        : "bg-slate-50 text-slate-600 border-slate-200"
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Approve & Publish
                  </button>
                  <button
                    type="button"
                    onClick={() => setModerationStatus("rejected")}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      moderationStatus === "rejected"
                        ? "bg-rose-50 text-rose-700 border-rose-300 ring-2 ring-rose-500/20"
                        : "bg-slate-50 text-slate-600 border-slate-200"
                    }`}
                  >
                    <XCircle className="w-4 h-4 text-rose-600" />
                    Reject (Request Fix)
                  </button>
                </div>
              </div>

              {moderationStatus === "rejected" && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Rejection Feedback Reason
                  </label>
                  <textarea
                    rows={3}
                    value={rejectionReasonInput}
                    onChange={(e) => setRejectionReasonInput(e.target.value)}
                    placeholder="e.g. Please provide at least 3 high-resolution daylight photographs of bedrooms and verify the property pin code."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setModerationTarget(null)}
                disabled={isModerating}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleModerateSubmit}
                disabled={isModerating}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20 disabled:opacity-50 flex items-center gap-2"
              >
                {isModerating && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Apply Simulation</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
