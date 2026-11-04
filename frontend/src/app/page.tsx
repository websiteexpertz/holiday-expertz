"use client";
import { apiUrl } from "@/lib/apiUrl";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import Header from "@frontend/components/layout/Header";
import Footer from "@frontend/components/layout/Footer";
import AuthModal from "@frontend/components/layout/AuthModal";
import HeroSection from "@frontend/components/home/HeroSection";
import WhatMakesUsExtraordinary from "@frontend/components/home/WhatMakesUsExtraordinary";
import WhatsHappeningSection from "@frontend/components/home/WhatsHappeningSection";
import HandpickedProperties from "@frontend/components/home/HandpickedProperties";
import PopularDestinations from "@frontend/components/home/PopularDestinations";
import MemoriesSection from "@frontend/components/home/MemoriesSection";
import BlogSection from "@frontend/components/home/BlogSection";
import { mockHotels } from "@/data/hotels";
import { Hotel, PropertyType, SearchState } from "@/types/hotel";

function convertPropertyToHotel(p: any): Hotel {
  const coverImage =
    p.images?.find((img: any) => img.isCover)?.url ||
    p.images?.[0]?.url ||
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80";

  return {
    id: p.id,
    name: p.name,
    tagline: p.shortDescription || "",
    location: [p.location?.locality, p.location?.city, p.location?.state].filter(Boolean).join(", "),
    city: p.location?.city || "",
    state: p.location?.state || "",
    country: p.location?.country || "",
    locality: p.location?.locality || "",
    countryId: p.countryId,
    stateId: p.stateId,
    cityId: p.cityId,
    areaId: p.areaId,
    rating: p.rating || 4.9,
    reviewScore: (p.rating || 5) >= 4.8 ? "Superb" : "Excellent",
    reviewCount: p.reviewCount || 16,
    pricePerNight: p.pricing?.pricePerNight || 8500,
    originalPrice: p.pricing?.originalPrice,
    currency: p.pricing?.currency || "INR",
    featuredImage: coverImage,
    galleryImages: p.images?.map((img: any) => img.url) || [coverImage],
    description: p.detailedDescription || p.shortDescription || "",
    amenities: p.amenities || [],
    propertyType: (p.propertyType as any) || "Villas",
    tags: p.amenities?.slice(0, 3) || ["Verified Owner", "Luxury"],
    featured: p.featured ?? true,
    dealTag: p.pricing?.originalPrice ? "Special Offer" : undefined,
    availableRooms: p.capacity?.bedrooms || 1,
  };
}

export default function Home() {
  const router = useRouter();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [searchParams, setSearchParams] = useState<SearchState | null>(null);
  const [allHotels, setAllHotels] = useState<Hotel[]>(mockHotels);
  const [filteredHotels, setFilteredHotels] = useState<Hotel[]>(mockHotels);
  const [selectedCategoryFilter, setSelectedCategoryFilter] =
    useState<PropertyType | "All">("All");

  useEffect(() => {
    let isMounted = true;
    async function loadLiveProperties() {
      try {
        const res = await fetch(apiUrl("/api/public/properties"));
        if (!res.ok) return;

        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) return;

        const data = await res.json();
        if (!isMounted) return;

        if (data && data.success && Array.isArray(data.properties) && data.properties.length > 0) {
          const liveHotels = data.properties.map(convertPropertyToHotel);
          // Combine live approved properties first, followed by mock data (avoiding ID collisions)
          const liveIds = new Set(liveHotels.map((h: Hotel) => h.id));
          const combined = [...liveHotels, ...mockHotels.filter((m) => !liveIds.has(m.id))];
          setAllHotels(combined);
          setFilteredHotels(combined);
        }
      } catch (err) {
        console.warn("Using fallback curated properties for homepage:", err);
      }
    }
    loadLiveProperties();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSearch = (params: SearchState) => {
    const queryParams = new URLSearchParams();
    const dest = params.destination.trim();
    if (dest) {
      queryParams.set("destination", dest);
    }
    if (params.locationType) {
      queryParams.set("locationType", params.locationType);
    }
    if (params.locationId) {
      queryParams.set("locationId", params.locationId);
    }
    if (params.countryId) {
      queryParams.set("countryId", params.countryId);
    }
    if (params.stateId) {
      queryParams.set("stateId", params.stateId);
    }
    if (params.cityId) {
      queryParams.set("cityId", params.cityId);
    }
    if (params.areaId) {
      queryParams.set("areaId", params.areaId);
    }
    if (params.checkIn) {
      queryParams.set("checkIn", params.checkIn);
    }
    if (params.checkOut) {
      queryParams.set("checkOut", params.checkOut);
    }
    const totalGuests = (params.adults || 2) + (params.children || 0);
    if (totalGuests > 0) {
      queryParams.set("guests", String(totalGuests));
    }

    // Redirect to the properties page with query parameters
    router.push(`/properties?${queryParams.toString()}`);
  };

  const handleResetSearch = () => {
    setSearchParams(null);
    setFilteredHotels(allHotels);
    setSelectedCategoryFilter("All");
  };

  const handleSelectPropertyType = (category: PropertyType) => {
    router.push(`/properties?type=${encodeURIComponent(category)}`);
  };

  const handleExploreDeal = () => {
    // When a deal is explored, optionally reset search to show available stays
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6] text-[#172B2A]">
      {/* Section 1: Navigation Header */}
      <Header onOpenAuthModal={() => setAuthModalOpen(true)} />

      {/* Main Content Area */}
      <main id="home" className="flex-1">
        {/* Section 1: Hero Section & Search Bar */}
        <HeroSection onSearch={handleSearch} />

        {/* Section: What Makes Us Extraordinary */}
        <div id="about" className="scroll-mt-20">
          <WhatMakesUsExtraordinary />
        </div>

        {/* Section: What's Happening Around the World */}
        <div id="events" className="scroll-mt-20">
          <Suspense fallback={null}>
            <WhatsHappeningSection />
          </Suspense>
        </div>

        {/* Section 2: Handpicked Properties */}
        <div id="handpicked" className="scroll-mt-20">
          <HandpickedProperties
            hotels={filteredHotels}
            searchParams={searchParams}
            onResetSearch={handleResetSearch}
            selectedCategoryFilter={selectedCategoryFilter}
            onSelectCategoryFilter={setSelectedCategoryFilter}
          />
        </div>

        {/* Section 4: Popular Destinations to Visit */}
        <PopularDestinations />

        {/* Section 5: Memories */}
        <div id="memories" className="scroll-mt-20">
          <MemoriesSection />
        </div>

        {/* Section 7: Stories, Tips & Dispatches */}
        <div id="blog" className="scroll-mt-20">
          <BlogSection />
        </div>
      </main>

      {/* Section 9: Footer */}
      <Footer />

      {/* Auth / Sign In Preview Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </div>
  );
}
