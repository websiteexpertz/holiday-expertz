"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { adminClient } from "@/lib/adminClient";
import { Property } from "@backend/types/property";
import { Sparkles, Plus, Trash2, ArrowUpDown, Building2, MapPin, Loader2, CheckCircle2 } from "lucide-react";

export default function AdminHandpickedPage() {
  const [items, setItems] = useState<any[]>([]);
  const [availableProps, setAvailableProps] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPropId, setSelectedPropId] = useState("");
  const [badgeText, setBadgeText] = useState("Handpicked");
  const [priorityOrder, setPriorityOrder] = useState(1);
  const [featuredQuote, setFeaturedQuote] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const loadHandpicked = useCallback(async () => {
    setIsLoading(true);
    const res = await adminClient.handpicked.getAll();
    if (res.success && res.data) {
      setItems(res.data.handpicked || []);
      setAvailableProps(res.data.availableProperties || []);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadHandpicked();
  }, [loadHandpicked]);

  const handleOpenAdd = () => {
    const unpicked = availableProps.filter((p) => !items.some((i) => i.propertyId === p.id));
    if (unpicked.length > 0) {
      setSelectedPropId(unpicked[0].id);
    }
    setBadgeText("Royal Heritage");
    setPriorityOrder(items.length + 1);
    setFeaturedQuote("");
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPropId) return;

    setIsSaving(true);
    const res = await adminClient.handpicked.add(selectedPropId, badgeText, priorityOrder, featuredQuote);
    setIsSaving(false);

    if (res.success) {
      setModalOpen(false);
      await loadHandpicked();
    } else {
      alert(res.message || "Failed to add handpicked property");
    }
  };

  const handleRemove = async (id: string, name: string) => {
    if (!confirm(`Remove "${name}" from Handpicked collection?`)) return;
    const res = await adminClient.handpicked.remove(id);
    if (res.success) {
      await loadHandpicked();
    } else {
      alert(res.message || "Failed to remove item");
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 text-teal-400 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Curated Editorial Collection</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Handpicked Properties</h1>
            <p className="text-xs text-slate-400 mt-1">
              Properties featured prominently in the "Handpicked Stays" carousel on the homepage with custom badges and editorial quotes.
            </p>
          </div>

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-teal-500/20 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Property to Handpicked</span>
          </button>
        </div>

        {isLoading ? (
          <div className="py-24 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-teal-400 mb-2" />
            <p className="text-xs">Loading curated collection...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl">
            <Sparkles className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-white">No properties handpicked yet</h3>
            <p className="text-xs text-slate-500 mt-1">Click "Add Property to Handpicked" to curate your first stay.</p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {items.map((item, idx) => (
              <div
                key={item.id}
                className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-850/50 transition-all shadow-lg group flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-5"
              >
                {/* Left: Compact Thumbnail with Rank Badge */}
                <div className="w-full md:w-44 h-36 md:h-28 rounded-xl sm:rounded-2xl overflow-hidden relative shrink-0 bg-slate-800 border border-slate-800">
                  <img
                    src={item.coverImage}
                    alt={item.propertyName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-2 left-2 flex items-center gap-1.5">
                    <span className="w-6 h-6 rounded-full bg-slate-950/90 backdrop-blur-md text-teal-300 font-bold text-[11px] flex items-center justify-center border border-teal-500/40">
                      #{idx + 1}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-teal-500 text-slate-950 font-bold text-[10px] uppercase tracking-wider shadow-sm">
                      {item.badge || "Handpicked"}
                    </span>
                  </div>
                </div>

                {/* Center: Details & Metadata */}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/30 text-[10px] font-bold uppercase tracking-wider">
                      {item.badge || "Signature Collection"}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px] font-medium border border-slate-700">
                      Priority Rank: #{item.priorityOrder || idx + 1}
                    </span>
                  </div>

                  <h3 className="font-bold text-white text-base sm:text-lg group-hover:text-teal-300 transition-colors line-clamp-1">
                    {item.propertyName}
                  </h3>

                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <MapPin className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                    <span>{item.city}, {item.state}</span>
                  </div>

                  {item.featuredQuote && (
                    <p className="text-xs italic text-slate-300 line-clamp-2 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80 leading-relaxed">
                      &ldquo;{item.featuredQuote}&rdquo;
                    </p>
                  )}
                </div>

                {/* Right: Pricing & Removal Action */}
                <div className="shrink-0 flex items-center md:flex-col lg:flex-row justify-between md:justify-center items-end gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-slate-800/80">
                  <div className="text-left md:text-right">
                    <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Price</div>
                    <div className="font-extrabold text-white text-sm sm:text-base">
                      ₹{item.pricePerNight?.toLocaleString()} <span className="text-xs font-normal text-slate-400">/ night</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRemove(item.id, item.propertyName)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-red-500/10 text-slate-300 hover:text-red-400 border border-transparent hover:border-red-500/30 font-semibold text-xs transition-colors"
                    title="Remove from Handpicked"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                <h3 className="text-base font-bold text-white">Curate Handpicked Property</h3>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Select Property *</label>
                  <select
                    value={selectedPropId}
                    onChange={(e) => setSelectedPropId(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-teal-500"
                  >
                    {availableProps.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.location.city})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Badge Tag</label>
                    <input
                      type="text"
                      value={badgeText}
                      onChange={(e) => setBadgeText(e.target.value)}
                      placeholder="e.g. Royal Heritage, Top Pick"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Priority Order</label>
                    <input
                      type="number"
                      min={1}
                      value={priorityOrder}
                      onChange={(e) => setPriorityOrder(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Editorial Highlight Quote</label>
                  <textarea
                    rows={3}
                    value={featuredQuote}
                    onChange={(e) => setFeaturedQuote(e.target.value)}
                    placeholder="e.g. Regal 18th-century Rajput palace overlooking private lotus lakes..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-teal-500 resize-none"
                  />
                </div>

                <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-md"
                  >
                    {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Add to Collection</span>
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
