"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { adminClient } from "@/lib/adminClient";
import { useAdminTheme } from "@/context/AdminThemeContext";
import { WebsiteSettingsRecord } from "@backend/types/admin";
import { Settings, Save, Loader2, CheckCircle2, ShieldCheck, ToggleLeft, ToggleRight, Sun, Moon, Monitor, Palette } from "lucide-react";

export default function AdminSettingsPage() {
  const { theme, resolvedTheme, setTheme } = useAdminTheme();
  const [settings, setSettings] = useState<WebsiteSettingsRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    const res = await adminClient.settings.get();
    if (res.success && res.data?.settings) {
      setSettings(res.data.settings);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setIsSaving(true);
    setSavedSuccess(false);
    const res = await adminClient.settings.update(settings);
    setIsSaving(false);

    if (res.success) {
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } else {
      alert(res.message || "Failed to update platform settings");
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 text-teal-400 text-xs font-semibold mb-2">
              <Settings className="w-3.5 h-3.5" />
              <span>Global Controls</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Website Settings</h1>
            <p className="text-xs text-slate-400 mt-1">
              Global platform parameters, default SEO tags, currency formatting, and operational feature flags.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {savedSuccess && (
              <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Settings Saved & Applied</span>
              </span>
            )}
          </div>
        </div>

        {isLoading || !settings ? (
          <div className="py-24 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-teal-400 mb-2" />
            <p className="text-xs">Loading platform configuration...</p>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-8 text-xs">
            {/* Super Admin Theme & Appearance Settings */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400">
                    <Palette className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">Super Admin Theme & Appearance</h2>
                    <p className="text-slate-400 text-[11px]">
                      Choose your preferred color scheme for the administration suite.
                    </p>
                  </div>
                </div>

                <span className="text-[11px] font-semibold text-teal-400 px-2.5 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 capitalize">
                  Active: {theme === "system" ? `System (${resolvedTheme})` : theme}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                {/* Light Mode Option */}
                <div
                  onClick={() => setTheme("light")}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative ${
                    theme === "light"
                      ? "border-teal-500 bg-teal-500/10 shadow-lg shadow-teal-500/10"
                      : "border-slate-800 bg-slate-950/60 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      <Sun className="w-5 h-5" />
                    </div>
                    {theme === "light" && (
                      <span className="w-2.5 h-2.5 rounded-full bg-teal-400 ring-4 ring-teal-400/20" />
                    )}
                  </div>
                  <h3 className="font-bold text-white text-sm">Light Mode</h3>
                  <p className="text-slate-400 text-[11px] mt-1 leading-relaxed">
                    Crisp, clean paper-white panels with high-contrast slate typography.
                  </p>
                </div>

                {/* Dark Mode Option */}
                <div
                  onClick={() => setTheme("dark")}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative ${
                    theme === "dark"
                      ? "border-teal-500 bg-teal-500/10 shadow-lg shadow-teal-500/10"
                      : "border-slate-800 bg-slate-950/60 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30">
                      <Moon className="w-5 h-5" />
                    </div>
                    {theme === "dark" && (
                      <span className="w-2.5 h-2.5 rounded-full bg-teal-400 ring-4 ring-teal-400/20" />
                    )}
                  </div>
                  <h3 className="font-bold text-white text-sm">Dark Mode</h3>
                  <p className="text-slate-400 text-[11px] mt-1 leading-relaxed">
                    High-end executive obsidian styling optimized for low-light environments.
                  </p>
                </div>

                {/* System Preference Option */}
                <div
                  onClick={() => setTheme("system")}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative ${
                    theme === "system"
                      ? "border-teal-500 bg-teal-500/10 shadow-lg shadow-teal-500/10"
                      : "border-slate-800 bg-slate-950/60 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                      <Monitor className="w-5 h-5" />
                    </div>
                    {theme === "system" && (
                      <span className="w-2.5 h-2.5 rounded-full bg-teal-400 ring-4 ring-teal-400/20" />
                    )}
                  </div>
                  <h3 className="font-bold text-white text-sm">System Preference</h3>
                  <p className="text-slate-400 text-[11px] mt-1 leading-relaxed">
                    Automatically synchronize with your operating system light/dark theme.
                  </p>
                </div>
              </div>
            </div>

            {/* Identity & Branding */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <h2 className="text-base font-bold text-white pb-3 border-b border-slate-800">
                Identity & Local Currency
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Platform Brand Name</label>
                  <input
                    type="text"
                    value={settings.siteName}
                    onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-teal-500 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Tagline</label>
                  <input
                    type="text"
                    value={settings.tagline}
                    onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Currency Code</label>
                  <input
                    type="text"
                    value={settings.currency}
                    onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white font-mono uppercase focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Currency Symbol</label>
                  <input
                    type="text"
                    value={settings.currencySymbol}
                    onChange={(e) => setSettings({ ...settings, currencySymbol: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-teal-500 font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Feature Flags & Operational Switches */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <h2 className="text-base font-bold text-white pb-3 border-b border-slate-800">
                Operational Switches & Automation
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-white block">Auto-Approve Property Listings</span>
                    <span className="text-[11px] text-slate-500 block mt-0.5">
                      When enabled, new owner listings publish immediately without manual verification.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, autoApproveProperties: !settings.autoApproveProperties })}
                    className={`p-2 rounded-xl text-lg transition-colors ${
                      settings.autoApproveProperties ? "text-teal-400" : "text-slate-600"
                    }`}
                  >
                    {settings.autoApproveProperties ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-white block">Guest Reviews System</span>
                    <span className="text-[11px] text-slate-500 block mt-0.5">
                      Enable verified guests to write feedback and reviews on completed stays.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, enableGuestReviews: !settings.enableGuestReviews })}
                    className={`p-2 rounded-xl text-lg transition-colors ${
                      settings.enableGuestReviews ? "text-teal-400" : "text-slate-600"
                    }`}
                  >
                    {settings.enableGuestReviews ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-white block">Allow Instant Booking</span>
                    <span className="text-[11px] text-slate-500 block mt-0.5">
                      Travelers can pay and confirm reservations instantly without prior host approval.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, allowInstantBooking: !settings.allowInstantBooking })}
                    className={`p-2 rounded-xl text-lg transition-colors ${
                      settings.allowInstantBooking ? "text-teal-400" : "text-slate-600"
                    }`}
                  >
                    {settings.allowInstantBooking ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-red-300 block">Maintenance Mode</span>
                    <span className="text-[11px] text-slate-500 block mt-0.5">
                      Temporarily display a maintenance banner to public visitors during platform upgrades.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, maintenanceMode: !settings.maintenanceMode })}
                    className={`p-2 rounded-xl text-lg transition-colors ${
                      settings.maintenanceMode ? "text-red-400" : "text-slate-600"
                    }`}
                  >
                    {settings.maintenanceMode ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                  </button>
                </div>
              </div>
            </div>

            {/* SEO Defaults */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <h2 className="text-base font-bold text-white pb-3 border-b border-slate-800">
                Default Search Engine Optimization (SEO)
              </h2>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Global Meta Title</label>
                <input
                  type="text"
                  value={settings.defaultSeoTitle}
                  onChange={(e) => setSettings({ ...settings, defaultSeoTitle: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Global Meta Description</label>
                <textarea
                  rows={2}
                  value={settings.defaultSeoDescription}
                  onChange={(e) => setSettings({ ...settings, defaultSeoDescription: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-teal-500 resize-none leading-relaxed"
                />
              </div>
            </div>

            {/* Save Button */}
            <div className="flex items-center justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-3 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold uppercase tracking-wider text-xs flex items-center gap-2 shadow-xl shadow-teal-500/25 transition-all disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Save Platform Settings</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </AdminLayout>
  );
}
