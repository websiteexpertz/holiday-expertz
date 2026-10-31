"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { adminClient } from "@/lib/adminClient";
import { PaymentRecord } from "@backend/types/admin";
import { CreditCard, Search, ArrowDownLeft, ArrowUpRight, CheckCircle2, RotateCcw, Loader2 } from "lucide-react";

export default function AdminSubscriptionsPage() {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [metrics, setMetrics] = useState<{ totalRevenue: number; subscriptionRevenue: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");
  const [search, setSearch] = useState("");

  const loadPayments = useCallback(async () => {
    setIsLoading(true);
    const res = await adminClient.payments.getAll({
      type: typeFilter === "all" ? undefined : typeFilter,
      search: search || undefined,
    });
    if (res.success && res.data) {
      setPayments(res.data.payments || []);
      setMetrics(res.data.metrics || null);
    }
    setIsLoading(false);
  }, [typeFilter, search]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const handleRefund = async (id: string, amount: number) => {
    if (!confirm(`Confirm issuing refund of ₹${amount.toLocaleString()} for this transaction?`)) return;
    const res = await adminClient.payments.updateStatus(id, "refunded", amount);
    if (res.success) {
      await loadPayments();
    } else {
      alert(res.message || "Failed to process refund");
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold mb-2">
                <CreditCard className="w-3.5 h-3.5" />
                <span>Financial Ledger</span>
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Subscriptions & Payments</h1>
              <p className="text-xs text-slate-400 mt-1">
                Transaction records for booking payments, property host subscriptions, and customer refunds.
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search reference, payer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          {/* Revenue Metric Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6">
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Gross Platform Volume</span>
              <span className="text-2xl font-extrabold text-white mt-1 block">
                ₹{(metrics?.totalRevenue || 0).toLocaleString()}
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] text-teal-400 font-bold uppercase tracking-wider block">Host Subscriptions</span>
              <span className="text-2xl font-extrabold text-teal-400 mt-1 block">
                ₹{(metrics?.subscriptionRevenue || 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
          {[
            { id: "all", label: "All Transactions" },
            { id: "booking_payment", label: "Booking Stays" },
            { id: "subscription_fee", label: "Host Subscriptions" },
            { id: "refund", label: "Refunds" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTypeFilter(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                typeFilter === tab.id
                  ? "bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20"
                  : "bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="py-24 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-400 mb-2" />
            <p className="text-xs">Loading ledger entries...</p>
          </div>
        ) : payments.length === 0 ? (
          <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl">
            <CreditCard className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-white">No transactions found</h3>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                  <th className="py-3.5 px-5">Transaction Ref</th>
                  <th className="py-3.5 px-4">Payer Details</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Gateway</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {payments.map((pay) => (
                  <tr key={pay.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-5">
                      <span className="font-mono font-bold text-white block">{pay.transactionReference}</span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">
                        {new Date(pay.createdAt).toLocaleString()}
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      <div className="font-bold text-white">{pay.payerName}</div>
                      <div className="text-[11px] text-slate-400">{pay.payerEmail}</div>
                      {pay.bookingReference && (
                        <span className="text-[10px] text-teal-400 font-mono">Ref: {pay.bookingReference}</span>
                      )}
                    </td>

                    <td className="py-4 px-4">
                      <span className="capitalize text-slate-300 font-medium">
                        {pay.type.replace(/_/g, " ")}
                      </span>
                    </td>

                    <td className="py-4 px-4 font-mono text-[11px] text-slate-400">
                      {pay.gateway}
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="font-extrabold text-white text-xs">
                        ₹{pay.amount.toLocaleString()}
                      </span>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold capitalize ${
                          pay.status === "successful"
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                            : pay.status === "refunded"
                            ? "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                            : "bg-red-500/15 text-red-400 border border-red-500/30"
                        }`}
                      >
                        {pay.status}
                      </span>
                    </td>

                    <td className="py-4 px-5 text-right whitespace-nowrap">
                      {pay.status === "successful" && pay.type === "booking_payment" && (
                        <button
                          onClick={() => handleRefund(pay.id, pay.amount)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-300 hover:text-red-400 text-xs font-bold transition-all flex items-center gap-1.5 ml-auto"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Issue Refund</span>
                        </button>
                      )}
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
