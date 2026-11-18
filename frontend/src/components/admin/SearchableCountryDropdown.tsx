"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { ISO_COUNTRIES, StandardCountry } from "@/lib/standardCountries";
import { CountryRecord } from "@backend/types/admin";
import { adminClient } from "@/lib/adminClient";
import {
  Globe,
  ChevronDown,
  Search,
  Check,
  Plus,
  X,
  AlertCircle,
  Loader2,
} from "lucide-react";

export interface DropdownCountryOption {
  name: string;
  code: string;
  isCustom?: boolean;
  dbRecord?: CountryRecord;
}

interface SearchableCountryDropdownProps {
  countries: CountryRecord[];
  selectedCountry: CountryRecord | null;
  onSelectCountry: (country: CountryRecord) => void;
  onCountryCreated?: (country: CountryRecord) => void;
  disabled?: boolean;
  className?: string;
}

export default function SearchableCountryDropdown({
  countries,
  selectedCountry,
  onSelectCountry,
  onCountryCreated,
  disabled = false,
  className = "",
}: SearchableCountryDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [isResolvingCountry, setIsResolvingCountry] = useState(false);

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalCountryName, setModalCountryName] = useState("");
  const [modalError, setModalError] = useState("");
  const [isSavingModalCountry, setIsSavingModalCountry] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const modalInputRef = useRef<HTMLInputElement>(null);

  // 1. Merge standardized ISO countries with existing database countries
  const allCountryOptions = useMemo<DropdownCountryOption[]>(() => {
    const dbMap = new Map<string, CountryRecord>();
    countries.forEach((c) => {
      dbMap.set(c.name.trim().toLowerCase(), c);
      if (c.code) {
        dbMap.set(c.code.trim().toUpperCase(), c);
      }
    });

    const options: DropdownCountryOption[] = [];
    const seenNames = new Set<string>();

    // Add standardized countries
    ISO_COUNTRIES.forEach((sc) => {
      const lower = sc.name.trim().toLowerCase();
      seenNames.add(lower);
      const existingDb = dbMap.get(lower) || dbMap.get(sc.code.trim().toUpperCase());
      options.push({
        name: existingDb ? existingDb.name : sc.name,
        code: sc.code,
        dbRecord: existingDb,
      });
    });

    // Add custom countries from DB that are not in ISO list
    countries.forEach((c) => {
      const lower = c.name.trim().toLowerCase();
      if (!seenNames.has(lower)) {
        seenNames.add(lower);
        options.push({
          name: c.name,
          code: c.code || "CUSTOM",
          isCustom: true,
          dbRecord: c,
        });
      }
    });

    // Sort alphabetically
    return options.sort((a, b) => a.name.localeCompare(b.name));
  }, [countries]);

  // 2. Filter options based on search query
  const filteredOptions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return allCountryOptions;
    return allCountryOptions.filter(
      (opt) =>
        opt.name.toLowerCase().includes(q) ||
        (opt.code && opt.code.toLowerCase().includes(q))
    );
  }, [allCountryOptions, searchQuery]);

  // 3. Handle click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 4. Focus input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setFocusedIndex(0);
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // 5. Focus modal input when modal opens
  useEffect(() => {
    if (isAddModalOpen) {
      setTimeout(() => {
        modalInputRef.current?.focus();
      }, 50);
    }
  }, [isAddModalOpen]);

  // 6. Scroll focused item into view
  useEffect(() => {
    if (isOpen && listRef.current) {
      const listElement = listRef.current;
      const focusedElement = listElement.children[focusedIndex] as HTMLElement;
      if (focusedElement) {
        const listTop = listElement.scrollTop;
        const listBottom = listTop + listElement.clientHeight;
        const elementTop = focusedElement.offsetTop;
        const elementBottom = elementTop + focusedElement.clientHeight;

        if (elementTop < listTop) {
          listElement.scrollTop = elementTop;
        } else if (elementBottom > listBottom) {
          listElement.scrollTop = elementBottom - listElement.clientHeight;
        }
      }
    }
  }, [focusedIndex, isOpen]);

  // 7. Select country handler
  const handleOptionSelect = async (opt: DropdownCountryOption) => {
    setIsOpen(false);
    setSearchQuery("");

    // If already in DB, select immediately
    if (opt.dbRecord) {
      onSelectCountry(opt.dbRecord);
      return;
    }

    // If standardized country not yet in DB, resolve/create it in MongoDB
    try {
      setIsResolvingCountry(true);
      const res = await adminClient.destinations.create("country", {
        name: opt.name,
        code: opt.code,
        resolveIfExists: true,
      });

      if (res.success && res.data) {
        const countryRec: CountryRecord = (res.data as any).data || res.data;
        if (onCountryCreated) {
          onCountryCreated(countryRec);
        }
        onSelectCountry(countryRec);
      } else {
        alert(res.message || "Failed to select country");
      }
    } catch (err: any) {
      console.error("Country resolution error:", err);
      alert(err.message || "Failed to select country");
    } finally {
      setIsResolvingCountry(false);
    }
  };

  // 8. Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIndex((prev) => Math.min(prev + 1, filteredOptions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredOptions.length > 0 && focusedIndex >= 0 && focusedIndex < filteredOptions.length) {
        handleOptionSelect(filteredOptions[focusedIndex]);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  // 9. Add Country Modal Submit
  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = modalCountryName.trim();

    if (!trimmed) {
      setModalError("Country name is required.");
      return;
    }

    if (trimmed.length < 2) {
      setModalError("Country name must be at least 2 characters.");
      return;
    }

    if (trimmed.length > 100) {
      setModalError("Country name must be 100 characters or fewer.");
      return;
    }

    // Check duplicate case-insensitively
    const isDuplicate = allCountryOptions.some(
      (opt) => opt.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (isDuplicate) {
      setModalError("This country already exists. Please select it from the dropdown.");
      return;
    }

    try {
      setIsSavingModalCountry(true);
      setModalError("");

      const res = await adminClient.destinations.create("country", {
        name: trimmed,
      });

      if (res.success && res.data) {
        const createdCountry: CountryRecord = (res.data as any).data || res.data;
        if (onCountryCreated) {
          onCountryCreated(createdCountry);
        }
        setIsAddModalOpen(false);
        setModalCountryName("");
        setModalError("");
        onSelectCountry(createdCountry);
      } else {
        setModalError(res.message || "Failed to save country. Please try again.");
      }
    } catch (err: any) {
      console.error("Failed to add country:", err);
      setModalError(err.message || "Error adding country. Please try again.");
    } finally {
      setIsSavingModalCountry(false);
    }
  };

  return (
    <>
      <div ref={containerRef} className={`relative ${className}`}>
        {/* Trigger Button */}
        <button
          type="button"
          disabled={disabled || isResolvingCountry}
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-teal-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm"
        >
          <div className="flex items-center gap-2 truncate">
            {isResolvingCountry ? (
              <Loader2 className="w-4 h-4 text-teal-400 animate-spin shrink-0" />
            ) : (
              <Globe className="w-4 h-4 text-teal-400 shrink-0" />
            )}
            <span className={selectedCountry ? "text-white font-bold truncate" : "text-slate-400 truncate"}>
              {isResolvingCountry
                ? "Connecting country..."
                : selectedCountry
                ? selectedCountry.name
                : "Search or select country"}
            </span>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform shrink-0 ml-2 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {/* Dropdown Popover */}
        {isOpen && (
          <div className="absolute left-0 right-0 top-full mt-1.5 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 z-50 animate-fadeIn min-w-[280px]">
            {/* Search Input */}
            <div className="relative mb-2">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search countries..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setFocusedIndex(0);
                }}
                onKeyDown={handleKeyDown}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
              />
            </div>

            {/* Countries Scrollable List */}
            <div
              ref={listRef}
              className="max-h-60 overflow-y-auto custom-scrollbar space-y-0.5"
            >
              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt, idx) => {
                  const isSelected =
                    selectedCountry &&
                    (selectedCountry.name.toLowerCase() === opt.name.toLowerCase() ||
                      (opt.dbRecord && opt.dbRecord.id === selectedCountry.id));
                  const isFocused = idx === focusedIndex;

                  return (
                    <button
                      key={`${opt.code}-${opt.name}`}
                      type="button"
                      onClick={() => handleOptionSelect(opt)}
                      onMouseEnter={() => setFocusedIndex(idx)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-teal-500/20 text-teal-300 font-bold"
                          : isFocused
                          ? "bg-slate-800 text-white"
                          : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="truncate">{opt.name}</span>
                        {opt.code && (
                          <span className="text-[10px] font-mono text-slate-500 uppercase shrink-0">
                            {opt.code}
                          </span>
                        )}
                      </div>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-teal-400 shrink-0 ml-2" />
                      )}
                    </button>
                  );
                })
              ) : (
                <div className="px-3 py-4 text-center text-xs text-slate-500">
                  No countries matching &quot;{searchQuery}&quot;
                </div>
              )}
            </div>

            {/* + Add New Country Action (Always visible at the bottom) */}
            <div className="border-t border-slate-800 mt-1 pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setModalCountryName(searchQuery.trim());
                  setModalError("");
                  setIsAddModalOpen(true);
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-teal-400 hover:text-teal-300 hover:bg-slate-800/80 flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add New Country</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add New Country Modal / Popup */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Add New Country</h3>
              <button
                type="button"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setModalCountryName("");
                  setModalError("");
                }}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleModalSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Country Name
                </label>
                <input
                  ref={modalInputRef}
                  type="text"
                  required
                  placeholder="Enter country name"
                  value={modalCountryName}
                  onChange={(e) => {
                    setModalCountryName(e.target.value);
                    if (modalError) setModalError("");
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500 transition-colors"
                />
              </div>

              {modalError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setModalCountryName("");
                    setModalError("");
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingModalCountry || !modalCountryName.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer shadow-md shadow-teal-500/20"
                >
                  {isSavingModalCountry ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Adding...</span>
                    </>
                  ) : (
                    <span>Add Country</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
