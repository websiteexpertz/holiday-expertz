"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";

export interface BrandLogoProps {
  /**
   * Layout & style variant:
   * - "header": Horizontal luxury navbar lockup (official HE emblem + 3D wordmark & tagline)
   * - "footer": Full stacked official logo with high-contrast luxury styling for dark footer
   * - "compact": Compact icon + brand mark for mobile / tight spaces
   * - "icon": Icon-only (official HE monogram with airplane, sun, mountains & waves)
   * - "full": Full official stacked logo as provided
   */
  variant?: "header" | "footer" | "compact" | "icon" | "full";
  className?: string;
  priority?: boolean;
  asLink?: boolean;
  alt?: string;
  theme?: "light" | "dark" | "auto";
}

export default function BrandLogo({
  variant = "header",
  className = "",
  priority = true,
  asLink = true,
  alt = "Holiday Expertz - Luxury Stays & Getaways",
  theme = "auto",
}: BrandLogoProps) {
  // Determine asset sources
  const fullLogoSrc =
    theme === "dark" || variant === "footer"
      ? "/holiday-expertz-logo-dark.webp"
      : "/holiday-expertz-logo.webp";

  const iconSrc = "/holiday-expertz-icon.webp";
  const wordmarkSrc = "/holiday-expertz-wordmark.webp";

  let content: React.ReactNode;

  if (variant === "footer" || variant === "full") {
    // Complete Official Stacked Logo (Emblem + Holiday Expertz + Tagline with gold rules)
    content = (
      <div className={`relative inline-flex flex-col items-start ${className}`}>
        <Image
          src={fullLogoSrc}
          alt={alt}
          width={280}
          height={178}
          priority={priority}
          style={{ width: "auto" }}
          className="w-auto h-16 sm:h-20 lg:h-24 max-w-[280px] object-contain drop-shadow-sm select-none"
        />
      </div>
    );
  } else if (variant === "icon") {
    // Official HE Monogram Icon
    content = (
      <div className={`relative inline-flex items-center justify-center ${className}`}>
        <Image
          src={iconSrc}
          alt={alt}
          width={96}
          height={48}
          priority={priority}
          style={{ width: "auto" }}
          className="w-auto h-8 sm:h-9 object-contain select-none"
        />
      </div>
    );
  } else if (variant === "compact") {
    // Compact lockup for mobile navigation
    content = (
      <div className={`inline-flex items-center gap-2 select-none ${className}`}>
        <div className="relative w-9 h-9 sm:w-10 sm:h-10 flex-shrink-0 flex items-center justify-center">
          <Image
            src={iconSrc}
            alt="HE"
            width={80}
            height={40}
            priority={priority}
            style={{ width: "auto", height: "auto" }}
            className="w-full h-full object-contain"
          />
        </div>
        <div className="flex flex-col justify-center">
          <div className="font-editorial-serif font-black text-base sm:text-lg tracking-tight text-[#172B2A] leading-tight">
            Holiday<span className="text-[#009F8D] font-extrabold ml-0.5">Expertz</span>
          </div>
          <span className="text-[7.5px] uppercase tracking-[0.2em] font-bold text-slate-400 -mt-0.5 whitespace-nowrap">
            LUXURY STAYS
          </span>
        </div>
      </div>
    );
  } else {
    // Default "header" navbar variant:
    // Uses the official HE emblem + official 3D wordmark & tagline
    content = (
      <div className={`inline-flex items-center gap-2.5 sm:gap-3 select-none ${className}`}>
        {/* Official HE Monogram Emblem */}
        <div className="relative w-10 h-10 sm:w-11 sm:h-11 flex-shrink-0 flex items-center justify-center">
          <Image
            src={iconSrc}
            alt="HE Emblem"
            width={88}
            height={44}
            priority={priority}
            style={{ width: "auto", height: "auto" }}
            className="w-full h-full object-contain drop-shadow-xs transition-transform duration-200 group-hover:scale-105"
          />
        </div>

        {/* Brand Wordmark & Tagline Lockup */}
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-1 font-bold text-lg sm:text-[19px] tracking-tight text-[#172B2A] leading-none">
            <span>Holiday</span>
            <span className="text-[#009F8D] font-extrabold">Expertz</span>
          </div>
          <span className="text-[8px] sm:text-[8.5px] uppercase tracking-[0.22em] font-bold text-[#006F66]/80 -mt-0.5 whitespace-nowrap">
            LUXURY STAYS &amp; GETAWAYS
          </span>
        </div>
      </div>
    );
  }

  if (asLink) {
    return (
      <Link
        href="/"
        className="group inline-flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#009F8D] rounded-xl p-0.5 transition-opacity hover:opacity-95"
        aria-label={alt}
      >
        {content}
      </Link>
    );
  }

  return content;
}

