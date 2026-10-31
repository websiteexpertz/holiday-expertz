"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { adminClient } from "@/lib/adminClient";
import { MemoryRecord, MemoryStatus, MemorySource } from "@backend/types/memory";
import {
  Camera,
  Plus,
  Eye,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Search,
  Filter,
  ArrowUp,
  ArrowDown,
  Globe,
  User,
  MapPin,
  Calendar,
  AlertCircle,
  Loader2,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Check,
  X,
} from "lucide-react";

export default function AdminMemoriesPage() {
  const [memories, setMemories] = useState<MemoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [publishedFilter, setPublishedFilter] = useState<string>("all");

  const [notification, setNotification] = useState<string | null>(null);

  // Rejection Modal State
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectingMemory, setRejectingMemory] = useState<MemoryRecord | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);

  // Preview Modal State
  const [previewMemory, setPreviewMemory] = useState<MemoryRecord | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const loadMemories = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await adminClient.memories.getAll({
        status: statusFilter === "all" ? undefined : statusFilter,
        source: sourceFilter === "all" ? undefined : sourceFilter,
        isPublished: publishedFilter === "all" ? undefined : publishedFilter,
        search: searchQuery || undefined,
      });

      if (res.success && res.data?.memories) {
        setMemories(res.data.memories);
      }
    } catch (err) {
      console.error("Failed to load memories:", err);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, sourceFilter, publishedFilter, searchQuery]);

  useEffect(() => {
    loadMemories();
  }, [loadMemories]);

  // Actions
  const handleTogglePublish = async (memory: MemoryRecord) => {
    try {
      const res = await adminClient.memories.togglePublish(memory.id);
      if (res.success) {
        setMemories((prev) =>
          prev.map((m) => (m.id === memory.id ? { ...m, isPublished: !m.isPublished } : m))
        );
        showNotification(`Memory ${!memory.isPublished ? "published" : "unpublished"}.`);
      }
    } catch {
      alert("Failed to update publication status.");
    }
  };

  const handleToggleActive = async (memory: MemoryRecord) => {
    try {
      const res = await adminClient.memories.toggleActive(memory.id);
      if (res.success) {
        setMemories((prev) =>
          prev.map((m) => (m.id === memory.id ? { ...m, isActive: !m.isActive } : m))
        );
        showNotification(`Memory marked as ${!memory.isActive ? "active" : "inactive"}.`);
      }
    } catch {
      alert("Failed to update active status.");
    }
  };

  const handleApprove = async (memory: MemoryRecord) => {
    try {
      const res = await adminClient.memories.approve(memory.id);
      if (res.success) {
        setMemories((prev) =>
          prev.map((m) => (m.id === memory.id ? { ...m, status: "approved", isPublished: true } : m))
        );
        showNotification(`Submission "${memory.title}" approved and published!`);
      }
    } catch {
      alert("Failed to approve submission.");
    }
  };

  const handleOpenReject = (memory: MemoryRecord) => {
    setRejectingMemory(memory);
    setRejectionReason("");
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!rejectingMemory) return;
    setIsRejecting(true);
    try {
      const res = await adminClient.memories.reject(rejectingMemory.id, rejectionReason.trim());
      if (res.success) {
        setMemories((prev) =>
          prev.map((m) =>
            m.id === rejectingMemory.id
              ? { ...m, status: "rejected", isPublished: false, rejectionReason: rejectionReason.trim() }
              : m
          )
        );
        setRejectModalOpen(false);
        showNotification("Submission rejected with feedback.");
      }
    } catch {
      alert("Failed to reject submission.");
    } finally {
      setIsRejecting(false);
    }
  };

  const handleDelete = async (memory: MemoryRecord) => {
    if (!confirm(`Are you sure you want to permanently delete "${memory.title}"?`)) return;

    try {
      const res = await adminClient.memories.delete(memory.id);
      if (res.success) {
        setMemories((prev) => prev.filter((m) => m.id !== memory.id));
        showNotification("Memory deleted.");
      }
    } catch {
      alert("Failed to delete memory.");
    }
  };

  const handleMoveOrder = async (index: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= memories.length) return;

    const reordered = [...memories];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIdx, 0, moved);

    setMemories(reordered);

    try {
      const ids = reordered.map((m) => m.id);
      await adminClient.memories.reorder(ids);
      showNotification("Display order updated!");
    } catch {
      await loadMemories();
    }
  };

  const handleClearDemoMemories = async () => {
    const demoCount = memories.filter((m) => m.isDemo).length;
    if (demoCount === 0) {
      alert("No demo memories found. All current memories are authentic records.");
      return;
    }

    if (
      !confirm(
        `Clear ${demoCount} demo sample memories? Genuine guest submissions and non-demo records will be strictly preserved.`
      )
    ) {
      return;
    }

    try {
      const res = await adminClient.memories.clearDemo();
      if (res.success) {
        setMemories((prev) => prev.filter((m) => !m.isDemo));
        showNotification(`Cleaned up ${res.data?.deletedCount || demoCount} demo memories!`);
      }
    } catch {
      alert("Failed to clear demo memories.");
    }
  };

  // Counts
  const totalCount = memories.length;
  const pendingCount = memories.filter((m) => m.status === "pending").length;
  const guestCount = memories.filter((m) => m.source === "guest_submitted").length;
  const publishedCount = memories.filter((m) => m.isPublished).length;
  const demoCount = memories.filter((m) => m.isDemo).length;

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-7xl mx-auto pb-16">
        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 text-teal-400 text-xs font-semibold mb-2">
              <Camera className="w-3.5 h-3.5" />
              <span>Travel Experiences & Storytelling</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>Memories Management</span>
              {pendingCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {pendingCount} Pending Review
                </span>
              )}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Curate and publish memorable guest experiences, review community travel stories, and feature highlights on the homepage.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {demoCount > 0 && (
              <button
                type="button"
                onClick={handleClearDemoMemories}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xs font-semibold transition-colors"
                title="Safely remove demo sample memories"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clean Demo ({demoCount})</span>
              </button>
            )}

            <Link
              href="/admin/memories/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-teal-500/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Memory</span>
            </Link>
          </div>
        </div>

        {/* Notification Toast */}
        {notification && (
          <div className="p-3.5 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-semibold flex items-center gap-2 shadow-lg animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
            <span>{notification}</span>
          </div>
        )}

        {/* Filters and Search Bar */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
            {[
              { id: "all", label: "All Memories", count: totalCount },
              { id: "pending", label: "Guest Submissions", count: pendingCount, highlight: pendingCount > 0 },
              { id: "approved", label: "Approved", count: memories.filter((m) => m.status === "approved").length },
              { id: "draft", label: "Drafts", count: memories.filter((m) => m.status === "draft").length },
              { id: "rejected", label: "Rejected", count: memories.filter((m) => m.status === "rejected").length },
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

          {/* Quick Search */}
          <div className="relative w-full sm:w-72 shrink-0">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search title, traveller, or city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
            />
          </div>
        </div>

        {/* Memories Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin text-teal-400 mb-2" />
              <span className="text-xs">Loading travel memories...</span>
            </div>
          ) : memories.length === 0 ? (
            <div className="py-20 text-center space-y-3">
              <Camera className="w-10 h-10 text-slate-700 mx-auto" />
              <h3 className="text-sm font-bold text-slate-300">No Memories Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No travel memories match your current search or filter criteria.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                    <th className="py-3.5 px-4 w-12 text-center">#</th>
                    <th className="py-3.5 px-4">Memory Story</th>
                    <th className="py-3.5 px-4">Traveller & Destination</th>
                    <th className="py-3.5 px-4">Source & Badges</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Published</th>
                    <th className="py-3.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {memories.map((mem, idx) => (
                    <tr key={mem.id} className="hover:bg-slate-800/30 transition-colors group">
                      {/* Order / Move */}
                      <td className="py-4 px-3 text-center">
                        <div className="flex flex-col items-center gap-0.5">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMoveOrder(idx, "up")}
                            className="p-1 text-slate-500 hover:text-teal-400 disabled:opacity-20 transition-colors"
                            title="Move Earlier"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <span className="font-mono text-[11px] text-slate-500 font-bold">{idx + 1}</span>
                          <button
                            type="button"
                            disabled={idx === memories.length - 1}
                            onClick={() => handleMoveOrder(idx, "down")}
                            className="p-1 text-slate-500 hover:text-teal-400 disabled:opacity-20 transition-colors"
                            title="Move Later"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* Cover & Title */}
                      <td className="py-4 px-4 max-w-xs">
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-12 rounded-xl bg-slate-800 overflow-hidden shrink-0 border border-slate-700 relative">
                            <img
                              src={mem.coverImage}
                              alt={mem.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            {mem.images.length > 1 && (
                              <span className="absolute bottom-1 right-1 px-1 py-0.2 rounded bg-black/70 text-[9px] text-white font-mono font-bold">
                                +{mem.images.length - 1}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-white truncate block group-hover:text-teal-300 transition-colors">
                              {mem.title}
                            </span>
                            <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5 font-light">
                              {mem.shortDescription}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Traveller & Destination */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5 text-slate-200 font-semibold text-xs">
                          <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span className="truncate max-w-[140px]">{mem.guestName}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-teal-400 mt-1">
                          <MapPin className="w-3 h-3 text-teal-500 shrink-0" />
                          <span className="truncate max-w-[150px]">{mem.destinationName}</span>
                        </div>
                        {mem.travelDate && (
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5">
                            <Calendar className="w-3 h-3 text-slate-600 shrink-0" />
                            <span>{mem.travelDate}</span>
                          </div>
                        )}
                      </td>

                      {/* Source & Badges */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          {mem.source === "guest_submitted" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 uppercase tracking-wider w-fit">
                              Guest Submission
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/15 text-teal-300 border border-teal-500/30 uppercase tracking-wider w-fit">
                              Admin Created
                            </span>
                          )}

                          {mem.isDemo && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30 uppercase tracking-wider w-fit">
                              Demo Story
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Moderation Status */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        {mem.status === "approved" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Approved</span>
                          </span>
                        ) : mem.status === "pending" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Pending</span>
                          </span>
                        ) : mem.status === "rejected" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Rejected</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                            <span>Draft</span>
                          </span>
                        )}
                      </td>

                      {/* Published Toggle */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleTogglePublish(mem)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            mem.isPublished
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30"
                              : "bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 border border-slate-700"
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full ${mem.isPublished ? "bg-emerald-400" : "bg-slate-500"}`} />
                          <span>{mem.isPublished ? "Published" : "Unpublished"}</span>
                        </button>
                      </td>

                      {/* Verification & Actions */}
                      <td className="py-4 px-5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Approve/Reject for pending submissions */}
                          {mem.status === "pending" && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleApprove(mem)}
                                className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-colors"
                                title="Approve & Publish"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenReject(mem)}
                                className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors"
                                title="Reject Submission"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          )}

                          {/* Preview Action */}
                          <button
                            type="button"
                            onClick={() => setPreviewMemory(mem)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                            title="Preview Story Card & Page"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Public Detail Link */}
                          <Link
                            href={`/memories/${mem.id}`}
                            target="_blank"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-teal-300 transition-colors"
                            title="Open Public Story Page"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => handleDelete(mem)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                            title="Delete Memory"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── PREVIEW MODAL ── */}
        {previewMemory && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in"
            onClick={() => setPreviewMemory(null)}
          >
            <div
              className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-teal-400" />
                  <h3 className="font-bold text-white text-sm">Preview: Public Story Card</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewMemory(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Card Rendering matching public styling */}
              <div className="p-6 overflow-y-auto space-y-4">
                <div className="rounded-3xl overflow-hidden border border-slate-700 bg-slate-950 shadow-xl relative aspect-[16/10]">
                  <img
                    src={previewMemory.coverImage}
                    alt={previewMemory.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/10" />

                  <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-slate-950/70 backdrop-blur-md border border-white/20 text-teal-300 font-editorial-sans text-[11px] font-semibold flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 text-teal-400" />
                      <span>{previewMemory.destinationName}</span>
                    </span>
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 p-6 z-10 space-y-2">
                    <div className="flex items-center gap-2 text-white/80 text-xs font-editorial-sans">
                      <span className="font-semibold text-white">{previewMemory.guestName}</span>
                      {previewMemory.travelDate && <span>• {previewMemory.travelDate}</span>}
                    </div>
                    <h3 className="font-editorial-serif text-2xl font-bold text-white leading-snug">
                      {previewMemory.title}
                    </h3>
                    <p className="font-editorial-sans text-xs text-white/80 line-clamp-2 font-light leading-relaxed">
                      {previewMemory.shortDescription}
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-400 leading-relaxed">
                  <h4 className="font-bold text-white mb-1.5 uppercase text-[10px] tracking-wider text-teal-400">
                    Full Travel Story
                  </h4>
                  <p>{previewMemory.story}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── REJECTION REASON MODAL ── */}
        {rejectModalOpen && rejectingMemory && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in"
            onClick={() => setRejectModalOpen(false)}
          >
            <div
              className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2 text-rose-400">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <h3 className="font-bold text-white text-base">Reject Guest Submission</h3>
              </div>
              <p className="text-xs text-slate-400">
                Specify a brief feedback reason for rejecting &quot;{rejectingMemory.title}&quot;.
              </p>

              <textarea
                rows={3}
                placeholder="e.g. Inappropriate photograph quality or copyright concerns..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-rose-500 resize-none"
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isRejecting}
                  onClick={handleConfirmReject}
                  className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-40"
                >
                  {isRejecting ? "Rejecting..." : "Confirm Rejection"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

