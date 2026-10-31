"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Sparkles, ArrowRight, Tag, Clock, Info, ChevronLeft, ChevronRight } from "lucide-react";
import { mockDeals } from "@/data/deals";
import { Deal } from "@/types/hotel";
import { useAutoScrollCarousel } from "@/hooks/useAutoScrollCarousel";

interface DealsSectionProps {
  onExploreDeal?: (deal: Deal) => void;
}

export default function DealsSection({ onExploreDeal }: DealsSectionProps) {
  const [activeDealModal, setActiveDealModal] = useState<Deal | null>(null);

  const handleExplore = (deal: Deal) => {
    setActiveDealModal(deal);
    onExploreDeal?.(deal);
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
    itemsCount: mockDeals.length,
    speed: 0.58,
    pauseOnHover: false,
    isModalOpen: activeDealModal !== null,
  });

  const itemsToRender = canAutoScroll
    ? [...mockDeals, ...mockDeals, ...mockDeals]
    : mockDeals;

  return (
    <section
      ref={sectionRef}
      id="deals"
      aria-label="Deals and Seasonal Packages"
      className="pt-8 sm:pt-10 lg:pt-12 pb-6 sm:pb-8 lg:pb-10 bg-white border-b border-[#E8EAE5]/60 scroll-mt-20 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 sm:mb-14">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 text-[#006F66] text-xs font-bold uppercase tracking-[0.18em] font-editorial-sans">
              <span className="w-6 h-px bg-[#009F8D]" />
              <span>Seasonal Inclusions</span>
            </div>
            <h2 className="font-editorial-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#172B2A] tracking-tight leading-[1.12]">
              Curated packages & seasonal rates. <br />
              <span className="italic font-light text-[#006F66]">Restorative privileges for weekend escapes.</span>
            </h2>
          </div>

          {/* Controls: Info Pill & Header Arrows */}
          <div className="flex items-center justify-between sm:justify-end gap-2.5 sm:gap-3 flex-wrap font-editorial-sans">
            <div className="hidden sm:flex text-xs text-[#697875] bg-[#FAF9F6] px-3.5 py-2 rounded-xl border border-[#E8EAE5] items-center gap-2">
              <Info className="w-3.5 h-3.5 text-[#009F8D] flex-shrink-0" />
              <span>{mockDeals.length} curated privileges</span>
            </div>

            {canAutoScroll && (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={handlePrev}
                  className="w-10 h-10 rounded-full border border-[#E8EAE5] bg-white hover:bg-[#E7F6F3] flex items-center justify-center text-[#172B2A] hover:text-[#006F66] shadow-sm transition-all duration-200 active:scale-95"
                  aria-label="Previous deals"
                  title="Previous deals"
                >
                  <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="w-10 h-10 rounded-full border border-[#E8EAE5] bg-white hover:bg-[#E7F6F3] flex items-center justify-center text-[#172B2A] hover:text-[#006F66] shadow-sm transition-all duration-200 active:scale-95"
                  aria-label="Next deals"
                  title="Next deals"
                >
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Carousel Viewport with Mobile Peek */}
        <div
          className="group relative"
          onKeyDown={handleKeyDown}
          tabIndex={0}
          role="region"
          aria-roledescription="carousel"
          aria-label="Deals and holiday packages auto-scrolling carousel"
        >
          {/* Floating Left Navigation Arrow */}
          {canAutoScroll && (
            <button
              type="button"
              onClick={handlePrev}
              className="hidden sm:flex absolute -left-4 sm:-left-5 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-white/95 text-slate-900 shadow-xl border border-slate-200/90 items-center justify-center transition-all duration-300 hover:bg-slate-900 hover:text-white hover:scale-110 active:scale-95 opacity-0 group-hover:opacity-100"
              aria-label="Previous deals"
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
              aria-label="Next deals"
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
            {itemsToRender.map((deal, index) => {
              const copyIndex = Math.floor(index / mockDeals.length);
              const uniqueKey = `deal-${deal.id}-copy-${copyIndex}-${index}`;

              return (
                <div
                  key={uniqueKey}
                  data-carousel-card
                  onClick={() => handleExplore(deal)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleExplore(deal);
                    }
                  }}
                  className="flex-shrink-0 relative transition-transform duration-300 w-[82vw] max-w-[340px] sm:max-w-none sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)] h-[360px] sm:h-[420px] rounded-3xl overflow-hidden group/card shadow-md hover:shadow-2xl cursor-pointer select-none"
                  aria-label={`Explore deal: ${deal.title}`}
                >
                  {/* Full-bleed Background Image with Hover Zoom */}
                  <Image
                    src={deal.image}
                    alt={deal.title}
                    fill
                    sizes="(max-width: 640px) 82vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover group-hover/card:scale-105 transition-transform duration-700"
                  />

                  {/* Cinematic Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent pointer-events-none" />

                  {/* Content Overlay */}
                  <div className="absolute inset-0 p-5 sm:p-6 flex flex-col justify-between text-white z-10">
                    {/* Top Badges Row */}
                    <div className="flex justify-between items-start gap-2">
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md">
                        <Tag className="w-3 h-3" />
                        <span>{deal.discountText}</span>
                      </span>

                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-md border border-white/30 text-white shadow-sm">
                        {deal.badge}
                      </span>
                    </div>

                    {/* Bottom Metadata & Info Stack */}
                    <div className="space-y-1.5">
                      {/* Validity Date */}
                      <div className="flex items-center gap-1.5 text-xs text-teal-300 font-medium">
                        <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{deal.validTill}</span>
                      </div>

                      {/* Deal Title */}
                      <h3 className="text-xl sm:text-2xl font-black tracking-tight leading-tight line-clamp-1">
                        {deal.title}
                      </h3>

                      {/* Description / Inclusions */}
                      <p className="text-xs text-slate-200 line-clamp-1 italic">
                        {deal.subtitle} • {deal.description}
                      </p>

                      {/* Special Offer Tag & Explore Action */}
                      <div className="pt-2 flex items-center justify-between gap-2 border-t border-white/20">
                        <span className="text-[11px] text-amber-300 font-bold uppercase tracking-wider">
                          Special Offer
                        </span>

                        <span className="text-xs font-bold text-teal-300 group-hover/card:text-white inline-flex items-center gap-1 transition-colors">
                          <span>Explore Deal</span>
                          <ArrowRight className="w-3.5 h-3.5 group-hover/card:translate-x-0.5 transition-transform" />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Controls: Pagination Dots & Counter */}
          {canAutoScroll && (
            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
              {/* Pagination Dots */}
              <div className="flex items-center gap-1.5 max-w-full overflow-x-auto py-1 scrollbar-none">
                {mockDeals.map((deal, i) => (
                  <button
                    key={`dot-${deal.id}-${i}`}
                    type="button"
                    onClick={() => handleGoTo(i)}
                    className={`h-2 sm:h-2.5 rounded-full transition-all duration-300 ${
                      activeIndex === i
                        ? "w-6 sm:w-8 bg-amber-500 shadow-sm shadow-amber-500/30"
                        : "w-2 sm:w-2.5 bg-slate-300 hover:bg-slate-400"
                    }`}
                    aria-label={`Go to slide ${i + 1}: ${deal.title}`}
                    aria-current={activeIndex === i ? "true" : undefined}
                  />
                ))}
              </div>

              {/* Counter Badge */}
              <div className="flex items-center justify-between w-full sm:w-auto text-xs font-semibold text-slate-500 gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="text-slate-600 font-medium text-[11px] sm:text-xs">
                    Limited Period Deals
                  </span>
                </div>
                <span className="text-slate-300">•</span>
                <span className="text-[11px] sm:text-xs">
                  Viewing{" "}
                  <span className="text-slate-900 font-bold">
                    {activeIndex + 1}
                  </span>{" "}
                  of{" "}
                  <span className="text-slate-900 font-bold">
                    {mockDeals.length}
                  </span>{" "}
                  offers
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Deal Preview Popup */}
      {activeDealModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                <Sparkles className="w-3.5 h-3.5" />
                {activeDealModal.discountText}
              </span>
              <button
                type="button"
                onClick={() => setActiveDealModal(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <h3 className="text-2xl font-black text-slate-900">
              {activeDealModal.title}
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              {activeDealModal.description}
            </p>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs text-slate-700">
              <p className="font-bold text-slate-900">Package Perks Included:</p>
              <ul className="space-y-1 list-disc list-inside text-slate-600">
                <li>Complimentary chef-curated buffet breakfast daily</li>
                <li>Priority early check-in and guaranteed 3:00 PM late check-out</li>
                <li>₹2,500 resort dining or wellness spa credit per stay</li>
              </ul>
            </div>

            <div className="pt-2 flex gap-3">
              <a
                href="#handpicked"
                onClick={() => setActiveDealModal(null)}
                className="flex-1 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm text-center rounded-xl transition-colors shadow-md shadow-teal-600/20"
              >
                Browse Matching Stays
              </a>
              <button
                type="button"
                onClick={() => setActiveDealModal(null)}
                className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
