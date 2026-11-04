"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ArrowRight, Sparkles } from "lucide-react";
import { useAutoScrollCarousel } from "@/hooks/useAutoScrollCarousel";

export interface OfferCardItem {
  id: string;
  number: string;
  title: string;
  description: string;
  image: string;
  badge: string;
}

const OFFER_CARDS: OfferCardItem[] = [
  {
    id: "offer-1",
    number: "01",
    title: "Exceptional Stays",
    description:
      "Explore a diverse collection of hotels, resorts, private villas, holiday homes, and distinctive retreats for every kind of traveler.",
    image:
      "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1200&q=80",
    badge: "Handpicked Stays",
  },
  {
    id: "offer-2",
    number: "02",
    title: "Destinations Worth Discovering",
    description:
      "Find inspiration for your next getaway, whether you're dreaming of a tropical beach, a peaceful mountain escape, a cultural adventure, or a luxurious countryside retreat.",
    image:
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
    badge: "Curated Escapes",
  },
  {
    id: "offer-3",
    number: "03",
    title: "Choices for Every Travel Style",
    description:
      "Discover accommodation options for romantic escapes, family holidays, group vacations, business trips, and extended stays.",
    image:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80",
    badge: "Bespoke Styles",
  },
  {
    id: "offer-4",
    number: "04",
    title: "A Simpler Way to Plan",
    description:
      "Enjoy a convenient way to explore accommodation options, compare your choices, and plan your next stay with greater confidence.",
    image:
      "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1200&q=80",
    badge: "Seamless Journey",
  },
];

export default function WhatWeOfferCarousel() {
  const {
    sectionRef,
    scrollRef,
    activeIndex,
    canAutoScroll,
    handlePrev,
    handleNext,
    handleScroll,
    handleKeyDown,
    handleTouchStart,
    handleTouchEnd,
    handleTouchCancel,
  } = useAutoScrollCarousel({
    itemsCount: OFFER_CARDS.length,
    speed: 0.55,
    pauseOnHover: true,
  });

  const itemsToRender = canAutoScroll
    ? [...OFFER_CARDS, ...OFFER_CARDS, ...OFFER_CARDS]
    : OFFER_CARDS;

  return (
    <div
      ref={sectionRef as React.RefObject<HTMLDivElement>}
      className="relative"
      aria-roledescription="carousel"
      aria-label="What We Offer Carousel"
    >
      {/* Navigation Controls Bar */}
      <div className="flex items-center justify-between gap-4 mb-6 sm:mb-8">
        {/* Pagination Dots (4 actual card indicators) */}
        <div
          className="flex items-center gap-2"
          role="tablist"
          aria-label="Carousel Slides"
        >
          {OFFER_CARDS.map((card, idx) => {
            const isActive = activeIndex % OFFER_CARDS.length === idx;
            return (
              <span
                key={card.id}
                role="tab"
                aria-selected={isActive}
                aria-label={`Go to slide ${idx + 1}: ${card.title}`}
                className={`h-2 rounded-full transition-all duration-300 ${
                  isActive
                    ? "w-8 bg-[#009F8D]"
                    : "w-2 bg-slate-300 hover:bg-slate-400"
                }`}
              />
            );
          })}
        </div>

        {/* Prev / Next Arrows */}
        {canAutoScroll && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous offer slide"
              className="w-10 h-10 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-[#0b192c] hover:text-[#009F8D] hover:border-[#009F8D]/40 flex items-center justify-center transition-all duration-200 shadow-2xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#009F8D]"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Next offer slide"
              className="w-10 h-10 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-[#0b192c] hover:text-[#009F8D] hover:border-[#009F8D]/40 flex items-center justify-center transition-all duration-200 shadow-2xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#009F8D]"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Single Horizontal Auto-Scrolling Row */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        onKeyDown={handleKeyDown}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
        tabIndex={0}
        role="region"
        aria-live="polite"
        className="flex gap-5 sm:gap-6 overflow-x-auto scrollbar-none pb-4 pt-1 outline-none select-none scroll-smooth"
        style={{ scrollSnapType: "none" }}
      >
        {itemsToRender.map((item, index) => {
          return (
            <div
              key={`${item.id}-${index}`}
              className="w-[84vw] sm:w-[320px] md:w-[340px] lg:w-[370px] shrink-0 flex flex-col bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-xl hover:border-[#009F8D]/30 transition-all duration-300 group"
            >
              {/* Card Image */}
              <div className="relative h-56 sm:h-60 w-full overflow-hidden bg-slate-100">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  sizes="(max-width: 640px) 85vw, (max-width: 1024px) 340px, 370px"
                  className="object-cover group-hover:scale-105 transition-transform duration-700 ease-editorial"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/20 to-transparent" />

                {/* Badge & Number */}
                <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-[11px] font-bold text-[#006F66] tracking-wide uppercase font-editorial-sans shadow-xs">
                    {item.badge}
                  </span>
                  <span className="font-editorial-serif text-lg font-bold text-white/90 drop-shadow-sm">
                    {item.number}
                  </span>
                </div>

                {/* Bottom title on image for high contrast visual elegance */}
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="font-editorial-serif text-2xl font-bold text-white tracking-tight leading-snug drop-shadow-sm">
                    {item.title}
                  </h3>
                </div>
              </div>

              {/* Card Content */}
              <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between">
                <p className="font-editorial-sans text-slate-600 text-sm sm:text-[15px] leading-relaxed mb-6 font-normal">
                  {item.description}
                </p>

                <Link
                  href="/properties"
                  className="pt-4 border-t border-slate-100 mt-auto inline-flex items-center justify-between text-xs sm:text-sm font-semibold text-[#006F66] group-hover:text-[#009F8D] transition-colors"
                >
                  <span>Explore Stays</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

