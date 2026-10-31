"use client";

import React, { useState, useEffect, useRef, ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Compass,
  LayoutDashboard,
  PlusCircle,
  Building2,
  Clock,
  CheckCircle2,
  XCircle,
  User,
  CreditCard,
  Settings,
  LogOut,
  Bell,
  Menu,
  X,
  ChevronDown,
  ExternalLink,
  ShieldCheck,
  Loader2,
  Sparkles,
} from "lucide-react";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { owner, isLoading, isAuthenticated, logout } = useAuth();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile sidebar on route change during render
  const [prevPath, setPrevPath] = useState(pathname);
  if (prevPath !== pathname) {
    setPrevPath(pathname);
    setMobileSidebarOpen(false);
  }

  // Hydration-safe mounted check (React 19 compliant)
  const mounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  // Route protection
  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 rounded-3xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center mb-4">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
        <p className="text-slate-300 font-medium text-sm">Loading Owner Dashboard...</p>
      </div>
    );
  }

  if (!isAuthenticated || !owner) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-white">
        <div className="w-20 h-20 rounded-3xl bg-teal-500/10 border border-teal-400/20 text-teal-400 flex items-center justify-center mb-6 shadow-xl">
          <Compass className="w-10 h-10" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black mb-3">Owner Access Required</h1>
        <p className="text-slate-400 max-w-md mx-auto text-sm mb-6 leading-relaxed">
          Please sign in or register your property to access the HolidayExpertz Property Owner Dashboard.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/subscription#owner-registration"
            className="px-6 py-3.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-lg shadow-teal-500/20"
          >
            Register Your Property
          </Link>
          <Link
            href="/"
            className="px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white font-semibold text-sm rounded-xl transition-all"
          >
            Back to Website
          </Link>
        </div>
      </div>
    );
  }

  const currentStatusParam = searchParams.get("status");

  const navItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      active: pathname === "/dashboard",
    },
    {
      name: "List Your Property",
      href: "/dashboard/properties/new",
      icon: PlusCircle,
      active: pathname === "/dashboard/properties/new",
      highlight: true,
    },
    {
      name: "My Properties",
      href: "/dashboard/properties",
      icon: Building2,
      active: pathname === "/dashboard/properties" && !currentStatusParam,
    },
    {
      name: "Pending Approval",
      href: "/dashboard/properties?status=pending_approval",
      icon: Clock,
      active: pathname === "/dashboard/properties" && currentStatusParam === "pending_approval",
    },
    {
      name: "Approved Properties",
      href: "/dashboard/properties?status=approved",
      icon: CheckCircle2,
      active: pathname === "/dashboard/properties" && currentStatusParam === "approved",
    },
    {
      name: "Rejected Properties",
      href: "/dashboard/properties?status=rejected",
      icon: XCircle,
      active: pathname === "/dashboard/properties" && currentStatusParam === "rejected",
    },
    {
      name: "Owner Profile",
      href: "/dashboard/profile",
      icon: User,
      active: pathname === "/dashboard/profile",
    },
    {
      name: "Subscription",
      href: "/dashboard/subscription",
      icon: CreditCard,
      active: pathname === "/dashboard/subscription",
    },
    {
      name: "Settings",
      href: "/dashboard/profile#settings",
      icon: Settings,
      active: false,
    },
  ];

  const notifications = [
    {
      id: "n-1",
      title: "Welcome to HolidayExpertz Partner Network",
      time: "Just now",
      read: false,
      desc: "Your verified host account is active. Start by listing your premier stay.",
    },
    {
      id: "n-2",
      title: "Audited Stays Guarantee",
      time: "Today",
      read: true,
      desc: "Properties with 3+ high-resolution photos receive 2.5x more traveler inquiries.",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col antialiased">
      {/* ── TOP DASHBOARD HEADER ── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-18">
            {/* Left: Mobile Toggle & Brand */}
            <div className="flex items-center gap-3 sm:gap-4">
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
                className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600"
                aria-label="Toggle navigation"
              >
                {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              <Link href="/dashboard" className="flex items-center gap-2.5 group">
                <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-600/20 group-hover:scale-105 transition-transform">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-base sm:text-lg font-black tracking-tight text-slate-900 leading-none">
                    Holiday<span className="text-teal-600">Expertz</span>
                  </div>
                  <div className="text-[10px] font-bold text-teal-700 tracking-wider uppercase mt-0.5">
                    Owner Panel
                  </div>
                </div>
              </Link>
            </div>

            {/* Middle: Welcome message (Desktop) */}
            <div className="hidden md:flex items-center gap-2 text-xs text-slate-600 bg-slate-50 border border-slate-200/80 px-3.5 py-1.5 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Welcome back,</span>
              <strong className="text-slate-900 font-bold">{owner.fullName}</strong>
            </div>

            {/* Right: Actions, Notifications & Avatar Dropdown */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Public Website Link */}
              <Link
                href="/"
                target="_blank"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-teal-700 hover:bg-teal-50 border border-transparent hover:border-teal-200 transition-all"
                title="View public website in new tab"
              >
                <span>Live Site</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>

              {/* Notifications Popover */}
              <div className="relative" ref={notifRef}>
                <button
                  type="button"
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600"
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
                </button>

                {notificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                        <Bell className="w-4 h-4 text-teal-600" />
                        <span>Notifications</span>
                      </div>
                      <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">
                        2 New
                      </span>
                    </div>
                    <div className="divide-y divide-slate-100 py-1">
                      {notifications.map((n) => (
                        <div key={n.id} className="py-2.5 space-y-1">
                          <div className="text-xs font-bold text-slate-900">{n.title}</div>
                          <div className="text-xs text-slate-500 leading-snug">{n.desc}</div>
                          <div className="text-[10px] text-slate-400">{n.time}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Owner Avatar & Dropdown */}
              <div className="relative" ref={profileRef}>
                <button
                  type="button"
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2 p-1 sm:pl-2.5 sm:pr-2 py-1 rounded-2xl hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-600"
                  aria-expanded={profileDropdownOpen}
                >
                  <div className="text-right hidden sm:block">
                    <div className="text-xs font-bold text-slate-900 leading-tight">
                      {owner.fullName}
                    </div>
                    <div className="text-[10px] text-teal-700 font-semibold leading-tight">
                      Verified Host
                    </div>
                  </div>

                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-sm shadow-sm overflow-hidden ring-2 ring-teal-600/20">
                    {owner.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={owner.avatar} alt={owner.fullName} className="w-full h-full object-cover" />
                    ) : (
                      owner.fullName.charAt(0).toUpperCase()
                    )}
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block" />
                </button>

                {/* Profile Dropdown Menu */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-2.5 border-b border-slate-100">
                      <div className="text-xs font-bold text-slate-900 truncate">
                        {owner.fullName}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">{owner.email}</div>
                      <div className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        <ShieldCheck className="w-3 h-3 text-amber-600" />
                        <span>Partner Tier: Verified</span>
                      </div>
                    </div>

                    <div className="py-1 text-xs text-slate-700">
                      <Link
                        href="/dashboard/profile"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-50 hover:text-teal-700 transition-colors font-medium"
                      >
                        <User className="w-4 h-4 text-slate-400" />
                        <span>View Profile</span>
                      </Link>

                      <Link
                        href="/dashboard/profile?tab=edit"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-50 hover:text-teal-700 transition-colors font-medium"
                      >
                        <Settings className="w-4 h-4 text-slate-400" />
                        <span>Edit Profile</span>
                      </Link>

                      <Link
                        href="/dashboard/properties"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-50 hover:text-teal-700 transition-colors font-medium"
                      >
                        <Building2 className="w-4 h-4 text-slate-400" />
                        <span>My Properties</span>
                      </Link>

                      <Link
                        href="/dashboard/subscription"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-50 hover:text-teal-700 transition-colors font-medium"
                      >
                        <CreditCard className="w-4 h-4 text-slate-400" />
                        <span>Subscription</span>
                      </Link>
                    </div>

                    <div className="pt-1 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          logout();
                          router.push("/");
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── MAIN DASHBOARD BODY (Sidebar + Page Content) ── */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex-1 flex gap-8">
        {/* ── DESKTOP SIDEBAR ── */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <div className="sticky top-24 bg-white rounded-3xl border border-slate-200/80 p-4 shadow-xs space-y-6">
            {/* Quick Action: List Property */}
            <div className="p-1">
              <Link
                href="/dashboard/properties/new"
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs tracking-tight shadow-md shadow-teal-600/25 active:scale-95 transition-all"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ List Your Property</span>
              </Link>
            </div>

            {/* Nav Groups */}
            <nav className="space-y-1">
              <div className="px-3 pb-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Management
              </div>
              {navItems.map((item) => {
                const IconComponent = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                      item.active
                        ? "bg-teal-50 text-teal-800 border border-teal-200/70 shadow-xs"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    <IconComponent
                      className={`w-4 h-4 ${
                        item.active ? "text-teal-600" : "text-slate-400"
                      }`}
                    />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Host Quality Badge */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 text-white space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-teal-300">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Premier Host Seal</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Enjoy 5% commission on direct bookings and guaranteed 24h bank payouts.
              </p>
            </div>

            {/* Logout button */}
            <div className="pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  logout();
                  router.push("/");
                }}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </aside>

        {/* ── MOBILE SIDEBAR DRAWER ── */}
        {mobileSidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
              onClick={() => setMobileSidebarOpen(false)}
            />

            {/* Drawer */}
            <div className="relative w-72 max-w-[85%] bg-white h-full shadow-2xl flex flex-col p-5 z-10 animate-in slide-in-from-left duration-200">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-sm">
                    <Compass className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-slate-900 text-sm">Owner Menu</span>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileSidebarOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="py-3">
                <Link
                  href="/dashboard/properties/new"
                  onClick={() => setMobileSidebarOpen(false)}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-teal-600 text-white font-bold text-xs shadow-md"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>+ List Your Property</span>
                </Link>
              </div>

              <nav className="flex-1 overflow-y-auto space-y-1 py-2">
                {navItems.map((item) => {
                  const IconComponent = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setMobileSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold ${
                        item.active
                          ? "bg-teal-50 text-teal-800 border border-teal-200/70"
                          : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <IconComponent
                        className={`w-4 h-4 ${
                          item.active ? "text-teal-600" : "text-slate-400"
                        }`}
                      />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>

              <div className="pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setMobileSidebarOpen(false);
                    logout();
                    router.push("/");
                  }}
                  className="w-full flex items-center gap-2.5 py-2.5 px-3 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── MAIN CONTENT OUTLET ── */}
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
