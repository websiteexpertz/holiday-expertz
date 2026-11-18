"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { adminClient } from "@/lib/adminClient";
import { apiUrl } from "@/lib/apiUrl";
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
  Plus,
  X,
  Lock,
  Copy,
  Check,
  MapPin,
  Sparkles,
  Camera,
  User,
  Edit2,
  Eye,
  Globe,
  Calendar,
  ExternalLink,
} from "lucide-react";

const AVAILABLE_LANGUAGES = [
  "English",
  "Hindi",
  "French",
  "Spanish",
  "German",
  "Arabic",
  "Italian",
  "Portuguese",
  "Mandarin Chinese",
  "Japanese",
  "Russian",
  "Bengali",
  "Punjabi",
  "Tamil",
  "Telugu",
  "Malayalam",
  "Marathi",
  "Gujarati",
  "Urdu",
  "Korean",
  "Turkish",
  "Dutch",
  "Indonesian",
  "Thai",
  "Vietnamese",
  "Persian",
  "Swedish",
  "Polish",
];

export default function AdminOwnersPage() {
  const [owners, setOwners] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [copiedOwnerId, setCopiedOwnerId] = useState<string | null>(null);

  // Add / Edit Owner Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editOwnerId, setEditOwnerId] = useState<string | null>(null);

  // View Owner Details Modal State
  const [viewingOwner, setViewingOwner] = useState<any | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  const handleOpenViewModal = (owner: any) => {
    setViewingOwner(owner);
    setViewModalOpen(true);
  };
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"active" | "pending_review">("active");
  const [address, setAddress] = useState("");
  const [altPhone, setAltPhone] = useState("");

  // Owner Profile Details State
  const [profileImage, setProfileImage] = useState("");
  const [languagesSpoken, setLanguagesSpoken] = useState<string[]>([]);
  const [selectedLangToAdd, setSelectedLangToAdd] = useState("");
  const [aboutOwner, setAboutOwner] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageError, setImageError] = useState("");

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
    setEditOwnerId(null);
    setFullName("");
    setEmail("");
    setMobileNumber("");
    setBusinessName("");
    setPassword("");
    setStatus("active");
    setAddress("");
    setAltPhone("");
    setProfileImage("");
    setLanguagesSpoken([]);
    setSelectedLangToAdd("");
    setAboutOwner("");
    setImageError("");
    setIsUploadingImage(false);
    setModalError("");
    setCreatedSuccess(null);
    setCopiedPass(false);
  };

  const handleOpenAddModal = () => {
    resetForm();
    setModalOpen(true);
  };

  const handleOpenEditModal = (owner: any) => {
    resetForm();
    setEditOwnerId(owner.id);
    setFullName(owner.fullName || "");
    setEmail(owner.email || "");
    setMobileNumber(owner.mobileNumber || "");
    setBusinessName(owner.businessName || "");
    setPassword("");
    setStatus(owner.status || "active");
    setAddress(owner.address || "");
    setAltPhone(owner.altPhone || "");
    setProfileImage(owner.profileImage || owner.avatar || "");
    setLanguagesSpoken(Array.isArray(owner.languagesSpoken) ? owner.languagesSpoken : []);
    setAboutOwner(owner.aboutOwner || owner.bio || "");
    setModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageError("");
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setImageError("Invalid file type. Supported formats: JPG, PNG, WebP.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setImageError("File size exceeds 5 MB. Please choose a smaller image.");
      return;
    }

    setIsUploadingImage(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);

      const res = await fetch(apiUrl("/api/upload"), {
        method: "POST",
        body: formDataUpload,
      });

      const data = await res.json();
      if (data.success && data.url) {
        setProfileImage(data.url);
      } else {
        setImageError(data.message || "Failed to upload image.");
      }
    } catch (err: any) {
      setImageError(err.message || "Network error while uploading image.");
    } finally {
      setIsUploadingImage(false);
      e.target.value = "";
    }
  };

  const handleRemoveImage = () => {
    setProfileImage("");
    setImageError("");
  };

  const handleAddLanguage = () => {
    if (!selectedLangToAdd.trim()) return;
    const lang = selectedLangToAdd.trim();
    if (!languagesSpoken.includes(lang)) {
      setLanguagesSpoken((prev) => [...prev, lang]);
    }
    setSelectedLangToAdd("");
  };

  const handleRemoveLanguage = (langToRemove: string) => {
    setLanguagesSpoken((prev) => prev.filter((l) => l !== langToRemove));
  };

  const handleSubmitOwner = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError("");

    if (!fullName.trim() || !email.trim() || !mobileNumber.trim()) {
      setModalError("Full name, email address, and mobile number are required.");
      return;
    }

    if (aboutOwner.length > 2000) {
      setModalError("About the owner cannot exceed 2,000 characters.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editOwnerId) {
        const res = await adminClient.owners.update(editOwnerId, {
          fullName: fullName.trim(),
          email: email.trim(),
          mobileNumber: mobileNumber.trim(),
          password: password.trim() || undefined,
          businessName: businessName.trim() || undefined,
          status,
          address: address.trim() || undefined,
          profileImage: profileImage || null,
          languagesSpoken,
          aboutOwner: aboutOwner.trim(),
          altPhone: altPhone.trim() || undefined,
        });

        if (res.success) {
          await loadOwners();
          setModalOpen(false);
        } else {
          setModalError(res.message || "Failed to update property owner.");
        }
      } else {
        const res = await adminClient.owners.create({
          fullName: fullName.trim(),
          email: email.trim(),
          mobileNumber: mobileNumber.trim(),
          password: password.trim() || undefined,
          businessName: businessName.trim() || undefined,
          status,
          address: address.trim() || undefined,
          profileImage: profileImage || null,
          languagesSpoken,
          aboutOwner: aboutOwner.trim(),
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
      }
    } catch (err: any) {
      setModalError(err.message || "Network error while saving owner.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyPassword = (pass: string) => {
    navigator.clipboard.writeText(pass);
    setCopiedPass(true);
    setTimeout(() => setCopiedPass(false), 2500);
  };

  const handleCopyOwnerNumber = (ownerNumber: string, id: string) => {
    navigator.clipboard.writeText(ownerNumber);
    setCopiedOwnerId(id);
    setTimeout(() => setCopiedOwnerId(null), 2500);
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
    const q = search.toLowerCase().trim();
    const ownerNum = (o.ownerNumber || "").toLowerCase();
    return (
      ownerNum.includes(q) ||
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
                placeholder="Search by Owner ID, name, email or phone..."
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
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[950px]">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                    <th className="py-3.5 px-5">Owner No.</th>
                    <th className="py-3.5 px-4">Host Name</th>
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
                      <td className="py-4 px-5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-teal-400 text-xs sm:text-sm tracking-wide">
                            {owner.ownerNumber || (
                              <span className="text-slate-500 font-mono text-xs">Pending</span>
                            )}
                          </span>
                          {owner.ownerNumber && (
                            <button
                              type="button"
                              onClick={() => handleCopyOwnerNumber(owner.ownerNumber, owner.id)}
                              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-teal-300 transition-colors cursor-pointer group relative"
                              title="Copy Owner Number"
                            >
                              {copiedOwnerId === owner.id ? (
                                <Check className="w-3.5 h-3.5 text-teal-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-300" />
                              )}
                              {copiedOwnerId === owner.id && (
                                <span className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-slate-950 border border-teal-500/30 text-[10px] text-teal-300 font-sans shadow-lg whitespace-nowrap z-10">
                                  Copied!
                                </span>
                              )}
                            </button>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div
                          onClick={() => handleOpenViewModal(owner)}
                          className="flex items-center gap-3 cursor-pointer group"
                          title="Click to view full host details"
                        >
                          {owner.profileImage || owner.avatar ? (
                            <img
                              src={owner.profileImage || owner.avatar}
                              alt={owner.fullName}
                              className="w-10 h-10 rounded-full object-cover border border-slate-700 shrink-0 group-hover:border-teal-500 transition-colors"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-teal-500 to-emerald-400 text-slate-950 font-bold flex items-center justify-center uppercase shrink-0 group-hover:ring-2 group-hover:ring-teal-400 transition-all">
                              {owner.fullName?.charAt(0) || "O"}
                            </div>
                          )}
                          <div>
                            <span className="font-bold text-white block group-hover:text-teal-300 transition-colors">
                              {owner.fullName}
                            </span>
                            <span className="text-[10px] text-teal-400/80 font-medium group-hover:underline">
                              View Profile
                            </span>
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
                            type="button"
                            onClick={() => handleOpenViewModal(owner)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-teal-300 transition-all border border-slate-700/60 cursor-pointer active:scale-95"
                            title={`View full details of ${owner.fullName}`}
                          >
                            <Eye className="w-3.5 h-3.5 shrink-0" />
                            <span>View</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(owner)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all border border-slate-700/60 cursor-pointer active:scale-95"
                            title={`Edit ${owner.fullName}`}
                          >
                            <Edit2 className="w-3.5 h-3.5 shrink-0" />
                            <span>Edit</span>
                          </button>
                          <Link
                            href={`/admin/properties/new?ownerId=${encodeURIComponent(owner.id)}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 h-7 rounded-xl font-bold text-xs bg-teal-600 hover:bg-teal-500 text-white transition-all shadow-xs cursor-pointer active:scale-95"
                            title={`Add property for ${owner.fullName}`}
                          >
                            <Plus className="w-3.5 h-3.5 shrink-0" />
                            <span>Add Property</span>
                          </Link>
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
          </div>
        )}

        {/* ── View Owner Details Modal ── */}
        {viewModalOpen && viewingOwner && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl relative text-xs space-y-5">
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Owner Profile & Host Details</h3>
                    <p className="text-[11px] text-slate-400">Complete partner identity, profile, and property portfolio</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setViewModalOpen(false);
                    setViewingOwner(null);
                  }}
                  className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Top Host Profile Card */}
              <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row items-center sm:items-start gap-4">
                {viewingOwner.profileImage || viewingOwner.avatar ? (
                  <img
                    src={viewingOwner.profileImage || viewingOwner.avatar}
                    alt={viewingOwner.fullName}
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-teal-500/40 shadow-md shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-400 text-slate-950 text-2xl font-black flex items-center justify-center uppercase shrink-0 shadow-md">
                    {viewingOwner.fullName?.charAt(0) || "O"}
                  </div>
                )}
                <div className="flex-1 text-center sm:text-left space-y-1.5 w-full">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <h4 className="text-lg font-bold text-white tracking-tight">{viewingOwner.fullName}</h4>
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold capitalize self-center sm:self-auto ${
                        viewingOwner.status === "active"
                          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                          : "bg-red-500/15 text-red-400 border border-red-500/30"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${viewingOwner.status === "active" ? "bg-emerald-400" : "bg-red-400"}`} />
                      {viewingOwner.status?.replace("_", " ")}
                    </span>
                  </div>

                  <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Owner ID:</span>
                      <span className="font-mono font-bold text-teal-400 text-xs">{viewingOwner.ownerNumber || "Pending"}</span>
                      {viewingOwner.ownerNumber && (
                        <button
                          type="button"
                          onClick={() => handleCopyOwnerNumber(viewingOwner.ownerNumber, viewingOwner.id)}
                          className="text-slate-400 hover:text-teal-300 p-0.5 rounded cursor-pointer transition-colors"
                          title="Copy Owner ID"
                        >
                          {copiedOwnerId === viewingOwner.id ? (
                            <Check className="w-3 h-3 text-teal-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      )}
                    </div>
                    <span className="text-slate-500 text-xs">•</span>
                    <span className="text-slate-300 font-medium text-xs">
                      {viewingOwner.businessName || "Individual Host"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Contact & Location Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
                  <div className="flex items-center gap-2 text-slate-400 text-[11px] font-medium">
                    <Mail className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                    <span>Email Address</span>
                  </div>
                  <a
                    href={`mailto:${viewingOwner.email}`}
                    className="text-white hover:text-teal-300 font-semibold text-xs block transition-colors truncate"
                  >
                    {viewingOwner.email}
                  </a>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
                  <div className="flex items-center gap-2 text-slate-400 text-[11px] font-medium">
                    <Phone className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                    <span>Primary Mobile</span>
                  </div>
                  <a
                    href={`tel:${viewingOwner.mobileNumber}`}
                    className="text-white hover:text-teal-300 font-semibold text-xs block transition-colors"
                  >
                    {viewingOwner.mobileNumber || "Not provided"}
                  </a>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
                  <div className="flex items-center gap-2 text-slate-400 text-[11px] font-medium">
                    <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>Alternative Phone</span>
                  </div>
                  <span className="text-slate-300 text-xs block">
                    {viewingOwner.altPhone || <span className="text-slate-600">None</span>}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
                  <div className="flex items-center gap-2 text-slate-400 text-[11px] font-medium">
                    <MapPin className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                    <span>Location / Address</span>
                  </div>
                  <span className="text-slate-300 text-xs block truncate">
                    {viewingOwner.address || <span className="text-slate-600">Not provided</span>}
                  </span>
                </div>
              </div>

              {/* Languages Spoken */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-slate-300 font-bold text-xs">
                  <Globe className="w-4 h-4 text-teal-400" />
                  <span>Languages Spoken</span>
                </div>
                {viewingOwner.languagesSpoken && viewingOwner.languagesSpoken.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {viewingOwner.languagesSpoken.map((lang: string) => (
                      <span
                        key={lang}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-teal-500/10 text-teal-300 border border-teal-500/25"
                      >
                        {lang}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-xs italic">No languages specified.</p>
                )}
              </div>

              {/* About the Owner */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-slate-300 font-bold text-xs">
                  <User className="w-4 h-4 text-teal-400" />
                  <span>About the Host</span>
                </div>
                {viewingOwner.aboutOwner ? (
                  <p className="text-slate-300 text-xs leading-relaxed whitespace-pre-wrap">
                    {viewingOwner.aboutOwner}
                  </p>
                ) : (
                  <p className="text-slate-500 text-xs italic">No bio / description added for this host yet.</p>
                )}
              </div>

              {/* Managed Properties Portfolio */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-300 font-bold text-xs">
                    <Building2 className="w-4 h-4 text-teal-400" />
                    <span>Managed Properties ({viewingOwner.propertiesCount || 0})</span>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-400">
                    {viewingOwner.publishedCount || 0} live
                  </span>
                </div>

                {viewingOwner.properties && viewingOwner.properties.length > 0 ? (
                  <div className="divide-y divide-slate-800/80 border border-slate-800 rounded-xl overflow-hidden">
                    {viewingOwner.properties.map((prop: any) => (
                      <div key={prop.id} className="p-3 bg-slate-900/60 hover:bg-slate-900 flex items-center justify-between gap-3 transition-colors">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-teal-400 text-[11px]">{prop.propertyNumber || prop.id}</span>
                            <span className="text-white font-semibold text-xs">{prop.name}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400">
                            <span>{prop.propertyType}</span>
                            {prop.location && <span>• {prop.location}</span>}
                            {prop.pricePerNight && <span>• ${prop.pricePerNight} / night</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              prop.status === "approved"
                                ? "bg-emerald-500/15 text-emerald-400"
                                : "bg-amber-500/15 text-amber-400"
                            }`}
                          >
                            {prop.status}
                          </span>
                          <Link
                            href={`/properties/${prop.id}`}
                            target="_blank"
                            className="p-1 text-slate-400 hover:text-teal-300 rounded hover:bg-slate-800 transition-colors"
                            title="View public property listing"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-xs italic">No properties assigned to this owner yet.</p>
                )}
              </div>

              {/* Modal Footer Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-800 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const target = viewingOwner;
                      setViewModalOpen(false);
                      setViewingOwner(null);
                      handleOpenEditModal(target);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-teal-300 transition-all border border-slate-700/60 cursor-pointer active:scale-95"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Profile</span>
                  </button>
                  <Link
                    href={`/admin/properties/new?ownerId=${encodeURIComponent(viewingOwner.id)}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold text-xs bg-teal-600 hover:bg-teal-500 text-white transition-all shadow-sm cursor-pointer active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Property</span>
                  </Link>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setViewModalOpen(false);
                    setViewingOwner(null);
                  }}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Add / Edit Owner Modal ── */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl relative text-xs">
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                    {editOwnerId ? <Edit2 className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">
                      {editOwnerId ? "Edit Property Owner" : "Add Property Owner"}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      {editOwnerId
                        ? "Update host profile, contact information, and hospitality details."
                        : "Manually onboard a host and set their login credentials."}
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

              {/* Success Notification Banner (Add Mode only) */}
              {!editOwnerId && createdSuccess ? (
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
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <span className="text-slate-500 block text-[10px]">Owner Number</span>
                        <span className="font-mono font-bold text-teal-400 select-all">{createdSuccess.owner.ownerNumber || "Generated"}</span>
                      </div>
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
                /* Owner Registration & Edit Form */
                <form onSubmit={handleSubmitOwner} className="space-y-5">
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
                          placeholder={
                            editOwnerId
                              ? "Leave blank to keep current password"
                              : "Leave blank for auto-generated secure password"
                          }
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-3.5 pr-8 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500 font-mono"
                        />
                        <Lock className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                      <span className="text-[10px] text-slate-500 mt-1 block">
                        {editOwnerId
                          ? "Leave blank if you do not wish to reset the owner's password."
                          : "If left empty, a unique cryptographically strong temporary password is automatically generated."}
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

                  {/* ── Owner Profile Details Section ── */}
                  <div className="pt-5 border-t border-slate-800 space-y-4">
                    <div>
                      <h4 className="text-xs font-bold text-teal-400 uppercase tracking-wider">
                        Owner Profile Details
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Additional information about the owner, including their profile photo, languages and hospitality background.
                      </p>
                    </div>

                    {/* 1. Owner Profile Image */}
                    <div>
                      <label className="block font-semibold text-slate-300 mb-2">
                        Owner Profile Image <span className="text-slate-500 font-normal">(Optional)</span>
                      </label>

                      <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-2xl bg-slate-950 border border-slate-800/80">
                        {/* Avatar Preview Box */}
                        <div className="relative w-20 h-20 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                          {profileImage ? (
                            <img
                              src={profileImage}
                              alt="Owner Profile Preview"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center text-slate-600">
                              <User className="w-8 h-8" />
                              <span className="text-[9px] mt-0.5 font-semibold">Avatar</span>
                            </div>
                          )}
                          {isUploadingImage && (
                            <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center">
                              <Loader2 className="w-5 h-5 animate-spin text-teal-400" />
                            </div>
                          )}
                        </div>

                        {/* Upload Controls */}
                        <div className="flex-1 space-y-2">
                          <p className="text-[11px] text-slate-300">
                            Upload a professional profile photo of the property owner.
                          </p>

                          <div className="flex flex-wrap items-center gap-2">
                            <label className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-semibold cursor-pointer transition-all shadow-xs active:scale-95">
                              <Camera className="w-3.5 h-3.5" />
                              <span>{profileImage ? "Replace Image" : "Choose Image"}</span>
                              <input
                                type="file"
                                accept=".jpg,.jpeg,.png,.webp"
                                onChange={handleImageUpload}
                                className="hidden"
                              />
                            </label>

                            {profileImage && (
                              <button
                                type="button"
                                onClick={handleRemoveImage}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 rounded-xl text-xs font-semibold transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Remove</span>
                              </button>
                            )}
                          </div>

                          <p className="text-[10px] text-slate-500">
                            JPG, PNG or WebP — Maximum 5 MB
                          </p>

                          {imageError && (
                            <p className="text-[11px] text-rose-400 font-medium">
                              {imageError}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 2. Languages Spoken by Owner */}
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">
                        Languages Spoken by Owner <span className="text-slate-500 font-normal">(Optional)</span>
                      </label>
                      <p className="text-[11px] text-slate-400 mb-2">
                        Select the languages the owner can communicate in.
                      </p>

                      <div className="flex gap-2">
                        <select
                          value={selectedLangToAdd}
                          onChange={(e) => setSelectedLangToAdd(e.target.value)}
                          className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-teal-500 text-xs"
                        >
                          <option value="">Select Language...</option>
                          {AVAILABLE_LANGUAGES.filter((lang) => !languagesSpoken.includes(lang)).map((lang) => (
                            <option key={lang} value={lang}>
                              {lang}
                            </option>
                          ))}
                        </select>

                        <button
                          type="button"
                          onClick={handleAddLanguage}
                          disabled={!selectedLangToAdd}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer shrink-0"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add</span>
                        </button>
                      </div>

                      {/* Selected Languages Chips */}
                      {languagesSpoken.length > 0 && (
                        <div className="mt-2.5">
                          <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block mb-1.5">
                            Selected Languages:
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {languagesSpoken.map((lang) => (
                              <span
                                key={lang}
                                className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-500/15 border border-teal-500/30 text-teal-300 rounded-lg text-xs font-medium"
                              >
                                <span>{lang}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveLanguage(lang)}
                                  className="p-0.5 hover:text-white rounded-md transition-colors cursor-pointer"
                                  title={`Remove ${lang}`}
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 3. About the Owner */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-semibold text-slate-300">
                          About the Owner <span className="text-slate-500 font-normal">(Optional)</span>
                        </label>
                        <span
                          className={`text-[10px] font-mono ${
                            aboutOwner.length > 2000 ? "text-rose-400 font-bold" : "text-slate-500"
                          }`}
                        >
                          {aboutOwner.length.toLocaleString()} / 2,000 characters
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mb-2">
                        A short biography describing the owner&apos;s background, hospitality experience and hosting approach.
                      </p>
                      <textarea
                        rows={4}
                        maxLength={2000}
                        placeholder="Describe the owner's hospitality experience, background, hosting style and what makes their properties special..."
                        value={aboutOwner}
                        onChange={(e) => setAboutOwner(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500 leading-relaxed text-xs"
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
                          <span>{editOwnerId ? "Saving Changes..." : "Creating Account..."}</span>
                        </>
                      ) : (
                        <>
                          {editOwnerId ? (
                            <>
                              <Check className="w-4 h-4" />
                              <span>Save Changes</span>
                            </>
                          ) : (
                            <>
                              <UserPlus className="w-4 h-4" />
                              <span>Create Owner Account</span>
                            </>
                          )}
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
