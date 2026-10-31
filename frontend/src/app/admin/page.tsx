"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { adminClient } from "@/lib/adminClient";
import { DashboardMetricOverview } from "@backend/types/admin";
import {
  Building2,
  Users,
  CreditCard,
  CalendarCheck,
  TrendingUp,
  MapPin,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Sparkles,
  RefreshCw,
  Loader2,
} from "lucide-react";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardMetricOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSyncedTime, setLastSyncedTime] = useState<string>("");
  const [syncFeedback, setSyncFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const fetchStats = async () => {
    setIsRefreshing(true);
    setSyncFeedback(null);
    try {
      const res = await adminClient.dashboard.getStats();
      if (res.success && res.data?.stats) {
        setStats(res.data.stats);
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
        setLastSyncedTime(timeStr);
        setSyncFeedback({ type: "success", message: `Metrics synchronized successfully at ${timeStr}` });
        setTimeout(() => setSyncFeedback(null), 3500);
      } else {
        setSyncFeedback({ type: "error", message: res.message || "Failed to fetch dashboard metrics" });
      }
    } catch (err: any) {
      setSyncFeedback({ type: "error", message: err.message || "Network communication failed while syncing metrics" });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Top Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 p-6 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-300 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Executive Control Center</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Platform Master Dashboard
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Real-time synchronization across destination hierarchies, property verification pipelines, bookings, and financial analytics.
            </p>
            {lastSyncedTime && (
              <div className="mt-2 flex items-center gap-2 text-[11px] text-teal-400/90 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                <span>Last updated at {lastSyncedTime}</span>
              </div>
            )}
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={fetchStats}
              disabled={isRefreshing}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 active:scale-95 text-slate-200 border border-slate-700 text-xs font-semibold transition-all shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-teal-400" : ""}`} />
              <span>{isRefreshing ? "Syncing..." : "Sync Metrics"}</span>
            </button>
            <Link
              href="/admin/properties?status=pending_approval"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold transition-all shadow-lg shadow-teal-500/20"
            >
              <span>Verify Listings</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Sync Feedback Toast */}
        {syncFeedback && (
          <div
            className={`flex items-center gap-2.5 p-3.5 rounded-2xl text-xs font-semibold border animate-in fade-in slide-in-from-top-2 duration-200 ${
              syncFeedback.type === "success"
                ? "bg-teal-950/60 border-teal-500/30 text-teal-300"
                : "bg-rose-950/60 border-rose-500/30 text-rose-300"
            }`}
          >
            {syncFeedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-teal-400 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            )}
            <span>{syncFeedback.message}</span>
          </div>
        )}

        {isLoading ? (
          <div className="py-24 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-teal-400 mb-3" />
            <p className="text-xs">Aggregating platform datasets...</p>
          </div>
        ) : (
          <>
            {/* Primary Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {/* Card 1: Properties */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg relative overflow-hidden group hover:border-slate-700 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-400">Property Portfolio</span>
                  <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                    <Building2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-white">{stats?.totalProperties || 0}</span>
                  <span className="text-xs text-slate-500">properties</span>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-3 gap-1 text-[11px]">
                  <div>
                    <span className="text-emerald-400 font-bold block">{stats?.publishedProperties || 0}</span>
                    <span className="text-slate-500 text-[10px]">Published</span>
                  </div>
                  <div>
                    <span className="text-amber-400 font-bold block">{stats?.pendingProperties || 0}</span>
                    <span className="text-slate-500 text-[10px]">Pending</span>
                  </div>
                  <div>
                    <span className="text-red-400 font-bold block">{stats?.rejectedProperties || 0}</span>
                    <span className="text-slate-500 text-[10px]">Rejected</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Revenue */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg relative overflow-hidden group hover:border-slate-700 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-400">Gross Revenue</span>
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <CreditCard className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-white tracking-tight">
                    {formatCurrency(stats?.totalRevenue || 0)}
                  </span>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Active Subscriptions</span>
                  <span className="text-emerald-400 font-bold">{stats?.activeSubscriptions || 0} active</span>
                </div>
              </div>

              {/* Card 3: Bookings */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg relative overflow-hidden group hover:border-slate-700 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-400">Total Bookings</span>
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                    <CalendarCheck className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-white">{stats?.totalBookings || 0}</span>
                  <span className="text-xs text-slate-500">reservations</span>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-3 gap-1 text-[11px]">
                  <div>
                    <span className="text-blue-400 font-bold block">{stats?.confirmedBookings || 0}</span>
                    <span className="text-slate-500 text-[10px]">Confirmed</span>
                  </div>
                  <div>
                    <span className="text-emerald-400 font-bold block">{stats?.completedBookings || 0}</span>
                    <span className="text-slate-500 text-[10px]">Completed</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block">{stats?.cancelledBookings || 0}</span>
                    <span className="text-slate-500 text-[10px]">Cancelled</span>
                  </div>
                </div>
              </div>

              {/* Card 4: Platform Users */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg relative overflow-hidden group hover:border-slate-700 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-400">Users & Owners</span>
                  <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-white">
                    {(stats?.totalCustomers || 0) + (stats?.totalPropertyOwners || 0)}
                  </span>
                  <span className="text-xs text-slate-500">accounts</span>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                  <div>
                    <span className="text-purple-400 font-bold block">{stats?.totalPropertyOwners || 0}</span>
                    <span className="text-slate-500 text-[10px]">Property Owners</span>
                  </div>
                  <div>
                    <span className="text-slate-200 font-bold block">{stats?.totalCustomers || 0}</span>
                    <span className="text-slate-500 text-[10px]">Travelers</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Action Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Link
                href="/admin/destinations"
                className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-teal-500/40 hover:bg-slate-800/50 transition-all flex items-center gap-3 group"
              >
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 group-hover:scale-105 transition-transform">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">Destinations</span>
                  <span className="text-[10px] text-slate-400">5-level hierarchy</span>
                </div>
              </Link>

              <Link
                href="/admin/blogs"
                className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-teal-500/40 hover:bg-slate-800/50 transition-all flex items-center gap-3 group"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">Travel Blogs</span>
                  <span className="text-[10px] text-slate-400">{stats?.totalBlogs || 0} published</span>
                </div>
              </Link>

              <Link
                href="/admin/deals"
                className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-teal-500/40 hover:bg-slate-800/50 transition-all flex items-center gap-3 group"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">Active Deals</span>
                  <span className="text-[10px] text-slate-400">{stats?.activeDeals || 0} promotions</span>
                </div>
              </Link>

              <Link
                href="/admin/inquiries"
                className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-teal-500/40 hover:bg-slate-800/50 transition-all flex items-center gap-3 group"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">Inquiries</span>
                  <span className="text-[10px] text-slate-400">{stats?.totalInquiries || 0} messages</span>
                </div>
              </Link>
            </div>

            {/* Verification Alert Banner (if pending properties exist) */}
            {(stats?.pendingProperties || 0) > 0 && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-amber-200">
                      {stats?.pendingProperties} Properties Pending Super Admin Approval
                    </h3>
                    <p className="text-[11px] text-amber-300/80 mt-0.5">
                      Property owners have submitted new luxury listings awaiting verification of amenities and photos.
                    </p>
                  </div>
                </div>
                <Link
                  href="/admin/properties?status=pending_approval"
                  className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shrink-0 shadow-sm transition-all"
                >
                  Review Listings Now
                </Link>
              </div>
            )}

            {/* Audit Trail & Recent Activity */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
                <div>
                  <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                    <Clock className="w-4 h-4 text-teal-400" />
                    <span>Recent Administrative Audit Logs</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Immutable event log documenting Super Admin actions across the platform.
                  </p>
                </div>
                <Link
                  href="/admin/audit-logs"
                  className="text-xs text-teal-400 hover:text-teal-300 font-semibold flex items-center gap-1"
                >
                  <span>View All Logs</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="space-y-3">
                {stats?.recentActivity && stats.recentActivity.length > 0 ? (
                  stats.recentActivity.slice(0, 8).map((log) => (
                    <div
                      key={log.id}
                      className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-start justify-between gap-3 text-xs hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                            log.status === "success"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-red-500/10 text-red-400 border border-red-500/20"
                          }`}
                        >
                          {log.status === "success" ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-200 truncate">{log.details}</p>
                          <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                            <span className="text-slate-400 font-medium">{log.adminName}</span>
                            <span>•</span>
                            <span className="capitalize text-teal-400/80">{log.module.replace(/_/g, " ")}</span>
                            <span>•</span>
                            <span>{new Date(log.createdAt).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 font-mono text-[10px] shrink-0">
                        {log.action}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 py-6 text-center">No recent administrative logs recorded yet.</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
