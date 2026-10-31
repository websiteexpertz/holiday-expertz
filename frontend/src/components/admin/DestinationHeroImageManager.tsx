"use client";
import { apiUrl } from "@/lib/apiUrl";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { adminClient } from "@/lib/adminClient";
import { CountryRecord, StateRecord, DestinationHeroImage } from "@backend/types/admin";
import {
  Sparkles,
  Upload,
  Plus,
  Trash2,
  Edit2,
  ArrowUp,
  ArrowDown,
  Eye,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Check,
  Image as ImageIcon,
  MapPin,
  Globe,
  Map,
  RotateCcw,
  SlidersHorizontal,
  ExternalLink,
} from "lucide-react";

interface DestinationHeroImageManagerProps {
  countries: CountryRecord[];
  states: StateRecord[];
  initialCountryId?: string;
  initialStateId?: string;
  onBack?: () => void;
}

export default function DestinationHeroImageManager({
  countries,
  states,
  initialCountryId,
  initialStateId,
  onBack,
}: DestinationHeroImageManagerProps) {
  // Country & State Selection
  const defaultCountry = initialCountryId || countries[0]?.id || "cnt_in";
  const [selectedCountryId, setSelectedCountryId] = useState(defaultCountry);
  const [selectedScope, setSelectedScope] = useState<"country" | "state">(
    initialStateId ? "state" : "country"
  );
  const [selectedStateId, setSelectedStateId] = useState(initialStateId || "");

  // Available states for selected country
  const availableStates = states.filter((s) => s.countryId === selectedCountryId);

  // Images state
  const [images, setImages] = useState<DestinationHeroImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  // Upload & Add Modal State
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState("");
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadLocation, setUploadLocation] = useState("");
  const [uploadAltText, setUploadAltText] = useState("");
  const [uploadHeadline, setUploadHeadline] = useState("");
  const [uploadDescription, setUploadDescription] = useState("");
  const [uploadIsActive, setUploadIsActive] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit Modal State
  const [editingImage, setEditingImage] = useState<DestinationHeroImage | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editAltText, setEditAltText] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");
  const [editHeadline, setEditHeadline] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const replaceFileInputRef = useRef<HTMLInputElement>(null);
  const [isReplacing, setIsReplacing] = useState(false);

  // Image Preview Modal
  const [previewImage, setPreviewImage] = useState<DestinationHeroImage | null>(null);

  // Load images for current destination selection
  const loadImages = useCallback(async () => {
    setIsLoading(true);
    setActionError("");
    try {
      const res = await adminClient.destinationHeroImages.getAll({
        countryId: selectedCountryId,
        stateId: selectedScope === "state" ? selectedStateId : undefined,
      });

      if (res.success && res.data?.images) {
        setImages(res.data.images);
      } else {
        setImages([]);
      }
    } catch (err: any) {
      setActionError(err.message || "Failed to load hero images.");
    } finally {
      setIsLoading(false);
    }
  }, [selectedCountryId, selectedScope, selectedStateId]);

  useEffect(() => {
    loadImages();
  }, [loadImages]);

  // Adjust state selection when country changes
  useEffect(() => {
    const statesForCountry = states.filter((s) => s.countryId === selectedCountryId);
    if (selectedScope === "state") {
      if (!statesForCountry.some((s) => s.id === selectedStateId)) {
        setSelectedStateId(statesForCountry[0]?.id || "");
      }
    }
  }, [selectedCountryId, selectedScope, states, selectedStateId]);

  const showNotification = (msg: string) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(""), 3500);
  };

  // Upload file via existing `/api/upload` endpoint
  const handleFileUpload = async (file: File, isReplace = false) => {
    if (isReplace) setIsReplacing(true);
    else setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(apiUrl("/api/upload"), {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data.success && data.url) {
        if (isReplace) {
          setEditImageUrl(data.url);
          showNotification("Image replaced with newly uploaded file!");
        } else {
          setUploadedUrl(data.url);
          if (!uploadTitle) {
            // infer human title from filename
            const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
            setUploadTitle(cleanName);
          }
          showNotification("Photo uploaded successfully!");
        }
      } else {
        alert(data.message || "Upload failed.");
      }
    } catch (err: any) {
      alert(err.message || "Network error during upload.");
    } finally {
      if (isReplace) setIsReplacing(false);
      else setIsUploading(false);
    }
  };

  // Create new Destination Hero Image
  const handleSaveNewImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadedUrl.trim() || !uploadTitle.trim()) {
      alert("Please provide both an image and a title.");
      return;
    }

    try {
      const payload: Partial<DestinationHeroImage> = {
        destinationType: selectedScope,
        countryId: selectedCountryId,
        stateId: selectedScope === "state" ? selectedStateId : undefined,
        title: uploadTitle.trim(),
        locationName: uploadLocation.trim(),
        headline: uploadHeadline.trim() || undefined,
        description: uploadDescription.trim() || undefined,
        imageUrl: uploadedUrl.trim(),
        altText: uploadAltText.trim() || uploadTitle.trim(),
        isActive: uploadIsActive,
        order: images.length + 1,
      };

      const res = await adminClient.destinationHeroImages.create(payload);
      if (res.success) {
        setAddModalOpen(false);
        setUploadedUrl("");
        setUploadTitle("");
        setUploadLocation("");
        setUploadAltText("");
        setUploadHeadline("");
        setUploadDescription("");
        setUploadIsActive(true);
        await loadImages();
        showNotification("New destination hero photo added!");
      } else {
        alert(res.message || "Failed to save hero photo.");
      }
    } catch (err: any) {
      alert(err.message || "Error creating hero photo.");
    }
  };

  // Toggle image active state
  const handleToggleActive = async (image: DestinationHeroImage) => {
    try {
      const nextActive = !image.isActive;
      const res = await adminClient.destinationHeroImages.update(image.id, {
        isActive: nextActive,
      });

      if (res.success) {
        setImages((prev) =>
          prev.map((img) => (img.id === image.id ? { ...img, isActive: nextActive } : img))
        );
        showNotification(`Photo marked as ${nextActive ? "Active" : "Disabled"}.`);
      } else {
        alert(res.message || "Failed to update active state.");
      }
    } catch (err: any) {
      alert(err.message || "Error updating image state.");
    }
  };

  // Delete image
  const handleDeleteImage = async (image: DestinationHeroImage) => {
    if (!confirm(`Are you sure you want to delete '${image.title}' from the slideshow?`)) return;

    try {
      const res = await adminClient.destinationHeroImages.delete(image.id);
      if (res.success) {
        setImages((prev) => prev.filter((img) => img.id !== image.id));
        showNotification("Photo deleted from destination slideshow.");
      } else {
        alert(res.message || "Failed to delete photo.");
      }
    } catch (err: any) {
      alert(err.message || "Error deleting photo.");
    }
  };

  // Reorder images
  const handleMove = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;

    const newImages = [...images];
    const [moved] = newImages.splice(index, 1);
    newImages.splice(targetIndex, 0, moved);

    setImages(newImages);

    try {
      const orderedIds = newImages.map((img) => img.id);
      await adminClient.destinationHeroImages.reorder(orderedIds);
      showNotification("Slideshow order updated!");
    } catch {
      await loadImages();
    }
  };

  // Edit details
  const handleOpenEdit = (image: DestinationHeroImage) => {
    setEditingImage(image);
    setEditTitle(image.title);
    setEditLocation(image.locationName || "");
    setEditAltText(image.altText || "");
    setEditImageUrl(image.imageUrl);
    setEditHeadline(image.headline || "");
    setEditDescription(image.description || "");
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingImage) return;

    try {
      const res = await adminClient.destinationHeroImages.update(editingImage.id, {
        title: editTitle.trim(),
        locationName: editLocation.trim(),
        altText: editAltText.trim() || editTitle.trim(),
        imageUrl: editImageUrl.trim(),
        headline: editHeadline.trim() || undefined,
        description: editDescription.trim() || undefined,
      });

      if (res.success) {
        setEditingImage(null);
        await loadImages();
        showNotification("Photo details updated!");
      } else {
        alert(res.message || "Failed to save photo updates.");
      }
    } catch (err: any) {
      alert(err.message || "Error updating photo.");
    }
  };

  const currentCountryObj = countries.find((c) => c.id === selectedCountryId);
  const currentStateObj = states.find((s) => s.id === selectedStateId);

  return (
    <div className="space-y-6">
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER & DESTINATION FILTER CONTROL
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 text-teal-400 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Properties Hero Destination Slideshows</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Destination Slideshow Images
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Upload and manage rotating photographs for Countries and States shown on the Properties Listing Page.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider transition-all"
              >
                Back to Destinations
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setUploadedUrl("");
                setUploadTitle("");
                setUploadLocation("");
                setUploadAltText("");
                setUploadIsActive(true);
                setAddModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-teal-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Upload Destination Photo</span>
            </button>
          </div>
        </div>

        {/* Success / Error Notification */}
        {actionSuccess && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-medium animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* Destination Scope Selectors: Country & State */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* 1. Country Selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
              1. Country
            </label>
            <div className="relative">
              <select
                value={selectedCountryId}
                onChange={(e) => {
                  setSelectedCountryId(e.target.value);
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-medium focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 cursor-pointer"
              >
                {countries.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 2. Destination Level Scope */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
              2. Target Level
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedScope("country")}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all border ${
                  selectedScope === "country"
                    ? "bg-teal-500 text-slate-950 border-teal-400 shadow-sm"
                    : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
                }`}
              >
                Country Level
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedScope("state");
                  if (!selectedStateId && availableStates.length > 0) {
                    setSelectedStateId(availableStates[0].id);
                  }
                }}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all border ${
                  selectedScope === "state"
                    ? "bg-teal-500 text-slate-950 border-teal-400 shadow-sm"
                    : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
                }`}
              >
                State Level
              </button>
            </div>
          </div>

          {/* 3. State Selector (when State Level is chosen) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
              3. State / Province
            </label>
            {selectedScope === "state" ? (
              <select
                value={selectedStateId}
                onChange={(e) => setSelectedStateId(e.target.value)}
                disabled={availableStates.length === 0}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-medium focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 cursor-pointer disabled:opacity-50"
              >
                {availableStates.length > 0 ? (
                  availableStates.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))
                ) : (
                  <option value="">No states found for {currentCountryObj?.name}</option>
                )}
              </select>
            ) : (
              <div className="w-full bg-slate-950/50 border border-slate-800/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-500 italic">
                National images apply across all stays in {currentCountryObj?.name || "selected country"}.
              </div>
            )}
          </div>
        </div>

        {/* Scope Context Banner */}
        <div className="flex items-center justify-between p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            <span className="text-slate-400">Active Viewing Target:</span>
            <span className="text-white font-bold">
              {selectedScope === "state"
                ? `${currentStateObj?.name || "Selected State"}, ${currentCountryObj?.name || "Country"}`
                : `${currentCountryObj?.name || "Country"} (Country Wide)`}
            </span>
          </div>
          <span className="text-teal-400 font-semibold font-mono">
            {images.length} {images.length === 1 ? "Photograph" : "Photographs"} Loaded
          </span>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. SLIDESHOW IMAGES GRID & ORDER CONTROLS
      ───────────────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-16 text-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-teal-400 mx-auto mb-3" />
          <p className="text-sm font-semibold">Loading destination photography...</p>
        </div>
      ) : images.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-16 text-center text-slate-400 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-800 text-slate-500 flex items-center justify-center mx-auto">
            <ImageIcon className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">No Hero Images Configured</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              {selectedScope === "state"
                ? `No hero slides configured for ${currentStateObj?.name || "this state"}. Upload photos to activate the dynamic slideshow.`
                : `No hero slides configured for ${currentCountryObj?.name || "this country"}. Upload photos to activate the dynamic slideshow.`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setUploadedUrl("");
              setUploadTitle("");
              setUploadLocation("");
              setUploadAltText("");
              setUploadIsActive(true);
              setAddModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add First Photo</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {images.map((img, idx) => (
            <div
              key={img.id}
              className={`bg-slate-900 border rounded-2xl overflow-hidden shadow-lg transition-all flex flex-col justify-between ${
                img.isActive
                  ? "border-slate-800 hover:border-slate-700"
                  : "border-slate-800/40 opacity-70 bg-slate-950/60"
              }`}
            >
              <div>
                {/* Image Thumbnail with Overlay Badges */}
                <div className="relative h-48 w-full bg-slate-950 group overflow-hidden">
                  <Image
                    src={img.imageUrl}
                    alt={img.altText || img.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                  />

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10 pointer-events-none">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-950/80 backdrop-blur-md text-teal-300 border border-white/20">
                      Slide #{idx + 1}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleToggleActive(img)}
                      className={`pointer-events-auto px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-all border ${
                        img.isActive
                          ? "bg-emerald-500/90 text-white border-emerald-400 hover:bg-emerald-600"
                          : "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-white"
                      }`}
                    >
                      {img.isActive ? "Active" : "Disabled"}
                    </button>
                  </div>

                  {/* Quick Preview Hover Button */}
                  <button
                    type="button"
                    onClick={() => setPreviewImage(img)}
                    className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-1.5 text-xs font-semibold backdrop-blur-xs cursor-pointer"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View Full Photograph</span>
                  </button>
                </div>

                {/* Metadata Details */}
                <div className="p-4 space-y-1.5">
                  <h3 className="text-sm font-bold text-white truncate">{img.title}</h3>
                  {img.locationName && (
                    <div className="flex items-center gap-1.5 text-xs text-teal-400 font-medium">
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{img.locationName}</span>
                    </div>
                  )}
                  {img.altText && (
                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                      {img.altText}
                    </p>
                  )}
                </div>
              </div>

              {/* Bottom Actions Bar: Reorder, Edit, Delete */}
              <div className="p-3 bg-slate-950/80 border-t border-slate-800/80 flex items-center justify-between gap-1">
                {/* Reorder Buttons */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleMove(idx, "up")}
                    disabled={idx === 0}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                    title="Move slide earlier"
                    aria-label="Move slide earlier"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMove(idx, "down")}
                    disabled={idx === images.length - 1}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                    title="Move slide later"
                    aria-label="Move slide later"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                </div>

                {/* Edit & Delete Buttons */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(img)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit / Replace</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteImage(img)}
                    className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title="Delete slide"
                    aria-label="Delete slide"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          3. UPLOAD NEW DESTINATION IMAGE MODAL
      ───────────────────────────────────────────────────────────── */}
      {addModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-white space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-teal-400" />
                <h2 className="text-lg font-bold">Add Destination Photograph</h2>
              </div>
              <button
                type="button"
                onClick={() => setAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewImage} className="space-y-4">
              {/* Destination Association Indicator */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs flex items-center justify-between">
                <span className="text-slate-400">Associating with:</span>
                <span className="font-bold text-teal-400">
                  {selectedScope === "state"
                    ? `${currentStateObj?.name}, ${currentCountryObj?.name}`
                    : `${currentCountryObj?.name} (Country Level)`}
                </span>
              </div>

              {/* Photo Upload or URL */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                  Photograph Source
                </label>

                {/* Upload Trigger Box */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="flex-1 py-3 px-4 rounded-xl border border-dashed border-teal-500/40 bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isUploading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    <span>{isUploading ? "Uploading File..." : "Upload from Computer"}</span>
                  </button>
                </div>

                <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
                  <span>Or paste image URL below:</span>
                  <span className="text-slate-500">JPG, PNG, WEBP, AVIF up to 10MB</span>
                </div>

                <input
                  type="url"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={uploadedUrl}
                  onChange={(e) => setUploadedUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                />

                {/* Image Live Preview */}
                {uploadedUrl && (
                  <div className="relative h-36 w-full rounded-xl overflow-hidden border border-slate-700 mt-2 bg-slate-950">
                    <Image
                      src={uploadedUrl}
                      alt="Upload Preview"
                      fill
                      className="object-cover object-center"
                    />
                  </div>
                )}
              </div>

              {/* Title & Attraction Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                  Attraction / Location Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Taj Mahal, Agra or Rishikesh Ganga Aarti"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                />
              </div>

              {/* Specific Sub-Location */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                  Sub-Location Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Chamoli, Uttarakhand or Agra, Uttar Pradesh"
                  value={uploadLocation}
                  onChange={(e) => setUploadLocation(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                />
              </div>

              {/* Alt Text */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                  Accessibility Alt Text
                </label>
                <input
                  type="text"
                  placeholder="Descriptive explanation for screen readers"
                  value={uploadAltText}
                  onChange={(e) => setUploadAltText(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                />
              </div>

              {/* Headline */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-amber-400">
                  Overlay Headline <span className="text-slate-500 font-normal normal-case">(italic gold text shown on image)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. A Timeless Symbol of Love"
                  value={uploadHeadline}
                  onChange={(e) => setUploadHeadline(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-amber-400">
                  Overlay Description <span className="text-slate-500 font-normal normal-case">(short editorial text on image)</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. One of the world's most iconic monuments, celebrated for its magnificent white marble architecture..."
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              {/* Enabled Switch */}
              <label className="flex items-center gap-2.5 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={uploadIsActive}
                  onChange={(e) => setUploadIsActive(e.target.checked)}
                  className="rounded text-teal-500 focus:ring-teal-500"
                />
                <span className="text-xs font-medium text-slate-300">
                  Enable immediately in public destination slideshow
                </span>
              </label>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!uploadedUrl || !uploadTitle}
                  className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-40"
                >
                  Save to Slideshow
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          4. EDIT & REPLACE IMAGE DETAILS MODAL
      ───────────────────────────────────────────────────────────── */}
      {editingImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-white space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-teal-400" />
                <h2 className="text-lg font-bold">Edit / Replace Photograph</h2>
              </div>
              <button
                type="button"
                onClick={() => setEditingImage(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              {/* Photo Preview & Replace */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                  Current Photo &amp; Replace
                </label>
                <div className="relative h-36 w-full rounded-xl overflow-hidden border border-slate-700 bg-slate-950">
                  <Image
                    src={editImageUrl}
                    alt={editTitle}
                    fill
                    className="object-cover object-center"
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  <input
                    ref={replaceFileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, true);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => replaceFileInputRef.current?.click()}
                    disabled={isReplacing}
                    className="py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {isReplacing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    <span>{isReplacing ? "Replacing..." : "Upload New File to Replace"}</span>
                  </button>
                </div>

                <input
                  type="url"
                  placeholder="Or enter new image URL"
                  value={editImageUrl}
                  onChange={(e) => setEditImageUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 mt-1"
                />
              </div>

              {/* Title */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              {/* Sub-location */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                  Sub-Location Name
                </label>
                <input
                  type="text"
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              {/* Alt Text */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                  Alt Text
                </label>
                <input
                  type="text"
                  value={editAltText}
                  onChange={(e) => setEditAltText(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              {/* Headline */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-amber-400">
                  Overlay Headline <span className="text-slate-500 font-normal normal-case">(italic gold text on image)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. A Timeless Symbol of Love"
                  value={editHeadline}
                  onChange={(e) => setEditHeadline(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-amber-400">
                  Overlay Description <span className="text-slate-500 font-normal normal-case">(short editorial text on image)</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. One of the world's most iconic monuments..."
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingImage(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!editImageUrl || !editTitle}
                  className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-40"
                >
                  Update Details
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          5. FULL IMAGE PREVIEW MODAL
      ───────────────────────────────────────────────────────────── */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-4xl w-full bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-[65vh] w-full bg-slate-950">
              <Image
                src={previewImage.imageUrl}
                alt={previewImage.altText || previewImage.title}
                fill
                sizes="(max-width: 1200px) 100vw, 1200px"
                className="object-contain object-center"
              />
            </div>
            <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-white">
              <div>
                <h3 className="font-bold text-sm">{previewImage.title}</h3>
                {previewImage.locationName && (
                  <p className="text-xs text-teal-400">{previewImage.locationName}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-colors"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

