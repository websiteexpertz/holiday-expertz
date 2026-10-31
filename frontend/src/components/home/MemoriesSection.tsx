"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MapPin, ArrowRight, ChevronLeft, ChevronRight, Loader2, Sparkles, User, Calendar } from "lucide-react";
import { useAutoScrollCarousel } from "@/hooks/useAutoScrollCarousel";

interface MemoryPublicItem {
  id: string;
  guestName: string;
  title: string;
  shortDescription: string;
  destinationName: string;
  travelDate?: string;
  coverImage: string;
  images: { id: string; url: string; caption?: string; isCover?: boolean }[];
  displayOrder: number;
}

export default function MemoriesSection() {
  const router = useRouter();
  const [memories, setMemories] = useState<MemoryPublicItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function loadPublicMemories() {
      try {
        setIsLoading(true);
        const res = await fetch("/api/public/memories");
        if (!res.ok) throw new Error("Failed to load");
        const data = await res.json();
        if (mounted && data.success && Array.isArray(data.memories)) {
          setMemories(data.memories);
        }
      } catch (err) {
        console.warn("Error loading memories on homepage:", err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    loadPublicMemories();
    return () => {
      mounted = false;
    };
  }, []);

  const {
    sectionRef,
    scrollRef,
    canAutoScroll,
    handlePrev,
    handleNext,
    handleScroll,
    handleKeyDown,
    handleTouchStart,
    handleTouchEnd,
    handleTouchCancel,
  } = useAutoScrollCarousel({
    itemsCount: memories.length,
    speed: 0.52,
    pauseOnHover: true,
  });

  const itemsToRender = canAutoScroll
    ? [...memories, ...memories, ...memories]
    : memories;

  return (
    <section
      ref={sectionRef}
      id="memories"
      aria-label="Travel Memories"
      className="py-16 sm:py-20 lg:py-24 bg-[#FAF9F6] border-b border-[#E8EAE5]/60 overflow-hidden scroll-mt-20"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 sm:mb-14">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 text-[#006F66] text-xs font-bold uppercase tracking-[0.18em] font-editorial-sans">
              <span className="w-6 h-px bg-[#009F8D]" />
              <span>Memories</span>
            </div>
            <h2 className="font-editorial-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#172B2A] tracking-tight leading-[1.12]">
              Timeless Moments & Memories. <br />
              <span className="italic font-light text-[#006F66]">
                Places and experiences that stay with you forever.
              </span>
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/memories/submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#E7F6F3] hover:bg-[#006F66] text-[#006F66] hover:text-white transition-all text-xs font-bold font-editorial-sans shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Share Your Story</span>
            </Link>

            {canAutoScroll && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handlePrev}
                  className="w-10 h-10 rounded-full border border-[#E8EAE5] bg-white hover:bg-[#E7F6F3] flex items-center justify-center text-[#172B2A] hover:text-[#006F66] shadow-sm transition-all duration-200 active:scale-95"
                  aria-label="Previous memory"
                >
                  <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="w-10 h-10 rounded-full border border-[#E8EAE5] bg-white hover:bg-[#E7F6F3] flex items-center justify-center text-[#172B2A] hover:text-[#006F66] shadow-sm transition-all duration-200 active:scale-95"
                  aria-label="Next memory"
                >
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-20 text-[#697875]">
            <Loader2 className="w-6 h-6 animate-spin mr-2 text-[#006F66]" />
            <span className="text-sm font-editorial-sans">Loading travel memories...</span>
          </div>
        )}

        {/* Carousel Grid */}
        {!isLoading && memories.length > 0 && (
          <div
            className="group relative"
            onKeyDown={handleKeyDown}
            tabIndex={0}
            role="region"
            aria-roledescription="carousel"
            aria-label="Travel memories carousel"
          >
          {/* Floating Left Navigation Arrow: smoothly reveals on hover matching Handpicked Properties */}
          {canAutoScroll && (
            <button
              type="button"
              onClick={handlePrev}
              className="hidden sm:flex absolute -left-4 sm:-left-5 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-white/95 text-slate-900 shadow-xl border border-slate-200/90 items-center justify-center transition-all duration-300 hover:bg-slate-900 hover:text-white hover:scale-110 active:scale-95 opacity-0 group-hover:opacity-100"
              aria-label="Previous memories"
              title="Slide left"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {/* Floating Right Navigation Arrow: smoothly reveals on hover matching Handpicked Properties */}
          {canAutoScroll && (
            <button
              type="button"
              onClick={handleNext}
              className="hidden sm:flex absolute -right-4 sm:-right-5 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-white/95 text-slate-900 shadow-xl border border-slate-200/90 items-center justify-center transition-all duration-300 hover:bg-slate-900 hover:text-white hover:scale-110 active:scale-95 opacity-0 group-hover:opacity-100"
              aria-label="Next memories"
              title="Slide right"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}

            <div
              ref={scrollRef}
              onScroll={handleScroll}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              onTouchCancel={handleTouchCancel}
              className="flex gap-5 sm:gap-6 overflow-x-auto scrollbar-none py-2 -mx-4 px-4 sm:mx-0 sm:px-0.5 touch-pan-y select-none"
              style={{ scrollBehavior: "auto", WebkitOverflowScrolling: "touch" }}
            >
              {itemsToRender.map((mem, index) => {
                const copyIndex = Math.floor(index / memories.length);
                const uniqueKey = `mem-${mem.id}-copy${copyIndex}-${index}`;

                return (
                  <div
                    key={uniqueKey}
                    data-carousel-card
                    onClick={() => router.push(`/memories/${mem.id}`)}
                    className="
                      flex-shrink-0 relative overflow-hidden cursor-pointer select-none
                      w-[300px] sm:w-[340px] lg:w-[380px]
                      h-[420px] sm:h-[460px]
                      rounded-3xl
                      shadow-[0_4px_20px_rgba(23,43,42,0.06)]
                      hover:shadow-[0_16px_44px_rgba(23,43,42,0.14)]
                      border border-[#E8EAE5]
                      transition-all duration-500 group/card bg-slate-900
                    "
                  >
                    {/* Photograph */}
                    <Image
                      src={mem.coverImage}
                      alt={mem.title}
                      fill
                      sizes="(max-width: 640px) 300px, (max-width: 1024px) 340px, 380px"
                      className="object-cover object-center transition-transform duration-700 ease-out group-hover/card:scale-105"
                    />

                    {/* Gradient Overlay for Readable Typography */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-black/25 group-hover/card:from-slate-950/95 transition-colors" />

                    {/* Top Badges */}
                    <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/70 backdrop-blur-md border border-white/20 text-[#2DD4BF] font-editorial-sans text-[11px] font-semibold">
                        <MapPin className="w-3 h-3 text-[#2DD4BF]" />
                        <span className="truncate max-w-[160px]">{mem.destinationName}</span>
                      </span>

                      {mem.images.length > 1 && (
                        <span className="px-2 py-0.5 rounded-full bg-slate-950/70 backdrop-blur-md text-white text-[10px] font-mono border border-white/20">
                          {mem.images.length} photos
                        </span>
                      )}
                    </div>

                    {/* Bottom Editorial Content */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 z-10 flex flex-col justify-end space-y-2.5">
                      <div className="flex items-center gap-2 text-white/80 text-xs font-editorial-sans">
                        <span className="font-semibold text-white">{mem.guestName}</span>
                        {mem.travelDate && <span>• {mem.travelDate}</span>}
                      </div>

                      <h3 className="font-editorial-serif text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug group-hover/card:text-[#2DD4BF] transition-colors">
                        {mem.title}
                      </h3>

                      <p className="font-editorial-sans text-xs text-white/75 line-clamp-2 font-light leading-relaxed">
                        {mem.shortDescription}
                      </p>

                      <div className="pt-2 flex items-center gap-1.5 text-xs font-bold text-[#2DD4BF] font-editorial-sans group-hover/card:translate-x-1 transition-transform">
                        <span>Read Travel Story</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && memories.length === 0 && (
          <div className="py-16 text-center text-[#697875] font-editorial-sans text-sm">
            No memories published yet. Check back soon or share your story!
          </div>
        )}
      </div>
    </section>
  );
}
