"use client";

import { apiUrl } from "@/lib/apiUrl";
import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import HotelSearch from "./HotelSearch";
import { SearchState } from "@/types/hotel";
import { HeroSlideItem, HeroBannerContentSlot } from "@backend/types/admin";

interface HeroSectionProps {
  onSearch: (searchParams: SearchState) => void;
}

interface HeroTextItem {
  heading: string;
  description: string;
}

// Fixed fallback luxury hospitality photographs (4 slides)
const FALLBACK_SLIDES: HeroSlideItem[] = [
  {
    id: "slide-1",
    imageUrl:
      "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=2400&q=85",
    altText: "Tropical luxury villa with infinity pool overlooking mountain range",
    title: "Mountain Retreats",
    category: "Mountain Retreats",
    order: 1,
    isActive: true,
  },
  {
    id: "slide-2",
    imageUrl:
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=2400&q=85",
    altText: "Private luxury villa with turquoise swimming pool and sun loungers",
    title: "Private Villas",
    category: "Private Villas",
    order: 2,
    isActive: true,
  },
  {
    id: "slide-3",
    imageUrl:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=2400&q=85",
    altText: "Regal heritage palace hotel with serene courtyard reflections",
    title: "Heritage Stays",
    category: "Heritage Stays",
    order: 3,
    isActive: true,
  },
  {
    id: "slide-4",
    imageUrl:
      "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=2400&q=85",
    altText: "Luxury riverside retreat amidst tranquil tropical waters",
    title: "Riverside Escapes",
    category: "Riverside Escapes",
    order: 4,
    isActive: true,
  },
];

// Fixed default text variations for the 4 slide positions
const DEFAULT_HERO_TEXTS: HeroTextItem[] = [
  {
    heading: "Small places. Big memories.",
    description: "Design-led stays with character.",
  },
  {
    heading: "Great stays. Smart prices.",
    description: "Clean, comfortable and easy on the wallet.",
  },
  {
    heading: "Stay local. Feel at home.",
    description: "Warm hosts, home-cooked meals, real stories.",
  },
  {
    heading: "Unwind. Recharge. Repeat.",
    description: "Beach and hill resorts made for slow days.",
  },
];

