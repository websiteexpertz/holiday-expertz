"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight } from "lucide-react";

interface ContentCard {
  number: string;
  heading: string;
  description: string;
  linkText: string;
  linkHref: string;
}

const CARDS: ContentCard[] = [
  {
    number: "01",
    heading: "Extraordinary Escapes, Exclusive Offers",
    description:
      "Discover exceptional offers, seasonal packages, and competitive rates on luxury resorts, palace hotels, boutique properties, and private villas. Enjoy outstanding value without compromising on comfort or quality.",
    linkText: "Explore Our Deals",
    linkHref: "/deals",
  },
  {
    number: "02",
    heading: "Carefully Curated Properties",
    description:
      "Every stay should be special. Explore a thoughtfully curated collection of hotels, heritage retreats, private villas, beachfront escapes, and charming holiday homes selected to help you find the right stay for your travel style.",
    linkText: "Discover Our Properties",
    linkHref: "/properties",
  },
  {
    number: "03",
    heading: "From Search to Stay, Seamlessly",
    description:
      "Plan your next getaway with confidence. Enjoy a simple booking journey, clear pricing, flexible accommodation options, and convenient search tools designed to make finding your perfect stay effortless.",
    linkText: "Find Your Perfect Stay",
    linkHref: "/#hero-search-bar",
  },
  {
    number: "04",
    heading: "Care That Goes Beyond Booking",
    description:
      "Your holiday deserves personal attention. Our team is here to assist with booking queries, special requests, accommodation details, and travel arrangements, helping you enjoy a smoother, more relaxing experience.",
    linkText: "Contact Our Experts",
    linkHref: "/#contact",
  },
];

export default function WhatMakesUsExtraordinary() {
  const router = useRouter();

  const handleScrollToSearch = (e: React.MouseEvent) => {
    e.preventDefault();
    const searchBar = document.getElementById("hero-search-bar");
    const input = document.getElementById("hero-destination-input") as HTMLInputElement | null;
    if (searchBar) {
      searchBar.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => {
        if (input) {
          input.focus();
          input.classList.add("ring-2", "ring-[#009F8D]/40");
          setTimeout(() => input.classList.remove("ring-2", "ring-[#009F8D]/40"), 1800);
        }
      }, 450);
    } else {
      router.push("/#hero-search-bar");
    }
  };

  return (
    <section
      id="extraordinary"
      aria-label="What Makes Us Extraordinary"
      className="scroll-mt-24 pt-6 sm:pt-7 lg:pt-8 pb-5 sm:pb-6 lg:pb-7 bg-white border-b border-[#E8EAE5]/60 overflow-hidden"
    >
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Subtle Golden-Orange Decorative Accent above Heading */}
        <div className="flex items-center justify-center gap-3 mb-3.5 sm:mb-4">
          <span className="w-8 sm:w-14 h-px bg-gradient-to-r from-transparent to-[#D97706]/50" />
          <Sparkles className="w-4 h-4 text-[#D97706]" strokeWidth={1.75} aria-hidden="true" />
          <span className="w-8 sm:w-14 h-px bg-gradient-to-l from-transparent to-[#D97706]/50" />
        </div>

        {/* Section Heading */}
        <h2 className="font-editorial-serif font-bold text-[#0b192c] text-3xl sm:text-4xl lg:text-[40px] tracking-tight leading-[1.15]">
          What Makes Us Extraordinary
        </h2>

        {/* Section Tagline */}
        <p className="font-editorial-serif italic font-normal text-[#1e2e42] text-xl sm:text-2xl lg:text-[28px] mt-2 sm:mt-2.5 mb-4 sm:mb-5 leading-snug">
          Thoughtfully Chosen. Perfectly Experienced.
        </p>

        {/* Section Description */}
        <p className="font-editorial-sans text-slate-600 sm:text-slate-700 text-[15px] sm:text-[18px] lg:text-[19px] leading-[1.7] max-w-[1000px] mx-auto mb-6 sm:mb-7 lg:mb-8 font-normal">
          We go beyond ordinary hotel bookings to bring you exceptional stays, carefully curated properties, transparent pricing, and personalized service. Every detail is designed to make your holiday seamless, comfortable, and unforgettable.
        </p>

        {/* 
          Four Detailed Content Cards in ONE Horizontal Row on Desktop
          - Desktop (lg: 1024px+): 4 columns side by side (repeat(4, minmax(0, 1fr)))
          - Tablet (sm: 640px+): 2 columns, 2 rows
          - Mobile (<640px): 1 column stack, full available width
        */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 lg:gap-4.5 items-stretch">
          {CARDS.map((card) => {
            const isSearchCard = card.number === "03";

            return (
              <div
                key={card.number}
                onClick={isSearchCard ? handleScrollToSearch : undefined}
                className={`bg-white rounded-xl sm:rounded-2xl border border-slate-200/90 p-4 sm:p-5 flex flex-col h-full text-left transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 hover:border-amber-400/60 group ${
                  isSearchCard ? "cursor-pointer" : ""
                }`}
              >
                {/* Numbered Label */}
                <span className="text-[24px] sm:text-[26px] lg:text-[28px] font-bold font-editorial-serif text-[#E58A18] tracking-tight leading-none mb-2 sm:mb-2.5 select-none">
                  {card.number}
                </span>

                {/* Bold Navy Heading */}
                <h3 className="font-editorial-serif font-bold text-[16px] sm:text-[17px] lg:text-[18px] text-[#0b192c] tracking-tight leading-[1.25] mb-2 sm:mb-2.5">
                  {card.heading}
                </h3>

                {/* Descriptive Paragraph (100% full text visible, clean compact typography) */}
                <p className="font-editorial-sans text-[13px] sm:text-[13.5px] text-slate-600 leading-[1.55] font-normal flex-1 mb-4">
                  {card.description}
                </p>

                {/* Clickable Text Link with Right Arrow */}
                <Link
                  href={card.linkHref}
                  onClick={isSearchCard ? handleScrollToSearch : undefined}
                  className="mt-auto inline-flex items-center gap-1.5 font-editorial-sans font-semibold text-[13px] sm:text-[13.5px] text-[#0b192c] group-hover:text-[#009F8D] transition-colors"
                >
                  <span>{card.linkText}</span>
                  <ArrowRight
                    className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
