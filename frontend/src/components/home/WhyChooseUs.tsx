"use client";

import React from "react";
import { ShieldCheck, Sparkles, Headphones, Compass } from "lucide-react";

export default function WhyChooseUs() {
  const pillars = [
    {
      icon: ShieldCheck,
      number: "01",
      title: "Trusted Stays",
      description:
        "Every property is individually audited for cleanliness, architectural integrity, and authentic hospitality before joining our collection.",
    },
    {
      icon: Sparkles,
      number: "02",
      title: "Handpicked Selection",
      description:
        "Strict editorial curation ensures each villa, palace, and mountain lodge offers distinct charm and extraordinary comfort.",
    },
    {
      icon: Headphones,
      number: "03",
      title: "Dedicated Support",
      description:
        "Personal holiday specialists ready to assist with bespoke itineraries, custom arrival transfers, and local guidance.",
    },
    {
      icon: Compass,
      number: "04",
      title: "Better Travel",
      description:
        "Transparent direct pricing with zero hidden surcharges, flexible stay policies, and secure reservation verification.",
    },
  ];

  return (
    <section
      id="about"
      aria-label="Why Choose HolidayExpertz"
      className="pt-12 sm:pt-16 lg:pt-18 pb-6 sm:pb-8 lg:pb-10 bg-[#FAF9F6] border-b border-[#E8EAE5]/60"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Editorial Section Header */}
        <div className="max-w-3xl mb-14 sm:mb-16 space-y-3">
          <div className="inline-flex items-center gap-2 text-[#006F66] text-xs font-bold uppercase tracking-[0.18em] font-editorial-sans">
            <span className="w-6 h-px bg-[#009F8D]" />
            <span>The HolidayExpertz Philosophy</span>
          </div>
          <h2 className="font-editorial-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#172B2A] tracking-tight leading-[1.12]">
            Thoughtful hospitality. <br />
            <span className="italic font-light text-[#006F66]">Crafted for the discerning traveler.</span>
          </h2>
        </div>

        {/* 4 Editorial Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-7">
          {pillars.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div
                key={pillar.title}
                className="group relative bg-white p-7 sm:p-8 rounded-2xl border border-[#E8EAE5] hover:border-[#009F8D]/40 shadow-[0_2px_8px_rgba(23,43,42,0.03)] hover:shadow-[0_8px_24px_rgba(23,43,42,0.06)] transition-all duration-300 ease-editorial flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-11 h-11 rounded-xl bg-[#E7F6F3] text-[#006F66] flex items-center justify-center group-hover:bg-[#009F8D] group-hover:text-white transition-colors duration-300">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="font-editorial-serif text-base italic text-[#697875]/60 group-hover:text-[#009F8D] transition-colors">
                      {pillar.number}
                    </span>
                  </div>

                  <h3 className="font-editorial-sans text-base font-bold text-[#172B2A] mb-2 group-hover:text-[#006F66] transition-colors">
                    {pillar.title}
                  </h3>
                  <p className="font-editorial-sans text-xs sm:text-[13px] text-[#697875] leading-relaxed">
                    {pillar.description}
                  </p>
                </div>

                <div className="pt-6 mt-6 border-t border-[#E8EAE5]/70 flex items-center gap-1.5 text-[11px] font-semibold text-[#006F66] tracking-wide">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#009F8D]" />
                  <span>Curated Standard</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}