"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Filter,
  RotateCcw,
  Building2,
  SearchX,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import PropertyCard from "@/components/hotels/PropertyCard";
import PropertyModal from "@/components/hotels/PropertyModal";
import { Hotel, PropertyType, SearchState } from "@/types/hotel";
import { useAutoScrollCarousel } from "@/hooks/useAutoScrollCarousel";

interface HandpickedPropertiesProps {
  hotels: Hotel[];
  searchParams: SearchState | null;
  onResetSearch: () => void;
  selectedCategoryFilter: PropertyType | "All";
  onSelectCategoryFilter: (category: PropertyType | "All") => void;
}

export default function HandpickedProperties({
  hotels,
  searchParams,
  onResetSearch,
  selectedCategoryFilter,
  onSelectCategoryFilter,
}: HandpickedPropertiesProps) {
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);

  const categories: (PropertyType | "All")[] = [
    "All",
    "Luxury Hotels",
    "Resorts",
    "Homestays",
    "Villas",
    "Budget Hotels",
    "Boutique Stays",
  ];

  // Filter properties based on category
  const displayedHotels = hotels.filter((hotel) => {
    if (selectedCategoryFilter === "All") return true;
    return hotel.propertyType === selectedCategoryFilter;
  });

  const {
    sectionRef,
    scrollRef,
    activeIndex,
    isAutoScrolling,
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
    itemsCount: displayedHotels.length,
    activeFilterKey: `${selectedCategoryFilter}-${searchParams?.destination || ""}`,
    pauseOnHover: false,
    isModalOpen: selectedHotel !== null,
  });

  // To enable seamless infinite looping without hardcoding data,
  // we render 3 cloned sets of displayedHotels (Set 0: buffer, Set 1: active, Set 2: buffer).
  const itemsToRender = canAutoScroll
    ? [...displayedHotels, ...displayedHotels, ...displayedHotels]
    : displayedHotels;

  return (
    <section
      ref={sectionRef}
      id="handpicked"
      aria-label="A Collection of Exceptional Stays"
      className="pt-8 sm:pt-10 lg:pt-12 pb-6 sm:pb-8 lg:pb-10 bg-[#FAF9F6] border-b border-[#E8EAE5]/60 scroll-mt-20 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 sm:mb-10">
          <div className="space-y-3 max-w-3xl text-left">
            <div className="inline-flex items-center gap-2 text-[#006F66] text-xs font-bold uppercase tracking-[0.18em] font-editorial-sans">
              <span className="w-6 h-px bg-[#009F8D]" />
              <span>Handpicked Properties</span>
            </div>
            <h2 className="font-editorial-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#172B2A] tracking-tight leading-[1.12]">
              A Collection of Exceptional Stays
            </h2>
            <p className="font-editorial-sans text-slate-600 sm:text-slate-700 text-sm sm:text-base leading-relaxed">
              Explore an inspiring collection of heritage palaces, elegant havelis, beachfront escapes, serene mountain retreats, and luxurious private pool villas. Discover distinctive stays, thoughtfully selected for comfort, character, and memorable holiday experiences.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/properties"
              className="inline-flex items-center gap-1.5 text-xs sm:text-[13px] font-semibold text-[#006F66] hover:text-[#009F8D] transition-colors group font-editorial-sans"
            >
              <span>View All Properties</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </Link>
            {searchParams?.destination && (
              <div className="flex items-center gap-2 bg-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl border border-[#E8EAE5] shadow-sm text-xs font-editorial-sans">
                <div className="truncate max-w-[160px] sm:max-w-none">
                  <span className="text-[#697875]">Stays in </span>
                  <span className="font-bold text-[#172B2A]">
                    &ldquo;{searchParams.destination}&rdquo;
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onResetSearch}
                  className="inline-flex items-center gap-1 px-2 py-0.5 font-semibold text-[#697875] hover:text-rose-600 bg-[#FAF9F6] hover:bg-rose-50 rounded-lg transition-colors text-[11px]"
                  title="Reset search"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              </div>
            )}

            {/* Header Navigation Arrows (Touch & Desktop friendly) */}
            {canAutoScroll && (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={handlePrev}
                  className="w-10 h-10 rounded-full border border-[#E8EAE5] bg-white hover:bg-[#E7F6F3] flex items-center justify-center text-[#172B2A] hover:text-[#006F66] shadow-sm transition-all duration-200 active:scale-95"
                  aria-label="Previous properties"
                  title="Previous properties"
                >
                  <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="w-10 h-10 rounded-full border border-[#E8EAE5] bg-white hover:bg-[#E7F6F3] flex items-center justify-center text-[#172B2A] hover:text-[#006F66] shadow-sm transition-all duration-200 active:scale-95"
                  aria-label="Next properties"
                  title="Next properties"
                >
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Category Tabs Filter (Edge-to-edge scroll on mobile) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 sm:mb-8 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0 font-editorial-sans">
          <div className="flex items-center gap-1 text-xs font-bold text-[#697875] pr-2 flex-shrink-0">
            <Filter className="w-3.5 h-3.5 text-[#009F8D]" />
            <span>Filter:</span>
          </div>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                onSelectCategoryFilter(cat);
              }}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 whitespace-nowrap flex-shrink-0 cursor-pointer ${
                selectedCategoryFilter === cat
                  ? "bg-[#006F66] text-white shadow-sm border border-[#006F66]"
                  : "bg-white text-[#172B2A] hover:bg-[#E7F6F3] border border-[#E8EAE5] hover:border-[#009F8D]/40"
              }`}
            >
              {cat === "All" ? "All Stays" : cat}
            </button>
          ))}
        </div>

        {/* Property Carousel Track or Empty State */}
        {displayedHotels.length > 0 ? (
          <div
            className="group relative"
            onKeyDown={handleKeyDown}
            tabIndex={0}
            role="region"
            aria-roledescription="carousel"
            aria-label="Handpicked properties auto-scrolling carousel"
            aria-live={isAutoScrolling ? "off" : "polite"}
          >
            {/* Floating Left Navigation Arrow: smoothly reveals on hover on tablet/desktop */}
            {canAutoScroll && (
              <button
                type="button"
                onClick={handlePrev}
                className="hidden sm:flex absolute -left-4 sm:-left-5 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-white/95 text-slate-900 shadow-xl border border-slate-200/90 items-center justify-center transition-all duration-300 hover:bg-slate-900 hover:text-white hover:scale-110 active:scale-95 opacity-0 group-hover:opacity-100"
                aria-label="Previous properties"
                title="Slide left"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            {/* Floating Right Navigation Arrow: smoothly reveals on hover on tablet/desktop */}
            {canAutoScroll && (
              <button
                type="button"
                onClick={handleNext}
                className="hidden sm:flex absolute -right-4 sm:-right-5 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-white/95 text-slate-900 shadow-xl border border-slate-200/90 items-center justify-center transition-all duration-300 hover:bg-slate-900 hover:text-white hover:scale-110 active:scale-95 opacity-0 group-hover:opacity-100"
                aria-label="Next properties"
                title="Slide right"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}

            {/* Continuous Smooth Scroll Viewport with mobile edge bleed & card peek */}
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
              {itemsToRender.map((hotel, index) => {
                const copyIndex = Math.floor(index / displayedHotels.length);
                const uniqueKey = `${hotel.id}-copy-${copyIndex}-${index}`;

                return (
                  <div
                    key={uniqueKey}
                    data-carousel-card
                    className="flex-shrink-0 relative transition-transform duration-300 w-[82vw] max-w-[340px] sm:max-w-none sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]"
                  >
                    <PropertyCard
                      hotel={hotel}
                      onViewDetails={(h) => setSelectedHotel(h)}
                    />
                  </div>
                );
              })}
            </div>

            {/* Bottom Controls: Pagination Dots, Counter & Live Scroll Status */}
            {canAutoScroll && (
              <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
                {/* Pagination Dots */}
                <div className="flex items-center gap-1.5 max-w-full overflow-x-auto py-1 scrollbar-none">
                  {displayedHotels.map((hotel, i) => (
                    <button
                      key={`dot-${hotel.id}-${i}`}
                      type="button"
                      onClick={() => handleGoTo(i)}
                      className={`h-2 sm:h-2.5 rounded-full transition-all duration-300 ${
                        activeIndex === i
                          ? "w-6 sm:w-8 bg-teal-600 shadow-sm shadow-teal-600/30"
                          : "w-2 sm:w-2.5 bg-slate-300 hover:bg-slate-400"
                      }`}
                      aria-label={`Go to slide ${i + 1}: ${hotel.name}`}
                      aria-current={activeIndex === i ? "true" : undefined}
                    />
                  ))}
                </div>

                {/* Counter & Status Badge */}
                <div className="flex items-center justify-between w-full sm:w-auto text-xs font-semibold text-slate-500 gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-teal-500" />
                    <span className="text-slate-600 font-medium text-[11px] sm:text-xs">
                      Curated Stays
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
                      {displayedHotels.length}
                    </span>{" "}
                    stays
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Empty State */
          <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border border-slate-200 shadow-sm max-w-xl mx-auto my-6 space-y-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-3xl bg-rose-50 text-rose-500 border border-rose-100 flex items-center justify-center">
              <SearchX className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                No properties found
              </h3>
              <p className="text-xs sm:text-sm text-slate-500">
                We couldn&apos;t find any stays matching your current search or category filter. Try resetting filters to explore all handpicked properties.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                onResetSearch();
                onSelectCategoryFilter("All");
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-bold rounded-xl transition-colors shadow-md shadow-teal-600/20"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Show All Handpicked Stays</span>
            </button>
          </div>
        )}

        {/* View All Properties Bar at Bottom */}
        {displayedHotels.length > 0 && selectedCategoryFilter !== "All" && (
          <div className="mt-8 sm:mt-12 text-center">
            <button
              type="button"
              onClick={() => {
                onSelectCategoryFilter("All");
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 rounded-2xl bg-white hover:bg-slate-100 border border-slate-200 text-xs sm:text-sm font-bold text-slate-800 transition-all shadow-sm hover:shadow"
            >
              <Building2 className="w-4 h-4 text-teal-600" />
              <span>View All Properties ({hotels.length} Stays Available)</span>
            </button>
          </div>
        )}
      </div>

      {/* Property Details Modal */}
      <PropertyModal
        key={selectedHotel?.id || "modal"}
        hotel={selectedHotel}
        onClose={() => setSelectedHotel(null)}
      />
    </section>
  );
}
