"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AuthModal from "@/components/layout/AuthModal";
import {
  ShieldCheck,
  ChevronRight,
  List,
  ChevronDown,
  ChevronUp,
  FileText,
  Clock,
  ArrowUp,
  Lock,
  Mail,
  UserCheck,
  Building,
  Phone,
  AlertCircle,
} from "lucide-react";

interface PrivacySection {
  id: string;
  number: number;
  title: string;
}

const privacySections: PrivacySection[] = [
  { id: "section-1", number: 1, title: "About This Policy" },
  { id: "section-2", number: 2, title: "Who Is Responsible for Your Data" },
  { id: "section-3", number: 3, title: "Personal Data We Collect" },
  { id: "section-4", number: 4, title: "Sensitive Information" },
  { id: "section-5", number: 5, title: "How We Use Your Data" },
  { id: "section-6", number: 6, title: "How We Share Your Data" },
  { id: "section-7", number: 7, title: "International Transfers" },
  { id: "section-8", number: 8, title: "Cookies and Similar Technologies" },
  { id: "section-9", number: 9, title: "How Long We Keep Your Data" },
  { id: "section-10", number: 10, title: "How We Protect Your Data" },
  { id: "section-11", number: 11, title: "Your Rights and Choices" },
  { id: "section-12", number: 12, title: "Data Shared Between Homeowners and Travellers" },
  { id: "section-13", number: 13, title: "Children" },
  { id: "section-14", number: 14, title: "Third-Party Links and Services" },
  { id: "section-15", number: 15, title: "Automated Decisions" },
  { id: "section-16", number: 16, title: "Changes to This Policy" },
  { id: "section-17", number: 17, title: "Grievance Officer and Contact" },
];

