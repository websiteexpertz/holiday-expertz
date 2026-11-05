"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { adminClient } from "@/lib/adminClient";
import { BlogCategoryRecord } from "@backend/types/admin";
import {
  Tags,
  Plus,
  Edit2,
  Trash2,
  Search,
  Loader2,
  CheckCircle2,
  XCircle,
  FileText,
  AlertTriangle,
  ArrowLeft,
  X,
  ExternalLink,
} from "lucide-react";

export default function BlogCategoriesAdminPage() {
  const [categories, setCategories] = useState<BlogCategoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<BlogCategoryRecord | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    image: "",
    isActive: true,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // Delete / Reassignment Modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<BlogCategoryRecord | null>(null);
  const [reassignTargetSlug, setReassignTargetSlug] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const loadCategories = useCallback(async () => {
    setIsLoading(true);
    const res = await adminClient.blogCategories.getAll();
    if (res.success && res.data?.categories) {
      setCategories(res.data.categories);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setFormData({
      name: "",
      slug: "",
      description: "",
      image: "https://images.unsplash.com/photo-1506461883276-594a12b11cf3?auto=format&fit=crop&w=800&q=80",
      isActive: true,
    });
    setFormError("");
    setModalOpen(true);
  };

  const handleOpenEdit = (cat: BlogCategoryRecord) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || "",
      image: cat.image || "",
      isActive: cat.isActive,
    });
    setFormError("");
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError("Category name is required.");
      return;
    }

    setIsSaving(true);
    setFormError("");

    let res;
    if (editingCategory) {
      res = await adminClient.blogCategories.update(editingCategory.id, formData);
    } else {
      res = await adminClient.blogCategories.create(formData);
    }
    setIsSaving(false);

    if (res.success) {
      setModalOpen(false);
      await loadCategories();
    } else {
      setFormError(res.message || "Failed to save category.");
    }
  };

  const handleToggleActive = async (cat: BlogCategoryRecord) => {
    const res = await adminClient.blogCategories.update(cat.id, {
      isActive: !cat.isActive,
    });
    if (res.success) {
      await loadCategories();
    } else {
      alert(res.message || "Failed to update category status.");
    }
  };

  const handleOpenDelete = (cat: BlogCategoryRecord) => {
    setCategoryToDelete(cat);
    setDeleteError("");

    // Set first available different category as default reassignment
    const fallback = categories.find((c) => c.id !== cat.id);
    setReassignTargetSlug(fallback?.slug || "");
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;
    setIsDeleting(true);
    setDeleteError("");

    const res = await adminClient.blogCategories.delete(
      categoryToDelete.id,
      categoryToDelete.blogCount && categoryToDelete.blogCount > 0 ? reassignTargetSlug : undefined
    );

    setIsDeleting(false);

    if (res.success) {
      setDeleteModalOpen(false);
      setCategoryToDelete(null);
      await loadCategories();
    } else {
      setDeleteError(res.message || "Failed to delete category.");
    }
  };

  const filtered = categories.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q);
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Top Header Card */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link
                href="/admin/blogs"
                className="text-xs font-semibold text-teal-400 hover:text-teal-300 inline-flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Blog Articles</span>
              </Link>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 text-teal-400 text-xs font-semibold mb-2">
              <Tags className="w-3.5 h-3.5" />
              <span>Taxonomy Management</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Blog Categories</h1>
            <p className="text-xs text-slate-400 mt-1">
              Manage live topic categories that organize articles and populate public filter bars on /blog.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-teal-500/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Category</span>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search categories by name or slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
          />
        </div>

        {/* Category List */}
        {isLoading ? (
          <div className="py-24 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-teal-400 mb-2" />
            <p className="text-xs">Loading categories...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl">
            <Tags className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-white">No categories found</h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((cat) => (
              <div
                key={cat.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-3xl p-5 shadow-lg flex flex-col justify-between transition-all group"
              >
                <div className="space-y-3">
                  {/* Category Image Preview & Badges */}
                  <div className="relative h-32 w-full rounded-2xl overflow-hidden bg-slate-800 border border-slate-800">
                    {cat.image ? (
                      <img
                        src={cat.image}
                        alt={cat.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-600">
                        <Tags className="w-8 h-8" />
                      </div>
                    )}
                    <span
                      className={`absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md text-[10px] font-bold capitalize backdrop-blur-xs ${
                        cat.isActive
                          ? "bg-emerald-500/90 text-slate-950"
                          : "bg-slate-950/80 text-rose-400 border border-rose-900"
                      }`}
                    >
                      {cat.isActive ? "Active" : "Inactive"}
                    </span>
                    <span className="absolute bottom-2.5 left-2.5 px-2.5 py-0.5 rounded-md bg-slate-950/80 text-white font-mono text-[10px] border border-white/10">
                      /{cat.slug}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-teal-400 transition-colors">
                      {cat.name}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                      {cat.description || "No description provided."}
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <FileText className="w-3.5 h-3.5 text-teal-400" />
                    <span className="font-semibold text-white">{cat.blogCount || 0}</span>
                    <span>{cat.blogCount === 1 ? "article" : "articles"}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Toggle Active Status */}
                    <button
                      type="button"
                      onClick={() => handleToggleActive(cat)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                        cat.isActive
                          ? "bg-slate-800 hover:bg-slate-700 text-slate-300"
                          : "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400"
                      }`}
                      title={cat.isActive ? "Deactivate" : "Activate"}
                    >
                      {cat.isActive ? "Deactivate" : "Activate"}
                    </button>

                    {/* Edit */}
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(cat)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                      title="Edit Category"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => handleOpenDelete(cat)}
                      className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                      title="Delete Category"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal: Create or Edit Category */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
            <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Tags className="w-5 h-5 text-teal-400" />
                  <h2 className="text-lg font-bold text-white">
                    {editingCategory ? "Edit Category" : "Add New Category"}
                  </h2>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {formError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                  {formError}
                </div>
              )}

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        name,
                        slug: !editingCategory ? name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") : prev.slug,
                      }));
                    }}
                    placeholder="e.g. Luxury Stays"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    URL Slug *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
                      }))
                    }
                    placeholder="e.g. luxury-stays"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Short summary of this topic..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Cover Image URL
                  </label>
                  <input
                    type="url"
                    value={formData.image}
                    onChange={(e) => setFormData((prev) => ({ ...prev, image: e.target.value }))}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="isActiveCheck"
                    checked={formData.isActive}
                    onChange={(e) => setFormData((prev) => ({ ...prev, isActive: e.target.checked }))}
                    className="w-4 h-4 rounded text-teal-500 bg-slate-800 border-slate-700 focus:ring-teal-500"
                  />
                  <label htmlFor="isActiveCheck" className="text-xs text-slate-300 font-medium cursor-pointer">
                    Active (visible in public category filter bars)
                  </label>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center gap-2 disabled:opacity-50"
                  >
                    {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{editingCategory ? "Update Category" : "Save Category"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Delete Category Safety Warning */}
        {deleteModalOpen && categoryToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
            <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
              <div className="flex items-center gap-3 text-rose-400">
                <AlertTriangle className="w-6 h-6 shrink-0" />
                <h3 className="text-lg font-bold text-white">Delete Category</h3>
              </div>

              {deleteError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                  {deleteError}
                </div>
              )}

              <p className="text-xs text-slate-300 leading-relaxed">
                Are you sure you want to delete category{" "}
                <span className="font-bold text-white">&ldquo;{categoryToDelete.name}&rdquo;</span>?
              </p>

              {categoryToDelete.blogCount && categoryToDelete.blogCount > 0 ? (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3">
                  <p className="text-xs text-amber-300 font-medium">
                    ⚠️ This category contains <strong>{categoryToDelete.blogCount}</strong> published{" "}
                    {categoryToDelete.blogCount === 1 ? "article" : "articles"}. Select a category to reassign them to:
                  </p>
                  <select
                    value={reassignTargetSlug}
                    onChange={(e) => setReassignTargetSlug(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                  >
                    {categories
                      .filter((c) => c.id !== categoryToDelete.id)
                      .map((c) => (
                        <option key={c.id} value={c.slug}>
                          {c.name} (/{c.slug})
                        </option>
                      ))}
                  </select>
                </div>
              ) : null}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setDeleteModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 disabled:opacity-50"
                >
                  {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Confirm Delete</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

