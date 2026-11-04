"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Compass,
  Menu,
  X,
  User,
  Building2,
  LayoutDashboard,
  Search,
  ChevronDown,
  ChevronRight,
  LogOut,
  ShieldCheck,
  Palmtree,
  Home,
  Sparkles,
  ArrowRight,
} from "lucide-react";

interface PropertyTypeNavItem {
  name: string;
  tagline: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const PROPERTY_TYPE_ITEMS: PropertyTypeNavItem[] = [
  {
    name: "Luxury Hotels",
    tagline: "5-star sanctuaries & premier hospitality",
    href: "/properties?type=Luxury+Hotels",
    icon: Building2,
  },
  {
    name: "Resorts",
    tagline: "Mountain, wellness & lakeside retreats",
    href: "/properties?type=Resorts",
    icon: Palmtree,
  },
  {
    name: "Villas",
    tagline: "Private secluded estates with plunge pools",
    href: "/properties?type=Villas",
    icon: Sparkles,
  },
  {
    name: "Heritage & Palace Stays",
    tagline: "Royal courtyards & historic palaces",
    href: "/properties?type=Palace+Stays",
    icon: ShieldCheck,
  },
  {
    name: "Homestays",
    tagline: "Warm, authentic local hospitality",
    href: "/properties?type=Homestays",
    icon: Home,
  },
  {
    name: "Boutique Stays",
    tagline: "Design-forward intimate getaways",
    href: "/properties?type=Boutique+Stays",
    icon: Compass,
  },
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
  const { owner, isAuthenticated, logout } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [propertyDropdownOpen, setPropertyDropdownOpen] = useState(false);
  const [mobilePropertyExpanded, setMobilePropertyExpanded] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const propertyDropdownRef = useRef<HTMLDivElement>(null);

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
    { label: "Blog", href: "/#blog" },
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
                      onMouseEnter={() => setPropertyDropdownOpen(true)}
                      onMouseLeave={() => setPropertyDropdownOpen(false)}
                    >
                      <button
                        type="button"
                        onClick={() => setPropertyDropdownOpen((prev) => !prev)}
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

                      {/* Dropdown Card */}
                      {propertyDropdownOpen && (
                        <div
                          role="menu"
                          className="absolute top-full left-1/2 -translate-x-1/2 pt-2 z-50"
                        >
                          <div className="w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2.5 animate-in fade-in zoom-in-95 duration-150">
                            <div className="px-3 pt-2 pb-1.5 border-b border-slate-100 mb-1">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Browse Stays by Category
                              </span>
                            </div>
                            <div className="space-y-0.5">
                              {PROPERTY_TYPE_ITEMS.map((item) => {
                                const Icon = item.icon;
                                return (
                                  <Link
                                    key={item.name}
                                    href={item.href}
                                    role="menuitem"
                                    onClick={() => setPropertyDropdownOpen(false)}
                                    className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-[#F2FAF7] transition-colors group/item"
                                  >
                                    <div className="w-8 h-8 rounded-lg bg-slate-50 group-hover/item:bg-[#E7F6F3] border border-slate-200/60 group-hover/item:border-[#009F8D]/40 flex items-center justify-center text-slate-500 group-hover/item:text-[#009F8D] flex-shrink-0 transition-colors">
                                      <Icon className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0">
                                      <div className="text-xs font-bold text-[#0b192c] group-hover/item:text-[#009F8D] transition-colors">
                                        {item.name}
                                      </div>
                                      <div className="text-[11px] text-slate-500 truncate">
                                        {item.tagline}
                                      </div>
                                    </div>
                                  </Link>
                                );
                              })}
                            </div>

                            <div className="pt-2 mt-1 border-t border-slate-100">
                              <Link
                                href="/properties"
                                role="menuitem"
                                onClick={() => setPropertyDropdownOpen(false)}
                                className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 hover:bg-[#E7F6F3] text-xs font-semibold text-[#006F66] transition-colors"
                              >
                                <span>Explore All Property Types</span>
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

            {/* Right Action Buttons matching exact reference */}
            <div className="hidden md:flex items-center gap-3">
              {/* List Your Property Pill */}
              <Link
                href="/subscription"
                onClick={handleListPropertyClick}
                className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#BDE8DE] bg-[#F2FAF7] hover:bg-[#E4F5EF] text-[#006F66] text-xs font-semibold shadow-xs transition-all duration-200 cursor-pointer"
              >
                <Building2 className="w-3.5 h-3.5 text-[#009F8D] flex-shrink-0" />
                <span className="whitespace-nowrap">List Your Property</span>
              </Link>

              {/* Dynamic Profile Section for Authenticated Owner / Sign In Pill */}
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
                        {/* Option 1: Dashboard */}
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
                              Dashboard
                            </span>
                            <span className="text-[10px] text-slate-400 group-hover:text-slate-600">
                              Manage properties, bookings &amp; earnings
                            </span>
                          </div>
                        </Link>

                        {/* Option 2: My Profile */}
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

                      {/* Option 3: Logout */}
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
                /* Unauthenticated Visitor: Dashboard / Sign In Pill */
                <Link
                  href="/dashboard"
                  onClick={handleDashboardClick}
                  className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#85D4C3] bg-[#E7F6F3] hover:bg-[#D4F0E9] text-[#006F66] text-xs font-semibold shadow-xs transition-all duration-200 cursor-pointer"
                  aria-label="Owner sign in"
                >
                  <div className="w-5 h-5 rounded-full bg-[#009F8D] text-white flex items-center justify-center text-[10px] font-bold overflow-hidden">
                    <User className="w-3 h-3 text-white" />
                  </div>
                  <span className="whitespace-nowrap">Dashboard</span>
                </Link>
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
                        <div className="pl-3 pr-2 py-1 space-y-1 bg-slate-50/80 rounded-xl my-1 border border-slate-100">
                          {PROPERTY_TYPE_ITEMS.map((item) => (
                            <Link
                              key={item.name}
                              href={item.href}
                              onClick={() => {
                                setMobileMenuOpen(false);
                                setMobilePropertyExpanded(false);
                              }}
                              className="flex items-center justify-between px-2.5 py-2 text-xs font-medium text-slate-700 hover:text-[#009F8D] transition-colors rounded-lg hover:bg-white"
                            >
                              <span>{item.name}</span>
                              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                            </Link>
                          ))}
                          <Link
                            href="/properties"
                            onClick={() => {
                              setMobileMenuOpen(false);
                              setMobilePropertyExpanded(false);
                            }}
                            className="flex items-center justify-between px-2.5 py-2 text-xs font-bold text-[#006F66] hover:underline pt-1.5 border-t border-slate-200/60"
                          >
                            <span>Explore All Property Types</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
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
                href="/subscription"
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
          ) : (
            <div className="pt-6 border-t border-slate-100">
              <Link
                href="/dashboard"
                onClick={(e) => {
                  setMobileMenuOpen(false);
                  handleDashboardClick(e);
                }}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-[#009F8D] hover:bg-[#008777] transition-colors shadow-sm cursor-pointer"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Owner Dashboard</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}