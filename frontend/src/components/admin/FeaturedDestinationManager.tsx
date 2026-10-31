"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { adminClient } from "@/lib/adminClient";
import { CountryRecord, StateRecord, CityRecord, AreaRecord, FeaturedDestination } from "@backend/types/admin";
import {
  MapPin, Plus, Trash2, Edit2, ArrowUp, ArrowDown, Eye,
  CheckCircle2, AlertCircle, Loader2, X, Check,
  Image as ImageIcon, Globe, ArrowLeft, RotateCcw, Sparkles,
} from "lucide-react";

interface FeaturedDestinationManagerProps {
  countries: CountryRecord[];
  states: StateRecord[];
  cities: CityRecord[];
  areas: AreaRecord[];
  onBack?: () => void;
}

interface EnrichedFD extends FeaturedDestination {
  locationLabel?: string;
}

type FormMode = "create" | "edit" | null;

export default function FeaturedDestinationManager({
  countries,
  states,
  cities,
  areas,
  onBack,
}: FeaturedDestinationManagerProps) {
  const [items, setItems] = useState<EnrichedFD[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [formMode, setFormMode] = useState<FormMode>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<EnrichedFD | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Form fields
  const [fName, setFName] = useState("");
  const [fCountryId, setFCountryId] = useState("");
  const [fStateId, setFStateId] = useState("");
  const [fCityId, setFCityId] = useState("");
  const [fAreaId, setFAreaId] = useState("");
  const [fImageUrl, setFImageUrl] = useState("");
  const [fHeadline, setFHeadline] = useState("");
  const [fDescription, setFDescription] = useState("");
  const [fIsActive, setFIsActive] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  // Filtered hierarchy
  const filteredStates = states.filter((s) => s.countryId === fCountryId);
  const filteredCities = cities.filter((c) => c.stateId === fStateId);
  const filteredAreas = areas.filter((a) => a.cityId === fCityId);

  const resolveLocationLabel = useCallback(
    (item: FeaturedDestination): string => {
      const parts: string[] = [];
      if (item.areaId) {
        const a = areas.find((x) => x.id === item.areaId);
        if (a) parts.push(a.name);
      }
      if (item.cityId) {
        const c = cities.find((x) => x.id === item.cityId);
        if (c) parts.push(c.name);
      }
      if (item.stateId) {
        const s = states.find((x) => x.id === item.stateId);
        if (s) parts.push(s.name);
      }
      if (item.countryId) {
        const c = countries.find((x) => x.id === item.countryId);
        if (c) parts.push(c.name);
      }
      return parts.join(" – ");
    },
    [areas, cities, states, countries]
  );

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const loadItems = useCallback(async () => {
    setIsLoading(true);
    const res = await adminClient.featuredDestinations.getAll();
    if (res.success && res.data) {
      const enriched = (res.data.destinations || []).map((d) => ({
        ...d,
        locationLabel: resolveLocationLabel(d),
      }));
      setItems(enriched.sort((a, b) => a.order - b.order));
    }
    setIsLoading(false);
  }, [resolveLocationLabel]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const resetForm = () => {
    setFName(""); setFCountryId(""); setFStateId(""); setFCityId(""); setFAreaId("");
    setFImageUrl(""); setFHeadline(""); setFDescription(""); setFIsActive(true);
    setEditingId(null);
  };

  const openCreate = () => {
    resetForm();
    setFormMode("create");
  };

  const openEdit = (item: EnrichedFD) => {
    setFName(item.name);
    setFCountryId(item.countryId);
    setFStateId(item.stateId || "");
    setFCityId(item.cityId || "");
    setFAreaId(item.areaId || "");
    setFImageUrl(item.imageUrl);
    setFHeadline(item.headline);
    setFDescription(item.description);
    setFIsActive(item.isActive);
    setEditingId(item.id);
    setFormMode("edit");
  };

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.success && data.url) {
        setFImageUrl(data.url);
      } else {
        showToast("error", "Upload failed");
      }
    } catch {
      showToast("error", "Upload failed");
    } finally {
      setIsUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fName.trim() || !fCountryId || !fImageUrl || !fHeadline.trim() || !fDescription.trim()) {
      showToast("error", "Name, Country, Image, Headline, and Description are required.");
      return;
    }
    setIsSaving(true);

    const payload = {
      name: fName.trim(),
      countryId: fCountryId,
      stateId: fStateId || undefined,
      cityId: fCityId || undefined,
      areaId: fAreaId || undefined,
      imageUrl: fImageUrl,
      headline: fHeadline.trim(),
      description: fDescription.trim(),
      isActive: fIsActive,
      order: formMode === "create" ? items.length + 1 : (items.find((i) => i.id === editingId)?.order ?? 99),
    };

    let res;
    if (formMode === "edit" && editingId) {
      res = await adminClient.featuredDestinations.update(editingId, payload);
    } else {
      res = await adminClient.featuredDestinations.create(payload as any);
    }

    setIsSaving(false);
    if (res.success) {
      showToast("success", formMode === "edit" ? "Destination updated." : "Destination created.");
      setFormMode(null);
      resetForm();
      await loadItems();
    } else {
      showToast("error", res.message || "Failed to save.");
    }
  };

  const handleDelete = async (item: EnrichedFD) => {
    if (!confirm(`Delete "${item.name}"? This cannot be undone.`)) return;
    const res = await adminClient.featuredDestinations.delete(item.id);
    if (res.success) {
      showToast("success", `"${item.name}" deleted.`);
      await loadItems();
    } else {
      showToast("error", res.message || "Delete failed.");
    }
  };

  const handleToggleActive = async (item: EnrichedFD) => {
    const res = await adminClient.featuredDestinations.update(item.id, { isActive: !item.isActive });
    if (res.success) {
      await loadItems();
    }
  };

  const handleMoveUp = async (item: EnrichedFD) => {
    const sorted = [...items].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex((i) => i.id === item.id);
    if (idx <= 0) return;
    const ids = sorted.map((i) => i.id);
    [ids[idx - 1], ids[idx]] = [ids[idx], ids[idx - 1]];
    await adminClient.featuredDestinations.reorder(ids);
    await loadItems();
  };

  const handleMoveDown = async (item: EnrichedFD) => {
    const sorted = [...items].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex((i) => i.id === item.id);
    if (idx >= sorted.length - 1) return;
    const ids = sorted.map((i) => i.id);
    [ids[idx], ids[idx + 1]] = [ids[idx + 1], ids[idx]];
    await adminClient.featuredDestinations.reorder(ids);
    await loadItems();
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-[200] flex items-center gap-2 px-4 py-3 rounded-2xl shadow-2xl text-sm font-semibold border transition-all ${
          toast.type === "success"
            ? "bg-teal-950 border-teal-500/40 text-teal-300"
            : "bg-red-950 border-red-500/40 text-red-300"
        }`}>
          {toast.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Destination Collections</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Featured Destinations</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage the image-overlay destination cards shown on the homepage.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              onClick={onBack}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          )}
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-teal-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Destination</span>
          </button>
        </div>
      </div>

      {/* Create / Edit Form */}
      {formMode && (
        <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white">
              {formMode === "create" ? "Add New Featured Destination" : "Edit Featured Destination"}
            </h2>
            <button onClick={() => { setFormMode(null); resetForm(); }} className="text-slate-400 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            {/* Row 1: Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                Destination Name *
              </label>
              <input
                value={fName}
                onChange={(e) => setFName(e.target.value)}
                placeholder="e.g. Taj Mahal, Eiffel Tower, Sydney Opera House"
                required
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
              />
            </div>

            {/* Row 2: Location Hierarchy */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Country *</label>
                <select
                  value={fCountryId}
                  onChange={(e) => { setFCountryId(e.target.value); setFStateId(""); setFCityId(""); setFAreaId(""); }}
                  required
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-teal-500 transition-colors"
                >
                  <option value="">Select Country</option>
                  {countries.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">State</label>
                <select
                  value={fStateId}
                  onChange={(e) => { setFStateId(e.target.value); setFCityId(""); setFAreaId(""); }}
                  disabled={!fCountryId}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-teal-500 transition-colors disabled:opacity-40"
                >
                  <option value="">Select State</option>
                  {filteredStates.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">City</label>
                <select
                  value={fCityId}
                  onChange={(e) => { setFCityId(e.target.value); setFAreaId(""); }}
                  disabled={!fStateId}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-teal-500 transition-colors disabled:opacity-40"
                >
                  <option value="">Select City</option>
                  {filteredCities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Area</label>
                <select
                  value={fAreaId}
                  onChange={(e) => setFAreaId(e.target.value)}
                  disabled={!fCityId}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-teal-500 transition-colors disabled:opacity-40"
                >
                  <option value="">Select Area</option>
                  {filteredAreas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
            </div>

            {/* Row 3: Image */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                Background Image *
              </label>
              <div className="flex gap-2">
                <input
                  value={fImageUrl}
                  onChange={(e) => setFImageUrl(e.target.value)}
                  placeholder="Paste image URL or upload below"
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
                />
                <input type="file" ref={fileRef} accept="image/*" className="hidden" onChange={handleUploadImage} />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={isUploading}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold transition-all disabled:opacity-50"
                >
                  {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                  <span>{isUploading ? "Uploading…" : "Upload"}</span>
                </button>
              </div>
              {fImageUrl && (
                <div className="mt-2 relative w-full h-28 rounded-xl overflow-hidden border border-slate-700">
                  <Image src={fImageUrl} alt="Preview" fill className="object-cover" />
                </div>
              )}
            </div>

            {/* Row 4: Headline */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                Headline * <span className="text-slate-500 normal-case font-normal">(short, evocative)</span>
              </label>
              <input
                value={fHeadline}
                onChange={(e) => setFHeadline(e.target.value)}
                placeholder='e.g. "A Timeless Symbol of Love"'
                required
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
              />
            </div>

            {/* Row 5: Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                Description * <span className="text-slate-500 normal-case font-normal">(2–4 sentences)</span>
              </label>
              <textarea
                value={fDescription}
                onChange={(e) => setFDescription(e.target.value)}
                placeholder="Describe why this destination is special, its history, or what makes it worth visiting."
                required
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors resize-none"
              />
            </div>

            {/* Row 6: Active toggle + Actions */}
            <div className="flex items-center justify-between flex-wrap gap-3 pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <div
                  onClick={() => setFIsActive((v) => !v)}
                  className={`relative w-10 h-5.5 rounded-full transition-colors cursor-pointer ${fIsActive ? "bg-teal-500" : "bg-slate-700"}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${fIsActive ? "translate-x-5" : "translate-x-0"}`} />
                </div>
                <span className="text-xs font-semibold text-slate-300">
                  {fIsActive ? "Active (visible on homepage)" : "Inactive (hidden)"}
                </span>
              </label>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => { setFormMode(null); resetForm(); }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold shadow-lg shadow-teal-500/20 transition-all disabled:opacity-60"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {isSaving ? "Saving…" : formMode === "edit" ? "Save Changes" : "Create Destination"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Items List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span className="text-sm">Loading featured destinations…</span>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center">
          <Globe className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">No featured destinations yet.</p>
          <button onClick={openCreate} className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/30 text-xs font-bold transition-colors hover:bg-teal-500/20">
            <Plus className="w-4 h-4" />
            Add First Destination
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, idx) => (
            <div
              key={item.id}
              className={`bg-slate-900 border rounded-2xl overflow-hidden flex gap-0 transition-all ${item.isActive ? "border-slate-800" : "border-slate-800/50 opacity-60"}`}
            >
              {/* Thumbnail */}
              <div className="relative w-28 sm:w-36 flex-shrink-0">
                {item.imageUrl ? (
                  <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                ) : (
                  <div className="absolute inset-0 bg-slate-800 flex items-center justify-center">
                    <ImageIcon className="w-6 h-6 text-slate-600" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
                <div>
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <span className="text-sm font-bold text-white">{item.name}</span>
                      {item.locationLabel && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-teal-400 flex-shrink-0" />
                          <span className="text-[11px] text-slate-400 truncate">{item.locationLabel}</span>
                        </div>
                      )}
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.isActive ? "bg-teal-500/15 text-teal-400 border border-teal-500/30" : "bg-slate-800 text-slate-500 border border-slate-700"}`}>
                      {item.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="text-xs text-amber-400/80 italic mt-1 truncate">{item.headline}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{item.description}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                  <button onClick={() => handleMoveUp(item)} disabled={idx === 0} className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors disabled:opacity-30" title="Move Up">
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleMoveDown(item)} disabled={idx === items.length - 1} className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors disabled:opacity-30" title="Move Down">
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setPreviewItem(item)} className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-teal-300 transition-colors" title="Preview">
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleToggleActive(item)} className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-amber-300 transition-colors" title={item.isActive ? "Deactivate" : "Activate"}>
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-teal-300 transition-colors" title="Edit">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(item)} className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-900/50 text-slate-400 hover:text-red-400 transition-colors" title="Delete">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal — Taj Mahal reference layout */}
      {previewItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setPreviewItem(null)}>
          <div className="relative w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setPreviewItem(null)} className="absolute top-4 right-4 z-30 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors">
              <X className="w-4 h-4" />
            </button>

            <div className="relative h-[380px] sm:h-[440px]">
              {previewItem.imageUrl && (
                <Image src={previewItem.imageUrl} alt={previewItem.name} fill className="object-cover" />
              )}
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/10 via-black/30 to-black/80" />

              {/* Right panel */}
              <div className="absolute right-0 top-0 bottom-0 w-[46%] flex flex-col justify-center px-7 py-6 z-10">
                <div className="flex items-start gap-2 mb-3">
                  <MapPin className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                  <p className="text-xs font-semibold text-white/85 leading-snug">
                    {previewItem.name}
                    {previewItem.locationLabel ? ` – ${previewItem.locationLabel}` : ""}
                  </p>
                </div>
                <div className="w-12 h-px bg-white/30 mb-3" />
                <h3 className="text-xl sm:text-2xl font-normal italic text-amber-300 leading-snug tracking-tight mb-3" style={{ fontFamily: "Georgia, serif" }}>
                  {previewItem.headline}
                </h3>
                <p className="text-xs sm:text-[13px] text-white/80 leading-relaxed font-light">
                  {previewItem.description}
                </p>
              </div>
            </div>

            <div className="bg-slate-900 px-6 py-4 text-center">
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Preview — Destination Collections Card</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

