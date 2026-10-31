"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import {
  Camera,
  Upload,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
  MapPin,
  Calendar,
  User,
  Heart,
  Trash2,
} from "lucide-react";

export default function GuestMemorySubmitPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorBanner, setErrorBanner] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const [formData, setFormData] = useState({
    guestName: "",
    guestEmail: "",
    destinationName: "",
    travelDate: "",
    propertyName: "",
    title: "",
    shortDescription: "",
    story: "",
    images: [] as { id: string; url: string; isCover: boolean }[],
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

        const res = await fetch("/api/upload", {
          method: "POST",
          body: data,
        });

        if (!res.ok) throw new Error("Upload failed");
        const json = await res.json();
        return {
          id: `img_guest_${Date.now()}_${idx}`,
          url: json.url || json.secure_url,
          isCover: formData.images.length === 0 && idx === 0,
        };
      });

      const newImages = await Promise.all(uploadPromises);
      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, ...newImages],
      }));
    } catch {
      setErrorBanner("Failed to upload photographs. Please check file format and try again.");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.guestName.trim()) {
      setErrorBanner("Please provide your name.");
      return;
    }
    if (!formData.guestEmail.trim() || !formData.guestEmail.includes("@")) {
      setErrorBanner("Please provide a valid email address for moderation notification.");
      return;
    }
    if (!formData.destinationName.trim()) {
      setErrorBanner("Destination name is required.");
      return;
    }
    if (!formData.title.trim()) {
      setErrorBanner("A title for your travel story is required.");
      return;
    }
    if (!formData.story.trim() || formData.story.trim().length < 20) {
      setErrorBanner("Please write a few sentences about your holiday experience.");
      return;
    }
    if (formData.images.length === 0) {
      setErrorBanner("Please upload at least one photograph from your trip.");
      return;
    }

    setIsSubmitting(true);
    setErrorBanner("");

    try {
      const cover = formData.images.find((img) => img.isCover)?.url || formData.images[0]?.url;

      const res = await fetch("/api/public/memories/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestName: formData.guestName.trim(),
          guestEmail: formData.guestEmail.trim(),
          destinationName: formData.destinationName.trim(),
          travelDate: formData.travelDate.trim() || undefined,
          propertyName: formData.propertyName.trim() || undefined,
          title: formData.title.trim(),
          shortDescription: formData.shortDescription.trim() || formData.story.slice(0, 140) + "...",
          story: formData.story.trim(),
          images: formData.images,
          coverImage: cover,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setIsSuccess(true);
      } else {
        setErrorBanner(json.message || "Failed to submit travel memory.");
      }
    } catch {
      setErrorBanner("An unexpected network error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6] text-[#172B2A]">
      <Header />

      <main className="flex-1 pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
        {/* Navigation Back */}
        <Link
          href="/#memories"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#006F66] hover:text-[#009F8D] transition-colors mb-6 font-editorial-sans"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Memories</span>
        </Link>

        {isSuccess ? (
          <div className="bg-white border border-[#E8EAE5] rounded-3xl p-8 sm:p-12 text-center space-y-4 shadow-xl animate-in fade-in">
            <div className="w-16 h-16 rounded-full bg-[#E7F6F3] text-[#006F66] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h1 className="font-editorial-serif text-3xl sm:text-4xl font-semibold text-[#172B2A]">
              Thank You for Sharing Your Story!
            </h1>
            <p className="font-editorial-sans text-sm text-[#697875] max-w-lg mx-auto leading-relaxed">
              Your memory has been submitted to the HolidayExpertz editorial curation team. Once reviewed and verified, it will be proudly featured in our public collection.
            </p>
            <div className="pt-4">
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#006F66] hover:bg-[#009F8D] text-white font-bold text-xs uppercase tracking-wider shadow-lg transition-all"
              >
                Return to Homepage
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-[#E8EAE5] rounded-3xl p-6 sm:p-10 shadow-xl space-y-8">
            <div>
              <div className="inline-flex items-center gap-2 text-[#006F66] text-xs font-bold uppercase tracking-[0.18em] font-editorial-sans mb-2">
                <span className="w-6 h-px bg-[#009F8D]" />
                <span>Guest Experiences</span>
              </div>
              <h1 className="font-editorial-serif text-3xl sm:text-4xl font-semibold text-[#172B2A] tracking-tight">
                Share Your Holiday Memory
              </h1>
              <p className="font-editorial-sans text-xs sm:text-sm text-[#697875] mt-1.5 leading-relaxed">
                Inspire fellow explorers by sharing the highlights, photographs, and personal reflections from your holiday stay.
              </p>
            </div>

            {errorBanner && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span className="font-medium">{errorBanner}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Guest Information */}
              <div className="space-y-4">
                <h3 className="font-editorial-serif text-xl font-semibold text-[#172B2A] flex items-center gap-2">
                  <User className="w-4 h-4 text-[#006F66]" />
                  <span>About You</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                  <div>
                    <label className="block font-semibold text-[#172B2A] mb-1 font-editorial-sans">
                      Your Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Aarav Sharma"
                      value={formData.guestName}
                      onChange={(e) => setFormData({ ...formData, guestName: e.target.value })}
                      className="w-full p-3 bg-[#FAF9F6] border border-[#E8EAE5] rounded-xl text-[#172B2A] focus:outline-none focus:border-[#006F66]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#172B2A] mb-1 font-editorial-sans">
                      Email Address <span className="text-rose-500">*</span>{" "}
                      <span className="text-[#697875] font-normal text-xs">(Private)</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. guest@example.com"
                      value={formData.guestEmail}
                      onChange={(e) => setFormData({ ...formData, guestEmail: e.target.value })}
                      className="w-full p-3 bg-[#FAF9F6] border border-[#E8EAE5] rounded-xl text-[#172B2A] focus:outline-none focus:border-[#006F66]"
                    />
                  </div>
                </div>
              </div>

              {/* Destination Details */}
              <div className="space-y-4 pt-4 border-t border-[#E8EAE5]">
                <h3 className="font-editorial-serif text-xl font-semibold text-[#172B2A] flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#006F66]" />
                  <span>Where Did You Travel?</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                  <div>
                    <label className="block font-semibold text-[#172B2A] mb-1 font-editorial-sans">
                      Destination Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Mussoorie, Uttarakhand"
                      value={formData.destinationName}
                      onChange={(e) => setFormData({ ...formData, destinationName: e.target.value })}
                      className="w-full p-3 bg-[#FAF9F6] border border-[#E8EAE5] rounded-xl text-[#172B2A] focus:outline-none focus:border-[#006F66]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#172B2A] mb-1 font-editorial-sans">
                      Travel Date / Season
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. October 2026"
                      value={formData.travelDate}
                      onChange={(e) => setFormData({ ...formData, travelDate: e.target.value })}
                      className="w-full p-3 bg-[#FAF9F6] border border-[#E8EAE5] rounded-xl text-[#172B2A] focus:outline-none focus:border-[#006F66]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-[#172B2A] mb-1 font-editorial-sans">
                      Stay / Property Name <span className="text-[#697875] font-normal text-xs">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Cedar Ridge Villa"
                      value={formData.propertyName}
                      onChange={(e) => setFormData({ ...formData, propertyName: e.target.value })}
                      className="w-full p-3 bg-[#FAF9F6] border border-[#E8EAE5] rounded-xl text-[#172B2A] focus:outline-none focus:border-[#006F66]"
                    />
                  </div>
                </div>
              </div>

              {/* Story Narrative */}
              <div className="space-y-4 pt-4 border-t border-[#E8EAE5]">
                <h3 className="font-editorial-serif text-xl font-semibold text-[#172B2A] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#006F66]" />
                  <span>Your Travel Story</span>
                </h3>

                <div className="space-y-4 text-xs sm:text-sm">
                  <div>
                    <label className="block font-semibold text-[#172B2A] mb-1 font-editorial-sans">
                      Story Title <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. A Peaceful Escape in the Hills"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full p-3 bg-[#FAF9F6] border border-[#E8EAE5] rounded-xl text-[#172B2A] font-bold focus:outline-none focus:border-[#006F66]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#172B2A] mb-1 font-editorial-sans">
                      Full Story <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={5}
                      required
                      placeholder="Share your stay experience, favorite moments, local highlights, and what made this holiday memorable..."
                      value={formData.story}
                      onChange={(e) => setFormData({ ...formData, story: e.target.value })}
                      className="w-full p-3.5 bg-[#FAF9F6] border border-[#E8EAE5] rounded-xl text-[#172B2A] focus:outline-none focus:border-[#006F66] resize-none leading-relaxed"
                    />
                  </div>
                </div>
              </div>

              {/* Photo Uploads */}
              <div className="space-y-4 pt-4 border-t border-[#E8EAE5]">
                <h3 className="font-editorial-serif text-xl font-semibold text-[#172B2A] flex items-center gap-2">
                  <Camera className="w-4 h-4 text-[#006F66]" />
                  <span>Travel Photographs <span className="text-rose-500">*</span></span>
                </h3>

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-[#E8EAE5] hover:border-[#006F66] rounded-3xl p-6 sm:p-8 text-center cursor-pointer bg-[#FAF9F6] hover:bg-white transition-all group"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <div className="w-12 h-12 rounded-2xl bg-white border border-[#E8EAE5] group-hover:border-[#006F66] flex items-center justify-center mx-auto mb-2 text-[#006F66] shadow-xs">
                    {isUploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6" />}
                  </div>
                  <h4 className="font-editorial-sans text-sm font-bold text-[#172B2A]">
                    Click to select travel photos
                  </h4>
                  <p className="font-editorial-sans text-xs text-[#697875] mt-0.5">
                    JPG, PNG, or WebP. The first or designated photo will serve as your cover.
                  </p>
                </div>

                {formData.images.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {formData.images.map((img) => (
                      <div
                        key={img.id}
                        className={`relative rounded-2xl overflow-hidden border aspect-[4/3] bg-slate-100 ${
                          img.isCover ? "border-[#006F66] ring-2 ring-[#006F66]/30" : "border-[#E8EAE5]"
                        }`}
                      >
                        <img src={img.url} alt="Uploaded" className="w-full h-full object-cover" />
                        <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none">
                          {img.isCover ? (
                            <span className="px-2 py-0.5 rounded-full bg-[#006F66] text-white font-bold text-[10px]">
                              Cover
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSetCover(img.id)}
                              className="pointer-events-auto px-2 py-0.5 rounded-full bg-black/70 hover:bg-[#006F66] text-white text-[10px] font-semibold"
                            >
                              Set Cover
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(img.id)}
                            className="pointer-events-auto p-1 rounded-full bg-black/70 hover:bg-rose-500 text-white"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-6 border-t border-[#E8EAE5] flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting || isUploading}
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#006F66] hover:bg-[#009F8D] text-white font-bold text-xs uppercase tracking-wider shadow-lg transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  <span>Submit My Memory</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

