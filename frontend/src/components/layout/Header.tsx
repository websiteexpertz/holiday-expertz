"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Compass,
  Menu,
  X,
  User,
  Building,
  Building2,
  Home,
  Gem,
  HousePlus,
  PanelsTopLeft,
  LayoutDashboard,
  Briefcase,
  MountainSnow,
  TreePine,
  Warehouse,
  TreeDeciduous,
  Castle,
  Landmark,
  HouseHeart,
  Mountain,
  Palmtree,
  Waves,
  Crown,
  Search,
  ChevronDown,
  ChevronRight,
  LogOut,
  ShieldCheck,
  Sparkles,
  ArrowRight,
} from "lucide-react";

interface PropertyTypeNavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

// 20 Exact Curated Property Types in 2 Columns
const PROPERTY_TYPES_COL_1: PropertyTypeNavItem[] = [
  { name: "Villa", href: "/properties?type=Villa", icon: Home },
  { name: "Condo", href: "/properties?type=Condo", icon: Building },
  { name: "Apartment", href: "/properties?type=Apartment", icon: Building2 },
  { name: "Penthouse", href: "/properties?type=Penthouse", icon: Gem },
  { name: "Townhouse", href: "/properties?type=Townhouse", icon: HousePlus },
  { name: "Duplex", href: "/properties?type=Duplex", icon: PanelsTopLeft },
  { name: "Studio Apartment", href: "/properties?type=Studio+Apartment", icon: LayoutDashboard },
  { name: "Serviced Apartment", href: "/properties?type=Serviced+Apartment", icon: Briefcase },
  { name: "Chalet", href: "/properties?type=Chalet", icon: MountainSnow },
  { name: "Cottage", href: "/properties?type=Cottage", icon: Home },
];

const PROPERTY_TYPES_COL_2: PropertyTypeNavItem[] = [
  { name: "Cabin", href: "/properties?type=Cabin", icon: TreePine },
  { name: "Bungalow", href: "/properties?type=Bungalow", icon: Home },
  { name: "Farmhouse", href: "/properties?type=Farmhouse", icon: Warehouse },
  { name: "Treehouse", href: "/properties?type=Treehouse", icon: TreeDeciduous },
  { name: "Private Estate", href: "/properties?type=Private+Estate", icon: Castle },
  { name: "Mansion", href: "/properties?type=Mansion", icon: Landmark },
  { name: "Private Retreat", href: "/properties?type=Private+Retreat", icon: HouseHeart },
  { name: "Lodge", href: "/properties?type=Lodge", icon: Mountain },
  { name: "Resort", href: "/properties?type=Resort", icon: Palmtree },
  { name: "Pool Villa", href: "/properties?type=Pool+Villa", icon: Waves },
];

const ALL_PROPERTY_TYPES: PropertyTypeNavItem[] = [
  ...PROPERTY_TYPES_COL_1,
  ...PROPERTY_TYPES_COL_2,
];

interface HeaderProps {
  onOpenAuthModal?: () => void;
  showSearchButton?: boolean;
  isSearchOpen?: boolean;
  onToggleSearch?: () => void;
  transparent?: boolean;
}

