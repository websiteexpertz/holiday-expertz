"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Building2,
  Compass,
  ArrowRight,
  HelpCircle,
  ShieldCheck,
  Sparkles,
  X,
  MessageSquare,
  ChevronRight,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AuthModal from "@/components/layout/AuthModal";
import FAQAccordion from "@/components/faq/FAQAccordion";
import { propertyOwnerFaqs, travellerFaqs, FAQItem } from "@/data/faqData";

export default function FAQCentralPage() {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const allFaqs = useMemo(() => {
    return [...travellerFaqs, ...propertyOwnerFaqs];
  }, []);

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];

    return allFaqs.filter((item) => {
      const matchQ = item.question.toLowerCase().includes(q);
      const matchP = item.paragraphs.some((p) => p.toLowerCase().includes(q));
      const matchB = item.bulletPoints?.some((b) => b.toLowerCase().includes(q));
      const matchN = item.numberedList?.some((n) => n.toLowerCase().includes(q));
      const matchW = item.warningBox?.text.toLowerCase().includes(q);
      return matchQ || matchP || matchB || matchN || matchW;
    });
  }, [searchQuery, allFaqs]);

  // Featured sample questions for the landing page
  const featuredQuestions = useMemo(() => {
    return [
      travellerFaqs[0], // How does Holiday Expertz work?
      travellerFaqs[1], // Do I have to pay any commission?
      propertyOwnerFaqs[0], // What documents are required?
      propertyOwnerFaqs[2], // Can I synchronize calendars?
    ];
  }, []);

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-stone-900 flex flex-col font-sans selection:bg-[#006F66] selection:text-white">
      <Header onOpenAuthModal={() => setAuthModalOpen(true)} />

      <main className="flex-1">
        {/* Deep Forest-Green Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-[#06241C] via-[#0A3328] to-[#0D3E31] text-white pt-24 sm:pt-28 pb-16 sm:pb-20 px-4 sm:px-6 lg:px-8 shadow-inner">
          {/* Subtle Ambient Decorative Circles */}
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#009F8D]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-10 w-80 h-80 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative max-w-4xl mx-auto text-center space-y-6">
            {/* Small Label / Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[#E6F4F1] text-[11px] sm:text-xs font-bold tracking-[0.18em] uppercase">
              <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>HOLIDAY EXPERTZ · HELP CENTRE</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white font-editorial-sans">
              Frequently Asked Questions
            </h1>

            {/* Approved Introductory Description */}
            <p className="max-w-2xl mx-auto text-sm sm:text-base md:text-lg text-[#C8E1DB] font-light leading-relaxed">
              Everything you need to know about discovering exceptional stays and listing your property with Holiday Expertz.
            </p>

            {/* Live Search Input */}
            <div className="max-w-2xl mx-auto pt-2">
              <div className="relative flex items-center">
                <Search className="w-5 h-5 text-stone-400 absolute left-4 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search questions by topic, keyword, or policy..."
                  className="w-full pl-12 pr-10 py-4 rounded-2xl bg-white text-stone-900 placeholder:text-stone-400 text-sm sm:text-base font-medium shadow-xl shadow-black/20 focus:outline-none focus:ring-3 focus:ring-[#009F8D] transition-all border border-white/20"
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

        {/* Content Section */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          {/* SEARCH ACTIVE STATE */}
          {searchQuery.trim() !== "" ? (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-stone-200">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-stone-900">
                    Search Results for &ldquo;{searchQuery}&rdquo;
                  </h2>
                  <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
                    Found {searchResults.length} {searchResults.length === 1 ? "answer" : "answers"} across Help Centre
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-[#006F66] bg-[#006F66]/10 hover:bg-[#006F66]/15 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Clear Search</span>
                </button>
              </div>

              {searchResults.length > 0 ? (
                <div className="space-y-4">
                  <FAQAccordion items={searchResults} defaultOpenFirst={true} />
                </div>
              ) : (
                <div className="p-8 sm:p-12 text-center rounded-3xl bg-white border border-stone-200/90 shadow-sm space-y-4 max-w-xl mx-auto">
                  <div className="w-12 h-12 rounded-2xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
                    <HelpCircle className="w-6 h-6" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-stone-800">
                    No matching questions found
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-500 max-w-md mx-auto">
                    We couldn&apos;t find any FAQs matching &ldquo;{searchQuery}&rdquo;. Try another search term or explore our dedicated audience sections below.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-white bg-[#006F66] hover:bg-[#00554E] transition-colors"
                  >
                    <span>View All Questions</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* DEFAULT LANDING VIEW: Two Prominent Audience Cards */
            <div className="space-y-16">
              <div>
                <div className="text-center space-y-2 mb-10">
                  <h2 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
                    Choose Your Help Centre
                  </h2>
                  <p className="text-xs sm:text-sm text-stone-600 max-w-lg mx-auto">
                    Select your journey to access tailored guidance, policies, and answers designed for you.
                  </p>
                </div>

                {/* 2 Audience Cards: 2-column on desktop, stacked on mobile */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                  {/* Card 1: For Property Owners */}
                  <Link
                    href="/faq/property-owners"
                    className="group relative flex flex-col justify-between p-6 sm:p-8 rounded-3xl bg-white border border-stone-200/90 shadow-sm hover:shadow-xl hover:border-[#006F66]/40 transition-all duration-300 transform hover:-translate-y-1"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0B2E24] to-[#006F66] text-white flex items-center justify-center shadow-md shadow-[#006F66]/20 group-hover:scale-105 transition-transform">
                          <Building2 className="w-7 h-7" />
                        </div>
                        <span className="text-[11px] font-bold tracking-wider uppercase px-3 py-1 rounded-full bg-[#006F66]/10 text-[#006F66]">
                          Hosts &amp; Owners
                        </span>
                      </div>

                      <div className="space-y-2">
                        <h3 className="text-xl sm:text-2xl font-black text-stone-900 group-hover:text-[#006F66] transition-colors">
                          For Property Owners
                        </h3>
                        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                          Everything hosts need to know about listing havelis and villas, onboarding documents, two-way calendar synchronisation, partner plans, and direct guest payouts.
                        </p>
                      </div>

                      <div className="pt-2 flex flex-wrap gap-2 text-[11px] font-medium text-stone-500">
                        <span className="px-2.5 py-1 rounded-lg bg-stone-100">Document Requirements</span>
                        <span className="px-2.5 py-1 rounded-lg bg-stone-100">Calendar Sync</span>
                        <span className="px-2.5 py-1 rounded-lg bg-stone-100">24-48h Payouts</span>
                      </div>
                    </div>

                    <div className="pt-6 mt-6 border-t border-stone-100 flex items-center justify-between font-bold text-xs sm:text-sm text-[#006F66]">
                      <span>View All Owner FAQs</span>
                      <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1.5 transition-transform" />
                    </div>
                  </Link>

                  {/* Card 2: For Travellers */}
                  <Link
                    href="/faq/travellers"
                    className="group relative flex flex-col justify-between p-6 sm:p-8 rounded-3xl bg-white border border-stone-200/90 shadow-sm hover:shadow-xl hover:border-[#006F66]/40 transition-all duration-300 transform hover:-translate-y-1"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#006F66] to-[#009F8D] text-white flex items-center justify-center shadow-md shadow-[#009F8D]/20 group-hover:scale-105 transition-transform">
                          <Compass className="w-7 h-7" />
                        </div>
                        <span className="text-[11px] font-bold tracking-wider uppercase px-3 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                          Guests &amp; Families
                        </span>
                      </div>

                      <div className="space-y-2">
                        <h3 className="text-xl sm:text-2xl font-black text-stone-900 group-hover:text-[#006F66] transition-colors">
                          For Travellers
                        </h3>
                        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                          Discover how Holiday Expertz works, direct commission-free booking policies, critical payment precautions, saving favourites, and connecting directly with verified hosts.
                        </p>
                      </div>

                      <div className="pt-2 flex flex-wrap gap-2 text-[11px] font-medium text-stone-500">
                        <span className="px-2.5 py-1 rounded-lg bg-stone-100">0% Commission</span>
                        <span className="px-2.5 py-1 rounded-lg bg-stone-100">Direct Host Contact</span>
                        <span className="px-2.5 py-1 rounded-lg bg-stone-100">Safe Payments</span>
                      </div>
                    </div>

                    <div className="pt-6 mt-6 border-t border-stone-100 flex items-center justify-between font-bold text-xs sm:text-sm text-[#006F66]">
                      <span>View All 13 Traveller FAQs</span>
                      <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1.5 transition-transform" />
                    </div>
                  </Link>
                </div>
              </div>

              {/* Popular Questions Overview */}
              <div className="space-y-6 pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-stone-900">
                      Frequently Explored Topics
                    </h3>
                    <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
                      Quick answers to our most popular questions
                    </p>
                  </div>
                </div>

                <FAQAccordion items={featuredQuestions} />
              </div>

              {/* Dedicated Concierge Support Banner */}
              <div className="rounded-3xl bg-gradient-to-r from-[#06241C] to-[#0A3B2F] text-white p-6 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg">
                <div className="space-y-2 text-center md:text-left">
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#D4AF37] uppercase tracking-wider">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Personalized Concierge Assistance</span>
                  </div>
                  <h4 className="text-xl sm:text-2xl font-black text-white">
                    Need additional guidance regarding your trip or listing?
                  </h4>
                  <p className="text-xs sm:text-sm text-[#C8E1DB] max-w-xl">
                    Our luxury support specialists are available 7 days a week to assist property owners and discerning travellers with bespoke enquiries.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full sm:w-auto">
                  <Link
                    href="/subscription#owner-registration"
                    className="w-full sm:w-auto px-5 py-3 rounded-xl bg-[#D4AF37] hover:bg-[#c5a230] text-stone-950 font-bold text-xs sm:text-sm transition-colors text-center shadow-md shadow-black/20"
                  >
                    List Your Property
                  </Link>
                  <a
                    href="mailto:support@holidayexpertz.com"
                    className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs sm:text-sm transition-colors text-center border border-white/20"
                  >
                    Email Support
                  </a>
                </div>
              </div>
            </div>
          )}
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

