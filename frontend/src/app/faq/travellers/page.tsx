"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Compass,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  HelpCircle,
  X,
  ShieldCheck,
  AlertTriangle,
  Heart,
  Luggage,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AuthModal from "@/components/layout/AuthModal";
import FAQAccordion from "@/components/faq/FAQAccordion";
import { travellerFaqs } from "@/data/faqData";

export default function TravellerFAQPage() {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");

  const categories = useMemo(() => {
    return [
      "All",
      "Booking & General",
      "Payments & Pricing",
      "Direct Communication",
    ];
  }, []);

  const filteredFaqs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return travellerFaqs.filter((item) => {
      // Category filter
      if (activeCategory !== "All" && item.category !== activeCategory) {
        return false;
      }

      // Search query filter
      if (q) {
        const matchQ = item.question.toLowerCase().includes(q);
        const matchP = item.paragraphs.some((p) => p.toLowerCase().includes(q));
        const matchB = item.bulletPoints?.some((b) => b.toLowerCase().includes(q));
        const matchN = item.numberedList?.some((n) => n.toLowerCase().includes(q));
        const matchW = item.warningBox?.text.toLowerCase().includes(q);
        return matchQ || matchP || matchB || matchN || matchW;
      }

      return true;
    });
  }, [searchQuery, activeCategory]);

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-stone-900 flex flex-col font-sans selection:bg-[#006F66] selection:text-white">
      <Header onOpenAuthModal={() => setAuthModalOpen(true)} />

      <main className="flex-1">
        {/* Deep Forest-Green Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-[#06241C] via-[#0A3328] to-[#0D3E31] text-white pt-24 sm:pt-28 pb-14 sm:pb-16 px-4 sm:px-6 lg:px-8 shadow-inner">
          <div className="absolute top-0 right-10 w-96 h-96 bg-[#009F8D]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-10 w-80 h-80 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative max-w-4xl mx-auto space-y-5">
            {/* Breadcrumb / Back Link */}
            <div className="flex items-center gap-2 text-xs text-[#9fb8b5]">
              <Link
                href="/faq"
                className="inline-flex items-center gap-1.5 text-[#C8E1DB] hover:text-white transition-colors font-medium group"
              >
                <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                <span>Help Centre</span>
              </Link>
              <span>/</span>
              <span className="text-white font-semibold">For Travellers</span>
            </div>

            {/* Small Label / Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[#E6F4F1] text-[11px] font-bold tracking-[0.16em] uppercase">
              <Compass className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>GUESTS &amp; DISCERNING TRAVELLERS</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white font-editorial-sans">
              Traveller FAQs
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base md:text-lg text-[#C8E1DB] font-light leading-relaxed max-w-2xl">
              Everything you need to know about discovering exceptional stays, zero-commission direct bookings, safe payment precautions, and contacting verified hosts.
            </p>

            {/* Dedicated Search Input (Traveller FAQs only) */}
            <div className="pt-2">
              <div className="relative flex items-center max-w-xl">
                <Search className="w-5 h-5 text-stone-400 absolute left-4 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search traveller FAQs by keyword (e.g. commission, payment, deposit)..."
                  className="w-full pl-12 pr-10 py-3.5 rounded-2xl bg-white text-stone-900 placeholder:text-stone-400 text-sm font-medium shadow-lg shadow-black/20 focus:outline-none focus:ring-3 focus:ring-[#009F8D] transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    aria-label="Clear search"
                    className="absolute right-3.5 p-1 text-stone-400 hover:text-stone-600 rounded-full hover:bg-stone-100 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Content Area */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
          {/* Important Security Notice Banner */}
          <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/90 border border-amber-200/90 flex items-start gap-3.5 shadow-xs">
            <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-amber-950 space-y-1">
              <span className="font-bold text-amber-900 uppercase tracking-wide block">
                Direct Booking Security Notice
              </span>
              <p className="text-amber-900/90 leading-relaxed">
                Holiday Expertz provides direct host connections with <strong>zero guest commissions</strong>. Always use traceable payment methods (credit/debit cards or verified bank transfers) and never send funds via untraceable cash wire services.
              </p>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {categories.map((cat) => {
              const isSelected = activeCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    isSelected
                      ? "bg-[#006F66] text-white shadow-sm shadow-[#006F66]/30"
                      : "bg-white text-stone-600 hover:bg-stone-100 border border-stone-200/80"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Results Summary */}
          {(searchQuery || activeCategory !== "All") && (
            <div className="flex items-center justify-between text-xs sm:text-sm text-stone-500 pb-2 border-b border-stone-200">
              <span>
                Showing {filteredFaqs.length} of {travellerFaqs.length} Traveller FAQs
                {searchQuery && ` matching "${searchQuery}"`}
                {activeCategory !== "All" && ` in ${activeCategory}`}
              </span>
              {(searchQuery || activeCategory !== "All") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setActiveCategory("All");
                  }}
                  className="font-bold text-[#006F66] hover:underline"
                >
                  Reset Filters
                </button>
              )}
            </div>
          )}

          {/* FAQ Accordion List (all 13 questions) */}
          {filteredFaqs.length > 0 ? (
            <FAQAccordion items={filteredFaqs} defaultOpenFirst={!searchQuery} />
          ) : (
            <div className="p-10 text-center rounded-3xl bg-white border border-stone-200 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
                <HelpCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-stone-800">
                No matching traveller questions found
              </h3>
              <p className="text-xs sm:text-sm text-stone-500 max-w-sm mx-auto">
                We couldn&apos;t find any traveller questions matching &ldquo;{searchQuery}&rdquo;.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setActiveCategory("All");
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#006F66] hover:bg-[#00554E] transition-colors"
              >
                Clear Search &amp; Show All 13 FAQs
              </button>
            </div>
          )}

          {/* Discover Properties CTA */}
          <div className="mt-12 p-6 sm:p-8 rounded-3xl bg-white border border-stone-200/90 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-1.5 text-center sm:text-left">
              <span className="text-[11px] font-bold text-[#006F66] uppercase tracking-wider">
                Plan Your Journey
              </span>
              <h4 className="text-lg sm:text-xl font-bold text-stone-900">
                Find your perfect holiday villa or palace stay
              </h4>
              <p className="text-xs sm:text-sm text-stone-500 max-w-md">
                Browse handpicked luxury stays, connect directly with hosts, and enjoy transparent pricing without booking commissions.
              </p>
            </div>

            <Link
              href="/#handpicked"
              className="px-6 py-3.5 rounded-xl bg-[#006F66] hover:bg-[#00554E] text-white font-bold text-xs sm:text-sm transition-all shadow-md shadow-[#006F66]/20 flex items-center gap-2 whitespace-nowrap shrink-0"
            >
              <span>Explore Curated Stays</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </main>

      <Footer />

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </div>
  );
}

