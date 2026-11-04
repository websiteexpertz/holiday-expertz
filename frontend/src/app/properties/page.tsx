"use client";
import { apiUrl } from "@/lib/apiUrl";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AuthModal from "@/components/layout/AuthModal";
import HotelSearch from "@/components/home/HotelSearch";
import PropertyFilterSidebar, { PropertyFilterValues } from "@/components/hotels/PropertyFilterSidebar";
import SidebarMapCard from "@/components/hotels/SidebarMapCard";
import InteractivePropertyMap from "@/components/hotels/InteractivePropertyMap";
import PropertiesHeroSlideshow from "@/components/properties/PropertiesHeroSlideshow";
import { SearchState } from "@/types/hotel";
import { Property, PropertyStatus, PropertyTypeCategory } from "@backend/types/property";
import {
  MapPin,
  Users,
  Bed,
  Bath,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Star,
  ShieldCheck,
  Building2,
  RotateCcw,
  Wifi,
  Car,
  Waves,
  Wind,
  Coffee,
  Check,
  X,
  Search,
  ArrowRight,
  SlidersHorizontal,
} from "lucide-react";

const PROPERTY_CATEGORIES: (PropertyTypeCategory | "All")[] = [
  "All",
  "Luxury Hotels",
  "Resorts",
  "Villas",
  "Homestays",
  "Palace Stays",
  "Boutique Stays",
  "Guesthouses",
  "Apartments",
];

const STATUS_OPTIONS: { label: string; value: PropertyStatus | "all" }[] = [
  { label: "All Status", value: "all" },
  { label: "Approved", value: "approved" },
  { label: "Pending", value: "pending_approval" },
  { label: "Paused", value: "paused" },
  { label: "Draft", value: "draft" },
  { label: "Rejected", value: "rejected" },
];

function getAmenityIcon(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes("wi-fi") || lower.includes("wifi") || lower.includes("internet")) {
    return <Wifi className="w-3.5 h-3.5 text-teal-600" />;
  }
  if (lower.includes("pool") || lower.includes("swim")) {
    return <Waves className="w-3.5 h-3.5 text-cyan-600" />;
  }
  if (lower.includes("air") || lower.includes("ac") || lower.includes("cooling")) {
    return <Wind className="w-3.5 h-3.5 text-sky-600" />;
  }
  if (lower.includes("park") || lower.includes("valet") || lower.includes("garage")) {
    return <Car className="w-3.5 h-3.5 text-indigo-600" />;
  }
  if (lower.includes("kitchen") || lower.includes("dining") || lower.includes("breakfast") || lower.includes("coffee")) {
    return <Coffee className="w-3.5 h-3.5 text-amber-600" />;
  }
  if (lower.includes("spa") || lower.includes("butler") || lower.includes("helipad")) {
    return <Sparkles className="w-3.5 h-3.5 text-purple-600" />;
  }
  return <Check className="w-3.5 h-3.5 text-teal-600" />;
}

function StatusBadge({ status }: { status?: PropertyStatus | string }) {
  switch (status) {
    case "approved":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Approved</span>
        </span>
      );
    case "pending_approval":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          <span>Pending</span>
        </span>
      );
    case "rejected":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          <span>Rejected</span>
        </span>
      );
    case "paused":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
          <span>Paused</span>
        </span>
      );
    case "draft":
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
          <span>Draft</span>
        </span>
      );
  }
}

function PropertiesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL Query Parameters
  const queryDestination = searchParams.get("destination") || searchParams.get("search") || searchParams.get("city") || "";
  const queryCheckIn = searchParams.get("checkIn") || "";
  const queryCheckOut = searchParams.get("checkOut") || "";
  const queryGuests = searchParams.get("guests") ? Number(searchParams.get("guests")) : "";
  const queryCategory = (searchParams.get("category") || searchParams.get("type") || "All") as PropertyTypeCategory | "All";
  const queryStatus = (searchParams.get("status") || "all") as PropertyStatus | "all";

  // Component States
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active Filter States
  const [destination, setDestination] = useState(queryDestination);
  const [checkIn, setCheckIn] = useState(queryCheckIn);
  const [checkOut, setCheckOut] = useState(queryCheckOut);
  const [guestsFilter, setGuestsFilter] = useState<number | "">(queryGuests);
  const [selectedCategory, setSelectedCategory] = useState<PropertyTypeCategory | "All">(queryCategory);
  const [selectedStatus, setSelectedStatus] = useState<PropertyStatus | "all">(queryStatus);
  const [sortBy, setSortBy] = useState<"newest" | "price_asc" | "price_desc" | "rating" | "name">("newest");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  // Filter Sidebar State
  const [sidebarFilters, setSidebarFilters] = useState<PropertyFilterValues>({
    types: [],
    amenities: [],
    minPrice: null,
    maxPrice: null,
    minRating: null,
    starRating: null,
  });
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [isMapViewOpen, setIsMapViewOpen] = useState(false);
  const [selectedMapPropertyId, setSelectedMapPropertyId] = useState<string | null>(null);

  // Close mobile filter drawer on Escape key for accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mobileFiltersOpen) {
        setMobileFiltersOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileFiltersOpen]);

  // Synchronize state when URL query params change
  useEffect(() => {
    const dest = searchParams.get("destination") || searchParams.get("search") || searchParams.get("city") || "";
    setDestination(dest);
    const ci = searchParams.get("checkIn") || "";
    setCheckIn(ci);
    const co = searchParams.get("checkOut") || "";
    setCheckOut(co);
    const g = searchParams.get("guests") ? Number(searchParams.get("guests")) : "";
    setGuestsFilter(g);
    const cat = (searchParams.get("category") || searchParams.get("type") || "All") as PropertyTypeCategory | "All";
    setSelectedCategory(cat);
    const st = (searchParams.get("status") || "all") as PropertyStatus | "all";
    setSelectedStatus(st);

    // Sidebar query params
    const qTypes = searchParams.get("types") ? (searchParams.get("types")!.split(",") as PropertyTypeCategory[]) : [];
    const qAmenities = searchParams.get("amenities") ? searchParams.get("amenities")!.split(",") : [];
    const qMinPrice = searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : null;
    const qMaxPrice = searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : null;
    const qMinRating = searchParams.get("minRating") ? Number(searchParams.get("minRating")) : null;
    const qStarRating = searchParams.get("starRating") ? Number(searchParams.get("starRating")) : null;

    if (qTypes.length || qAmenities.length || qMinPrice !== null || qMaxPrice !== null || qMinRating !== null || qStarRating !== null) {
      setSidebarFilters({
        types: qTypes,
        amenities: qAmenities,
        minPrice: qMinPrice,
        maxPrice: qMaxPrice,
        minRating: qMinRating,
        starRating: qStarRating,
      });
    }
  }, [searchParams]);

  // Load Properties from Public API
  useEffect(() => {
    async function loadProperties() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(apiUrl("/api/public/properties"));
        if (!res.ok) {
          setError("Properties directory is temporarily unavailable. Please try again shortly.");
          return;
        }

        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          setError("Unable to process properties response. Please try again.");
          return;
        }

        const data = await res.json();

        if (data.success && Array.isArray(data.properties)) {
          setProperties(data.properties);
        } else {
          setError(data.message || "Failed to load properties");
        }
      } catch (err) {
        console.error("Failed to load properties directory:", err);
        setError("Unable to connect to the properties directory. Please check your network and try again.");
      } finally {
        setLoading(false);
      }
    }

    loadProperties();
  }, []);

  // Handle Search Submission from HotelSearch
  const handleSearchSubmit = (searchData: SearchState) => {
    const dest = searchData.destination.trim();
    setDestination(dest);
    setCheckIn(searchData.checkIn);
    setCheckOut(searchData.checkOut);
    const totalG = (searchData.adults || 2) + (searchData.children || 0);
    setGuestsFilter(totalG);
    setCurrentPage(1);

    // Update URL query parameters
    const params = new URLSearchParams();
    if (dest) params.set("destination", dest);
    if (searchData.locationType) params.set("locationType", searchData.locationType);
    if (searchData.locationId) params.set("locationId", searchData.locationId);
    if (searchData.countryId) params.set("countryId", searchData.countryId);
    if (searchData.stateId) params.set("stateId", searchData.stateId);
    if (searchData.cityId) params.set("cityId", searchData.cityId);
    if (searchData.areaId) params.set("areaId", searchData.areaId);
    if (searchData.checkIn) params.set("checkIn", searchData.checkIn);
    if (searchData.checkOut) params.set("checkOut", searchData.checkOut);
    if (totalG > 0) params.set("guests", String(totalG));
    if (selectedCategory !== "All") params.set("category", selectedCategory);
    if (selectedStatus !== "all") params.set("status", selectedStatus);

    router.replace(`/properties?${params.toString()}`, { scroll: false });
  };

  // Filtered & Sorted Properties List
  const filteredProperties = useMemo(() => {
    return properties
      .filter((p) => {
        // Status filter
        if (selectedStatus !== "all" && p.status !== selectedStatus) {
          return false;
        }

        // Property Type filter (sidebar multi-select or query category)
        if (sidebarFilters.types.length > 0) {
          if (!sidebarFilters.types.includes(p.propertyType)) {
            return false;
          }
        } else if (selectedCategory !== "All" && p.propertyType !== selectedCategory) {
          return false;
        }

        // Sidebar Amenities filter (AND model - must match all selected amenities)
        if (sidebarFilters.amenities.length > 0) {
          const propAmenities = (p.amenities || []).map((a) => a.toLowerCase());
          const hasAll = sidebarFilters.amenities.every((reqAm) =>
            propAmenities.some((pa) => pa.includes(reqAm.toLowerCase()))
          );
          if (!hasAll) return false;
        }

        // Sidebar Price Range filter
        if (sidebarFilters.minPrice !== null && (p.pricing?.pricePerNight || 0) < sidebarFilters.minPrice) {
          return false;
        }
        if (sidebarFilters.maxPrice !== null && (p.pricing?.pricePerNight || 0) > sidebarFilters.maxPrice) {
          return false;
        }

        // Sidebar Guest Review Score filter
        if (sidebarFilters.minRating !== null) {
          const r = p.rating ?? 5.0;
          if (r < sidebarFilters.minRating) return false;
        }

        // Sidebar Star Classification filter
        if (sidebarFilters.starRating !== null) {
          const r = p.rating ?? 5.0;
          if (sidebarFilters.starRating === 5 && r < 4.9) return false;
          if (sidebarFilters.starRating === 4 && (r < 4.0 || r >= 4.9)) return false;
          if (sidebarFilters.starRating === 3 && r >= 4.0) return false;
        }

        // Guests Capacity filter
        if (guestsFilter && typeof guestsFilter === "number" && guestsFilter > 0) {
          if ((p.capacity?.maxGuests || 0) < guestsFilter) {
            return false;
          }
        }

        // Destination / Location / Keyword search
        if (destination.trim()) {
          const q = destination.toLowerCase().trim();
          const tokens = q.split(/[\s,]+/).filter(Boolean);
          const searchable = [
            p.name,
            p.propertyType,
            p.shortDescription,
            p.detailedDescription,
            p.location?.city,
            p.location?.state,
            p.location?.country,
            p.location?.locality,
            p.location?.address,
            p.contactDetails?.contactPerson,
            ...(p.amenities || []),
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          const matchesTokens = tokens.every((token) => searchable.includes(token));
          if (!matchesTokens) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "price_asc") {
          return (a.pricing?.pricePerNight || 0) - (b.pricing?.pricePerNight || 0);
        }
        if (sortBy === "price_desc") {
          return (b.pricing?.pricePerNight || 0) - (a.pricing?.pricePerNight || 0);
        }
        if (sortBy === "rating") {
          return (b.rating || 5) - (a.rating || 5);
        }
        if (sortBy === "name") {
          return a.name.localeCompare(b.name);
        }
        // Default newest
        const timeA = new Date(a.approvedAt || a.createdAt || 0).getTime();
        const timeB = new Date(b.approvedAt || b.createdAt || 0).getTime();
        return timeB - timeA;
      });
  }, [properties, selectedStatus, selectedCategory, sidebarFilters, guestsFilter, destination, sortBy]);

  // Pagination slice
  const totalPages = Math.ceil(filteredProperties.length / PAGE_SIZE) || 1;
  const paginatedProperties = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredProperties.slice(start, start + PAGE_SIZE);
  }, [filteredProperties, currentPage]);

  // Reset ONLY Sidebar Filters (preserves destination & dates)
  const handleResetSidebarFilters = () => {
    setSidebarFilters({
      types: [],
      amenities: [],
      minPrice: null,
      maxPrice: null,
      minRating: null,
      starRating: null,
    });
    setCurrentPage(1);
  };

  // Reset All Filters (including destination & dates)
  const handleResetFilters = () => {
    setDestination("");
    setCheckIn("");
    setCheckOut("");
    setGuestsFilter("");
    setSelectedCategory("All");
    setSelectedStatus("all");
    setSortBy("newest");
    setSidebarFilters({
      types: [],
      amenities: [],
      minPrice: null,
      maxPrice: null,
      minRating: null,
      starRating: null,
    });
    setCurrentPage(1);

    router.replace("/properties", { scroll: false });
  };

  const sidebarActiveCount =
    sidebarFilters.types.length +
    sidebarFilters.amenities.length +
    (sidebarFilters.minPrice !== null ? 1 : 0) +
    (sidebarFilters.maxPrice !== null ? 1 : 0) +
    (sidebarFilters.minRating !== null ? 1 : 0) +
    (sidebarFilters.starRating !== null ? 1 : 0);

  const hasActiveFilters = Boolean(
    destination ||
      checkIn ||
      checkOut ||
      guestsFilter ||
      selectedCategory !== "All" ||
      selectedStatus !== "all" ||
      sortBy !== "newest" ||
      sidebarActiveCount > 0
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Header onOpenAuthModal={() => setAuthModalOpen(true)} />

      {/* ── Top Header Section / Dynamic Destination Hero Slideshow ── */}
      <PropertiesHeroSlideshow
        countryId={searchParams.get("countryId") || ""}
        stateId={searchParams.get("stateId") || ""}
        cityId={searchParams.get("cityId") || ""}
        areaId={searchParams.get("areaId") || ""}
        locationType={searchParams.get("locationType") || ""}
        locationId={searchParams.get("locationId") || ""}
        destinationQuery={destination}
        totalProperties={filteredProperties.length}
      />

      {/* ── Main Content Container ── */}
      <main
        className={`mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex-1 w-full space-y-6 ${
          isMapViewOpen ? "max-w-[1720px]" : "max-w-7xl"
        }`}
      >
        {/* ── Search Bar (Replaces Category Chips Bar with exact same full-width layout) ── */}
        <div className="relative z-30">
          <HotelSearch
            variant="header-bar"
            initialDestination={destination}
            initialCheckIn={checkIn}
            initialCheckOut={checkOut}
            initialAdults={guestsFilter ? Number(guestsFilter) : 2}
            buttonText="Search"
            onSearch={handleSearchSubmit}
          />
        </div>

        {/* ── TWO MODES: SPLIT MAP VIEW OR DEFAULT TWO-COLUMN LAYOUT ── */}
        {isMapViewOpen ? (
          /* ── SPLIT MAP VIEW (Booking.com style as in Image 2) ── */
          <div className="flex items-start gap-5 lg:gap-6">
            {/* Left Column: Filter Sidebar in Map View */}
            <aside className="hidden xl:flex flex-col gap-3.5 w-64 shrink-0 sticky top-20 self-start h-[calc(100vh-5.5rem)]">
              <div className="flex-1 min-h-0">
                <PropertyFilterSidebar
                  filters={sidebarFilters}
                  onChange={(newFilters) => {
                    setSidebarFilters(newFilters);
                    setCurrentPage(1);
                  }}
                  onReset={handleResetSidebarFilters}
                  availableProperties={properties}
                  totalResultsCount={filteredProperties.length}
                />
              </div>
            </aside>

            {/* Middle Column: Scrollable Properties List */}
            <div className="w-full lg:w-[420px] xl:w-[460px] shrink-0 h-[calc(100vh-5.5rem)] flex flex-col space-y-3 bg-white rounded-2xl border border-slate-200 shadow-xs p-3.5">
              {/* Header inside Middle Column */}
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 shrink-0">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setMobileFiltersOpen(true)}
                    className="xl:hidden inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100"
                  >
                    <SlidersHorizontal className="w-3 h-3 text-teal-600" />
                    <span>Filters</span>
                    {sidebarActiveCount > 0 && (
                      <span className="w-3.5 h-3.5 rounded-full bg-teal-600 text-white text-[9px] flex items-center justify-center font-bold">
                        {sidebarActiveCount}
                      </span>
                    )}
                  </button>
                  <p className="text-xs font-bold text-slate-700">
                    <span className="text-slate-900">{filteredProperties.length}</span> stays found
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="text-[11px] font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 focus:outline-none"
                  >
                    <option value="newest">Newest</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                    <option value="rating">Top Rated</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => setIsMapViewOpen(false)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                    title="Close map view"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Close Map</span>
                  </button>
                </div>
              </div>

              {/* Scrollable list of properties */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {filteredProperties.length === 0 ? (
                  <div className="py-12 text-center space-y-3">
                    <Building2 className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-xs text-slate-500">No properties match your filters.</p>
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="px-3 py-1.5 text-xs font-bold text-teal-600 bg-teal-50 rounded-lg hover:bg-teal-100"
                    >
                      Reset Filters
                    </button>
                  </div>
                ) : (
                  filteredProperties.map((property) => {
                    const isSelected = selectedMapPropertyId === property.id;
                    const coverUrl =
                      property.images?.find((img) => img.isCover)?.url ||
                      property.images?.[0]?.url ||
                      "";
                    const formattedPrice = new Intl.NumberFormat("en-IN", {
                      maximumFractionDigits: 0,
                    }).format(property.pricing?.pricePerNight || 0);

                    return (
                      <div
                        key={property.id}
                        id={`map-property-${property.id}`}
                        onClick={() => setSelectedMapPropertyId(property.id)}
                        onMouseEnter={() => setSelectedMapPropertyId(property.id)}
                        className={`p-3 rounded-xl border transition-all duration-200 cursor-pointer group bg-white ${
                          isSelected
                            ? "border-teal-500 ring-2 ring-teal-500/30 shadow-md bg-teal-50/20"
                            : "border-slate-200 hover:border-teal-300 hover:shadow-xs"
                        }`}
                      >
                        <div className="flex gap-3">
                          {/* Image */}
                          <div className="w-28 h-24 sm:w-32 sm:h-28 rounded-lg overflow-hidden relative shrink-0 bg-slate-900">
                            {coverUrl ? (
                              <Image
                                src={coverUrl}
                                alt={property.name}
                                fill
                                sizes="128px"
                                className="object-cover group-hover:scale-105 transition-transform"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-400">
                                <Building2 className="w-6 h-6" />
                              </div>
                            )}
                            <div className="absolute top-1.5 left-1.5 flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-slate-950/70 backdrop-blur-xs text-white text-[9px] font-bold">
                              <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                              <span>{property.rating ? property.rating.toFixed(1) : "5.0"}</span>
                            </div>
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0 flex flex-col justify-between">
                            <div>
                              <div className="flex items-center gap-1.5 text-[10px] font-bold text-teal-700">
                                <span>{property.propertyType}</span>
                                <span className="text-slate-300">•</span>
                                <span className="truncate text-slate-500 font-normal">
                                  {property.location?.city || property.location?.state || "Available"}
                                </span>
                              </div>
                              <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-teal-700 transition-colors line-clamp-1 mt-0.5">
                                {property.name}
                              </h4>
                              <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-1">
                                <span className="inline-flex items-center gap-0.5">
                                  <Users className="w-3 h-3 text-teal-600" />
                                  <span>{property.capacity?.maxGuests || 2}</span>
                                </span>
                                <span className="text-slate-300">•</span>
                                <span className="inline-flex items-center gap-0.5">
                                  <Bed className="w-3 h-3 text-teal-600" />
                                  <span>{property.capacity?.bedrooms || 1}R</span>
                                </span>
                                <span className="text-slate-300">•</span>
                                <span className="inline-flex items-center gap-0.5">
                                  <Bath className="w-3 h-3 text-teal-600" />
                                  <span>{property.capacity?.bathrooms || 1}B</span>
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 mt-1.5">
                              <div>
                                <span className="text-[9px] text-slate-400 font-semibold uppercase">Night</span>
                                <div className="text-xs sm:text-sm font-black text-slate-900 leading-tight">
                                  ₹{formattedPrice}
                                </div>
                              </div>
                              <Link
                                href={`/properties/${property.id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-[11px] transition-colors"
                              >
                                <span>View</span>
                                <ChevronRight className="w-3 h-3" />
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Column: Full-Height Interactive Map */}
            <div className="flex-1 min-w-0 h-[calc(100vh-5.5rem)] sticky top-20 rounded-2xl overflow-hidden border border-slate-200 shadow-md">
              <InteractivePropertyMap
                properties={filteredProperties}
                onClose={() => setIsMapViewOpen(false)}
                selectedPropertyId={selectedMapPropertyId}
                onSelectProperty={(id) => {
                  setSelectedMapPropertyId(id);
                  const el = document.getElementById(`map-property-${id}`);
                  if (el) {
                    el.scrollIntoView({ behavior: "smooth", block: "nearest" });
                  }
                }}
              />
            </div>
          </div>
        ) : (
          /* ── DEFAULT TWO-COLUMN LAYOUT: Filter Sidebar with Map Card (Left) + Full-Width Property Listings (Right) ── */
          <div className="flex flex-col lg:flex-row items-start gap-6 lg:gap-8">
            {/* Desktop Filter Sidebar with Map Card at Top */}
            <aside className="hidden lg:flex flex-col gap-3 w-72 shrink-0 sticky top-20 self-start h-[calc(100vh-5.5rem)] max-h-[calc(100vh-5.5rem)] overflow-hidden">
              {/* Map Preview Card at top of sidebar (Booking.com style as in Image 1) */}
              <div className="shrink-0">
                <SidebarMapCard
                  onOpenMap={() => setIsMapViewOpen(true)}
                  propertyCount={filteredProperties.length}
                />
              </div>

              {/* Filter Sidebar */}
              <div className="flex-1 min-h-0 overflow-hidden">
                <PropertyFilterSidebar
                  filters={sidebarFilters}
                  onChange={(newFilters) => {
                    setSidebarFilters(newFilters);
                    setCurrentPage(1);
                  }}
                  onReset={handleResetSidebarFilters}
                  availableProperties={properties}
                  totalResultsCount={filteredProperties.length}
                />
              </div>
            </aside>

            {/* Right Column: Existing Property Listings & Pagination */}
            <div className="flex-1 min-w-0 w-full space-y-4">
              {/* Listing Controls Header (Results count, mobile filter trigger, Map trigger, Status & Sort) */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-3.5 sm:px-5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {/* Mobile / Tablet Filter Toggle Button */}
                  <button
                    type="button"
                    onClick={() => setMobileFiltersOpen(true)}
                    className="lg:hidden inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                    title="Open property filters"
                    aria-label="Open property filters"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-teal-600" />
                    <span>Filters</span>
                    {sidebarActiveCount > 0 && (
                      <span className="w-4 h-4 rounded-full bg-teal-600 text-white text-[10px] flex items-center justify-center font-bold">
                        {sidebarActiveCount}
                      </span>
                    )}
                  </button>

                  {/* Map View Toggle Button */}
                  <button
                    type="button"
                    onClick={() => setIsMapViewOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 transition-colors cursor-pointer"
                    title="Open interactive map view"
                  >
                    <MapPin className="w-3.5 h-3.5 text-blue-600" />
                    <span className="hidden sm:inline">Show on map</span>
                    <span className="sm:hidden">Map</span>
                  </button>

                  <p className="text-xs sm:text-sm font-semibold text-slate-600">
                    Showing <span className="font-bold text-slate-900">{filteredProperties.length}</span> {filteredProperties.length === 1 ? "stay" : "stays"}
                  </p>
                </div>

              {/* Status, Sort & Reset Controls */}
              <div className="flex items-center gap-3 shrink-0">
                {/* Status Select */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-400 font-semibold hidden sm:inline">Status:</span>
                  <select
                    value={selectedStatus}
                    onChange={(e) => {
                      setSelectedStatus(e.target.value as any);
                      setCurrentPage(1);
                    }}
                    aria-label="Filter by Status"
                    className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sort Select */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-400 font-semibold hidden sm:inline">Sort:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    aria-label="Sort Properties"
                    className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                  >
                    <option value="newest">Newest Added</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                    <option value="rating">Top Rated</option>
                    <option value="name">Name (A-Z)</option>
                  </select>
                </div>

                {/* Reset Filters Button */}
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-colors cursor-pointer"
                    title="Clear all search parameters"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Reset</span>
                  </button>
                )}
              </div>
            </div>

        {/* ── Loading State ── */}
        {loading && (
          <div className="py-24 text-center space-y-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
            <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <h3 className="text-base font-bold text-slate-800">Loading Properties...</h3>
            <p className="text-xs text-slate-500">Connecting to database and fetching property listings...</p>
          </div>
        )}

        {/* ── Error State ── */}
        {!loading && error && (
          <div className="py-16 text-center max-w-md mx-auto space-y-3 bg-white p-8 rounded-3xl border border-rose-200 shadow-xs">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <X className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Failed to Load Properties</h3>
            <p className="text-xs text-slate-500">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* ── Empty State ── */}
        {!loading && !error && filteredProperties.length === 0 && (
          <div className="py-20 text-center max-w-lg mx-auto space-y-4 bg-white p-8 rounded-3xl border border-slate-200 shadow-xs">
            <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto border border-slate-200">
              <Building2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No properties found</h3>
            <p className="text-xs sm:text-sm text-slate-500">
              No stays matched your active destination, dates, or filters. Try adjusting your query or resetting filters.
            </p>
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Clear All Filters</span>
            </button>
          </div>
        )}

        {/* ── Vertical Property Rows (Exactly One Property Per Row) ── */}
        {!loading && !error && filteredProperties.length > 0 && (
          <div className="space-y-4">
            {paginatedProperties.map((property) => {
              const coverUrl =
                property.images?.find((img) => img.isCover)?.url ||
                property.images?.[0]?.url ||
                "";

              const locationText = [
                property.location?.address,
                property.location?.locality,
                property.location?.city,
                property.location?.state,
                property.location?.country,
              ]
                .filter(Boolean)
                .join(", ");

              const formattedPrice = new Intl.NumberFormat("en-IN", {
                maximumFractionDigits: 0,
              }).format(property.pricing?.pricePerNight || 0);

              const originalPrice = property.pricing?.originalPrice
                ? new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(
                  property.pricing.originalPrice
                )
                : null;

              return (
                <div
                  key={property.id}
                  onClick={() => router.push(`/properties/${property.id}`)}
                  className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-teal-400 transition-all duration-200 overflow-hidden cursor-pointer group"
                >
                  <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center gap-4 sm:gap-6">
                    {/* Property Thumbnail */}
                    <div className="w-full md:w-60 h-48 md:h-40 rounded-xl overflow-hidden relative shrink-0 bg-slate-900 border border-slate-200">
                      {coverUrl ? (
                        <Image
                          src={coverUrl}
                          alt={property.name}
                          fill
                          sizes="(max-width: 768px) 100vw, 240px"
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          <Building2 className="w-10 h-10" />
                        </div>
                      )}

                      {/* Photo Count Badge */}
                      {property.images && property.images.length > 1 && (
                        <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-slate-950/70 backdrop-blur-xs text-white text-[10px] font-semibold">
                          {property.images.length} photos
                        </div>
                      )}

                      {/* Rating Badge */}
                      <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-950/70 backdrop-blur-xs text-white text-[10px] font-bold">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span>{property.rating ? property.rating.toFixed(1) : "5.0"}</span>
                      </div>
                    </div>

                    {/* Middle Details Section */}
                    <div className="flex-1 min-w-0 space-y-2">
                      {/* Category & Status Badges */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-800">
                          {property.propertyType}
                        </span>
                        <StatusBadge status={property.status} />
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Verified</span>
                        </span>
                      </div>

                      {/* Property Name */}
                      <h2 className="text-base sm:text-lg lg:text-xl font-bold text-slate-900 group-hover:text-teal-700 transition-colors line-clamp-1">
                        {property.name}
                      </h2>

                      {/* Location with Pin Icon */}
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 truncate">
                        <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                        <span className="truncate">{locationText || "Location unavailable"}</span>
                      </div>

                      {/* Short Description */}
                      <p className="text-xs text-slate-600 line-clamp-1 sm:line-clamp-2 leading-relaxed">
                        {property.shortDescription || property.detailedDescription}
                      </p>

                      {/* Key Accommodation Specs & Top Amenities */}
                      <div className="flex items-center gap-3 text-xs text-slate-700 flex-wrap pt-1">
                        <div className="inline-flex items-center gap-1 font-semibold text-slate-700">
                          <Users className="w-3.5 h-3.5 text-teal-600" />
                          <span>{property.capacity?.maxGuests || 2} Guests</span>
                        </div>
                        <span className="text-slate-300">•</span>
                        <div className="inline-flex items-center gap-1 font-semibold text-slate-700">
                          <Bed className="w-3.5 h-3.5 text-teal-600" />
                          <span>{property.capacity?.bedrooms || 1} Rooms</span>
                        </div>
                        <span className="text-slate-300">•</span>
                        <div className="inline-flex items-center gap-1 font-semibold text-slate-700">
                          <Bath className="w-3.5 h-3.5 text-teal-600" />
                          <span>{property.capacity?.bathrooms || 1} Baths</span>
                        </div>

                        {/* Top 2 Amenities Preview */}
                        {property.amenities && property.amenities.length > 0 && (
                          <>
                            <span className="text-slate-300 hidden sm:inline">•</span>
                            <div className="hidden sm:flex items-center gap-2">
                              {property.amenities.slice(0, 2).map((am, i) => (
                                <span
                                  key={i}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-medium text-slate-600"
                                >
                                  {getAmenityIcon(am)}
                                  <span>{am}</span>
                                </span>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Right Side: Pricing & Direct Action Buttons */}
                    <div className="md:w-56 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 md:border-l border-slate-100 md:pl-5 flex md:flex-col justify-between items-end md:items-end gap-3">
                      <div className="text-left md:text-right">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Per Night
                        </div>
                        <div className="text-lg sm:text-xl font-black text-slate-900">
                          ₹{formattedPrice}
                        </div>
                        {originalPrice && (
                          <div className="text-[11px] text-slate-400 line-through">
                            ₹{originalPrice}
                          </div>
                        )}
                      </div>

                      {/* Action Links */}
                      <div className="flex items-center gap-2">
                        {/* View Property Button */}
                        <Link
                          href={`/properties/${property.id}`}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 group-hover:bg-teal-700 text-white font-bold text-xs shadow-xs transition-all active:scale-95"
                        >
                          <span>View Property</span>
                          <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Pagination ── */}
        {!loading && !error && totalPages > 1 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-between text-xs shadow-xs">
            <span className="text-slate-500 font-medium">
              Showing page {currentPage} of {totalPages} ({filteredProperties.length} total properties)
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => {
                  setCurrentPage((p) => Math.max(1, p - 1));
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-semibold"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => {
                  setCurrentPage((p) => Math.min(totalPages, p + 1));
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-semibold"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
          </div>
        </div>
      )}

        {/* ── Mobile / Tablet Filter Drawer ── */}
        {mobileFiltersOpen && (
          <div
            className="fixed inset-0 z-50 lg:hidden flex"
            role="dialog"
            aria-modal="true"
            aria-label="Property filters"
          >
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
              onClick={() => setMobileFiltersOpen(false)}
              aria-hidden="true"
            />
            {/* Slide-over Drawer Panel */}
            <div className="relative w-full max-w-xs sm:max-w-sm bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
              {/* Map Preview Card at top of Mobile Drawer */}
              <div className="p-3 bg-slate-50 border-b border-slate-200 shrink-0">
                <SidebarMapCard
                  onOpenMap={() => {
                    setMobileFiltersOpen(false);
                    setIsMapViewOpen(true);
                  }}
                  propertyCount={filteredProperties.length}
                />
              </div>

              <div className="flex-1 min-h-0">
                <PropertyFilterSidebar
                  filters={sidebarFilters}
                  onChange={(newFilters) => {
                    setSidebarFilters(newFilters);
                    setCurrentPage(1);
                  }}
                  onReset={handleResetSidebarFilters}
                  availableProperties={properties}
                  isMobileDrawer={true}
                  onCloseMobileDrawer={() => setMobileFiltersOpen(false)}
                  totalResultsCount={filteredProperties.length}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </div>
  );
}

export default function PropertiesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <PropertiesContent />
    </Suspense>
  );
}
