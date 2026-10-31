"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { adminClient } from "@/lib/adminClient";
import { CustomerUserRecord } from "@backend/types/admin";
import { Users, Search, Mail, Phone, MapPin, CalendarCheck, Loader2 } from "lucide-react";

export default function AdminUsersPage() {
  const [customers, setCustomers] = useState<CustomerUserRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadCustomers = useCallback(async () => {
    setIsLoading(true);
    const res = await adminClient.users.getAll();
    if (res.success && res.data?.customers) {
      setCustomers(res.data.customers);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === "active" ? "suspended" : "active";
    const res = await adminClient.users.updateStatus(id, nextStatus as any);
    if (res.success) {
      await loadCustomers();
    } else {
      alert(res.message || "Failed to update user status");
    }
  };

  const filtered = customers.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.fullName.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.city || "").toLowerCase().includes(q) ||
      (c.phone || "").toLowerCase().includes(q)
    );
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-xs font-semibold mb-2">
              <Users className="w-3.5 h-3.5" />
              <span>Traveler Profiles</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Customer Users</h1>
            <p className="text-xs text-slate-400 mt-1">
              Registered travelers who make bookings and leave guest reviews across the platform.
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search customers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="py-24 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-purple-400 mb-2" />
            <p className="text-xs">Loading travelers accounts...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl">
            <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-white">No travelers found</h3>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                  <th className="py-3.5 px-5">Traveler</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Origin City</th>
                  <th className="py-3.5 px-4">Total Bookings</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filtered.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 text-white font-bold flex items-center justify-center uppercase">
                          {user.fullName.charAt(0)}
                        </div>
                        <div>
                          <span className="font-bold text-white block">{user.fullName}</span>
                          <span className="text-[10px] text-slate-500">Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Mail className="w-3.5 h-3.5 text-slate-500" />
                        <span>{user.email}</span>
                      </div>
                      {user.phone && (
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1">
                          <Phone className="w-3 h-3 text-slate-600" />
                          <span>{user.phone}</span>
                        </div>
                      )}
                    </td>

                    <td className="py-4 px-4 text-slate-300">
                      {user.city ? (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-500" />
                          <span>{user.city}, {user.country}</span>
                        </div>
                      ) : (
                        <span className="text-slate-600">Unspecified</span>
                      )}
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-bold text-white">
                        <CalendarCheck className="w-3.5 h-3.5 text-teal-400" />
                        <span>{user.totalBookings} bookings</span>
                      </div>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold capitalize ${
                          user.status === "active"
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                            : "bg-red-500/15 text-red-400 border border-red-500/30"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${user.status === "active" ? "bg-emerald-400" : "bg-red-400"}`} />
                        {user.status}
                      </span>
                    </td>

                    <td className="py-4 px-5 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleToggleStatus(user.id, user.status)}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                          user.status === "active"
                            ? "bg-slate-800 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300"
                            : "bg-emerald-500 hover:bg-emerald-400 text-slate-950"
                        }`}
                      >
                        {user.status === "active" ? "Suspend" : "Activate"}
                      </button>
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