export default function PrivacyPolicyPage() {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("section-1");
  const [mobileTocOpen, setMobileTocOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY + 160;
      for (let i = privacySections.length - 1; i >= 0; i--) {
        const el = document.getElementById(privacySections[i].id);
        if (el && el.offsetTop <= scrollPos) {
          setActiveSection(privacySections[i].id);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const topOffset = 100;
      const elementPosition = el.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - topOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
      setActiveSection(id);
      setMobileTocOpen(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6] text-[#172B2A]">
      {/* Global Header Navigation */}
      <Header onOpenAuthModal={() => setAuthModalOpen(true)} />

      <main className="flex-1 pt-[72px]">
        {/* ========================================================================= */}
        {/* HERO SECTION */}
        {/* ========================================================================= */}
        <section
          aria-label="Privacy Policy Hero"
          className="relative bg-[#071f1d] border-b border-[#133d38] py-14 sm:py-20 px-4 sm:px-6 lg:px-8 overflow-hidden"
        >
          {/* Subtle brand ambient accents */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#009F8D]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#006F66]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative max-w-4xl mx-auto text-center">
            {/* Small label */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-[#009F8D] text-xs font-bold uppercase tracking-[0.2em] font-editorial-sans mb-4 shadow-xs">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>HOLIDAY EXPERTZ · LEGAL</span>
            </div>

            {/* Main Heading */}
            <h1 className="font-editorial-serif text-3xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-[1.15]">
              Privacy Policy
            </h1>

            {/* Description */}
            <p className="font-editorial-sans text-slate-300 text-sm sm:text-base lg:text-lg font-light mt-4 max-w-2xl mx-auto leading-relaxed">
              Your privacy matters to us. Learn how Holiday Expertz collects, uses, shares, and protects your personal information when you use our platform.
            </p>

            {/* Last Updated & Metadata Pill */}
            <div className="mt-6 inline-flex items-center gap-4 text-xs text-[#9fb8b5] font-editorial-sans">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-teal-400" />
                <span>Last updated: [Effective Date]</span>
              </div>
              <span className="text-slate-600">•</span>
              <div className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-teal-400" />
                <span>17 Legal Sections</span>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* MOBILE TABLE OF CONTENTS COLLAPSIBLE BAR */}
        {/* ========================================================================= */}
        <div className="lg:hidden sticky top-[72px] z-20 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3 shadow-xs">
          <button
            type="button"
            onClick={() => setMobileTocOpen((prev) => !prev)}
            className="w-full flex items-center justify-between text-xs font-bold text-slate-800 tracking-wide font-editorial-sans"
            aria-expanded={mobileTocOpen}
          >
            <div className="flex items-center gap-2">
              <List className="w-4 h-4 text-[#006F66]" />
              <span>Table of Contents ({privacySections.length} Sections)</span>
            </div>
            {mobileTocOpen ? (
              <ChevronUp className="w-4 h-4 text-slate-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-500" />
            )}
          </button>

          {mobileTocOpen && (
            <div className="mt-3 pt-3 border-t border-slate-100 max-h-72 overflow-y-auto space-y-1 font-editorial-sans text-xs">
              {privacySections.map((sec) => (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => scrollToSection(sec.id)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-md transition-colors flex items-center justify-between ${
                    activeSection === sec.id
                      ? "bg-[#071f1d] text-white font-semibold"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <span className="truncate">
                    {sec.number}. {sec.title}
                  </span>
                  <ChevronRight className="w-3 h-3 shrink-0 ml-1 opacity-60" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* MAIN CONTENT AREA: TWO COLUMNS (TOC ON DESKTOP + CONTINUOUS READING) */}
        {/* ========================================================================= */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
            {/* Desktop Sticky Table of Contents (~30% Width on Left) */}
            <aside className="hidden lg:block lg:col-span-4 xl:col-span-4">
              <div className="sticky top-28 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
                <div className="flex items-center gap-2 pb-3.5 mb-3.5 border-b border-slate-100 font-editorial-sans">
                  <List className="w-4 h-4 text-[#006F66]" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Table of Contents
                  </h2>
                </div>

                <nav
                  aria-label="Table of Contents"
                  className="max-h-[calc(100vh-220px)] overflow-y-auto pr-1 space-y-1 font-editorial-sans text-xs custom-scrollbar"
                >
                  {privacySections.map((sec) => {
                    const isActive = activeSection === sec.id;
                    return (
                      <button
                        key={sec.id}
                        type="button"
                        onClick={() => scrollToSection(sec.id)}
                        className={`w-full text-left px-3 py-2 rounded-xl transition-all flex items-center justify-between group ${
                          isActive
                            ? "bg-[#071f1d] text-white font-semibold shadow-xs"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        }`}
                      >
                        <span className="truncate">
                          <span
                            className={`mr-1.5 font-bold ${
                              isActive ? "text-[#009F8D]" : "text-slate-400 group-hover:text-slate-600"
                            }`}
                          >
                            {sec.number.toString().padStart(2, "0")}.
                          </span>
                          {sec.title}
                        </span>
                        <ChevronRight
                          className={`w-3.5 h-3.5 shrink-0 ml-1 transition-transform ${
                            isActive
                              ? "text-teal-400 translate-x-0.5"
                              : "text-slate-300 group-hover:text-slate-500"
                          }`}
                        />
                      </button>
                    );
                  })}
                </nav>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-editorial-sans">
                  <span>17 Comprehensive Sections</span>
                  <button
                    type="button"
                    onClick={scrollToTop}
                    className="inline-flex items-center gap-1 text-[#006F66] hover:text-[#004e47] font-semibold"
                  >
                    <span>Back to Top</span>
                    <ArrowUp className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </aside>

            {/* Continuous Legal Document Column (~70% Width on Right) */}
            <article className="lg:col-span-8 xl:col-span-8 bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-10 lg:p-12 shadow-xs">
              {/* Introduction Notice Card */}
              <div className="mb-10 p-5 rounded-2xl bg-[#FAF9F6] border border-slate-200 text-slate-700 font-editorial-sans text-xs sm:text-sm leading-relaxed">
                <div className="flex items-center gap-2 font-semibold text-slate-900 mb-1">
                  <Lock className="w-4 h-4 text-[#006F66]" />
                  <span>Privacy and Personal Data Notice</span>
                </div>
                <p>
                  Holiday Expertz is committed to safeguarding personal data in compliance with applicable
                  privacy laws, including the Digital Personal Data Protection Act (DPDPA), Information
                  Technology Act, and international standards. If you have any inquiries, reach out to{" "}
                  <span className="font-mono text-teal-800 bg-teal-50 px-1 py-0.5 rounded border border-teal-200">
                    [privacy email]
                  </span>
                  .
                </p>
              </div>

              {/* All 17 Sections in Exact Sequential Order */}
              <div className="divide-y divide-slate-100 space-y-12">
                {/* ========================================================================= */}
                {/* SECTION 1 */}
                {/* ========================================================================= */}
                <section id="section-1" className="pt-10 first:pt-0 scroll-mt-28">
                  <span className="font-editorial-sans text-xs sm:text-sm font-bold text-[#006F66] tracking-widest uppercase">
                    Section 01
                  </span>
                  <h2 className="font-editorial-serif text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-snug mt-1 mb-5 pb-2 border-b border-slate-100">
                    1. About This Policy
                  </h2>
                  <div className="space-y-4 font-editorial-sans text-slate-700 text-sm sm:text-base leading-[1.8]">
                    <p>
                      This Privacy Policy describes how Holiday Expertz (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) collects,
                      uses, discloses, retains, and protects personal information obtained from guests, travelers, property hosts,
                      homeowners, website visitors, and users of our digital reservation platforms and concierge services.
                    </p>
                    <p>
                      By accessing our website, creating an account, booking an accommodation, or listing a property with Holiday
                      Expertz, you acknowledge that you have read and understood this Privacy Policy. This policy applies to all
                      personal information gathered through our website, mobile applications, customer support channels, and booking integrations.
                    </p>
                    <p>
                      This policy was last updated and took effect on{" "}
                      <span className="font-mono text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200 font-semibold">
                        [Effective Date]
                      </span>
                      .
                    </p>
                  </div>
                </section>

                {/* ========================================================================= */}
                {/* SECTION 2 */}
                {/* ========================================================================= */}
                <section id="section-2" className="pt-12 scroll-mt-28">
                  <span className="font-editorial-sans text-xs sm:text-sm font-bold text-[#006F66] tracking-widest uppercase">
                    Section 02
                  </span>
                  <h2 className="font-editorial-serif text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-snug mt-1 mb-5 pb-2 border-b border-slate-100">
                    2. Who Is Responsible for Your Data
                  </h2>
                  <div className="space-y-4 font-editorial-sans text-slate-700 text-sm sm:text-base leading-[1.8]">
                    <p>
                      Holiday Expertz Inc. acts as the primary Data Controller (or Data Fiduciary under the Digital Personal
                      Data Protection Act) for the personal data processed in connection with our platform, user accounts, and
                      direct bookings.
                    </p>
                    <p>
                      When you book a stay at an independently owned villa, heritage boutique retreat, or hotel, the relevant
                      property host or homeowner also acts as an independent data recipient or controller with respect to
                      information required to fulfill your reservation and manage check-in on the premises.
                    </p>
                    <p>
                      For any questions regarding our data governance, you may contact our dedicated privacy team at{" "}
                      <span className="font-mono text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200 font-semibold">
                        [privacy email]
                      </span>
                      .
                    </p>
                  </div>
                </section>

                {/* ========================================================================= */}
                {/* SECTION 3 */}
                {/* ========================================================================= */}
                <section id="section-3" className="pt-12 scroll-mt-28">
                  <span className="font-editorial-sans text-xs sm:text-sm font-bold text-[#006F66] tracking-widest uppercase">
                    Section 03
                  </span>
                  <h2 className="font-editorial-serif text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-snug mt-1 mb-5 pb-2 border-b border-slate-100">
                    3. Personal Data We Collect
                  </h2>
                  <div className="space-y-4 font-editorial-sans text-slate-700 text-sm sm:text-base leading-[1.8]">
                    <p>
                      We collect personal data directly from you, automatically through your device interactions, and from verified
                      third-party partners.
                    </p>

                    <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-6">
                      3.1 Categories of Personal Data Collected
                    </h3>

                    {/* Responsive Data Categories Table */}
                    <div className="overflow-x-auto my-5 rounded-2xl border border-slate-200 shadow-xs">
                      <table className="w-full text-left text-xs sm:text-sm border-collapse">
                        <thead>
                          <tr className="bg-[#071f1d] text-white">
                            <th className="p-3.5 font-bold border-b border-[#1b4e47]">Category</th>
                            <th className="p-3.5 font-bold border-b border-[#1b4e47]">Data Points Collected</th>
                            <th className="p-3.5 font-bold border-b border-[#1b4e47]">Source</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          <tr className="hover:bg-slate-50">
                            <td className="p-3.5 font-semibold text-slate-900 align-top">Identity Data</td>
                            <td className="p-3.5 text-slate-600 align-top">
                              Full name, title, date of birth, nationality, government identification documents (passport, Aadhaar, driving license where legally mandated).
                            </td>
                            <td className="p-3.5 text-slate-500 align-top">Direct from user</td>
                          </tr>
                          <tr className="hover:bg-slate-50">
                            <td className="p-3.5 font-semibold text-slate-900 align-top">Contact Data</td>
                            <td className="p-3.5 text-slate-600 align-top">
                              Email address, telephone numbers, residential address, emergency contact information.
                            </td>
                            <td className="p-3.5 text-slate-500 align-top">Direct from user</td>
                          </tr>
                          <tr className="hover:bg-slate-50">
                            <td className="p-3.5 font-semibold text-slate-900 align-top">Booking & Transaction Data</td>
                            <td className="p-3.5 text-slate-600 align-top">
                              Stay dates, property chosen, room type, guest party count, payment status, transaction reference numbers, billing address.
                            </td>
                            <td className="p-3.5 text-slate-500 align-top">User and payment gateways</td>
                          </tr>
                          <tr className="hover:bg-slate-50">
                            <td className="p-3.5 font-semibold text-slate-900 align-top">Technical & Device Data</td>
                            <td className="p-3.5 text-slate-600 align-top">
                              IP address, browser type and version, time zone, operating system, device identifiers, referral URLs.
                            </td>
                            <td className="p-3.5 text-slate-500 align-top">Automated cookies & logs</td>
                          </tr>
                          <tr className="hover:bg-slate-50">
                            <td className="p-3.5 font-semibold text-slate-900 align-top">Host & Property Data</td>
                            <td className="p-3.5 text-slate-600 align-top">
                              Host identity credentials, property registration deeds, bank account settlement details, property location coordinates.
                            </td>
                            <td className="p-3.5 text-slate-500 align-top">Direct from host partners</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-6">
                      3.2 Data You Provide Voluntarily
                    </h3>
                    <p>
                      When you submit inquiries through our contact forms, provide review ratings, communicate with our concierge,
                      or submit custom travel preferences, we collect the content of your communications and any supporting attachments.
                    </p>
                  </div>
                </section>

                {/* ========================================================================= */}
                {/* SECTION 4 */}
                {/* ========================================================================= */}
                <section id="section-4" className="pt-12 scroll-mt-28">
                  <span className="font-editorial-sans text-xs sm:text-sm font-bold text-[#006F66] tracking-widest uppercase">
                    Section 04
                  </span>
                  <h2 className="font-editorial-serif text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-snug mt-1 mb-5 pb-2 border-b border-slate-100">
                    4. Sensitive Information
                  </h2>
                  <div className="space-y-4 font-editorial-sans text-slate-700 text-sm sm:text-base leading-[1.8]">
                    <p>
                      We do not intentionally request or require sensitive personal data (such as religious beliefs, political
                      opinions, biometric identifiers, or genetic records) for standard website browsing or bookings.
                    </p>
                    <p>
                      In limited circumstances, you may choose to provide special requests—such as dietary restrictions, accessibility
                      accommodations, or mobility needs—which could indirectly indicate health conditions. By providing this
                      information, you grant explicit consent for us and the designated property host to process it strictly for the
                      purpose of accommodating your stay.
                    </p>
                  </div>
                </section>

                {/* ========================================================================= */}
                {/* SECTION 5 */}
                {/* ========================================================================= */}
                <section id="section-5" className="pt-12 scroll-mt-28">
                  <span className="font-editorial-sans text-xs sm:text-sm font-bold text-[#006F66] tracking-widest uppercase">
                    Section 05
                  </span>
                  <h2 className="font-editorial-serif text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-snug mt-1 mb-5 pb-2 border-b border-slate-100">
                    5. How We Use Your Data
                  </h2>
                  <div className="space-y-4 font-editorial-sans text-slate-700 text-sm sm:text-base leading-[1.8]">
                    <p>We process personal information under the following legal bases and operational purposes:</p>
                    <ul className="list-disc pl-5 space-y-2 text-slate-700">
                      <li>
                        <strong>Reservation & Stay Fulfillment:</strong> To confirm, process, and manage your accommodation bookings,
                        deliver voucher confirmations, and communicate check-in procedures.
                      </li>
                      <li>
                        <strong>Account Administration:</strong> To create, authenticate, and maintain your traveler or property owner
                        dashboard profile.
                      </li>
                      <li>
                        <strong>Concierge & Customer Support:</strong> To resolve inquiries, handle cancellations, process refund
                        requests, and offer real-time assistance.
                      </li>
                      <li>
                        <strong>Platform Security & Fraud Prevention:</strong> To detect malicious bot activity, prevent payment fraud,
                        and audit compliance with our platform policies.
                      </li>
                      <li>
                        <strong>Legal & Regulatory Compliance:</strong> To comply with tax obligations, mandatory tourist police
                        registers, and lawful judicial requests.
                      </li>
                      <li>
                        <strong>Service Improvements & Editorial Insights:</strong> To optimize website navigation, analyze popular
                        travel trends, and refine property curation standards.
                      </li>
                    </ul>
                  </div>
                </section>

                {/* ========================================================================= */}
                {/* SECTION 6 */}
                {/* ========================================================================= */}
                <section id="section-6" className="pt-12 scroll-mt-28">
                  <span className="font-editorial-sans text-xs sm:text-sm font-bold text-[#006F66] tracking-widest uppercase">
                    Section 06
                  </span>
                  <h2 className="font-editorial-serif text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-snug mt-1 mb-5 pb-2 border-b border-slate-100">
                    6. How We Share Your Data
                  </h2>
                  <div className="space-y-4 font-editorial-sans text-slate-700 text-sm sm:text-base leading-[1.8]">
                    <p>
                      Holiday Expertz does not sell, rent, or trade your personal data to third-party marketing companies. We
                      share data strictly with:
                    </p>
                    <ul className="list-disc pl-5 space-y-2 text-slate-700">
                      <li>
                        <strong>Property Hosts and Homeowners:</strong> Name, contact details, guest headcount, and special stay
                        requests required to confirm and host your reservation.
                      </li>
                      <li>
                        <strong>Payment Gateway Service Providers:</strong> Encrypted transaction data transmitted directly to PCI-DSS
                        compliant payment processing partners.
                      </li>
                      <li>
                        <strong>Technology Infrastructure Vendors:</strong> Cloud database hosting, SMS and email delivery services,
                        and analytics providers bound by strict confidentiality and data protection agreements.
                      </li>
                      <li>
                        <strong>Law Enforcement & Government Authorities:</strong> When strictly required by law, subpoena, or to
                        protect the safety, rights, and property of Holiday Expertz, our guests, or the public.
                      </li>
                    </ul>
                  </div>
                </section>

                {/* ========================================================================= */}
                {/* SECTION 7 */}
                {/* ========================================================================= */}
                <section id="section-7" className="pt-12 scroll-mt-28">
                  <span className="font-editorial-sans text-xs sm:text-sm font-bold text-[#006F66] tracking-widest uppercase">
                    Section 07
                  </span>
                  <h2 className="font-editorial-serif text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-snug mt-1 mb-5 pb-2 border-b border-slate-100">
                    7. International Transfers
                  </h2>
                  <div className="space-y-4 font-editorial-sans text-slate-700 text-sm sm:text-base leading-[1.8]">
                    <p>
                      Holiday Expertz is headquartered in India. When you access our platform or make international bookings,
                      your information may be transferred to, stored, and processed in cloud servers located outside your country of residence.
                    </p>
                    <p>
                      Where cross-border data transfers occur, we implement recognized contractual safeguards, including standard
                      contractual clauses and certified cloud security frameworks, to ensure that your personal information receives
                      comparable protection regardless of geographic location.
                    </p>
                  </div>
                </section>

                {/* ========================================================================= */}
                {/* SECTION 8 */}
                {/* ========================================================================= */}
                <section id="section-8" className="pt-12 scroll-mt-28">
                  <span className="font-editorial-sans text-xs sm:text-sm font-bold text-[#006F66] tracking-widest uppercase">
                    Section 08
                  </span>
                  <h2 className="font-editorial-serif text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-snug mt-1 mb-5 pb-2 border-b border-slate-100">
                    8. Cookies and Similar Technologies
                  </h2>
                  <div className="space-y-4 font-editorial-sans text-slate-700 text-sm sm:text-base leading-[1.8]">
                    <p>
                      We utilize cookies, local browser storage, and web tracking pixels to deliver a smooth user experience.
                    </p>
                    <ul className="list-disc pl-5 space-y-2 text-slate-700">
                      <li>
                        <strong>Essential Cookies:</strong> Required for secure login sessions, booking cart preservation, and core platform navigation.
                      </li>
                      <li>
                        <strong>Performance & Analytics Cookies:</strong> Used to understand site speed, page popularity, and user journeys to continuously improve service delivery.
                      </li>
                      <li>
                        <strong>Preference Cookies:</strong> Used to remember your chosen currency, destination filters, and language preferences.
                      </li>
                    </ul>
                    <p>
                      You can manage or disable cookie preferences through your browser settings{" "}
                      <span className="font-mono text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                        [or settings page]
                      </span>
                      . Note that disabling essential cookies may impact booking functionality.
                    </p>
                  </div>
                </section>

                {/* ========================================================================= */}
                {/* SECTION 9 */}
                {/* ========================================================================= */}
                <section id="section-9" className="pt-12 scroll-mt-28">
                  <span className="font-editorial-sans text-xs sm:text-sm font-bold text-[#006F66] tracking-widest uppercase">
                    Section 09
                  </span>
                  <h2 className="font-editorial-serif text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-snug mt-1 mb-5 pb-2 border-b border-slate-100">
                    9. How Long We Keep Your Data
                  </h2>
                  <div className="space-y-4 font-editorial-sans text-slate-700 text-sm sm:text-base leading-[1.8]">
                    <p>
                      We retain personal data only for as long as necessary to fulfill the purposes for which it was gathered,
                      including legal, tax, accounting, and dispute resolution requirements.
                    </p>

                    {/* Retention Schedule Table */}
                    <div className="overflow-x-auto my-5 rounded-2xl border border-slate-200 shadow-xs">
                      <table className="w-full text-left text-xs sm:text-sm border-collapse">
                        <thead>
                          <tr className="bg-[#071f1d] text-white">
                            <th className="p-3.5 font-bold border-b border-[#1b4e47]">Data Type</th>
                            <th className="p-3.5 font-bold border-b border-[#1b4e47]">Retention Period</th>
                            <th className="p-3.5 font-bold border-b border-[#1b4e47]">Purpose & Justification</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          <tr className="hover:bg-slate-50">
                            <td className="p-3.5 font-semibold text-slate-900">Active Account Profiles</td>
                            <td className="p-3.5 text-slate-700">
                              Duration of active account +{" "}
                              <span className="font-mono font-bold text-teal-800">[12] months</span>
                            </td>
                            <td className="p-3.5 text-slate-500">Service continuity and profile restoration</td>
                          </tr>
                          <tr className="hover:bg-slate-50">
                            <td className="p-3.5 font-semibold text-slate-900">Financial & Invoicing Records</td>
                            <td className="p-3.5 text-slate-700">
                              <span className="font-mono font-bold text-teal-800">[8] years</span>
                            </td>
                            <td className="p-3.5 text-slate-500">Statutory tax and corporate audit compliance</td>
                          </tr>
                          <tr className="hover:bg-slate-50">
                            <td className="p-3.5 font-semibold text-slate-900">Inquiry & Support Communications</td>
                            <td className="p-3.5 text-slate-700">
                              <span className="font-mono font-bold text-teal-800">[24] months</span>
                            </td>
                            <td className="p-3.5 text-slate-500">Service quality and inquiry history</td>
                          </tr>
                          <tr className="hover:bg-slate-50">
                            <td className="p-3.5 font-semibold text-slate-900">Temporary Session & Cart Data</td>
                            <td className="p-3.5 text-slate-700">
                              <span className="font-mono font-bold text-teal-800">[90] days</span>
                            </td>
                            <td className="p-3.5 text-slate-500">Booking workflow management</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <p>
                      Upon expiry of the designated retention schedule, data is permanently destroyed or irreversibly anonymized.
                    </p>
                  </div>
                </section>

                {/* ========================================================================= */}
                {/* SECTION 10 */}
                {/* ========================================================================= */}
                <section id="section-10" className="pt-12 scroll-mt-28">
                  <span className="font-editorial-sans text-xs sm:text-sm font-bold text-[#006F66] tracking-widest uppercase">
                    Section 10
                  </span>
                  <h2 className="font-editorial-serif text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-snug mt-1 mb-5 pb-2 border-b border-slate-100">
                    10. How We Protect Your Data
                  </h2>
                  <div className="space-y-4 font-editorial-sans text-slate-700 text-sm sm:text-base leading-[1.8]">
                    <p>
                      We enforce robust technical, physical, and organizational security protocols to shield personal data against
                      accidental destruction, unauthorized access, loss, or alteration.
                    </p>
                    <ul className="list-disc pl-5 space-y-2 text-slate-700">
                      <li>
                        <strong>Encryption in Transit & At Rest:</strong> All web traffic utilizes TLS 1.3 encryption, and database
                        storage is secured with AES-256 standard encryption.
                      </li>
                      <li>
                        <strong>Role-Based Access Controls:</strong> Access to sensitive reservation and user records is restricted
                        to authorized personnel with strict least-privilege policies.
                      </li>
                      <li>
                        <strong>Regular Vulnerability Audits:</strong> We periodically audit codebase dependencies, perform penetration
                        testing, and maintain real-time threat monitoring.
                      </li>
                    </ul>
                  </div>
                </section>

                {/* ========================================================================= */}
                {/* SECTION 11 */}
                {/* ========================================================================= */}
                <section id="section-11" className="pt-12 scroll-mt-28">
                  <span className="font-editorial-sans text-xs sm:text-sm font-bold text-[#006F66] tracking-widest uppercase">
                    Section 11
                  </span>
                  <h2 className="font-editorial-serif text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-snug mt-1 mb-5 pb-2 border-b border-slate-100">
                    11. Your Rights and Choices
                  </h2>
                  <div className="space-y-4 font-editorial-sans text-slate-700 text-sm sm:text-base leading-[1.8]">
                    <p>Under applicable data privacy regulations, you have several enforceable rights:</p>
                    <ul className="list-disc pl-5 space-y-2 text-slate-700">
                      <li>
                        <strong>Right of Access & Confirmation:</strong> You may request a copy of the personal data we maintain about you.
                      </li>
                      <li>
                        <strong>Right to Correction & Rectification:</strong> You may request updates to inaccurate, outdated, or incomplete personal data.
                      </li>
                      <li>
                        <strong>Right to Erasure (&ldquo;Right to be Forgotten&rdquo;):</strong> You may request deletion of your personal
                        information, subject to overriding statutory recordkeeping requirements.
                      </li>
                      <li>
                        <strong>Right to Withdraw Consent:</strong> You may revoke consent for optional processing activities (such as marketing newsletters) at any time.
                      </li>
                      <li>
                        <strong>Right to Grievance Redressal:</strong> You may lodge complaints regarding data processing directly with our Grievance Officer.
                      </li>
                    </ul>
                    <p>
                      To exercise any of these statutory rights, please send an email request to{" "}
                      <span className="font-mono text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200 font-semibold">
                        [privacy email]
                      </span>
                      .
                    </p>
                  </div>
                </section>

                {/* ========================================================================= */}
                {/* SECTION 12 */}
                {/* ========================================================================= */}
                <section id="section-12" className="pt-12 scroll-mt-28">
                  <span className="font-editorial-sans text-xs sm:text-sm font-bold text-[#006F66] tracking-widest uppercase">
                    Section 12
                  </span>
                  <h2 className="font-editorial-serif text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-snug mt-1 mb-5 pb-2 border-b border-slate-100">
                    12. Data Shared Between Homeowners and Travellers
                  </h2>
                  <div className="space-y-4 font-editorial-sans text-slate-700 text-sm sm:text-base leading-[1.8]">
                    <p>
                      To facilitate smooth check-ins and direct hospitality, Holiday Expertz shares necessary traveler details
                      (guest names, phone number, stay duration, arrival time) with the host upon reservation confirmation.
                    </p>
                    <p>
                      Conversely, the traveler receives the host or villa manager&apos;s direct contact coordinates, full physical
                      address, and check-in instructions. Neither party is permitted to use the other party&apos;s contact details for
                      unauthorized commercial solicitation, harassment, or unlawful purposes.
                    </p>
                  </div>
                </section>

                {/* ========================================================================= */}
                {/* SECTION 13 */}
                {/* ========================================================================= */}
                <section id="section-13" className="pt-12 scroll-mt-28">
                  <span className="font-editorial-sans text-xs sm:text-sm font-bold text-[#006F66] tracking-widest uppercase">
                    Section 13
                  </span>
                  <h2 className="font-editorial-serif text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-snug mt-1 mb-5 pb-2 border-b border-slate-100">
                    13. Children
                  </h2>
                  <div className="space-y-4 font-editorial-sans text-slate-700 text-sm sm:text-base leading-[1.8]">
                    <p>
                      Our website and reservation services are not directed to individuals under the age of 18. We do not
                      knowingly collect personal information directly from children.
                    </p>
                    <p>
                      Where minor children accompany adult guests on a booked holiday, their details (such as age or headcount)
                      must be provided strictly by the accompanying parent or legal guardian. If we discover that personal data
                      has been submitted by a minor without parental consent, we will promptly delete it.
                    </p>
                  </div>
                </section>

                {/* ========================================================================= */}
                {/* SECTION 14 */}
                {/* ========================================================================= */}
                <section id="section-14" className="pt-12 scroll-mt-28">
                  <span className="font-editorial-sans text-xs sm:text-sm font-bold text-[#006F66] tracking-widest uppercase">
                    Section 14
                  </span>
                  <h2 className="font-editorial-serif text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-snug mt-1 mb-5 pb-2 border-b border-slate-100">
                    14. Third-Party Links and Services
                  </h2>
                  <div className="space-y-4 font-editorial-sans text-slate-700 text-sm sm:text-base leading-[1.8]">
                    <p>
                      The Holiday Expertz website may feature links to external third-party sites, including digital maps, social
                      media platforms, transport services, and local tour operators.
                    </p>
                    <p>
                      We do not control and are not responsible for the privacy policies or practices of third-party platforms.
                      We encourage you to read the privacy statements of any third-party websites you visit.
                    </p>
                  </div>
                </section>

                {/* ========================================================================= */}
                {/* SECTION 15 */}
                {/* ========================================================================= */}
                <section id="section-15" className="pt-12 scroll-mt-28">
                  <span className="font-editorial-sans text-xs sm:text-sm font-bold text-[#006F66] tracking-widest uppercase">
                    Section 15
                  </span>
                  <h2 className="font-editorial-serif text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-snug mt-1 mb-5 pb-2 border-b border-slate-100">
                    15. Automated Decisions
                  </h2>
                  <div className="space-y-4 font-editorial-sans text-slate-700 text-sm sm:text-base leading-[1.8]">
                    <p>
                      We do not subject users to decisions that have legal or similarly significant effects based solely on
                      automated profiling or automated decision-making algorithms.
                    </p>
                    <p className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs sm:text-sm">
                      <span className="font-mono font-bold">[only if used]</span>{" "}
                      <span className="font-mono">[We may use automated tools to detect anomalous reservation attempts or fraudulent payment vectors to protect platform integrity.]</span>
                    </p>
                  </div>
                </section>

                {/* ========================================================================= */}
                {/* SECTION 16 */}
                {/* ========================================================================= */}
                <section id="section-16" className="pt-12 scroll-mt-28">
                  <span className="font-editorial-sans text-xs sm:text-sm font-bold text-[#006F66] tracking-widest uppercase">
                    Section 16
                  </span>
                  <h2 className="font-editorial-serif text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-snug mt-1 mb-5 pb-2 border-b border-slate-100">
                    16. Changes to This Policy
                  </h2>
                  <div className="space-y-4 font-editorial-sans text-slate-700 text-sm sm:text-base leading-[1.8]">
                    <p>
                      We may revise, update, or modify this Privacy Policy periodically to reflect technological improvements,
                      service enhancements, or evolving legal frameworks.
                    </p>
                    <p>
                      Any modifications will be published on this page with an updated &ldquo;Last updated: [Effective Date]&rdquo; notice.
                      We encourage you to review this Privacy Policy periodically to stay informed about our data handling standards.
                    </p>
                  </div>
                </section>

                {/* ========================================================================= */}
                {/* SECTION 17 */}
                {/* ========================================================================= */}
                <section id="section-17" className="pt-12 scroll-mt-28">
                  <span className="font-editorial-sans text-xs sm:text-sm font-bold text-[#006F66] tracking-widest uppercase">
                    Section 17
                  </span>
                  <h2 className="font-editorial-serif text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-snug mt-1 mb-5 pb-2 border-b border-slate-100">
                    17. Grievance Officer and Contact
                  </h2>
                  <div className="space-y-4 font-editorial-sans text-slate-700 text-sm sm:text-base leading-[1.8]">
                    <p>
                      In accordance with the Information Technology Act, 2000, and the Digital Personal Data Protection Act, the
                      details of the designated Grievance Officer for Holiday Expertz are provided below:
                    </p>

                    {/* Official Grievance Officer Card */}
                    <div className="p-6 rounded-2xl bg-[#FAF9F6] border border-slate-200/90 space-y-3 font-editorial-sans text-xs sm:text-sm">
                      <div className="flex items-center gap-3">
                        <UserCheck className="w-4 h-4 text-[#006F66] shrink-0" />
                        <div>
                          <span className="text-slate-500 font-semibold block text-[11px] uppercase tracking-wider">
                            Grievance Officer Name
                          </span>
                          <span className="font-mono text-slate-900 font-bold">[Name]</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Mail className="w-4 h-4 text-[#006F66] shrink-0" />
                        <div>
                          <span className="text-slate-500 font-semibold block text-[11px] uppercase tracking-wider">
                            Privacy & Grievance Email
                          </span>
                          <span className="font-mono text-teal-800 font-semibold">[privacy / grievance email]</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Building className="w-4 h-4 text-[#006F66] shrink-0" />
                        <div>
                          <span className="text-slate-500 font-semibold block text-[11px] uppercase tracking-wider">
                            Official Postal Address
                          </span>
                          <span className="font-mono text-slate-800">[Address]</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Phone className="w-4 h-4 text-[#006F66] shrink-0" />
                        <div>
                          <span className="text-slate-500 font-semibold block text-[11px] uppercase tracking-wider">
                            Contact Phone Number
                          </span>
                          <span className="font-mono text-slate-800">[Phone number]</span>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 italic mt-3">
                      All grievances will be acknowledged within 24 to 48 hours and resolved within the statutory timeline
                      specified by applicable law.
                    </p>
                  </div>
                </section>
              </div>

              {/* Document Footer Divider */}
              <div className="mt-14 pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-editorial-sans">
                <p>© 2026 HolidayExpertz Inc. All rights reserved.</p>
                <button
                  type="button"
                  onClick={scrollToTop}
                  className="inline-flex items-center gap-1.5 text-[#006F66] hover:text-[#004e47] font-semibold transition-colors"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                  <span>Return to Top of Document</span>
                </button>
              </div>
            </article>
          </div>
        </div>
      </main>

      {/* Global Footer */}
      <Footer />

      {/* Auth Modal */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </div>
  );
}

