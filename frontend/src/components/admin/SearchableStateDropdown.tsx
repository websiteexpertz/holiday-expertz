"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { CountryRecord, StateRecord } from "@backend/types/admin";
import { STANDARD_STATES_BY_COUNTRY } from "@/lib/standardStates";
import { adminClient } from "@/lib/adminClient";
import {
  Layers,
  ChevronDown,
  Search,
  Check,
  Plus,
  X,
  AlertCircle,
  Loader2,
} from "lucide-react";

export interface DropdownStateOption {
  name: string;
  isCustom?: boolean;
  dbRecord?: StateRecord;
}

interface SearchableStateDropdownProps {
  country: CountryRecord;
  states: StateRecord[];
  selectedState: StateRecord | null;
  onSelectState: (state: StateRecord) => void;
  onStateCreated?: (state: StateRecord) => void;
  disabled?: boolean;
  className?: string;
}

export default function SearchableStateDropdown({
  country,
  states,
  selectedState,
  onSelectState,
  onStateCreated,
  disabled = false,
  className = "",
}: SearchableStateDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [isResolvingState, setIsResolvingState] = useState(false);

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalStateName, setModalStateName] = useState("");
  const [modalError, setModalError] = useState("");
  const [isSavingModalState, setIsSavingModalState] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const modalInputRef = useRef<HTMLInputElement>(null);

  // 1. Filter existing DB states for this country
  const countryDbStates = useMemo(() => {
    return states.filter((s) => s.countryId === country.id);
  }, [states, country.id]);

  // 2. Merge standard states for this country code with DB states
  const allStateOptions = useMemo<DropdownStateOption[]>(() => {
    const dbMap = new Map<string, StateRecord>();
    countryDbStates.forEach((s) => {
      dbMap.set(s.name.trim().toLowerCase(), s);
    });

    const options: DropdownStateOption[] = [];
    const seenNames = new Set<string>();

    // Standard states for country code
    const standardList = country.code ? STANDARD_STATES_BY_COUNTRY[country.code.toUpperCase()] || [] : [];
    standardList.forEach((stateName) => {
      const lower = stateName.trim().toLowerCase();
      seenNames.add(lower);
      const existingDb = dbMap.get(lower);
      options.push({
        name: existingDb ? existingDb.name : stateName,
        dbRecord: existingDb,
      });
    });

    // Custom states in DB not in standard list
    countryDbStates.forEach((s) => {
      const lower = s.name.trim().toLowerCase();
      if (!seenNames.has(lower)) {
        seenNames.add(lower);
        options.push({
          name: s.name,
          isCustom: true,
          dbRecord: s,
        });
      }
    });

    return options.sort((a, b) => a.name.localeCompare(b.name));
  }, [countryDbStates, country.code]);

  // 3. Filter options based on search query
  const filteredOptions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return allStateOptions;
    return allStateOptions.filter((opt) => opt.name.toLowerCase().includes(q));
  }, [allStateOptions, searchQuery]);

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

  // 8. Select state handler
  const handleOptionSelect = async (opt: DropdownStateOption) => {
    setIsOpen(false);
    setSearchQuery("");

    // If already exists in DB
    if (opt.dbRecord) {
      onSelectState(opt.dbRecord);
      return;
    }

    // Resolve or create standard state in backend
    try {
      setIsResolvingState(true);
      const res = await adminClient.destinations.create("state", {
        name: opt.name,
        countryId: country.id,
        resolveIfExists: true,
      });

      if (res.success && res.data) {
        const stateRec: StateRecord = (res.data as any).data || res.data;
        if (onStateCreated) {
          onStateCreated(stateRec);
        }
        onSelectState(stateRec);
      } else {
        alert(res.message || "Failed to select state");
      }
    } catch (err: any) {
      console.error("State resolution error:", err);
      alert(err.message || "Failed to select state");
    } finally {
      setIsResolvingState(false);
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

  // 10. Add New State Modal Submit
  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = modalStateName.trim();

    if (!trimmed) {
      setModalError("State name is required.");
      return;
    }

    if (trimmed.length < 2) {
      setModalError("State name must be at least 2 characters.");
      return;
    }

    if (trimmed.length > 100) {
      setModalError("State name must be 100 characters or fewer.");
      return;
    }

    // Check duplicate case-insensitively for this country
    const isDuplicate = allStateOptions.some(
      (opt) => opt.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (isDuplicate) {
      setModalError(`State "${trimmed}" already exists in ${country.name}. Please select it from the dropdown.`);
      return;
    }

    try {
      setIsSavingModalState(true);
      setModalError("");

      const res = await adminClient.destinations.create("state", {
        name: trimmed,
        countryId: country.id,
      });

      if (res.success && res.data) {
        const createdState: StateRecord = (res.data as any).data || res.data;
        if (onStateCreated) {
          onStateCreated(createdState);
        }
        setIsAddModalOpen(false);
        setModalStateName("");
        setModalError("");
        onSelectState(createdState);
      } else {
        setModalError(res.message || "Failed to save state. Please try again.");
      }
    } catch (err: any) {
      console.error("Failed to add state:", err);
      setModalError(err.message || "Error adding state. Please try again.");
    } finally {
      setIsSavingModalState(false);
    }
  };

  return (
    <>
      <div ref={containerRef} className={`relative ${className}`}>
        {/* Trigger Button */}
        <button
          type="button"
          disabled={disabled || isResolvingState}
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-teal-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm"
        >
          <div className="flex items-center gap-2 truncate">
            {isResolvingState ? (
              <Loader2 className="w-4 h-4 text-teal-400 animate-spin shrink-0" />
            ) : (
              <Layers className="w-4 h-4 text-teal-400 shrink-0" />
            )}
            <span className={selectedState ? "text-white font-bold truncate" : "text-slate-400 truncate"}>
              {isResolvingState
                ? "Connecting state..."
                : selectedState
                ? selectedState.name
                : `Search or select state in ${country.name}`}
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
                placeholder={`Search states in ${country.name}...`}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setFocusedIndex(0);
                }}
                onKeyDown={handleKeyDown}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
              />
            </div>

            {/* States Scrollable List */}
            <div
              ref={listRef}
              className="max-h-60 overflow-y-auto custom-scrollbar space-y-0.5"
            >
              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt, idx) => {
                  const isSelected =
                    selectedState &&
                    (selectedState.name.toLowerCase() === opt.name.toLowerCase() ||
                      (opt.dbRecord && opt.dbRecord.id === selectedState.id));
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
                  No states matching &quot;{searchQuery}&quot;
                </div>
              )}
            </div>

            {/* + Add New State Action (Always visible at bottom) */}
            <div className="border-t border-slate-800 mt-1 pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setModalStateName(searchQuery.trim());
                  setModalError("");
                  setIsAddModalOpen(true);
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-teal-400 hover:text-teal-300 hover:bg-slate-800/80 flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add New State</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add New State Modal / Popup */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white">Add New State</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Under {country.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setModalStateName("");
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
                  State Name
                </label>
                <input
                  ref={modalInputRef}
                  type="text"
                  required
                  placeholder="e.g. Uttarakhand"
                  value={modalStateName}
                  onChange={(e) => {
                    setModalStateName(e.target.value);
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
                    setModalStateName("");
                    setModalError("");
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingModalState || !modalStateName.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer shadow-md shadow-teal-500/20"
                >
                  {isSavingModalState ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Adding...</span>
                    </>
                  ) : (
                    <span>Add State</span>
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
