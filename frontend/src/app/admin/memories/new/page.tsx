"use client";
import { apiUrl } from "@/lib/apiUrl";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { adminClient } from "@/lib/adminClient";
import { MemoryImage } from "@backend/types/memory";
import {
  Camera,
  ArrowLeft,
  Upload,
  Trash2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  MapPin,
  Calendar,
  User,
  Plus,
} from "lucide-react";

export default function AdminNewMemoryPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorBanner, setErrorBanner] = useState("");
  const [successBanner, setSuccessBanner] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    shortDescription: "",
    story: "",
    guestName: "",
    guestEmail: "",
    destinationName: "",
    propertyName: "",
    travelDate: "",
    images: [] as MemoryImage[],
    isPublished: true,
    isActive: true,
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setErrorBanner("");

    try {
      const uploadPromises = Array.from(files).map(async (file, idx) => {
        const data = new FormData();
        data.append("file", file);

        const res = await fetch(apiUrl("/api/upload"), {
          method: "POST",
          body: data,
        });

        if (!res.ok) throw new Error("Upload failed");
        const json = await res.json();
        return {
          id: `img_${Date.now()}_${idx}`,
          url: json.url || json.secure_url,
          isCover: formData.images.length === 0 && idx === 0,
          caption: file.name.replace(/\.[^/.]+$/, ""),
        };
      });

      const newImages = await Promise.all(uploadPromises);
      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, ...newImages],
      }));
    } catch (err: any) {
      console.error("Memory image upload error:", err);
      setErrorBanner("Failed to upload image. Please check file format and try again.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSetCover = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.map((img) => ({
        ...img,
        isCover: img.id === id,
      })),
    }));
  };

  const handleRemoveImage = (id: string) => {
    setFormData((prev) => {
      const filtered = prev.images.filter((img) => img.id !== id);
      if (filtered.length > 0 && !filtered.some((img) => img.isCover)) {
        filtered[0].isCover = true;
      }
      return { ...prev, images: filtered };
    });
  };

  const handleSubmit = async (status: "approved" | "draft") => {
    if (!formData.title.trim()) {
      setErrorBanner("Story title is required.");
      return;
    }
    if (!formData.guestName.trim()) {
      setErrorBanner("Traveller/Guest name is required.");
      return;
    }
    if (!formData.destinationName.trim()) {
      setErrorBanner("Destination name is required (e.g. Mussoorie, Uttarakhand).");
      return;
    }
    if (!formData.story.trim()) {
      setErrorBanner("Full travel story is required.");
      return;
    }
    if (formData.images.length === 0) {
      setErrorBanner("Please upload at least one photograph for this travel memory.");
      return;
    }

    setIsSubmitting(true);
    setErrorBanner("");

    try {
      const cover = formData.images.find((img) => img.isCover)?.url || formData.images[0]?.url;

      const res = await adminClient.memories.create({
        title: formData.title.trim(),
        shortDescription: formData.shortDescription.trim() || formData.story.slice(0, 140) + "...",
        story: formData.story.trim(),
        guestName: formData.guestName.trim(),
        guestEmail: formData.guestEmail.trim() || undefined,
        destinationName: formData.destinationName.trim(),
        propertyName: formData.propertyName.trim() || undefined,
        travelDate: formData.travelDate.trim() || undefined,
        images: formData.images,
        coverImage: cover,
        source: "admin_created",
        status,
        isPublished: status === "approved" ? formData.isPublished : false,
        isActive: formData.isActive,
      });

      if (res.success) {
        setSuccessBanner(
          status === "approved"
            ? "Memory story created and published successfully!"
            : "Memory story saved as draft."
        );
        setTimeout(() => {
          router.push("/admin/memories");
        }, 1200);
      } else {
        setErrorBanner(res.message || "Failed to create memory story.");
      }
    } catch (err: any) {
      setErrorBanner(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-4xl mx-auto pb-16">
        {/* Breadcrumb & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-2">
              <Link href="/admin/memories" className="hover:text-teal-400 transition-colors flex items-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>All Memories</span>
              </Link>
              <span>/</span>
              <span className="text-teal-400 font-bold">New Travel Story</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>Create Travel Memory</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-teal-500/20 text-teal-300 border border-teal-500/30">
                Super Admin
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Publish authentic travel stories with photo galleries to inspire prospective travellers on the homepage.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSubmit("draft")}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all disabled:opacity-40 cursor-pointer"
            >
              Save as Draft
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSubmit("approved")}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-teal-500/20 transition-all disabled:opacity-40 cursor-pointer"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>Publish Live</span>
            </button>
          </div>
        </div>

        {/* Alerts */}
        {errorBanner && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 shadow-lg animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span className="font-medium">{errorBanner}</span>
          </div>
        )}

        {successBanner && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 shadow-lg animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span className="font-medium">{successBanner}</span>
          </div>
        )}

        {/* Form Body */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          {/* Traveller Details */}
          <div className="border-b border-slate-800 pb-5">
            <h2 className="text-base font-bold text-white flex items-center gap-2 mb-1">
              <User className="w-4 h-4 text-teal-400" />
              <span>Traveller & Destination</span>
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Identify the traveller and geographical location where this memory unfolded.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">
                  Traveller / Guest Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aarav & Priya Sharma, The Kapoor Family"
                  value={formData.guestName}
                  onChange={(e) => setFormData({ ...formData, guestName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">
                  Guest Email <span className="text-slate-500 font-normal">(Private)</span>
                </label>
                <input
                  type="email"
                  placeholder="e.g. guest@example.com (Never shown publicly)"
                  value={formData.guestEmail}
                  onChange={(e) => setFormData({ ...formData, guestEmail: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">
                  Destination Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mussoorie, Uttarakhand or Jaipur, Rajasthan"
                  value={formData.destinationName}
                  onChange={(e) => setFormData({ ...formData, destinationName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">
                  Travel Date / Season
                </label>
                <input
                  type="text"
                  placeholder="e.g. October 2026, Autumn 2026"
                  value={formData.travelDate}
                  onChange={(e) => setFormData({ ...formData, travelDate: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-300 mb-1.5">
                  Related Stay / Property <span className="text-slate-500 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. The Oberoi Udaivilas, Cedar Haven Villa"
                  value={formData.propertyName}
                  onChange={(e) => setFormData({ ...formData, propertyName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>
          </div>

          {/* Story Details */}
          <div className="border-b border-slate-800 pb-5">
            <h2 className="text-base font-bold text-white flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-teal-400" />
              <span>Story & Experience Narrative</span>
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Write engaging editorial storytelling that will feature on the card and detail page.
            </p>

            <div className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">
                  Memory Story Title <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. A Peaceful Escape in Mussoorie, Sunset Whispers in Alleppey"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500 font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">
                  Short Teaser Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Catchy 1-2 sentence teaser displayed on the homepage card..."
                  value={formData.shortDescription}
                  onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500 resize-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">
                  Full Travel Story <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={6}
                  required
                  placeholder="Narrate the entire holiday experience: sensory details, scenic views, local food, personal reflections..."
                  value={formData.story}
                  onChange={(e) => setFormData({ ...formData, story: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500 leading-relaxed resize-none"
                />
              </div>
            </div>
          </div>

          {/* Photograph Uploads */}
          <div className="space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2 mb-1">
              <Camera className="w-4 h-4 text-teal-400" />
              <span>Travel Photographs</span>
            </h2>
            <p className="text-xs text-slate-400">
              Upload high-resolution photography. Designate the primary cover photo for the homepage card.
            </p>

            {/* Dropzone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-700 hover:border-teal-500 rounded-3xl p-8 text-center cursor-pointer bg-slate-950/50 hover:bg-slate-950 transition-all group"
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-2xl bg-slate-800 group-hover:bg-teal-500/20 flex items-center justify-center mx-auto mb-3 text-slate-400 group-hover:text-teal-400 transition-colors">
                {isUploading ? <Loader2 className="w-6 h-6 animate-spin text-teal-400" /> : <Upload className="w-6 h-6" />}
              </div>
              <h3 className="text-sm font-bold text-white mb-1">Upload Travel Photographs</h3>
              <p className="text-xs text-slate-500">JPG, PNG, WebP or AVIF supported</p>
            </div>

            {/* Image Gallery */}
            {formData.images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                {formData.images.map((img) => (
                  <div
                    key={img.id}
                    className={`relative rounded-2xl overflow-hidden border group shadow-md aspect-[4/3] bg-slate-950 ${
                      img.isCover ? "border-teal-400 ring-2 ring-teal-400/30" : "border-slate-800"
                    }`}
                  >
                    <img src={img.url} alt="Uploaded memory photo" className="w-full h-full object-cover" />

                    <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none">
                      {img.isCover ? (
                        <span className="px-2 py-0.5 rounded-full bg-teal-500 text-slate-950 font-extrabold text-[10px] shadow-sm">
                          Cover
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSetCover(img.id)}
                          className="pointer-events-auto px-2 py-0.5 rounded-full bg-slate-950/80 hover:bg-teal-500 hover:text-slate-950 text-white text-[10px] font-semibold backdrop-blur-xs transition-colors"
                        >
                          Set Cover
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleRemoveImage(img.id)}
                        className="pointer-events-auto p-1 rounded-full bg-slate-950/80 hover:bg-rose-500 text-white transition-colors"
                        title="Remove photo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

