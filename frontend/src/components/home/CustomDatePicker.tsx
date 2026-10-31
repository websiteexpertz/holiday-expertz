"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

interface CustomDatePickerProps {
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  onChange: (checkIn: string, checkOut: string) => void;
  onClose: () => void;
  activeField?: "checkIn" | "checkOut";
}

export default function CustomDatePicker({
  checkIn,
  checkOut,
  onChange,
  onClose,
  activeField = "checkIn",
}: CustomDatePickerProps) {
  // Reference date: October 20, 2026
  const todayStr = "2026-10-20";

  // Base view date
  const initialDate = checkIn ? new Date(checkIn + "T00:00:00") : new Date(2026, 9, 20);
  const [viewDate, setViewDate] = useState<Date>(
    new Date(initialDate.getFullYear(), initialDate.getMonth(), 1)
  );

  const [selectingStep, setSelectingStep] = useState<"checkIn" | "checkOut">(activeField);
  const [tempCheckIn, setTempCheckIn] = useState<string>(checkIn || "2026-10-26");
  const [tempCheckOut, setTempCheckOut] = useState<string>(checkOut || "2026-10-29");
  const [hoverDate, setHoverDate] = useState<string | null>(null);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const daysOfWeek = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth();

  const handlePrevMonth = () => {
    // Keep within Oct 2026 or later
    if (currentYear <= 2026 && currentMonth <= 9) return;
    setViewDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const isPrevDisabled = currentYear <= 2026 && currentMonth <= 9;

  const toIsoDateString = (y: number, m: number, d: number) => {
    const mm = String(m + 1).padStart(2, "0");
    const dd = String(d).padStart(2, "0");
    return `${y}-${mm}-${dd}`;
  };

  const calculateNights = (start: string, end: string) => {
    if (!start || !end || end <= start) return 0;
    const s = new Date(start + "T00:00:00");
    const e = new Date(end + "T00:00:00");
    return Math.max(0, Math.ceil(Math.abs(e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)));
  };

  const formatShortDate = (dateStr: string) => {
    if (!dateStr) return "--";
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", { day: "numeric", month: "short" });
  };

  const handleDateClick = (dateStr: string) => {
    if (dateStr < todayStr) return;

    if (selectingStep === "checkIn") {
      setTempCheckIn(dateStr);
      // Automatically advance to check-out selection
      setSelectingStep("checkOut");

      // If existing check-out is before or same as new check-in, push check-out to next day
      if (tempCheckOut && tempCheckOut <= dateStr) {
        const nextDay = new Date(dateStr + "T00:00:00");
        nextDay.setDate(nextDay.getDate() + 1);
        const y = nextDay.getFullYear();
        const m = String(nextDay.getMonth() + 1).padStart(2, "0");
        const d = String(nextDay.getDate()).padStart(2, "0");
        const nextDateStr = `${y}-${m}-${d}`;
        setTempCheckOut(nextDateStr);
        onChange(dateStr, nextDateStr);
      } else {
        onChange(dateStr, tempCheckOut);
      }
    } else {
      // Selecting Check-Out
      if (dateStr <= tempCheckIn) {
        // User picked an earlier date: make it the new check-in
        setTempCheckIn(dateStr);
        setSelectingStep("checkOut");
        onChange(dateStr, tempCheckOut);
      } else {
        // Valid checkout date clicked: save and close
        setTempCheckOut(dateStr);
        onChange(tempCheckIn, dateStr);
        onClose();
      }
    }
  };

  const nights = calculateNights(tempCheckIn, tempCheckOut);
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
  const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className={`absolute top-full mt-3 w-80 sm:w-84 bg-white rounded-3xl shadow-2xl border border-slate-200 p-4 sm:p-5 z-50 animate-in fade-in slide-in-from-top-2 duration-150 cursor-default ${
        activeField === "checkIn" ? "left-0" : "right-0 lg:left-0"
      }`}
    >
      {/* Upward indicator notch */}
      <div
        className={`absolute -top-2 w-4 h-4 bg-white border-l border-t border-slate-200 rotate-45 transform ${
          activeField === "checkIn" ? "left-8" : "right-8 lg:left-8"
        }`}
      />

      {/* Top Header: Step Switcher Tabs & Close */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 gap-2">
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-semibold flex-1">
          <button
            type="button"
            onClick={() => setSelectingStep("checkIn")}
            className={`py-1.5 px-2 rounded-lg text-center transition-all ${
              selectingStep === "checkIn"
                ? "bg-white text-teal-800 font-bold shadow-sm ring-1 ring-slate-200/50"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span className="block text-[10px] text-slate-400 font-medium">1. Check-in</span>
            <span className="truncate">{formatShortDate(tempCheckIn)}</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectingStep("checkOut")}
            className={`py-1.5 px-2 rounded-lg text-center transition-all ${
              selectingStep === "checkOut"
                ? "bg-white text-teal-800 font-bold shadow-sm ring-1 ring-slate-200/50"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span className="block text-[10px] text-slate-400 font-medium">2. Check-out</span>
            <span className="truncate">{formatShortDate(tempCheckOut)}</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors flex-shrink-0"
          aria-label="Close calendar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between py-2.5">
        <button
          type="button"
          disabled={isPrevDisabled}
          onClick={handlePrevMonth}
          className="p-2 sm:p-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 disabled:opacity-25 disabled:cursor-not-allowed text-slate-700 transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <h4 className="text-sm font-bold text-slate-900">
          {monthNames[currentMonth]} {currentYear}
        </h4>

        <button
          type="button"
          onClick={handleNextMonth}
          className="p-2 sm:p-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors"
          aria-label="Next month"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Weekdays Header */}
      <div className="grid grid-cols-7 gap-1 text-center pb-1">
        {daysOfWeek.map((d) => (
          <span key={d} className="text-[11px] font-bold text-slate-400 py-1">
            {d}
          </span>
        ))}
      </div>

      {/* Days Grid - Touch friendly sizing */}
      <div className="grid grid-cols-7 gap-y-1 gap-x-0 text-center">
        {Array.from({ length: firstDayIndex }).map((_, i) => (
          <div key={`empty-${currentYear}-${currentMonth}-${i}`} className="h-9 sm:h-8 w-9 sm:w-8 mx-auto" />
        ))}

        {Array.from({ length: totalDays }).map((_, i) => {
          const dayNum = i + 1;
          const dateStr = toIsoDateString(currentYear, currentMonth, dayNum);
          const isPast = dateStr < todayStr;
          const isCheckIn = dateStr === tempCheckIn;
          const isCheckOut = dateStr === tempCheckOut;
          const isInRange =
            tempCheckIn &&
            tempCheckOut &&
            dateStr > tempCheckIn &&
            dateStr < tempCheckOut;
          const isHovered =
            selectingStep === "checkOut" &&
            hoverDate &&
            tempCheckIn &&
            dateStr > tempCheckIn &&
            dateStr <= hoverDate;

          // Range background ribbon
          let ribbonBg = "";
          if (isInRange || isHovered) {
            ribbonBg = "bg-teal-50";
          } else if (isCheckIn && (tempCheckOut > tempCheckIn || (hoverDate && hoverDate > tempCheckIn))) {
            ribbonBg = "bg-gradient-to-r from-transparent 50% to-teal-50 50%";
          } else if (isCheckOut && tempCheckIn < tempCheckOut) {
            ribbonBg = "bg-gradient-to-l from-transparent 50% to-teal-50 50%";
          }

          // Button styling - 36px on mobile (touch friendly)
          let btnClass = "text-slate-800 hover:bg-slate-100 hover:text-slate-900 rounded-full";
          if (isPast) {
            btnClass = "text-slate-300 cursor-not-allowed hover:bg-transparent";
          } else if (isCheckIn || isCheckOut) {
            btnClass =
              "bg-teal-600 text-white font-bold shadow-md shadow-teal-600/30 rounded-full scale-105 z-10";
          } else if (isInRange || isHovered) {
            btnClass = "text-teal-900 font-semibold rounded-none hover:bg-teal-100";
          }

          return (
            <div
              key={dateStr}
              className={`relative h-9 sm:h-8 flex items-center justify-center ${ribbonBg}`}
            >
              <button
                type="button"
                disabled={isPast}
                onClick={() => handleDateClick(dateStr)}
                onMouseEnter={() => !isPast && setHoverDate(dateStr)}
                onMouseLeave={() => setHoverDate(null)}
                className={`h-9 w-9 sm:h-8 sm:w-8 flex items-center justify-center text-xs sm:text-xs font-semibold transition-all ${btnClass}`}
                aria-label={dateStr}
              >
                {dayNum}
              </button>
            </div>
          );
        })}
      </div>

      {/* Bottom Summary & Done Button */}
      <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between text-xs">
        <span className="text-slate-500 font-medium">
          {nights > 0 ? (
            <span className="text-teal-700 font-bold">
              {nights} night{nights > 1 ? "s" : ""} stay
            </span>
          ) : (
            <span>Select check-out</span>
          )}
        </span>

        <button
          type="button"
          onClick={() => {
            onChange(tempCheckIn, tempCheckOut);
            onClose();
          }}
          className="px-5 py-2 sm:py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl transition-all shadow-sm active:scale-95"
        >
          Done
        </button>
      </div>
    </div>
  );
}
