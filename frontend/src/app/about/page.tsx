"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AuthModal from "@/components/layout/AuthModal";
import WhatWeOfferCarousel from "@/components/about/WhatWeOfferCarousel";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Compass,
  Heart,
  Globe,
  Award,
  Gem,
} from "lucide-react";

export default function AboutUsPage() {
  const [authModalOpen, setAuthModalOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6] text-[#172B2A]">
      {/* Existing Global Header Navigation */}
      <Header onOpenAuthModal={() => setAuthModalOpen(true)} />

      <main className="flex-1 pt-[72px]">
        {/* ========================================================================= */}
        {/* SECTION 1: ABOUT US HERO */}
        {/* ========================================================================= */}
        <section
          aria-label="About Us Hero"
          className="relative min-h-[460px] sm:min-h-[520px] lg:min-h-[580px] flex items-center justify-center overflow-hidden"
        >
          {/* Background Photography */}
          <div className="absolute inset-0 z-0">
            <Image
              src="https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=2000&q=85"
              alt="Luxury holiday villa overlooking tranquil turquoise ocean"
              fill
              priority
              sizes="100vw"
              className="object-cover object-center scale-102 transition-transform duration-1000 ease-editorial"
            />
            {/* Elegant Dual-Tone Dark Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#07101d]/85 via-[#0b192c]/75 to-[#0b192c]/90" />
            {/* Subtle Texture Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-radial from-[#009F8D]/15 to-transparent rounded-full blur-3xl pointer-events-none" />
          </div>

          {/* Hero Content */}
          <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-16 sm:py-20 lg:py-24">
            {/* Small Section Label */}
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[#D97706] text-xs font-bold uppercase tracking-[0.22em] font-editorial-sans mb-5 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 fill-current text-[#D97706]" />
              <span className="text-white">ABOUT US</span>
            </div>

            {/* Main Heading */}
            <h1 className="font-editorial-serif text-3xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-[1.12] drop-shadow-md max-w-4xl mx-auto">
              Discover Exceptional Stays. <br />
              <span className="italic font-normal text-emerald-300">
                Experience Extraordinary Journeys.
              </span>
            </h1>

            {/* Short Supporting Tagline */}
            <p className="font-editorial-sans text-slate-200 text-base sm:text-lg lg:text-xl font-light mt-4 sm:mt-6 max-w-2xl mx-auto leading-relaxed drop-shadow-sm">
              Every journey deserves a place worth remembering.
            </p>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 2: INTRODUCTION */}
        {/* ========================================================================= */}
        <section
          aria-label="Introduction to Holiday Expertz"
          className="py-16 sm:py-20 lg:py-24 bg-white border-b border-[#E8EAE5]/60"
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
              {/* Text Column */}
              <div className="lg:col-span-7 space-y-6">
                <div className="inline-flex items-center gap-2 text-[#006F66] text-xs font-bold uppercase tracking-[0.18em] font-editorial-sans">
                  <span className="w-6 h-px bg-[#009F8D]" />
                  <span>Welcome to Holiday Expertz</span>
                </div>

                <h2 className="font-editorial-serif text-3xl sm:text-4xl font-bold text-[#0b192c] tracking-tight leading-[1.2]">
                  Curating the Art of Exceptional Travel Stays.
                </h2>

                <div className="space-y-5 font-editorial-sans text-slate-700 text-base sm:text-[17px] leading-[1.8] font-normal">
                  <p>
                    At Holiday Expertz, we believe that where you stay is an essential part of how you experience the world. From luxurious private villas and elegant heritage retreats to serene mountain hideaways and breathtaking beachfront escapes, we help you discover places that make every getaway special.
                  </p>
                  <p>
                    Our vision is to make finding the perfect holiday stay simple, inspiring, and rewarding. Whether you&apos;re planning a romantic escape, a family vacation, a relaxing weekend, or an extended stay, we&apos;re here to help you find accommodation that suits your travel style, preferences, and budget.
                  </p>
                </div>
              </div>

              {/* Composition Image Column */}
              <div className="lg:col-span-5 relative">
                <div className="relative h-80 sm:h-96 lg:h-[430px] rounded-3xl overflow-hidden shadow-xl border border-slate-200/80 group">
                  <Image
                    src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80"
                    alt="Serene resort courtyard with warm architectural lighting"
                    fill
                    sizes="(max-width: 1024px) 100vw, 450px"
                    className="object-cover group-hover:scale-105 transition-transform duration-700 ease-editorial"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6 text-white">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-300 block mb-1 font-editorial-sans">
                      Thoughtfully Handpicked
                    </span>
                    <p className="font-editorial-serif text-xl font-bold leading-tight">
                      Curated retreats crafted for comfort, authenticity, and peace of mind.
                    </p>
                  </div>
                </div>

                {/* Floating Decorative Accent Badge */}
                <div className="hidden sm:flex absolute -bottom-5 -left-5 bg-[#0b192c] text-white p-4 rounded-2xl shadow-xl items-center gap-3 border border-slate-800">
                  <div className="w-10 h-10 rounded-xl bg-[#009F8D] flex items-center justify-center shrink-0">
                    <Gem className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-editorial-serif text-lg font-bold leading-none">100% Verified</div>
                    <div className="text-[11px] text-slate-300 font-editorial-sans mt-0.5">Audited Accommodations</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 3: OUR STORY */}
        {/* ========================================================================= */}
        <section
          aria-label="Our Story"
          className="py-16 sm:py-20 lg:py-24 bg-[#FAF9F6] border-b border-[#E8EAE5]/60"
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
              {/* Visual Column */}
              <div className="lg:col-span-6 order-2 lg:order-1 relative">
                <div className="relative h-80 sm:h-96 lg:h-[460px] rounded-3xl overflow-hidden shadow-xl border border-slate-200 group">
                  <Image
                    src="https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80"
                    alt="Heritage boutique hotel with elegant colonial verandas and sunlit courtyards"
                    fill
                    sizes="(max-width: 1024px) 100vw, 550px"
                    className="object-cover group-hover:scale-105 transition-transform duration-700 ease-editorial"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent" />
                </div>
              </div>

              {/* Text Column */}
              <div className="lg:col-span-6 order-1 lg:order-2 space-y-6">
                <div className="inline-flex items-center gap-2 text-[#006F66] text-xs font-bold uppercase tracking-[0.18em] font-editorial-sans">
                  <span className="w-6 h-px bg-[#009F8D]" />
                  <span>The Heritage & Journey</span>
                </div>

                <h2 className="font-editorial-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0b192c] tracking-tight leading-[1.15]">
                  Our Story
                </h2>

                <div className="space-y-5 font-editorial-sans text-slate-700 text-base sm:text-[17px] leading-[1.8] font-normal">
                  <p>
                    Born from a passion for travel and a belief that every destination has a unique story to tell, Holiday Expertz brings together exceptional accommodation options and inspiring destinations in one place.
                  </p>
                  <p>
                    We aim to connect travelers with memorable places to stay, from charming holiday homes and boutique properties to luxurious resorts and distinctive private villas. We believe that the best holidays are created not only by the places we visit, but also by the comfort, hospitality, and experiences we enjoy along the way.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 4: WHAT WE OFFER — HORIZONTAL AUTO-SLIDING CAROUSEL */}
        {/* ========================================================================= */}
        <section
          aria-label="What We Offer"
          className="py-16 sm:py-20 lg:py-24 bg-white border-b border-[#E8EAE5]/60 overflow-hidden"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="max-w-3xl mb-10 sm:mb-12">
              <div className="inline-flex items-center gap-2 text-[#006F66] text-xs font-bold uppercase tracking-[0.18em] font-editorial-sans mb-2.5">
                <span className="w-6 h-px bg-[#009F8D]" />
                <span>Our Capabilities</span>
              </div>
              <h2 className="font-editorial-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0b192c] tracking-tight leading-[1.15]">
                What We Offer
              </h2>
              <p className="font-editorial-sans text-slate-600 text-base sm:text-lg mt-3 leading-relaxed">
                Discover everything that makes planning your next holiday easier and more inspiring.
              </p>
            </div>

            {/* Horizontal Auto-Sliding 4-Card Carousel */}
            <WhatWeOfferCarousel />
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 5: OUR MISSION */}
        {/* ========================================================================= */}
        <section
          aria-label="Our Mission"
          className="py-16 sm:py-20 lg:py-24 bg-[#FAF9F6] border-b border-[#E8EAE5]/60"
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
              {/* Text Column */}
              <div className="lg:col-span-6 space-y-6">
                <div className="inline-flex items-center gap-2 text-[#006F66] text-xs font-bold uppercase tracking-[0.18em] font-editorial-sans">
                  <span className="w-6 h-px bg-[#009F8D]" />
                  <span>Purpose & Commitment</span>
                </div>

                <h2 className="font-editorial-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0b192c] tracking-tight leading-[1.15]">
                  Our Mission
                </h2>

                <p className="font-editorial-sans text-slate-700 text-base sm:text-[18px] leading-[1.85] font-normal">
                  Our mission is to make extraordinary holiday experiences more accessible by helping travelers discover the right stays and destinations for their journeys. We strive to bring together quality accommodation, meaningful choices, and helpful service to make every stage of holiday planning more enjoyable.
                </p>
              </div>

              {/* Image Column */}
              <div className="lg:col-span-6 relative">
                <div className="relative h-80 sm:h-96 lg:h-[440px] rounded-3xl overflow-hidden shadow-xl border border-slate-200 group">
                  <Image
                    src="https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80"
                    alt="Tranquil luxury nature resort with private verandas and verdant infinity pool"
                    fill
                    sizes="(max-width: 1024px) 100vw, 550px"
                    className="object-cover group-hover:scale-105 transition-transform duration-700 ease-editorial"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/30 via-transparent to-transparent" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 6: OUR VISION */}
        {/* ========================================================================= */}
        <section
          aria-label="Our Vision"
          className="py-16 sm:py-20 lg:py-24 bg-white border-b border-[#E8EAE5]/60"
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
              {/* Image Column (Alternating on Desktop) */}
              <div className="lg:col-span-6 order-2 lg:order-1 relative">
                <div className="relative h-80 sm:h-96 lg:h-[440px] rounded-3xl overflow-hidden shadow-xl border border-slate-200 group">
                  <Image
                    src="https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1200&q=80"
                    alt="Panoramic alpine lake with wooden boat reflecting timeless travel horizons"
                    fill
                    sizes="(max-width: 1024px) 100vw, 550px"
                    className="object-cover group-hover:scale-105 transition-transform duration-700 ease-editorial"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/30 via-transparent to-transparent" />
                </div>
              </div>

              {/* Text Column */}
              <div className="lg:col-span-6 order-1 lg:order-2 space-y-6">
                <div className="inline-flex items-center gap-2 text-[#006F66] text-xs font-bold uppercase tracking-[0.18em] font-editorial-sans">
                  <span className="w-6 h-px bg-[#009F8D]" />
                  <span>The Future Ahead</span>
                </div>

                <h2 className="font-editorial-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0b192c] tracking-tight leading-[1.15]">
                  Our Vision
                </h2>

                <p className="font-editorial-sans text-slate-700 text-base sm:text-[18px] leading-[1.85] font-normal">
                  We aspire to become a trusted name in holiday accommodation and travel experiences, inspiring people to explore new destinations, embrace different cultures, and create memories that last a lifetime.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 7: WHY HOLIDAY EXPERTZ? */}
        {/* ========================================================================= */}
        <section
          aria-label="Why Holiday Expertz"
          className="py-16 sm:py-20 lg:py-24 bg-[#FAF9F6] border-b border-[#E8EAE5]/60"
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
              {/* Text Column */}
              <div className="lg:col-span-7 space-y-6">
                <div className="inline-flex items-center gap-2 text-[#006F66] text-xs font-bold uppercase tracking-[0.18em] font-editorial-sans">
                  <span className="w-6 h-px bg-[#009F8D]" />
                  <span>The HolidayExpertz Difference</span>
                </div>

                <h2 className="font-editorial-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0b192c] tracking-tight leading-[1.15]">
                  Why Holiday Expertz?
                </h2>

                <h3 className="font-editorial-serif italic text-xl sm:text-2xl text-[#006F66] leading-snug font-normal">
                  Because every traveler deserves a stay that feels right for them.
                </h3>

                <div className="space-y-5 font-editorial-sans text-slate-700 text-base sm:text-[17px] leading-[1.8] font-normal">
                  <p>
                    We believe in the beauty of discovering new places, the comfort of feeling at home away from home, and the joy of experiences that stay with you long after your holiday ends.
                  </p>
                  <p>
                    From extraordinary escapes to simple moments of relaxation, we&apos;re here to help you find your next memorable stay.
                  </p>
                </div>
              </div>

              {/* Image Column */}
              <div className="lg:col-span-5 relative">
                <div className="relative h-80 sm:h-96 lg:h-[450px] rounded-3xl overflow-hidden shadow-xl border border-slate-200 group">
                  <Image
                    src="https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80"
                    alt="Intimate Mediterranean cliffside resort terrace at sunset with sparkling ocean views"
                    fill
                    sizes="(max-width: 1024px) 100vw, 450px"
                    className="object-cover group-hover:scale-105 transition-transform duration-700 ease-editorial"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 via-transparent to-transparent" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 8: FINAL CALL TO ACTION */}
        {/* ========================================================================= */}
        <section
          aria-label="Your Next Getaway Starts Here"
          className="relative py-20 sm:py-24 lg:py-28 overflow-hidden flex items-center justify-center text-center"
        >
          {/* Background Photography */}
          <div className="absolute inset-0 z-0">
            <Image
              src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2000&q=85"
              alt="Golden sunset reflecting across a serene tropical coastline"
              fill
              sizes="100vw"
              className="object-cover object-center"
            />
            {/* Elegant Dark Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#07101d]/90 via-[#0b192c]/80 to-[#0b192c]/85" />
          </div>

          <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-emerald-300 text-xs font-bold uppercase tracking-widest font-editorial-sans">
              <Compass className="w-3.5 h-3.5" />
              <span>Begin Your Journey</span>
            </div>

            <h2 className="font-editorial-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight leading-[1.15]">
              Your Next Getaway Starts Here
            </h2>

            <p className="font-editorial-sans text-slate-200 text-base sm:text-lg leading-relaxed max-w-xl mx-auto font-light">
              The world is full of beautiful places waiting to be discovered. Let Holiday Expertz help you find yours.
            </p>

            <div className="pt-4">
              <Link
                href="/properties"
                className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-[#009F8D] hover:bg-[#00897a] text-white font-bold text-sm tracking-wide shadow-xl shadow-[#009F8D]/30 transition-all duration-300 hover:scale-102 font-editorial-sans"
              >
                <span>Explore Your Next Stay</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Required Brand Tagline */}
            <div className="pt-6 border-t border-white/15 max-w-md mx-auto">
              <p className="font-editorial-serif italic text-white/90 text-sm sm:text-base tracking-wide">
                Holiday Expertz — Luxury Stays. Extraordinary Getaways.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* SECTION 9: EXISTING FOOTER */}
      <Footer />

      {/* Auth / Sign In Preview Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </div>
  );
}

