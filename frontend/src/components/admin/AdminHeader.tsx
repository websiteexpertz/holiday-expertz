import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { useAdminTheme } from "@/context/AdminThemeContext";
import {
  Menu,
  ChevronRight,
  ExternalLink,
  LogOut,
  Shield,
  Bell,
  Search,
  CheckCircle2,
  Clock,
  Building2,
  Mail,
  AlertTriangle,
  CheckCheck,
  Sparkles,
  CalendarCheck,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";

interface AdminHeaderProps {
  onMenuClick: () => void;
}

interface AdminNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  unread: boolean;
  type: "property" | "inquiry" | "booking" | "system";
  href: string;
}

const INITIAL_NOTIFICATIONS: AdminNotification[] = [
  {
    id: "notif-1",
    title: "Pending Property Verification",
    message: "2 new property listings submitted by owners are awaiting approval.",
    time: "10m ago",
    unread: true,
    type: "property",
    href: "/admin/properties?status=pending_approval",
  },
  {
    id: "notif-2",
    title: "New Customer Inquiry",
    message: "New booking request received for luxury retreat holiday package.",
    time: "25m ago",
    unread: true,
    type: "inquiry",
    href: "/admin/inquiries",
  },
  {
    id: "notif-3",
    title: "Confirmed Stay Booking",
    message: "Reservation #BK-2026-08 was completed successfully.",
    time: "1h ago",
    unread: true,
    type: "booking",
    href: "/admin/bookings",
  },
  {
    id: "notif-4",
    title: "Destination Hierarchy Synced",
    message: "Country, state, city & locality autocomplete indexes are live.",
    time: "2h ago",
    unread: false,
    type: "system",
    href: "/admin/destinations",
  },
];

