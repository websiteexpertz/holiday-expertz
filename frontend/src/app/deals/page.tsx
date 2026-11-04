"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AuthModal from "@/components/layout/AuthModal";
import { mockDeals } from "@/data/deals";
import { Deal } from "@/types/hotel";
import { apiUrl } from "@/lib/apiUrl";
import {
  Sparkles,
  Tag,
  Copy,
  Check,
  Clock,
  ShieldCheck,
  Search,
  Gift,
  Percent,
  X,
  Compass,
} from "lucide-react";

interface ApiDealItem {
  id: string;
  title: string;
  description: string;
  applicableCategory?: string;
  discountType?: "percentage" | "fixed" | string;
  discountValue?: number;
  featured?: boolean;
  endDate?: string;
  promoImage?: string;
}

export default function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>(mockDeals);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [activeDealModal, setActiveDealModal] = useState<Deal | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);

  // Fetch live deals from public API if available, fallback to mockDeals
  useEffect(() => {
    let isMounted = true;
    async function fetchLiveDeals() {
      try {
        const res = await fetch(apiUrl("/api/public/deals"));
        if (!res.ok) return;

        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) return;

        const data = await res.json();
        if (!isMounted) return;

        if (data.success && Array.isArray(data.deals) && data.deals.length > 0) {
          // Transform backend deal format to Deal type if needed
          const transformed: Deal[] = data.deals.map((d: ApiDealItem) => ({
            id: d.id,
            title: d.title,
            subtitle: d.applicableCategory || "Exclusive Offer",
            description: d.description,
            discountText:
              d.discountType === "percentage"
                ? `${d.discountValue}% OFF`
                : `Save ₹${Number(d.discountValue).toLocaleString("en-IN")} Flat`,
            badge: d.featured ? "Featured Deal" : "Limited Period",
            validTill: d.endDate ? `Valid till ${new Date(d.endDate).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}` : "Limited seasonal availability",
            image: d.promoImage || "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80",
            highlightColor: d.discountType === "percentage" ? "teal" : "amber",
          }));
          setDeals(transformed);
        }
      } catch (err) {
        console.warn("Using curated fallback deals:", err);
      }
    }

    fetchLiveDeals();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleCopyCode = (code: string) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2500);
    }
  };

  const categories = [
    "All",
    "Weekend Getaways",
    "Luxury Stay Offers",
    "Family Holiday Packages",
    "Romantic Escapes",
    "Workation",
  ];

  const filteredDeals = deals.filter((deal) => {
    const matchesCategory =
      selectedCategory === "All" ||
      deal.title.toLowerCase().includes(selectedCategory.toLowerCase()) ||
      deal.subtitle.toLowerCase().includes(selectedCategory.toLowerCase());

    const matchesSearch =
      !searchQuery.trim() ||
      deal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deal.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deal.discountText.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6] text-[#172B2A]">
      {/* Navigation Header */}
      <Header onOpenAuthModal={() => setAuthModalOpen(true)} />

      <main className="flex-1">
        {/* Hero Banner Section */}
        <section className="relative pt-32 sm:pt-40 pb-16 sm:pb-20 bg-[#071f1d] text-white overflow-hidden">
          {/* Subtle Ambient Background Gradients */}
          <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
            <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#009F8D] blur-3xl" />
            <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-[#E58A18] blur-3xl" />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            {/* Eyebrow Accent */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-amber-300 text-xs font-bold uppercase tracking-[0.2em] mb-4 sm:mb-6">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>HolidayExpertz • Exclusive Deals & Packages</span>
            </div>

            {/* Headline */}
            <h1 className="font-editorial-serif text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-4 sm:mb-6 leading-[1.12]">
              Curated deals & seasonal privileges.
            </h1>

            {/* Description */}
            <p className="font-editorial-sans text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed mb-8">
              Unlock exceptional value on premier resorts, palace retreats, and private villas. Enjoy complimentary daily breakfast, guaranteed spa credits, and flexible stay perks.
            </p>

            {/* Search Bar within Hero */}
            <div className="max-w-md mx-auto relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search deals by holiday type, offer, or stay..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/10 hover:bg-white/15 focus:bg-white text-white focus:text-[#172B2A] placeholder:text-slate-400 text-sm pl-11 pr-4 py-3 rounded-full border border-white/20 focus:outline-none focus:ring-2 focus:ring-[#009F8D] transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Filter Tabs & Content Section */}
        <section className="py-12 sm:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 sm:mb-12 scrollbar-none">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  selectedCategory === category
                    ? "bg-[#0b192c] text-white shadow-md"
                    : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Deals Grid */}
          {filteredDeals.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {filteredDeals.map((deal, idx) => {
                const couponCode = `HOLIDAY${(idx + 1) * 10}`;
                const isCopied = copiedCode === couponCode;

                return (
                  <div
                    key={deal.id}
                    className="group bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col"
                  >
                    {/* Deal Image with Discount Pill */}
                    <div className="relative h-56 w-full overflow-hidden bg-slate-900">
                      <Image
                        src={deal.image}
                        alt={deal.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                      {/* Top Badges */}
                      <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between">
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#E58A18] text-white shadow-md">
                          {deal.discountText}
                        </span>
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-black/60 backdrop-blur-md text-white border border-white/20">
                          {deal.badge}
                        </span>
                      </div>

                      {/* Validity at bottom of image */}
                      <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-xs text-white/90 font-medium">
                        <Clock className="w-3.5 h-3.5 text-amber-300" />
                        <span>{deal.validTill}</span>
                      </div>
                    </div>

                    {/* Deal Content */}
                    <div className="p-6 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wider text-[#006F66] mb-1">
                          {deal.subtitle}
                        </div>
                        <h3 className="font-editorial-serif text-xl sm:text-2xl font-bold text-[#0b192c] mb-2.5 group-hover:text-[#009F8D] transition-colors">
                          {deal.title}
                        </h3>
                        <p className="font-editorial-sans text-sm text-slate-600 leading-relaxed mb-4">
                          {deal.description}
                        </p>

                        {/* Package Inclusions Preview */}
                        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 mb-5 space-y-1.5">
                          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            Included Privileges:
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-slate-700">
                            <Check className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
                            <span>Complimentary chef-curated daily breakfast</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-slate-700">
                            <Check className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
                            <span>Early check-in & late 3:00 PM check-out</span>
                          </div>
                        </div>
                      </div>

                      {/* Coupon Code & Actions */}
                      <div className="pt-2 border-t border-slate-100 space-y-3">
                        <div className="flex items-center justify-between bg-amber-50/80 border border-dashed border-amber-300 rounded-xl px-3.5 py-2">
                          <div className="flex items-center gap-2">
                            <Tag className="w-4 h-4 text-[#D97706]" />
                            <span className="font-mono font-bold text-xs text-slate-800">
                              {couponCode}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopyCode(couponCode)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-[#D97706] hover:text-[#B45309] transition-colors cursor-pointer"
                          >
                            {isCopied ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-emerald-700">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <Link
                            href="/properties"
                            className="flex-1 py-2.5 px-4 bg-[#0b192c] hover:bg-[#009F8D] text-white text-xs font-semibold rounded-xl text-center transition-colors shadow-xs"
                          >
                            Browse Matching Stays
                          </Link>
                          <button
                            type="button"
                            onClick={() => setActiveDealModal(deal)}
                            className="py-2.5 px-3 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                          >
                            Details
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8">
              <Gift className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-[#0b192c] mb-1">No deals match your search</h3>
              <p className="text-sm text-slate-500 mb-4">
                Try selecting a different category or clearing your search term.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory("All");
                  setSearchQuery("");
                }}
                className="px-5 py-2.5 rounded-full bg-[#0b192c] text-white text-xs font-semibold hover:bg-[#009F8D] transition-colors"
              >
                Reset All Filters
              </button>
            </div>
          )}
        </section>

        {/* Why Book With Us Banner */}
        <section className="bg-white border-t border-slate-200 py-12 sm:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div className="p-4">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center mx-auto mb-3 text-[#009F8D]">
                  <Percent className="w-6 h-6" />
                </div>
                <h4 className="font-editorial-serif font-bold text-lg text-[#0b192c] mb-1.5">
                  Best Rate Guarantee
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Transparent direct rates with zero hidden charges or booking convenience fees.
                </p>
              </div>

              <div className="p-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-3 text-[#D97706]">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h4 className="font-editorial-serif font-bold text-lg text-[#0b192c] mb-1.5">
                  Audited & Curated Stays
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Every property is personally vetted for hygiene, architecture, and hospitality.
                </p>
              </div>

              <div className="p-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-3 text-emerald-600">
                  <Compass className="w-6 h-6" />
                </div>
                <h4 className="font-editorial-serif font-bold text-lg text-[#0b192c] mb-1.5">
                  Dedicated Concierge
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Our specialists are ready 24/7 to personalize itineraries and arrival transfers.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer />

      {/* Auth Modal */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />

      {/* Deal Detail Modal */}
      {activeDealModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                {activeDealModal.discountText}
              </span>
              <button
                type="button"
                onClick={() => setActiveDealModal(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative h-44 w-full rounded-2xl overflow-hidden bg-slate-900">
              <Image
                src={activeDealModal.image}
                alt={activeDealModal.title}
                fill
                className="object-cover"
              />
            </div>

            <div>
              <h3 className="font-editorial-serif text-2xl font-bold text-[#0b192c] mb-1">
                {activeDealModal.title}
              </h3>
              <p className="text-xs text-[#006F66] font-semibold mb-2">
                {activeDealModal.subtitle}
              </p>
              <p className="text-sm text-slate-600 leading-relaxed">
                {activeDealModal.description}
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs text-slate-700">
              <p className="font-bold text-slate-900">Privileges & Package Perks Included:</p>
              <ul className="space-y-1 text-slate-600">
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
                  <span>Complimentary chef-curated buffet breakfast daily</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
                  <span>Priority early check-in and guaranteed late check-out</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
                  <span>₹2,500 resort dining or wellness spa credit per stay</span>
                </li>
              </ul>
            </div>

            <div className="pt-2 flex gap-3">
              <Link
                href="/properties"
                onClick={() => setActiveDealModal(null)}
                className="flex-1 py-3 bg-[#0b192c] hover:bg-[#009F8D] text-white font-bold text-sm text-center rounded-xl transition-colors shadow-md"
              >
                Browse Matching Stays
              </Link>
              <button
                type="button"
                onClick={() => setActiveDealModal(null)}
                className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