export default function HeroSection({ onSearch }: HeroSectionProps) {
  const [slides, setSlides] = useState<HeroSlideItem[]>(FALLBACK_SLIDES);
  const [heroTexts, setHeroTexts] = useState<HeroTextItem[]>(DEFAULT_HERO_TEXTS);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  const touchStartX = useRef<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch active hero images and independently managed hero text variations
  useEffect(() => {
    let isMounted = true;

    async function fetchHeroData() {
      // 1. Fetch images from content API
      try {
        const res = await fetch(apiUrl("/api/public/content"));
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.success && data.content?.hero) {
            const hero = data.content.hero;
            if (Array.isArray(hero.slides) && hero.slides.length > 0) {
              const active = hero.slides
                .filter((s: HeroSlideItem) => s.isActive && s.imageUrl)
                .sort((a: HeroSlideItem, b: HeroSlideItem) => a.order - b.order)
                .slice(0, 4);

              if (active.length > 0) {
                setSlides(active);
              }
            } else if (
              Array.isArray(hero.backgroundImages) &&
              hero.backgroundImages.length > 0
            ) {
              const derived = hero.backgroundImages
                .slice(0, 4)
                .map((url: string, idx: number) => ({
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
        }
      } catch (err) {
        console.warn("Using default luxury photography for hero slideshow:", err);
      }

      // 2. Fetch independent hero banner texts from dedicated API
      try {
        const textRes = await fetch(apiUrl("/api/public/hero-content"));
        if (textRes.ok) {
          const textData = await textRes.json();
          if (
            isMounted &&
            textData.success &&
            Array.isArray(textData.slots) &&
            textData.slots.length >= 4
          ) {
            const sorted = [...textData.slots].sort(
              (a: HeroBannerContentSlot, b: HeroBannerContentSlot) =>
                a.slideNumber - b.slideNumber
            );
            setHeroTexts(
              sorted.map((s: HeroBannerContentSlot) => ({
                heading: s.heading,
                description: s.description,
              }))
            );
          }
        }
      } catch (err) {
        console.warn("Using default text variations for hero slideshow:", err);
      }
    }

    fetchHeroData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Handlers for slide transitions (resets auto-rotation timer)
  const resetTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    timerRef.current = setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) return;
      setCurrentSlideIndex((prev) => (prev + 1) % 4);
    }, 5000);
  }, []);

  const handlePrev = useCallback(() => {
    setCurrentSlideIndex((prev) => (prev - 1 + 4) % 4);
    resetTimer();
  }, [resetTimer]);

  const handleNext = useCallback(() => {
    setCurrentSlideIndex((prev) => (prev + 1) % 4);
    resetTimer();
  }, [resetTimer]);

  const handleGoTo = useCallback(
    (index: number) => {
      setCurrentSlideIndex(index % 4);
      resetTimer();
    },
    [resetTimer]
  );

  // Automatic slideshow interval: 5 seconds rotation, smooth crossfade
  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) return;

    resetTimer();

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (timerRef.current) clearInterval(timerRef.current);
      } else {
        resetTimer();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [resetTimer]);

  // Touch swipe support
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    touchStartX.current = null;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
  };

  // Active text context matching currentSlideIndex
  const activeText = heroTexts[currentSlideIndex % heroTexts.length] || DEFAULT_HERO_TEXTS[0];

  return (
    <section
      aria-label="Hero Luxury Hospitality Slideshow"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="relative min-h-[460px] sm:min-h-[500px] lg:min-h-[530px] flex flex-col justify-center pt-24 sm:pt-28 lg:pt-30 pb-5 sm:pb-7 lg:pb-8 px-4 sm:px-6 lg:px-8 overflow-visible select-none"
    >
      {/* 
        FOUR-IMAGE AUTOMATIC HERO SLIDESHOW
        - Exactly four background images.
        - Only ONE image visible at any given time (opacity-100 vs opacity-0).
        - Smooth crossfade transition (~800ms).
        - Independent of the text content slots.
      */}
      <div className="absolute inset-0 z-0 overflow-hidden bg-slate-900 pointer-events-none">
        {slides.slice(0, 4).map((slide, idx) => {
          const isCurrent = idx === currentSlideIndex;
          return (
            <div
              key={slide.id || idx}
              aria-hidden={!isCurrent}
              className={`absolute inset-0 transition-opacity duration-800 ease-in-out ${
                isCurrent ? "opacity-100 z-10" : "opacity-0 z-0"
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

        {/* Subtle Vignette Overlay for readable text over photography */}
        <div className="absolute inset-0 z-20 bg-gradient-to-r from-white/90 via-white/50 to-transparent sm:from-white/85 sm:via-white/40 sm:to-transparent" />
      </div>

      {/* 
        HERO SYNCHRONIZED CONTENT & SEARCH BAR
        - Synchronized with active slide index.
        - Subtle fade transition on slide change.
        - Booking search bar directly underneath.
      */}
      <div className="relative z-30 max-w-[1180px] mx-auto w-full flex flex-col">
        <div className="max-w-2xl text-left min-h-[100px] sm:min-h-[115px] flex flex-col justify-end">
          {/* Fading text container keyed by currentSlideIndex */}
          <div
            key={currentSlideIndex}
            className="transition-all duration-500 ease-out"
            style={{
              animation: "heroTextFade 0.5s ease-out forwards",
            }}
          >
            <h1 className="font-editorial-serif text-4xl sm:text-5xl lg:text-[62px] font-semibold text-[#172B2A] tracking-tight leading-[1.08] mb-2 sm:mb-3">
              {activeText.heading}
            </h1>

            <p className="font-editorial-sans text-sm sm:text-base text-slate-800 font-medium leading-relaxed max-w-lg mb-3 sm:mb-4">
              {activeText.description}
            </p>
          </div>
        </div>

        {/* Booking Search Bar positioned directly under the text with responsive spacing */}
        <div id="hero-search-bar" className="w-full pt-1 sm:pt-2 pb-1 scroll-mt-24">
          <HotelSearch onSearch={onSearch} />
        </div>
      </div>

      {/* Embedded CSS for smooth subtle fade animation */}
      <style jsx>{`
        @keyframes heroTextFade {
          0% {
            opacity: 0;
            transform: translateY(6px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </section>
  );
}
