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
} from "lucide-react";

interface LegalSection {
  id: string;
  number: number;
  title: string;
  content: string[];
}

// Initial 23-section structure awaiting verbatim legal text
const defaultTermsSections: LegalSection[] = [
  {
    id: "section-1",
    number: 1,
    title: "Acceptance of Terms",
    content: [
      "By accessing or using the Holiday Expertz platform, website, mobile interfaces, or any associated concierge booking services, you acknowledge that you have read, understood, and agree to be bound by these Terms & Conditions.",
      "If you do not agree with any part of these terms, you must not use or access the services.",
    ],
  },
  {
    id: "section-2",
    number: 2,
    title: "Eligibility & Account Registration",
    content: [
      "You must be at least 18 years of age or the age of majority in your jurisdiction to create an account, make reservations, or list properties on Holiday Expertz.",
      "You are responsible for maintaining the confidentiality of your account credentials and for all activities conducted through your account.",
    ],
  },
  {
    id: "section-3",
    number: 3,
    title: "Scope of Services & Platform Role",
    content: [
      "Holiday Expertz serves as a curated discovery, booking, and travel marketing platform connecting travelers with independent property hosts, luxury villas, boutique hotels, and heritage retreats.",
      "Unless explicitly designated otherwise, Holiday Expertz does not own, operate, manage, or control the individual accommodations listed on the platform.",
    ],
  },
  {
    id: "section-4",
    number: 4,
    title: "Property Listings & Accuracy of Information",
    content: [
      "Property hosts and listing curators are responsible for providing true, current, and complete details regarding their properties, pricing, amenities, room configurations, and house rules.",
      "Holiday Expertz performs editorial audits and visual verifications, but does not warrant that all listing descriptions, photos, or amenities will be entirely free of unintentional discrepancies.",
    ],
  },
  {
    id: "section-5",
    number: 5,
    title: "Bookings, Confirmation & Reservations",
    content: [
      "A booking request constitutes an offer by the guest to reserve the specified accommodation subject to availability and host confirmation.",
      "A reservation is only confirmed once you receive an official booking confirmation voucher containing a valid reservation reference.",
    ],
  },
  {
    id: "section-6",
    number: 6,
    title: "Pricing, Rates & Currency",
    content: [
      "All prices quoted on the website are shown in the indicated currency and are inclusive or exclusive of applicable taxes and government levies as specified during checkout.",
      "Holiday Expertz reserves the right to correct pricing errors caused by technical malfunctions or erroneous host feeds prior to final check-in.",
    ],
  },
  {
    id: "section-7",
    number: 7,
    title: "Payment Terms & Security",
    content: [
      "Payments must be made through authorized payment gateways integrated with our platform. We accept recognized credit/debit cards, net banking, and verified digital wallets.",
      "Credit card transactions are processed securely through certified compliance partners. Holiday Expertz does not store full payment card details on its servers.",
    ],
  },
  {
    id: "section-8",
    number: 8,
    title: "Cancellation, Refunds & Modification Policy",
    content: [
      "Each property listing specifies its applicable cancellation policy (such as Flexible, Moderate, or Strict). The cancellation policy active at the time of your reservation governs your eligibility for refunds.",
      "Any request to modify check-in or check-out dates is subject to host approval, seasonal rate differences, and room availability.",
    ],
  },
  {
    id: "section-9",
    number: 9,
    title: "Guest Responsibilities & House Rules",
    content: [
      "Guests agree to abide by all house rules, maximum occupancy limits, check-in/check-out timings, and reasonable instructions provided by the host or property management.",
      "Parties, unauthorized gatherings, illicit activities, and disorderly conduct that disrupts neighbors or local communities are strictly prohibited.",
    ],
  },
  {
    id: "section-10",
    number: 10,
    title: "Host Responsibilities & Service Standards",
    content: [
      "Hosts agree to maintain their properties in a safe, clean, hygienic, and habitable condition meeting or exceeding the standards represented in their published listings.",
      "Hosts must honor confirmed reservations and provide guests with peaceful, uninterrupted enjoyment of the rented premises during their stay.",
    ],
  },
  {
    id: "section-11",
    number: 11,
    title: "Security Deposits & Damage Assessment",
    content: [
      "Certain properties may require a refundable security deposit at check-in to cover accidental damage, missing items, or excessive utility charges.",
      "In the event of verified damage to the accommodation or furnishings, the host may retain the necessary amount from the security deposit upon providing documented proof.",
    ],
  },
  {
    id: "section-12",
    number: 12,
    title: "Travel Identification, Visas & Health Permits",
    content: [
      "Guests are solely responsible for obtaining valid government-issued photographic identification, passports, visas, permits, and health clearances required for their travel destination.",
      "Failure to present mandatory government identification upon arrival may result in refusal of entry by the host without refund eligibility.",
    ],
  },
  {
    id: "section-13",
    number: 13,
    title: "Intellectual Property Rights",
    content: [
      "All editorial text, custom branding, trademarks, logos, photography, graphics, design layouts, and software algorithms on Holiday Expertz are the intellectual property of Holiday Expertz Inc. or its licensed partners.",
      "No content from this website may be copied, reproduced, republished, distributed, or extracted for commercial use without prior written authorization.",
    ],
  },
  {
    id: "section-14",
    number: 14,
    title: "User Reviews, Ratings & Content Submissions",
    content: [
      "By submitting reviews, ratings, photographs, or travel stories to Holiday Expertz, you grant us a perpetual, irrevocable, royalty-free, worldwide license to publish, display, and distribute that content.",
      "Reviews must reflect genuine first-hand experiences and must not contain defamatory, obscene, fraudulent, or retaliatory remarks.",
    ],
  },
  {
    id: "section-15",
    number: 15,
    title: "Prohibited Uses of the Platform",
    content: [
      "You agree not to use the platform for fraudulent inquiries, speculative bookings, scraping, automated data harvesting, or reverse engineering any part of the website architecture.",
      "Interfering with website security, transmitting malicious scripts, or attempting unauthorized access to server infrastructure will result in immediate legal action.",
    ],
  },
  {
    id: "section-16",
    number: 16,
    title: "Third-Party Services, Links & Integrations",
    content: [
      "Our website may contain links to external third-party services, maps, transport operators, excursion providers, and payment gateways.",
      "Holiday Expertz does not endorse and assumes no responsibility for the content, privacy practices, terms, or availability of third-party platforms.",
    ],
  },
  {
    id: "section-17",
    number: 17,
    title: "Disclaimer of Warranties",
    content: [
      "The services, website content, and property listings are provided on an 'as is' and 'as available' basis without warranties of any kind, whether express or implied.",
      "Holiday Expertz does not warrant that platform operations will be uninterrupted, error-free, completely secure, or free of viruses or technical interruptions.",
    ],
  },
  {
    id: "section-18",
    number: 18,
    title: "Limitation of Liability",
    content: [
      "To the maximum extent permitted by applicable law, Holiday Expertz, its officers, directors, employees, and agents shall not be liable for any indirect, incidental, punitive, or consequential damages arising from your use of the website or accommodations.",
      "In no event shall the total aggregate liability of Holiday Expertz exceed the amount paid by you for the specific booking giving rise to the claim.",
    ],
  },
  {
    id: "section-19",
    number: 19,
    title: "Indemnification",
    content: [
      "You agree to defend, indemnify, and hold harmless Holiday Expertz, its affiliates, licensors, and personnel from and against any claims, liabilities, damages, losses, and legal expenses arising out of your breach of these Terms, violation of law, or misconduct during a stay.",
    ],
  },
  {
    id: "section-20",
    number: 20,
    title: "Force Majeure & Unforeseen Events",
    content: [
      "Neither party shall be held liable for failure or delay in fulfilling obligations where such failure results from events beyond reasonable control, including acts of God, extreme weather, natural disasters, epidemics, armed conflict, government sanctions, or utility grid failures.",
    ],
  },
  {
    id: "section-21",
    number: 21,
    title: "Governing Law & Dispute Resolution",
    content: [
      "These Terms & Conditions shall be governed by, construed, and enforced in accordance with the laws of India.",
      "Any dispute, controversy, or claim arising out of or relating to these Terms shall be subject to the exclusive jurisdiction of the competent courts in Gurugram, Haryana, India.",
    ],
  },
  {
    id: "section-22",
    number: 22,
    title: "Modifications to Terms & Conditions",
    content: [
      "Holiday Expertz reserves the right to modify, revise, or update these Terms & Conditions at any time. Any changes will take effect immediately upon being posted on this page with an updated revision date.",
      "Your continued use of our platform following the publication of revised terms constitutes your acceptance of the updated conditions.",
    ],
  },
  {
    id: "section-23",
    number: 23,
    title: "Contact Information & Legal Inquiries",
    content: [
      "If you have any questions, clarifications, legal notices, or feedback regarding these Terms & Conditions, please contact our team via email at concierge@holidayexpertz.com.",
      "Official correspondence should reference 'Legal & Terms Inquiry' in the subject line to ensure timely response.",
    ],
  },
];

