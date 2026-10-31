"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  X,
  MapPin,
  Star,
  Check,
  Calendar,
  Users,
  ShieldCheck,
  Info,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { Hotel } from "@/types/hotel";

interface PropertyModalProps {
  hotel: Hotel | null;
  onClose: () => void;
}

export default function PropertyModal({ hotel, onClose }: PropertyModalProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [inquirySent, setInquirySent] = useState(false);

  // Handle ESC key and scroll lock
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (hotel) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [hotel, onClose]);

  if (!hotel) return null;

  const currentImage = selectedImage || hotel.featuredImage;

  const formattedPrice = new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(hotel.pricePerNight);

  const allImages = [hotel.featuredImage, ...(hotel.galleryImages || [])];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="property-modal-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden z-10 border border-slate-100 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header Bar */}
        <div className="p-4 sm:p-6 pb-3 border-b border-slate-100 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200">
                {hotel.propertyType}
              </span>
              {hotel.dealTag && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  {hotel.dealTag}
                </span>
              )}
            </div>
            <h2
              id="property-modal-title"
              className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight"
            >
              {hotel.name}
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
              <MapPin className="w-3.5 h-3.5 text-teal-600" />
              <span>{hotel.location}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-teal-600"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Modal Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          {/* Main Gallery Display */}
          <div className="space-y-3">
            <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden bg-slate-100">
              <Image
                src={currentImage}
                alt={hotel.name}
                fill
                sizes="(max-width: 1024px) 100vw, 800px"
                className="object-cover"
              />
            </div>

            {/* Thumbnail Strip */}
            <div className="flex gap-2.5 overflow-x-auto pb-1">
              {allImages.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelectedImage(img)}
                  className={`relative w-20 h-14 sm:w-24 sm:h-16 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all ${
                    currentImage === img
                      ? "border-teal-600 ring-2 ring-teal-200"
                      : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                >
                  <Image
                    src={img}
                    alt={`Thumbnail ${i + 1}`}
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Description & Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            <div className="md:col-span-2 space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 mb-1">
                  About This Property
                </h3>
                {hotel.tagline && (
                  <p className="text-sm font-semibold text-teal-700 mb-2">
                    &ldquo;{hotel.tagline}&rdquo;
                  </p>
                )}
                <p className="text-sm text-slate-600 leading-relaxed">
                  {hotel.description}
                </p>
              </div>

              {/* Amenities */}
              <div>
                <h4 className="text-sm font-bold text-slate-900 mb-2.5">
                  Featured Amenities
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {hotel.amenities.map((amenity) => (
                    <div
                      key={amenity}
                      className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 font-medium"
                    >
                      <Check className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
                      <span>{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Stay Summary Card */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div>
                    <span className="text-[11px] font-bold uppercase text-slate-600 block">
                      Price per night
                    </span>
                    <span className="text-2xl font-black text-slate-900">
                      ₹{formattedPrice}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-lg text-xs">
                      <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      <span>{hotel.rating.toFixed(1)}</span>
                    </div>
                    <span className="text-[11px] text-slate-600 block mt-0.5">
                      {hotel.reviewScore}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-teal-600" />
                    <span>Free cancellation up to 48 hrs before stay</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-teal-600" />
                    <span>Includes 2 adults & up to 1 child free</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-teal-600" />
                    <span>Handpicked HolidayExpertz verified standard</span>
                  </div>
                </div>
              </div>

              {/* Inquiry Action */}
              <div>
                {inquirySent ? (
                  <div className="p-3 bg-teal-100/70 border border-teal-300 rounded-xl text-teal-900 text-xs text-center font-semibold">
                    Enquiry request received! Our holiday specialist will assist you shortly.
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setInquirySent(true)}
                    className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md shadow-teal-600/20 active:scale-95 transition-all"
                  >
                    Check Stay Availability
                  </button>
                )}

                <Link
                  href={`/properties/${hotel.id}`}
                  onClick={onClose}
                  className="mt-2.5 w-full py-2.5 px-4 rounded-xl border border-teal-600 text-teal-800 hover:bg-teal-50 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>View Full Property Page</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>

                <div className="mt-2.5 flex items-start gap-1.5 text-[11px] text-slate-600">
                  <Info className="w-3.5 h-3.5 text-slate-600 flex-shrink-0 mt-0.5" />
                  <span>
                    Direct by owner listing • No booking or service fees charged by HolidayExpertz.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
