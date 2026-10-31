"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import {
  X,
  Calendar,
  Clock,
  MapPin,
  CheckCircle,
  ShieldCheck,
  Share2,
  Building,
} from "lucide-react";
import { EventItem } from "@/types/event";

interface EventModalProps {
  event: EventItem | null;
  onClose: () => void;
}

export default function EventModal({ event, onClose }: EventModalProps) {
  // Lock body scroll when modal is open
  useEffect(() => {
    if (event) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [event]);

  if (!event) return null;

  const formatDateDisplay = (startStr: string, endStr?: string) => {
    const s = new Date(startStr + "T00:00:00");
    const sDate = s.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
    if (!endStr || endStr === startStr) return sDate;
    const e = new Date(endStr + "T00:00:00");
    const eDate = e.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
    return `${sDate} to ${eDate}`;
  };

  const formattedPrice =
    typeof event.price === "number"
      ? new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency: "INR",
          maximumFractionDigits: 0,
        }).format(event.price)
      : event.price;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="event-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200/90 relative flex flex-col"
      >
        {/* Modal Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-slate-700 hover:text-slate-900 shadow-md flex items-center justify-center transition-all hover:scale-105"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header Image */}
        <div className="relative aspect-[16/9] w-full bg-slate-900 overflow-hidden rounded-t-3xl">
          <Image
            src={event.image}
            alt={event.title}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 800px"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/20" />

          {/* Badges on Image */}
          <div className="absolute bottom-4 left-5 right-5 flex items-center justify-between text-white">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-600/90 backdrop-blur-sm shadow">
              {event.category}
            </span>
            <span className="text-xs font-medium bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm border border-white/20">
              {event.city}, {event.state}
            </span>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 sm:p-8 space-y-6 flex-1">
          {/* Title & Key Schedule */}
          <div className="space-y-3">
            <h2 id="event-modal-title" className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
              {event.title}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-teal-50/70 border border-teal-200/60 text-teal-900">
                <Calendar className="w-4 h-4 text-teal-600 flex-shrink-0" />
                <div className="text-xs">
                  <p className="font-bold">Date</p>
                  <p className="text-slate-600 font-medium">{formatDateDisplay(event.startDate, event.endDate)}</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900">
                <Clock className="w-4 h-4 text-slate-500 flex-shrink-0" />
                <div className="text-xs">
                  <p className="font-bold">Timing</p>
                  <p className="text-slate-600 font-medium">{event.time}</p>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900">
              <MapPin className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-bold">Venue & Address</p>
                <p className="text-slate-600 font-medium">{event.location}, {event.city}, {event.state}</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
              About the Experience
            </h3>
            <p className="text-sm text-slate-700 leading-relaxed">
              {event.longDescription}
            </p>
          </div>

          {/* Inclusions / Highlights */}
          {event.highlights && event.highlights.length > 0 && (
            <div className="space-y-2.5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                Event Highlights & Inclusions
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {event.highlights.map((item) => (
                  <div key={item} className="flex items-center gap-2 text-xs font-semibold text-slate-800 p-2 rounded-xl bg-slate-50 border border-slate-100">
                    <CheckCircle className="w-4 h-4 text-teal-600 flex-shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Organizer */}
          <div className="flex items-center gap-2.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
            <Building className="w-4 h-4 text-slate-500 flex-shrink-0" />
            <div>
              <span className="font-semibold text-slate-800">Presented by: </span>
              <span>{event.organizer}</span>
            </div>
          </div>

          {/* Demonstration Notice */}
          <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
            <ShieldCheck className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p>
              <span className="font-bold">Sample Demonstration Listing:</span> This is demonstration content for HolidayExpertz. No real ticket purchase, payments, or bookings are processed on this preview.
            </p>
          </div>

          {/* Bottom Action Footer */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-[11px] uppercase font-bold text-slate-500 block">
                Access Pass
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">
                  {formattedPrice}
                </span>
                {typeof event.price === "number" && (
                  <span className="text-xs text-slate-500 font-medium">/ person</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => {
                  if (typeof navigator !== "undefined" && navigator.clipboard) {
                    navigator.clipboard.writeText(window.location.href);
                    alert("Event link copied to clipboard!");
                  }
                }}
                className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all flex items-center justify-center gap-1.5 flex-1 sm:flex-initial"
              >
                <Share2 className="w-4 h-4" />
                <span>Share</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-teal-600/20 transition-all flex-1 sm:flex-initial"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
