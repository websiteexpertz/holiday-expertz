"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { PropertyType } from "@/types/hotel";
import { useAutoScrollCarousel } from "@/hooks/useAutoScrollCarousel";

interface PropertyTypesProps {
  onSelectCategory: (category: PropertyType) => void;
}

interface DestinationEscape {
  id: string;
  category: PropertyType;
  title: string;
  tagline: string;
  image: string;
  count: number;
}

const ESCAPES: DestinationEscape[] = [
  {
    id: "esc-mountain",
    category: "Luxury Hotels",
    title: "Mountain Retreats",
    tagline: "Himalayan pine lodges & alpine cedar sanctuaries",
    image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=85",
    count: 42,
  },
  {
    id: "esc-villas",
    category: "Villas",
    title: "Private Villas",
    tagline: "Secluded poolside estates with dedicated hosts",
    image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=85",
    count: 36,
  },
  {
    id: "esc-heritage",
    category: "Resorts",
    title: "Heritage Stays",
    tagline: "Royal palaces & historic royal courtyards",
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=85",
    count: 28,
  },
  {
    id: "esc-riverside",
    category: "Boutique Stays",
    title: "Riverside Escapes",
    tagline: "Tranquil backwaters & serene tropical shores",
    image: "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=1200&q=85",
    count: 31,
  },
];

