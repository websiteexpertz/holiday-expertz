"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AuthModal from "@/components/layout/AuthModal";
import { upcomingEvents } from "@/data/events";
import { EventItem, EventCategory } from "@/types/event";
import { apiUrl } from "@/lib/apiUrl";
import {
  Calendar,
  MapPin,
  Sparkles,
  ArrowRight,
  Search,
  X,
  CalendarDays,
} from "lucide-react";

interface ApiEventItem {
  id: string;
  slug?: string;
  title: string;
  category?: string;
  startDate: string;
  endDate?: string;
  time?: string;
  location?: string;
  city?: string;
  state?: string;
  country?: string;
  coverImage?: string;
  image?: string;
  description: string;
  longDescription?: string;
  price?: number | string;
  organizer?: string;
  highlights?: string[];
  featured?: boolean;
}

const MONTH_NAMES = [
  "All Months",
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const CATEGORIES: EventCategory[] = [
  "All",
  "Festival",
  "Music",
  "Cultural",
  "Adventure",
  "Food",
  "Wellness",
];

function EventsListingContent() {
  const searchParams = useSearchParams();
  const queryMonthParam = searchParams.get("month");
  const queryYearParam = searchParams.get("year");

  const queryMonth = queryMonthParam ? parseInt(queryMonthParam, 10) : 0;
  const queryYear = queryYearParam ? parseInt(queryYearParam, 10) : new Date().getFullYear();

  const [userMonth, setUserMonth] = useState<number | null>(null);
  const [userYear, setUserYear] = useState<number | null>(null);

  const selectedMonth = userMonth !== null ? userMonth : (queryMonth >= 1 && queryMonth <= 12 ? queryMonth : 0);
  const selectedYear = userYear !== null ? userYear : (queryYear > 2000 ? queryYear : new Date().getFullYear());

  const setSelectedMonth = (m: number) => setUserMonth(m);
  const setSelectedYear = (y: number) => setUserYear(y);

  const [selectedCategory, setSelectedCategory] = useState<EventCategory>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [events, setEvents] = useState<EventItem[]>(upcomingEvents);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Fetch live published events
  useEffect(() => {
    let isMounted = true;
    async function fetchLiveEvents() {
      try {
        const res = await fetch(apiUrl("/api/public/events"));
        if (!res.ok) return;

        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) return;

        const data = await res.json();
        if (!isMounted) return;

        if (data.success && Array.isArray(data.events) && data.events.length > 0) {
          const transformed: EventItem[] = data.events.map((e: ApiEventItem) => ({
            id: e.id,
            slug: e.slug,
            title: e.title,
            category: e.category || "Cultural",
            startDate: e.startDate,
            endDate: e.endDate || e.startDate,
            time: e.time || "09:00 AM - 08:00 PM",
            location: e.location || "City Centre",
            city: e.city || "Destination",
            state: e.state || "",
            country: e.country || "India",
            image: e.coverImage || e.image || "https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?auto=format&fit=crop&w=1200&q=80",
            description: e.description,
            longDescription: e.longDescription || e.description,
            price: e.price || "Free Entry",
            organizer: e.organizer || "Heritage Tourism Council",
            highlights: e.highlights || ["Cultural Performances", "Guided Heritage Access"],
            ticketStatus: "Available",
            featured: e.featured ?? true,
          }));
          setEvents(transformed);
        }
      } catch (err) {
        console.warn("Using curated fallback events for directory:", err);
      }
    }

    fetchLiveEvents();

    const handleFocus = () => {
      if (!document.hidden) {
        fetchLiveEvents();
      }
    };
    document.addEventListener("visibilitychange", handleFocus);

    return () => {
      isMounted = false;
      document.removeEventListener("visibilitychange", handleFocus);
    };
  }, []);

  // Filter events
  const filteredEvents = useMemo(() => {
    return events.filter((evt) => {
      // Month filter (1-based: 1 = Jan, 12 = Dec, 0 = All)
      if (selectedMonth > 0) {
        const s = new Date(evt.startDate + "T00:00:00");
        const e = evt.endDate ? new Date(evt.endDate + "T00:00:00") : s;
        const startM = s.getMonth() + 1;
        const endM = e.getMonth() + 1;
        const inMonth = startM === selectedMonth || endM === selectedMonth;
        if (!inMonth) return false;
      }

      // Category filter
      if (selectedCategory !== "All" && evt.category !== selectedCategory) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = evt.title.toLowerCase().includes(q);
        const matchesCity = evt.city.toLowerCase().includes(q);
        const matchesDesc = evt.description.toLowerCase().includes(q);
        if (!matchesTitle && !matchesCity && !matchesDesc) return false;
      }

      return true;
    });
  }, [events, selectedMonth, selectedCategory, searchQuery]);

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

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6] text-[#172B2A]">
      <Header onOpenAuthModal={() => setAuthModalOpen(true)} />

      <main className="flex-1">
        {/* Hero Banner */}
        <section className="relative pt-32 sm:pt-40 pb-14 sm:pb-16 bg-[#071f1d] text-white overflow-hidden">
          <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
            <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#009F8D] blur-3xl" />
            <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-[#E58A18] blur-3xl" />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-amber-300 text-xs font-bold uppercase tracking-[0.2em] mb-4">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Cultural Calendars & Global Celebrations</span>
            </div>

            <h1 className="font-editorial-serif text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-4 leading-[1.12]">
              What&apos;s Happening Around the World
            </h1>

            <p className="font-editorial-sans text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed mb-8">
              Discover verified festivals, seasonal gatherings, music conclaves, and spiritual retreats across destinations worth exploring.
            </p>

            {/* Search Input */}
            <div className="max-w-md mx-auto relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search events by name, destination, or keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/10 hover:bg-white/15 focus:bg-white text-white focus:text-[#172B2A] placeholder:text-slate-400 text-sm pl-11 pr-4 py-3 rounded-full border border-white/20 focus:outline-none focus:ring-2 focus:ring-[#009F8D] transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Filters & Grid Section */}
        <section className="py-10 sm:py-14 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Month Pills Row */}
          <div className="mb-6">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 font-editorial-sans">
              Filter by Calendar Month:
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none flex-nowrap">
              {MONTH_NAMES.map((name, idx) => {
                const isSelected = selectedMonth === idx;
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setSelectedMonth(idx)}
                    className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-[13px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#0b192c] text-white shadow-md"
                        : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                    }`}
                  >
                    {name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="mb-8 flex items-center justify-between gap-4 flex-wrap pb-4 border-b border-slate-200/80">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none flex-nowrap py-1">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? "bg-[#009F8D] text-white shadow-xs"
                      : "bg-white/80 text-slate-600 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="text-xs text-slate-500 font-medium">
              Showing <strong className="text-[#0b192c]">{filteredEvents.length}</strong> events
            </div>
          </div>

          {/* Events Grid */}
          {filteredEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {filteredEvents.map((event) => {
                const destinationDisplay = [event.city, event.state, event.country || "India"]
                  .filter(Boolean)
                  .join(", ");

                return (
                  <div
                    key={event.id}
                    className="group bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col"
                  >
                    <div className="relative h-56 w-full overflow-hidden bg-slate-900">
                      <Image
                        src={event.image}
                        alt={event.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                      <div className="absolute top-3.5 left-3.5">
                        <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/95 backdrop-blur-md text-[#006F66] shadow-xs">
                          {event.category}
                        </span>
                      </div>

                      {event.ticketStatus && (
                        <div className="absolute top-3.5 right-3.5">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-black/60 backdrop-blur-md text-amber-300 border border-white/20">
                            {event.ticketStatus}
                          </span>
                        </div>
                      )}

                      <div className="absolute bottom-3 left-3.5 flex items-center gap-1.5 text-xs text-white font-medium drop-shadow-sm">
                        <Calendar className="w-3.5 h-3.5 text-amber-300 flex-shrink-0" />
                        <span>{formatDateDisplay(event.startDate, event.endDate)}</span>
                      </div>
                    </div>

                    <div className="p-6 flex-1 flex flex-col justify-between text-left">
                      <div>
                        <div className="flex items-center gap-1.5 text-xs text-[#006F66] font-semibold mb-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[#009F8D] flex-shrink-0" />
                          <span className="truncate">{destinationDisplay}</span>
                        </div>

                        <h3 className="font-editorial-serif text-xl sm:text-2xl font-bold text-[#0b192c] mb-2.5 group-hover:text-[#009F8D] transition-colors line-clamp-1">
                          {event.title}
                        </h3>

                        <p className="font-editorial-sans text-sm text-slate-600 leading-relaxed mb-4 line-clamp-2">
                          {event.description}
                        </p>
                      </div>

                      <Link
                        href={`/events/${event.slug || event.id}`}
                        className="pt-3 border-t border-slate-100 mt-auto inline-flex items-center justify-between text-xs sm:text-sm font-semibold text-[#006F66] hover:text-[#009F8D] transition-colors"
                      >
                        <span>Explore Event Details</span>
                        <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center max-w-md mx-auto">
              <CalendarDays className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-editorial-serif text-lg font-bold text-[#0b192c] mb-1">
                No events found
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mb-4">
                No events match your current month or category filter. Try clearing filters to explore other celebrations.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedMonth(0);
                  setSelectedCategory("All");
                  setSearchQuery("");
                }}
                className="px-4 py-2 rounded-xl bg-[#0b192c] hover:bg-[#009F8D] text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          )}
        </section>
      </main>

      <Footer />
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </div>
  );
}

export default function EventsListingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6]">
          <div className="w-8 h-8 rounded-full border-2 border-[#009F8D] border-t-transparent animate-spin" />
        </div>
      }
    >
      <EventsListingContent />
    </Suspense>
  );
}
