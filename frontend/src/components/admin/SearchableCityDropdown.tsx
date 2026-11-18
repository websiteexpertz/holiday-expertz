"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { CountryRecord, StateRecord, CityRecord } from "@backend/types/admin";
import { adminClient } from "@/lib/adminClient";
import {
  Building2,
  ChevronDown,
  Search,
  Check,
  Plus,
  X,
  AlertCircle,
  Loader2,
} from "lucide-react";

export interface DropdownCityOption {
  name: string;
  isCustom?: boolean;
  dbRecord?: CityRecord;
}

interface SearchableCityDropdownProps {
  country: CountryRecord;
  state: StateRecord;
  cities: CityRecord[];
  selectedCity: CityRecord | null;
  onSelectCity: (city: CityRecord) => void;
  onCityCreated?: (city: CityRecord) => void;
  disabled?: boolean;
  className?: string;
}

export default function SearchableCityDropdown({
  country,
  state,
  cities,
  selectedCity,
  onSelectCity,
  onCityCreated,
  disabled = false,
  className = "",
}: SearchableCityDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [focusedIndex, setFocusedIndex] = useState(0);

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalCityName, setModalCityName] = useState("");
  const [modalError, setModalError] = useState("");
  const [isSavingModalCity, setIsSavingModalCity] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const modalInputRef = useRef<HTMLInputElement>(null);

  // 1. Filter existing DB cities for this state
  const stateDbCities = useMemo(() => {
    return cities.filter((c) => c.stateId === state.id);
  }, [cities, state.id]);

  // 2. Options list
  const allCityOptions = useMemo<DropdownCityOption[]>(() => {
    return stateDbCities
      .map((c) => ({
        name: c.name,
        dbRecord: c,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [stateDbCities]);

  // 3. Filter options based on search query
  const filteredOptions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return allCityOptions;
    return allCityOptions.filter((opt) => opt.name.toLowerCase().includes(q));
  }, [allCityOptions, searchQuery]);

  // 4. Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 5. Focus search input when open
  useEffect(() => {
    if (isOpen) {
      setFocusedIndex(0);
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // 6. Focus modal input when modal open
  useEffect(() => {
    if (isAddModalOpen) {
      setTimeout(() => {
        modalInputRef.current?.focus();
      }, 50);
    }
  }, [isAddModalOpen]);

  // 7. Scroll focused element into view
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

  // 8. Select city handler
  const handleOptionSelect = (opt: DropdownCityOption) => {
    setIsOpen(false);
    setSearchQuery("");
    if (opt.dbRecord) {
      onSelectCity(opt.dbRecord);
    }
  };

  // 9. Keyboard navigation
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

  // 10. Add New City Modal Submit
  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = modalCityName.trim();

    if (!trimmed) {
      setModalError("City name is required.");
      return;
    }

    if (trimmed.length < 2) {
      setModalError("City name must be at least 2 characters.");
      return;
    }

    if (trimmed.length > 100) {
      setModalError("City name must be 100 characters or fewer.");
      return;
    }

    // Check duplicate case-insensitively for this state
    const isDuplicate = allCityOptions.some(
      (opt) => opt.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (isDuplicate) {
      setModalError(`City "${trimmed}" already exists in ${state.name}. Please select it from the dropdown.`);
      return;
    }

    try {
      setIsSavingModalCity(true);
      setModalError("");

      const res = await adminClient.destinations.create("city", {
        name: trimmed,
        stateId: state.id,
        countryId: country.id,
      });

      if (res.success && res.data) {
        const createdCity: CityRecord = (res.data as any).data || res.data;
        if (onCityCreated) {
          onCityCreated(createdCity);
        }
        setIsAddModalOpen(false);
        setModalCityName("");
        setModalError("");
        onSelectCity(createdCity);
      } else {
        setModalError(res.message || "Failed to save city. Please try again.");
      }
    } catch (err: any) {
      console.error("Failed to add city:", err);
      setModalError(err.message || "Error adding city. Please try again.");
    } finally {
      setIsSavingModalCity(false);
    }
  };

  return (
    <>
      <div ref={containerRef} className={`relative ${className}`}>
        {/* Trigger Button */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-teal-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm"
        >
          <div className="flex items-center gap-2 truncate">
            <Building2 className="w-4 h-4 text-teal-400 shrink-0" />
            <span className={selectedCity ? "text-white font-bold truncate" : "text-slate-400 truncate"}>
              {selectedCity
                ? selectedCity.name
                : `Search or select city in ${state.name}`}
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
                placeholder={`Search cities in ${state.name}...`}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setFocusedIndex(0);
                }}
                onKeyDown={handleKeyDown}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
              />
            </div>

            {/* Cities Scrollable List */}
            <div
              ref={listRef}
              className="max-h-60 overflow-y-auto custom-scrollbar space-y-0.5"
            >
              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt, idx) => {
                  const isSelected =
                    selectedCity &&
                    (selectedCity.name.toLowerCase() === opt.name.toLowerCase() ||
                      (opt.dbRecord && opt.dbRecord.id === selectedCity.id));
                  const isFocused = idx === focusedIndex;

                  return (
                    <button
                      key={opt.name}
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
                      <span className="truncate">{opt.name}</span>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-teal-400 shrink-0 ml-2" />
                      )}
                    </button>
                  );
                })
              ) : (
                <div className="px-3 py-4 text-center text-xs text-slate-500">
                  No cities matching &quot;{searchQuery}&quot;
                </div>
              )}
            </div>

            {/* + Add New City Action (Always visible at bottom) */}
            <div className="border-t border-slate-800 mt-1 pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setModalCityName(searchQuery.trim());
                  setModalError("");
                  setIsAddModalOpen(true);
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-teal-400 hover:text-teal-300 hover:bg-slate-800/80 flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add New City</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add New City Modal / Popup */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white">Add New City</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Under {state.name}, {country.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setModalCityName("");
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
                  City Name
                </label>
                <input
                  ref={modalInputRef}
                  type="text"
                  required
                  placeholder="e.g. Dehradun"
                  value={modalCityName}
                  onChange={(e) => {
                    setModalCityName(e.target.value);
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
                    setModalCityName("");
                    setModalError("");
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingModalCity || !modalCityName.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer shadow-md shadow-teal-500/20"
                >
                  {isSavingModalCity ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Adding...</span>
                    </>
                  ) : (
                    <span>Add City</span>
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
