"use client";

import React, { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AuthModal from "@/components/layout/AuthModal";
import { upcomingEvents } from "@/data/events";
import { EventItem } from "@/types/event";
import { apiUrl } from "@/lib/apiUrl";
import {
  Calendar,
  MapPin,
  Clock,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Building2,
  Share2,
  ShieldCheck,
} from "lucide-react";

interface NearbyHotel {
  id: string;
  name: string;
  shortDescription?: string;
  location?: {
    city?: string;
    state?: string;
  };
  images?: Array<{ url: string; isCover?: boolean }>;
}

function EventDetailContent() {
  const params = useParams();
  const router = useRouter();
  const rawSlug = (params?.slug as string) || "";
  const slug = decodeURIComponent(rawSlug).toLowerCase();

  const [event, setEvent] = useState<EventItem | null>(null);
  const [nearbyHotels, setNearbyHotels] = useState<NearbyHotel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadEvent() {
      setIsLoading(true);
      // 1. Try to find in mock/fallback array first
      const localMatch = upcomingEvents.find(
        (e) => e.slug?.toLowerCase() === slug || e.id?.toLowerCase() === slug
      );

      if (localMatch) {
        setEvent(localMatch);
      }

      // 2. Fetch live from backend API if available
      try {
        const res = await fetch(apiUrl(`/api/public/events/${slug}`));
        if (res.ok) {
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const data = await res.json();
            if (isMounted && data.success && data.event) {
              const live = data.event;
              setEvent({
                id: live.id,
                slug: live.slug,
                title: live.title,
                category: live.category || "Cultural",
                startDate: live.startDate,
                endDate: live.endDate || live.startDate,
                time: live.time || "09:00 AM - 08:00 PM Daily",
                location: live.location,
                city: live.city,
                state: live.state,
                country: live.country || "India",
                image: live.coverImage || live.image,
                description: live.description,
                longDescription: live.longDescription || live.description,
                price: live.price || "Free Entry",
                organizer: live.organizer || "Heritage Tourism Council",
                highlights: live.highlights || [
                  "Priority Event Access",
                  "Guided Cultural Walk",
                  "Local Food & Craft Fair",
                ],
                ticketStatus: "Available",
                featured: live.featured ?? true,
              });
            }
          }
        }
      } catch (err) {
        console.warn("Unable to fetch live event from API, using fallback:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadEvent();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  // Fetch nearby stays
  useEffect(() => {
    if (!event) return;
    const currentEvent = event;
    let isMounted = true;

    async function fetchNearbyProperties() {
      try {
        const res = await fetch(apiUrl("/api/public/properties"));
        if (!res.ok) return;

        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) return;

        const data = await res.json();
        if (!isMounted) return;

        if (data.success && Array.isArray(data.properties)) {
          const targetCity = currentEvent.city.toLowerCase();
          const targetState = currentEvent.state.toLowerCase();

          const matched = data.properties.filter((p: NearbyHotel) => {
            const cityMatch = p.location?.city?.toLowerCase() === targetCity;
            const stateMatch = p.location?.state?.toLowerCase() === targetState;
            return cityMatch || stateMatch;
          });

          setNearbyHotels(matched.slice(0, 3));
        }
      } catch (err) {
        console.warn("Failed to load nearby stays:", err);
      }
    }

    fetchNearbyProperties();

    return () => {
      isMounted = false;
    };
  }, [event]);

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard?.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const formatDateDisplay = (startStr: string, endStr?: string) => {
    const s = new Date(startStr + "T00:00:00");
    const sDate = s.toLocaleDateString("en-US", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    if (!endStr || endStr === startStr) return sDate;
    const e = new Date(endStr + "T00:00:00");
    const eDate = e.toLocaleDateString("en-US", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    return `${sDate} to ${eDate}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6]">
        <div className="w-8 h-8 rounded-full border-2 border-[#009F8D] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex flex-col bg-[#FAF9F6] text-[#172B2A]">
        <Header onOpenAuthModal={() => setAuthModalOpen(true)} />
        <main className="flex-1 flex items-center justify-center pt-32 pb-20 px-4">
          <div className="bg-white p-8 sm:p-12 rounded-3xl border border-slate-200 text-center max-w-lg shadow-sm">
            <h2 className="font-editorial-serif text-2xl font-bold text-[#0b192c] mb-2">
              Event Not Found
            </h2>
            <p className="font-editorial-sans text-sm text-slate-600 mb-6">
              The celebration you are looking for may have moved or been updated. Explore other gatherings around the world.
            </p>
            <Link
              href="/events"
              className="px-6 py-3 rounded-xl bg-[#0b192c] hover:bg-[#009F8D] text-white font-semibold text-xs transition-colors shadow-xs"
            >
              Browse All Events
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const destinationDisplay = [event.location, event.city, event.state, event.country || "India"]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6] text-[#172B2A]">
      <Header onOpenAuthModal={() => setAuthModalOpen(true)} />

      <main className="flex-1 pt-24 sm:pt-28 pb-16 sm:pb-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Navigation & Breadcrumb */}
          <div className="flex items-center justify-between py-4 mb-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-[#009F8D] transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Events</span>
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#009F8D] py-1.5 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{copiedLink ? "Link Copied!" : "Share Event"}</span>
            </button>
          </div>

          {/* Hero Media & Summary Card */}
          <div className="relative rounded-3xl overflow-hidden bg-slate-900 shadow-xl mb-10 h-[360px] sm:h-[460px] lg:h-[500px]">
            <Image
              src={event.image}
              alt={event.title}
              fill
              priority
              sizes="(max-width: 1200px) 100vw, 1200px"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/40 to-transparent" />

            {/* Badges Overlay */}
            <div className="absolute top-6 left-6 right-6 flex items-center justify-between">
              <span className="px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-white/95 text-[#006F66] shadow-md backdrop-blur-md">
                {event.category}
              </span>
              {event.ticketStatus && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-black/60 text-amber-300 border border-white/20 backdrop-blur-md">
                  {event.ticketStatus}
                </span>
              )}
            </div>

            {/* Title & Core Meta Overlay */}
            <div className="absolute bottom-6 sm:bottom-10 left-6 sm:left-10 right-6 sm:right-10 text-white">
              <div className="flex items-center gap-2 text-xs sm:text-sm text-teal-300 font-medium mb-2.5 font-editorial-sans">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span>{event.city}, {event.state} • {event.country || "India"}</span>
              </div>

              <h1 className="font-editorial-serif text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white mb-3 sm:mb-4 leading-tight max-w-4xl">
                {event.title}
              </h1>

              <div className="flex items-center gap-4 sm:gap-6 flex-wrap text-xs sm:text-sm text-slate-200">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>{formatDateDisplay(event.startDate, event.endDate)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>{event.time}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Event Content Grid: Main Details & Sidebar */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 mb-16">
            {/* Main Column */}
            <div className="lg:col-span-2 space-y-8">
              {/* Overview */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs">
                <h2 className="font-editorial-serif text-2xl font-bold text-[#0b192c] mb-4">
                  About The Celebration
                </h2>
                <p className="font-editorial-sans text-slate-700 text-sm sm:text-base leading-relaxed mb-4">
                  {event.longDescription || event.description}
                </p>
                <p className="font-editorial-sans text-slate-600 text-sm leading-relaxed">
                  {event.description}
                </p>
              </div>

              {/* Highlights & Experiences */}
              {event.highlights && event.highlights.length > 0 && (
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs">
                  <h3 className="font-editorial-serif text-xl sm:text-2xl font-bold text-[#0b192c] mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#D97706]" />
                    <span>Experience Highlights</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {event.highlights.map((h, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/70"
                      >
                        <CheckCircle2 className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
                        <span className="font-editorial-sans text-xs sm:text-sm font-medium text-slate-800">
                          {h}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Venue & Organizer Details */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs">
                <h3 className="font-editorial-serif text-xl sm:text-2xl font-bold text-[#0b192c] mb-4">
                  Location & Organizer
                </h3>
                <div className="space-y-3 font-editorial-sans text-sm text-slate-700">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-[#009F8D] mt-0.5 flex-shrink-0" />
                    <div>
                      <strong className="text-slate-900 block">Venue:</strong>
                      <span>{destinationDisplay}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 pt-2 border-t border-slate-100">
                    <ShieldCheck className="w-4 h-4 text-[#009F8D] mt-0.5 flex-shrink-0" />
                    <div>
                      <strong className="text-slate-900 block">Presented By:</strong>
                      <span>{event.organizer}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar CTA Card */}
            <div className="space-y-6">
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-md sticky top-28">
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#006F66] block mb-1">
                  Holiday Access Pass
                </span>

                <div className="text-3xl font-bold font-editorial-serif text-[#0b192c] mb-1">
                  {typeof event.price === "number"
                    ? `₹${event.price.toLocaleString("en-IN")}`
                    : event.price}
                </div>

                <p className="text-xs text-slate-500 mb-6 font-editorial-sans">
                  Includes curated festival access, designated viewing pavilion, and heritage walk.
                </p>

                <div className="space-y-3 mb-6 font-editorial-sans text-xs text-slate-600">
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                    <span>Dates:</span>
                    <strong className="text-slate-900">{formatDateDisplay(event.startDate, event.endDate)}</strong>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                    <span>Destination:</span>
                    <strong className="text-slate-900">{event.city}</strong>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                    <span>Category:</span>
                    <strong className="text-slate-900">{event.category}</strong>
                  </div>
                </div>

                {/* Primary CTA: Book Nearby Stays */}
                <Link
                  href={`/properties?destination=${encodeURIComponent(event.city)}`}
                  className="w-full py-3.5 px-4 rounded-xl bg-[#0b192c] hover:bg-[#009F8D] text-white text-xs sm:text-sm font-bold text-center block transition-colors shadow-md"
                >
                  Find Stays in {event.city}
                </Link>

                <p className="text-[11px] text-slate-400 text-center mt-3">
                  Direct rates • Verified luxury retreats & villas
                </p>
              </div>
            </div>
          </div>

          {/* Nearby Stays Section */}
          <div className="pt-10 border-t border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#006F66] block mb-1 font-editorial-sans">
                  Recommended Accommodations
                </span>
                <h3 className="font-editorial-serif text-2xl sm:text-3xl font-bold text-[#0b192c]">
                  Where to Stay Near {event.title}
                </h3>
              </div>

              <Link
                href={`/properties?destination=${encodeURIComponent(event.city)}`}
                className="text-xs sm:text-sm font-semibold text-[#006F66] hover:text-[#009F8D] inline-flex items-center gap-1 transition-colors"
              >
                <span>View all stays in {event.city}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {nearbyHotels.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {nearbyHotels.map((hotel) => {
                  const cover =
                    hotel.images?.find((img) => img.isCover)?.url ||
                    hotel.images?.[0]?.url ||
                    "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80";

                  return (
                    <div
                      key={hotel.id}
                      className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-lg transition-all group flex flex-col"
                    >
                      <div className="relative h-44 w-full bg-slate-900 overflow-hidden">
                        <Image
                          src={cover}
                          alt={hotel.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <div className="p-5 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="text-[11px] text-[#006F66] font-semibold mb-1">
                            {hotel.location?.city}, {hotel.location?.state}
                          </div>
                          <h4 className="font-editorial-serif text-lg font-bold text-[#0b192c] mb-1.5 group-hover:text-[#009F8D] transition-colors line-clamp-1">
                            {hotel.name}
                          </h4>
                          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-3">
                            {hotel.shortDescription}
                          </p>
                        </div>
                        <Link
                          href={`/properties/${hotel.id}`}
                          className="pt-2 border-t border-slate-100 mt-auto inline-flex items-center justify-between text-xs font-semibold text-[#006F66] hover:text-[#009F8D]"
                        >
                          <span>Explore Stay</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center max-w-lg mx-auto">
                <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-2.5" />
                <h4 className="font-editorial-serif text-base font-bold text-[#0b192c] mb-1">
                  Discover Stays in {event.city}
                </h4>
                <p className="text-xs text-slate-600 mb-4">
                  Browse our handpicked collection of villas, boutique lodges, and heritage palaces.
                </p>
                <Link
                  href={`/properties?destination=${encodeURIComponent(event.city)}`}
                  className="px-4 py-2 rounded-xl bg-[#0b192c] hover:bg-[#009F8D] text-white text-xs font-semibold inline-block transition-colors"
                >
                  Explore Stays in {event.city}
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </div>
  );
}

export default function EventDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6]">
          <div className="w-8 h-8 rounded-full border-2 border-[#009F8D] border-t-transparent animate-spin" />
        </div>
      }
    >
      <EventDetailContent />
    </Suspense>
  );
}
