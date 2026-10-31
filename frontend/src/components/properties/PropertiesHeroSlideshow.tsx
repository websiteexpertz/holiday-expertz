"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { DestinationHeroImage } from "@backend/types/admin";
import { MapPin, Sparkles } from "lucide-react";

interface PropertiesHeroSlideshowProps {
  countryId?: string;
  stateId?: string;
  cityId?: string;
  areaId?: string;
  locationType?: string;
  locationId?: string;
  destinationQuery?: string;
  totalProperties: number;
}

export default function PropertiesHeroSlideshow({
  countryId = "",
  stateId = "",
  cityId = "",
  areaId = "",
  locationType = "",
  locationId = "",
  destinationQuery = "",
  totalProperties = 0,
}: PropertiesHeroSlideshowProps) {
  const [slides, setSlides] = useState<DestinationHeroImage[]>([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [destinationName, setDestinationName] = useState<string | null>(null);

  // ── Fetch slides ────────────────────────────────────────────────────────────
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    async function fetchSlides() {
      const hasAnyLocation =
        countryId || stateId || cityId || areaId || locationId || destinationQuery;

      if (!hasAnyLocation) {
        setSlides([]);
        setDestinationName(null);
        return;
      }

      setIsLoading(true);
      try {
        const qParams = new URLSearchParams();
        if (countryId) qParams.set("countryId", countryId);
        if (stateId) qParams.set("stateId", stateId);
        if (cityId) qParams.set("cityId", cityId);
        if (areaId) qParams.set("areaId", areaId);
        if (locationType) qParams.set("locationType", locationType);
        if (locationId) qParams.set("locationId", locationId);
        if (destinationQuery) qParams.set("destination", destinationQuery);

        const res = await fetch(`/api/public/destination-slides?${qParams.toString()}`, {
          signal: controller.signal,
        });

        if (!res.ok) throw new Error("Failed to fetch destination slides");
        const data = await res.json();

        if (isMounted && data.success) {
          if (Array.isArray(data.slides) && data.slides.length > 0) {
            setSlides(data.slides);
            setCurrentSlideIndex(0);
            setDestinationName(data.destinationName || null);
          } else {
            setSlides([]);
            setDestinationName(null);
          }
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== "AbortError") {
          console.warn("Destination hero slides error:", err);
        }
        if (isMounted) setSlides([]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchSlides();
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [countryId, stateId, cityId, areaId, locationType, locationId, destinationQuery]);

  // ── Auto-rotation: every 5 s, 800 ms crossfade ──────────────────────────────
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

  const hasSlides = slides.length > 0;
  const currentSlide = hasSlides ? slides[currentSlideIndex] : null;

  // ── Derived overlay content ──────────────────────────────────────────────────
  const overlayTitle = currentSlide?.title || null;
  const overlayLocation = currentSlide?.locationName || null;
  const overlayHeadline = currentSlide?.headline || null;
  const overlayDescription = currentSlide?.description || null;

  // ── Heading text (always visible, left-aligned) ──────────────────────────────
  const headingText = destinationName
    ? `Explore Stays in ${destinationName}`
    : "Explore Properties";
  const subText = destinationName
    ? `Browse handpicked luxury villas, royal palaces, and boutique resorts across ${destinationName}.`
    : "Browse handpicked villas, heritage hotels, and luxury resorts across iconic destinations.";

  return (
    <section
      aria-label="Properties Destination Hero"
      className="relative pt-32 sm:pt-36 pb-20 sm:pb-28 text-white border-b border-teal-900/40 shadow-lg overflow-hidden min-h-[580px] sm:min-h-[680px] flex flex-col justify-end transition-colors duration-500 bg-slate-950"
    >
      {/* ── SLIDESHOW BACKGROUND (crossfade, no controls) ─────────────────────── */}
      {hasSlides ? (
        <div className="absolute inset-0 z-0 overflow-hidden bg-slate-950">
          {slides.map((slide, idx) => {
            const isCurrent = idx === currentSlideIndex;
            return (
              <div
                key={slide.id || idx}
                aria-hidden={!isCurrent}
                className={`absolute inset-0 transition-opacity duration-[800ms] ease-in-out ${
                  isCurrent ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
                }`}
              >
                <Image
                  src={slide.imageUrl}
                  alt={slide.altText || slide.title || "HolidayExpertz destination photography"}
                  fill
                  priority={idx === 0}
                  sizes="100vw"
                  className="object-cover object-center"
                />
              </div>
            );
          })}

          {/*
            TAJ MAHAL REFERENCE GRADIENT:
            Left ~55% → natural photo visibility (light vignette only)
            Right ~45% → dark panel for text readability
          */}
          <div className="absolute inset-0 z-20 bg-gradient-to-r from-black/40 via-black/30 to-black/80 pointer-events-none" />
          {/* Bottom lift for heading text */}
          <div className="absolute inset-0 z-20 bg-gradient-to-t from-slate-950 via-transparent to-black/25 pointer-events-none" />
        </div>
      ) : (
        /* Fallback gradient when no destination selected */
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-teal-950 via-slate-950 to-slate-900 pointer-events-none" />
      )}

      {/*
        ── RIGHT-SIDE OVERLAY PANEL (Taj Mahal layout) ───────────────────────────
        Shown only when the active slide has headline/description.
        Positioned at the right ~42% of the hero, vertically centred.
        Desktop only — hidden on mobile (bottom bar shows instead).
      */}
      {hasSlides && (overlayHeadline || overlayDescription) && (
        <div
          key={currentSlideIndex}
          className="
            hidden lg:flex
            absolute right-0 top-0 bottom-0
            w-[42%] xl:w-[40%]
            flex-col justify-center
            px-10 xl:px-16 py-10
            z-30
            animate-in fade-in duration-700
          "
        >
          {/* 📍 Location: title + locationName */}
          {(overlayTitle || overlayLocation) && (
            <div className="flex items-start gap-2.5 mb-4">
              <MapPin className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
              <p className="font-editorial-sans text-sm font-semibold text-white/90 leading-snug tracking-wide">
                {overlayTitle}
                {overlayLocation ? ` – ${overlayLocation}` : ""}
              </p>
            </div>
          )}

          {/* Thin gold divider */}
          <div className="w-14 h-px bg-amber-400/50 mb-4" />

          {/* Italic gold headline */}
          {overlayHeadline && (
            <h2 className="font-editorial-serif text-2xl xl:text-3xl font-normal italic text-amber-300 leading-snug tracking-tight mb-4">
              {overlayHeadline}
            </h2>
          )}

          {/* Description */}
          {overlayDescription && (
            <p className="font-editorial-sans text-sm xl:text-[15px] text-white/80 leading-relaxed font-light line-clamp-5">
              {overlayDescription}
            </p>
          )}
        </div>
      )}

      {/* ── FIXED HERO CONTENT (left side / bottom — always visible) ─────────── */}
      <div className="relative z-30 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-3">
        {/* Breadcrumb */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2 text-xs font-semibold text-teal-200/80 mb-0.5 font-editorial-sans">
            <Link href="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <span>/</span>
            <span className="text-white font-bold">Properties</span>
            {destinationName && (
              <>
                <span>/</span>
                <span className="text-teal-300 font-bold">{destinationName}</span>
              </>
            )}
          </div>

          {/* Mobile: compact slide info pill (replaces right panel on small screens) */}
          {hasSlides && overlayTitle && (
            <div className="lg:hidden inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/60 backdrop-blur-md border border-white/20 text-[11px] font-semibold text-teal-200 shadow-sm">
              <MapPin className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" />
              <span className="truncate max-w-[220px]">
                {overlayTitle}
                {overlayLocation ? ` • ${overlayLocation}` : ""}
              </span>
            </div>
          )}
        </div>

        {/* Heading & sub-text */}
        <div className="space-y-1.5">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight flex items-center gap-3 flex-wrap">
            <span>{headingText}</span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-200 border border-teal-400/30 backdrop-blur-sm">
              {totalProperties} Available
            </span>
          </h1>

          <p className="text-xs sm:text-sm text-teal-100/90 max-w-xl font-editorial-sans">
            {subText}
          </p>
        </div>

        {/*
          Mobile: description shown below heading when right panel is hidden
          Only if current slide has headline/description
        */}
        {hasSlides && overlayHeadline && (
          <div className="lg:hidden mt-3 space-y-1">
            <p className="font-editorial-serif text-base italic text-amber-300 leading-snug">
              {overlayHeadline}
            </p>
            {overlayDescription && (
              <p className="font-editorial-sans text-xs text-white/75 leading-relaxed font-light line-clamp-3 max-w-sm">
                {overlayDescription}
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
