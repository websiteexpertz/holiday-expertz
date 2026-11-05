"use client";

import React, { useState, useEffect } from "react";
import {
  RotateCcw,
  Star,
  Check,
  ChevronDown,
  ChevronUp,
  X,
  SlidersHorizontal,
  Wifi,
  Waves,
  Wind,
  Car,
  Utensils,
  Mountain,
  Flame,
  Sparkles,
} from "lucide-react";
import { Property, PropertyTypeCategory } from "@backend/types/property";

export interface PropertyFilterValues {
  types: PropertyTypeCategory[];
  amenities: string[];
  minPrice: number | null;
  maxPrice: number | null;
  minRating: number | null;
  starRating: number | null;
}

interface PropertyFilterSidebarProps {
  filters: PropertyFilterValues;
  onChange: (filters: PropertyFilterValues) => void;
  onReset: () => void;
  availableProperties: Property[];
  isMobileDrawer?: boolean;
  onCloseMobileDrawer?: () => void;
  totalResultsCount?: number;
}

// Available Property Categories in Project Schema
const AVAILABLE_CATEGORIES: PropertyTypeCategory[] = [
  "Villas",
  "Boutique Stays",
  "Palace Stays",
  "Guesthouses",
  "Luxury Hotels",
  "Resorts",
  "Homestays",
  "Apartments",
];

// Curated Popular Amenities based on existing property data
const POPULAR_AMENITIES = [
  { label: "High-Speed Wi-Fi", key: "wi-fi", icon: Wifi },
  { label: "Swimming Pool", key: "swimming pool", icon: Waves },
  { label: "Air Conditioning", key: "air conditioning", icon: Wind },
  { label: "Free Parking", key: "parking", icon: Car },
  { label: "Kitchen & Dining", key: "kitchen", icon: Utensils },
  { label: "Mountain View", key: "mountain", icon: Mountain },
  { label: "Hot Water", key: "hot water", icon: Sparkles },
  { label: "Fireplace", key: "fireplace", icon: Flame },
  { label: "Spa & Wellness", key: "spa", icon: Sparkles },
  { label: "Room Service", key: "service", icon: Utensils },
];

// Review Score Ranges
const RATING_TIERS = [
  { label: "Superb: 4.9+", value: 4.9, badge: "4.9+" },
  { label: "Very Good: 4.8+", value: 4.8, badge: "4.8+" },
  { label: "Good: 4.5+", value: 4.5, badge: "4.5+" },
];

// Star Classifications
const STAR_TIERS = [
  { label: "5 Stars", stars: 5, value: 5 },
  { label: "4 Stars", stars: 4, value: 4 },
  { label: "3 Stars", stars: 3, value: 3 },
];

