"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { adminClient } from "@/lib/adminClient";
import { Property, PropertyStatus } from "@backend/types/property";
import {
  Building2,
  CheckCircle2,
  XCircle,
  PauseCircle,
  PlayCircle,
  Star,
  Sparkles,
  Search,
  Eye,
  Trash2,
  AlertTriangle,
  Loader2,
  Filter,
  MapPin,
  User,
  ExternalLink,
  ChevronRight,
  Info,
} from "lucide-react";
import Link from "next/link";

function AdminPropertiesContent() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get("status") || "all";

  const [properties, setProperties] = useState<(Property & { ownerName: string })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [searchQuery, setSearchQuery] = useState("");

  // Reject Modal State
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedPropertyForReject, setSelectedPropertyForReject] = useState<Property | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectError, setRejectError] = useState("");

  // Details Modal State
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [viewingProperty, setViewingProperty] = useState<(Property & { ownerName: string }) | null>(null);

  const loadProperties = useCallback(async () => {
    setIsLoading(true);
    const res = await adminClient.properties.getAll({
      status: statusFilter === "all" ? undefined : statusFilter,
      search: searchQuery || undefined,
    });
    if (res.success && res.data?.properties) {
      setProperties(res.data.properties);
    }
    setIsLoading(false);
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    loadProperties();
  }, [loadProperties]);

  // Actions
  const handleApprove = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to approve "${name}" for public listing on HolidayExpertz?`)) {
      return;
    }
    const res = await adminClient.properties.approve(id);
    if (res.success) {
      await loadProperties();
    } else {
      alert(res.message || "Approval failed");
    }
  };

  const handleOpenReject = (prop: Property) => {
    setSelectedPropertyForReject(prop);
    setRejectionReason("");
    setRejectError("");
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      setRejectError("A clear rejection reason is mandatory to guide the property owner.");
      return;
    }

    if (!selectedPropertyForReject) return;

    setIsRejecting(true);
    const res = await adminClient.properties.reject(selectedPropertyForReject.id, rejectionReason);
    setIsRejecting(false);

    if (res.success) {
      setRejectModalOpen(false);
      await loadProperties();
    } else {
      setRejectError(res.message || "Failed to reject property");
    }
  };

  const handleTogglePause = async (id: string) => {
    const res = await adminClient.properties.togglePause(id);
    if (res.success) {
      await loadProperties();
    } else {
      alert(res.message || "Failed to update property status");
    }
  };

  const handleToggleFeatured = async (id: string) => {
    const res = await adminClient.properties.toggleFeatured(id);
    if (res.success) {
      await loadProperties();
    } else {
      alert(res.message || "Failed to toggle featured status");
    }
  };

  const handleToggleHandpicked = async (id: string) => {
    const res = await adminClient.properties.toggleHandpicked(id);
    if (res.success) {
      await loadProperties();
    } else {
      alert(res.message || "Failed to toggle handpicked status");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Permanent Action: Are you sure you want to delete property "${name}"? This cannot be undone.`)) {
      return;
    }
    const res = await adminClient.properties.delete(id);
    if (res.success) {
      await loadProperties();
    } else {
      alert(res.message || "Failed to delete property");
    }
  };

  // Counts summary
  const totalCount = properties.length;
  const approvedCount = properties.filter((p) => p.status === "approved").length;
  const pendingCount = properties.filter((p) => p.status === "pending_approval").length;
  const rejectedCount = properties.filter((p) => p.status === "rejected").length;
  const pausedCount = properties.filter((p) => p.status === "paused" || p.status === "draft").length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 text-teal-400 text-xs font-semibold mb-2">
              <Building2 className="w-3.5 h-3.5" />
              <span>Listing Approval Workflow</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Properties Management</h1>
            <p className="text-xs text-slate-400 mt-1">
              Verify submitted properties, issue rejections with clear reasons, curate handpicked collections, and pause listings.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/admin/properties/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-teal-500/20 transition-all"
            >
              <Building2 className="w-4 h-4" />
              <span>Add Property</span>
            </Link>
            <Link
              href="/dashboard/properties/new"
              target="_blank"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all shadow-sm"
            >
              <span>Owner Submission Flow</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Filter Pills and Search */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
            {[
              { id: "all", label: "All Properties", count: totalCount },
              { id: "pending_approval", label: "Pending Approval", count: pendingCount, highlight: true },
              { id: "approved", label: "Published / Active", count: approvedCount },
              { id: "rejected", label: "Rejected", count: rejectedCount },
              { id: "paused", label: "Paused / Draft", count: pausedCount },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
                  statusFilter === tab.id
                    ? tab.highlight
                      ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                      : "bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20"
                    : "bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    statusFilter === tab.id ? "bg-slate-950/20 text-slate-950" : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full lg:w-72">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by title, city, owner..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
            />
          </div>
        </div>

        {/* Properties Table / Cards */}
        {isLoading ? (
          <div className="py-24 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-teal-400 mb-2" />
            <p className="text-xs">Loading property listings...</p>
          </div>
        ) : properties.length === 0 ? (
          <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl">
            <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-white">No properties match this filter</h3>
            <p className="text-xs text-slate-500 mt-1">Try switching tabs or adjusting your search query.</p>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                    <th className="py-3.5 px-5">Property</th>
                    <th className="py-3.5 px-4">Owner & Location</th>
                    <th className="py-3.5 px-4">Pricing</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Badges</th>
                    <th className="py-3.5 px-5 text-right">Verification & Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {properties.map((prop) => {
                    const cover = prop.images?.[0]?.url || "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=300&q=80";

                    return (
                      <tr key={prop.id} className="hover:bg-slate-800/30 transition-colors group">
                        {/* Property Basic */}
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-slate-800 overflow-hidden shrink-0 border border-slate-800">
                              <img src={cover} alt={prop.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="min-w-0">
                              <span className="font-bold text-white truncate block max-w-[200px] sm:max-w-xs group-hover:text-teal-300 transition-colors">
                                {prop.name}
                              </span>
                              <span className="text-[10px] text-teal-400 font-semibold uppercase tracking-wider block mt-0.5">
                                {prop.propertyType}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Owner & Location */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                            <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span className="truncate max-w-[140px]">{prop.ownerName}</span>
                            {prop.createdByRole === "admin" ? (
                              <span className="ml-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30 uppercase tracking-wider">
                                Admin
                              </span>
                            ) : (
                              <span className="ml-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-500/15 text-blue-300 border border-blue-500/30 uppercase tracking-wider">
                                Owner
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1">
                            <MapPin className="w-3 h-3 text-slate-600 shrink-0" />
                            <span className="truncate max-w-[150px]">
                              {prop.location.locality}, {prop.location.city}
                            </span>
                          </div>
                        </td>

                        {/* Pricing */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <span className="font-extrabold text-white text-xs">
                            ₹{prop.pricing.pricePerNight?.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-slate-500 block">per night</span>
                        </td>

                        {/* Status */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold capitalize ${
                              prop.status === "approved"
                                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                                : prop.status === "pending_approval"
                                ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                                : prop.status === "rejected"
                                ? "bg-red-500/15 text-red-400 border border-red-500/30"
                                : "bg-slate-800 text-slate-400 border border-slate-700"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                prop.status === "approved"
                                  ? "bg-emerald-400"
                                  : prop.status === "pending_approval"
                                  ? "bg-amber-400 animate-pulse"
                                  : prop.status === "rejected"
                                  ? "bg-red-400"
                                  : "bg-slate-400"
                              }`}
                            />
                            {prop.status.replace("_", " ")}
                          </span>

                          {prop.status === "rejected" && prop.rejectionReason && (
                            <p className="text-[10px] text-red-400/80 mt-1 max-w-[140px] truncate" title={prop.rejectionReason}>
                              Reason: {prop.rejectionReason}
                            </p>
                          )}
                        </td>

                        {/* Badges / Curation */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleToggleFeatured(prop.id)}
                              className={`p-1.5 rounded-lg border transition-all ${
                                prop.featured
                                  ? "bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm"
                                  : "bg-slate-950 text-slate-600 border-slate-800 hover:text-slate-400"
                              }`}
                              title={prop.featured ? "Featured on Homepage" : "Click to mark as Featured"}
                            >
                              <Star className={`w-3.5 h-3.5 ${prop.featured ? "fill-amber-400" : ""}`} />
                            </button>

                            <button
                              onClick={() => handleToggleHandpicked(prop.id)}
                              className={`p-1.5 rounded-lg border transition-all ${
                                prop.handpicked
                                  ? "bg-teal-500/20 text-teal-300 border-teal-500/40 shadow-sm"
                                  : "bg-slate-950 text-slate-600 border-slate-800 hover:text-slate-400"
                              }`}
                              title={prop.handpicked ? "In Handpicked Stays" : "Click to add to Handpicked"}
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>

                        {/* Action Buttons */}
                        <td className="py-4 px-5 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            {/* View Details */}
                            <button
                              onClick={() => {
                                setViewingProperty(prop);
                                setDetailsModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                              title="Inspect Full Listing"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {/* Approve Button */}
                            {prop.status !== "approved" && (
                              <button
                                onClick={() => handleApprove(prop.id, prop.name)}
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 font-bold border border-emerald-500/30 transition-all flex items-center gap-1"
                                title="Approve Listing"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Approve</span>
                              </button>
                            )}

                            {/* Reject Button */}
                            {prop.status !== "rejected" && (
                              <button
                                onClick={() => handleOpenReject(prop)}
                                className="px-2.5 py-1.5 rounded-lg bg-red-500/15 hover:bg-red-500 text-red-300 hover:text-white font-bold border border-red-500/30 transition-all flex items-center gap-1"
                                title="Reject with Reason"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Reject</span>
                              </button>
                            )}

                            {/* Pause / Publish Toggle */}
                            {prop.status === "approved" && (
                              <button
                                onClick={() => handleTogglePause(prop.id)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-amber-500/20 text-slate-400 hover:text-amber-300 transition-colors"
                                title="Pause Visibility"
                              >
                                <PauseCircle className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {prop.status === "paused" && (
                              <button
                                onClick={() => handleTogglePause(prop.id)}
                                className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-colors"
                                title="Unpause Listing"
                              >
                                <PlayCircle className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Delete */}
                            <button
                              onClick={() => handleDelete(prop.id, prop.name)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-colors"
                              title="Delete Listing"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* REJECT MODAL WITH MANDATORY REASON */}
        {rejectModalOpen && selectedPropertyForReject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Reject Property Listing</h3>
                    <p className="text-[11px] text-slate-400">{selectedPropertyForReject.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setRejectModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                >
                  ✕
                </button>
              </div>

              {rejectError && (
                <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
                  {rejectError}
                </div>
              )}

              <form onSubmit={handleConfirmReject} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Reason for Rejection <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="e.g. Inadequate resolution on bathroom photographs, missing government tourism permit registration details, or mismatch in location coordinates..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-red-500 resize-none leading-relaxed"
                  />
                  <p className="text-[11px] text-slate-500 mt-1.5">
                    This reason is recorded in audit logs and visible to the property owner on their dashboard.
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setRejectModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isRejecting}
                    className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-400 text-white font-bold text-xs uppercase tracking-wider shadow-md transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {isRejecting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Confirm Rejection</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* DETAILS MODAL */}
        {detailsModalOpen && viewingProperty && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 shadow-2xl relative custom-scrollbar">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400">
                    {viewingProperty.propertyType}
                  </span>
                  <h3 className="text-lg font-bold text-white">{viewingProperty.name}</h3>
                </div>
                <button
                  onClick={() => setDetailsModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                >
                  ✕
                </button>
              </div>

              {/* Photos Gallery */}
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  {viewingProperty.images?.map((img, i) => (
                    <div key={img.id || i} className="h-28 rounded-xl overflow-hidden bg-slate-800 border border-slate-800">
                      <img src={img.url} alt={img.caption || ""} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>

                {/* Descriptions */}
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Overview</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">{viewingProperty.shortDescription}</p>
                  <p className="text-xs text-slate-400 leading-relaxed pt-2 border-t border-slate-800/80">
                    {viewingProperty.detailedDescription}
                  </p>
                </div>

                {/* Specs Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Rate / Night</span>
                    <span className="font-bold text-teal-400">₹{viewingProperty.pricing.pricePerNight}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Guests Max</span>
                    <span className="font-bold text-white">{viewingProperty.capacity.maxGuests} guests</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Bedrooms</span>
                    <span className="font-bold text-white">{viewingProperty.capacity.bedrooms} Rooms</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Bathrooms</span>
                    <span className="font-bold text-white">{viewingProperty.capacity.bathrooms} Baths</span>
                  </div>
                </div>

                {/* Amenities */}
                <div>
                  <h4 className="text-xs font-bold text-slate-300 mb-2">Amenities</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {viewingProperty.amenities?.map((amenity) => (
                      <span key={amenity} className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 text-[11px] font-medium">
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Contact & Location */}
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Location</span>
                    <p className="text-slate-300 mt-1">{viewingProperty.location.address}</p>
                    <p className="text-slate-400">
                      {viewingProperty.location.locality}, {viewingProperty.location.city}, {viewingProperty.location.state}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Contact Person</span>
                    <p className="text-slate-300 mt-1 font-semibold">{viewingProperty.contactDetails.contactPerson}</p>
                    <p className="text-slate-400">{viewingProperty.contactDetails.email}</p>
                    <p className="text-slate-400">{viewingProperty.contactDetails.mobileNumber}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default function AdminPropertiesPage() {
  return (
    <React.Suspense
      fallback={
        <AdminLayout>
          <div className="flex h-96 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          </div>
        </AdminLayout>
      }
    >
      <AdminPropertiesContent />
    </React.Suspense>
  );
}
