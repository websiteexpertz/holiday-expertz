"use client";

import React from "react";
import Image from "next/image";
import { MapPin, Star, ArrowRight } from "lucide-react";
import { Hotel } from "@/types/hotel";

interface PropertyCardProps {
  hotel: Hotel;
  onViewDetails: (hotel: Hotel) => void;
}

export default function PropertyCard({ hotel, onViewDetails }: PropertyCardProps) {
  // Format price in Indian Rupee format (e.g. ₹38,500)
  const formattedPrice = new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(hotel.pricePerNight);

  const formattedOriginalPrice = hotel.originalPrice
    ? new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(
        hotel.originalPrice
      )
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
      className="w-full h-[380px] sm:h-[440px] rounded-2xl overflow-hidden group/card shadow-[0_4px_16px_rgba(23,43,42,0.04)] hover:shadow-[0_16px_36px_rgba(23,43,42,0.14)] cursor-pointer relative transition-all duration-500 ease-editorial select-none border border-[#E8EAE5] focus:outline-none focus:ring-2 focus:ring-[#009F8D]"
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
      <div className="absolute inset-0 p-5 sm:p-6 flex flex-col justify-between text-white z-10 pointer-events-none">
        {/* Top Badges Row */}
        <div className="flex justify-between items-start gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="px-3 py-1 rounded-full text-[10.5px] font-semibold tracking-wider uppercase font-editorial-sans bg-white/15 backdrop-blur-md border border-white/25 text-[#E7F6F3]">
              {hotel.propertyType}
            </span>
            {hotel.dealTag && (
              <span className="px-2.5 py-1 rounded-full text-[10.5px] font-bold tracking-wide font-editorial-sans bg-[#009F8D] text-white shadow-xs">
                {hotel.dealTag}
              </span>
            )}
          </div>

          {/* Rating Badge */}
          {hotel.rating && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-white text-xs font-bold shadow-xs">
              <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
              <span>{hotel.rating.toFixed(1)}</span>
            </div>
          )}
        </div>

        {/* Bottom Metadata & Info Stack */}
        <div className="space-y-1.5">
          {/* Location */}
          <div className="flex items-center gap-1.5 text-xs text-teal-300 font-medium">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{hotel.city}, {hotel.state}</span>
          </div>

          {/* Property Name */}
          <h3 className="font-editorial-serif text-xl sm:text-2xl font-normal text-white tracking-tight leading-tight line-clamp-1 group-hover/card:text-[#E7F6F3] transition-colors">
            {hotel.name}
          </h3>

          {/* Tags / Subtitle */}
          {hotel.tags && hotel.tags.length > 0 && (
            <p className="text-xs text-slate-300/80 line-clamp-1 font-light italic">
              {hotel.tags.slice(0, 3).join(" • ")}
            </p>
          )}

          {/* Price & CTA Row */}
          <div className="pt-2 flex items-center justify-between gap-2 border-t border-white/20">
            <div className="flex items-baseline gap-1.5">
              <span className="font-editorial-serif text-lg sm:text-xl font-normal text-white">
                ₹{formattedPrice}
              </span>
              <span className="text-[11px] text-slate-300 font-light">/ night</span>
              {formattedOriginalPrice && (
                <span className="text-[11px] text-slate-400 line-through ml-0.5">
                  ₹{formattedOriginalPrice}
                </span>
              )}
            </div>

            <span className="text-xs font-semibold text-teal-300 group-hover/card:text-white inline-flex items-center gap-1 transition-colors">
              <span>View Details</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover/card:translate-x-1 transition-transform duration-300" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}