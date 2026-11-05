"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Calendar,
  MapPin,
  Sparkles,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
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
import { upcomingEvents } from "@/data/events";
import { EventItem } from "@/types/event";
import { apiUrl } from "@/lib/apiUrl";
import { useAutoScrollCarousel } from "@/hooks/useAutoScrollCarousel";

const MONTH_DATA = [
  { index: 0, monthNum: 1, name: "January", short: "Jan" },
  { index: 1, monthNum: 2, name: "February", short: "Feb" },
  { index: 2, monthNum: 3, name: "March", short: "Mar" },
  { index: 3, monthNum: 4, name: "April", short: "Apr" },
  { index: 4, monthNum: 5, name: "May", short: "May" },
  { index: 5, monthNum: 6, name: "June", short: "Jun" },
  { index: 6, monthNum: 7, name: "July", short: "Jul" },
  { index: 7, monthNum: 8, name: "August", short: "Aug" },
  { index: 8, monthNum: 9, name: "September", short: "Sep" },
  { index: 9, monthNum: 10, name: "October", short: "Oct" },
  { index: 10, monthNum: 11, name: "November", short: "Nov" },
  { index: 11, monthNum: 12, name: "December", short: "Dec" },
];

export default function WhatsHappeningSection() {
  const [events, setEvents] = useState<EventItem[]>(upcomingEvents);
  const [selectedMonth, setSelectedMonth] = useState<number>(10);
  const [selectedYear, setSelectedYear] = useState<number>(2026);

  // Synchronize automatically with real calendar date on mount & real-time rollover
  useEffect(() => {
    const updateRealDate = () => {
      const now = new Date();
      setSelectedMonth(now.getMonth());
      setSelectedYear(now.getFullYear());
    };

    updateRealDate();
    const interval = setInterval(updateRealDate, 60000); // Check every minute for real calendar month rollover

    const handleVisibility = () => {
      if (!document.hidden) updateRealDate();
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  // Fetch live published events from backend API if available
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

        if (data.success && Array.isArray(data.events)) {
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
        console.warn("Using curated fallback events for calendar:", err);
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

  // Filter events for the currently active calendar month and year
  const monthEvents = useMemo(() => {
    const filtered = events.filter((evt) => {
      if (!evt.startDate) return false;
      const s = new Date(evt.startDate + "T00:00:00");
      const e = evt.endDate ? new Date(evt.endDate + "T00:00:00") : s;

      const startMonth = s.getMonth();
      const startYear = s.getFullYear();
      const endMonth = e.getMonth();
      const endYear = e.getFullYear();

      // Check if event falls in current calendar month & year (or spans into it)
      const matchesStart = startMonth === selectedMonth && startYear === selectedYear;
      const matchesEnd = endMonth === selectedMonth && endYear === selectedYear;
      const spansMonth =
        (startYear < selectedYear || (startYear === selectedYear && startMonth <= selectedMonth)) &&
        (endYear > selectedYear || (endYear === selectedYear && endMonth >= selectedMonth));

      return matchesStart || matchesEnd || spansMonth;
    });

    if (filtered.length > 0) return filtered;
    return events.slice(0, 8);
  }, [events, selectedMonth, selectedYear]);

  // Reuse existing auto-scrolling carousel hook
  const {
    sectionRef,
    scrollRef,
    canAutoScroll,
    handlePrev,
    handleNext,
    handleScroll,
    handleKeyDown,
    handleTouchStart,
    handleTouchEnd,
    handleTouchCancel,
  } = useAutoScrollCarousel({
    itemsCount: monthEvents.length,
    activeFilterKey: `${selectedYear}-${selectedMonth}`,
    speed: 0.58,
    pauseOnHover: true,
  });

  const itemsToRender = canAutoScroll
    ? [...monthEvents, ...monthEvents, ...monthEvents]
    : monthEvents;

  const currentSelectedMonthData = MONTH_DATA[selectedMonth] || MONTH_DATA[0];

  // Helper date formatter
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
    <section
      ref={sectionRef}
      id="events"
      aria-label="What's Happening Around the World"
      className="pt-6 sm:pt-7 lg:pt-8 pb-6 sm:pb-7 lg:pb-8 bg-[#FAF9F6] border-b border-[#E8EAE5]/60 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-5 sm:mb-6">
          <div className="space-y-2.5 sm:space-y-3 max-w-3xl text-left">
            <h2 className="font-editorial-serif text-3xl sm:text-4xl lg:text-[44px] font-bold text-[#0b192c] tracking-tight leading-[1.14]">
              What&apos;s Happening Around the World
            </h2>

            <div className="inline-flex items-center gap-2 text-[#006F66] text-xs font-bold uppercase tracking-[0.2em] font-editorial-sans">
              <span className="w-6 h-px bg-[#009F8D]" />
              <Sparkles className="w-3.5 h-3.5 text-[#D97706]" />
              <span>Cultural Calendars & Global Celebrations</span>
            </div>

            <p className="font-editorial-sans text-slate-600 sm:text-slate-700 text-sm sm:text-base leading-relaxed pt-0.5">
              Explore vibrant festivals, cultural celebrations, local events, and extraordinary experiences at destinations worth discovering. Make your next getaway even more memorable with experiences that bring every destination to life.
            </p>
          </div>

          {/* View All Events Link & Carousel Nav Arrows */}
          <div className="flex items-center justify-between sm:justify-end gap-3 flex-wrap">
            <Link
              href="/events"
              className="text-xs sm:text-[13px] font-bold uppercase tracking-wider text-[#006F66] hover:text-[#009F8D] inline-flex items-center gap-1.5 transition-colors py-2 px-3 rounded-xl bg-white border border-slate-200 shadow-xs"
            >
              <span>View All Events</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            {monthEvents.length > 0 && canAutoScroll && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handlePrev}
                  className="w-9 h-9 rounded-full border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-[#172B2A] hover:text-[#006F66] shadow-xs transition-all cursor-pointer"
                  aria-label="Previous event"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="w-9 h-9 rounded-full border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-[#172B2A] hover:text-[#006F66] shadow-xs transition-all cursor-pointer"
                  aria-label="Next event"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Selected Month Status Indicator */}
        <div className="flex items-center justify-between mb-4 pb-2.5 border-b border-slate-200/60 text-xs text-slate-500 font-medium font-editorial-sans">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#009F8D]" />
            <span>
              Showing celebrations for{" "}
              <strong className="text-[#0b192c] font-bold">
                {currentSelectedMonthData.name} {selectedYear}
              </strong>
            </span>
          </div>

          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            {monthEvents.length} {monthEvents.length === 1 ? "Experience" : "Experiences"} Available
          </span>
        </div>

        {/* 
          Horizontal Auto-Rotating Event Carousel
          - Exactly ONE horizontal row
          - Smooth continuous slide
          - Touch / swipe and keyboard accessible
        */}
        {monthEvents.length > 0 ? (
          <div
            className="group relative"
            onKeyDown={handleKeyDown}
            tabIndex={0}
            role="region"
            aria-roledescription="carousel"
            aria-label={`${currentSelectedMonthData.name} Events Carousel`}
          >
            <div
              ref={scrollRef}
              onScroll={handleScroll}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              onTouchCancel={handleTouchCancel}
              className="flex gap-5 sm:gap-6 overflow-x-auto scrollbar-none py-2 px-1 focus:outline-none"
              style={{
                scrollSnapType: "none",
                WebkitOverflowScrolling: "touch",
              }}
            >
              {itemsToRender.map((event, i) => {
                const destinationDisplay = [event.city, event.state, event.country || "India"]
                  .filter(Boolean)
                  .join(", ");

                return (
                  <div
                    key={`${event.id}-${i}`}
                    className="w-[290px] sm:w-[340px] lg:w-[360px] flex-shrink-0 flex flex-col bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 group/card"
                  >
                    {/* Event Cover Image with Hover Zoom */}
                    <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-slate-900">
                      <Image
                        src={event.image}
                        alt={event.title}
                        fill
                        sizes="(max-width: 640px) 290px, (max-width: 1024px) 340px, 360px"
                        className="object-cover group-hover/card:scale-105 transition-transform duration-500 ease-out"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent pointer-events-none" />

                      {/* Category Badge */}
                      <div className="absolute top-3 left-3">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/95 backdrop-blur-md text-[#006F66] shadow-xs">
                          {event.category}
                        </span>
                      </div>

                      {/* Ticket / Status Pill */}
                      {event.ticketStatus && (
                        <div className="absolute top-3 right-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-black/60 backdrop-blur-md text-amber-300 border border-white/20">
                            {event.ticketStatus}
                          </span>
                        </div>
                      )}

                      {/* Date on bottom of image */}
                      <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-xs text-white font-medium drop-shadow-sm">
                        <Calendar className="w-3.5 h-3.5 text-amber-300 flex-shrink-0" />
                        <span>{formatDateDisplay(event.startDate, event.endDate)}</span>
                      </div>
                    </div>

                    {/* Card Content Stack */}
                    <div className="p-5 flex-1 flex flex-col justify-between text-left">
                      <div>
                        {/* Destination & Country */}
                        <div className="flex items-center gap-1.5 text-xs text-[#006F66] font-semibold mb-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[#009F8D] flex-shrink-0" />
                          <span className="truncate">{destinationDisplay}</span>
                        </div>

                        {/* Title */}
                        <h3 className="font-editorial-serif text-lg sm:text-xl font-bold text-[#0b192c] mb-2 line-clamp-1 group-hover/card:text-[#009F8D] transition-colors">
                          {event.title}
                        </h3>

                        {/* Short Description */}
                        <p className="font-editorial-sans text-xs sm:text-[13px] text-slate-600 line-clamp-2 leading-relaxed mb-4">
                          {event.description}
                        </p>
                      </div>

                      {/* Clickable Explore Event CTA */}
                      <Link
                        href={`/events/${event.slug || event.id}`}
                        className="pt-3 border-t border-slate-100 mt-auto inline-flex items-center justify-between text-xs sm:text-[13px] font-semibold text-[#0b192c] group-hover/card:text-[#009F8D] transition-colors"
                      >
                        <span>Explore Event</span>
                        <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover/card:translate-x-1" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Polished Empty State for months without events */
          <div className="bg-white rounded-2xl border border-slate-200/90 p-8 sm:p-12 text-center max-w-xl mx-auto shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200/70 flex items-center justify-center mx-auto mb-3.5 text-[#D97706]">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="font-editorial-serif text-xl font-bold text-[#0b192c] mb-1.5">
              No events scheduled in {currentSelectedMonthData.name} {selectedYear}
            </h3>
            <p className="font-editorial-sans text-xs sm:text-sm text-slate-600 leading-relaxed mb-5 max-w-md mx-auto">
              We are constantly scouting new festivals and cultural celebrations. Explore another month or view the full annual calendar.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Link
                href="/events"
                className="px-4 py-2 rounded-xl bg-[#0b192c] hover:bg-[#009F8D] text-white text-xs font-semibold transition-colors shadow-xs"
              >
                View Full Events Calendar →
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