export default function TermsAndConditionsPage() {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("section-1");
  const [mobileTocOpen, setMobileTocOpen] = useState(false);
  const [sections] = useState<LegalSection[]>(defaultTermsSections);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY + 160;
      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i].id);
        if (el && el.offsetTop <= scrollPos) {
          setActiveSection(sections[i].id);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [sections]);

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
      {/* Global Header */}
      <Header onOpenAuthModal={() => setAuthModalOpen(true)} />

      <main className="flex-1 pt-[72px]">
        {/* ========================================================================= */}
        {/* HERO SECTION */}
        {/* ========================================================================= */}
        <section
          aria-label="Terms Hero"
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
              Terms & Conditions
            </h1>

            {/* Description */}
            <p className="font-editorial-sans text-slate-300 text-sm sm:text-base lg:text-lg font-light mt-4 max-w-2xl mx-auto leading-relaxed">
              Please read these terms carefully to understand the conditions governing your use of Holiday Expertz.
            </p>

            {/* Document metadata pill */}
            <div className="mt-6 inline-flex items-center gap-4 text-xs text-[#9fb8b5] font-editorial-sans">
              <div className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-teal-400" />
                <span>23 Legal Sections</span>
              </div>
              <span className="text-slate-600">•</span>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-teal-400" />
                <span>Updated November 2026</span>
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
              <span>Table of Contents ({sections.length} Sections)</span>
            </div>
            {mobileTocOpen ? (
              <ChevronUp className="w-4 h-4 text-slate-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-500" />
            )}
          </button>

          {mobileTocOpen && (
            <div className="mt-3 pt-3 border-t border-slate-100 max-h-72 overflow-y-auto space-y-1 font-editorial-sans text-xs">
              {sections.map((sec) => (
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
            {/* Desktop Sticky Table of Contents (~30%) */}
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
                  {sections.map((sec) => {
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
                  <span>23 Continuous Sections</span>
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

            {/* Continuous Legal Document Column (~70%) */}
            <article className="lg:col-span-8 xl:col-span-8 bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-10 lg:p-12 shadow-xs">
              {/* Introduction Notice */}
              <div className="mb-10 p-5 rounded-2xl bg-[#FAF9F6] border border-slate-200 text-slate-700 font-editorial-sans text-xs sm:text-sm leading-relaxed">
                <p className="font-semibold text-slate-900 mb-1">Important Notice</p>
                <p>
                  These Terms & Conditions constitute a legally binding agreement between you and
                  Holiday Expertz. Please read all clauses thoroughly. If you have any inquiries regarding
                  these provisions, reach out to{" "}
                  <a
                    href="mailto:concierge@holidayexpertz.com"
                    className="text-[#006F66] font-semibold hover:underline"
                  >
                    concierge@holidayexpertz.com
                  </a>
                  .
                </p>
              </div>

              {/* All 23 Sections in Sequence */}
              <div className="divide-y divide-slate-100 space-y-10 sm:space-y-12">
                {sections.map((sec) => (
                  <section
                    key={sec.id}
                    id={sec.id}
                    className="pt-10 first:pt-0 scroll-mt-28"
                  >
                    {/* Section Number & Heading */}
                    <div className="flex items-baseline gap-3 mb-4">
                      <span className="font-editorial-sans text-xs sm:text-sm font-bold text-[#006F66] tracking-widest uppercase">
                        Section {sec.number.toString().padStart(2, "0")}
                      </span>
                    </div>

                    <h2 className="font-editorial-serif text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-snug mb-5 pb-2 border-b border-slate-100">
                      {sec.number}. {sec.title}
                    </h2>

                    {/* Section Paragraphs */}
                    <div className="space-y-4 font-editorial-sans text-slate-700 text-sm sm:text-base leading-[1.8] font-normal">
                      {sec.content.map((paragraph, pIdx) => (
                        <p key={pIdx}>{paragraph}</p>
                      ))}
                    </div>
                  </section>
                ))}
              </div>

              {/* End of Legal Document Divider */}
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
