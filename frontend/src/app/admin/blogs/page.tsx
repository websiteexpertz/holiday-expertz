"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { adminClient } from "@/lib/adminClient";
import { BlogPostRecord } from "@backend/types/admin";
import { FileText, Plus, Edit2, Trash2, Search, ExternalLink, Loader2, Sparkles, CheckCircle2 } from "lucide-react";

export default function AdminBlogsPage() {
  const [blogs, setBlogs] = useState<BlogPostRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState<BlogPostRecord | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    category: "Heritage Travel",
    author: "HolidayExpertz Editorial",
    featuredImage: "",
    readTime: "5 min read",
    status: "published" as BlogPostRecord["status"],
    featured: false,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const loadBlogs = useCallback(async () => {
    setIsLoading(true);
    const res = await adminClient.blogs.getAll();
    if (res.success && res.data?.blogs) {
      setBlogs(res.data.blogs);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadBlogs();
  }, [loadBlogs]);

  const handleOpenCreate = () => {
    setEditingBlog(null);
    setFormData({
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      category: "Heritage Travel",
      author: "HolidayExpertz Editorial",
      featuredImage: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80",
      readTime: "5 min read",
      status: "published",
      featured: false,
    });
    setFormError("");
    setModalOpen(true);
  };

  const handleOpenEdit = (blog: BlogPostRecord) => {
    setEditingBlog(blog);
    setFormData({
      title: blog.title,
      slug: blog.slug,
      excerpt: blog.excerpt,
      content: blog.content,
      category: blog.category,
      author: blog.author,
      featuredImage: blog.featuredImage,
      readTime: blog.readTime,
      status: blog.status,
      featured: blog.featured,
    });
    setFormError("");
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      setFormError("Title and content are required");
      return;
    }

    setIsSaving(true);
    setFormError("");

    let res;
    if (editingBlog) {
      res = await adminClient.blogs.update(editingBlog.id, formData);
    } else {
      res = await adminClient.blogs.create(formData);
    }
    setIsSaving(false);

    if (res.success) {
      setModalOpen(false);
      await loadBlogs();
    } else {
      setFormError(res.message || "Failed to save blog post");
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete blog "${title}"?`)) return;
    const res = await adminClient.blogs.delete(id);
    if (res.success) {
      await loadBlogs();
    } else {
      alert(res.message || "Failed to delete blog post");
    }
  };

  const filtered = blogs.filter((b) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return b.title.toLowerCase().includes(q) || b.category.toLowerCase().includes(q) || b.author.toLowerCase().includes(q);
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-semibold mb-2">
              <FileText className="w-3.5 h-3.5" />
              <span>Editorial Articles</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Blog Management</h1>
            <p className="text-xs text-slate-400 mt-1">
              Create, edit, and publish destination guides that feed live into the website’s Travel Insights section.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-teal-500/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>New Article</span>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search articles by title, author..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
          />
        </div>

        {isLoading ? (
          <div className="py-24 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-teal-400 mb-2" />
            <p className="text-xs">Loading articles...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl">
            <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-white">No blog posts found</h3>
          </div>
        ) : (
          <div className="space-y-3.5">
            {filtered.map((blog) => (
              <div
                key={blog.id}
                className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-850/50 transition-all shadow-lg group flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-5"
              >
                {/* Left: Compact Thumbnail with Overlay Badges */}
                <div className="w-full md:w-44 h-36 md:h-28 rounded-xl sm:rounded-2xl overflow-hidden relative shrink-0 bg-slate-800 border border-slate-800">
                  <img
                    src={blog.featuredImage}
                    alt={blog.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {blog.featured && (
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 font-bold text-[10px] shadow-sm">
                      Featured
                    </span>
                  )}
                  <span
                    className={`absolute bottom-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-bold capitalize backdrop-blur-xs ${
                      blog.status === "published"
                        ? "bg-emerald-500/90 text-slate-950"
                        : "bg-slate-950/80 text-slate-300"
                    }`}
                  >
                    {blog.status}
                  </span>
                </div>

                {/* Center: Details & Metadata */}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/30 text-[10px] font-bold uppercase tracking-wider">
                      {blog.category}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize border ${
                        blog.status === "published"
                          ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                          : "bg-slate-800 text-slate-400 border-slate-700"
                      }`}
                    >
                      {blog.status}
                    </span>
                  </div>

                  <h3 className="font-bold text-white text-base sm:text-lg group-hover:text-teal-300 transition-colors line-clamp-1">
                    {blog.title}
                  </h3>

                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {blog.excerpt}
                  </p>

                  <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap pt-0.5">
                    <span className="text-slate-300 font-medium">{blog.author}</span>
                    <span>•</span>
                    <span className="text-slate-400">{blog.readTime}</span>
                    <span>•</span>
                    <span className="text-slate-500 font-mono text-[11px]">/{blog.slug}</span>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="shrink-0 flex items-center md:flex-col lg:flex-row justify-end gap-2 pt-3 md:pt-0 border-t md:border-t-0 border-slate-800/80">
                  <button
                    onClick={() => handleOpenEdit(blog)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold text-xs transition-colors"
                    title="Edit Article"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-teal-400" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDelete(blog.id, blog.title)}
                    className="p-2 text-slate-400 hover:text-red-400 rounded-xl hover:bg-slate-800 transition-colors"
                    title="Delete Article"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create / Edit Modal */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl relative custom-scrollbar">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                <h3 className="text-base font-bold text-white">
                  {editingBlog ? "Edit Blog Post" : "Compose New Blog Article"}
                </h3>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                >
                  ✕
                </button>
              </div>

              {formError && (
                <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
                  {formError}
                </div>
              )}

              <form onSubmit={handleSave} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. 10 Hidden Gem Heritage Palaces of Rajasthan"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Category</label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Author Name</label>
                    <input
                      type="text"
                      value={formData.author}
                      onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Featured Cover Image URL</label>
                  <input
                    type="url"
                    value={formData.featuredImage}
                    onChange={(e) => setFormData({ ...formData, featuredImage: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Excerpt / Summary *</label>
                  <textarea
                    rows={2}
                    required
                    value={formData.excerpt}
                    onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                    placeholder="Short engaging teaser shown on card preview..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Full Article Content *</label>
                  <textarea
                    rows={7}
                    required
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Full article content in markdown or plain text..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500 font-mono text-[11px] leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-teal-500"
                    >
                      <option value="published">Published (Live)</option>
                      <option value="draft">Draft (Hidden)</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2 pt-6">
                    <input
                      type="checkbox"
                      id="feat"
                      checked={formData.featured}
                      onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                      className="w-4 h-4 rounded text-teal-500 focus:ring-teal-500"
                    />
                    <label htmlFor="feat" className="font-semibold text-slate-300 cursor-pointer">
                      Highlight as Featured
                    </label>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-800">
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
                    <span>Save Article</span>
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
