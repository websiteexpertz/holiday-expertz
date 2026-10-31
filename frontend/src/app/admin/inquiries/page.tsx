"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { adminClient } from "@/lib/adminClient";
import { ContactInquiryRecord } from "@backend/types/admin";
import { MessageSquareQuote, Search, Mail, Phone, Clock, CheckCircle2, Trash2, Loader2, ArrowRight } from "lucide-react";

export default function AdminInquiriesPage() {
  const [inquiries, setInquiries] = useState<ContactInquiryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [activeInquiry, setActiveInquiry] = useState<ContactInquiryRecord | null>(null);
  const [notes, setNotes] = useState("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  const loadInquiries = useCallback(async () => {
    setIsLoading(true);
    const res = await adminClient.inquiries.getAll(statusFilter === "all" ? undefined : statusFilter);
    if (res.success && res.data?.inquiries) {
      setInquiries(res.data.inquiries);
    }
    setIsLoading(false);
  }, [statusFilter]);

  useEffect(() => {
    loadInquiries();
  }, [loadInquiries]);

  const handleUpdateStatus = async (id: string, newStatus: ContactInquiryRecord["status"]) => {
    const res = await adminClient.inquiries.update(id, { status: newStatus });
    if (res.success) {
      await loadInquiries();
    } else {
      alert(res.message || "Failed to update inquiry status");
    }
  };

  const handleOpenNotes = (inq: ContactInquiryRecord) => {
    setActiveInquiry(inq);
    setNotes(inq.adminNotes || "");
    setModalOpen(true);
  };

  const handleSaveNotes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeInquiry) return;

    setIsSavingNotes(true);
    const res = await adminClient.inquiries.update(activeInquiry.id, { adminNotes: notes });
    setIsSavingNotes(false);

    if (res.success) {
      setModalOpen(false);
      await loadInquiries();
    } else {
      alert(res.message || "Failed to save notes");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete contact message from "${name}"?`)) return;
    const res = await adminClient.inquiries.delete(id);
    if (res.success) {
      await loadInquiries();
    } else {
      alert(res.message || "Failed to delete inquiry");
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-semibold mb-2">
              <MessageSquareQuote className="w-3.5 h-3.5" />
              <span>Customer Helpdesk & Leads</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Contact Inquiries</h1>
            <p className="text-xs text-slate-400 mt-1">
              Inbound inquiries, customized corporate retreat quotes, and host partnership requests.
            </p>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {["all", "new", "in_progress", "resolved"].map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize whitespace-nowrap transition-all ${
                  statusFilter === tab
                    ? "bg-teal-500 text-slate-950 font-bold"
                    : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                {tab.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="py-24 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-teal-400 mb-2" />
            <p className="text-xs">Loading inquiries...</p>
          </div>
        ) : inquiries.length === 0 ? (
          <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl">
            <MessageSquareQuote className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-white">No inquiries found</h3>
          </div>
        ) : (
          <div className="space-y-4">
            {inquiries.map((inq) => (
              <div
                key={inq.id}
                className="p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all shadow-lg flex flex-col md:flex-row md:items-start justify-between gap-4"
              >
                <div className="space-y-2 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        inq.status === "new"
                          ? "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                          : inq.status === "in_progress"
                          ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                          : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                      }`}
                    >
                      {inq.status.replace("_", " ")}
                    </span>
                    <span className="text-xs font-bold text-white">{inq.subject}</span>
                    <span className="text-[11px] text-slate-500">• {new Date(inq.createdAt).toLocaleString()}</span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80">
                    {inq.message}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap pt-1">
                    <span className="font-semibold text-slate-200">{inq.name}</span>
                    <a href={`mailto:${inq.email}`} className="text-teal-400 hover:underline flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5" />
                      <span>{inq.email}</span>
                    </a>
                    {inq.phone && (
                      <span className="text-slate-400 flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5" />
                        <span>{inq.phone}</span>
                      </span>
                    )}
                  </div>

                  {inq.adminNotes && (
                    <div className="p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-300 text-[11px]">
                      <span className="font-bold">Internal Note:</span> {inq.adminNotes}
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row md:flex-col items-end gap-2 shrink-0">
                  <div className="flex items-center gap-1.5">
                    {inq.status === "new" && (
                      <button
                        onClick={() => handleUpdateStatus(inq.id, "in_progress")}
                        className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500 hover:text-slate-950 text-amber-300 text-xs font-bold transition-all"
                      >
                        In Progress
                      </button>
                    )}
                    {inq.status !== "resolved" && (
                      <button
                        onClick={() => handleUpdateStatus(inq.id, "resolved")}
                        className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500 hover:text-slate-950 text-emerald-300 text-xs font-bold transition-all"
                      >
                        Resolve
                      </button>
                    )}
                    <button
                      onClick={() => handleOpenNotes(inq)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                    >
                      {inq.adminNotes ? "Edit Note" : "Add Note"}
                    </button>
                    <button
                      onClick={() => handleDelete(inq.id, inq.name)}
                      className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-slate-800"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal for notes */}
        {modalOpen && activeInquiry && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                <h3 className="text-base font-bold text-white">Admin Internal Notes</h3>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveNotes} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Notes for inquiry from {activeInquiry.name}
                  </label>
                  <textarea
                    rows={4}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Called client on phone, sent special corporate proposal PDF via email..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-teal-500 resize-none leading-relaxed"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingNotes}
                    className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold uppercase tracking-wider shadow-md"
                  >
                    {isSavingNotes ? "Saving..." : "Save Note"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