export default function PropertyTypes({ onSelectCategory }: PropertyTypesProps) {
  const handleCategoryClick = (category: PropertyType) => {
    onSelectCategory(category);
    const el = document.getElementById("handpicked");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const {
    sectionRef,
    scrollRef,
    activeIndex,
    canAutoScroll,
    handlePrev,
    handleNext,
    handleGoTo,
    handleScroll,
    handleKeyDown,
    handleTouchStart,
    handleTouchEnd,
    handleTouchCancel,
  } = useAutoScrollCarousel({
    itemsCount: ESCAPES.length,
    speed: 0.58,
    pauseOnHover: true,
  });

  const itemsToRender = canAutoScroll
    ? [...ESCAPES, ...ESCAPES, ...ESCAPES]
    : ESCAPES;

  return (
    <section
      ref={sectionRef}
      id="property-types"
      aria-label="Destination Collections"
      className="pt-8 sm:pt-10 lg:pt-12 pb-6 sm:pb-8 lg:pb-10 bg-[#FAF9F6] border-b border-[#E8EAE5]/60 scroll-mt-20 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 sm:mb-14">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 text-[#006F66] text-xs font-bold uppercase tracking-[0.18em] font-editorial-sans">
              <span className="w-6 h-px bg-[#009F8D]" />
              <span>Destination Collections</span>
            </div>
            <h2 className="font-editorial-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#172B2A] tracking-tight leading-[1.12]">
              Find your kind of escape. <br />
              <span className="italic font-light text-[#006F66]">Curated sanctuaries across iconic landscapes.</span>
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/properties"
              className="inline-flex items-center gap-1.5 text-xs sm:text-[13px] font-semibold text-[#006F66] hover:text-[#009F8D] transition-colors group font-editorial-sans"
            >
              <span>Explore All Destinations</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </Link>

            {canAutoScroll && (
              <div className="hidden sm:flex items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={handlePrev}
                  className="w-10 h-10 rounded-full border border-[#E8EAE5] bg-white hover:bg-[#E7F6F3] flex items-center justify-center text-[#172B2A] hover:text-[#006F66] shadow-sm transition-all duration-200 active:scale-95"
                  aria-label="Previous destinations"
                  title="Previous destinations"
                >
                  <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="w-10 h-10 rounded-full border border-[#E8EAE5] bg-white hover:bg-[#E7F6F3] flex items-center justify-center text-[#172B2A] hover:text-[#006F66] shadow-sm transition-all duration-200 active:scale-95"
                  aria-label="Next destinations"
                  title="Next destinations"
                >
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Carousel Viewport with Smooth Transition & Touch Swipe */}
        <div
          className="group relative"
          onKeyDown={handleKeyDown}
          tabIndex={0}
          role="region"
          aria-roledescription="carousel"
          aria-label="Destination collections auto-scrolling carousel"
        >
          {/* Floating Left Navigation Arrow */}
          {canAutoScroll && (
            <button
              type="button"
              onClick={handlePrev}
              className="hidden sm:flex absolute -left-4 sm:-left-5 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-white/95 text-slate-900 shadow-xl border border-slate-200/90 items-center justify-center transition-all duration-300 hover:bg-slate-900 hover:text-white hover:scale-110 active:scale-95 opacity-0 group-hover:opacity-100"
              aria-label="Previous destinations"
              title="Slide left"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {/* Floating Right Navigation Arrow */}
          {canAutoScroll && (
            <button
              type="button"
              onClick={handleNext}
              className="hidden sm:flex absolute -right-4 sm:-right-5 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-white/95 text-slate-900 shadow-xl border border-slate-200/90 items-center justify-center transition-all duration-300 hover:bg-slate-900 hover:text-white hover:scale-110 active:scale-95 opacity-0 group-hover:opacity-100"
              aria-label="Next destinations"
              title="Slide right"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}

          {/* Continuous Smooth Scroll Viewport */}
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchCancel}
            className="flex gap-4 sm:gap-6 overflow-x-auto scrollbar-none py-2 -mx-4 px-4 sm:mx-0 sm:px-0.5 touch-pan-y select-none"
            style={{
              scrollBehavior: "auto",
              WebkitOverflowScrolling: "touch",
            }}
          >
            {itemsToRender.map((escape, index) => {
              const copyIndex = Math.floor(index / ESCAPES.length);
              const uniqueKey = `${escape.id}-copy-${copyIndex}-${index}`;

              return (
                <div
                  key={uniqueKey}
                  data-carousel-card
                  onClick={() => handleCategoryClick(escape.category)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleCategoryClick(escape.category);
                    }
                  }}
                  className="flex-shrink-0 relative transition-all duration-500 ease-editorial w-[82vw] max-w-[340px] sm:max-w-none sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)] h-[420px] sm:h-[460px] rounded-2xl overflow-hidden cursor-pointer select-none border border-[#E8EAE5] shadow-[0_4px_16px_rgba(23,43,42,0.04)] hover:shadow-[0_20px_40px_rgba(23,43,42,0.16)] hover:-translate-y-1.5 group/card focus:outline-none focus:ring-2 focus:ring-[#009F8D]"
                  aria-label={`Explore ${escape.title}`}
                >
                  {/* Background Photography with Hover Zoom */}
                  <Image
                    src={escape.image}
                    alt={escape.title}
                    fill
                    sizes="(max-width: 640px) 82vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover object-center group-hover/card:scale-105 transition-transform duration-700 ease-editorial"
                  />

                  {/* Minimal Editorial Gradients */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent pointer-events-none" />

                  {/* Card Content Overlay */}
                  <div className="absolute inset-0 p-6 flex flex-col justify-between text-white z-10 pointer-events-none">
                    {/* Top Badge */}
                    <div className="flex items-center justify-between">
                      <span className="font-editorial-sans text-[10px] font-bold uppercase tracking-[0.16em] px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-[#E7F6F3]">
                        {escape.count} Stays
                      </span>
                    </div>

                    {/* Bottom Title & Explore link */}
                    <div className="space-y-2">
                      <h3 className="font-editorial-serif text-2xl sm:text-3xl font-semibold text-white tracking-tight leading-snug group-hover/card:text-[#E7F6F3] transition-colors">
                        {escape.title}
                      </h3>
                      <p className="font-editorial-sans text-xs text-slate-200/80 font-light line-clamp-2 leading-relaxed">
                        {escape.tagline}
                      </p>
                      <div className="pt-2 flex items-center gap-1.5 text-xs font-semibold text-teal-300 group-hover/card:text-white transition-colors">
                        <span>Explore collection</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover/card:translate-x-1.5 transition-transform duration-300" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Pagination Dots */}
          {canAutoScroll && (
            <div className="flex items-center justify-center gap-2 pt-8 sm:pt-10">
              {ESCAPES.map((escape, idx) => (
                <button
                  key={escape.id}
                  type="button"
                  onClick={() => handleGoTo(idx)}
                  className={`h-2 sm:h-2.5 rounded-full transition-all duration-300 ${
                    activeIndex === idx
                      ? "w-8 sm:w-10 bg-[#009F8D]"
                      : "w-2 sm:w-2.5 bg-slate-300 hover:bg-slate-400"
                  }`}
                  aria-label={`Go to slide ${idx + 1}: ${escape.title}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}