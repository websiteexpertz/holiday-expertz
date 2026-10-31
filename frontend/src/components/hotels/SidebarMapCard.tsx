"use client";

import React from "react";
import { MapPin } from "lucide-react";

interface SidebarMapCardProps {
  onOpenMap: () => void;
  propertyCount?: number;
}

export default function SidebarMapCard({
  onOpenMap,
  propertyCount,
}: SidebarMapCardProps) {
  return (
    <div
      onClick={onOpenMap}
      className="relative w-full h-32 rounded-2xl overflow-hidden border border-slate-200 shadow-xs cursor-pointer group transition-all duration-300 hover:shadow-md hover:border-teal-400 select-none shrink-0"
    >
      {/* Map Graphic Canvas / Background */}
      <div className="absolute inset-0 bg-[#e5ece8]">
        {/* Decorative map tiles / roads / coastline */}
        <svg
          className="w-full h-full opacity-60"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 400 200"
          preserveAspectRatio="none"
        >
          {/* Water body */}
          <path
            d="M0,0 L180,0 Q160,80 240,120 T400,160 L400,0 Z"
            fill="#c4e2ea"
            opacity="0.8"
          />
          {/* Park area */}
          <path
            d="M30,120 Q60,90 120,110 T200,160 L180,200 L0,200 Z"
            fill="#d2e7d6"
          />
          {/* Roads */}
          <path
            d="M-20,60 Q120,80 200,50 T420,90"
            stroke="#ffffff"
            strokeWidth="6"
            fill="none"
          />
          <path
            d="M-20,60 Q120,80 200,50 T420,90"
            stroke="#f5d77f"
            strokeWidth="3"
            fill="none"
          />
          <path
            d="M140,-20 Q160,100 130,220"
            stroke="#ffffff"
            strokeWidth="5"
            fill="none"
          />
          <path
            d="M140,-20 Q160,100 130,220"
            stroke="#f5d77f"
            strokeWidth="2.5"
            fill="none"
          />
          <path
            d="M260,20 Q240,110 320,220"
            stroke="#ffffff"
            strokeWidth="4"
            fill="none"
          />
        </svg>

        {/* Scattered Pinned Location Dots */}
        <div className="absolute top-6 left-12 w-2.5 h-2.5 rounded-full bg-teal-600 ring-4 ring-teal-600/20 animate-pulse" />
        <div className="absolute top-16 right-16 w-2.5 h-2.5 rounded-full bg-teal-600 ring-4 ring-teal-600/20" />
        <div className="absolute bottom-6 left-28 w-2.5 h-2.5 rounded-full bg-teal-600 ring-4 ring-teal-600/20" />
        <div className="absolute top-10 right-28 w-2 h-2 rounded-full bg-teal-500/80" />
        <div className="absolute bottom-12 right-10 w-2 h-2 rounded-full bg-teal-500/80" />
      </div>

      {/* Subtle overlay gradient */}
      <div className="absolute inset-0 bg-slate-900/10 group-hover:bg-slate-900/5 transition-colors" />

      {/* Center "Show on map" Button (Booking.com style) */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenMap();
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 group-hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg transition-all duration-200 transform group-hover:scale-105 active:scale-95 cursor-pointer ring-2 ring-white/80"
        >
          <MapPin className="w-4 h-4 fill-white text-blue-600" />
          <span>Show on map</span>
        </button>

        {propertyCount !== undefined && propertyCount > 0 && (
          <span className="mt-2 text-[10px] font-semibold text-slate-700 bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded-full shadow-xs border border-slate-200/60">
            {propertyCount} {propertyCount === 1 ? "stay" : "stays"} pinned
          </span>
        )}
      </div>
    </div>
  );
}
