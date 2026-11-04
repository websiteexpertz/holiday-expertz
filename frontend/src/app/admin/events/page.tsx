"use client";

import React, { useState, useEffect, useCallback, useRef, Suspense } from "react";
import Image from "next/image";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { adminClient } from "@/lib/adminClient";
import { EventRecord } from "@backend/types/admin";
import { apiUrl } from "@/lib/apiUrl";
import {
  CalendarDays,
  Plus,
  Edit2,
  Trash2,
  Search,
  MapPin,
  Calendar,
  Clock,
  Sparkles,
  Loader2,
  CheckCircle2,
  XCircle,
  Copy,
  Upload,
  Globe,
  Tag,
  Eye,
  EyeOff,
  Filter,
  Check,
  AlertCircle,
  Layers,
} from "lucide-react";

const CATEGORIES = [
  "Festival",
  "Cultural",
  "Music",
  "Adventure",
  "Food",
  "Wellness",
  "Heritage",
  "Art",
];

const TIMEZONES = [
  { value: "Asia/Kolkata", label: "India Standard Time (Asia/Kolkata - IST)" },
  { value: "UTC", label: "Coordinated Universal Time (UTC)" },
  { value: "Asia/Dubai", label: "Gulf Standard Time (Asia/Dubai - GST)" },
  { value: "Europe/London", label: "London / GMT (Europe/London)" },
  { value: "America/New_York", label: "Eastern Time (America/New_York - EST)" },
  { value: "America/Los_Angeles", label: "Pacific Time (America/Los_Angeles - PST)" },
  { value: "Asia/Singapore", label: "Singapore Time (Asia/Singapore - SGT)" },
];

