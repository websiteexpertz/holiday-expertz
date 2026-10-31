"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import HotelSearch from "./HotelSearch";
import { SearchState } from "@/types/hotel";
import { HeroSlideItem } from "@backend/types/admin";

interface HeroSectionProps {
  onSearch: (searchParams: SearchState) => void;
}

// Exactly four curated luxury hospitality photographs representing:
// 1. Mountain retreats — Himalayan luxury resort
// 2. Private villas — premium villa with swimming pool
// 3. Heritage stays — elegant heritage palace hotel
// 4. Riverside escapes — luxury riverside or lakeside resort
const FALLBACK_SLIDES: HeroSlideItem[] = [
  {
    id: "slide-1",
    imageUrl: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=2400&q=85",
    altText: "Tropical luxury villa with infinity pool overlooking mountain range",
    title: "Mountain Retreats",
    category: "Mountain Retreats",
    order: 1,
    isActive: true,
  },
  {
    id: "slide-2",
    imageUrl: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=2400&q=85",
    altText: "Private luxury villa with turquoise swimming pool and sun loungers",
    title: "Private Villas",
    category: "Private Villas",
    order: 2,
    isActive: true,
  },
  {
    id: "slide-3",
    imageUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=2400&q=85",
    altText: "Regal heritage palace hotel with serene courtyard reflections",
    title: "Heritage Stays",
    category: "Heritage Stays",
    order: 3,
    isActive: true,
  },
  {
    id: "slide-4",
    imageUrl: "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=2400&q=85",
    altText: "Luxury riverside retreat amidst tranquil tropical waters",
    title: "Riverside Escapes",
    category: "Riverside Escapes",
    order: 4,
    isActive: true,
  },
];

