"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiUrl } from "@/lib/apiUrl";
import {
  Compass,
  Mail,
  Send,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Heart,
  Sparkles,
  Loader2,
  ArrowRight,
} from "lucide-react";

export default function Footer() {
  const router = useRouter();
  const { isAuthenticated, owner } = useAuth();

  // Contact Form State
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    message: "",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formStatus, setFormStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [serverMessage, setServerMessage] = useState("");

  const handleListPropertyClick = (e: React.MouseEvent) => {
    if (isAuthenticated && owner) {
      e.preventDefault();
      router.push("/dashboard/properties/new");
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneDigits = formData.phone.replace(/\D/g, "");

    if (!formData.firstName.trim()) {
      errors.firstName = "First name is required";
    }
    if (!formData.lastName.trim()) {
      errors.lastName = "Last name is required";
    }
    if (!formData.email.trim()) {
      errors.email = "Email address is required";
    } else if (!emailRegex.test(formData.email.trim())) {
      errors.email = "Please enter a valid email address";
    }
    if (!formData.phone.trim()) {
      errors.phone = "Phone number is required";
    } else if (phoneDigits.length < 6 || phoneDigits.length > 16) {
      errors.phone = "Please enter a valid phone number (6-16 digits with country code)";
    }
    if (!formData.message.trim()) {
      errors.message = "Message is required";
    } else if (formData.message.trim().length < 5) {
      errors.message = "Message must be at least 5 characters";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setFormStatus("submitting");
    setServerMessage("");

    try {
      const res = await fetch(apiUrl("/api/public/inquiries"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone.trim(),
          message: formData.message.trim(),
          subject: "Website Contact Form Enquiry",
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setFormStatus("success");
        setServerMessage(
          data.message ||
            "Thank you for contacting Holiday Expertz! Your message has been received. Our team will get back to you shortly."
        );
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          message: "",
        });
        setFieldErrors({});
      } else {
        setFormStatus("error");
        setServerMessage(data.message || "Failed to submit enquiry. Please try again.");
      }
    } catch (err) {
      setFormStatus("error");
      setServerMessage("Unable to send message. Please check your connection and try again.");
    }
  };

  return (
    <footer id="contact" className="bg-[#071f1d] text-[#9fb8b5] pt-16 pb-12 border-t border-[#133d38]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Contact Us Form Banner */}
        <div className="bg-gradient-to-r from-[#0a2e2a] via-[#0e3b36] to-[#0a2e2a] border border-[#174842] rounded-3xl p-8 lg:p-12 mb-16 shadow-xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* Left Column: Heading, Badge, Description */}
            <div className="lg:col-span-5 space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#E7F6F3]/10 text-teal-300 text-xs font-semibold border border-teal-400/20 font-editorial-sans tracking-wider uppercase">
                <Sparkles className="w-3.5 h-3.5 text-teal-300" />
                <span>GET IN TOUCH</span>
              </div>

              <h3 className="font-editorial-serif text-2xl sm:text-3xl lg:text-4xl font-normal text-white tracking-tight leading-tight">
                Let's make your next journey extraordinary.
              </h3>

              <p className="font-editorial-sans text-xs sm:text-sm text-[#9fb8b5] font-light leading-relaxed">
                Have a question, need assistance, or want to explore something special? We'd love to hear from you. Send us a message and our team will get back to you.
              </p>

              {/* Quick direct contact badges */}
              <div className="pt-2 sm:pt-4 space-y-2.5 font-editorial-sans text-xs text-[#9fb8b5]">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-[#071f1d] border border-[#1b4e47] flex items-center justify-center text-teal-400 shrink-0">
                    <Mail className="w-3.5 h-3.5" />
                  </div>
                  <span>concierge@holidayexpertz.com</span>
                </div>
              </div>
            </div>

            {/* Right Column: Contact Form */}
            <div className="lg:col-span-7 bg-[#071f1d]/60 border border-[#174842]/80 rounded-2xl p-6 sm:p-7">
              <h4 className="font-editorial-serif text-xl sm:text-2xl font-normal text-white tracking-tight mb-4">
                Send Us a Message
              </h4>

              {/* Success Notification Alert */}
              {formStatus === "success" && (
                <div className="mb-5 p-4 rounded-xl bg-teal-950/60 border border-teal-600/50 text-teal-200 text-xs sm:text-sm flex items-start gap-3 animate-in fade-in">
                  <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold text-white">Message Sent Successfully</p>
                    <p className="leading-relaxed">
                      {serverMessage || "Thank you for contacting Holiday Expertz! Your message has been received. Our team will get back to you shortly."}
                    </p>
                  </div>
                </div>
              )}

              {/* General Error Alert */}
              {formStatus === "error" && (
                <div className="mb-5 p-3.5 rounded-xl bg-rose-950/60 border border-rose-700/60 text-rose-200 text-xs flex items-center gap-2.5 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{serverMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmitContact} className="space-y-4 font-editorial-sans" noValidate>
                {/* Row 1: First Name & Last Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={(e) => {
                        setFormData((prev) => ({ ...prev, firstName: e.target.value }));
                        if (fieldErrors.firstName) setFieldErrors((prev) => ({ ...prev, firstName: "" }));
                      }}
                      placeholder="Enter first name"
                      className={`w-full px-3.5 py-2.5 rounded-xl bg-[#071f1d]/90 border text-white placeholder-[#6d8a87] text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-[#009F8D] transition-all ${
                        fieldErrors.firstName ? "border-rose-500 focus:border-rose-500" : "border-[#1b4e47] focus:border-[#009F8D]"
                      }`}
                    />
                    {fieldErrors.firstName && (
                      <p className="text-[11px] text-rose-400 mt-1">{fieldErrors.firstName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={(e) => {
                        setFormData((prev) => ({ ...prev, lastName: e.target.value }));
                        if (fieldErrors.lastName) setFieldErrors((prev) => ({ ...prev, lastName: "" }));
                      }}
                      placeholder="Enter last name"
                      className={`w-full px-3.5 py-2.5 rounded-xl bg-[#071f1d]/90 border text-white placeholder-[#6d8a87] text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-[#009F8D] transition-all ${
                        fieldErrors.lastName ? "border-rose-500 focus:border-rose-500" : "border-[#1b4e47] focus:border-[#009F8D]"
                      }`}
                    />
                    {fieldErrors.lastName && (
                      <p className="text-[11px] text-rose-400 mt-1">{fieldErrors.lastName}</p>
                    )}
                  </div>
                </div>

                {/* Row 2: Email Address & Phone Number */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => {
                        setFormData((prev) => ({ ...prev, email: e.target.value }));
                        if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: "" }));
                      }}
                      placeholder="Enter your email address"
                      className={`w-full px-3.5 py-2.5 rounded-xl bg-[#071f1d]/90 border text-white placeholder-[#6d8a87] text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-[#009F8D] transition-all ${
                        fieldErrors.email ? "border-rose-500 focus:border-rose-500" : "border-[#1b4e47] focus:border-[#009F8D]"
                      }`}
                    />
                    {fieldErrors.email && (
                      <p className="text-[11px] text-rose-400 mt-1">{fieldErrors.email}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => {
                        setFormData((prev) => ({ ...prev, phone: e.target.value }));
                        if (fieldErrors.phone) setFieldErrors((prev) => ({ ...prev, phone: "" }));
                      }}
                      placeholder="Enter phone number"
                      className={`w-full px-3.5 py-2.5 rounded-xl bg-[#071f1d]/90 border text-white placeholder-[#6d8a87] text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-[#009F8D] transition-all ${
                        fieldErrors.phone ? "border-rose-500 focus:border-rose-500" : "border-[#1b4e47] focus:border-[#009F8D]"
                      }`}
                    />
                    {fieldErrors.phone && (
                      <p className="text-[11px] text-rose-400 mt-1">{fieldErrors.phone}</p>
                    )}
                  </div>
                </div>

                {/* Row 3: Message */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Message *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={formData.message}
                    onChange={(e) => {
                      setFormData((prev) => ({ ...prev, message: e.target.value }));
                      if (fieldErrors.message) setFieldErrors((prev) => ({ ...prev, message: "" }));
                    }}
                    placeholder="Tell us how we can help you..."
                    className={`w-full px-3.5 py-2.5 rounded-xl bg-[#071f1d]/90 border text-white placeholder-[#6d8a87] text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-[#009F8D] transition-all resize-y ${
                      fieldErrors.message ? "border-rose-500 focus:border-rose-500" : "border-[#1b4e47] focus:border-[#009F8D]"
                    }`}
                  />
                  {fieldErrors.message && (
                    <p className="text-[11px] text-rose-400 mt-1">{fieldErrors.message}</p>
                  )}
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={formStatus === "submitting"}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-[#009F8D] hover:bg-[#00897a] disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
                  >
                    {formStatus === "submitting" ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Sending Message...</span>
                      </>
                    ) : (
                      <>
                        <span>Send Message</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
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
                <Link href="/about" className="hover:text-teal-300 transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/#extraordinary" className="hover:text-teal-300 transition-colors">
                  Why Choose Us
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-teal-300 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-teal-300 transition-colors">
                  Terms & Conditions
                </Link>
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

            {/* Secure Payments (Right Side of Footer) */}
            <div className="pt-4 space-y-2.5">
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-white block">
                Secure Payments
              </span>
              <div className="grid grid-cols-2 gap-2 max-w-[210px]">
                {/* VISA */}
                <div
                  className="w-full h-[40px] rounded-xl bg-[#1434CB] flex items-center justify-center p-1.5 shadow-sm hover:brightness-110 transition-all select-none"
                  title="Visa"
                >
                  <svg className="h-4.5 w-auto" viewBox="0 0 78 24" fill="none">
                    <path
                      d="M30.4 1.5L20 23.5H13.6L7.9 5.8C7.6 4.7 7.3 4.2 6.4 3.7C4.9 2.9 2.3 2.1 0 1.6L0.2 0.7H11.2C12.7 0.7 13.9 1.7 14.3 3.3L17 17.5L23.8 0.7H30.4V1.5ZM57.5 16.3C57.6 10.3 49.3 10 49.4 7.2C49.5 6.3 50.3 5.4 52.1 5.2C53 5.1 55.6 5 58.4 6.3L59.5 1.2C58 0.7 56.1 0.2 53.7 0.2C47.4 0.2 43 3.6 43 8.3C42.8 12.1 46.2 14.2 48.8 15.5C51.5 16.8 52.4 17.6 52.4 18.8C52.3 20.6 50.2 21.4 48.3 21.4C44.9 21.4 42.9 20.4 41.3 19.6L40.2 24.9C41.8 25.6 44.8 26.2 47.9 26.2C54.6 26.2 57.5 22.9 57.5 16.3ZM74.5 23.5H80L75.2 0.7H70.1C69 0.7 68.1 1.3 67.7 2.3L57.8 23.5H64.3L65.6 19.9H73.6L74.5 23.5ZM67.4 15.1L70.7 6.1L72.6 15.1H67.4ZM40.9 0.7L35.7 23.5H29.5L34.7 0.7H40.9Z"
                      fill="white"
                    />
                  </svg>
                </div>

                {/* Mastercard */}
                <div
                  className="w-full h-[40px] rounded-xl bg-[#FF5F00] flex flex-col items-center justify-center p-1 shadow-sm hover:brightness-110 transition-all select-none"
                  title="Mastercard"
                >
                  <svg className="h-4.5 w-auto" viewBox="0 0 38 24" fill="none">
                    <circle cx="14" cy="12" r="9" stroke="white" strokeWidth="2.2" fill="none" />
                    <circle cx="24" cy="12" r="9" stroke="white" strokeWidth="2.2" fill="none" />
                  </svg>
                  <span className="text-[7.5px] font-bold text-white tracking-tighter leading-none mt-0.5">
                    mastercard.
                  </span>
                </div>

                {/* American Express */}
                <div
                  className="w-full h-[40px] rounded-xl bg-[#002663] flex flex-col items-center justify-center p-1 shadow-sm hover:brightness-110 transition-all select-none"
                  title="American Express"
                >
                  <span className="text-[8px] font-black tracking-widest text-white leading-tight text-center font-sans">
                    AMERICAN<br />EXPRESS
                  </span>
                </div>

                {/* PayPal */}
                <div
                  className="w-full h-[40px] rounded-xl bg-[#0079C1] flex items-center justify-center p-1.5 shadow-sm hover:brightness-110 transition-all select-none"
                  title="PayPal"
                >
                  <span className="text-sm font-black italic text-white tracking-tight font-sans">
                    PayPal
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Legal, Copyright & Demo Disclaimers */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#6d8a87] font-editorial-sans">
          <p>© 2026 HolidayExpertz Inc. All rights reserved.</p>

          <div className="flex flex-wrap items-center gap-6">
            <Link href="/privacy" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-white transition-colors">
              Terms & Conditions
            </Link>
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