function AdminEventsContent() {
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [nowTimestamp, setNowTimestamp] = useState<number>(0);

  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventRecord | null>(null);

  // Duplicate modal state
  const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);
  const [duplicatingEvent, setDuplicatingEvent] = useState<EventRecord | null>(null);
  const [duplicateYear, setDuplicateYear] = useState<number>(2027);
  const [duplicateStartDate, setDuplicateStartDate] = useState<string>("");
  const [duplicateEndDate, setDuplicateEndDate] = useState<string>("");
  const [isDuplicating, setIsDuplicating] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    category: "Festival",
    coverImage: "",
    startDate: "2026-11-15",
    endDate: "2026-11-20",
    time: "09:00 AM - 08:00 PM",
    timezone: "Asia/Kolkata",
    country: "India",
    state: "Rajasthan",
    city: "Udaipur",
    location: "City Palace Heritage Courtyard",
    description: "",
    longDescription: "",
    highlightsText: "Cultural Performances, Guided Heritage Access, Artisan Crafts Bazaar",
    price: "Free Entry",
    organizer: "Heritage Tourism Council",
    registrationLink: "",
    status: "published" as EventRecord["status"],
    featured: true,
    publishAt: "",
    unpublishAt: "",
    isRecurring: true,
    recurrenceFrequency: "annual" as "annual" | "none",
    editionYear: 2026,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formError, setFormError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showNotification = (message: string, type: "success" | "error" = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadEvents = useCallback(async () => {
    setIsLoading(true);
    const res = await adminClient.events.getAll({
      status: statusFilter !== "all" ? statusFilter : undefined,
      category: categoryFilter !== "all" ? categoryFilter : undefined,
      year: yearFilter !== "all" ? yearFilter : undefined,
    });
    if (res.success && res.data?.events) {
      setEvents(res.data.events);
    }
    setIsLoading(false);
  }, [statusFilter, categoryFilter, yearFilter]);

  useEffect(() => {
    setNowTimestamp(Date.now());
    loadEvents();
  }, [loadEvents]);

  // Quick slug generator
  const generateSlugFromTitle = (title: string, year?: number) => {
    const yr = year || new Date().getFullYear();
    const base = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    if (!base.includes(String(yr))) {
      return `${base}-${yr}`;
    }
    return base;
  };

  const handleOpenCreate = () => {
    setEditingEvent(null);
    const today = new Date().toISOString().split("T")[0];
    const nextWeek = new Date(Date.now() + 5 * 86400000).toISOString().split("T")[0];
    const currentYear = new Date().getFullYear();

    setFormData({
      title: "",
      slug: "",
      category: "Festival",
      coverImage: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80",
      startDate: today,
      endDate: nextWeek,
      time: "09:00 AM - 08:00 PM",
      timezone: "Asia/Kolkata",
      country: "India",
      state: "Rajasthan",
      city: "Pushkar",
      location: "Fairgrounds & Heritage Arena",
      description: "",
      longDescription: "",
      highlightsText: "Grand Heritage Pageant, Folk Music Concerts, Desert Night Stays, Handicrafts Souk",
      price: "Free Entry",
      organizer: "Heritage Tourism Council",
      registrationLink: "",
      status: "published",
      featured: true,
      publishAt: "",
      unpublishAt: "",
      isRecurring: true,
      recurrenceFrequency: "annual",
      editionYear: currentYear,
    });
    setFormError("");
    setModalOpen(true);
  };

  const handleOpenEdit = (evt: EventRecord) => {
    setEditingEvent(evt);
    setFormData({
      title: evt.title,
      slug: evt.slug,
      category: evt.category || "Festival",
      coverImage: evt.coverImage || "",
      startDate: evt.startDate,
      endDate: evt.endDate,
      time: evt.time || "09:00 AM - 08:00 PM",
      timezone: evt.timezone || "Asia/Kolkata",
      country: evt.country || "India",
      state: evt.state || "",
      city: evt.city || "",
      location: evt.location || "",
      description: evt.description || "",
      longDescription: evt.longDescription || evt.description || "",
      highlightsText: Array.isArray(evt.highlights) ? evt.highlights.join(", ") : "",
      price: evt.price !== undefined ? String(evt.price) : "Free Entry",
      organizer: evt.organizer || "Heritage Tourism Council",
      registrationLink: evt.registrationLink || "",
      status: evt.status,
      featured: evt.featured ?? true,
      publishAt: evt.publishAt ? evt.publishAt.slice(0, 16) : "",
      unpublishAt: evt.unpublishAt ? evt.unpublishAt.slice(0, 16) : "",
      isRecurring: evt.isRecurring ?? true,
      recurrenceFrequency: evt.recurrenceFrequency || "annual",
      editionYear: evt.editionYear || new Date(evt.startDate).getFullYear(),
    });
    setFormError("");
    setModalOpen(true);
  };

  // Image file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const data = new FormData();
      data.append("file", file);

      const res = await fetch(apiUrl("/api/upload"), {
        method: "POST",
        body: data,
      });
      const json = await res.json();
      if (json.success && json.url) {
        setFormData((prev) => ({ ...prev, coverImage: json.url }));
        showNotification("Cover image uploaded successfully!");
      } else {
        alert(json.message || "Failed to upload image");
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("Error uploading cover image");
    } finally {
      setIsUploading(false);
    }
  };

  // Save Event
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setFormError("Event title is required");
      return;
    }
    if (!formData.startDate || !formData.endDate) {
      setFormError("Start and End dates are required");
      return;
    }

    setIsSaving(true);
    setFormError("");

    const highlightsArray = formData.highlightsText
      .split(/[\n,]+/)
      .map((h) => h.trim())
      .filter(Boolean);

    const payload: Partial<EventRecord> = {
      title: formData.title.trim(),
      slug: formData.slug.trim() || generateSlugFromTitle(formData.title, formData.editionYear),
      category: formData.category,
      coverImage: formData.coverImage.trim() || "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80",
      startDate: formData.startDate,
      endDate: formData.endDate,
      time: formData.time.trim(),
      timezone: formData.timezone,
      country: formData.country.trim(),
      state: formData.state.trim(),
      city: formData.city.trim(),
      location: formData.location.trim(),
      description: formData.description.trim(),
      longDescription: formData.longDescription.trim() || formData.description.trim(),
      highlights: highlightsArray,
      price: formData.price.trim() || "Free Entry",
      organizer: formData.organizer.trim(),
      registrationLink: formData.registrationLink.trim(),
      status: formData.status,
      featured: formData.featured,
      publishAt: formData.publishAt ? new Date(formData.publishAt).toISOString() : undefined,
      unpublishAt: formData.unpublishAt ? new Date(formData.unpublishAt).toISOString() : undefined,
      isRecurring: formData.isRecurring,
      recurrenceFrequency: formData.isRecurring ? formData.recurrenceFrequency : "none",
      editionYear: Number(formData.editionYear) || new Date(formData.startDate).getFullYear(),
    };

    let res;
    if (editingEvent) {
      res = await adminClient.events.update(editingEvent.id, payload);
    } else {
      res = await adminClient.events.create(payload);
    }
    setIsSaving(false);

    if (res.success) {
      setModalOpen(false);
      showNotification(editingEvent ? "Event updated successfully!" : "Event created successfully!");
      await loadEvents();
    } else {
      setFormError(res.message || "Failed to save event");
    }
  };

  // Quick 1-Click Status Toggle (Publish / Unpublish / Draft)
  const handleToggleStatus = async (evt: EventRecord) => {
    const nextStatus: EventRecord["status"] = evt.status === "published" ? "draft" : "published";
    const res = await adminClient.events.update(evt.id, { status: nextStatus });
    if (res.success) {
      showNotification(`Event "${evt.title}" is now ${nextStatus === "published" ? "Published (Live)" : "Draft (Hidden)"}.`);
      await loadEvents();
    } else {
      alert(res.message || "Failed to update status");
    }
  };

  // Quick 1-Click Featured Toggle
  const handleToggleFeatured = async (evt: EventRecord) => {
    const res = await adminClient.events.update(evt.id, { featured: !evt.featured });
    if (res.success) {
      showNotification(`Event "${evt.title}" featured status updated.`);
      await loadEvents();
    } else {
      alert(res.message || "Failed to update featured status");
    }
  };

  // Open Duplicate Modal for Next Year
  const handleOpenDuplicate = (evt: EventRecord) => {
    setDuplicatingEvent(evt);
    const nextYr = (evt.editionYear || new Date(evt.startDate).getFullYear()) + 1;
    setDuplicateYear(nextYr);

    // Compute provisional dates for next year
    if (evt.startDate) {
      const s = new Date(evt.startDate + "T00:00:00");
      const sM = String(s.getMonth() + 1).padStart(2, "0");
      const sD = String(s.getDate()).padStart(2, "0");
      setDuplicateStartDate(`${nextYr}-${sM}-${sD}`);
    }
    if (evt.endDate) {
      const e = new Date(evt.endDate + "T00:00:00");
      const eM = String(e.getMonth() + 1).padStart(2, "0");
      const eD = String(e.getDate()).padStart(2, "0");
      setDuplicateEndDate(`${nextYr}-${eM}-${eD}`);
    }

    setDuplicateModalOpen(true);
  };

  // Execute Duplicate for Next Year
  const handleExecuteDuplicate = async () => {
    if (!duplicatingEvent) return;
    setIsDuplicating(true);

    const res = await adminClient.events.duplicateYear(duplicatingEvent.id, duplicateYear, {
      startDate: duplicateStartDate || undefined,
      endDate: duplicateEndDate || undefined,
    });
    setIsDuplicating(false);

    if (res.success) {
      setDuplicateModalOpen(false);
      showNotification(`Created ${duplicateYear} edition draft for "${duplicatingEvent.title}"!`);
      await loadEvents();
    } else {
      alert(res.message || "Failed to duplicate event for next year");
    }
  };

  // Delete
  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete event "${title}"?\nThis action cannot be undone.`)) return;
    const res = await adminClient.events.delete(id);
    if (res.success) {
      showNotification(`Deleted event "${title}"`);
      await loadEvents();
    } else {
      alert(res.message || "Failed to delete event");
    }
  };

  // Filtered List
  const filtered = events.filter((e) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      e.title.toLowerCase().includes(q) ||
      e.city?.toLowerCase().includes(q) ||
      e.state?.toLowerCase().includes(q) ||
      e.country?.toLowerCase().includes(q) ||
      e.category?.toLowerCase().includes(q) ||
      e.location?.toLowerCase().includes(q)
    );
  });

  // Summary Metrics
  const totalCount = events.length;
  const publishedCount = events.filter((e) => e.status === "published").length;
  const draftCount = events.filter((e) => e.status === "draft").length;
  const featuredCount = events.filter((e) => e.featured).length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Toast Notification */}
        {notification && (
          <div
            className={`fixed top-4 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-2xl text-xs font-semibold backdrop-blur-md animate-fadeIn transition-all ${
              notification.type === "success"
                ? "bg-emerald-950/90 border border-emerald-500/40 text-emerald-200"
                : "bg-red-950/90 border border-red-500/40 text-red-200"
            }`}
          >
            {notification.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400" />
            )}
            <span>{notification.message}</span>
          </div>
        )}

        {/* Hero Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl relative overflow-hidden">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold mb-2.5">
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Event Operations & Curation</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              What&apos;s Happening Around the World
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1.5 max-w-2xl leading-relaxed">
              Curate annual festivals, cultural galas, and seasonal celebrations showcased on the HolidayExpertz homepage and events directory.
            </p>
          </div>

          <div className="relative z-10 flex items-center gap-3 shrink-0">
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-teal-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Event</span>
            </button>
          </div>
        </div>

        {/* Metric Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="text-[11px] text-slate-400 uppercase font-semibold tracking-wider">Total Events</div>
            <div className="text-2xl font-bold text-white mt-1">{totalCount}</div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="text-[11px] text-emerald-400 uppercase font-semibold tracking-wider">Published (Live)</div>
            <div className="text-2xl font-bold text-emerald-400 mt-1">{publishedCount}</div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="text-[11px] text-amber-400 uppercase font-semibold tracking-wider">Drafts (Hidden)</div>
            <div className="text-2xl font-bold text-amber-400 mt-1">{draftCount}</div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="text-[11px] text-teal-400 uppercase font-semibold tracking-wider">Featured</div>
            <div className="text-2xl font-bold text-teal-300 mt-1">{featuredCount}</div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3.5 bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by title, city, state, country, venue..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Status Pills */}
            <div className="inline-flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              {(["all", "published", "draft", "archived"] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 rounded-lg font-semibold capitalize transition-all cursor-pointer ${
                    statusFilter === st
                      ? "bg-teal-500 text-slate-950 shadow-xs"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-teal-500 cursor-pointer"
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {/* Year Filter */}
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-teal-500 cursor-pointer"
            >
              <option value="all">All Years</option>
              <option value="2026">2026</option>
              <option value="2027">2027</option>
              <option value="2028">2028</option>
            </select>
          </div>
        </div>

        {/* Events List */}
        {isLoading ? (
          <div className="py-24 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-teal-400 mb-2" />
            <p className="text-xs">Loading scheduled events from database...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center bg-slate-900 border border-slate-800 rounded-3xl">
            <CalendarDays className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white">No matching events found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Try adjusting your search criteria or create a new event.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((evt) => {
              const isLive = evt.status === "published";
              const sDate = new Date(evt.startDate + "T00:00:00");
              const eDate = new Date((evt.endDate || evt.startDate) + "T23:59:59");
              const isExpired = nowTimestamp > 0 && eDate.getTime() < nowTimestamp;

              return (
                <div
                  key={evt.id}
                  className="p-5 rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-850/60 transition-all shadow-lg group flex flex-col lg:flex-row lg:items-center justify-between gap-5"
                >
                  {/* Left: Thumbnail & Badges */}
                  <div className="w-full lg:w-52 h-44 lg:h-32 rounded-2xl overflow-hidden relative shrink-0 bg-slate-800 border border-slate-800">
                    <img
                      src={evt.coverImage}
                      alt={evt.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {/* Status Pill */}
                    <span
                      className={`absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold capitalize backdrop-blur-md shadow-sm ${
                        isLive
                          ? "bg-emerald-500/90 text-slate-950 font-extrabold"
                          : "bg-amber-500/90 text-slate-950 font-extrabold"
                      }`}
                    >
                      {evt.status}
                    </span>

                    {/* Featured Star */}
                    {evt.featured && (
                      <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-teal-500/90 text-slate-950 font-bold text-[10px] shadow-sm flex items-center gap-1">
                        <Sparkles className="w-3 h-3 fill-current" />
                        <span>Featured</span>
                      </span>
                    )}

                    {/* Edition Year */}
                    {evt.editionYear && (
                      <span className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-md bg-slate-950/80 text-white font-mono text-[10px]">
                        {evt.editionYear}
                      </span>
                    )}
                  </div>

                  {/* Center: Details & Metadata */}
                  <div className="flex-1 min-w-0 space-y-2.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider">
                        {evt.category}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-300 text-[10px] font-semibold flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-teal-400" />
                        <span>
                          {evt.city}, {evt.state || evt.country}
                        </span>
                      </span>
                      {evt.isRecurring && (
                        <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[10px] font-semibold flex items-center gap-1">
                          <Layers className="w-3 h-3" />
                          <span>Annual Event</span>
                        </span>
                      )}
                      {isExpired && (
                        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px] font-semibold">
                          Past Edition
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="font-bold text-white text-lg group-hover:text-teal-300 transition-colors line-clamp-1">
                        {evt.title}
                      </h3>
                      <div className="text-[11px] font-mono text-slate-400 mt-0.5 flex items-center gap-1.5">
                        <span className="text-slate-500">Slug:</span>
                        <span className="text-teal-400/90">{evt.slug}</span>
                      </div>
                    </div>

                    {evt.description && (
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {evt.description}
                      </p>
                    )}

                    {/* Highlights tags */}
                    {evt.highlights && evt.highlights.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                        {evt.highlights.slice(0, 3).map((h, i) => (
                          <span
                            key={i}
                            className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-750"
                          >
                            ✓ {h}
                          </span>
                        ))}
                        {evt.highlights.length > 3 && (
                          <span className="text-[10px] text-slate-500">
                            +{evt.highlights.length - 3} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Date & Location Footnote */}
                    <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap pt-1 border-t border-slate-800/60">
                      <div className="inline-flex items-center gap-1.5 text-slate-200">
                        <Calendar className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="font-medium">
                          {evt.startDate} → {evt.endDate}
                        </span>
                      </div>
                      {evt.time && (
                        <>
                          <span className="text-slate-700">•</span>
                          <div className="inline-flex items-center gap-1 text-slate-400">
                            <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span>{evt.time}</span>
                          </div>
                        </>
                      )}
                      {evt.timezone && (
                        <>
                          <span className="text-slate-700">•</span>
                          <span className="text-slate-400 font-mono text-[11px]">{evt.timezone}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Right: Quick Action Controls */}
                  <div className="shrink-0 flex items-center lg:flex-col justify-end gap-2 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-800">
                    {/* 1-Click Status Toggle */}
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(evt)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                        isLive
                          ? "bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 border border-emerald-500/30"
                          : "bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 border border-amber-500/30"
                      }`}
                      title={isLive ? "Click to unpublish (hide from homepage)" : "Click to publish (make live)"}
                    >
                      {isLive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      <span>{isLive ? "Live (Unpublish)" : "Draft (Publish)"}</span>
                    </button>

                    {/* 1-Click Duplicate for Next Year */}
                    <button
                      type="button"
                      onClick={() => handleOpenDuplicate(evt)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/25 font-semibold text-xs transition-colors cursor-pointer"
                      title="Create next year's occurrence as a draft"
                    >
                      <Copy className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Next Year</span>
                    </button>

                    <div className="flex items-center gap-2">
                      {/* Edit Button */}
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(evt)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold text-xs transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-teal-400" />
                        <span>Edit</span>
                      </button>

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={() => handleDelete(evt.id, evt.title)}
                        className="p-2 text-slate-400 hover:text-red-400 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Delete event"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal: Create & Edit Event */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto p-6 sm:p-7 shadow-2xl relative custom-scrollbar">
              <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-800">
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {editingEvent ? "Edit Event" : "Create New Event"}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Configure dates, venue, scheduled publication, and rich descriptions.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {formError && (
                <div className="mb-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSave} className="space-y-4 text-xs">
                {/* Title */}
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Event Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => {
                      const newTitle = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        title: newTitle,
                        slug: prev.slug ? prev.slug : generateSlugFromTitle(newTitle, prev.editionYear),
                      }));
                    }}
                    placeholder="e.g. Pushkar International Hot Air Balloon & Heritage Fair 2026"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-teal-500"
                  />
                </div>

                {/* Slug & Category */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">URL Slug *</label>
                    <input
                      type="text"
                      required
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      placeholder="pushkar-balloon-heritage-fair-2026"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-mono text-[11px] focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Category *</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Dates & Daily Time */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Start Date *</label>
                    <input
                      type="date"
                      required
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">End Date *</label>
                    <input
                      type="date"
                      required
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Daily Timings</label>
                    <input
                      type="text"
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      placeholder="09:00 AM - 08:00 PM"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>

                {/* Location, City, State, Country */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">City *</label>
                    <input
                      type="text"
                      required
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="Pushkar"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">State *</label>
                    <input
                      type="text"
                      required
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      placeholder="Rajasthan"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Country</label>
                    <input
                      type="text"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      placeholder="India"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Edition Year</label>
                    <input
                      type="number"
                      value={formData.editionYear}
                      onChange={(e) => setFormData({ ...formData, editionYear: parseInt(e.target.value, 10) })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>

                {/* Venue & Timezone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Venue / Ground Location *</label>
                    <input
                      type="text"
                      required
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="Pushkar Fairgrounds, Mela Vikas Ground"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Timezone</label>
                    <select
                      value={formData.timezone}
                      onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-teal-500 cursor-pointer text-xs"
                    >
                      {TIMEZONES.map((tz) => (
                        <option key={tz.value} value={tz.value}>
                          {tz.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Cover Image & Upload */}
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Cover Image</label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={formData.coverImage}
                      onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                      placeholder="https://images.unsplash.com/photo-..."
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-teal-500"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 shrink-0 cursor-pointer"
                    >
                      {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5 text-teal-400" />}
                      <span>{isUploading ? "Uploading..." : "Upload File"}</span>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>
                  {formData.coverImage && (
                    <div className="mt-2 h-24 w-full rounded-xl overflow-hidden bg-slate-950 border border-slate-800 relative">
                      <img
                        src={formData.coverImage}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>

                {/* Short Description */}
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Short Description (Homepage Card)
                  </label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Soar above the desert in dawn hot air balloon flights and witness majestic camel pageants..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-teal-500 resize-none"
                  />
                </div>

                {/* Long Story Description */}
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Full Description (Event Details Page)
                  </label>
                  <textarea
                    rows={4}
                    value={formData.longDescription}
                    onChange={(e) => setFormData({ ...formData, longDescription: e.target.value })}
                    placeholder="Detailed festival background, cultural heritage significance, schedule, and guest recommendations..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-teal-500 resize-none"
                  />
                </div>

                {/* Highlights */}
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Curated Highlights (Comma or Line Separated)
                  </label>
                  <input
                    type="text"
                    value={formData.highlightsText}
                    onChange={(e) => setFormData({ ...formData, highlightsText: e.target.value })}
                    placeholder="Hot Air Balloon Flights, Sacred Ghat Aartis, Folk Dances, Desert Camping"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-teal-500"
                  />
                </div>

                {/* Scheduled Publication (publishAt / unpublishAt) */}
                <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-teal-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Scheduled Publication Window (Optional)</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-400 mb-1">Publish At (Auto-Go-Live)</label>
                      <input
                        type="datetime-local"
                        value={formData.publishAt}
                        onChange={(e) => setFormData({ ...formData, publishAt: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-teal-500 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Unpublish At (Auto-Retire)</label>
                      <input
                        type="datetime-local"
                        value={formData.unpublishAt}
                        onChange={(e) => setFormData({ ...formData, unpublishAt: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-teal-500 text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Status & Options */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Publication Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({ ...formData, status: e.target.value as EventRecord["status"] })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-teal-500 cursor-pointer text-xs"
                    >
                      <option value="published">Published (Live)</option>
                      <option value="draft">Draft (Hidden)</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2 pt-6">
                    <input
                      id="feat-check"
                      type="checkbox"
                      checked={formData.featured}
                      onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                      className="w-4 h-4 rounded-md accent-teal-500 cursor-pointer"
                    />
                    <label htmlFor="feat-check" className="text-slate-300 cursor-pointer font-medium">
                      Featured on Carousel
                    </label>
                  </div>

                  <div className="flex items-center gap-2 pt-6">
                    <input
                      id="recur-check"
                      type="checkbox"
                      checked={formData.isRecurring}
                      onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                      className="w-4 h-4 rounded-md accent-teal-500 cursor-pointer"
                    />
                    <label htmlFor="recur-check" className="text-slate-300 cursor-pointer font-medium">
                      Annual Recurring Series
                    </label>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4 flex items-center justify-end gap-2.5 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-6 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-teal-500/20 cursor-pointer"
                  >
                    {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{editingEvent ? "Update Event" : "Create Event"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Duplicate for Next Year */}
        {duplicateModalOpen && duplicatingEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2 text-indigo-400">
                  <Copy className="w-4 h-4" />
                  <h3 className="text-base font-bold text-white">Duplicate for Next Year</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setDuplicateModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                Create the <strong>{duplicateYear}</strong> edition for &ldquo;{duplicatingEvent.title}&rdquo;.
                It will be created as a <strong>Draft</strong> so you can verify the Gregorian dates before publishing.
              </p>

              <div className="space-y-3.5 text-xs mb-5">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Target Edition Year</label>
                  <input
                    type="number"
                    value={duplicateYear}
                    onChange={(e) => {
                      const yr = parseInt(e.target.value, 10);
                      setDuplicateYear(yr);
                      if (duplicateStartDate) {
                        setDuplicateStartDate(`${yr}${duplicateStartDate.slice(4)}`);
                      }
                      if (duplicateEndDate) {
                        setDuplicateEndDate(`${yr}${duplicateEndDate.slice(4)}`);
                      }
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Provisional Start Date</label>
                    <input
                      type="date"
                      value={duplicateStartDate}
                      onChange={(e) => setDuplicateStartDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Provisional End Date</label>
                    <input
                      type="date"
                      value={duplicateEndDate}
                      onChange={(e) => setDuplicateEndDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setDuplicateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteDuplicate}
                  disabled={isDuplicating}
                  className="px-5 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-indigo-500/20 cursor-pointer"
                >
                  {isDuplicating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Generate {duplicateYear} Draft</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default function AdminEventsPage() {
  return (
    <Suspense
      fallback={
        <AdminLayout>
          <div className="py-24 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-teal-400 mb-2" />
            <p className="text-xs">Loading event operations...</p>
          </div>
        </AdminLayout>
      }
    >
      <AdminEventsContent />
    </Suspense>
  );
}