export default function HeroSection({ onSearch }: HeroSectionProps) {
  const [slides, setSlides] = useState<HeroSlideItem[]>(FALLBACK_SLIDES);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [headline, setHeadline] = useState("Escape the ordinary. Stay extraordinary.");
  const [subheadline, setSubheadline] = useState(
    "Discover exceptional stays, from secluded mountain retreats to private luxury villas."
  );
  const [badgeText, setBadgeText] = useState("HOLIDAY EXPERTZ • LUXURY STAYS");

  // Fetch active hero images dynamically from the backend
  useEffect(() => {
    let isMounted = true;
    async function fetchHeroContent() {
      try {
        const res = await fetch("/api/public/content");
        if (!res.ok) return;
        const data = await res.json();
        if (!isMounted) return;

        if (data.success && data.content?.hero) {
          const hero = data.content.hero;
          if (hero.headline) setHeadline(hero.headline);
          if (hero.subheadline) setSubheadline(hero.subheadline);
          if (hero.badgeText) setBadgeText(hero.badgeText);

          if (Array.isArray(hero.slides) && hero.slides.length > 0) {
            const active = hero.slides
              .filter((s: HeroSlideItem) => s.isActive && s.imageUrl)
              .sort((a: HeroSlideItem, b: HeroSlideItem) => a.order - b.order)
              .slice(0, 4);

            if (active.length > 0) {
              setSlides(active);
              return;
            }
          }

          if (Array.isArray(hero.backgroundImages) && hero.backgroundImages.length > 0) {
            const derived = hero.backgroundImages.slice(0, 4).map((url: string, idx: number) => ({
              id: `bg-${idx}`,
              imageUrl: url,
              altText: FALLBACK_SLIDES[idx]?.altText || "HolidayExpertz Luxury Stay",
              title: FALLBACK_SLIDES[idx]?.title || "Luxury Sanctuary",
              category: FALLBACK_SLIDES[idx]?.category || "Featured Stays",
              order: idx + 1,
              isActive: true,
            }));
            setSlides(derived);
          }
        }
      } catch (err) {
        console.warn("Using default luxury photography for hero slideshow:", err);
      }
    }

    fetchHeroContent();
    return () => {
      isMounted = false;
    };
  }, []);

  // Automatic slideshow interval: 5 seconds rotation, smooth crossfade
  useEffect(() => {
    if (slides.length <= 1) return;

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) return;

    let timer: NodeJS.Timeout;

    const startTimer = () => {
      timer = setInterval(() => {
        if (typeof document !== "undefined" && document.hidden) return;
        setCurrentSlideIndex((prev) => (prev + 1) % slides.length);
      }, 5000);
    };

    startTimer();

    const handleVisibilityChange = () => {
      if (document.hidden) {
        clearInterval(timer);
      } else {
        clearInterval(timer);
        startTimer();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [slides.length]);

  return (
    <section
      aria-label="Hero Luxury Hospitality Slideshow"
      className="relative min-h-[580px] lg:min-h-[660px] flex flex-col justify-between pt-12 pb-10 px-4 sm:px-6 lg:px-8 overflow-visible"
    >
      {/* 
        FOUR-IMAGE AUTOMATIC HERO SLIDESHOW
        - Exactly four background images.
        - Only ONE image visible at any given time (opacity-100 vs opacity-0).
        - Smooth crossfade transition (~800ms).
        - ABSOLUTELY NO VISIBLE SLIDESHOW CONTROLS (no arrows, no dots, no numbers).
        - Fixed container dimensions preventing layout shifts.
      */}
      <div className="absolute inset-0 z-0 overflow-hidden bg-slate-900">
        {slides.map((slide, idx) => {
          const isCurrent = idx === currentSlideIndex;
          return (
            <div
              key={slide.id || idx}
              aria-hidden={!isCurrent}
              className={`absolute inset-0 transition-opacity duration-800 ease-in-out ${
                isCurrent ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
              }`}
            >
              <Image
                src={slide.imageUrl}
                alt={slide.altText || "HolidayExpertz luxury sanctuary"}
                fill
                priority={idx === 0}
                sizes="100vw"
                className="object-cover object-center scale-100"
              />
            </div>
          );
        })}

        {/* Subtle Vignette Overlay matching exact reference image */}
        <div className="absolute inset-0 z-20 bg-gradient-to-r from-white/85 via-white/40 to-transparent sm:from-white/80 sm:via-white/30 sm:to-transparent pointer-events-none" />
      </div>

      {/* 
        HERO FIXED CONTENT (LEFT-ALIGNED MATCHING REFERENCE SCREENSHOT)
        - Eyebrow, headline, and description positioned on the left.
        - Booking search bar centered along the bottom.
        - Text and search bar card share the exact same 1180px maximum width container for 100% vertical left-alignment.
      */}
      <div className="relative z-30 max-w-[1180px] mx-auto w-full pt-6 sm:pt-10">
        <div className="max-w-xl text-left">
          {/* Eyebrow Tag matching exact reference */}
          <span className="text-xs sm:text-[12px] font-bold uppercase tracking-[0.22em] text-[#172B2A] mb-3 block font-editorial-sans">
            {badgeText || "HOLIDAY EXPERTZ • LUXURY STAYS"}
          </span>

          {/* Exact Headline from reference image */}
          <h1 className="font-editorial-serif text-5xl sm:text-6xl lg:text-[66px] font-semibold text-[#172B2A] tracking-tight leading-[1.08] mb-4">
            Escape the ordinary.
            <br />
            <span className="italic font-semibold text-[#009F8D]">Stay extraordinary.</span>
          </h1>

          {/* Supporting paragraph from reference image */}
          <p className="font-editorial-sans text-sm sm:text-base text-slate-800 font-medium leading-relaxed max-w-md mb-8">
            {subheadline ||
              "Discover exceptional stays, from secluded mountain retreats to private luxury villas."}
          </p>
        </div>
      </div>

      {/* Booking Search Bar positioned horizontally along the bottom, locked to the exact same left alignment */}
      <div className="relative z-40 max-w-[1180px] mx-auto w-full pt-6 pb-2">
        <HotelSearch onSearch={onSearch} />
      </div>
    </section>
  );
}