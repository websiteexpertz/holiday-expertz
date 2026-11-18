"use client";

import React from "react";
import Image from "next/image";
import { MapPin, Star, ArrowRight } from "lucide-react";
import { Hotel } from "@/types/hotel";
import { formatPrice } from "@/lib/currency";

interface PropertyCardProps {
  hotel: Hotel;
  onViewDetails: (hotel: Hotel) => void;
  size?: "default" | "compact";
  className?: string;
}

export default function PropertyCard({
  hotel,
  onViewDetails,
  size = "default",
  className = "",
}: PropertyCardProps) {
  const isCompact = size === "compact";

  // Format price in standard USD format (e.g. $250)
  const formattedPrice = formatPrice(hotel.pricePerNight, {
    currency: hotel.currency || "USD",
  });

  const formattedOriginalPrice = hotel.originalPrice
    ? formatPrice(hotel.originalPrice, {
        currency: hotel.currency || "USD",
      })
    : null;

  return (
    <div
      onClick={() => onViewDetails(hotel)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onViewDetails(hotel);
        }
      }}
      className={`w-full rounded-2xl overflow-hidden group/card shadow-[0_4px_16px_rgba(23,43,42,0.04)] hover:shadow-[0_16px_36px_rgba(23,43,42,0.14)] cursor-pointer relative transition-all duration-500 ease-editorial select-none border border-[#E8EAE5] focus:outline-none focus:ring-2 focus:ring-[#009F8D] ${
        isCompact ? "h-[270px] sm:h-[295px]" : "h-[380px] sm:h-[440px]"
      } ${className}`}
      aria-label={`View details for ${hotel.name}`}
    >
      {/* Full-bleed Background Image with Hover Zoom */}
      <Image
        src={hotel.featuredImage}
        alt={hotel.name}
        fill
        sizes="(max-width: 640px) 82vw, (max-width: 1024px) 50vw, 25vw"
        className="object-cover object-center group-hover/card:scale-105 transition-transform duration-700 ease-editorial"
      />

      {/* Cinematic Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/35 to-transparent pointer-events-none" />

      {/* Content Overlay */}
      <div
        className={`absolute inset-0 flex flex-col justify-between text-white z-10 pointer-events-none ${
          isCompact ? "p-3.5 sm:p-4" : "p-5 sm:p-6"
        }`}
      >
        {/* Top Badges Row */}
        <div className="flex justify-between items-start gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`rounded-full font-semibold tracking-wider uppercase font-editorial-sans bg-white/15 backdrop-blur-md border border-white/25 text-[#E7F6F3] ${
                isCompact ? "px-2.5 py-0.5 text-[9.5px]" : "px-3 py-1 text-[10.5px]"
              }`}
            >
              {hotel.propertyType}
            </span>
            {hotel.dealTag && (
              <span
                className={`rounded-full font-bold tracking-wide font-editorial-sans bg-[#009F8D] text-white shadow-xs ${
                  isCompact ? "px-2 py-0.5 text-[9.5px]" : "px-2.5 py-1 text-[10.5px]"
                }`}
              >
                {hotel.dealTag}
              </span>
            )}
          </div>

          {/* Rating Badge */}
          {hotel.rating && (
            <div
              className={`flex items-center gap-1 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-white font-bold shadow-xs ${
                isCompact ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs"
              }`}
            >
              <Star className="w-3 h-3 fill-amber-300 text-amber-300" />
              <span>{hotel.rating.toFixed(1)}</span>
            </div>
          )}
        </div>

        {/* Bottom Metadata & Info Stack */}
        <div className={isCompact ? "space-y-1" : "space-y-1.5"}>
          {/* Location */}
          <div className={`flex items-center gap-1.5 text-teal-300 font-medium ${isCompact ? "text-[11px]" : "text-xs"}`}>
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{hotel.city}, {hotel.state}</span>
          </div>

          {/* Property Name */}
          <h3
            className={`font-editorial-serif font-normal text-white tracking-tight leading-tight line-clamp-1 group-hover/card:text-[#E7F6F3] transition-colors ${
              isCompact ? "text-base sm:text-lg" : "text-xl sm:text-2xl"
            }`}
          >
            {hotel.name}
          </h3>

          {/* Tags / Subtitle */}
          {hotel.tags && hotel.tags.length > 0 && !isCompact && (
            <p className="text-xs text-slate-300/80 line-clamp-1 font-light italic">
              {hotel.tags.slice(0, 3).join(" • ")}
            </p>
          )}

          {/* Price & CTA Row */}
          <div className="pt-1.5 sm:pt-2 flex items-center justify-between gap-2 border-t border-white/20">
            <div className="flex items-baseline gap-1.5">
              <span
                className={`font-editorial-serif font-normal text-white ${
                  isCompact ? "text-base sm:text-lg" : "text-lg sm:text-xl"
                }`}
              >
                {formattedPrice}
              </span>
              {formattedOriginalPrice && (
                <span className="text-[10px] text-slate-400 line-through ml-0.5">
                  {formattedOriginalPrice}
                </span>
              )}
            </div>

            <span
              className={`font-semibold text-teal-300 group-hover/card:text-white inline-flex items-center gap-1 transition-colors ${
                isCompact ? "text-[11px]" : "text-xs"
              }`}
            >
              <span>View Details</span>
              <ArrowRight className="w-3 h-3 group-hover/card:translate-x-1 transition-transform duration-300" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}