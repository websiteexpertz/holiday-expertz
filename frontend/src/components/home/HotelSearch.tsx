"use client";
import { apiUrl } from "@/lib/apiUrl";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  MapPin,
  Calendar,
  Users,
  Search,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Plus,
  Minus,
  X,
  Globe,
  Map,
  Navigation,
  Loader2,
  ArrowLeft,
  RotateCcw,
} from "lucide-react";
import { SearchState, AutocompleteSuggestion } from "@/types/hotel";
import CustomDatePicker from "./CustomDatePicker";

interface HotelSearchProps {
  onSearch: (searchParams: SearchState) => void;
  initialDestination?: string;
  initialCheckIn?: string;
  initialCheckOut?: string;
  initialAdults?: number;
  initialChildren?: number;
  initialRooms?: number;
  buttonText?: string;
  variant?: "default" | "header-bar";
  onDropdownChange?: (isOpen: boolean) => void;
}

export default function HotelSearch({
  onSearch,
  initialDestination = "",
  initialCheckIn,
  initialCheckOut,
  initialAdults = 2,
  initialChildren = 0,
  initialRooms = 1,
  buttonText = "Search Hotels",
  variant = "default",
  onDropdownChange,
}: HotelSearchProps) {
  // Default dates
  const defaultCheckIn = initialCheckIn || "2026-10-26";
  const defaultCheckOut = initialCheckOut || "2026-10-29";

  // Destination Search States
  const [destination, setDestination] = useState(initialDestination);
  const [selectedSuggestion, setSelectedSuggestion] = useState<AutocompleteSuggestion | null>(null);

  // Suggestions & UI States
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(initialDestination);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Dates & Guests States
  const [checkIn, setCheckIn] = useState(defaultCheckIn);
  const [checkOut, setCheckOut] = useState(defaultCheckOut);
  const [adults, setAdults] = useState(initialAdults);
  const [children, setChildren] = useState(initialChildren);
  const [rooms, setRooms] = useState(initialRooms);

  useEffect(() => {
    if (initialDestination !== undefined) {
      setDestination(initialDestination);
      setSearchInput(initialDestination);
    }
  }, [initialDestination]);

  useEffect(() => {
    if (initialCheckIn) setCheckIn(initialCheckIn);
  }, [initialCheckIn]);

  useEffect(() => {
    if (initialCheckOut) setCheckOut(initialCheckOut);
  }, [initialCheckOut]);

  const [guestPickerOpen, setGuestPickerOpen] = useState(false);
  const [customCalendarOpen, setCustomCalendarOpen] = useState(false);
  const [activeDateField, setActiveDateField] = useState<"checkIn" | "checkOut">("checkIn");
  const [dateError, setDateError] = useState<string | null>(null);

  // Notify parent component when any search dropdown opens or closes
  useEffect(() => {
    const isAnyOpen = Boolean(
      (suggestionsOpen && searchInput.trim().length > 0) ||
      guestPickerOpen ||
      customCalendarOpen
    );
    onDropdownChange?.(isAnyOpen);
  }, [suggestionsOpen, searchInput, guestPickerOpen, customCalendarOpen, onDropdownChange]);

  const guestPickerRef = useRef<HTMLDivElement>(null);
  const destinationRef = useRef<HTMLDivElement>(null);
  const datePickerContainerRef = useRef<HTMLDivElement>(null);
  const checkInCardRef = useRef<HTMLDivElement>(null);
  const checkOutCardRef = useRef<HTMLDivElement>(null);

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return { dayMonth: "--", year: "" };
    const parts = dateStr.split("-");
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    const weekday = d.toLocaleDateString("en-US", { weekday: "short" });
    const day = d.getDate();
    const month = d.toLocaleDateString("en-US", { month: "short" });
    return {
      dayMonth: `${weekday}, ${day} ${month}`,
      year: d.getFullYear().toString(),
    };
  };

  const calculateNights = (start: string, end: string) => {
    if (!start || !end || end <= start) return 1;
    const sParts = start.split("-");
    const eParts = end.split("-");
    const s = new Date(Number(sParts[0]), Number(sParts[1]) - 1, Number(sParts[2]));
    const e = new Date(Number(eParts[0]), Number(eParts[1]) - 1, Number(eParts[2]));
    return Math.max(1, Math.ceil(Math.abs(e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)));
  };

  // ── Unified Location Fetching Logic ──
  const fetchSuggestions = useCallback(async () => {
    if (!suggestionsOpen || !searchInput.trim()) {
      setSuggestions([]);
      setIsLoadingSuggestions(false);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoadingSuggestions(true);

    try {
      const qParams = new URLSearchParams();
      qParams.set("q", searchInput.trim());
      qParams.set("limit", "15");

      const res = await fetch(apiUrl(`/api/public/locations/autocomplete?${qParams.toString()}`), {
        signal: controller.signal,
      });
      if (!res.ok) return;

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) return;

      const data = await res.json();
      if (data.success && Array.isArray(data.suggestions)) {
        setSuggestions(data.suggestions);
        setActiveSuggestionIndex(-1);
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== "AbortError") {
        console.error("Location search fetch error:", err);
      }
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, [suggestionsOpen, searchInput]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSuggestions();
    }, 150);

    return () => clearTimeout(timer);
  }, [fetchSuggestions]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (guestPickerRef.current && !guestPickerRef.current.contains(e.target as Node)) {
        setGuestPickerOpen(false);
      }
      if (destinationRef.current && !destinationRef.current.contains(e.target as Node)) {
        setSuggestionsOpen(false);
      }
      if (
        datePickerContainerRef.current &&
        !datePickerContainerRef.current.contains(e.target as Node) &&
        checkInCardRef.current &&
        !checkInCardRef.current.contains(e.target as Node) &&
        checkOutCardRef.current &&
        !checkOutCardRef.current.contains(e.target as Node)
      ) {
        setCustomCalendarOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── Destination Selection Handlers ──
  const handleSelectSuggestion = (item: AutocompleteSuggestion) => {
    setDestination(item.fullPath);
    setSearchInput(item.fullPath);
    setSelectedSuggestion(item);
    setSuggestionsOpen(false);
    setActiveSuggestionIndex(-1);
  };

  const handleRestartSearch = () => {
    setSearchInput("");
    setDestination("");
    setSelectedSuggestion(null);
    setSuggestionsOpen(false);
    setActiveSuggestionIndex(-1);
  };

  // Keyboard navigation inside suggestions list
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const isDropdownVisible = suggestionsOpen && searchInput.trim().length > 0;
    if (!isDropdownVisible) {
      if ((e.key === "ArrowDown" || e.key === "ArrowUp") && searchInput.trim().length > 0) {
        setSuggestionsOpen(true);
        e.preventDefault();
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveSuggestionIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveSuggestionIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeSuggestionIndex >= 0 && suggestions[activeSuggestionIndex]) {
        handleSelectSuggestion(suggestions[activeSuggestionIndex]);
      }
    } else if (e.key === "Escape") {
      setSuggestionsOpen(false);
      setActiveSuggestionIndex(-1);
    }
  };

  // Form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (checkOut <= checkIn) {
      setDateError("Please select a check-out date later than check-in.");
      return;
    }

    setDateError(null);
    const finalDest = (destination || searchInput).trim();
    onSearch({
      destination: finalDest,
      checkIn,
      checkOut,
      adults,
      children,
      rooms,
      locationId: selectedSuggestion?.id,
      locationType: selectedSuggestion?.type,
      countryId: selectedSuggestion?.countryId,
      stateId: selectedSuggestion?.stateId,
      cityId: selectedSuggestion?.cityId,
      areaId: selectedSuggestion?.areaId,
      fullLocationPath: selectedSuggestion?.fullPath || finalDest,
    });
  };

  const getLocationIcon = (type: string) => {
    switch (type) {
      case "country":
        return <Globe className="w-4 h-4 text-emerald-600 flex-shrink-0" />;
      case "state":
        return <Map className="w-4 h-4 text-teal-600 flex-shrink-0" />;
      case "city":
        return <MapPin className="w-4 h-4 text-cyan-600 flex-shrink-0" />;
      case "area":
        return <Navigation className="w-4 h-4 text-indigo-600 flex-shrink-0" />;
      default:
        return <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />;
    }
  };

  const getLocationBadge = (type: string) => {
    switch (type) {
      case "country":
        return (
          <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
            Country
          </span>
        );
      case "state":
        return (
          <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">
            State
          </span>
        );
      case "city":
        return (
          <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-cyan-50 text-cyan-700 border border-cyan-200">
            City
          </span>
        );
      case "area":
        return (
          <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
            Locality
          </span>
        );
      default:
        return null;
    }
  };

  const isHeaderBar = variant === "header-bar";

  const renderCheckInCard = () => (
    <div
      ref={checkInCardRef}
      onClick={() => {
        if (customCalendarOpen && activeDateField === "checkIn") {
          setCustomCalendarOpen(false);
        } else {
          setActiveDateField("checkIn");
          setCustomCalendarOpen(true);
        }
        setGuestPickerOpen(false);
        setSuggestionsOpen(false);
      }}
      className={`relative flex-1 lg:flex-[1] rounded-xl sm:rounded-2xl border p-2 sm:px-3.5 py-2 transition-all cursor-pointer group ${
        customCalendarOpen && activeDateField === "checkIn"
          ? "border-[#009F8D] bg-[#E7F6F3]/50 ring-2 ring-[#009F8D]/20"
          : "border-slate-200/80 bg-white hover:bg-slate-50/60"
      }`}
    >
      <label className="block text-[9.5px] font-bold uppercase tracking-[0.14em] text-slate-400 mb-0.5 pointer-events-none">
        Check-in
      </label>
      <div className="flex items-center gap-2 pointer-events-none">
        <Calendar className="w-4 h-4 text-[#009F8D] flex-shrink-0" />
        <div className="min-w-0">
          <div className="text-xs sm:text-[13px] font-semibold text-[#172B2A] truncate">
            {formatDisplayDate(checkIn).dayMonth} {formatDisplayDate(checkIn).year}
          </div>
        </div>
      </div>

      {customCalendarOpen && activeDateField === "checkIn" && (
        <div ref={datePickerContainerRef}>
          <CustomDatePicker
            checkIn={checkIn}
            checkOut={checkOut}
            activeField="checkIn"
            onChange={(inDate, outDate) => {
              setCheckIn(inDate);
              setCheckOut(outDate);
              setDateError(null);
            }}
            onClose={() => setCustomCalendarOpen(false)}
          />
        </div>
      )}
    </div>
  );

  const renderCheckOutCard = () => (
    <div
      ref={checkOutCardRef}
      onClick={() => {
        if (customCalendarOpen && activeDateField === "checkOut") {
          setCustomCalendarOpen(false);
        } else {
          setActiveDateField("checkOut");
          setCustomCalendarOpen(true);
        }
        setGuestPickerOpen(false);
        setSuggestionsOpen(false);
      }}
      className={`relative flex-1 lg:flex-[1] rounded-xl sm:rounded-2xl border p-2 sm:px-3.5 py-2 transition-all cursor-pointer group ${
        customCalendarOpen && activeDateField === "checkOut"
          ? "border-[#009F8D] bg-[#E7F6F3]/50 ring-2 ring-[#009F8D]/20"
          : "border-slate-200/80 bg-white hover:bg-slate-50/60"
      }`}
    >
      <div className="flex items-center justify-between mb-0.5 pointer-events-none">
        <label className="block text-[9.5px] font-bold uppercase tracking-[0.14em] text-slate-400">
          Check-out
        </label>
      </div>
      <div className="flex items-center gap-2 pointer-events-none">
        <Calendar className="w-4 h-4 text-[#009F8D] flex-shrink-0" />
        <div className="min-w-0">
          <div className="text-xs sm:text-[13px] font-semibold text-[#172B2A] truncate">
            {formatDisplayDate(checkOut).dayMonth} {formatDisplayDate(checkOut).year}
          </div>
        </div>
      </div>

      {customCalendarOpen && activeDateField === "checkOut" && (
        <div ref={datePickerContainerRef}>
          <CustomDatePicker
            checkIn={checkIn}
            checkOut={checkOut}
            activeField="checkOut"
            onChange={(inDate, outDate) => {
              setCheckIn(inDate);
              setCheckOut(outDate);
              setDateError(null);
            }}
            onClose={() => setCustomCalendarOpen(false)}
          />
        </div>
      )}
    </div>
  );

  return (
    <div className="w-full">
      <form
        onSubmit={handleSubmit}
        className="relative z-30 bg-white p-2.5 sm:p-3 rounded-2xl sm:rounded-[22px] shadow-[0_16px_40px_rgba(23,43,42,0.12)] border border-slate-100 text-[#172B2A] transition-all"
      >
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2 sm:gap-2.5">
          {/* Destination Search Box */}
          <div
            ref={destinationRef}
            className="relative flex-1 lg:flex-[1.3] bg-white hover:bg-slate-50/60 rounded-xl sm:rounded-2xl border border-slate-200/80 p-2 sm:px-3.5 py-2 transition-all focus-within:border-[#009F8D] focus-within:ring-2 focus-within:ring-[#009F8D]/20"
          >
            <div className="flex items-center justify-between mb-0.5">
              <label className="block text-[9.5px] font-bold uppercase tracking-[0.14em] text-slate-400">
                Destination
              </label>
            </div>

            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#009F8D] flex-shrink-0" />
              <input
                id="hero-destination-input"
                type="text"
                value={searchInput}
                onChange={(e) => {
                  const val = e.target.value;
                  setSearchInput(val);
                  setDestination(val);
                  if (selectedSuggestion && val !== selectedSuggestion.fullPath) {
                    setSelectedSuggestion(null);
                  }
                  if (val.trim().length > 0) {
                    setSuggestionsOpen(true);
                  } else {
                    setSuggestionsOpen(false);
                  }
                }}
                onFocus={() => {
                  if (searchInput.trim().length > 0) {
                    setSuggestionsOpen(true);
                  }
                }}
                onKeyDown={handleKeyDown}
                placeholder="Where are you going?"
                role="combobox"
                aria-expanded={suggestionsOpen && searchInput.trim().length > 0}
                aria-controls="location-autocomplete-list"
                aria-haspopup="listbox"
                aria-autocomplete="list"
                className="w-full bg-transparent text-xs sm:text-[13px] font-semibold text-[#172B2A] placeholder-[#697875]/70 focus:outline-none truncate font-editorial-sans"
              />

              {isLoadingSuggestions && (
                <Loader2 className="w-3.5 h-3.5 text-[#009F8D] animate-spin flex-shrink-0" />
              )}

              {searchInput && (
                <button
                  type="button"
                  onClick={handleRestartSearch}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-full transition-colors"
                  title="Clear destination"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* ── Dropdown Suggestions Card (Only visible when location is entered) ── */}
            {suggestionsOpen && searchInput.trim().length > 0 && (
              <div
                id="location-autocomplete-list"
                role="listbox"
                className={`absolute top-full left-0 mt-3 ${
                  isHeaderBar ? "w-full sm:w-[420px]" : "w-full sm:w-96"
                } bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 z-50 animate-in fade-in slide-in-from-top-2 duration-150 p-2 sm:p-2.5 overflow-hidden`}
              >
                {/* Upward indicator notch matching CustomDatePicker */}
                <div className="absolute -top-2 left-8 w-4 h-4 bg-white border-l border-t border-slate-200 rotate-45 transform" />

                {/* Header label */}
                <div className="flex items-center justify-between px-3 py-1.5 mb-1 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <span>Destinations & Properties</span>
                  {suggestions.length > 0 && (
                    <span className="text-teal-600 font-semibold lowercase">
                      {suggestions.length} found
                    </span>
                  )}
                </div>

                {/* Suggestions List */}
                <div className="max-h-64 sm:max-h-72 overflow-y-auto space-y-0.5">
                  {isLoadingSuggestions && suggestions.length === 0 ? (
                    <div className="py-6 px-4 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
                      <span>Searching destinations...</span>
                    </div>
                  ) : suggestions.length === 0 ? (
                    <div className="py-6 px-4 text-center text-xs text-slate-500">
                      <span>No destination found for &quot;{searchInput}&quot;.</span>
                    </div>
                  ) : (
                    suggestions.map((item, idx) => {
                      const isHighlighted = idx === activeSuggestionIndex;
                      return (
                        <div
                          key={`${item.type}-${item.id}`}
                          id={`suggestion-item-${idx}`}
                          role="option"
                          aria-selected={isHighlighted}
                          onClick={() => handleSelectSuggestion(item)}
                          onMouseEnter={() => setActiveSuggestionIndex(idx)}
                          className={`w-full text-left px-3.5 py-2.5 rounded-xl transition-all flex items-center justify-between cursor-pointer border border-transparent ${
                            isHighlighted
                              ? "bg-teal-50/90 border-teal-200/60 shadow-xs"
                              : "hover:bg-slate-50 hover:border-slate-100"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0 pr-2">
                            <div
                              className={`p-1.5 rounded-lg shrink-0 transition-colors ${
                                isHighlighted
                                  ? "bg-teal-600 text-white"
                                  : "bg-teal-50 text-teal-600"
                              }`}
                            >
                              <MapPin className="w-4 h-4" />
                            </div>
                            <div className="text-xs sm:text-sm truncate">
                              <span className="font-bold text-slate-900">
                                {item.name}
                              </span>
                              {item.parentPath ? (
                                <span className="text-slate-500 font-medium">
                                  , {item.parentPath}
                                </span>
                              ) : null}
                            </div>
                          </div>

                          <div className="flex-shrink-0 flex items-center gap-2 pl-2">
                            {item.propertyCount !== undefined && item.propertyCount > 0 && (
                              <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                                {item.propertyCount} {item.propertyCount === 1 ? "stay" : "stays"}
                              </span>
                            )}
                            <ChevronRight
                              className={`w-4 h-4 transition-colors ${
                                isHighlighted ? "text-teal-600" : "text-slate-300"
                              }`}
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Check-in Card */}
          {renderCheckInCard()}

          {/* Check-out Card */}
          {renderCheckOutCard()}

          {/* Guests & Rooms Card */}
          <div
            ref={guestPickerRef}
            className={`relative flex-1 lg:flex-[1.1] rounded-xl sm:rounded-2xl border p-2 sm:px-3.5 py-2 transition-all cursor-pointer group ${
              guestPickerOpen
                ? "border-[#009F8D] bg-[#E7F6F3]/50 ring-2 ring-[#009F8D]/20"
                : "border-slate-200/80 bg-white hover:bg-slate-50/60"
            }`}
            onClick={() => {
              setGuestPickerOpen(!guestPickerOpen);
              setCustomCalendarOpen(false);
              setSuggestionsOpen(false);
            }}
          >
            <label className="block text-[9.5px] font-bold uppercase tracking-[0.14em] text-slate-400 mb-0.5 pointer-events-none">
              Guests &amp; Rooms
            </label>
            <div className="flex items-center justify-between pointer-events-none">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#009F8D] flex-shrink-0" />
                <span className="text-xs sm:text-[13px] font-semibold text-[#172B2A] truncate">
                  {adults + children} Guests, {rooms} Room{rooms > 1 ? "s" : ""}
                </span>
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                  guestPickerOpen ? "rotate-180" : ""
                }`}
              />
            </div>

            {/* Guests Popover */}
            {guestPickerOpen && (
              <div
                className="absolute top-full right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200/90 p-4 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-4"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Adults */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <div className="text-sm font-bold text-slate-800">Adults</div>
                    <div className="text-xs text-slate-400">Ages 13 and above</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      disabled={adults <= 1}
                      onClick={() => setAdults((prev) => Math.max(1, prev - 1))}
                      className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:border-teal-500 hover:text-teal-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-4 text-center font-bold text-sm text-slate-800">
                      {adults}
                    </span>
                    <button
                      type="button"
                      disabled={adults >= 10}
                      onClick={() => setAdults((prev) => Math.min(10, prev + 1))}
                      className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:border-teal-500 hover:text-teal-600 disabled:opacity-40 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Children */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <div className="text-sm font-bold text-slate-800">Children</div>
                    <div className="text-xs text-slate-400">Ages 0 to 12</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      disabled={children <= 0}
                      onClick={() => setChildren((prev) => Math.max(0, prev - 1))}
                      className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:border-teal-500 hover:text-teal-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-4 text-center font-bold text-sm text-slate-800">
                      {children}
                    </span>
                    <button
                      type="button"
                      disabled={children >= 6}
                      onClick={() => setChildren((prev) => Math.min(6, prev + 1))}
                      className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:border-teal-500 hover:text-teal-600 disabled:opacity-40 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Rooms */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <div className="text-sm font-bold text-slate-800">Rooms</div>
                    <div className="text-xs text-slate-400">Total suites / rooms</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      disabled={rooms <= 1}
                      onClick={() => setRooms((prev) => Math.max(1, prev - 1))}
                      className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:border-teal-500 hover:text-teal-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-4 text-center font-bold text-sm text-slate-800">
                      {rooms}
                    </span>
                    <button
                      type="button"
                      disabled={rooms >= 8}
                      onClick={() => setRooms((prev) => Math.min(8, prev + 1))}
                      className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:border-teal-500 hover:text-teal-600 disabled:opacity-40 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="pt-1 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">
                    Max 16 guests allowed
                  </span>
                  <button
                    type="button"
                    onClick={() => setGuestPickerOpen(false)}
                    className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Search Button */}
          <div className="shrink-0">
            <button
              type="submit"
              className="w-full lg:w-auto h-full min-h-[48px] px-7 rounded-xl sm:rounded-2xl bg-[#009F8D] hover:bg-[#00897A] text-white font-semibold text-xs sm:text-sm shadow-xs flex items-center justify-center gap-2 transition-all transform active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <Search className="w-4 h-4" />
              <span>Search Stays</span>
            </button>
          </div>
        </div>

        {dateError && (
          <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{dateError}</span>
          </div>
        )}
      </form>
    </div>
  );
}
