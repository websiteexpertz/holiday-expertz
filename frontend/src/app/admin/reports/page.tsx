"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { adminClient } from "@/lib/adminClient";
import { BarChart3, Download, TrendingUp, DollarSign, CalendarCheck, Building2, Loader2 } from "lucide-react";

export default function AdminReportsPage() {
  const [stats, setStats] = useState<any>(null);
  const [properties, setProperties] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    const [statsRes, propsRes, booksRes] = await Promise.all([
      adminClient.dashboard.getStats(),
      adminClient.properties.getAll(),
      adminClient.bookings.getAll(),
    ]);

    if (statsRes.success && statsRes.data) setStats(statsRes.data.stats);
    if (propsRes.success && propsRes.data) setProperties(propsRes.data.properties || []);
    if (booksRes.success && booksRes.data) setBookings(booksRes.data.bookings || []);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Breakdown by property type
  const typeCounts: Record<string, number> = {};
  for (const p of properties) {
    typeCounts[p.propertyType] = (typeCounts[p.propertyType] || 0) + 1;
  }

  // Export CSV
  const handleExportCSV = () => {
    if (bookings.length === 0) {
      alert("No bookings to export");
      return;
    }

    const headers = ["Booking Ref", "Property", "Customer", "Check In", "Check Out", "Amount (INR)", "Status", "Payment"];
    const rows = bookings.map((b) => [
      b.bookingReference,
      `"${b.propertyName.replace(/"/g, '""')}"`,
      `"${b.customerName}"`,
      b.checkInDate,
      b.checkOutDate,
      b.totalAmount,
      b.bookingStatus,
      b.paymentStatus,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `HolidayExpertz_Report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-semibold mb-2">
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Platform Intelligence</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Reports & Analytics</h1>
            <p className="text-xs text-slate-400 mt-1">
              Cross-inventory analytics, portfolio segment distributions, and exportable financial summaries.
            </p>
          </div>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-teal-500/20 transition-all self-start sm:self-auto"
          >
            <Download className="w-4 h-4" />
            <span>Export Bookings CSV</span>
          </button>
        </div>

        {isLoading ? (
          <div className="py-24 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-teal-400 mb-2" />
            <p className="text-xs">Computing analytics distributions...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Top KPI row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-md">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Platform GMV</span>
                <span className="text-2xl font-extrabold text-white mt-1 block">
                  ₹{(stats?.totalRevenue || 0).toLocaleString()}
                </span>
                <span className="text-[11px] text-emerald-400 mt-1 block font-medium">Includes stays & host subscriptions</span>
              </div>

              <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-md">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Completed Bookings</span>
                <span className="text-2xl font-extrabold text-teal-400 mt-1 block">
                  {stats?.completedBookings || 0}
                </span>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Out of {stats?.totalBookings || 0} total reservations
                </span>
              </div>

              <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-md">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Active Stays Ratio</span>
                <span className="text-2xl font-extrabold text-emerald-400 mt-1 block">
                  {stats?.totalProperties > 0
                    ? Math.round(((stats?.publishedProperties || 0) / stats.totalProperties) * 100)
                    : 0}%
                </span>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  {stats?.publishedProperties || 0} published / {stats?.totalProperties || 0} total
                </span>
              </div>
            </div>

            {/* Visual Breakdown by Property Type */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
              <h2 className="text-base font-bold text-white mb-4">Inventory Distribution by Accommodation Category</h2>
              <div className="space-y-3">
                {Object.entries(typeCounts).map(([type, count]) => {
                  const pct = properties.length > 0 ? Math.round((count / properties.length) * 100) : 0;
                  return (
                    <div key={type} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-200">{type}</span>
                        <span className="text-slate-400">{count} properties ({pct}%)</span>
                      </div>
                      <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                        <div
                          className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
