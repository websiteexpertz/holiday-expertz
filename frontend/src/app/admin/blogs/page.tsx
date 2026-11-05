"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { adminClient } from "@/lib/adminClient";
import { BlogPostRecord, BlogCategoryRecord } from "@backend/types/admin";
import { apiUrl } from "@/lib/apiUrl";
import {
  FileText,
  Plus,
  Edit2,
  Trash2,
  Search,
  ExternalLink,
  Loader2,
  Sparkles,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  Tags,
  Image as ImageIcon,
  Globe,
  Upload,
  Calendar,
  Layers,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Minus,
  Bold,
  Italic,
  X,
  ArrowRight,
} from "lucide-react";

function toLocalDatetimeInput(dateInput?: string | Date): string {
  if (!dateInput) return "";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AdminBlogsPage() {
  const [blogs, setBlogs] = useState<BlogPostRecord[]>([]);
  const [categories, setCategories] = useState<BlogCategoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Editor Modal & Tabs
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"content" | "media" | "seo" | "preview">("content");
  const [editingBlog, setEditingBlog] = useState<BlogPostRecord | null>(null);
  const [slugManualEdit, setSlugManualEdit] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    category: "Destination Guides",
    categorySlug: "destination-guides",
    author: "HolidayExpertz Editorial",
    authorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
    authorRole: "Editorial Writer",
    featuredImage: "https://images.unsplash.com/photo-1506461883276-594a12b11cf3?auto=format&fit=crop&w=1200&q=80",
    additionalImages: [] as Array<{ url: string; alt?: string; caption?: string }>,
    readTime: "5 min read",
    publishedAt: "",
    status: "published" as BlogPostRecord["status"],
    featured: false,
    isInformative: false,
    tags: [] as string[],
    seoTitle: "",
    seoDescription: "",
    focusKeyword: "",
    canonicalUrl: "",
    ogImage: "",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formError, setFormError] = useState("");

  const loadData = useCallback(async () => {
    setIsLoading(true);
    const [blogRes, catRes] = await Promise.all([
      adminClient.blogs.getAll(),
      adminClient.blogCategories.getAll(),
    ]);

    if (blogRes.success && blogRes.data?.blogs) {
      setBlogs(blogRes.data.blogs);
    }
    if (catRes.success && catRes.data?.categories) {
      setCategories(catRes.data.categories);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Metric counts
  const stats = useMemo(() => {
    const total = blogs.length;
    const published = blogs.filter((b) => b.status === "published").length;
    const drafts = blogs.filter((b) => b.status === "draft").length;
    const totalCategories = categories.length;
    return { total, published, drafts, totalCategories };
  }, [blogs, categories]);

  const handleOpenCreate = () => {
    setEditingBlog(null);
    setSlugManualEdit(false);
    const defaultCat = categories.find((c) => c.isActive) || categories[0];
    setFormData({
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      category: defaultCat ? defaultCat.name : "Destination Guides",
      categorySlug: defaultCat ? defaultCat.slug : "destination-guides",
      author: "HolidayExpertz Editorial",
      authorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
      authorRole: "Senior Travel Curator",
      featuredImage: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80",
      additionalImages: [],
      readTime: "5 min read",
      publishedAt: toLocalDatetimeInput(new Date()),
      status: "published",
      featured: false,
      isInformative: false,
      tags: ["Travel", "Hotels"],
      seoTitle: "",
      seoDescription: "",
      focusKeyword: "",
      canonicalUrl: "",
      ogImage: "",
    });
    setFormError("");
    setActiveTab("content");
    setModalOpen(true);
  };

  const handleOpenEdit = (blog: BlogPostRecord) => {
    setEditingBlog(blog);
    setSlugManualEdit(true);
    setFormData({
      title: blog.title,
      slug: blog.slug,
      excerpt: blog.excerpt,
      content: blog.content,
      category: blog.category,
      categorySlug: blog.categorySlug || "destination-guides",
      author: blog.author,
      authorAvatar: blog.authorAvatar || "",
      authorRole: blog.authorRole || "Editorial Writer",
      featuredImage: blog.featuredImage,
      additionalImages: blog.additionalImages || [],
      readTime: blog.readTime,
      publishedAt: toLocalDatetimeInput(blog.publishedAt || blog.createdAt),
      status: blog.status,
      featured: blog.featured,
      isInformative: Boolean(blog.isInformative),
      tags: blog.tags || [],
      seoTitle: blog.seoTitle || "",
      seoDescription: blog.seoDescription || "",
      focusKeyword: blog.focusKeyword || "",
      canonicalUrl: blog.canonicalUrl || "",
      ogImage: blog.ogImage || "",
    });
    setFormError("");
    setActiveTab("content");
    setModalOpen(true);
  };

  const handleTitleChange = (val: string) => {
    setFormData((prev) => ({
      ...prev,
      title: val,
      slug: !slugManualEdit ? val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") : prev.slug,
    }));
  };

  const handleCategorySelect = (categoryName: string) => {
    const matched = categories.find((c) => c.name === categoryName);
    setFormData((prev) => ({
      ...prev,
      category: categoryName,
      categorySlug: matched?.slug || categoryName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    }));
  };

  const handleInsertSnippet = (snippet: string) => {
    setFormData((prev) => ({
      ...prev,
      content: prev.content ? `${prev.content}\n\n${snippet}` : snippet,
    }));
  };

  const handleFeaturedImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const body = new FormData();
    body.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body,
      });
      const data = await res.json();
      if (data.success && data.url) {
        setFormData((prev) => ({
          ...prev,
          featuredImage: data.url,
          ogImage: prev.ogImage || data.url,
        }));
      } else {
        alert(data.message || "Failed to upload image");
      }
    } catch (err) {
      alert("Error uploading image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async (overrideStatus?: BlogPostRecord["status"]) => {
    if (!formData.title.trim() || !formData.content.trim()) {
      setFormError("Title and content are required.");
      return;
    }

    setIsSaving(true);
    setFormError("");

    const payload = {
      ...formData,
      publishedAt: formData.publishedAt
        ? new Date(formData.publishedAt).toISOString()
        : new Date().toISOString(),
      status: overrideStatus || formData.status,
    };

    let res;
    if (editingBlog) {
      res = await adminClient.blogs.update(editingBlog.id, payload);
    } else {
      res = await adminClient.blogs.create(payload);
    }
    setIsSaving(false);

    if (res.success) {
      setModalOpen(false);
      await loadData();
    } else {
      setFormError(res.message || "Failed to save blog post.");
    }
  };

  const handleTogglePublish = async (blog: BlogPostRecord) => {
    const nextStatus = blog.status === "published" ? "draft" : "published";
    const res = await adminClient.blogs.update(blog.id, { status: nextStatus });
    if (res.success) {
      await loadData();
    } else {
      alert(res.message || "Failed to update article status");
    }
  };

  const handleToggleInformative = async (blog: BlogPostRecord) => {
    const nextVal = !blog.isInformative;
    setBlogs((prev) =>
      prev.map((b) => (b.id === blog.id ? { ...b, isInformative: nextVal } : b))
    );
    const res = await adminClient.blogs.update(blog.id, { isInformative: nextVal });
    if (res.success) {
      await loadData();
    } else {
      setBlogs((prev) =>
        prev.map((b) => (b.id === blog.id ? { ...b, isInformative: blog.isInformative } : b))
      );
      alert(res.message || "Failed to update informative status");
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete blog "${title}"? This cannot be undone.`)) return;
    const res = await adminClient.blogs.delete(id);
    if (res.success) {
      await loadData();
    } else {
      alert(res.message || "Failed to delete blog post");
    }
  };

  // Filter blogs
  const filtered = blogs.filter((b) => {
    if (categoryFilter !== "all") {
      const bCat = (b.categorySlug || "").toLowerCase();
      if (bCat !== categoryFilter.toLowerCase() && b.category.toLowerCase() !== categoryFilter.toLowerCase()) {
        return false;
      }
    }

    if (statusFilter !== "all" && b.status !== statusFilter) {
      return false;
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        b.title.toLowerCase().includes(q) ||
        b.excerpt.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.category.toLowerCase().includes(q)
      );
    }

    return true;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* ========================================================================= */}
        {/* TOP HEADER */}
        {/* ========================================================================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 text-teal-400 text-xs font-semibold mb-2">
              <FileText className="w-3.5 h-3.5" />
              <span>Editorial Publishing</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Blog Management</h1>
            <p className="text-xs text-slate-400 mt-1">
              Create, edit, organize, and publish travel stories with live URL slugs and rich formatting.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Link
              href="/admin/blogs/categories"
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-all"
            >
              <Tags className="w-3.5 h-3.5 text-teal-400" />
              <span>Manage Categories</span>
            </Link>

            <Link
              href="/blog"
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-all"
            >
              <span>View Public /blog</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-teal-500/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Write Article</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* STATS OVERVIEW CARDS */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
            <div className="text-xs text-slate-400 font-medium">Total Articles</div>
            <div className="text-2xl font-bold text-white mt-1">{stats.total}</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
            <div className="text-xs text-emerald-400 font-medium">Published</div>
            <div className="text-2xl font-bold text-emerald-400 mt-1">{stats.published}</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
            <div className="text-xs text-amber-400 font-medium">Drafts</div>
            <div className="text-2xl font-bold text-amber-400 mt-1">{stats.drafts}</div>
          </div>
          <Link
            href="/admin/blogs/categories"
            className="bg-slate-900 border border-slate-800 hover:border-teal-500/50 p-4 rounded-2xl transition-colors group"
          >
            <div className="text-xs text-slate-400 group-hover:text-teal-400 font-medium flex items-center justify-between">
              <span>Categories</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </div>
            <div className="text-2xl font-bold text-white mt-1">{stats.totalCategories}</div>
          </Link>
        </div>

        {/* ========================================================================= */}
        {/* FILTERS & SEARCH ROW */}
        {/* ========================================================================= */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search articles by title, author..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-teal-500"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-teal-500"
            >
              <option value="all">All Statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* ARTICLES LIST */}
        {/* ========================================================================= */}
        {isLoading ? (
          <div className="py-24 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-teal-400 mb-2" />
            <p className="text-xs">Loading articles...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl">
            <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-white">No blog posts found</h3>
            <p className="text-xs text-slate-400 mt-1">Try clearing filters or write a new article.</p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {filtered.map((blog) => (
              <div
                key={blog.id}
                className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-850/50 transition-all shadow-lg group flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-5"
              >
                {/* Thumbnail */}
                <div className="w-full md:w-44 h-36 md:h-28 rounded-xl sm:rounded-2xl overflow-hidden relative shrink-0 bg-slate-800 border border-slate-800">
                  <img
                    src={blog.featuredImage}
                    alt={blog.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-2 left-2 flex items-center gap-1.5 flex-wrap">
                    {blog.featured && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 font-bold text-[10px] shadow-sm">
                        Featured
                      </span>
                    )}
                    {blog.isInformative && (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500 text-slate-950 font-bold text-[10px] shadow-sm flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5 fill-current" />
                        <span>Informative</span>
                      </span>
                    )}
                  </div>
                  <span
                    className={`absolute bottom-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-bold capitalize backdrop-blur-xs ${
                      blog.status === "published"
                        ? "bg-emerald-500/90 text-slate-950"
                        : "bg-slate-950/80 text-amber-300 border border-amber-900"
                    }`}
                  >
                    {blog.status}
                  </span>
                </div>

                {/* Content details */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-400">
                    <span className="px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-400 font-semibold border border-teal-500/20">
                      {blog.category}
                    </span>
                    <span>•</span>
                    <span className="font-mono text-slate-500">/blog/{blog.slug}</span>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>{blog.readTime || "5 min read"}</span>
                    </div>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-teal-400 transition-colors leading-snug line-clamp-1">
                    {blog.title}
                  </h3>

                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {blog.excerpt}
                  </p>

                  <div className="text-[11px] text-slate-500 pt-1 flex items-center gap-3">
                    <span>By <strong className="text-slate-300">{blog.author}</strong></span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      {blog.publishedAt
                        ? `Published ${new Date(blog.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}`
                        : `Created ${new Date(blog.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
                  {/* View Live Article */}
                  <Link
                    href={`/blog/${blog.slug}`}
                    target="_blank"
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                    title="View Live Article"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>

                  {/* Toggle Publish / Unpublish */}
                  <button
                    type="button"
                    onClick={() => handleTogglePublish(blog)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
                      blog.status === "published"
                        ? "bg-slate-800 hover:bg-slate-700 text-slate-300"
                        : "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400"
                    }`}
                    title={blog.status === "published" ? "Unpublish to Draft" : "Publish Live"}
                  >
                    {blog.status === "published" ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{blog.status === "published" ? "Unpublish" : "Publish"}</span>
                  </button>

                  {/* Toggle Informative Button */}
                  <button
                    type="button"
                    onClick={() => handleToggleInformative(blog)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      blog.isInformative
                        ? "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/25"
                        : "bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200"
                    }`}
                    title={
                      blog.isInformative
                        ? "Informative (Selected: visible up front on homepage) - Click to unmark"
                        : "Mark as Informative (Will be visible up front on homepage)"
                    }
                  >
                    <Sparkles
                      className={`w-3.5 h-3.5 ${
                        blog.isInformative ? "text-slate-950 fill-current" : "text-slate-400"
                      }`}
                    />
                    <span>Informative</span>
                  </button>

                  {/* Edit */}
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(blog)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                    title="Edit Blog"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => handleDelete(blog.id, blog.title)}
                    className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                    title="Delete Blog"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ========================================================================= */}
        {/* COMPREHENSIVE BLOG EDITOR MODAL */}
        {/* ========================================================================= */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
            <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
              {/* Top Modal Header */}
              <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-900">
                <div className="flex items-center gap-2.5">
                  <FileText className="w-5 h-5 text-teal-400" />
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-white">
                      {editingBlog ? "Edit Travel Article" : "Compose Travel Article"}
                    </h2>
                    <p className="text-[11px] text-slate-400">
                      {editingBlog ? `Editing /blog/${formData.slug}` : "Drafting a new editorial story"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex items-center gap-1 px-6 border-b border-slate-800 bg-slate-900/60 shrink-0 overflow-x-auto scrollbar-none">
                {[
                  { id: "content", label: "Article Content" },
                  { id: "media", label: "Media & Imagery" },
                  { id: "seo", label: "SEO & Social" },
                  { id: "preview", label: "Live Reader Preview" },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setActiveTab(t.id as any)}
                    className={`py-3 px-4 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
                      activeTab === t.id
                        ? "border-teal-400 text-teal-400"
                        : "border-transparent text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {formError && (
                <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                  {formError}
                </div>
              )}

              {/* Scrollable Form Body */}
              <div className="p-6 overflow-y-auto space-y-5 flex-1">
                {/* ========================================================================= */}
                {/* TAB 1: ARTICLE CONTENT */}
                {/* ========================================================================= */}
                {activeTab === "content" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                      {/* Title */}
                      <div className="sm:col-span-8">
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Article Title *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.title}
                          onChange={(e) => handleTitleChange(e.target.value)}
                          placeholder="e.g. 10 Best Weekend Getaways in India"
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                        />
                      </div>

                      {/* Category */}
                      <div className="sm:col-span-4">
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Category *
                        </label>
                        <select
                          value={formData.category}
                          onChange={(e) => handleCategorySelect(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-teal-500"
                        >
                          {categories.map((c) => (
                            <option key={c.id} value={c.name}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* URL Slug with edit unlock */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-slate-300">
                          URL Slug * (Permanent article URL)
                        </label>
                        <button
                          type="button"
                          onClick={() => setSlugManualEdit((prev) => !prev)}
                          className="text-[11px] text-teal-400 hover:underline"
                        >
                          {slugManualEdit ? "Auto-generate from Title" : "Edit Slug Manually"}
                        </button>
                      </div>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-xs">
                          /blog/
                        </span>
                        <input
                          type="text"
                          required
                          readOnly={!slugManualEdit}
                          value={formData.slug}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
                            }))
                          }
                          className={`w-full bg-slate-800 border border-slate-700 rounded-xl pl-16 pr-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-teal-500 ${
                            !slugManualEdit ? "opacity-75 cursor-not-allowed" : ""
                          }`}
                        />
                      </div>
                    </div>

                    {/* Excerpt */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Excerpt / Subtitle (appears in cards and lead intro)
                      </label>
                      <textarea
                        rows={2}
                        value={formData.excerpt}
                        onChange={(e) => setFormData((prev) => ({ ...prev, excerpt: e.target.value }))}
                        placeholder="Short compelling summary of the article..."
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                      />
                    </div>

                    {/* Rich Content Editor with Formatting Toolbar */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-slate-300">
                          Article Body (Markdown / Rich Editorial Formatting)
                        </label>
                        <span className="text-[11px] text-slate-400">
                          Supports headings, quotes, lists, and images
                        </span>
                      </div>

                      {/* Formatting Toolbar */}
                      <div className="flex items-center gap-1 p-2 bg-slate-850 rounded-t-xl border border-b-0 border-slate-700 overflow-x-auto scrollbar-none">
                        <button
                          type="button"
                          onClick={() => handleInsertSnippet("## Major Heading Title\nYour text here...")}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1"
                          title="Insert H2 Heading"
                        >
                          <Heading2 className="w-3.5 h-3.5" />
                          <span>H2</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInsertSnippet("### Subheading Section\nYour text here...")}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1"
                          title="Insert H3 Heading"
                        >
                          <Heading3 className="w-3.5 h-3.5" />
                          <span>H3</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInsertSnippet("> An extraordinary quote that encapsulates the journey.")}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1"
                          title="Insert Blockquote"
                        >
                          <Quote className="w-3.5 h-3.5" />
                          <span>Quote</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInsertSnippet("- First highlight point\n- Second highlight point\n- Third highlight point")}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1"
                          title="Insert Bullet List"
                        >
                          <List className="w-3.5 h-3.5" />
                          <span>List</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInsertSnippet("1. Step one details\n2. Step two details\n3. Step three details")}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1"
                          title="Insert Numbered List"
                        >
                          <ListOrdered className="w-3.5 h-3.5" />
                          <span>1.2.3</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInsertSnippet("---")}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1"
                          title="Insert Section Divider"
                        >
                          <Minus className="w-3.5 h-3.5" />
                          <span>Divider</span>
                        </button>
                      </div>

                      <textarea
                        rows={14}
                        required
                        value={formData.content}
                        onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
                        placeholder="Write your article here using paragraphs and headings..."
                        className="w-full bg-slate-800 border border-slate-700 rounded-b-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 font-mono leading-relaxed"
                      />
                    </div>

                    {/* Publishing Schedule & Author Meta */}
                    <div className="p-4 rounded-2xl bg-slate-850 border border-slate-800 space-y-3.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-teal-400" />
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                            Publication Schedule & Author Attribution
                          </h4>
                        </div>
                        <span className="text-[11px] text-slate-400">
                          Custom date & time picker (supports backdating)
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                        {/* Custom Date & Time Picker */}
                        <div className="sm:col-span-1">
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-xs font-semibold text-slate-300">
                              Publish Date & Time *
                            </label>
                            <button
                              type="button"
                              onClick={() =>
                                setFormData((prev) => ({
                                  ...prev,
                                  publishedAt: toLocalDatetimeInput(new Date()),
                                }))
                              }
                              className="text-[10px] text-teal-400 hover:text-teal-300 hover:underline flex items-center gap-1 font-semibold"
                              title="Set to current date and time"
                            >
                              <Clock className="w-3 h-3" />
                              <span>Set to Now</span>
                            </button>
                          </div>
                          <input
                            type="datetime-local"
                            value={formData.publishedAt}
                            onChange={(e) =>
                              setFormData((prev) => ({ ...prev, publishedAt: e.target.value }))
                            }
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500 font-sans"
                          />
                          <p className="text-[10px] text-slate-400 mt-1">
                            Choose any past or present date & time.
                          </p>
                        </div>

                        {/* Author Name */}
                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1">
                            Author Name
                          </label>
                          <input
                            type="text"
                            value={formData.author}
                            onChange={(e) => setFormData((prev) => ({ ...prev, author: e.target.value }))}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                          />
                        </div>

                        {/* Author Role */}
                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1">
                            Author Role
                          </label>
                          <input
                            type="text"
                            value={formData.authorRole}
                            onChange={(e) => setFormData((prev) => ({ ...prev, authorRole: e.target.value }))}
                            placeholder="e.g. Senior Travel Curator"
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                          />
                        </div>

                        {/* Estimated Read Time */}
                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1">
                            Estimated Read Time
                          </label>
                          <input
                            type="text"
                            value={formData.readTime}
                            onChange={(e) => setFormData((prev) => ({ ...prev, readTime: e.target.value }))}
                            placeholder="e.g. 6 min read"
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ========================================================================= */}
                {/* TAB 2: MEDIA & IMAGERY */}
                {/* ========================================================================= */}
                {activeTab === "media" && (
                  <div className="space-y-6">
                    {/* Featured Image */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-300">
                          Featured Cover Image * (Used in cards and hero header)
                        </label>
                        {isUploading && (
                          <span className="text-xs text-teal-400 flex items-center gap-1.5">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Uploading image...</span>
                          </span>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row gap-4 items-start">
                        <div className="relative w-full sm:w-64 h-40 rounded-2xl overflow-hidden bg-slate-800 border border-slate-700 shrink-0">
                          {formData.featuredImage ? (
                            <img
                              src={formData.featuredImage}
                              alt="Featured preview"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-600">
                              <ImageIcon className="w-8 h-8" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 space-y-3 w-full">
                          <input
                            type="url"
                            value={formData.featuredImage}
                            onChange={(e) => setFormData((prev) => ({ ...prev, featuredImage: e.target.value }))}
                            placeholder="Enter image URL or upload below..."
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                          />

                          <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold cursor-pointer transition-all">
                            <Upload className="w-3.5 h-3.5 text-teal-400" />
                            <span>Upload from Computer</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleFeaturedImageUpload}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Author Avatar */}
                    <div className="pt-4 border-t border-slate-800 space-y-2">
                      <label className="text-xs font-semibold text-slate-300 block">
                        Author Avatar URL
                      </label>
                      <input
                        type="url"
                        value={formData.authorAvatar}
                        onChange={(e) => setFormData((prev) => ({ ...prev, authorAvatar: e.target.value }))}
                        placeholder="https://images.unsplash.com/..."
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                      />
                    </div>
                  </div>
                )}

                {/* ========================================================================= */}
                {/* TAB 3: SEO & SOCIAL */}
                {/* ========================================================================= */}
                {activeTab === "seo" && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Meta Title (Search Engine Title)
                      </label>
                      <input
                        type="text"
                        value={formData.seoTitle}
                        onChange={(e) => setFormData((prev) => ({ ...prev, seoTitle: e.target.value }))}
                        placeholder={formData.title || "Holiday Expertz Travel Guides"}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Meta Description
                      </label>
                      <textarea
                        rows={3}
                        value={formData.seoDescription}
                        onChange={(e) => setFormData((prev) => ({ ...prev, seoDescription: e.target.value }))}
                        placeholder={formData.excerpt || "Discover inspiring destinations and luxury stays..."}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Focus Keyword
                        </label>
                        <input
                          type="text"
                          value={formData.focusKeyword}
                          onChange={(e) => setFormData((prev) => ({ ...prev, focusKeyword: e.target.value }))}
                          placeholder="e.g. luxury resorts, Rajasthan havelis"
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Canonical URL (Optional)
                        </label>
                        <input
                          type="url"
                          value={formData.canonicalUrl}
                          onChange={(e) => setFormData((prev) => ({ ...prev, canonicalUrl: e.target.value }))}
                          placeholder={`https://holidayexpertz.com/blog/${formData.slug || "article"}`}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* ========================================================================= */}
                {/* TAB 4: LIVE READER PREVIEW */}
                {/* ========================================================================= */}
                {activeTab === "preview" && (
                  <div className="bg-[#FAF9F6] text-[#172B2A] rounded-2xl p-6 sm:p-8 space-y-6">
                    <div className="space-y-3">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#E7F6F3] text-[#006F66]">
                        {formData.category}
                      </span>
                      <h1 className="font-editorial-serif text-3xl sm:text-4xl font-bold text-[#172B2A] leading-tight">
                        {formData.title || "Untitled Article"}
                      </h1>
                      <p className="text-slate-600 italic text-base">
                        {formData.excerpt || "No excerpt specified."}
                      </p>
                      <div className="text-xs text-slate-500 pt-2 border-t border-slate-200 flex items-center gap-3">
                        <span>By {formData.author}</span>
                        <span>•</span>
                        <span>{formData.readTime}</span>
                        <span>•</span>
                        <span>
                          {formData.publishedAt
                            ? new Date(formData.publishedAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })
                            : "Draft Date"}
                        </span>
                      </div>
                    </div>

                    {formData.featuredImage && (
                      <div className="relative h-64 rounded-2xl overflow-hidden border border-slate-200">
                        <img
                          src={formData.featuredImage}
                          alt={formData.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    <div className="prose prose-slate max-w-none text-sm sm:text-base leading-relaxed whitespace-pre-line font-editorial-sans">
                      {formData.content || "No content written yet."}
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Actions Bar */}
              <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between shrink-0 bg-slate-900">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="featuredCheckbox"
                      checked={formData.featured}
                      onChange={(e) => setFormData((prev) => ({ ...prev, featured: e.target.checked }))}
                      className="w-4 h-4 rounded text-teal-500 bg-slate-800 border-slate-700"
                    />
                    <label htmlFor="featuredCheckbox" className="text-xs text-slate-300 font-medium cursor-pointer">
                      Feature in Carousels
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="informativeCheckbox"
                      checked={formData.isInformative}
                      onChange={(e) => setFormData((prev) => ({ ...prev, isInformative: e.target.checked }))}
                      className="w-4 h-4 rounded text-emerald-500 bg-slate-800 border-slate-700"
                    />
                    <label htmlFor="informativeCheckbox" className="text-xs text-emerald-400 font-semibold cursor-pointer flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Informative (Up front on Homepage)</span>
                    </label>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => handleSave("draft")}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-xs font-bold"
                  >
                    Save as Draft
                  </button>

                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => handleSave("published")}
                    className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-teal-500/20 disabled:opacity-50"
                  >
                    {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{editingBlog ? "Update & Publish" : "Publish Article"}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
