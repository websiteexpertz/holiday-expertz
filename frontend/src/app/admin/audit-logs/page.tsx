"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { adminClient } from "@/lib/adminClient";
import { AuditLogRecord } from "@backend/types/admin";
import { History, Search, CheckCircle2, XCircle, Filter, Loader2 } from "lucide-react";

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [moduleFilter, setModuleFilter] = useState("all");
  const [search, setSearch] = useState("");

  const loadLogs = useCallback(async () => {
    setIsLoading(true);
    const res = await adminClient.auditLogs.getAll({
      module: moduleFilter === "all" ? undefined : moduleFilter,
      limit: 150,
    });
    if (res.success && res.data?.logs) {
      setLogs(res.data.logs);
    }
    setIsLoading(false);
  }, [moduleFilter]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const filtered = logs.filter((log) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      log.details.toLowerCase().includes(q) ||
      log.adminName.toLowerCase().includes(q) ||
      log.action.toLowerCase().includes(q) ||
      (log.resourceId || "").toLowerCase().includes(q)
    );
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 text-teal-400 text-xs font-semibold mb-2">
              <History className="w-3.5 h-3.5" />
              <span>Security Event Trail</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Audit Trail Logs</h1>
            <p className="text-xs text-slate-400 mt-1">
              Append-only audit trail logging Super Admin logins, property approvals, rejections, and setting modifications.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search audit events..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
            />
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
          {[
            { id: "all", label: "All Logs" },
            { id: "properties_management", label: "Properties" },
            { id: "destinations", label: "Destinations" },
            { id: "admin_management", label: "Admin Staff & Auth" },
            { id: "bookings_management", label: "Bookings" },
            { id: "subscriptions_and_payments", label: "Payments" },
            { id: "blog_management", label: "Blogs" },
            { id: "website_content", label: "CMS Content" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setModuleFilter(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                moduleFilter === tab.id
                  ? "bg-teal-500 text-slate-950 font-bold shadow-md shadow-teal-500/20"
                  : "bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="py-24 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-teal-400 mb-2" />
            <p className="text-xs">Loading audit event trail...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl">
            <History className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-white">No audit logs found</h3>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                  <th className="py-3.5 px-5">Timestamp</th>
                  <th className="py-3.5 px-4">Admin Operator</th>
                  <th className="py-3.5 px-4">Module</th>
                  <th className="py-3.5 px-4">Action</th>
                  <th className="py-3.5 px-5">Event Details</th>
                  <th className="py-3.5 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-5 whitespace-nowrap text-slate-400 font-mono text-[11px]">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="font-bold text-white block">{log.adminName}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{log.adminEmail}</span>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-teal-300 font-mono text-[10px] capitalize">
                        {log.module.replace(/_/g, " ")}
                      </span>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap font-mono text-slate-300">
                      {log.action}
                    </td>

                    <td className="py-4 px-5 text-slate-300 leading-relaxed max-w-md">
                      {log.details}
                      {log.resourceId && (
                        <span className="block text-[10px] font-mono text-slate-500 mt-0.5">
                          Resource ID: {log.resourceId}
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-4 text-right whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                          log.status === "success"
                            ? "bg-emerald-500/15 text-emerald-400"
                            : "bg-red-500/15 text-red-400"
                        }`}
                      >
                        {log.status === "success" ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <XCircle className="w-3 h-3" />
                        )}
                        <span>{log.status}</span>
                      </span>
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
