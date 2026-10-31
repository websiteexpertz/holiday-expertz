"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { adminClient } from "@/lib/adminClient";
import {
  UserCheck,
  Search,
  Mail,
  Phone,
  Building2,
  Trash2,
  Loader2,
  CheckCircle2,
  UserPlus,
  X,
  Lock,
  Copy,
  Check,
  MapPin,
  Sparkles,
} from "lucide-react";

export default function AdminOwnersPage() {
  const [owners, setOwners] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Add Owner Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"active" | "pending_review">("active");
  const [address, setAddress] = useState("");
  const [altPhone, setAltPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState("");
  const [createdSuccess, setCreatedSuccess] = useState<{
    owner: any;
    tempPassword?: string;
  } | null>(null);
  const [copiedPass, setCopiedPass] = useState(false);

  const loadOwners = useCallback(async () => {
    setIsLoading(true);
    const res = await adminClient.owners.getAll();
    if (res.success && res.data?.owners) {
      setOwners(res.data.owners);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadOwners();
  }, [loadOwners]);

  const resetForm = () => {
    setFullName("");
    setEmail("");
    setMobileNumber("");
    setBusinessName("");
    setPassword("");
    setStatus("active");
    setAddress("");
    setAltPhone("");
    setModalError("");
    setCreatedSuccess(null);
    setCopiedPass(false);
  };

  const handleOpenAddModal = () => {
    resetForm();
    setModalOpen(true);
  };

  const handleCreateOwner = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError("");

    if (!fullName.trim() || !email.trim() || !mobileNumber.trim()) {
      setModalError("Full name, email address, and mobile number are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await adminClient.owners.create({
        fullName: fullName.trim(),
        email: email.trim(),
        mobileNumber: mobileNumber.trim(),
        password: password.trim() || undefined,
        businessName: businessName.trim() || undefined,
        status,
        address: address.trim() || undefined,
        altPhone: altPhone.trim() || undefined,
      });

      if (res.success && res.data?.owner) {
        setCreatedSuccess({
          owner: res.data.owner,
          tempPassword: res.data.tempPassword,
        });
        await loadOwners();
      } else {
        setModalError(res.message || "Failed to create property owner account.");
      }
    } catch (err: any) {
      setModalError(err.message || "Network error while creating owner.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyPassword = (pass: string) => {
    navigator.clipboard.writeText(pass);
    setCopiedPass(true);
    setTimeout(() => setCopiedPass(false), 2500);
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === "active" ? "suspended" : "active";
    const res = await adminClient.owners.updateStatus(id, nextStatus as any);
    if (res.success) {
      await loadOwners();
    } else {
      alert(res.message || "Failed to update owner status");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete owner "${name}"?`)) return;
    const res = await adminClient.owners.delete(id);
    if (res.success) {
      await loadOwners();
    } else {
      alert(res.message || "Failed to delete owner");
    }
  };

  const filtered = owners.filter((o) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (o.fullName || "").toLowerCase().includes(q) ||
      (o.email || "").toLowerCase().includes(q) ||
      (o.mobileNumber || "").toLowerCase().includes(q) ||
      (o.businessName || "").toLowerCase().includes(q)
    );
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Top Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 text-teal-400 text-xs font-semibold mb-2">
              <UserCheck className="w-3.5 h-3.5" />
              <span>Host Management</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Property Owners</h1>
            <p className="text-xs text-slate-400 mt-1">
              Manage registered hosts, monitor their published property counts, and control account active status.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search hosts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
              />
            </div>

            <button
              type="button"
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Owner</span>
            </button>
          </div>
        </div>

        {/* Owners Table or Empty State */}
        {isLoading ? (
          <div className="py-24 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-teal-400 mb-2" />
            <p className="text-xs">Loading property owners...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl space-y-3">
            <UserCheck className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-sm font-bold text-white">No property owners found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {search ? "No owners matched your search query." : "Get started by adding your first property owner to the portal."}
            </p>
            {!search && (
              <button
                type="button"
                onClick={handleOpenAddModal}
                className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Add First Owner</span>
              </button>
            )}
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                  <th className="py-3.5 px-5">Host Name</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Business / Brand</th>
                  <th className="py-3.5 px-4">Properties</th>
                  <th className="py-3.5 px-4">Account Status</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filtered.map((owner) => (
                  <tr key={owner.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-teal-500 to-emerald-400 text-slate-950 font-bold flex items-center justify-center uppercase">
                          {owner.fullName?.charAt(0) || "O"}
                        </div>
                        <div>
                          <span className="font-bold text-white block">{owner.fullName}</span>
                          <span className="text-[10px] text-slate-500 font-mono">ID: {owner.id}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Mail className="w-3.5 h-3.5 text-slate-500" />
                        <span>{owner.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1">
                        <Phone className="w-3 h-3 text-slate-600" />
                        <span>{owner.mobileNumber}</span>
                      </div>
                    </td>

                    <td className="py-4 px-4 text-slate-300">
                      {owner.businessName || <span className="text-slate-600">Individual Host</span>}
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-teal-400" />
                        <span className="font-bold text-white">{owner.propertiesCount || 0}</span>
                        <span className="text-[11px] text-emerald-400 font-semibold">
                          ({owner.publishedCount || 0} live)
                        </span>
                      </div>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold capitalize ${
                          owner.status === "active"
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                            : "bg-red-500/15 text-red-400 border border-red-500/30"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${owner.status === "active" ? "bg-emerald-400" : "bg-red-400"}`} />
                        {owner.status?.replace("_", " ")}
                      </span>
                    </td>

                    <td className="py-4 px-5 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => handleToggleStatus(owner.id, owner.status)}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                            owner.status === "active"
                              ? "bg-slate-800 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300"
                              : "bg-emerald-500 hover:bg-emerald-400 text-slate-950"
                          }`}
                        >
                          {owner.status === "active" ? "Suspend" : "Activate"}
                        </button>
                        <button
                          onClick={() => handleDelete(owner.id, owner.fullName)}
                          className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-slate-800"
                          title="Delete Owner Account"
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

        {/* ── Add Owner Modal ── */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl relative text-xs">
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Add Property Owner</h3>
                    <p className="text-[11px] text-slate-400">
                      Manually onboard a host and set their login credentials.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Success Notification Banner */}
              {createdSuccess ? (
                <div className="space-y-5 py-2">
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 space-y-3">
                    <div className="flex items-center gap-2 font-bold text-sm text-emerald-400">
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Property Owner Account Created!</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      The owner <strong className="text-white font-semibold">{createdSuccess.owner.fullName}</strong> is now registered in the platform database. They can immediately log in to the owner portal with the credentials below.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Account Credentials</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-slate-500 block text-[10px]">Email ID (Username)</span>
                        <span className="font-mono font-bold text-white select-all">{createdSuccess.owner.email}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Mobile Number</span>
                        <span className="font-mono text-slate-300 select-all">{createdSuccess.owner.mobileNumber}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-3">
                      <div>
                        <span className="text-slate-500 block text-[10px]">Assigned Password</span>
                        <span className="font-mono font-bold text-teal-300 select-all">
                          {createdSuccess.tempPassword || password || "••••••••"}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyPassword(createdSuccess.tempPassword || password || "")}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-colors font-semibold"
                      >
                        {copiedPass ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedPass ? "Copied!" : "Copy Password"}</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold transition-all"
                    >
                      Add Another Owner
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalOpen(false)}
                      className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold shadow-sm transition-all"
                    >
                      Done
                    </button>
                  </div>
                </div>
              ) : (
                /* Owner Registration Form */
                <form onSubmit={handleCreateOwner} className="space-y-4">
                  {modalError && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                      <span>{modalError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Full Name */}
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">
                        Host Full Name <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Vikramaditya Singh"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">
                        Email Address <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="e.g. vikram@royalhaveli.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500"
                      />
                    </div>

                    {/* Mobile Number */}
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">
                        Mobile Number <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="e.g. +91 98765 43210"
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500"
                      />
                    </div>

                    {/* Business Name */}
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">
                        Business / Brand Name <span className="text-slate-500 font-normal">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Royal Heritage Havelis & Resorts"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500"
                      />
                    </div>

                    {/* Password */}
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">
                        Portal Password <span className="text-slate-500 font-normal">(Optional)</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Leave blank for auto: Owner@HolidayExpertz2026!"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-3.5 pr-8 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500 font-mono"
                        />
                        <Lock className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                      <span className="text-[10px] text-slate-500 mt-1 block">
                        If left empty, default password <code className="text-teal-400">Owner@HolidayExpertz2026!</code> is set.
                      </span>
                    </div>

                    {/* Status */}
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">
                        Initial Account Status
                      </label>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value as any)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-teal-500"
                      >
                        <option value="active">Active (Can immediately list properties)</option>
                        <option value="pending_review">Pending Verification (Under Review)</option>
                      </select>
                    </div>

                    {/* Base Location / Address */}
                    <div className="sm:col-span-2">
                      <label className="block font-semibold text-slate-300 mb-1">
                        Base Address / City <span className="text-slate-500 font-normal">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Udaipur, Rajasthan, India"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500"
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setModalOpen(false)}
                      className="px-4 py-2.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl font-bold shadow-md transition-all active:scale-95 cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Creating Account...</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4" />
                          <span>Create Owner Account</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
