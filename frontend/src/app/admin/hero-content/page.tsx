"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { adminClient } from "@/lib/adminClient";
import { HeroBannerContentSlot } from "@backend/types/admin";
import {
  Type,
  Save,
  Loader2,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  RotateCcw,
  AlertCircle,
  Layers,
  Info,
} from "lucide-react";

const DEFAULT_SLOTS: HeroBannerContentSlot[] = [
  {
    slotIndex: 0,
    slideNumber: 1,
    heading: "Small places. Big memories.",
    description: "Design-led stays with character.",
    updatedAt: new Date().toISOString(),
  },
  {
    slotIndex: 1,
    slideNumber: 2,
    heading: "Great stays. Smart prices.",
    description: "Clean, comfortable and easy on the wallet.",
    updatedAt: new Date().toISOString(),
  },
  {
    slotIndex: 2,
    slideNumber: 3,
    heading: "Stay local. Feel at home.",
    description: "Warm hosts, home-cooked meals, real stories.",
    updatedAt: new Date().toISOString(),
  },
  {
    slotIndex: 3,
    slideNumber: 4,
    heading: "Unwind. Recharge. Repeat.",
    description: "Beach and hill resorts made for slow days.",
    updatedAt: new Date().toISOString(),
  },
];

export default function AdminHeroContentPage() {
  const [slots, setSlots] = useState<HeroBannerContentSlot[]>(DEFAULT_SLOTS);
  const [isLoading, setIsLoading] = useState(true);
  const [savingSlide, setSavingSlide] = useState<number | null>(null);
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [successSlide, setSuccessSlide] = useState<number | null>(null);
  const [successAll, setSuccessAll] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadContent = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await adminClient.heroContent.get();
      if (res.success && res.data?.heroContent?.slots) {
        const sorted = [...res.data.heroContent.slots].sort(
          (a, b) => a.slideNumber - b.slideNumber
        );
        setSlots(sorted);
      }
    } catch (err: any) {
      console.warn("Could not load hero content from backend:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  const handleFieldChange = (
    slideNumber: number,
    field: "heading" | "description",
    value: string
  ) => {
    setSlots((prev) =>
      prev.map((slot) =>
        slot.slideNumber === slideNumber ? { ...slot, [field]: value } : slot
      )
    );
  };

  const handleSaveSlide = async (slideNumber: number) => {
    const slot = slots.find((s) => s.slideNumber === slideNumber);
    if (!slot) return;

    if (!slot.heading.trim()) {
      setErrorMessage(`Slide ${slideNumber} heading cannot be empty.`);
      return;
    }
    if (!slot.description.trim()) {
      setErrorMessage(`Slide ${slideNumber} description cannot be empty.`);
      return;
    }

    setSavingSlide(slideNumber);
    setErrorMessage(null);

    try {
      const res = await adminClient.heroContent.updateSlide(slideNumber, {
        heading: slot.heading.trim(),
        description: slot.description.trim(),
      });

      if (res.success) {
        setSuccessSlide(slideNumber);
        setTimeout(() => setSuccessSlide(null), 3500);
      } else {
        setErrorMessage(res.message || `Failed to save Slide ${slideNumber}.`);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Network error while saving.");
    } finally {
      setSavingSlide(null);
    }
  };

  const handleSaveAll = async () => {
    // Validate all slots
    for (const slot of slots) {
      if (!slot.heading.trim()) {
        setErrorMessage(`Slide ${slot.slideNumber} heading cannot be empty.`);
        return;
      }
      if (!slot.description.trim()) {
        setErrorMessage(`Slide ${slot.slideNumber} description cannot be empty.`);
        return;
      }
    }

    setIsSavingAll(true);
    setErrorMessage(null);

    try {
      const payload = slots.map((s) => ({
        slideNumber: s.slideNumber,
        heading: s.heading.trim(),
        description: s.description.trim(),
      }));

      const res = await adminClient.heroContent.updateAll(payload);
      if (res.success) {
        setSuccessAll(true);
        setTimeout(() => setSuccessAll(false), 3500);
      } else {
        setErrorMessage(res.message || "Failed to save all hero slides.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Network error while saving all.");
    } finally {
      setIsSavingAll(false);
    }
  };

  const handleResetToDefault = (slideNumber: number) => {
    const def = DEFAULT_SLOTS.find((d) => d.slideNumber === slideNumber);
    if (!def) return;
    setSlots((prev) =>
      prev.map((s) =>
        s.slideNumber === slideNumber
          ? { ...s, heading: def.heading, description: def.description }
          : s
      )
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 text-teal-400 text-xs font-semibold mb-2">
              <Type className="w-3.5 h-3.5" />
              <span>Hero Text Management</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Hero Banner Content
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Independently manage the headings and descriptions for each of the
              four homepage hero slides. These text contexts are tied directly to
              the slide position and remain completely independent of the
              photographs uploaded in image management.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Preview Live Site</span>
            </Link>

            <button
              type="button"
              onClick={handleSaveAll}
              disabled={isSavingAll || isLoading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-teal-900/30 transition-all cursor-pointer"
            >
              {isSavingAll ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving All...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save All Changes</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Informational Architecture Callout */}
        <div className="bg-slate-900/70 border border-teal-500/20 rounded-2xl p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-300 space-y-1">
            <p className="font-semibold text-white">
              Independent Slide Slots Architecture
            </p>
            <p className="text-slate-400 leading-relaxed">
              Replacing, reordering, or uploading images under{" "}
              <Link
                href="/admin/content"
                className="text-teal-400 underline underline-offset-2 hover:text-teal-300"
              >
                Website Content
              </Link>{" "}
              will <strong>never</strong> overwrite these text variations. Slide
              1 text stays with Slide 1, Slide 2 text stays with Slide 2, and so
              forth, ensuring stable, decoupled editorial curation.
            </p>
          </div>
        </div>

        {/* Global Success / Error Feedback */}
        {successAll && (
          <div className="bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs px-4 py-3 rounded-2xl flex items-center gap-2 shadow-lg">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold">
              All four hero slide contexts have been updated and published live!
            </span>
          </div>
        )}

        {errorMessage && (
          <div className="bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs px-4 py-3 rounded-2xl flex items-center gap-2 shadow-lg">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Main Content Loading State */}
        {isLoading ? (
          <div className="py-24 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-teal-400 mb-2" />
            <p className="text-xs">Loading Hero Banner Content slots...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {slots.map((slot) => {
              const isSavingThis = savingSlide === slot.slideNumber;
              const isSuccessThis = successSlide === slot.slideNumber;

              return (
                <div
                  key={slot.slideNumber}
                  className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-5"
                >
                  <div className="space-y-4">
                    {/* Card Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                      <div className="flex items-center gap-2.5">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-teal-500/10 text-teal-400 font-mono font-bold text-xs border border-teal-500/30">
                          {slot.slideNumber}
                        </span>
                        <div>
                          <h2 className="text-sm font-bold text-white tracking-tight">
                            Slide {slot.slideNumber} Content Slot
                          </h2>
                          <span className="text-[10px] text-slate-400">
                            Carousel Index: {slot.slotIndex}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isSuccessThis && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/30">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Saved!</span>
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => handleResetToDefault(slot.slideNumber)}
                          className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 px-2 py-1 rounded-lg hover:bg-slate-800 transition-colors"
                          title="Reset to default text variation"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Reset</span>
                        </button>
                      </div>
                    </div>

                    {/* Heading Input */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-semibold text-slate-300">
                          Slide Heading
                        </label>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {slot.heading.length} chars
                        </span>
                      </div>
                      <input
                        type="text"
                        value={slot.heading}
                        onChange={(e) =>
                          handleFieldChange(
                            slot.slideNumber,
                            "heading",
                            e.target.value
                          )
                        }
                        placeholder="e.g. Small places. Big memories."
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-serif text-base focus:outline-none focus:border-teal-500 transition-colors"
                      />
                    </div>

                    {/* Description Textarea */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-semibold text-slate-300">
                          Slide Description
                        </label>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {slot.description.length} chars
                        </span>
                      </div>
                      <textarea
                        rows={3}
                        value={slot.description}
                        onChange={(e) =>
                          handleFieldChange(
                            slot.slideNumber,
                            "description",
                            e.target.value
                          )
                        }
                        placeholder="e.g. Design-led stays with character."
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-xs leading-relaxed focus:outline-none focus:border-teal-500 transition-colors resize-none"
                      />
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 font-mono">
                      Last updated:{" "}
                      {slot.updatedAt
                        ? new Date(slot.updatedAt).toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "Initial default"}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleSaveSlide(slot.slideNumber)}
                      disabled={isSavingThis}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-teal-600/90 hover:bg-teal-500 text-white text-xs font-bold transition-all shadow-md shadow-teal-900/20 disabled:opacity-50 cursor-pointer"
                    >
                      {isSavingThis ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-3.5 h-3.5" />
                          <span>Save Slide {slot.slideNumber}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

