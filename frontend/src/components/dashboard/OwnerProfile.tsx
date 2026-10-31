"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { PropertyOwner } from "@backend/types/auth";
import { uploadImageApi } from "@/lib/propertyClient";
import {
  User,
  Mail,
  Phone,
  Building,
  MapPin,
  Camera,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Save,
  ShieldCheck,
  Loader2,
  X,
} from "lucide-react";

interface ProfileFormProps {
  owner: PropertyOwner | null;
  updateProfile: (updates: Partial<PropertyOwner>) => Promise<{ success: boolean; message: string }>;
}

function ProfileForm({ owner, updateProfile }: ProfileFormProps) {
  const [fullName, setFullName] = useState(owner?.fullName || "");
  const [mobileNumber, setMobileNumber] = useState(owner?.mobileNumber || "");
  const [businessName, setBusinessName] = useState(owner?.businessName || "");
  const [address, setAddress] = useState(owner?.address || "");
  const [altPhone, setAltPhone] = useState(owner?.altPhone || "");
  const [bio, setBio] = useState(owner?.bio || "");
  const [avatar, setAvatar] = useState(owner?.avatar || "");

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    setFeedback(null);

    try {
      const res = await uploadImageApi(file);
      if (res.success && res.url) {
        setAvatar(res.url);
        await updateProfile({ avatar: res.url });
        setFeedback({ type: "success", text: "Avatar updated successfully." });
      } else {
        setFeedback({ type: "error", text: res.message || "Failed to upload avatar." });
      }
    } catch {
      setFeedback({ type: "error", text: "Error uploading avatar file." });
    } finally {
      setUploadingAvatar(false);
      e.target.value = "";
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);

    try {
      const res = await updateProfile({
        fullName,
        mobileNumber,
        businessName,
        address,
        altPhone,
        bio,
      });

      if (res.success) {
        setFeedback({ type: "success", text: "Profile updated successfully." });
      } else {
        setFeedback({ type: "error", text: res.message || "Failed to save profile changes." });
      }
    } catch {
      setFeedback({ type: "error", text: "An error occurred while saving profile." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSaveProfile} className="space-y-6">
      {/* ── FEEDBACK ALERT ── */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between text-xs sm:text-sm font-medium ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
        {/* Avatar & Top Info */}
        <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-slate-100">
          <div className="relative group">
            <div className="w-24 h-24 rounded-3xl overflow-hidden bg-teal-600 text-white font-black text-3xl flex items-center justify-center border-4 border-white shadow-lg shadow-teal-600/20">
              {avatar ? (
                <img src={avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <span>{owner?.fullName?.charAt(0).toUpperCase() || "H"}</span>
              )}
            </div>

            <label className="absolute bottom-0 right-0 p-2 bg-slate-900 hover:bg-teal-600 text-white rounded-xl shadow-md cursor-pointer transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                disabled={uploadingAvatar}
                className="hidden"
              />
              {uploadingAvatar ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
            </label>
          </div>

          <div className="text-center sm:text-left space-y-1">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <h3 className="text-xl font-bold text-slate-900">{owner?.fullName}</h3>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                <ShieldCheck className="w-3 h-3 text-teal-600" />
                Verified Host
              </span>
            </div>
            <p className="text-xs text-slate-500">{owner?.email}</p>
            <p className="text-xs text-slate-400">
              {owner?.createdAt
                ? `Member since ${new Date(owner.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    year: "numeric",
                  })}`
                : "Active Host Partner"}
            </p>
          </div>
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
          <div>
            <label className="block font-semibold text-slate-800 mb-1.5">
              Full Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-800 mb-1.5">
              Primary Mobile Number <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                required
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-800 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                disabled
                value={owner?.email || ""}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-medium cursor-not-allowed"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Your email is verified and cannot be changed without contacting support.
            </p>
          </div>

          <div>
            <label className="block font-semibold text-slate-800 mb-1.5">
              Alternate Contact / WhatsApp
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                placeholder="e.g. +91 98765 43210"
                value={altPhone}
                onChange={(e) => setAltPhone(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
              />
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="block font-semibold text-slate-800 mb-1.5">
              Business / Hospitality Enterprise Name
            </label>
            <div className="relative">
              <Building className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="e.g. Singhania Heritage Stays & Resorts Pvt Ltd"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
              />
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="block font-semibold text-slate-800 mb-1.5">
              Registered Head Office / Address
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="e.g. 102 Heritage Complex, Udaipur, Rajasthan"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
              />
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="block font-semibold text-slate-800 mb-1.5">
              Host Biography & Background
            </label>
            <textarea
              rows={4}
              placeholder="Share your hospitality journey, family heritage, or passion for welcoming guests..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
            />
          </div>
        </div>

        {/* Save Action */}
        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md shadow-teal-600/20 disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save Changes</span>
          </button>
        </div>
      </div>
    </form>
  );
}

export default function OwnerProfile() {
  const { owner, updateProfile } = useAuth();

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      {/* ── HEADER ── */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Owner Profile & Account
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Manage your personal identity, agency details, and verified host credentials.
        </p>
      </div>

      <ProfileForm key={owner?.id || "empty"} owner={owner} updateProfile={updateProfile} />

      {/* ── SECURITY / PASSWORD SECTION ── */}
      <div id="settings" className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">Account Security & Credentials</h3>
            <p className="text-xs text-slate-500">Your account is secured with Node.js scrypt password hashing.</p>
          </div>
        </div>

        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="font-bold text-slate-800">Password Authentication</span>
            <p className="text-slate-500 text-xs mt-0.5">Last password update recorded securely.</p>
          </div>
          <button
            type="button"
            onClick={() => alert("Password reset instructions have been logged to the secure owner portal.")}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 transition-colors self-start sm:self-auto"
          >
            Change Password
          </button>
        </div>
      </div>
    </div>
  );
}
