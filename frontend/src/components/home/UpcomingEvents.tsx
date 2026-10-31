"use client";

import React, { useState, useMemo } from "react";
import {
  Calendar,
  Sparkles,
  Filter,
  SearchX,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from "lucide-react";
import EventCard from "@/components/events/EventCard";
import EventModal from "@/components/events/EventModal";
import { upcomingEvents } from "@/data/events";
import { EventItem, EventCategory } from "@/types/event";
import { useAutoScrollCarousel } from "@/hooks/useAutoScrollCarousel";

export default function UpcomingEvents() {
  const [selectedCategory, setSelectedCategory] = useState<EventCategory>("All");
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);

  // Filter future events relative to current date (October 20, 2026)
  // and sort by nearest upcoming date first
  const sortedFutureEvents = useMemo(() => {
    const today = "2026-10-20";
    return [...upcomingEvents]
      .filter((evt) => (evt.endDate ? evt.endDate >= today : evt.startDate >= today))
      .sort((a, b) => a.startDate.localeCompare(b.startDate));
  }, []);

  // Filter by category
  const filteredEvents = useMemo(() => {
    if (selectedCategory === "All") return sortedFutureEvents;
    return sortedFutureEvents.filter((evt) => evt.category === selectedCategory);
  }, [sortedFutureEvents, selectedCategory]);

  const categories: EventCategory[] = [
    "All",
    "Festival",
    "Music",
    "Cultural",
    "Adventure",
    "Food",
    "Wellness",
  ];

  // Shared continuous auto-scrolling carousel hook
  const {
    sectionRef,
    scrollRef,
    activeIndex,
    isAutoScrolling,
    canAutoScroll,
    handlePrev,
    handleNext,
    handleGoTo,
    handleScroll,
    handleKeyDown,
    handleTouchStart,
    handleTouchEnd,
    handleTouchCancel,
  } = useAutoScrollCarousel({
    itemsCount: filteredEvents.length,
    activeFilterKey: selectedCategory,
    pauseOnHover: false,
    isModalOpen: selectedEvent !== null,
  });

  // To enable seamless infinite looping without hardcoding data,
  // we render 3 cloned sets of filteredEvents when auto-scrolling is enabled.
  const itemsToRender = canAutoScroll
    ? [...filteredEvents, ...filteredEvents, ...filteredEvents]
    : filteredEvents;

  return (
    <section
      ref={sectionRef}
      id="events"
      aria-label="Upcoming Events and Gatherings"
      className="pt-8 sm:pt-10 lg:pt-12 pb-6 sm:pb-8 lg:pb-10 bg-white border-b border-[#E8EAE5]/60 scroll-mt-20 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 sm:mb-14">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 text-[#006F66] text-xs font-bold uppercase tracking-[0.18em] font-editorial-sans">
              <span className="w-6 h-px bg-[#009F8D]" />
              <span>Cultural Calendars</span>
            </div>
            <h2 className="font-editorial-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#172B2A] tracking-tight leading-[1.12]">
              Upcoming gatherings & festivals. <br />
              <span className="italic font-light text-[#006F66]">Immersive cultural calendars across India.</span>
            </h2>
          </div>

          {/* Controls: Auto-scroll Play / Pause Toggle, View Mode & Arrow Buttons */}
          <div className="flex items-center justify-between sm:justify-end gap-2.5 sm:gap-3 flex-wrap">
            {/* Quick Counter Badge */}
            <div className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#FAF9F6] border border-[#E8EAE5] text-xs text-[#697875] font-editorial-sans">
              <Sparkles className="w-4 h-4 text-[#009F8D]" />
              <span>
                <strong className="text-[#172B2A] font-bold">{sortedFutureEvents.length}</strong> celebrations scheduled
              </span>
            </div>

            {/* Header Navigation Arrows */}
            {canAutoScroll && (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={handlePrev}
                  className="w-10 h-10 rounded-full border border-[#E8EAE5] bg-white hover:bg-[#E7F6F3] flex items-center justify-center text-[#172B2A] hover:text-[#006F66] shadow-sm transition-all duration-200 active:scale-95"
                  aria-label="Previous events"
                  title="Previous events"
                >
                  <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="w-10 h-10 rounded-full border border-[#E8EAE5] bg-white hover:bg-[#E7F6F3] flex items-center justify-center text-[#172B2A] hover:text-[#006F66] shadow-sm transition-all duration-200 active:scale-95"
                  aria-label="Next events"
                  title="Next events"
                >
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Category Filter Pills (Edge-to-edge scroll on mobile) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 sm:mb-8 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0 font-editorial-sans">
          <div className="flex items-center gap-1 text-xs font-bold text-[#697875] pr-2 flex-shrink-0">
            <Filter className="w-3.5 h-3.5 text-[#009F8D]" />
            <span>Filter:</span>
          </div>

          {categories.map((cat) => {
            const count =
              cat === "All"
                ? sortedFutureEvents.length
                : sortedFutureEvents.filter((e) => e.category === cat).length;

            return (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat);
                }}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap flex-shrink-0 flex items-center gap-1.5 cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-[#006F66] text-white shadow-sm border border-[#006F66]"
                    : "bg-[#FAF9F6] text-[#172B2A] hover:bg-[#E7F6F3] border border-[#E8EAE5] hover:border-[#009F8D]/40"
                }`}
              >
                <span>{cat === "All" ? "All Events" : cat}</span>
                <span className="text-[10px] opacity-75 font-mono">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Events Content: Continuous Auto-Scrolling Carousel */}
        {filteredEvents.length > 0 ? (
          /* Carousel View with Mobile Peek */
          <div
            className="group relative"
            onKeyDown={handleKeyDown}
            tabIndex={0}
            role="region"
            aria-roledescription="carousel"
            aria-label="Upcoming events auto-scrolling carousel"
            aria-live={isAutoScrolling ? "off" : "polite"}
          >
            {/* Floating Left Navigation Arrow: visible on tablet/desktop hover */}
            {canAutoScroll && (
              <button
                type="button"
                onClick={handlePrev}
                className="hidden sm:flex absolute -left-4 sm:-left-5 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-white/95 text-slate-900 shadow-xl border border-slate-200/90 items-center justify-center transition-all duration-300 hover:bg-slate-900 hover:text-white hover:scale-110 active:scale-95 opacity-0 group-hover:opacity-100"
                aria-label="Previous events"
                title="Slide left"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            {/* Floating Right Navigation Arrow: visible on tablet/desktop hover */}
            {canAutoScroll && (
              <button
                type="button"
                onClick={handleNext}
                className="hidden sm:flex absolute -right-4 sm:-right-5 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-white/95 text-slate-900 shadow-xl border border-slate-200/90 items-center justify-center transition-all duration-300 hover:bg-slate-900 hover:text-white hover:scale-110 active:scale-95 opacity-0 group-hover:opacity-100"
                aria-label="Next events"
                title="Slide right"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}

            {/* Continuous Smooth Scroll Viewport with mobile edge bleed & card peek */}
            <div
              ref={scrollRef}
              onScroll={handleScroll}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              onTouchCancel={handleTouchCancel}
              className="flex gap-4 sm:gap-6 overflow-x-auto scrollbar-none py-2 -mx-4 px-4 sm:mx-0 sm:px-0.5 touch-pan-y select-none"
              style={{
                scrollBehavior: "auto",
                WebkitOverflowScrolling: "touch",
              }}
            >
              {itemsToRender.map((evt, index) => {
                const copyIndex = Math.floor(index / filteredEvents.length);
                const uniqueKey = `${evt.id}-copy-${copyIndex}-${index}`;

                return (
                  <div
                    key={uniqueKey}
                    data-carousel-card
                    className="flex-shrink-0 relative transition-transform duration-300 w-[82vw] max-w-[340px] sm:max-w-none sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]"
                  >
                    <EventCard
                      event={evt}
                      onViewDetails={(item) => setSelectedEvent(item)}
                    />
                  </div>
                );
              })}
            </div>

            {/* Bottom Controls: Pagination Dots, Counter & Live Scroll Status */}
            {canAutoScroll && (
              <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
                {/* Pagination Dots */}
                <div className="flex items-center gap-1.5 max-w-full overflow-x-auto py-1 scrollbar-none">
                  {filteredEvents.map((evt, i) => (
                    <button
                      key={`dot-${evt.id}-${i}`}
                      type="button"
                      onClick={() => handleGoTo(i)}
                      className={`h-2 sm:h-2.5 rounded-full transition-all duration-300 ${
                        activeIndex === i
                          ? "w-6 sm:w-8 bg-amber-500 shadow-sm shadow-amber-500/30"
                          : "w-2 sm:w-2.5 bg-slate-300 hover:bg-slate-400"
                      }`}
                      aria-label={`Go to slide ${i + 1}: ${evt.title}`}
                      aria-current={activeIndex === i ? "true" : undefined}
                    />
                  ))}
                </div>

                {/* Counter & Status Badge */}
                <div className="flex items-center justify-between w-full sm:w-auto text-xs font-semibold text-slate-500 gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="text-slate-600 font-medium text-[11px] sm:text-xs">
                      Live Experiences
                    </span>
                  </div>
                  <span className="text-slate-300">•</span>
                  <span className="text-[11px] sm:text-xs">
                    Viewing{" "}
                    <span className="text-slate-900 font-bold">
                      {activeIndex + 1}
                    </span>{" "}
                    of{" "}
                    <span className="text-slate-900 font-bold">
                      {filteredEvents.length}
                    </span>{" "}
                    events
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Empty State */
          <div className="bg-slate-50 rounded-3xl p-8 sm:p-12 text-center border border-slate-200 shadow-sm max-w-xl mx-auto my-6 space-y-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-3xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
              <SearchX className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                No events in this category yet
              </h3>
              <p className="text-xs sm:text-sm text-slate-500">
                We don&apos;t have any scheduled events for &ldquo;{selectedCategory}&rdquo; right now. Explore other categories or check back soon!
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedCategory("All")}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-bold rounded-xl transition-colors shadow-md shadow-teal-600/20"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Show All Events</span>
            </button>
          </div>
        )}
      </div>

      {/* Event Details Modal */}
      <EventModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />
    </section>
  );
}
