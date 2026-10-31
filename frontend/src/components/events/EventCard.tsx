"use client";

import React from "react";
import Image from "next/image";
import {
  Calendar,
  MapPin,
  Sparkles,
  ArrowRight,
  Tag,
} from "lucide-react";
import { EventItem } from "@/types/event";

interface EventCardProps {
  event: EventItem;
  onViewDetails: (event: EventItem) => void;
}

export default function EventCard({ event, onViewDetails }: EventCardProps) {
  // Format date range nicely (e.g. "18 Nov - 26 Nov 2026")
  const formatDateDisplay = (startStr: string, endStr?: string) => {
    const s = new Date(startStr + "T00:00:00");
    const sMonth = s.toLocaleDateString("en-US", { month: "short" });
    const sDay = s.getDate();
    const sYear = s.getFullYear();

    if (!endStr || endStr === startStr) {
      return `${sDay} ${sMonth} ${sYear}`;
    }

    const e = new Date(endStr + "T00:00:00");
    const eMonth = e.toLocaleDateString("en-US", { month: "short" });
    const eDay = e.getDate();
    const eYear = e.getFullYear();

    if (sMonth === eMonth && sYear === eYear) {
      return `${sDay} - ${eDay} ${sMonth} ${sYear}`;
    }
    return `${sDay} ${sMonth} - ${eDay} ${eMonth} ${eYear}`;
  };

  const formattedPrice =
    typeof event.price === "number"
      ? new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency: "INR",
          maximumFractionDigits: 0,
        }).format(event.price)
      : event.price;

  const formattedOriginalPrice =
    event.originalPrice && typeof event.price === "number"
      ? new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency: "INR",
          maximumFractionDigits: 0,
        }).format(event.originalPrice)
      : null;

  return (
    <div
      onClick={() => onViewDetails(event)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onViewDetails(event);
        }
      }}
      className="w-full h-[380px] sm:h-[440px] rounded-2xl overflow-hidden group/card shadow-[0_4px_16px_rgba(23,43,42,0.04)] hover:shadow-[0_16px_36px_rgba(23,43,42,0.14)] cursor-pointer relative transition-all duration-500 ease-editorial select-none border border-[#E8EAE5] focus:outline-none focus:ring-2 focus:ring-[#009F8D]"
      aria-label={`View details for ${event.title}`}
    >
      {/* Full-bleed Background Image with Hover Zoom */}
      <Image
        src={event.image}
        alt={event.title}
        fill
        sizes="(max-width: 640px) 82vw, (max-width: 1024px) 50vw, 25vw"
        className="object-cover group-hover/card:scale-105 transition-transform duration-700 ease-editorial"
      />

      {/* Cinematic Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/35 to-transparent pointer-events-none" />

      {/* Content Overlay */}
      <div className="absolute inset-0 p-5 sm:p-6 flex flex-col justify-between text-white z-10 pointer-events-none">
        {/* Top Badges Row */}
        <div className="flex justify-between items-start gap-2">
          <span className="px-3 py-1 rounded-full text-[10.5px] font-semibold tracking-wider uppercase font-editorial-sans bg-white/15 backdrop-blur-md border border-white/25 text-[#E7F6F3]">
            {event.category}
          </span>

          {event.ticketStatus === "Selling Fast" ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-bold font-editorial-sans bg-[#009F8D] text-white shadow-xs">
              <Sparkles className="w-3 h-3" />
              <span>Selling Fast</span>
            </span>
          ) : event.ticketStatus === "Free Registration" ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-bold font-editorial-sans bg-[#006F66] text-white shadow-xs">
              <Tag className="w-3 h-3" />
              <span>Free Pass</span>
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full text-[10.5px] font-medium font-editorial-sans bg-white/15 backdrop-blur-md border border-white/25 text-white shadow-xs">
              {event.time}
            </span>
          )}
        </div>

        {/* Bottom Metadata & Info Stack */}
        <div className="space-y-1.5">
          {/* Location & Date */}
          <div className="flex items-center gap-2 text-xs text-teal-300 font-medium flex-wrap font-editorial-sans">
            <div className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{event.city}</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{formatDateDisplay(event.startDate, event.endDate)}</span>
            </div>
          </div>

          {/* Event Title */}
          <h3 className="font-editorial-serif text-xl sm:text-2xl font-normal text-white tracking-tight leading-tight line-clamp-1 group-hover/card:text-[#E7F6F3] transition-colors">
            {event.title}
          </h3>

          {/* Venue & Description */}
          <p className="font-editorial-sans text-xs text-slate-300/80 line-clamp-1 font-light italic">
            {event.location} • {event.description}
          </p>

          {/* Pass Price & CTA Row */}
          <div className="pt-2 flex items-center justify-between gap-2 border-t border-white/20">
            <div className="flex items-baseline gap-1.5">
              <span
                className={`font-editorial-serif text-lg sm:text-xl font-normal ${
                  event.price === "Free Entry" ? "text-emerald-300" : "text-white"
                }`}
              >
                {formattedPrice}
              </span>
              {typeof event.price === "number" && (
                <span className="text-[11px] text-slate-300 font-medium">/ person</span>
              )}
              {formattedOriginalPrice && (
                <span className="text-[11px] text-slate-400 line-through ml-0.5">
                  {formattedOriginalPrice}
                </span>
              )}
            </div>

            <span className="text-xs font-bold text-teal-300 group-hover/card:text-white inline-flex items-center gap-1 transition-colors">
              <span>View Details</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover/card:translate-x-0.5 transition-transform" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