export function AdminHeader({ onMenuClick }: AdminHeaderProps) {
  const pathname = usePathname();
  const { admin, logout } = useAdminAuth();
  const { theme, resolvedTheme, setTheme } = useAdminTheme();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<AdminNotification[]>(INITIAL_NOTIFICATIONS);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const themeRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: false } : n))
    );
    setNotificationsOpen(false);
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
      if (themeRef.current && !themeRef.current.contains(e.target as Node)) {
        setThemeMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Generate breadcrumb items
  const pathSegments = pathname.split("/").filter(Boolean);
  const breadcrumbs = pathSegments.map((segment, index) => {
    const url = "/" + pathSegments.slice(0, index + 1).join("/");
    const label = segment.replace(/[-_]/g, " ");
    const isLast = index === pathSegments.length - 1;
    return { url, label, isLast };
  });

  const getNotifIcon = (type: AdminNotification["type"]) => {
    switch (type) {
      case "property":
        return <Building2 className="w-4 h-4 text-amber-400" />;
      case "inquiry":
        return <Mail className="w-4 h-4 text-teal-400" />;
      case "booking":
        return <CalendarCheck className="w-4 h-4 text-emerald-400" />;
      case "system":
        return <Sparkles className="w-4 h-4 text-cyan-400" />;
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between gap-4">
      {/* Left: Mobile Toggle & Breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 focus:outline-none"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <nav className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-slate-400">
          <Link href="/admin" className="hover:text-slate-200 transition-colors">
            Admin
          </Link>
          {breadcrumbs.slice(1).map((crumb) => (
            <React.Fragment key={crumb.url}>
              <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
              {crumb.isLast ? (
                <span className="text-teal-400 font-semibold capitalize truncate">{crumb.label}</span>
              ) : (
                <Link href={crumb.url} className="hover:text-slate-200 capitalize transition-colors truncate">
                  {crumb.label}
                </Link>
              )}
            </React.Fragment>
          ))}
        </nav>
      </div>

      {/* Right: Actions & User Dropdown */}
      <div className="flex items-center gap-3">
        {/* View Public Website */}
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700/60 transition-all shadow-sm"
        >
          <span>View Site</span>
          <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
        </Link>

        {/* Theme Mode Selector (Dark / Light / System) */}
        <div ref={themeRef} className="relative">
          <button
            onClick={() => setThemeMenuOpen(!themeMenuOpen)}
            className={`p-2 rounded-lg transition-colors border focus:outline-none flex items-center gap-1.5 ${
              themeMenuOpen
                ? "bg-slate-800 text-teal-400 border-teal-500/40"
                : "bg-slate-800/60 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700/60"
            }`}
            title={`Current theme: ${theme} (resolved: ${resolvedTheme})`}
            aria-label="Toggle admin color scheme"
          >
            {resolvedTheme === "light" ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-teal-400" />
            )}
            <span className="text-[11px] font-bold capitalize hidden sm:inline">
              {theme === "system" ? "Auto" : theme}
            </span>
          </button>

          {themeMenuOpen && (
            <div className="absolute right-0 mt-2 w-44 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 text-xs">
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800/80 mb-1">
                Admin Theme
              </div>
              <button
                type="button"
                onClick={() => {
                  setTheme("light");
                  setThemeMenuOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left font-medium transition-colors cursor-pointer ${
                  theme === "light"
                    ? "bg-teal-500/20 text-teal-300 font-bold"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Sun className="w-4 h-4 text-amber-400" />
                <span>Light Mode</span>
                {theme === "light" && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-teal-400" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  setTheme("dark");
                  setThemeMenuOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left font-medium transition-colors cursor-pointer ${
                  theme === "dark"
                    ? "bg-teal-500/20 text-teal-300 font-bold"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Moon className="w-4 h-4 text-teal-400" />
                <span>Dark Mode</span>
                {theme === "dark" && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-teal-400" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  setTheme("system");
                  setThemeMenuOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left font-medium transition-colors cursor-pointer ${
                  theme === "system"
                    ? "bg-teal-500/20 text-teal-300 font-bold"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Monitor className="w-4 h-4 text-cyan-400" />
                <span>System Auto</span>
                {theme === "system" && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-teal-400" />}
              </button>
            </div>
          )}
        </div>

        {/* Notifications Icon & Popover */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className={`relative p-2 rounded-lg transition-colors focus:outline-none ${
              notificationsOpen
                ? "bg-slate-800 text-teal-400 ring-1 ring-teal-500/30"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
            title="Notifications"
            aria-label="View notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 ? (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-teal-500 text-slate-950 font-black text-[10px] flex items-center justify-center shadow-lg shadow-teal-500/40">
                {unreadCount}
              </span>
            ) : (
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-slate-500" />
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              {/* Header */}
              <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Notifications
                  </h3>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                      {unreadCount} new
                    </span>
                  )}
                </div>

                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-teal-400 transition-colors"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Mark all read</span>
                  </button>
                )}
              </div>

              {/* Notification List */}
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    No new notifications
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <Link
                      key={notif.id}
                      href={notif.href}
                      onClick={() => markAsRead(notif.id)}
                      className={`block px-4 py-3 hover:bg-slate-800/60 transition-colors ${
                        notif.unread ? "bg-slate-800/20" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-xl bg-slate-800 border border-slate-700/60 flex-shrink-0 mt-0.5">
                          {getNotifIcon(notif.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className={`text-xs font-bold truncate ${notif.unread ? "text-white" : "text-slate-300"}`}>
                              {notif.title}
                            </span>
                            <span className="text-[10px] text-slate-500 flex-shrink-0 flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5" />
                              {notif.time}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                            {notif.message}
                          </p>
                        </div>
                        {notif.unread && (
                          <span className="w-2 h-2 rounded-full bg-teal-400 flex-shrink-0 mt-2" />
                        )}
                      </div>
                    </Link>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="p-2.5 bg-slate-950/80 border-t border-slate-800 text-center">
                <Link
                  href="/admin/audit-logs"
                  onClick={() => setNotificationsOpen(false)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-400 hover:text-teal-300 transition-colors"
                >
                  <span>View Complete Audit Activity</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Admin Profile Dropdown */}
        <div ref={profileRef} className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-800 transition-colors focus:outline-none"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-teal-500 to-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center uppercase shadow-sm">
              {admin?.fullName?.charAt(0) || "S"}
            </div>
            <div className="hidden xl:block text-left">
              <span className="block text-xs font-bold text-white leading-none truncate max-w-[120px]">
                {admin?.fullName || "Super Admin"}
              </span>
              <span className="block text-[10px] text-teal-400 capitalize mt-0.5">
                {admin?.role?.replace("_", " ")}
              </span>
            </div>
          </button>

          {profileOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
              <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl py-2 z-50 text-xs">
                <div className="px-4 py-2 border-b border-slate-800">
                  <p className="font-bold text-white truncate">{admin?.fullName}</p>
                  <p className="text-[11px] text-slate-400 truncate">{admin?.email}</p>
                  <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20 text-[10px] font-semibold">
                    <Shield className="w-3 h-3" />
                    <span className="capitalize">{admin?.role?.replace("_", " ")}</span>
                  </div>
                </div>

                <div className="py-1">
                  <Link
                    href="/admin/admins"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    <Shield className="w-4 h-4 text-slate-400" />
                    <span>Manage Staff & Roles</span>
                  </Link>
                  <Link
                    href="/admin/settings"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    <span>Website Settings</span>
                  </Link>
                </div>

                {/* Theme Selector Segmented Row in Profile */}
                <div className="px-4 py-2 border-t border-slate-800">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] text-slate-400 font-medium">Theme Mode</span>
                    <span className="text-[10px] text-teal-400 font-bold uppercase">{theme}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setTheme("light")}
                      className={`py-1 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                        theme === "light"
                          ? "bg-teal-500 text-slate-950 font-bold shadow-xs"
                          : "text-slate-400 hover:text-white hover:bg-slate-800"
                      }`}
                      title="Light Mode"
                    >
                      <Sun className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setTheme("dark")}
                      className={`py-1 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                        theme === "dark"
                          ? "bg-teal-500 text-slate-950 font-bold shadow-xs"
                          : "text-slate-400 hover:text-white hover:bg-slate-800"
                      }`}
                      title="Dark Mode"
                    >
                      <Moon className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setTheme("system")}
                      className={`py-1 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                        theme === "system"
                          ? "bg-teal-500 text-slate-950 font-bold shadow-xs"
                          : "text-slate-400 hover:text-white hover:bg-slate-800"
                      }`}
                      title="System Auto"
                    >
                      <Monitor className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="pt-1 border-t border-slate-800">
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors text-left font-semibold"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
