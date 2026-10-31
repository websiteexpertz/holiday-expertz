"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { adminClient } from "@/lib/adminClient";
import { BookingRecord } from "@backend/types/admin";
import {
  CalendarCheck,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Building2,
  Calendar,
  AlertCircle,
  Loader2,
  Trash2,
} from "lucide-react";

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  const loadBookings = useCallback(async () => {
    setIsLoading(true);
    const res = await adminClient.bookings.getAll({
      status: statusFilter === "all" ? undefined : statusFilter,
      search: search || undefined,
    });
    if (res.success && res.data?.bookings) {
      setBookings(res.data.bookings);
    }
    setIsLoading(false);
  }, [statusFilter, search]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const handleUpdateStatus = async (id: string, newStatus: BookingRecord["bookingStatus"]) => {
    const res = await adminClient.bookings.update(id, { bookingStatus: newStatus });
    if (res.success) {
      await loadBookings();
    } else {
      alert(res.message || "Failed to update booking status");
    }
  };

  const handleDelete = async (id: string, ref: string) => {
    if (!confirm(`Delete booking record ${ref}?`)) return;
    const res = await adminClient.bookings.delete(id);
    if (res.success) {
      await loadBookings();
    } else {
      alert(res.message || "Failed to delete booking");
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-semibold mb-2">
              <CalendarCheck className="w-3.5 h-3.5" />
              <span>Reservation Pipeline</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Bookings Management</h1>
            <p className="text-xs text-slate-400 mt-1">
              Monitor stays, customer reservations, payment clearance, and host check-in dates.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search reference, guest..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
          {["all", "confirmed", "completed", "pending", "cancelled"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold capitalize whitespace-nowrap transition-all ${
                statusFilter === st
                  ? "bg-blue-500 text-white shadow-md shadow-blue-500/20"
                  : "bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800"
              }`}
            >
              {st === "all" ? "All Bookings" : st}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="py-24 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-blue-400 mb-2" />
            <p className="text-xs">Loading reservations...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl">
            <CalendarCheck className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-white">No bookings match this filter</h3>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                  <th className="py-3.5 px-5">Reference & Property</th>
                  <th className="py-3.5 px-4">Guest Details</th>
                  <th className="py-3.5 px-4">Dates</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {bookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-5">
                      <span className="font-mono font-bold text-teal-400 block">{booking.bookingReference}</span>
                      <span className="font-semibold text-white block mt-0.5 truncate max-w-xs">
                        {booking.propertyName}
                      </span>
                      <span className="text-[11px] text-slate-500">{booking.propertyCity}</span>
                    </td>

                    <td className="py-4 px-4">
                      <div className="font-bold text-white">{booking.customerName}</div>
                      <div className="text-[11px] text-slate-400">{booking.customerEmail}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{booking.customerPhone}</div>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>{booking.checkInDate} → {booking.checkOutDate}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 mt-0.5 block">{booking.guests} guests</span>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="font-extrabold text-white text-xs">
                        ₹{booking.totalAmount.toLocaleString()}
                      </span>
                      <span
                        className={`text-[10px] font-bold capitalize block ${
                          booking.paymentStatus === "paid" ? "text-emerald-400" : "text-amber-400"
                        }`}
                      >
                        Payment: {booking.paymentStatus}
                      </span>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold capitalize ${
                          booking.bookingStatus === "confirmed"
                            ? "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                            : booking.bookingStatus === "completed"
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                            : booking.bookingStatus === "cancelled"
                            ? "bg-red-500/15 text-red-400 border border-red-500/30"
                            : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                        }`}
                      >
                        {booking.bookingStatus}
                      </span>
                    </td>

                    <td className="py-4 px-5 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        {booking.bookingStatus === "pending" && (
                          <button
                            onClick={() => handleUpdateStatus(booking.id, "confirmed")}
                            className="px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-300 hover:bg-blue-500 hover:text-white font-bold transition-all text-xs"
                          >
                            Confirm
                          </button>
                        )}
                        {booking.bookingStatus === "confirmed" && (
                          <button
                            onClick={() => handleUpdateStatus(booking.id, "completed")}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500 hover:text-slate-950 font-bold transition-all text-xs"
                          >
                            Complete
                          </button>
                        )}
                        {booking.bookingStatus !== "cancelled" && (
                          <button
                            onClick={() => handleUpdateStatus(booking.id, "cancelled")}
                            className="px-2 py-1 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors text-xs"
                          >
                            Cancel
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(booking.id, booking.bookingReference)}
                          className="p-1 text-slate-500 hover:text-red-400 rounded-lg hover:bg-slate-800"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
