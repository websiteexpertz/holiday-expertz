"use client";
import { apiUrl } from "@/lib/apiUrl";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { adminClient } from "@/lib/adminClient";
import { WebsiteContentRecord, HeroSlideItem } from "@backend/types/admin";
import {
  Globe,
  Save,
  Loader2,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Upload,
  ArrowUp,
  ArrowDown,
  Eye,
  Image as ImageIcon,
  Check,
  AlertCircle,
} from "lucide-react";

export default function AdminContentPage() {
  const [content, setContent] = useState<WebsiteContentRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const loadContent = useCallback(async () => {
    setIsLoading(true);
    const res = await adminClient.content.get();
    if (res.success && res.data?.content) {
      setContent(res.data.content);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  const [uploadingSlideId, setUploadingSlideId] = useState<string | null>(null);
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const handleUploadSlide = async (slideId: string, file: File) => {
    if (!content) return;
    setUploadingSlideId(slideId);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(apiUrl("/api/upload"), {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.url) {
        const updatedSlides = (content.hero.slides || []).map((slide) =>
          slide.id === slideId ? { ...slide, imageUrl: data.url } : slide
        );
        setContent({
          ...content,
          hero: {
            ...content.hero,
            slides: updatedSlides,
            backgroundImages: updatedSlides.filter((s) => s.isActive).map((s) => s.imageUrl),
          },
        });
      } else {
        alert(data.message || "Failed to upload slide image.");
      }
    } catch (err: any) {
      alert(err.message || "Upload request error.");
    } finally {
      setUploadingSlideId(null);
    }
  };

  const handleMoveSlide = (index: number, direction: "up" | "down") => {
    if (!content || !content.hero.slides) return;
    const slides = [...content.hero.slides];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= slides.length) return;

    const temp = slides[index];
    slides[index] = slides[targetIndex];
    slides[targetIndex] = temp;

    const reordered = slides.map((s, idx) => ({ ...s, order: idx + 1 }));
    setContent({
      ...content,
      hero: {
        ...content.hero,
        slides: reordered,
        backgroundImages: reordered.filter((s) => s.isActive).map((s) => s.imageUrl),
      },
    });
  };

  const handleToggleSlide = (slideId: string) => {
    if (!content || !content.hero.slides) return;
    const updated = content.hero.slides.map((s) =>
      s.id === slideId ? { ...s, isActive: !s.isActive } : s
    );
    setContent({
      ...content,
      hero: {
        ...content.hero,
        slides: updated,
        backgroundImages: updated.filter((s) => s.isActive).map((s) => s.imageUrl),
      },
    });
  };

  const handleUpdateSlideField = (slideId: string, field: keyof HeroSlideItem, value: any) => {
    if (!content || !content.hero.slides) return;
    const updated = content.hero.slides.map((s) =>
      s.id === slideId ? { ...s, [field]: value } : s
    );
    setContent({
      ...content,
      hero: {
        ...content.hero,
        slides: updated,
        backgroundImages: updated.filter((s) => s.isActive).map((s) => s.imageUrl),
      },
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content) return;

    setIsSaving(true);
    setSavedSuccess(false);
    const res = await adminClient.content.update(content);
    setIsSaving(false);

    if (res.success) {
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } else {
      alert(res.message || "Failed to update website content");
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 text-teal-400 text-xs font-semibold mb-2">
              <Globe className="w-3.5 h-3.5" />
              <span>Live CMS Sections</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Website Dynamic Content</h1>
            <p className="text-xs text-slate-400 mt-1">
              Directly customize the public homepage Hero Headline, Why Choose Us cards, About metrics, and Concierge contact info.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {savedSuccess && (
              <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Changes Published Live!</span>
              </span>
            )}
          </div>
        </div>

        {isLoading || !content ? (
          <div className="py-24 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-teal-400 mb-2" />
            <p className="text-xs">Loading CMS content blocks...</p>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-8 text-xs">
            {/* 1. HERO SECTION */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
                <Sparkles className="w-4 h-4 text-teal-400" />
                <h2 className="text-base font-bold text-white">Homepage Hero Banner</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Badge Tagline</label>
                  <input
                    type="text"
                    value={content.hero.badgeText}
                    onChange={(e) =>
                      setContent({ ...content, hero: { ...content.hero, badgeText: e.target.value } })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">CTA Button Text</label>
                  <input
                    type="text"
                    value={content.hero.ctaText}
                    onChange={(e) =>
                      setContent({ ...content, hero: { ...content.hero, ctaText: e.target.value } })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Main Headline</label>
                <input
                  type="text"
                  value={content.hero.headline}
                  onChange={(e) =>
                    setContent({ ...content, hero: { ...content.hero, headline: e.target.value } })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white font-bold text-sm focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Subheadline Description</label>
                <textarea
                  rows={2}
                  value={content.hero.subheadline}
                  onChange={(e) =>
                    setContent({ ...content, hero: { ...content.hero, subheadline: e.target.value } })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-teal-500 resize-none leading-relaxed"
                />
              </div>

              {/* 4-Image Dynamic Hero Slideshow Section */}
              <div className="pt-4 border-t border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-teal-400" />
                      <span>Four-Image Dynamic Hero Slideshow</span>
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Configure exactly 4 luxury hospitality photographs (Mountain Retreats, Private Villas, Heritage Stays, Riverside Escapes) that rotate automatically every 5 seconds on the homepage.
                    </p>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/30 shrink-0 self-start sm:self-center">
                    {(content.hero.slides || []).filter((s) => s.isActive).length} of {(content.hero.slides || []).length} Active
                  </span>
                </div>

                <div className="space-y-3">
                  {(content.hero.slides || []).map((slide, idx) => (
                    <div
                      key={slide.id || idx}
                      className={`p-4 rounded-2xl border transition-all ${
                        slide.isActive
                          ? "bg-slate-950/80 border-slate-800"
                          : "bg-slate-950/40 border-slate-800/60 opacity-60"
                      }`}
                    >
                      <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                        {/* Slide Position Controls */}
                        <div className="flex md:flex-col items-center gap-1 shrink-0">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMoveSlide(idx, "up")}
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300"
                            title="Move Up"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-xs font-mono font-bold text-teal-400 px-1">
                            #{idx + 1}
                          </span>
                          <button
                            type="button"
                            disabled={idx === (content.hero.slides?.length || 0) - 1}
                            onClick={() => handleMoveSlide(idx, "down")}
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300"
                            title="Move Down"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Thumbnail Image Preview */}
                        <div className="relative w-24 h-16 rounded-xl overflow-hidden bg-slate-900 border border-slate-700 shrink-0 group">
                          {slide.imageUrl ? (
                            <img
                              src={slide.imageUrl}
                              alt={slide.altText || "Hero preview"}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-600">
                              <ImageIcon className="w-5 h-5" />
                            </div>
                          )}
                          <a
                            href={slide.imageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="absolute inset-0 bg-slate-950/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity text-[10px] font-semibold"
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" /> View
                          </a>
                        </div>

                        {/* Slide Metadata Inputs */}
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 w-full">
                          {/* Title / Theme Category */}
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                              Collection / Category
                            </label>
                            <input
                              type="text"
                              value={slide.category || slide.title || ""}
                              onChange={(e) => {
                                handleUpdateSlideField(slide.id, "category", e.target.value);
                                handleUpdateSlideField(slide.id, "title", e.target.value);
                              }}
                              placeholder="e.g. Mountain Retreats"
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-teal-500"
                            />
                          </div>

                          {/* Alt Text for Accessibility */}
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                              Image Alt Text (SEO)
                            </label>
                            <input
                              type="text"
                              value={slide.altText || ""}
                              onChange={(e) => handleUpdateSlideField(slide.id, "altText", e.target.value)}
                              placeholder="Descriptive alt text"
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-teal-500"
                            />
                          </div>

                          {/* Image URL & Upload button */}
                          <div className="sm:col-span-2 lg:col-span-1">
                            <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                              Image URL / Upload
                            </label>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="url"
                                value={slide.imageUrl || ""}
                                onChange={(e) => handleUpdateSlideField(slide.id, "imageUrl", e.target.value)}
                                placeholder="https://..."
                                className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white text-[11px] font-mono focus:outline-none focus:border-teal-500"
                              />
                              <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp,image/avif"
                                className="hidden"
                                ref={(el) => {
                                  fileInputRefs.current[slide.id] = el;
                                }}
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleUploadSlide(slide.id, file);
                                }}
                              />
                              <button
                                type="button"
                                disabled={uploadingSlideId === slide.id}
                                onClick={() => fileInputRefs.current[slide.id]?.click()}
                                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-teal-400 rounded-lg font-semibold text-xs flex items-center gap-1 shrink-0 transition-colors"
                                title="Upload replacement file"
                              >
                                {uploadingSlideId === slide.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Upload className="w-3.5 h-3.5" />
                                )}
                                <span>Upload</span>
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Active Toggle */}
                        <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                          <button
                            type="button"
                            onClick={() => handleToggleSlide(slide.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                              slide.isActive
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                                : "bg-slate-800 text-slate-400 border border-slate-700"
                            }`}
                          >
                            {slide.isActive ? <Check className="w-3 h-3" /> : null}
                            <span>{slide.isActive ? "Active" : "Disabled"}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 2. WHY CHOOSE US CARDS */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
                <ShieldCheck className="w-4 h-4 text-teal-400" />
                <h2 className="text-base font-bold text-white">Why Choose Us (Trust Pillars)</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {content.whyChooseUs.map((card, idx) => (
                  <div key={card.id || idx} className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                    <span className="text-[10px] text-teal-400 font-bold uppercase tracking-wider">
                      Card #{idx + 1}
                    </span>
                    <input
                      type="text"
                      value={card.title}
                      onChange={(e) => {
                        const updatedCards = [...content.whyChooseUs];
                        updatedCards[idx].title = e.target.value;
                        setContent({ ...content, whyChooseUs: updatedCards });
                      }}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-white font-bold focus:outline-none focus:border-teal-500"
                    />
                    <textarea
                      rows={2}
                      value={card.description}
                      onChange={(e) => {
                        const updatedCards = [...content.whyChooseUs];
                        updatedCards[idx].description = e.target.value;
                        setContent({ ...content, whyChooseUs: updatedCards });
                      }}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-300 text-xs focus:outline-none focus:border-teal-500 resize-none"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* 3. ABOUT & PLATFORM METRICS */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <h2 className="text-base font-bold text-white pb-3 border-b border-slate-800">
                Platform Achievements & Counters
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Years in Service</label>
                  <input
                    type="number"
                    value={content.aboutSummary.yearsInService}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        aboutSummary: { ...content.aboutSummary, yearsInService: Number(e.target.value) },
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Properties Managed</label>
                  <input
                    type="number"
                    value={content.aboutSummary.propertiesManaged}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        aboutSummary: { ...content.aboutSummary, propertiesManaged: Number(e.target.value) },
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Happy Travelers</label>
                  <input
                    type="number"
                    value={content.aboutSummary.happyTravelers}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        aboutSummary: { ...content.aboutSummary, happyTravelers: Number(e.target.value) },
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Destinations Covered</label>
                  <input
                    type="number"
                    value={content.aboutSummary.destinationsCovered}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        aboutSummary: { ...content.aboutSummary, destinationsCovered: Number(e.target.value) },
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white font-bold"
                  />
                </div>
              </div>
            </div>

            {/* 4. CONCIERGE & CONTACT */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <h2 className="text-base font-bold text-white pb-3 border-b border-slate-800">
                Official Support & Concierge Details
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Support Email</label>
                  <input
                    type="email"
                    value={content.contactInfo.email}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        contactInfo: { ...content.contactInfo, email: e.target.value },
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Concierge Phone Hotline</label>
                  <input
                    type="text"
                    value={content.contactInfo.phone}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        contactInfo: { ...content.contactInfo, phone: e.target.value },
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-slate-400 font-semibold mb-1">Corporate Headquarters Address</label>
                  <input
                    type="text"
                    value={content.contactInfo.address}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        contactInfo: { ...content.contactInfo, address: e.target.value },
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white"
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex items-center justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-3 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold uppercase tracking-wider text-xs flex items-center gap-2 shadow-xl shadow-teal-500/25 transition-all disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Save All Website Content</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </AdminLayout>
  );
}
