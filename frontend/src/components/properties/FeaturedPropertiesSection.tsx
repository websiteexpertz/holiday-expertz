"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import PropertyCard from "@/components/hotels/PropertyCard";
import { Hotel } from "@/types/hotel";
import { convertPropertyToHotel } from "@/lib/hotelAdapter";
import { apiUrl } from "@/lib/apiUrl";
import { useAutoScrollCarousel } from "@/hooks/useAutoScrollCarousel";
import { resolveCanonicalCountry } from "@/lib/locationFormatter";

interface FeaturedPropertiesSectionProps {
  destination?: string;
  countryId?: string;
  locationType?: string;
}

export default function FeaturedPropertiesSection({
  destination = "",
  countryId,
  locationType,
}: FeaturedPropertiesSectionProps) {
  const router = useRouter();
  const [featuredHotels, setFeaturedHotels] = useState<Hotel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Canonical country detection
  const activeCountry = useMemo(() => {
    // 1. Direct countryId (e.g. from autocomplete suggestion)
    if (countryId) {
      const canonical = resolveCanonicalCountry(countryId);
      if (canonical) return canonical;
    }

    // 2. Check destination text against canonical countries and aliases
    const trimmed = (destination || "").trim();
    if (trimmed) {
      const canonical = resolveCanonicalCountry(trimmed);
      if (canonical) return canonical;

      // If location type explicitly designated as country
      if (locationType === "country") {
        return {
          name: trimmed,
          code: "",
          aliases: [trimmed.toLowerCase()],
        };
      }
    }

    return null;
  }, [destination, countryId, locationType]);

  const activeCountryName = activeCountry?.name || "";

  // Fetch admin-curated featured properties scoped to country
  useEffect(() => {
    let isMounted = true;
    async function loadFeatured() {
      try {
        setIsLoading(true);
        const queryParams = activeCountryName
          ? `?featured=true&country=${encodeURIComponent(activeCountryName)}`
          : "?featured=true";

        const res = await fetch(apiUrl(`/api/public/properties${queryParams}`), {
          cache: "no-store",
        });
        if (!res.ok) {
          if (isMounted) setIsLoading(false);
          return;
        }

        const data = await res.json();
        if (!isMounted) return;

        if (data.success && Array.isArray(data.properties)) {
          // Only approved and active featured properties
          const approvedFeatured = data.properties
            .filter((p: any) => p.status === "approved" && Boolean(p.featured || p.isFeatured))
            .map(convertPropertyToHotel);

          setFeaturedHotels(approvedFeatured);
        } else {
          setFeaturedHotels([]);
        }
      } catch (err) {
        console.warn("Featured properties fetch note:", err);
        if (isMounted) setFeaturedHotels([]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadFeatured();
    return () => {
      isMounted = false;
    };
  }, [activeCountryName]);

  // Continuous auto-rotation hook matching homepage Handpicked Properties translation
  const {
    sectionRef,
    scrollRef,
    canAutoScroll,
    handlePrev,
    handleNext,
    handleScroll,
    handleTouchStart,
    handleTouchEnd,
    handleTouchCancel,
  } = useAutoScrollCarousel({
    itemsCount: featuredHotels.length,
    activeFilterKey: `featured-${activeCountryName}-${featuredHotels.length}`,
    pauseOnHover: false,
  });

  // Seamless 3-set infinite loop buffer
  const itemsToRender = canAutoScroll
    ? [...featuredHotels, ...featuredHotels, ...featuredHotels]
    : featuredHotels;

  // If loading, show subtle skeleton
  if (isLoading) {
    return (
      <div className="w-full bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 sm:p-5">
        <div className="h-3 w-24 bg-slate-200 rounded animate-pulse mb-2" />
        <div className="h-5 w-44 bg-slate-200 rounded animate-pulse mb-1" />
        <div className="h-3 w-64 bg-slate-100 rounded animate-pulse mb-4" />
        <div className="flex gap-4 overflow-hidden">
          <div className="h-[270px] w-[270px] bg-slate-100 rounded-2xl animate-pulse shrink-0" />
          <div className="h-[270px] w-[270px] bg-slate-100 rounded-2xl animate-pulse shrink-0 hidden sm:block" />
        </div>
      </div>
    );
  }

  // Country filter active but no matching featured properties
  if (activeCountry && featuredHotels.length === 0) {
    return (
      <section
        aria-label="Featured Properties"
        className="w-full bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 sm:p-5 relative overflow-hidden"
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-3.5 sm:mb-4">
          <div className="space-y-1 text-left">
            <div className="inline-flex items-center gap-1.5 text-[#006F66] text-[10.5px] font-bold uppercase tracking-[0.18em]">
              <span className="w-4 h-0.5 bg-[#009F8D] rounded-full" />
              <span>Featured Collection • {activeCountry.name}</span>
            </div>
            <h2 className="font-editorial-serif text-2xl sm:text-[26px] font-semibold text-[#172B2A] tracking-tight">
              Featured Properties
            </h2>
            <p className="font-editorial-sans text-xs sm:text-[13px] text-slate-600 max-w-xl">
              Explore exceptional stays selected by Holiday Expertz for your next getaway.
            </p>
          </div>
        </div>

        <div className="py-8 sm:py-10 text-center space-y-1.5 bg-slate-50/60 rounded-xl border border-slate-100">
          <p className="font-editorial-sans text-sm sm:text-[15px] font-medium text-slate-600">
            No featured properties available in{" "}
            <span className="font-bold text-[#172B2A]">{activeCountry.name}</span>.
          </p>
          <p className="font-editorial-sans text-xs text-slate-400">
            Check back soon or explore our full collection of stays below.
          </p>
        </div>
      </section>
    );
  }

  // If no eligible featured properties globally and no country filter, hide section
  if (!featuredHotels || featuredHotels.length === 0) {
    return null;
  }

  return (
    <section
      ref={sectionRef}
      aria-label="Featured Properties"
      className="w-full bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 sm:p-5 relative overflow-hidden"
    >
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-3.5 sm:mb-4">
        <div className="space-y-1 text-left">
          <div className="inline-flex items-center gap-1.5 text-[#006F66] text-[10.5px] font-bold uppercase tracking-[0.18em]">
            <span className="w-4 h-0.5 bg-[#009F8D] rounded-full" />
            <span>
              {activeCountry ? `Featured Collection • ${activeCountry.name}` : "Featured Collection"}
            </span>
          </div>
          <h2 className="font-editorial-serif text-2xl sm:text-[26px] font-semibold text-[#172B2A] tracking-tight">
            Featured Properties
          </h2>
          <p className="font-editorial-sans text-xs sm:text-[13px] text-slate-600 max-w-xl">
            Explore exceptional stays selected by Holiday Expertz for your next getaway.
          </p>
        </div>

        {/* Navigation Arrows (shown if more than 1 property) */}
        {featuredHotels.length > 1 && (
          <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
            <button
              type="button"
              onClick={handlePrev}
              className="w-8 h-8 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 flex items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-95"
              aria-label="Previous featured properties"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="w-8 h-8 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 flex items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-95"
              aria-label="Next featured properties"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Auto-Rotating Continuous Carousel Viewport */}
      {featuredHotels.length === 1 ? (
        <div className="w-full max-w-[290px]">
          <PropertyCard
            hotel={featuredHotels[0]}
            size="compact"
            onViewDetails={(h) => router.push(`/properties/${h.id}`)}
          />
        </div>
      ) : (
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchCancel}
          tabIndex={0}
          aria-label="Featured properties list"
          className="flex gap-3.5 sm:gap-4 overflow-x-auto scrollbar-none py-1 touch-pan-y select-none focus:outline-none"
          style={{
            scrollBehavior: "auto",
            WebkitOverflowScrolling: "touch",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {itemsToRender.map((hotel, index) => {
            const copyIndex = Math.floor(index / featuredHotels.length);
            const uniqueKey = `${hotel.id}-feat-${copyIndex}-${index}`;

            return (
              <div
                key={uniqueKey}
                data-carousel-card
                className="flex-shrink-0 relative transition-transform duration-300 w-[78vw] max-w-[270px] sm:max-w-none sm:w-[260px] md:w-[280px]"
              >
                <PropertyCard
                  hotel={hotel}
                  size="compact"
                  onViewDetails={(h) => router.push(`/properties/${h.id}`)}
                />
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
