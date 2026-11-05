"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { useAdminTheme } from "@/context/AdminThemeContext";
import {
  LayoutDashboard,
  MapPin,
  Building2,
  UserCheck,
  Users,
  CalendarCheck,
  CreditCard,
  FileText,
  Tags,
  CalendarDays,
  Percent,
  Sparkles,
  Globe,
  Star,
  MessageSquareQuote,
  Image as ImageIcon,
  BarChart3,
  Shield,
  History,
  Settings,
  X,
  Compass,
  PlusCircle,
  Camera,
  Type,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavSection {
  title: string;
  items: {
    label: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    moduleKey: string;
    badge?: string;
  }[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", href: "/admin", icon: LayoutDashboard, moduleKey: "dashboard" },
    ],
  },
  {
    title: "Inventory & Geography",
    items: [
      { label: "Destinations", href: "/admin/destinations", icon: MapPin, moduleKey: "destinations" },
      { label: "All Properties", href: "/admin/properties", icon: Building2, moduleKey: "properties_management" },
      { label: "Add Property", href: "/admin/properties/new", icon: PlusCircle, moduleKey: "properties_management" },
      { label: "Property Owners", href: "/admin/owners", icon: UserCheck, moduleKey: "owners_and_users" },
      { label: "Customer Users", href: "/admin/users", icon: Users, moduleKey: "owners_and_users" },
    ],
  },
  {
    title: "Bookings & Commerce",
    items: [
      { label: "Bookings", href: "/admin/bookings", icon: CalendarCheck, moduleKey: "bookings_management" },
      { label: "Payments & Plans", href: "/admin/subscriptions", icon: CreditCard, moduleKey: "subscriptions_and_payments" },
    ],
  },
  {
    title: "Content & Marketing",
    items: [
      { label: "Blog Articles", href: "/admin/blogs", icon: FileText, moduleKey: "blog_management" },
      { label: "Blog Categories", href: "/admin/blogs/categories", icon: Tags, moduleKey: "blog_management" },
      { label: "Upcoming Events", href: "/admin/events", icon: CalendarDays, moduleKey: "upcoming_events" },
      { label: "Promotional Deals", href: "/admin/deals", icon: Percent, moduleKey: "deals_management" },
      { label: "Handpicked Stays", href: "/admin/handpicked", icon: Sparkles, moduleKey: "handpicked_properties" },
      { label: "Hero Banner Content", href: "/admin/hero-content", icon: Type, moduleKey: "website_content" },
      { label: "Website Content", href: "/admin/content", icon: Globe, moduleKey: "website_content" },
    ],
  },
  {
    title: "Engagement & Media",
    items: [
      { label: "Travel Memories", href: "/admin/memories", icon: Camera, moduleKey: "website_content" },
      { label: "Reviews & Ratings", href: "/admin/reviews", icon: Star, moduleKey: "reviews_and_testimonials" },
      { label: "Contact Inquiries", href: "/admin/inquiries", icon: MessageSquareQuote, moduleKey: "contact_inquiries" },
      { label: "Media Library", href: "/admin/media", icon: ImageIcon, moduleKey: "media_library" },
    ],
  },
  {
    title: "Governance & System",
    items: [
      { label: "Reports & Analytics", href: "/admin/reports", icon: BarChart3, moduleKey: "reports_and_analytics" },
      { label: "Admin Staff & RBAC", href: "/admin/admins", icon: Shield, moduleKey: "admin_management" },
      { label: "Audit Logs", href: "/admin/audit-logs", icon: History, moduleKey: "audit_logs" },
      { label: "Website Settings", href: "/admin/settings", icon: Settings, moduleKey: "website_settings" },
    ],
  },
];

export function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const { admin, canModule } = useAdminAuth();
  const { theme, setTheme } = useAdminTheme();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-slate-950 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-slate-800/80 bg-slate-950/80">
          <Link href="/admin" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-teal-500/20">
              <Compass className="w-5 h-5 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-white block leading-none">
                Holiday<span className="text-teal-400">Expertz</span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400/90 block mt-1">
                Super Admin
              </span>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 custom-scrollbar">
          {NAV_SECTIONS.map((section) => {
            // Filter items by admin permissions
            const visibleItems = section.items.filter((item) => {
              if (!admin) return false;
              if (admin.role === "super_admin") return true;
              return canModule(item.moduleKey);
            });

            if (visibleItems.length === 0) return null;

            return (
              <div key={section.title} className="space-y-1">
                <h4 className="px-3 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                  {section.title}
                </h4>
                <div className="space-y-0.5">
                  {visibleItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onClose}
                        className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all group ${
                          isActive
                            ? "bg-gradient-to-r from-teal-500/20 to-emerald-500/10 text-teal-300 font-semibold border border-teal-500/30 shadow-sm"
                            : "text-slate-400 hover:text-slate-100 hover:bg-slate-900/80"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Icon
                            className={`w-4 h-4 shrink-0 transition-colors ${
                              isActive ? "text-teal-400" : "text-slate-500 group-hover:text-slate-300"
                            }`}
                          />
                          <span className="truncate">{item.label}</span>
                        </div>
                        {item.badge && (
                          <span className="ml-2 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Theme Mode Switcher in Sidebar */}
        <div className="px-3 py-2 border-t border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center justify-between p-1 rounded-xl bg-slate-900 border border-slate-800 text-[11px]">
            <button
              type="button"
              onClick={() => setTheme("light")}
              className={`flex-1 py-1 rounded-lg flex items-center justify-center gap-1 font-semibold transition-all cursor-pointer ${
                theme === "light"
                  ? "bg-teal-500 text-slate-950 shadow-xs font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Switch to Light Theme"
            >
              <Sun className="w-3 h-3 text-amber-400" />
              <span>Light</span>
            </button>
            <button
              type="button"
              onClick={() => setTheme("dark")}
              className={`flex-1 py-1 rounded-lg flex items-center justify-center gap-1 font-semibold transition-all cursor-pointer ${
                theme === "dark"
                  ? "bg-teal-500 text-slate-950 shadow-xs font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Switch to Dark Theme"
            >
              <Moon className="w-3 h-3 text-teal-400" />
              <span>Dark</span>
            </button>
            <button
              type="button"
              onClick={() => setTheme("system")}
              className={`flex-1 py-1 rounded-lg flex items-center justify-center gap-1 font-semibold transition-all cursor-pointer ${
                theme === "system"
                  ? "bg-teal-500 text-slate-950 shadow-xs font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Sync with System Theme"
            >
              <Monitor className="w-3 h-3 text-cyan-400" />
              <span>Auto</span>
            </button>
          </div>
        </div>

        {/* Admin Footer Pill */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/60">
          <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-300 font-bold text-xs uppercase shrink-0">
                {admin?.fullName?.charAt(0) || "A"}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate leading-none">
                  {admin?.fullName || "Super Admin"}
                </p>
                <p className="text-[10px] text-teal-400 font-medium truncate capitalize mt-1">
                  {admin?.role?.replace("_", " ") || "Administrator"}
                </p>
              </div>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-400 ring-4 ring-emerald-400/20 shrink-0" />
          </div>
        </div>
      </aside>
    </>
  );
}