export default function PropertyFilterSidebar({
  filters,
  onChange,
  onReset,
  availableProperties,
  isMobileDrawer = false,
  onCloseMobileDrawer,
  totalResultsCount,
}: PropertyFilterSidebarProps) {
  const [showAllAmenities, setShowAllAmenities] = useState(false);
  const [minPriceInput, setMinPriceInput] = useState<string>(
    filters.minPrice !== null ? String(filters.minPrice) : ""
  );
  const [maxPriceInput, setMaxPriceInput] = useState<string>(
    filters.maxPrice !== null ? String(filters.maxPrice) : ""
  );

  // Synchronize input fields if filters reset externally
  useEffect(() => {
    setMinPriceInput(filters.minPrice !== null ? String(filters.minPrice) : "");
    setMaxPriceInput(filters.maxPrice !== null ? String(filters.maxPrice) : "");
  }, [filters.minPrice, filters.maxPrice]);

  // Count active filters
  const activeCount =
    filters.types.length +
    filters.amenities.length +
    (filters.minPrice !== null ? 1 : 0) +
    (filters.maxPrice !== null ? 1 : 0) +
    (filters.minRating !== null ? 1 : 0) +
    (filters.starRating !== null ? 1 : 0);

  // Property Type Toggle
  const toggleType = (cat: PropertyTypeCategory) => {
    const exists = filters.types.includes(cat);
    const updated = exists
      ? filters.types.filter((t) => t !== cat)
      : [...filters.types, cat];
    onChange({ ...filters, types: updated });
  };

  // Amenity Toggle
  const toggleAmenity = (key: string) => {
    const exists = filters.amenities.includes(key);
    const updated = exists
      ? filters.amenities.filter((a) => a !== key)
      : [...filters.amenities, key];
    onChange({ ...filters, amenities: updated });
  };

  // Rating Toggle
  const selectRating = (value: number | null) => {
    onChange({
      ...filters,
      minRating: filters.minRating === value ? null : value,
    });
  };

  // Star Rating Toggle
  const selectStarRating = (stars: number | null) => {
    onChange({
      ...filters,
      starRating: filters.starRating === stars ? null : stars,
    });
  };

  // Price Submissions
  const applyPrice = (minVal?: number | null, maxVal?: number | null) => {
    const min =
      minVal !== undefined
        ? minVal
        : minPriceInput.trim() !== ""
        ? Math.max(0, Number(minPriceInput))
        : null;
    const max =
      maxVal !== undefined
        ? maxVal
        : maxPriceInput.trim() !== ""
        ? Math.max(0, Number(maxPriceInput))
        : null;

    if (min !== null && max !== null && min > max) {
      onChange({ ...filters, minPrice: max, maxPrice: min });
    } else {
      onChange({ ...filters, minPrice: min, maxPrice: max });
    }
  };

  // Dynamic counts for Property Types
  const getTypeCount = (type: PropertyTypeCategory) => {
    return availableProperties.filter((p) => p.propertyType === type).length;
  };

  // Dynamic counts for Amenities
  const getAmenityCount = (key: string) => {
    return availableProperties.filter((p) =>
      p.amenities?.some((a: string) => a.toLowerCase().includes(key))
    ).length;
  };

  // Dynamic counts for Review Tier
  const getRatingCount = (minVal: number) => {
    return availableProperties.filter((p) => (p.rating ?? 5.0) >= minVal).length;
  };

  // Dynamic counts for Star Classification
  const getStarCount = (stars: number) => {
    return availableProperties.filter((p) => {
      const r = p.rating ?? 5.0;
      if (stars === 5) return r >= 4.9;
      if (stars === 4) return r >= 4.0 && r < 4.9;
      return r < 4.0;
    }).length;
  };

  const displayedAmenities = showAllAmenities
    ? POPULAR_AMENITIES
    : POPULAR_AMENITIES.slice(0, 5);

  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col overflow-hidden ${
        isMobileDrawer
          ? "h-full border-0 rounded-none shadow-none"
          : "h-full min-h-0 p-4 sm:p-5"
      }`}
    >
      {/* ── Sidebar Pinned Header (Always visible at top of sidebar) ── */}
      <div
        className={`flex items-center justify-between pb-3.5 border-b border-slate-100 shrink-0 ${
          isMobileDrawer ? "p-5 pb-4 bg-slate-50 border-b border-slate-200" : ""
        }`}
      >
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-[#2563eb]" />
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
            Filters
          </h3>
          {activeCount > 0 && (
            <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              {activeCount} active
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {activeCount > 0 && (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline transition-colors cursor-pointer"
              title="Clear all filters"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Clear all</span>
            </button>
          )}

          {isMobileDrawer && onCloseMobileDrawer && (
            <button
              type="button"
              onClick={onCloseMobileDrawer}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors ml-1"
              aria-label="Close filters"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* ── Scrollable Filter Sections (Scrolls independently!) ── */}
      <div
        className={`space-y-5 divide-y divide-slate-100 overflow-y-auto flex-1 min-h-0 pr-1.5 pt-3 scrollbar-thin scrollbar-thumb-slate-200 hover:scrollbar-thumb-slate-300 ${
          isMobileDrawer ? "p-5 flex-1" : ""
        }`}
      >
        {/* 1. Suggested For You */}
        <section className="space-y-2.5 pt-1 first:pt-0">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 font-editorial-sans">
            Suggested for you
          </h4>
          <button
            type="button"
            onClick={() => {
              const isPopular = filters.minRating === 4.5;
              onChange({ ...filters, minRating: isPopular ? null : 4.5 });
            }}
            className="w-full flex items-center justify-between py-1 px-0.5 cursor-pointer text-xs select-none group text-left"
          >
            <div className="flex items-center gap-2.5">
              <div
                className={`w-4 h-4 rounded border flex items-center justify-center transition-all shrink-0 ${
                  filters.minRating === 4.5
                    ? "bg-[#2563eb] border-[#2563eb] text-white"
                    : "border-slate-300 bg-white group-hover:border-slate-400"
                }`}
              >
                {filters.minRating === 4.5 && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
              <span className="flex items-center gap-1.5 font-medium text-slate-700 group-hover:text-slate-900">
                <span>🔥</span>
                <span>Popular Hotels</span>
              </span>
            </div>
          </button>
        </section>

        {/* 2. Price Per Night Filter (Exact match to reference image slider) */}
        <section className="space-y-2 pt-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 font-editorial-sans">
              PRICE PER NIGHT
            </h4>
            {filters.maxPrice !== null && (
              <button
                type="button"
                onClick={() => {
                  onChange({ ...filters, maxPrice: null });
                }}
                className="text-[11px] font-semibold text-[#2563eb] hover:underline cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>

          <p className="text-xs sm:text-sm font-medium text-slate-600">
            Up to ₹{(filters.maxPrice ?? 30000).toLocaleString("en-IN")} per night
          </p>

          {/* Blue Slider Track with Circular Thumb */}
          <div className="pt-2 pb-1">
            <input
              type="range"
              min="1000"
              max="30000"
              step="500"
              value={filters.maxPrice ?? 30000}
              onChange={(e) => {
                const val = Number(e.target.value);
                onChange({ ...filters, maxPrice: val >= 30000 ? null : val });
              }}
              style={{
                background: `linear-gradient(to right, #2563eb 0%, #2563eb ${
                  (((filters.maxPrice ?? 30000) - 1000) / (30000 - 1000)) * 100
                }%, #e2e8f0 ${
                  (((filters.maxPrice ?? 30000) - 1000) / (30000 - 1000)) * 100
                }%, #e2e8f0 100%)`,
              }}
              className="w-full h-2 rounded-full appearance-none cursor-pointer accent-[#2563eb] focus:outline-none"
            />
          </div>
        </section>

        {/* 3. Star Category (Matching reference image) */}
        <section className="space-y-2 pt-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 font-editorial-sans">
              STAR CATEGORY
            </h4>
            {filters.starRating !== null && (
              <button
                type="button"
                onClick={() => selectStarRating(null)}
                className="text-[11px] font-semibold text-[#2563eb] hover:underline cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>

          <div className="space-y-1.5">
            {STAR_TIERS.map((tier) => {
              const isChecked = filters.starRating === tier.stars;
              const count = getStarCount(tier.stars);
              return (
                <button
                  key={tier.label}
                  type="button"
                  onClick={() => selectStarRating(tier.stars)}
                  className="w-full flex items-center justify-between py-1 px-0.5 cursor-pointer text-xs text-left select-none group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center transition-all shrink-0 ${
                        isChecked
                          ? "bg-[#2563eb] border-[#2563eb] text-white"
                          : "border-slate-300 bg-white group-hover:border-slate-400"
                      }`}
                    >
                      {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < tier.stars
                                ? "fill-amber-400 text-amber-400"
                                : "text-slate-200"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="font-medium text-slate-700 group-hover:text-slate-900">
                        {tier.stars} Star
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium pl-2 shrink-0">
                    ({count})
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* 2. Property Type Filter */}
        <section className="space-y-2 pt-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Property Type
            </h4>
            {filters.types.length > 0 && (
              <button
                type="button"
                onClick={() => onChange({ ...filters, types: [] })}
                className="text-[11px] font-semibold text-teal-600 hover:underline cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>

          <div className="space-y-1">
            {AVAILABLE_CATEGORIES.map((cat) => {
              const isChecked = filters.types.includes(cat);
              const count = getTypeCount(cat);
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleType(cat)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl cursor-pointer transition-colors text-xs text-left select-none ${
                    isChecked
                      ? "bg-teal-50/90 text-teal-900 font-bold"
                      : "hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all shrink-0 ${
                        isChecked
                          ? "bg-teal-600 border-teal-600 text-white"
                          : "border-slate-300 bg-white"
                      }`}
                    >
                      {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span className="truncate">{cat}</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium pl-2 shrink-0">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* 3. Features & Amenities */}
        <section className="space-y-2 pt-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Amenities & Facilities
            </h4>
            {filters.amenities.length > 0 && (
              <button
                type="button"
                onClick={() => onChange({ ...filters, amenities: [] })}
                className="text-[11px] font-semibold text-teal-600 hover:underline cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>

          <div className="space-y-1">
            {displayedAmenities.map((amenity) => {
              const isChecked = filters.amenities.includes(amenity.key);
              const count = getAmenityCount(amenity.key);
              const IconComp = amenity.icon;
              return (
                <button
                  key={amenity.key}
                  type="button"
                  onClick={() => toggleAmenity(amenity.key)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl cursor-pointer transition-colors text-xs text-left select-none ${
                    isChecked
                      ? "bg-teal-50/90 text-teal-900 font-bold"
                      : "hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all shrink-0 ${
                        isChecked
                          ? "bg-teal-600 border-teal-600 text-white"
                          : "border-slate-300 bg-white"
                      }`}
                    >
                      {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <IconComp className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    <span className="truncate">{amenity.label}</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium pl-2 shrink-0">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {POPULAR_AMENITIES.length > 5 && (
            <button
              type="button"
              onClick={() => setShowAllAmenities(!showAllAmenities)}
              className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1 pt-1 pl-2 transition-colors cursor-pointer"
            >
              <span>
                {showAllAmenities
                  ? "Show less amenities"
                  : `Show all ${POPULAR_AMENITIES.length} amenities`}
              </span>
              {showAllAmenities ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          )}
        </section>

        {/* 4. Guest Review Score */}
        <section className="space-y-2 pt-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Guest Rating
            </h4>
            {filters.minRating !== null && (
              <button
                type="button"
                onClick={() => selectRating(null)}
                className="text-[11px] font-semibold text-teal-600 hover:underline cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>

          <div className="space-y-1">
            {RATING_TIERS.map((tier) => {
              const isChecked = filters.minRating === tier.value;
              const count = getRatingCount(tier.value);
              return (
                <button
                  key={tier.label}
                  type="button"
                  onClick={() => selectRating(tier.value)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl cursor-pointer transition-colors text-xs text-left select-none ${
                    isChecked
                      ? "bg-teal-50/90 text-teal-900 font-bold"
                      : "hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all shrink-0 ${
                        isChecked
                          ? "border-teal-600 bg-teal-600 text-white"
                          : "border-slate-300 bg-white"
                      }`}
                    >
                      {isChecked && (
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      )}
                    </div>
                    <span className="truncate">{tier.label}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-1.5 py-0.5 rounded-md bg-teal-900 text-white text-[10px] font-bold">
                      {tier.badge}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {count}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

      </div>

      {/* ── Mobile Drawer Bottom Sticky Action Bar ── */}
      {isMobileDrawer && (
        <div className="p-4 border-t border-slate-200 bg-white space-y-2 shrink-0">
          <button
            type="button"
            onClick={onCloseMobileDrawer}
            className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm rounded-xl shadow-md transition-all text-center cursor-pointer"
          >
            Show {totalResultsCount ?? availableProperties.length} Properties
          </button>
          {activeCount > 0 && (
            <button
              type="button"
              onClick={onReset}
              className="w-full py-2 text-xs font-semibold text-slate-600 hover:text-rose-600 text-center transition-colors cursor-pointer"
            >
              Clear All Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
