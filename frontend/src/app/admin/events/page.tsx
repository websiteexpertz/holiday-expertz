"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { adminClient } from "@/lib/adminClient";
import { EventRecord } from "@backend/types/admin";
import { CalendarDays, Plus, Edit2, Trash2, Search, MapPin, Calendar, Loader2 } from "lucide-react";

export default function AdminEventsPage() {
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventRecord | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    description: "",
    coverImage: "",
    startDate: "2026-11-15",
    endDate: "2026-11-20",
    location: "Lake Pichola Promenade",
    city: "Udaipur",
    state: "Rajasthan",
    category: "Cultural Festival",
    registrationLink: "",
    status: "published" as EventRecord["status"],
    featured: true,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const loadEvents = useCallback(async () => {
    setIsLoading(true);
    const res = await adminClient.events.getAll();
    if (res.success && res.data?.events) {
      setEvents(res.data.events);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const handleOpenCreate = () => {
    setEditingEvent(null);
    setFormData({
      title: "",
      slug: "",
      description: "",
      coverImage: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80",
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date(Date.now() + 5 * 86400000).toISOString().split("T")[0],
      location: "City Heritage Pavilion",
      city: "Udaipur",
      state: "Rajasthan",
      category: "Cultural Festival",
      registrationLink: "",
      status: "published",
      featured: true,
    });
    setFormError("");
    setModalOpen(true);
  };

  const handleOpenEdit = (evt: EventRecord) => {
    setEditingEvent(evt);
    setFormData({
      title: evt.title,
      slug: evt.slug,
      description: evt.description,
      coverImage: evt.coverImage,
      startDate: evt.startDate,
      endDate: evt.endDate,
      location: evt.location,
      city: evt.city,
      state: evt.state,
      category: evt.category,
      registrationLink: evt.registrationLink || "",
      status: evt.status,
      featured: evt.featured,
    });
    setFormError("");
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setFormError("Event title is required");
      return;
    }

    setIsSaving(true);
    setFormError("");

    let res;
    if (editingEvent) {
      res = await adminClient.events.update(editingEvent.id, formData);
    } else {
      res = await adminClient.events.create(formData);
    }
    setIsSaving(false);

    if (res.success) {
      setModalOpen(false);
      await loadEvents();
    } else {
      setFormError(res.message || "Failed to save event");
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete event "${title}"?`)) return;
    const res = await adminClient.events.delete(id);
    if (res.success) {
      await loadEvents();
    } else {
      alert(res.message || "Failed to delete event");
    }
  };

  const filtered = events.filter((e) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return e.title.toLowerCase().includes(q) || e.city.toLowerCase().includes(q) || e.category.toLowerCase().includes(q);
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold mb-2">
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Festivals & Celebrations</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Upcoming Events</h1>
            <p className="text-xs text-slate-400 mt-1">
              Curate seasonal festivals, royal polo matches, and cultural gatherings showcased on the website.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-teal-500/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>New Event</span>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search events by title, city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
          />
        </div>

        {isLoading ? (
          <div className="py-24 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-teal-400 mb-2" />
            <p className="text-xs">Loading scheduled events...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl">
            <CalendarDays className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-white">No upcoming events found</h3>
          </div>
        ) : (
          <div className="space-y-3.5">
            {filtered.map((evt) => (
              <div
                key={evt.id}
                className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-850/50 transition-all shadow-lg group flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-5"
              >
                {/* Left: Compact Thumbnail with Overlay Badges */}
                <div className="w-full md:w-44 h-36 md:h-28 rounded-xl sm:rounded-2xl overflow-hidden relative shrink-0 bg-slate-800 border border-slate-800">
                  <img
                    src={evt.coverImage}
                    alt={evt.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {evt.featured && (
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 font-bold text-[10px] shadow-sm">
                      Featured
                    </span>
                  )}
                  <span
                    className={`absolute bottom-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-bold capitalize backdrop-blur-xs ${
                      evt.status === "published"
                        ? "bg-emerald-500/90 text-slate-950"
                        : "bg-slate-950/80 text-slate-300"
                    }`}
                  >
                    {evt.status}
                  </span>
                </div>

                {/* Center: Details & Metadata */}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider">
                      {evt.category}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize border ${
                        evt.status === "published"
                          ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                          : "bg-slate-800 text-slate-400 border-slate-700"
                      }`}
                    >
                      {evt.status}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-300 text-[10px] font-semibold">
                      {evt.city}, {evt.state}
                    </span>
                  </div>

                  <h3 className="font-bold text-white text-base sm:text-lg group-hover:text-emerald-300 transition-colors line-clamp-1">
                    {evt.title}
                  </h3>

                  {evt.description && (
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {evt.description}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap pt-0.5">
                    <div className="inline-flex items-center gap-1.5 text-slate-300">
                      <Calendar className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{evt.startDate} → {evt.endDate}</span>
                    </div>
                    <span className="text-slate-600">•</span>
                    <div className="inline-flex items-center gap-1.5 text-slate-400">
                      <MapPin className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                      <span className="truncate">{evt.location}, {evt.city}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="shrink-0 flex items-center md:flex-col lg:flex-row justify-end gap-2 pt-3 md:pt-0 border-t md:border-t-0 border-slate-800/80">
                  <button
                    onClick={() => handleOpenEdit(evt)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold text-xs transition-colors"
                    title="Edit Event"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDelete(evt.id, evt.title)}
                    className="p-2 text-slate-400 hover:text-red-400 rounded-xl hover:bg-slate-800 transition-colors"
                    title="Delete Event"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl relative custom-scrollbar">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                <h3 className="text-base font-bold text-white">
                  {editingEvent ? "Edit Event" : "Create New Event"}
                </h3>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                >
                  ✕
                </button>
              </div>

              {formError && (
                <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
                  {formError}
                </div>
              )}

              <form onSubmit={handleSave} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Event Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Udaipur World Music Festival 2026"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Start Date *</label>
                    <input
                      type="date"
                      required
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">End Date *</label>
                    <input
                      type="date"
                      required
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">City</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Category</label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Venue / Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Cover Image URL</label>
                  <input
                    type="url"
                    value={formData.coverImage}
                    onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-teal-500 resize-none"
                  />
                </div>

                <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-md"
                  >
                    {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Save Event</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