export default function Header({
  onOpenAuthModal,
  showSearchButton = false,
  isSearchOpen = false,
  onToggleSearch,
  transparent,
}: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isHomePage = pathname === "/";
  const isTransparent = transparent ?? isHomePage;
  const { owner, traveller, isAuthenticated, logout } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [propertyDropdownOpen, setPropertyDropdownOpen] = useState(false);
  const [mobilePropertyExpanded, setMobilePropertyExpanded] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const propertyDropdownRef = useRef<HTMLDivElement>(null);
  const propertyCloseTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handlePropertyMenuEnter = () => {
    if (propertyCloseTimerRef.current) {
      clearTimeout(propertyCloseTimerRef.current);
      propertyCloseTimerRef.current = null;
    }
    setPropertyDropdownOpen(true);
  };

  const handlePropertyMenuLeave = () => {
    if (propertyCloseTimerRef.current) {
      clearTimeout(propertyCloseTimerRef.current);
    }
    propertyCloseTimerRef.current = setTimeout(() => {
      setPropertyDropdownOpen(false);
    }, 200);
  };

  const mounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const getInitials = (name?: string) => {
    if (!name) return "O";
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const handleListPropertyClick = (e: React.MouseEvent) => {
    if (isAuthenticated && owner) {
      e.preventDefault();
      router.push("/dashboard/properties/new");
    }
  };

  const handleDashboardClick = (e: React.MouseEvent) => {
    if (!isAuthenticated) {
      e.preventDefault();
      onOpenAuthModal?.();
    }
  };

  const handleLogout = () => {
    setProfileDropdownOpen(false);
    setMobileMenuOpen(false);
    logout();
    router.push("/");
  };

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target as Node)
      ) {
        setProfileDropdownOpen(false);
      }
      if (
        propertyDropdownRef.current &&
        !propertyDropdownRef.current.contains(event.target as Node)
      ) {
        setPropertyDropdownOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setProfileDropdownOpen(false);
        setPropertyDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      if (propertyCloseTimerRef.current) clearTimeout(propertyCloseTimerRef.current);
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 15) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
  }, [mobileMenuOpen]);

  const navLinks = [
    { label: "Home", href: "/#home", active: pathname === "/" },
    { label: "About Us", href: "/about", active: pathname === "/about" },
    { label: "Property Type", href: "/properties", active: pathname.startsWith("/properties") },
    { label: "Deals", href: "/deals", badge: "Special", active: pathname === "/deals" },
    { label: "Upcoming Events", href: "/#events" },
    { label: "Blog", href: "/blog", active: pathname.startsWith("/blog") },
  ];

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isTransparent
            ? isScrolled
              ? "bg-white/85 backdrop-blur-md shadow-xs border-b border-slate-200/50 py-3"
              : "bg-transparent border-b border-transparent shadow-none py-3.5 sm:py-4"
            : isScrolled
            ? "bg-white/98 backdrop-blur-md shadow-sm border-b border-slate-200/80 py-3"
            : "bg-white/95 backdrop-blur-sm border-b border-slate-100 py-3.5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-12">
            {/* Logo matching exact reference layout */}
            <Link
              href="/"
              className="flex items-center gap-2.5 group focus:outline-none focus:ring-2 focus:ring-[#009F8D] rounded-lg p-0.5"
              aria-label="HolidayExpertz Home"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#006F66] via-[#009F8D] to-teal-400 flex items-center justify-center text-white shadow-sm shadow-[#009F8D]/20">
                <Compass className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <div className="font-bold text-lg tracking-tight text-[#172B2A] leading-tight">
                  Holiday Expertz
                </div>
                <span className="text-[8.5px] uppercase tracking-[0.22em] font-semibold text-slate-400 -mt-0.5">
                  LUXURY STAYS &amp; GETAWAYS
                </span>
              </div>
            </Link>

            {/* Desktop Navigation matching exact reference with Property Type Dropdown */}
            <nav
              aria-label="Main Navigation"
              className="hidden md:flex items-center gap-5 lg:gap-7"
            >
              {navLinks.map((link) => {
                if (link.label === "Property Type") {
                  return (
                    <div
                      key={link.label}
                      ref={propertyDropdownRef}
                      className="relative"
                      onMouseEnter={handlePropertyMenuEnter}
                      onMouseLeave={handlePropertyMenuLeave}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          if (propertyCloseTimerRef.current) {
                            clearTimeout(propertyCloseTimerRef.current);
                            propertyCloseTimerRef.current = null;
                          }
                          setPropertyDropdownOpen((prev) => !prev);
                        }}
                        className={`relative text-[13.5px] whitespace-nowrap transition-colors duration-200 py-1 inline-flex items-center gap-1 cursor-pointer focus:outline-none ${
                          link.active || propertyDropdownOpen
                            ? "text-[#009F8D] font-semibold"
                            : "text-slate-800 hover:text-[#009F8D] font-semibold"
                        }`}
                        aria-expanded={propertyDropdownOpen}
                        aria-haspopup="menu"
                      >
                        <span>Property Type</span>
                        <ChevronDown
                          className={`w-3.5 h-3.5 transition-transform duration-200 ${
                            propertyDropdownOpen ? "rotate-180 text-[#009F8D]" : "text-slate-600"
                          }`}
                        />
                      </button>

                      {/* Desktop Mega-Menu Dropdown */}
                      {propertyDropdownOpen && (
                        <div
                          role="menu"
                          onMouseEnter={handlePropertyMenuEnter}
                          onMouseLeave={handlePropertyMenuLeave}
                          className="fixed top-[66px] sm:top-[70px] left-1/2 -translate-x-1/2 w-[920px] lg:w-[1000px] xl:w-[1060px] max-w-[96vw] z-50 pt-3 animate-in fade-in zoom-in-95 duration-200"
                        >
                          {/* Main Mega-Menu Card */}
                          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 p-5 lg:p-6 overflow-hidden">
                            {/* Two-Part Layout: Left Promotional Panel (34%) + Right 20 Categories (66%) */}
                            <div className="flex flex-col lg:flex-row gap-5 lg:gap-6 items-stretch">
                              {/* Left Side: Promotional Panel */}
                              <div className="w-full lg:w-[34%] relative rounded-2xl overflow-hidden min-h-[440px] flex flex-col justify-end p-6 text-white group shadow-xs">
                                <Image
                                  src="https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=900&q=85"
                                  alt="Luxury Private Pool Villa"
                                  fill
                                  priority
                                  sizes="340px"
                                  className="object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                                />
                                {/* Dark Green Gradient Overlay at Bottom */}
                                <div className="absolute inset-0 bg-gradient-to-t from-[#071f1d] via-[#071f1d]/65 to-black/20" />

                                {/* Promotional Text Content */}
                                <div className="relative z-10">
                                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-emerald-300 text-[10px] font-bold uppercase tracking-[0.2em] font-editorial-sans mb-2.5 shadow-xs">
                                    <Sparkles className="w-3 h-3 text-emerald-300" />
                                    <span>FIND YOUR PERFECT STAY</span>
                                  </div>

                                  <h3 className="font-editorial-serif text-2xl lg:text-[26px] font-bold text-white tracking-tight leading-[1.2]">
                                    Explore Our Property Types
                                  </h3>

                                  <p className="font-editorial-sans text-xs text-slate-200 font-light mt-2 leading-relaxed">
                                    From luxurious villas to cozy cottages, find the ideal stay for your next getaway.
                                  </p>

                                  <div className="pt-4">
                                    <Link
                                      href="/properties"
                                      onClick={() => setPropertyDropdownOpen(false)}
                                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FDFBF7] hover:bg-white text-[#071f1d] font-bold text-xs transition-all shadow-md active:scale-95 group/btn cursor-pointer"
                                    >
                                      <span>Browse All Types</span>
                                      <ArrowRight className="w-3.5 h-3.5 text-[#006F66] group-hover/btn:translate-x-0.5 transition-transform" />
                                    </Link>
                                  </div>
                                </div>
                              </div>

                              {/* Right Side: Property Type Categories (2-Column Grid of 20 Items) */}
                              <div className="w-full lg:w-[66%] flex flex-col justify-between">
                                <div>
                                  {/* Subtitle label */}
                                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 px-1">
                                    <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 font-editorial-sans">
                                      20 Curated Stays by Architecture &amp; Style
                                    </span>
                                    <span className="text-[11px] font-semibold text-[#006F66]">
                                      Select to Filter
                                    </span>
                                  </div>

                                  {/* 2-Column Grid */}
                                  <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                                    {/* Column 1: Items 1 to 10 */}
                                    <div className="space-y-0.5">
                                      {PROPERTY_TYPES_COL_1.map((item) => {
                                        const Icon = item.icon;
                                        return (
                                          <Link
                                            key={item.name}
                                            href={item.href}
                                            role="menuitem"
                                            onClick={() => setPropertyDropdownOpen(false)}
                                            className="flex items-center justify-between px-3 py-1.5 rounded-xl hover:bg-[#F2FAF7] transition-all duration-150 group/item cursor-pointer"
                                          >
                                            <div className="flex items-center gap-2.5 min-w-0">
                                              <div className="w-7 h-7 rounded-lg bg-[#E7F6F3] group-hover/item:bg-[#009F8D] text-[#006F66] group-hover/item:text-white flex items-center justify-center transition-all duration-200 shrink-0">
                                                <Icon className="w-3.5 h-3.5" />
                                              </div>
                                              <span className="text-xs font-medium text-slate-700 group-hover/item:text-[#006F66] group-hover/item:font-semibold transition-colors truncate">
                                                {item.name}
                                              </span>
                                            </div>
                                            <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover/item:text-[#009F8D] group-hover/item:translate-x-0.5 transition-all shrink-0 ml-1" />
                                          </Link>
                                        );
                                      })}
                                    </div>

                                    {/* Column 2: Items 11 to 20 */}
                                    <div className="space-y-0.5">
                                      {PROPERTY_TYPES_COL_2.map((item) => {
                                        const Icon = item.icon;
                                        return (
                                          <Link
                                            key={item.name}
                                            href={item.href}
                                            role="menuitem"
                                            onClick={() => setPropertyDropdownOpen(false)}
                                            className="flex items-center justify-between px-3 py-1.5 rounded-xl hover:bg-[#F2FAF7] transition-all duration-150 group/item cursor-pointer"
                                          >
                                            <div className="flex items-center gap-2.5 min-w-0">
                                              <div className="w-7 h-7 rounded-lg bg-[#E7F6F3] group-hover/item:bg-[#009F8D] text-[#006F66] group-hover/item:text-white flex items-center justify-center transition-all duration-200 shrink-0">
                                                <Icon className="w-3.5 h-3.5" />
                                              </div>
                                              <span className="text-xs font-medium text-slate-700 group-hover/item:text-[#006F66] group-hover/item:font-semibold transition-colors truncate">
                                                {item.name}
                                              </span>
                                            </div>
                                            <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover/item:text-[#009F8D] group-hover/item:translate-x-0.5 transition-all shrink-0 ml-1" />
                                          </Link>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Bottom Footer Inside Dropdown */}
                            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between px-1">
                              {/* Left/Center Text with Crown Icon */}
                              <div className="flex items-center gap-2 text-xs font-medium text-slate-600 font-editorial-sans">
                                <Crown className="w-4 h-4 text-amber-500 fill-amber-500/20 shrink-0" />
                                <span>Luxury Stays. Unforgettable Experiences.</span>
                              </div>

                              {/* Right Side Button */}
                              <Link
                                href="/properties"
                                role="menuitem"
                                onClick={() => setPropertyDropdownOpen(false)}
                                className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#071f1d] hover:bg-[#0b2e2a] text-white font-bold text-xs transition-all shadow-xs hover:shadow active:scale-95 cursor-pointer"
                              >
                                <span>View All Properties</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </Link>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <a
                    key={link.label}
                    href={link.href}
                    className={`relative text-[13.5px] whitespace-nowrap transition-colors duration-200 py-1 ${
                      link.active
                        ? "text-[#009F8D] font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#009F8D] after:rounded-full"
                        : "text-slate-800 hover:text-[#009F8D] font-semibold"
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      {link.label}
                      {link.badge && (
                        <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-[#E7F6F3] text-[#006F66] border border-[#009F8D]/30 tracking-tight">
                          {link.badge}
                        </span>
                      )}
                    </span>
                  </a>
                );
              })}
            </nav>

            {/* Right Action Buttons */}
            <div className="hidden md:flex items-center gap-3">
              {/* List Your Property Pill (Owner registration) */}
              <Link
                href="/subscription#owner-registration"
                onClick={handleListPropertyClick}
                className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#BDE8DE] bg-[#F2FAF7] hover:bg-[#E4F5EF] text-[#006F66] text-xs font-semibold shadow-xs transition-all duration-200 cursor-pointer"
                title="List your luxury property as an owner"
              >
                <Building2 className="w-3.5 h-3.5 text-[#009F8D] flex-shrink-0" />
                <span className="whitespace-nowrap">List Your Property</span>
              </Link>

              {/* Dynamic Profile Section for Authenticated Owner */}
              {mounted && isAuthenticated && owner ? (
                <div ref={profileDropdownRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setProfileDropdownOpen((prev) => !prev)}
                    className="flex items-center gap-2.5 pl-1.5 pr-3 py-1.5 rounded-full border border-[#85D4C3] bg-[#E7F6F3] hover:bg-[#D4F0E9] text-[#006F66] shadow-xs transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#009F8D]"
                    aria-expanded={profileDropdownOpen}
                    aria-haspopup="menu"
                    aria-label={`Owner profile menu for ${owner.fullName}`}
                  >
                    {/* Profile Avatar / Initials */}
                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#006F66] to-[#009F8D] text-white flex items-center justify-center text-xs font-bold shadow-xs overflow-hidden flex-shrink-0">
                      {owner.avatar && !avatarError ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={owner.avatar}
                          alt={owner.fullName}
                          onError={() => setAvatarError(true)}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>{getInitials(owner.fullName)}</span>
                      )}
                    </div>
                    <span className="text-xs font-semibold text-[#006F66] max-w-[120px] truncate">
                      {owner.fullName}
                    </span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-[#006F66] transition-transform duration-200 ${
                        profileDropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* Profile Dropdown Menu */}
                  {profileDropdownOpen && (
                    <div
                      role="menu"
                      className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-[0_16px_40px_rgba(23,43,42,0.16)] border border-slate-100 p-2 z-50 animate-in fade-in zoom-in-95 duration-150 text-[#172B2A]"
                    >
                      {/* Owner Identity Header */}
                      <div className="px-3.5 py-3 border-b border-slate-100 bg-[#FAF9F6] rounded-xl mb-1.5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#006F66] to-[#009F8D] text-white flex items-center justify-center text-sm font-bold shadow-xs overflow-hidden flex-shrink-0">
                            {owner.avatar && !avatarError ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={owner.avatar}
                                alt={owner.fullName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span>{getInitials(owner.fullName)}</span>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold text-slate-900 truncate">
                              {owner.fullName}
                            </div>
                            {owner.email && (
                              <div className="text-[11px] text-slate-500 truncate">
                                {owner.email}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="mt-2.5 flex items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#006F66] bg-[#E7F6F3] px-2 py-0.5 rounded-full border border-[#85D4C3]/50">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#009F8D]" />
                            <span>Verified Property Owner</span>
                          </span>
                        </div>
                      </div>

                      {/* Dropdown Options */}
                      <div className="py-1 space-y-1">
                        <Link
                          href="/dashboard"
                          role="menuitem"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-700 hover:bg-[#E7F6F3] hover:text-[#006F66] transition-colors group cursor-pointer"
                        >
                          <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-[#009F8D] text-slate-600 group-hover:text-white flex items-center justify-center transition-colors flex-shrink-0">
                            <LayoutDashboard className="w-4 h-4" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-bold text-slate-900 group-hover:text-[#006F66]">
                              Host Dashboard
                            </span>
                            <span className="text-[10px] text-slate-400 group-hover:text-slate-600">
                              Manage properties, bookings &amp; earnings
                            </span>
                          </div>
                        </Link>

                        <Link
                          href="/dashboard/profile"
                          role="menuitem"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-700 hover:bg-[#E7F6F3] hover:text-[#006F66] transition-colors group cursor-pointer"
                        >
                          <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-[#009F8D] text-slate-600 group-hover:text-white flex items-center justify-center transition-colors flex-shrink-0">
                            <User className="w-4 h-4" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-bold text-slate-900 group-hover:text-[#006F66]">
                              My Profile
                            </span>
                            <span className="text-[10px] text-slate-400 group-hover:text-slate-600">
                              Host profile and business settings
                            </span>
                          </div>
                        </Link>
                      </div>

                      {/* Logout */}
                      <div className="pt-1.5 mt-1 border-t border-slate-100">
                        <button
                          type="button"
                          role="menuitem"
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors text-left cursor-pointer group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-rose-50 group-hover:bg-rose-100 text-rose-600 flex items-center justify-center transition-colors flex-shrink-0">
                            <LogOut className="w-4 h-4" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-bold text-rose-600">
                              Logout
                            </span>
                            <span className="text-[10px] text-rose-400">
                              Securely end your session
                            </span>
                          </div>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : mounted && isAuthenticated && traveller ? (
                /* Dynamic Profile Section for Authenticated Traveller */
                <div ref={profileDropdownRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setProfileDropdownOpen((prev) => !prev)}
                    className="flex items-center gap-2.5 pl-1.5 pr-3 py-1.5 rounded-full border border-[#85D4C3] bg-[#E7F6F3] hover:bg-[#D4F0E9] text-[#006F66] shadow-xs transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#009F8D]"
                    aria-expanded={profileDropdownOpen}
                    aria-haspopup="menu"
                    aria-label={`Traveller profile menu for ${traveller.fullName}`}
                  >
                    {/* Traveller Avatar / Initials */}
                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#006F66] to-[#009F8D] text-white flex items-center justify-center text-xs font-bold shadow-xs overflow-hidden flex-shrink-0">
                      <span>{getInitials(traveller.fullName)}</span>
                    </div>
                    <span className="text-xs font-semibold text-[#006F66] max-w-[120px] truncate">
                      {traveller.fullName}
                    </span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-[#006F66] transition-transform duration-200 ${
                        profileDropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* Traveller Profile Dropdown Menu */}
                  {profileDropdownOpen && (
                    <div
                      role="menu"
                      className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-[0_16px_40px_rgba(23,43,42,0.16)] border border-slate-100 p-2 z-50 animate-in fade-in zoom-in-95 duration-150 text-[#172B2A]"
                    >
                      {/* Traveller Identity Header */}
                      <div className="px-3.5 py-3 border-b border-slate-100 bg-[#FAF9F6] rounded-xl mb-1.5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#006F66] to-[#009F8D] text-white flex items-center justify-center text-sm font-bold shadow-xs overflow-hidden flex-shrink-0">
                            <span>{getInitials(traveller.fullName)}</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold text-slate-900 truncate">
                              {traveller.fullName}
                            </div>
                            {traveller.email && (
                              <div className="text-[11px] text-slate-500 truncate">
                                {traveller.email}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="mt-2.5 flex items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#006F66] bg-[#E7F6F3] px-2 py-0.5 rounded-full border border-[#85D4C3]/50">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#009F8D]" />
                            <span>Traveller Member</span>
                          </span>
                        </div>
                      </div>

                      {/* Dropdown Options */}
                      <div className="py-1 space-y-1">
                        <Link
                          href="/traveller/dashboard"
                          role="menuitem"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-700 hover:bg-[#E7F6F3] hover:text-[#006F66] transition-colors group cursor-pointer"
                        >
                          <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-[#009F8D] text-slate-600 group-hover:text-white flex items-center justify-center transition-colors flex-shrink-0">
                            <LayoutDashboard className="w-4 h-4" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-bold text-slate-900 group-hover:text-[#006F66]">
                              Traveller Dashboard
                            </span>
                            <span className="text-[10px] text-slate-400 group-hover:text-slate-600">
                              View basic details &amp; preferences
                            </span>
                          </div>
                        </Link>

                        <Link
                          href="/traveller/dashboard?tab=bookings"
                          role="menuitem"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-700 hover:bg-[#E7F6F3] hover:text-[#006F66] transition-colors group cursor-pointer"
                        >
                          <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-[#009F8D] text-slate-600 group-hover:text-white flex items-center justify-center transition-colors flex-shrink-0">
                            <User className="w-4 h-4" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-bold text-slate-900 group-hover:text-[#006F66]">
                              My Trips &amp; Bookings
                            </span>
                            <span className="text-[10px] text-slate-400 group-hover:text-slate-600">
                              Manage upcoming holiday stays
                            </span>
                          </div>
                        </Link>
                      </div>

                      {/* Logout */}
                      <div className="pt-1.5 mt-1 border-t border-slate-100">
                        <button
                          type="button"
                          role="menuitem"
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors text-left cursor-pointer group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-rose-50 group-hover:bg-rose-100 text-rose-600 flex items-center justify-center transition-colors flex-shrink-0">
                            <LogOut className="w-4 h-4" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-bold text-rose-600">
                              Logout
                            </span>
                            <span className="text-[10px] text-rose-400">
                              Securely end your session
                            </span>
                          </div>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Unauthenticated Visitor: Sign In Pill (User Request: Changed from "Dashboard" to "Sign In") */
                <button
                  type="button"
                  onClick={() => onOpenAuthModal?.()}
                  className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#85D4C3] bg-[#E7F6F3] hover:bg-[#D4F0E9] text-[#006F66] text-xs font-semibold shadow-xs transition-all duration-200 cursor-pointer"
                  aria-label="Sign in to your account"
                >
                  <div className="w-5 h-5 rounded-full bg-[#009F8D] text-white flex items-center justify-center text-[10px] font-bold overflow-hidden">
                    <User className="w-3 h-3 text-white" />
                  </div>
                  <span className="whitespace-nowrap">Sign In</span>
                </button>
              )}

              {/* Search Toggle button (when on properties page) */}
              {showSearchButton && (
                <button
                  type="button"
                  onClick={onToggleSearch}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-full transition-all shadow-sm active:scale-95 cursor-pointer border ${
                    isSearchOpen
                      ? "bg-slate-800 text-teal-200 border-slate-700"
                      : "bg-[#009F8D] hover:bg-[#008777] text-white border-[#009F8D]"
                  }`}
                  aria-label={isSearchOpen ? "Close search bar" : "Open search bar"}
                  aria-expanded={isSearchOpen}
                >
                  {isSearchOpen ? (
                    <>
                      <X className="w-3.5 h-3.5 text-teal-200" />
                      <span>Close</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-3.5 h-3.5 text-white" />
                      <span>Search</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Mobile Actions: Hamburger Button */}
            <div className="flex md:hidden items-center gap-2">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl text-slate-800 hover:text-[#009F8D] hover:bg-white/40 transition-colors"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      <div
        className={`fixed inset-0 z-40 md:hidden transition-all duration-300 ${
          mobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />

        <div
          className={`fixed top-[64px] right-0 bottom-0 w-5/6 max-w-sm bg-white border-l border-slate-200 shadow-2xl p-6 flex flex-col justify-between overflow-y-auto transform transition-transform duration-300 ease-editorial ${
            mobileMenuOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400">
                Menu
              </p>
            </div>
            <nav className="flex flex-col space-y-1.5">
              {navLinks.map((link) => {
                if (link.label === "Property Type") {
                  return (
                    <div key={link.label} className="flex flex-col">
                      <button
                        type="button"
                        onClick={() => setMobilePropertyExpanded((prev) => !prev)}
                        className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                          link.active
                            ? "text-[#009F8D] bg-[#E7F6F3]"
                            : "text-slate-800 hover:bg-slate-50 hover:text-[#009F8D]"
                        }`}
                      >
                        <span>Property Type</span>
                        <ChevronDown
                          className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                            mobilePropertyExpanded ? "rotate-180 text-[#009F8D]" : ""
                          }`}
                        />
                      </button>

                      {mobilePropertyExpanded && (
                        <div className="pl-2 pr-2 py-2 space-y-2 bg-slate-50/90 rounded-2xl my-1.5 border border-slate-200/80">
                          {/* Mini Promo Card */}
                          <div className="p-3.5 rounded-xl bg-[#071f1d] text-white flex items-center justify-between gap-3 shadow-xs">
                            <div>
                              <div className="text-[9px] uppercase font-bold text-emerald-400 tracking-widest font-editorial-sans">
                                Find Your Perfect Stay
                              </div>
                              <div className="font-editorial-serif text-sm font-bold text-white leading-tight mt-0.5">
                                Explore Our Property Types
                              </div>
                            </div>
                            <Link
                              href="/properties"
                              onClick={() => {
                                setMobileMenuOpen(false);
                                setMobilePropertyExpanded(false);
                              }}
                              className="px-3 py-1.5 bg-[#FAF9F6] text-[#071f1d] text-[11px] font-bold rounded-lg shrink-0 shadow-xs active:scale-95 transition-transform"
                            >
                              Browse All →
                            </Link>
                          </div>

                          {/* 20 Property Types Single-Column List */}
                          <div className="space-y-0.5 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
                            {ALL_PROPERTY_TYPES.map((item) => {
                              const Icon = item.icon;
                              return (
                                <Link
                                  key={item.name}
                                  href={item.href}
                                  onClick={() => {
                                    setMobileMenuOpen(false);
                                    setMobilePropertyExpanded(false);
                                  }}
                                  className="flex items-center justify-between px-2.5 py-2 text-xs font-medium text-slate-700 hover:text-[#009F8D] transition-colors rounded-xl hover:bg-white min-h-[38px]"
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="w-6 h-6 rounded-md bg-[#E7F6F3] text-[#006F66] flex items-center justify-center shrink-0">
                                      <Icon className="w-3.5 h-3.5" />
                                    </div>
                                    <span className="truncate">{item.name}</span>
                                  </div>
                                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
                                </Link>
                              );
                            })}
                          </div>

                          {/* Mobile View All Button */}
                          <div className="pt-2 border-t border-slate-200">
                            <Link
                              href="/properties"
                              onClick={() => {
                                setMobileMenuOpen(false);
                                setMobilePropertyExpanded(false);
                              }}
                              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full bg-[#071f1d] hover:bg-[#0b2e2a] text-white text-xs font-bold transition-all shadow-xs"
                            >
                              <span>View All Properties</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <a
                    key={link.label}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition-colors ${
                      link.active
                        ? "text-[#009F8D] bg-[#E7F6F3]"
                        : "text-slate-800 hover:bg-slate-50 hover:text-[#009F8D]"
                    }`}
                  >
                    <span>{link.label}</span>
                    {link.badge && (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#E7F6F3] text-[#006F66] border border-[#009F8D]/30">
                        {link.badge}
                      </span>
                    )}
                  </a>
                );
              })}
            </nav>

            <section
              id="mobile-header-list-your-property"
              aria-label="List Your Property"
              className="pt-2 border-t border-slate-100"
            >
              <Link
                href="/subscription#owner-registration"
                onClick={(e) => {
                  setMobileMenuOpen(false);
                  handleListPropertyClick(e);
                }}
                className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl bg-[#F2FAF7] border border-[#BDE8DE] text-[#006F66] font-semibold text-sm transition-colors cursor-pointer"
              >
                <Building2 className="w-4 h-4 text-[#009F8D] flex-shrink-0" />
                <span>List Your Property</span>
              </Link>
            </section>
          </div>

          {/* Mobile Bottom: Profile or Sign In */}
          {mounted && isAuthenticated && owner ? (
            <div className="pt-4 border-t border-slate-100 space-y-2.5">
              {/* Profile Card */}
              <div className="flex items-center gap-3 p-3 bg-[#FAF9F6] border border-slate-100 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#006F66] to-[#009F8D] text-white flex items-center justify-center text-xs font-bold overflow-hidden shadow-xs flex-shrink-0">
                  {owner.avatar && !avatarError ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={owner.avatar}
                      alt={owner.fullName}
                      onError={() => setAvatarError(true)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{getInitials(owner.fullName)}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-900 truncate">
                    {owner.fullName}
                  </div>
                  {owner.email && (
                    <div className="text-[11px] text-slate-500 truncate">
                      {owner.email}
                    </div>
                  )}
                </div>
              </div>

              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-[#009F8D] hover:bg-[#008777] transition-colors shadow-sm cursor-pointer"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Owner Dashboard</span>
              </Link>

              <Link
                href="/dashboard/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <User className="w-3.5 h-3.5" />
                <span>My Profile</span>
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>
          ) : mounted && isAuthenticated && traveller ? (
            <div className="pt-4 border-t border-slate-100 space-y-2.5">
              {/* Traveller Profile Card */}
              <div className="flex items-center gap-3 p-3 bg-[#FAF9F6] border border-slate-100 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#006F66] to-[#009F8D] text-white flex items-center justify-center text-xs font-bold overflow-hidden shadow-xs flex-shrink-0">
                  <span>{getInitials(traveller.fullName)}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-900 truncate">
                    {traveller.fullName}
                  </div>
                  {traveller.email && (
                    <div className="text-[11px] text-slate-500 truncate">
                      {traveller.email}
                    </div>
                  )}
                </div>
              </div>

              <Link
                href="/traveller/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-[#009F8D] hover:bg-[#008777] transition-colors shadow-sm cursor-pointer"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Traveller Dashboard</span>
              </Link>

              <Link
                href="/traveller/dashboard?tab=bookings"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <User className="w-3.5 h-3.5" />
                <span>My Trips &amp; Bookings</span>
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <div className="pt-6 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAuthModal?.();
                }}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-[#009F8D] hover:bg-[#008777] transition-colors shadow-sm cursor-pointer"
              >
                <User className="w-4 h-4" />
                <span>Sign In</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}