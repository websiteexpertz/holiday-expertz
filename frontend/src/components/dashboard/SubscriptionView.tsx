"use client";

import React from "react";
import {
  ShieldCheck,
  Sparkles,
  Headphones,
  Check,
} from "lucide-react";

export default function SubscriptionView() {

  const TIERS = [
    {
      name: "Standard Host",
      price: "Free",
      period: "Forever",
      commission: "10% per booking",
      current: false,
      features: [
        "Up to 2 Property Listings",
        "Standard Search Placement",
        "Direct Guest Inquiries",
        "Standard Email Support",
      ],
    },
    {
      name: "Verified Partner",
      price: "Active Plan",
      period: "Exclusive Partner",
      commission: "5% per booking",
      current: true,
      popular: true,
      features: [
        "Unlimited Property Listings",
        "Verified Host Badge on Public Showcase",
        "Priority Search Ranking",
        "Direct Guest Contact & WhatsApp",
        "Fast 24h Curation Audits",
        "24/7 Dedicated Partner Concierge",
      ],
    },
    {
      name: "Boutique Collection",
      price: "By Invitation",
      period: "Heritage & 5-Star",
      commission: "Custom Rate",
      current: false,
      features: [
        "Everything in Verified Partner",
        "Professional Drone & Photography Shoot",
        "Homepage Hero Feature Placement",
        "Dedicated Account Executive",
        "Traveler Concierge Upsell Integration",
      ],
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      {/* ── HEADER ── */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Subscription & Partner Plan
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Review your host tier, commission structure, and platform privileges.
        </p>
      </div>

      {/* ── ACTIVE PLAN SUMMARY BANNER ── */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-teal-900 via-slate-900 to-slate-950 text-white p-6 sm:p-8 border border-teal-500/30 shadow-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold border border-teal-500/30">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
              Active Subscription
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              Verified Property Partner Plan
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Your property account is fully activated. You enjoy our lowest commission rate (5%), unlimited listings, verified badge trust, and priority customer service.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-center shrink-0 min-w-[200px]">
            <span className="text-xs text-teal-200 uppercase font-bold tracking-wider">
              Commission Fee
            </span>
            <div className="text-3xl font-black text-white my-1">5%</div>
            <span className="text-[11px] text-slate-300">Only on confirmed stays</span>
          </div>
        </div>
      </div>

      {/* ── TIERS COMPARISON ── */}
      <div>
        <div className="text-center max-w-xl mx-auto mb-8">
          <h3 className="text-xl font-black text-slate-900 tracking-tight">
            HolidayExpertz Host Tiers
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Designed to help independent luxury hosts and boutique hotels scale seamlessly.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`rounded-3xl p-6 sm:p-7 flex flex-col justify-between border transition-all ${
                tier.popular
                  ? "bg-white border-teal-600 shadow-xl ring-2 ring-teal-600/20 relative"
                  : "bg-white border-slate-200/80 shadow-xs"
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-teal-600 text-white text-[10px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>Current Host Tier</span>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <h4 className="text-base font-bold text-slate-900">{tier.name}</h4>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-2xl font-black text-slate-900">{tier.price}</span>
                    <span className="text-xs text-slate-400">/ {tier.period}</span>
                  </div>
                  <div className="text-xs font-semibold text-teal-700 mt-1">{tier.commission}</div>
                </div>

                <div className="pt-4 border-t border-slate-100 space-y-2.5">
                  {tier.features.map((feat, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-slate-600">
                      <Check className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-100">
                {tier.current ? (
                  <button
                    disabled
                    className="w-full py-2.5 bg-teal-50 text-teal-800 font-bold text-xs rounded-xl border border-teal-200 cursor-default"
                  >
                    Active Plan
                  </button>
                ) : (
                  <button
                    onClick={() =>
                      alert("To modify your host tier, please speak with your dedicated partner executive.")
                    }
                    className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors"
                  >
                    Contact Concierge
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── CONCIERGE SUPPORT ── */}
      <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
            <Headphones className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">Partner Help & Billing Support</h4>
            <p className="text-xs text-slate-500">
              Need assistance with payment settlements, guest disputes, or calendar sync?
            </p>
          </div>
        </div>

        <a
          href="mailto:partners@holidayexpertz.sample"
          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all shadow-xs shrink-0"
        >
          Email Partner Support
        </a>
      </div>
    </div>
  );
}
