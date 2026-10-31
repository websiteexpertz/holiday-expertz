"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Compass,
  Mail,
  Phone,
  MapPin,
  Send,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Heart,
} from "lucide-react";

export default function Footer() {
  const router = useRouter();
  const { isAuthenticated, owner } = useAuth();
  const [email, setEmail] = useState("");
  const [subscriptionState, setSubscriptionState] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleListPropertyClick = (e: React.MouseEvent) => {
    if (isAuthenticated && owner) {
      e.preventDefault();
      router.push("/dashboard/properties/new");
    }
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email.trim()) {
      setSubscriptionState("error");
      setErrorMessage("Please enter an email address.");
      return;
    }

    if (!emailRegex.test(email.trim())) {
      setSubscriptionState("error");
      setErrorMessage("Please enter a valid email address (e.g., user@domain.com).");
      return;
    }

    setSubscriptionState("success");
    setErrorMessage("");
    setEmail("");
  };

  return (
    <footer id="contact" className="bg-[#071f1d] text-[#9fb8b5] pt-16 pb-12 border-t border-[#133d38]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Newsletter Banner */}
        <div className="bg-gradient-to-r from-[#0a2e2a] via-[#0e3b36] to-[#0a2e2a] border border-[#174842] rounded-3xl p-8 lg:p-10 mb-16 shadow-xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-6 space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E7F6F3]/10 text-teal-300 text-xs font-semibold border border-teal-400/20 font-editorial-sans">
                <Mail className="w-3.5 h-3.5" />
                <span>Curated Escapes & Editorial Notes</span>
              </div>
              <h3 className="font-editorial-serif text-2xl sm:text-3xl lg:text-4xl font-normal text-white tracking-tight">
                Receive handpicked sanctuaries in your inbox.
              </h3>
              <p className="font-editorial-sans text-xs sm:text-sm text-[#9fb8b5] max-w-lg font-light">
                Subscribe for private invitations, newly curated palace havelis, and seasonal retreat updates. Unsubscribe anytime.
              </p>
            </div>

            <div className="lg:col-span-6">
              <form onSubmit={handleSubscribe} className="space-y-3 font-editorial-sans">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (subscriptionState !== "idle") setSubscriptionState("idle");
                      }}
                      placeholder="Enter your email address..."
                      className="w-full px-4 py-3.5 pl-11 rounded-xl bg-[#071f1d]/90 border border-[#1b4e47] text-white placeholder-[#6d8a87] text-xs sm:text-sm focus:outline-none focus:border-[#009F8D] focus:ring-1 focus:ring-[#009F8D] transition-all"
                      aria-label="Email for newsletter"
                    />
                    <Mail className="w-4 h-4 text-[#6d8a87] absolute left-4 top-1/2 -translate-y-1/2" />
                  </div>
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#009F8D] hover:bg-[#006F66] text-white font-semibold text-xs sm:text-sm rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer"
                  >
                    <span>Subscribe</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Feedback State */}
                {subscriptionState === "success" && (
                  <div className="flex items-start gap-2 text-xs text-teal-300 bg-[#072421] border border-teal-700/50 p-3 rounded-lg animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-teal-300" />
                    <div>
                      <p className="font-semibold">Subscription successful!</p>
                      <p className="text-teal-300/80">
                        Thank you for subscribing. You will receive our next curated collection.
                      </p>
                    </div>
                  </div>
                )}

                {subscriptionState === "error" && (
                  <div className="flex items-center gap-2 text-xs text-rose-300 bg-rose-950/40 border border-rose-800/60 p-3 rounded-lg animate-in fade-in">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-300" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <p className="text-[11px] text-[#6d8a87]">
                  We honor your privacy. Zero spam. Unsubscribe whenever you wish.
                </p>
              </form>
            </div>
          </div>
        </div>

        {/* Main Footer Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-[#133d38]">
          {/* Brand Info & Mission */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="#home" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#006F66] to-[#009F8D] flex items-center justify-center text-white shadow-sm">
                <Compass className="w-5 h-5" />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xl font-bold tracking-tight text-white">Holiday</span>
                <span className="text-xl font-bold tracking-tight text-[#009F8D]">Expertz</span>
              </div>
            </Link>

            <p className="font-editorial-sans text-xs sm:text-sm text-[#9fb8b5] leading-relaxed max-w-sm font-light">
              Your premier discovery platform for unforgettable luxury vacations, handpicked boutique stays, heritage havelis, and scenic mountain getaways.
            </p>

            <div className="space-y-2.5 pt-2 text-xs text-[#9fb8b5] font-editorial-sans">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#009F8D] flex-shrink-0 mt-0.5" />
                <span>Level 4, Signature Tower, Gurugram, Haryana 122002</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#009F8D] flex-shrink-0" />
                <span>+91 80000 12345</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#009F8D] flex-shrink-0" />
                <span>concierge@holidayexpertz.com</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="pt-2 flex items-center gap-3">
              {[
                {
                  name: "Instagram",
                  href: "https://instagram.com",
                  svg: (
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                  ),
                },
                {
                  name: "Facebook",
                  href: "https://facebook.com",
                  svg: (
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" />
                    </svg>
                  ),
                },
                {
                  name: "Twitter",
                  href: "https://twitter.com",
                  svg: (
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  ),
                },
                {
                  name: "LinkedIn",
                  href: "https://linkedin.com",
                  svg: (
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M4.98 3.5c0 1.381-1.11 2.5-2.48 2.5s-2.48-1.119-2.48-2.5c0-1.38 1.11-2.5 2.48-2.5s2.48 1.12 2.48 2.5zm.02 4.5h-5v16h5v-16zm7.982 0h-4.968v16h4.969v-8.399c0-4.67 6.029-5.052 6.029 0v8.399h4.988v-10.131c0-7.88-8.922-7.593-11.018-3.714v-2.155z" />
                    </svg>
                  ),
                },
              ].map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Visit our ${social.name} page`}
                  className="w-9 h-9 rounded-xl bg-[#092723] border border-[#14423c] flex items-center justify-center text-[#9fb8b5] hover:text-white hover:bg-[#009F8D] hover:border-[#009F8D] transition-all"
                >
                  {social.svg}
                </a>
              ))}
            </div>
          </div>

          {/* Column 1: Company */}
          <div className="space-y-4 font-editorial-sans">
            <h4 className="text-xs font-bold uppercase tracking-[0.16em] text-white">Company</h4>
            <ul className="space-y-2.5 text-xs sm:text-[13px] text-[#9fb8b5]">
              <li>
                <a href="#about" className="hover:text-teal-300 transition-colors">
                  About Us
                </a>
              </li>
              <li>
                <a href="#why-us" className="hover:text-teal-300 transition-colors">
                  Why Choose Us
                </a>
              </li>
              <li>
                <a href="#careers" className="hover:text-teal-300 transition-colors">
                  Careers <span className="text-[9px] bg-[#123e38] text-teal-300 px-1.5 py-0.5 rounded font-mono">Hiring</span>
                </a>
              </li>
              <li>
                <a href="#press" className="hover:text-teal-300 transition-colors">
                  Press & Media
                </a>
              </li>
              <li>
                <a href="#contact" className="hover:text-teal-300 transition-colors">
                  Contact Us
                </a>
              </li>
            </ul>
          </div>

          {/* Column 2: Explore */}
          <div className="space-y-4 font-editorial-sans">
            <h4 className="text-xs font-bold uppercase tracking-[0.16em] text-white">Explore</h4>
            <ul className="space-y-2.5 text-xs sm:text-[13px] text-[#9fb8b5]">
              <li>
                <a href="#handpicked" className="hover:text-teal-300 transition-colors">
                  Luxury Hotels
                </a>
              </li>
              <li>
                <a href="#property-types" className="hover:text-teal-300 transition-colors">
                  Hill & Beach Resorts
                </a>
              </li>
              <li>
                <a href="#property-types" className="hover:text-teal-300 transition-colors">
                  Plantation Homestays
                </a>
              </li>
              <li>
                <a href="#deals" className="hover:text-teal-300 transition-colors">
                  Seasonal Deals
                </a>
              </li>
              <li>
                <a href="#blog" className="hover:text-teal-300 transition-colors">
                  Travel Blog & Guides
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Support */}
          <div className="space-y-4 font-editorial-sans">
            <h4 className="text-xs font-bold uppercase tracking-[0.16em] text-white">Support</h4>
            <ul className="space-y-2.5 text-xs sm:text-[13px] text-[#9fb8b5]">
              <li>
                <a href="#faq" className="hover:text-teal-300 transition-colors">
                  Help Center & FAQs
                </a>
              </li>
              <li>
                <a href="#booking-help" className="hover:text-teal-300 transition-colors">
                  Booking Assistance
                </a>
              </li>
              <li>
                <a href="#cancellation" className="hover:text-teal-300 transition-colors">
                  Cancellation Policies
                </a>
              </li>
              <li>
                <a href="#safety" className="hover:text-teal-300 transition-colors flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#009F8D]" />
                  <span>Travel Safety Guide</span>
                </a>
              </li>
              <li>
                <Link
                  href="/subscription"
                  onClick={handleListPropertyClick}
                  className="hover:text-teal-300 transition-colors font-semibold text-white"
                >
                  List Your Property
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Legal, Copyright & Demo Disclaimers */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#6d8a87] font-editorial-sans">
          <p>© 2026 HolidayExpertz Inc. All rights reserved.</p>

          <div className="flex flex-wrap items-center gap-6">
            <a href="#privacy" className="hover:text-white transition-colors">
              Privacy Policy
            </a>
            <a href="#terms" className="hover:text-white transition-colors">
              Terms & Conditions
            </a>
            <a href="#cookies" className="hover:text-white transition-colors">
              Cookie Preferences
            </a>
            <a href="#security" className="hover:text-white transition-colors">
              Security
            </a>
            <Link href="/admin" className="text-[#9fb8b5] hover:text-[#009F8D] transition-colors font-medium">
              Admin Portal
            </Link>
          </div>

          <div className="flex items-center gap-1 text-[11px] text-[#6d8a87]">
            <span>Crafted with</span>
            <Heart className="w-3 h-3 text-rose-400 fill-rose-400" />
            <span>for discerning travelers</span>
          </div>
        </div>
      </div>
    </footer>
  );
}