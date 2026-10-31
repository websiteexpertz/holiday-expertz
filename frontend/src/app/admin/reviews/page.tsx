"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { adminClient } from "@/lib/adminClient";
import { ReviewRecord } from "@backend/types/admin";
import { Star, CheckCircle2, EyeOff, Trash2, Loader2, Sparkles } from "lucide-react";

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<ReviewRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadReviews = useCallback(async () => {
    setIsLoading(true);
    const res = await adminClient.reviews.getAll();
    if (res.success && res.data?.reviews) {
      setReviews(res.data.reviews);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const handleUpdate = async (id: string, updates: Partial<ReviewRecord>) => {
    const res = await adminClient.reviews.update(id, updates);
    if (res.success) {
      await loadReviews();
    } else {
      alert(res.message || "Failed to update review");
    }
  };

  const handleDelete = async (id: string, author: string) => {
    if (!confirm(`Permanently delete review by "${author}"?`)) return;
    const res = await adminClient.reviews.delete(id);
    if (res.success) {
      await loadReviews();
    } else {
      alert(res.message || "Failed to delete review");
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-semibold mb-2">
            <Star className="w-3.5 h-3.5" />
            <span>Social Proof & Testimonials</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Reviews & Testimonials</h1>
          <p className="text-xs text-slate-400 mt-1">
            Moderate traveler ratings, approve genuine testimonials, and highlight signature quotes on the homepage Memories section.
          </p>
        </div>

        {isLoading ? (
          <div className="py-24 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-amber-400 mb-2" />
            <p className="text-xs">Loading guest reviews...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl">
            <Star className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-white">No reviews found</h3>
          </div>
        ) : (
          <div className="space-y-3.5">
            {reviews.map((rev) => (
              <div
                key={rev.id}
                className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-850/50 transition-all shadow-lg group flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-5"
              >
                {/* Left: Avatar / Initials */}
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-800 overflow-hidden shrink-0 border border-slate-700 flex items-center justify-center">
                  {rev.avatar ? (
                    <img src={rev.avatar} alt={rev.author} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-base font-bold text-teal-300 bg-teal-500/10">
                      {rev.author.charAt(0)}
                    </div>
                  )}
                </div>

                {/* Center: Author, Stay, Stars & Comment */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="font-bold text-white text-base group-hover:text-teal-300 transition-colors">
                      {rev.author}
                    </h3>
                    {rev.location && (
                      <span className="text-xs text-slate-500">• {rev.location}</span>
                    )}

                    {/* Star Rating */}
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < rev.rating ? "text-amber-400 fill-amber-400" : "text-slate-700"
                          }`}
                        />
                      ))}
                    </div>

                    {/* Badges */}
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize border ${
                        rev.status === "approved"
                          ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                          : rev.status === "pending"
                          ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                          : "bg-slate-800 text-slate-400 border-slate-700"
                      }`}
                    >
                      {rev.status}
                    </span>
                    {rev.featured && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" />
                        <span>Homepage</span>
                      </span>
                    )}
                  </div>

                  {rev.propertyName && (
                    <div className="text-xs font-semibold text-teal-400">
                      Verified stay at: <span className="text-slate-200">{rev.propertyName}</span>
                    </div>
                  )}

                  <p className="text-xs text-slate-300 italic leading-relaxed line-clamp-2">
                    &ldquo;{rev.comment}&rdquo;
                  </p>
                </div>

                {/* Right: Moderation Actions */}
                <div className="shrink-0 flex items-center gap-1.5 pt-3 md:pt-0 border-t md:border-t-0 border-slate-800/80">
                  {rev.status !== "approved" && (
                    <button
                      onClick={() => handleUpdate(rev.id, { status: "approved" })}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 font-bold transition-all text-xs"
                    >
                      Approve
                    </button>
                  )}
                  {rev.status !== "hidden" && (
                    <button
                      onClick={() => handleUpdate(rev.id, { status: "hidden" })}
                      className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
                      title="Hide Review"
                    >
                      <EyeOff className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => handleUpdate(rev.id, { featured: !rev.featured })}
                    className={`p-2 rounded-xl border transition-all ${
                      rev.featured
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                        : "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-white"
                    }`}
                    title="Toggle Homepage Feature"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(rev.id, rev.author)}
                    className="p-2 text-slate-500 hover:text-red-400 rounded-xl hover:bg-slate-800 transition-colors"
                    title="Delete Review"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
