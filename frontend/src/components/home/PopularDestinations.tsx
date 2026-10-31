"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MapPin, ArrowRight, ChevronLeft, ChevronRight, Loader2, Sparkles } from "lucide-react";
import { useAutoScrollCarousel } from "@/hooks/useAutoScrollCarousel";

interface PopularDestinationItem {
  id: string;
  name: string;
  cityName: string;
  stateName?: string;
  countryName?: string;
  fullPath: string;
  image: string;
  propertyCount: number;
  cityId?: string;
  stateId?: string;
  countryId?: string;
}

const FALLBACK_POPULAR: PopularDestinationItem[] = [
  {
    id: "ct_udaipur",
    name: "Udaipur",
    cityName: "Udaipur",
    stateName: "Rajasthan",
    countryName: "India",
    fullPath: "Udaipur, Rajasthan, India",
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
    propertyCount: 14,
    cityId: "ct_udaipur",
    stateId: "st_raj",
    countryId: "cnt_in",
  },
  {
    id: "ct_jaipur",
    name: "Jaipur",
    cityName: "Jaipur",
    stateName: "Rajasthan",
    countryName: "India",
    fullPath: "Jaipur, Rajasthan, India",
    image: "https://images.unsplash.com/photo-1603258849062-171881515eb6?auto=format&fit=crop&w=800&q=80",
    propertyCount: 18,
    cityId: "ct_jaipur",
    stateId: "st_raj",
    countryId: "cnt_in",
  },
  {
    id: "ct_panaji",
    name: "Goa",
    cityName: "Panaji",
    stateName: "Goa",
    countryName: "India",
    fullPath: "Goa, India",
    image: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80",
    propertyCount: 22,
    cityId: "ct_panaji",
    stateId: "st_goa",
    countryId: "cnt_in",
  },
  {
    id: "ct_mussoorie",
    name: "Mussoorie",
    cityName: "Mussoorie",
    stateName: "Uttarakhand",
    countryName: "India",
    fullPath: "Mussoorie, Uttarakhand, India",
    image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80",
    propertyCount: 11,
    cityId: "ct_mussoorie",
    stateId: "st_uk",
    countryId: "cnt_in",
  },
  {
    id: "ct_manali",
    name: "Manali",
    cityName: "Manali",
    stateName: "Himachal Pradesh",
    countryName: "India",
    fullPath: "Manali, Himachal Pradesh, India",
    image: "https://images.unsplash.com/photo-1605649487212-47bdab064df7?auto=format&fit=crop&w=800&q=80",
    propertyCount: 16,
    cityId: "ct_manali",
    stateId: "st_hp",
    countryId: "cnt_in",
  },
  {
    id: "ct_munnar",
    name: "Munnar",
    cityName: "Munnar",
    stateName: "Kerala",
    countryName: "India",
    fullPath: "Munnar, Kerala, India",
    image: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=800&q=80",
    propertyCount: 9,
    cityId: "ct_munnar",
    stateId: "st_ker",
    countryId: "cnt_in",
  },
  {
    id: "ct_marina",
    name: "Dubai",
    cityName: "Downtown Dubai",
    stateName: "Dubai",
    countryName: "United Arab Emirates",
    fullPath: "Dubai, United Arab Emirates",
    image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80",
    propertyCount: 25,
    cityId: "ct_marina",
    stateId: "st_dxb",
    countryId: "cnt_ae",
  },
];

