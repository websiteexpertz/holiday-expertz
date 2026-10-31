"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { adminClient } from "@/lib/adminClient";
import { Image as ImageIcon, Upload, Copy, Check, Search, Loader2 } from "lucide-react";

export default function AdminMediaPage() {
  const [media, setMedia] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const loadMedia = useCallback(async () => {
    setIsLoading(true);
    const res = await adminClient.media.getAll();
    if (res.success && res.data?.media) {
      setMedia(res.data.media);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadMedia();
  }, [loadMedia]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const res = await adminClient.media.upload(file);
    setIsUploading(false);

    if (res.success) {
      await loadMedia();
    } else {
      alert(res.message || "Failed to upload image");
    }
  };

  const copyToClipboard = (url: string, id: string) => {
    const fullUrl = url.startsWith("http") ? url : `${window.location.origin}${url}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filtered = media.filter((m) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (m.title || "").toLowerCase().includes(q) || (m.source || "").toLowerCase().includes(q);
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 text-teal-400 text-xs font-semibold mb-2">
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Asset Repository</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Media Library</h1>
            <p className="text-xs text-slate-400 mt-1">
              Centralized library indexing uploaded property galleries, blog hero banners, event covers, and promotional media.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-teal-500/20 transition-all cursor-pointer">
              {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              <span>{isUploading ? "Uploading..." : "Upload New File"}</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
            </label>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search media assets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
          />
        </div>

        {isLoading ? (
          <div className="py-24 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-teal-400 mb-2" />
            <p className="text-xs">Indexing assets...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl">
            <ImageIcon className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-white">No media assets found</h3>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="group rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden hover:border-teal-500/40 transition-all shadow-md flex flex-col justify-between"
              >
                <div className="relative h-32 bg-slate-950 overflow-hidden">
                  <img
                    src={item.url}
                    alt={item.title || "Asset"}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2">
                    <button
                      onClick={() => copyToClipboard(item.url, item.id)}
                      className="px-3 py-1.5 rounded-lg bg-teal-500 text-slate-950 font-bold text-[10px] flex items-center gap-1 shadow-lg"
                    >
                      {copiedId === item.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedId === item.id ? "Copied!" : "Copy URL"}</span>
                    </button>
                  </div>
                </div>

                <div className="p-3">
                  <p className="font-semibold text-white text-[11px] truncate" title={item.title}>
                    {item.title}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate mt-0.5" title={item.source}>
                    {item.source}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
