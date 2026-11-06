"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Header from "@frontend/components/layout/Header";
import Footer from "@frontend/components/layout/Footer";
import AuthModal from "@frontend/components/layout/AuthModal";
import OwnerRegistrationForm from "@frontend/components/subscription/OwnerRegistrationForm";
import {
  Sparkles,
  CheckCircle2,
  Building2,
  ShieldCheck,
  TrendingUp,
  Headphones,
  Award,
  ArrowRight,
  HelpCircle,
  Loader2,
} from "lucide-react";

export default function SubscriptionPage() {
  const router = useRouter();
  const { isAuthenticated, owner, isLoading } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalRole, setAuthModalRole] = useState<"owner" | "traveller">("owner");
  const [selectedPlan, setSelectedPlan] = useState<string>("verified");

  useEffect(() => {
    if (!isLoading && isAuthenticated && owner) {
      router.replace("/dashboard/properties/new");
    }
  }, [isLoading, isAuthenticated, owner, router]);

  const scrollToRegistration = () => {
    const formElement = document.getElementById("owner-registration");
    if (formElement) {
      formElement.scrollIntoView({ behavior: "smooth" });
    }
  };

  if (!isLoading && isAuthenticated && owner) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-4">
        <Loader2 className="w-8 h-8 text-teal-400 animate-spin mb-4" />
        <h2 className="text-lg font-bold">Redirecting to Owner Portal...</h2>
        <p className="text-xs text-slate-400 mt-1">You are already signed in. Taking you to List Your Property.</p>
      </div>
    );
  }

  const partnerPlans = [
    {
      id: "starter",
      name: "Starter Host",
      badge: "Zero Risk",
      price: "₹0",
      period: "No upfront fees",
      description: "Ideal for boutique homestays and individual holiday homes exploring curated travel demand.",
      commission: "10% per confirmed booking",
      features: [
        "Instant listing on HolidayExpertz platform",
        "Verified traveler review system",
        "Standard payout within 48h of check-in",
        "Automated booking notification alerts",
        "Digital host calendar & reservations",
      ],
      popular: false,
      cta: "Select Starter Plan",
    },
    {
      id: "verified",
      name: "Verified Luxury Partner",
      badge: "Most Popular",
      price: "₹4,999",
      period: "per year",
      description: "Our signature tier for premier heritage havelis, beachfront villas, and 4-star boutique hotels.",
      commission: "Reduced 5% per confirmed booking",
      features: [
        "Verified Quality Seal & Audit Badge",
        "Priority placement in Handpicked Properties",
        "Professional property photography audit",
        "24/7 dedicated Host Success Manager",
        "Direct payouts within 24h of check-in",
        "Featured inclusion in seasonal deal campaigns",
      ],
      popular: true,
      cta: "Choose Verified Partner",
    },
    {
      id: "elite",
      name: "Elite Estate Collection",
      badge: "Maximum Visibility",
      price: "₹14,999",
      period: "per year",
      description: "Designed for iconic palace stays, luxury private estates, and 5-star experiential resorts.",
      commission: "0% commission on direct bookings",
      features: [
        "Homepage Featured Hero & Carousel spotlight",
        "0% commission on first 50 direct bookings",
        "Custom drone video & cinematic showcase",
        "Full Channel Manager / PMS synchronization",
        "VIP guest screening and personalized care",
        "Complimentary featured stories in Travel Blog",
      ],
      popular: false,
      cta: "Join Elite Collection",
    },
  ];

  const benefits = [
    {
      icon: TrendingUp,
      title: "High-Intent Leisure Guests",
      description: "Reach discerning families, couples, and premium corporate travelers who stay longer and spend more.",
    },
    {
      icon: ShieldCheck,
      title: "Audited & Verified Stays",
      description: "Our quality badge distinguishes your property from ordinary mass-market booking platforms.",
    },
    {
      icon: Headphones,
      title: "24/7 Dedicated Partner Care",
      description: "Always speak with a knowledgeable relationship executive dedicated to your occupancy and revenue.",
    },
    {
      icon: Award,
      title: "Guaranteed Swift Payouts",
      description: "Direct bank transfers within 24–48 hours of guest check-in with zero hidden deductions.",
    },
  ];

  const faqs = [
    {
      q: "What documents are required to register my property?",
      a: "To register as a property owner, simply complete the sign-up form with your name, mobile, and email. Once registered, you will be prompted to submit your property photos, address proof, and GSTIN/bank details for payout verification.",
    },
    {
      q: "How soon will my property be live on HolidayExpertz?",
      a: "Our curation team audits and approves property submissions within 24 to 48 business hours. Once verified, your hotel or villa appears live across our search and category carousels.",
    },
    {
      q: "Can I synchronize my existing reservations and calendars?",
      a: "Yes! HolidayExpertz supports standard iCal calendar synchronization and Channel Manager integrations (e.g. Staah, SiteMinder) for automated availability updates.",
    },
    {
      q: "When and how do I receive guest payouts?",
      a: "Payouts are transferred directly to your registered bank account via NEFT/RTGS within 24–48 hours after guest check-in.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Navigation Header */}
      <Header onOpenAuthModal={() => setAuthModalOpen(true)} />

      <main className="flex-1 pt-[76px]">
        {/* Hero Section */}
        <section className="relative py-16 sm:py-24 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white overflow-hidden">
          {/* Subtle Background Glows */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
              {/* Left Column: Headline & Partner Value Prop */}
              <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-500/10 border border-teal-400/30 text-teal-300 text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Partner with HolidayExpertz</span>
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
                  List Your Property. <br className="hidden sm:inline" />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-emerald-300 to-amber-300">
                    Host Discerning Travelers.
                  </span>
                </h1>

                <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl mx-auto lg:mx-0">
                  Join India’s most curated collection of luxury resorts, palace havelis, and private villas. Enjoy premium guest bookings, transparent partner fees, and dedicated hospitality assistance.
                </p>

                <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs sm:text-sm text-slate-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 flex-shrink-0" />
                    <span>0% Setup Fee</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 flex-shrink-0" />
                    <span>Direct Bank Payouts</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 flex-shrink-0" />
                    <span>Verified Guest Network</span>
                  </div>
                </div>

                <div className="pt-4 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
                  <button
                    type="button"
                    onClick={scrollToRegistration}
                    className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-teal-500/25 active:scale-95 inline-flex items-center justify-center gap-2"
                  >
                    <span>Register Your Property Now</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <a
                    href="#plans"
                    className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-sm transition-all text-center"
                  >
                    Explore Partner Plans
                  </a>
                </div>
              </div>

              {/* Right Column: Prominent Owner Registration Form */}
              <div id="owner-registration" className="lg:col-span-6 scroll-mt-24">
                <OwnerRegistrationForm
                  onOpenSignIn={() => {
                    setAuthModalRole("owner");
                    setAuthModalOpen(true);
                  }}
                  onRegistrationSuccess={() => {
                    // Registration success state handled inside form
                  }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Grid */}
        <section className="py-16 sm:py-20 bg-white border-b border-slate-200/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto space-y-3 mb-12 sm:mb-16">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold uppercase tracking-wider">
                <Building2 className="w-3.5 h-3.5 text-teal-600" />
                <span>Why Host With Us</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Designed for Ambitious Hoteliers & Estate Owners
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                We empower boutique and luxury properties with premium visibility, honest commissions, and reliable travelers.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {benefits.map((benefit) => {
                const IconComponent = benefit.icon;
                return (
                  <div
                    key={benefit.title}
                    className="p-6 rounded-3xl bg-slate-50 border border-slate-200/80 hover:border-teal-300 hover:shadow-lg transition-all duration-300 space-y-3"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 text-teal-600 flex items-center justify-center shadow-sm">
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900">
                      {benefit.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {benefit.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Subscription & Partner Plans Section */}
        <section id="plans" className="py-16 sm:py-24 bg-slate-50 border-b border-slate-200/80 scroll-mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto space-y-3 mb-12 sm:mb-16">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Transparent Partner Tiers</span>
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
                Choose the Ideal Plan for Your Property
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Simple, predictable partnership options. Upgrade, switch, or customize anytime with zero lock-in contracts.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-stretch">
              {partnerPlans.map((plan) => (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 cursor-pointer relative ${
                    plan.popular
                      ? "bg-slate-900 text-white shadow-2xl ring-2 ring-teal-500 scale-[1.02] lg:-translate-y-2"
                      : selectedPlan === plan.id
                      ? "bg-white text-slate-900 shadow-xl border-2 border-teal-500"
                      : "bg-white text-slate-900 shadow-md border border-slate-200/90 hover:shadow-xl"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
                      <span className="px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md">
                        {plan.badge}
                      </span>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-black">{plan.name}</h3>
                      {!plan.popular && (
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                          {plan.badge}
                        </span>
                      )}
                    </div>

                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl sm:text-4xl font-black">{plan.price}</span>
                      <span className={`text-xs ${plan.popular ? "text-slate-300" : "text-slate-500"}`}>
                        {plan.period}
                      </span>
                    </div>

                    <p className={`text-xs sm:text-sm leading-relaxed ${plan.popular ? "text-slate-300" : "text-slate-600"}`}>
                      {plan.description}
                    </p>

                    <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                      plan.popular ? "bg-white/10 text-teal-300" : "bg-teal-50 text-teal-800 border border-teal-200/60"
                    }`}>
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                      <span>Commission: {plan.commission}</span>
                    </div>

                    <div className="pt-2 border-t border-slate-200/20 space-y-2.5">
                      <p className="text-xs font-bold uppercase tracking-wider opacity-80">
                        Included Features:
                      </p>
                      <ul className="space-y-2 text-xs sm:text-sm">
                        {plan.features.map((feature) => (
                          <li key={feature} className="flex items-start gap-2">
                            <CheckCircle2
                              className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                                plan.popular ? "text-teal-400" : "text-teal-600"
                              }`}
                            />
                            <span className={plan.popular ? "text-slate-200" : "text-slate-700"}>
                              {feature}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="pt-6">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        scrollToRegistration();
                      }}
                      className={`w-full py-3.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm active:scale-95 flex items-center justify-center gap-1.5 ${
                        plan.popular
                          ? "bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-teal-500/30"
                          : "bg-slate-900 hover:bg-teal-600 text-white"
                      }`}
                    >
                      <span>{plan.cta}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQs for Property Owners */}
        <section className="py-16 sm:py-20 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-bold uppercase tracking-wider">
                <HelpCircle className="w-3.5 h-3.5 text-slate-600" />
                <span>Frequently Asked Questions</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Everything You Need to Know About Listing
              </h2>
            </div>

            <div className="space-y-4">
              {faqs.map((faq) => (
                <div
                  key={faq.q}
                  className="p-5 sm:p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-2"
                >
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    {faq.q}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>

            <div className="pt-2 text-center">
              <Link
                href="/faq/property-owners"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-[#006F66] text-white text-xs sm:text-sm font-bold transition-all shadow-sm"
              >
                <span>View All Property Owner FAQs</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer />

      {/* Auth / Sign In Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialRole={authModalRole}
      />
    </div>
  );
}