export default function PopularDestinations() {
  const router = useRouter();
  const [destinations, setDestinations] = useState<PopularDestinationItem[]>(FALLBACK_POPULAR);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function loadPopular() {
      try {
        setIsLoading(true);
        const res = await fetch("/api/public/locations/autocomplete?level=city&limit=12");
        if (!res.ok) throw new Error("Failed to load");
        const data = await res.json();

        if (mounted && data.success && Array.isArray(data.suggestions) && data.suggestions.length > 0) {
          const mapped: PopularDestinationItem[] = data.suggestions
            .filter((s: any) => s.isPopular || s.propertyCount > 0)
            .map((s: any, idx: number) => {
              const fallback = FALLBACK_POPULAR[idx % FALLBACK_POPULAR.length];
              return {
                id: s.id || s.cityId,
                name: s.name,
                cityName: s.cityName || s.name,
                stateName: s.stateName,
                countryName: s.countryName,
                fullPath: s.fullPath,
                image: s.image || fallback.image,
                propertyCount: s.propertyCount || fallback.propertyCount || 10,
                cityId: s.cityId || s.id,
                stateId: s.stateId,
                countryId: s.countryId,
              };
            });

          if (mapped.length > 0) {
            setDestinations(mapped);
          }
        }
      } catch (err) {
        console.warn("Using fallback popular destinations:", err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    loadPopular();
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
    itemsCount: destinations.length,
    speed: 0.52,
    pauseOnHover: true,
  });

  const itemsToRender = canAutoScroll
    ? [...destinations, ...destinations, ...destinations]
    : destinations;

  const handleDestinationClick = (dest: PopularDestinationItem) => {
    const q = new URLSearchParams();
    if (dest.cityId) q.set("cityId", dest.cityId);
    if (dest.stateId) q.set("stateId", dest.stateId);
    if (dest.countryId) q.set("countryId", dest.countryId);
    q.set("destination", dest.name);
    router.push(`/properties?${q.toString()}`);
  };

  return (
    <section
      ref={sectionRef}
      id="popular-destinations"
      aria-label="Popular Destinations to Visit"
      className="py-16 sm:py-20 lg:py-24 bg-[#FAF9F6] border-b border-[#E8EAE5]/60 overflow-hidden scroll-mt-20"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 sm:mb-14">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 text-[#006F66] text-xs font-bold uppercase tracking-[0.18em] font-editorial-sans">
              <span className="w-6 h-px bg-[#009F8D]" />
              <span>Explore The World</span>
            </div>
            <h2 className="font-editorial-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#172B2A] tracking-tight leading-[1.12]">
              Popular Destinations to Visit. <br />
              <span className="italic font-light text-[#006F66]">
                Iconic cities, tranquil retreats & timeless landscapes.
              </span>
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/properties"
              className="inline-flex items-center gap-1.5 text-xs sm:text-[13px] font-semibold text-[#006F66] hover:text-[#009F8D] transition-colors group font-editorial-sans"
            >
              <span>View All Destinations</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </Link>

            {canAutoScroll && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handlePrev}
                  className="w-10 h-10 rounded-full border border-[#E8EAE5] bg-white hover:bg-[#E7F6F3] flex items-center justify-center text-[#172B2A] hover:text-[#006F66] shadow-sm transition-all duration-200 active:scale-95"
                  aria-label="Previous destination"
                >
                  <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="w-10 h-10 rounded-full border border-[#E8EAE5] bg-white hover:bg-[#E7F6F3] flex items-center justify-center text-[#172B2A] hover:text-[#006F66] shadow-sm transition-all duration-200 active:scale-95"
                  aria-label="Next destination"
                >
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Carousel Grid */}
        <div
          className="group relative"
          onKeyDown={handleKeyDown}
          tabIndex={0}
          role="region"
          aria-roledescription="carousel"
          aria-label="Popular destinations carousel"
        >
          {/* Floating Left Navigation Arrow: same as Handpicked Properties */}
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

          {/* Floating Right Navigation Arrow: same as Handpicked Properties */}
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

          <div
            ref={scrollRef}
            onScroll={handleScroll}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchCancel}
            className="flex gap-5 sm:gap-6 overflow-x-auto scrollbar-none py-2 -mx-4 px-4 sm:mx-0 sm:px-0.5 touch-pan-y select-none"
            style={{ scrollBehavior: "auto", WebkitOverflowScrolling: "touch" }}
          >
            {itemsToRender.map((dest, index) => {
              const copyIndex = Math.floor(index / destinations.length);
              const uniqueKey = `pop-${dest.id}-copy${copyIndex}-${index}`;

              return (
                <div
                  key={uniqueKey}
                  data-carousel-card
                  onClick={() => handleDestinationClick(dest)}
                  className="
                    flex-shrink-0 relative overflow-hidden cursor-pointer select-none
                    w-[260px] sm:w-[280px] lg:w-[300px]
                    h-[360px] sm:h-[400px]
                    rounded-3xl
                    shadow-[0_4px_20px_rgba(23,43,42,0.06)]
                    hover:shadow-[0_16px_40px_rgba(23,43,42,0.14)]
                    border border-[#E8EAE5]
                    transition-all duration-500 group/card
                  "
                >
                  {/* Photograph */}
                  <Image
                    src={dest.image}
                    alt={dest.name}
                    fill
                    sizes="(max-width: 640px) 260px, (max-width: 1024px) 280px, 300px"
                    className="object-cover object-center transition-transform duration-700 ease-out group-hover/card:scale-105"
                  />

                  {/* Gradient overlays */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-black/20 group-hover/card:from-slate-950/90 transition-colors" />

                  {/* Top Property Count Badge */}
                  <div className="absolute top-4 left-4 z-10">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/70 backdrop-blur-md border border-white/20 text-white font-editorial-sans text-[11px] font-semibold">
                      <Sparkles className="w-3 h-3 text-[#2DD4BF]" />
                      <span>{dest.propertyCount} Stays</span>
                    </span>
                  </div>

                  {/* Bottom Text Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6 z-10 flex flex-col justify-end">
                    <div className="flex items-center gap-1.5 text-white/80 text-xs font-editorial-sans mb-1">
                      <MapPin className="w-3.5 h-3.5 text-[#2DD4BF] shrink-0" />
                      <span className="truncate">
                        {[dest.stateName, dest.countryName].filter(Boolean).join(", ")}
                      </span>
                    </div>

                    <h3 className="font-editorial-serif text-2xl font-bold text-white tracking-tight leading-snug group-hover/card:text-[#2DD4BF] transition-colors">
                      {dest.name}
                    </h3>

                    <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-white/90 group-hover/card:text-white font-editorial-sans">
                      <span>Explore stays</span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#2DD4BF] transition-transform group-hover/card:translate-x-1" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

