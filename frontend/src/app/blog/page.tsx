"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AuthModal from "@/components/layout/AuthModal";
import { apiUrl } from "@/lib/apiUrl";
import { BlogPostRecord, BlogCategoryRecord } from "@backend/types/admin";
import {
  Sparkles,
  Clock,
  Calendar,
  ArrowRight,
  Search,
  X,
  Compass,
  ChevronRight,
  BookOpen,
  Filter,
  Layers,
} from "lucide-react";

function BlogListingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") || "all";

  const [categories, setCategories] = useState<BlogCategoryRecord[]>([]);
  const [blogs, setBlogs] = useState<BlogPostRecord[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(6);

  // Sync category state with URL query parameter
  useEffect(() => {
    const cat = searchParams.get("category") || "all";
    setSelectedCategory(cat);
  }, [searchParams]);

  // Load Categories & Published Blogs
  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      setIsLoading(true);
      try {
        const [catRes, blogRes] = await Promise.all([
          fetch(apiUrl("/api/public/blog-categories"), { cache: "no-store" }),
          fetch(apiUrl("/api/public/blogs"), { cache: "no-store" }),
        ]);

        if (catRes.ok) {
          const catData = await catRes.json();
          if (isMounted && catData.success && Array.isArray(catData.categories)) {
            setCategories(catData.categories);
          }
        }

        if (blogRes.ok) {
          const blogData = await blogRes.json();
          if (isMounted && blogData.success && Array.isArray(blogData.blogs)) {
            setBlogs(blogData.blogs);
          }
        }
      } catch (err) {
        console.error("Error loading blog listing data:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Handle Category Click
  const handleSelectCategory = (slug: string) => {
    setSelectedCategory(slug);
    setVisibleCount(6);

    const params = new URLSearchParams(searchParams.toString());
    if (slug === "all") {
      params.delete("category");
    } else {
      params.set("category", slug);
    }
    const qs = params.toString() ? `?${params.toString()}` : "";
    router.push(`/blog${qs}`, { scroll: false });
  };

  // Compute live count per category
  const categoryCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const b of blogs) {
      const slug = (b.categorySlug || "").toLowerCase();
      map[slug] = (map[slug] || 0) + 1;
    }
    return map;
  }, [blogs]);

  // Compute latest 4 recent posts (sorted newest first by publishedAt)
  const recentPosts = useMemo(() => {
    return [...blogs]
      .sort(
        (a, b) =>
          new Date(b.publishedAt || b.createdAt).getTime() -
          new Date(a.publishedAt || a.createdAt).getTime()
      )
      .slice(0, 4);
  }, [blogs]);

  // Filter blogs based on selected category and search input
  const filteredBlogs = useMemo(() => {
    return blogs.filter((blog) => {
      // Category filter
      if (selectedCategory !== "all") {
        const blogCatSlug = (blog.categorySlug || "").toLowerCase();
        if (blogCatSlug !== selectedCategory.toLowerCase()) {
          return false;
        }
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = blog.title.toLowerCase().includes(q);
        const matchesExcerpt = blog.excerpt.toLowerCase().includes(q);
        const matchesAuthor = blog.author.toLowerCase().includes(q);
        const matchesCategory = blog.category.toLowerCase().includes(q);
        if (!matchesTitle && !matchesExcerpt && !matchesAuthor && !matchesCategory) {
          return false;
        }
      }

      return true;
    });
  }, [blogs, selectedCategory, searchQuery]);

  const displayedBlogs = filteredBlogs.slice(0, visibleCount);
  const hasMore = visibleCount < filteredBlogs.length;

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6] text-[#172B2A]">
      <Header onOpenAuthModal={() => setAuthModalOpen(true)} />

      <main className="flex-1">
        {/* ========================================================================= */}
        {/* SECTION 1: FULL-WIDTH SCENIC HERO SECTION (LAYOUT 2) */}
        {/* ========================================================================= */}
        <section
          aria-label="Editorial Header"
          className="relative min-h-[420px] sm:min-h-[480px] lg:min-h-[520px] flex items-center justify-center overflow-hidden"
        >
          {/* Scenic Travel Photography Background */}
          <div className="absolute inset-0">
            <Image
              src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=2000&q=85"
              alt="Scenic Alpine Mountain and Lake"
              fill
              priority
              sizes="100vw"
              className="object-cover object-center scale-102"
            />
            {/* Cinematic Multilayer Dark Vignette Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950/70 via-slate-950/50 to-slate-950/80" />
            <div className="absolute inset-0 bg-radial from-transparent via-slate-950/30 to-slate-950/75 pointer-events-none" />
          </div>

          {/* Centered Hero Content */}
          <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-28 sm:pt-32 pb-14 sm:pb-16 space-y-4 sm:space-y-5">
            {/* Small Badge */}
            <div className="inline-flex items-center justify-center gap-2 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-teal-300 text-xs font-bold uppercase tracking-[0.22em] font-editorial-sans shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
              <span>BLOGS</span>
            </div>

            {/* Main Heading in Elegant Serif */}
            <h1 className="font-editorial-serif text-3xl sm:text-5xl lg:text-6xl font-normal text-white tracking-tight leading-[1.12]">
              Guides to Extraordinary Getaways
            </h1>

            {/* Supporting Description */}
            <p className="font-editorial-sans text-slate-200 text-sm sm:text-base lg:text-lg font-light max-w-2xl mx-auto leading-relaxed">
              Discover inspiring destinations, insider travel tips, exceptional places to stay, and expert recommendations to make every getaway extraordinary.
            </p>

            {/* Search Input Box */}
            <div className="max-w-md mx-auto pt-2 sm:pt-4">
              <div className="relative">
                <Search className="w-4 h-4 text-teal-300 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setVisibleCount(6);
                  }}
                  placeholder="Search articles by title, destination, topic..."
                  className="w-full pl-11 pr-10 py-3 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-white placeholder:text-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all font-editorial-sans"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-white p-1"
                    aria-label="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 2: MAIN BLOG CONTENT — TWO-COLUMN LAYOUT (70% / 30%) */}
        {/* ========================================================================= */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
            {/* ===================================================================== */}
            {/* LEFT COLUMN: FEATURED BLOG ARTICLES (APPROX. 70%) */}
            {/* ===================================================================== */}
            <div className="lg:col-span-8 space-y-6 sm:space-y-8">
              {/* Active Filter Header Bar */}
              <div className="flex items-center justify-between pb-4 border-b border-[#E8EAE5] font-editorial-sans">
                <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600">
                  <span className="font-semibold text-[#006F66]">
                    {selectedCategory === "all"
                      ? "All Articles"
                      : categories.find((c) => c.slug.toLowerCase() === selectedCategory.toLowerCase())?.name ||
                        selectedCategory}
                  </span>
                  <span>•</span>
                  <span>
                    {filteredBlogs.length} {filteredBlogs.length === 1 ? "story" : "stories"} found
                  </span>
                </div>

                {selectedCategory !== "all" && (
                  <button
                    type="button"
                    onClick={() => handleSelectCategory("all")}
                    className="text-xs font-semibold text-[#009F8D] hover:underline cursor-pointer"
                  >
                    View All Articles
                  </button>
                )}
              </div>

              {/* Loading Skeletons */}
              {isLoading ? (
                <div className="space-y-6">
                  {[1, 2, 3].map((n) => (
                    <div
                      key={`skeleton-${n}`}
                      className="rounded-3xl bg-white border border-[#E8EAE5] overflow-hidden shadow-xs animate-pulse flex flex-col md:flex-row h-auto md:h-64"
                    >
                      <div className="w-full md:w-[320px] h-56 md:h-full bg-slate-200" />
                      <div className="p-6 flex-1 space-y-3">
                        <div className="h-4 w-24 bg-slate-200 rounded-full" />
                        <div className="h-6 bg-slate-200 rounded w-4/5" />
                        <div className="h-4 bg-slate-200 rounded w-full" />
                        <div className="h-4 bg-slate-200 rounded w-2/3" />
                        <div className="pt-4 flex justify-between items-center border-t border-slate-100">
                          <div className="h-4 w-28 bg-slate-200 rounded" />
                          <div className="h-4 w-20 bg-slate-200 rounded" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredBlogs.length === 0 ? (
                /* Empty State */
                <div className="py-16 px-6 text-center bg-white border border-[#E8EAE5] rounded-3xl space-y-4">
                  <div className="w-14 h-14 rounded-full bg-[#E7F6F3] text-[#006F66] flex items-center justify-center mx-auto">
                    <BookOpen className="w-7 h-7" />
                  </div>
                  <h3 className="font-editorial-serif text-2xl font-bold text-[#172B2A]">
                    No articles found
                  </h3>
                  <p className="font-editorial-sans text-sm text-slate-600 max-w-md mx-auto">
                    We could not find any stories matching your current selection. Try choosing another category or clearing your search.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory("all");
                      setSearchQuery("");
                      router.push("/blog", { scroll: false });
                    }}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#009F8D] hover:bg-[#00897a] text-white text-xs font-bold uppercase tracking-wider transition-all font-editorial-sans shadow-sm"
                  >
                    <span>View All Articles</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                /* Horizontal Article Cards List */
                <div className="space-y-6 sm:space-y-8">
                  {displayedBlogs.map((blog) => {
                    const formattedDate = blog.publishedAt
                      ? new Date(blog.publishedAt).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "Recently Published";

                    return (
                      <article
                        key={blog.id}
                        onClick={() => router.push(`/blog/${blog.slug}`)}
                        className="flex flex-col md:flex-row bg-white rounded-3xl overflow-hidden border border-[#E8EAE5] hover:border-[#009F8D]/40 hover:shadow-xl transition-all duration-300 group cursor-pointer"
                        aria-label={`Read article: ${blog.title}`}
                      >
                        {/* Large Landscape Image Section */}
                        <div className="relative w-full md:w-[320px] lg:w-[340px] h-60 md:h-auto min-h-[220px] md:min-h-[260px] overflow-hidden shrink-0 bg-slate-100">
                          <Image
                            src={blog.featuredImage}
                            alt={blog.title}
                            fill
                            sizes="(max-width: 768px) 100vw, 340px"
                            className="object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-editorial"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent opacity-30 group-hover:opacity-10 transition-opacity" />
                        </div>

                        {/* Content Section */}
                        <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between">
                          <div className="space-y-2.5">
                            {/* Badges: Category & Informative */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#E7F6F3] text-[#006F66] font-editorial-sans">
                                {blog.category}
                              </span>
                              {blog.isInformative && (
                                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500 text-slate-950 shadow-xs flex items-center gap-1 font-editorial-sans">
                                  <Sparkles className="w-3 h-3 fill-current text-slate-950" />
                                  <span>Informative</span>
                                </span>
                              )}
                            </div>

                            {/* Blog Title in Serif Typography */}
                            <h2 className="font-editorial-serif text-xl sm:text-2xl lg:text-[26px] font-bold text-[#172B2A] group-hover:text-[#009F8D] transition-colors leading-snug">
                              {blog.title}
                            </h2>

                            {/* Short Description / Excerpt */}
                            <p className="font-editorial-sans text-slate-600 line-clamp-2 sm:line-clamp-3 text-xs sm:text-sm leading-relaxed">
                              {blog.excerpt}
                            </p>
                          </div>

                          {/* Footer Meta: Published Date, Read Time & CTA */}
                          <div className="pt-4 mt-4 border-t border-[#E8EAE5] flex items-center justify-between gap-3 font-editorial-sans text-xs">
                            <div className="flex items-center gap-3 text-slate-500 flex-wrap">
                              <div className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-[#009F8D]" />
                                <span>{formattedDate}</span>
                              </div>
                              <span>•</span>
                              <div className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-[#009F8D]" />
                                <span>{blog.readTime || "5 min read"}</span>
                              </div>
                            </div>

                            {/* Read Article Link */}
                            <span className="inline-flex items-center gap-1.5 font-bold text-[#006F66] group-hover:text-[#009F8D] transition-colors shrink-0">
                              <span>Read Article</span>
                              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                            </span>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}

              {/* Load More Button */}
              {hasMore && (
                <div className="pt-6 text-center">
                  <button
                    type="button"
                    onClick={() => setVisibleCount((prev) => prev + 4)}
                    className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-white hover:bg-[#E7F6F3] text-[#006F66] border border-[#009F8D]/40 font-bold text-xs uppercase tracking-wider shadow-sm transition-all duration-200 hover:scale-102 font-editorial-sans cursor-pointer"
                  >
                    <span>Load More Stories</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* ===================================================================== */}
            {/* RIGHT COLUMN: SIDEBAR (APPROX. 30%) */}
            {/* ===================================================================== */}
            <aside className="lg:col-span-4 space-y-8 sticky top-24">
              {/* Sidebar Card 1: Explore by Category */}
              <div className="bg-white rounded-3xl border border-[#E8EAE5] p-6 sm:p-7 shadow-xs">
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#E8EAE5]">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-4 rounded-full bg-[#009F8D]" />
                    <h3 className="font-editorial-serif text-lg font-bold text-[#172B2A] tracking-tight">
                      Explore by Category
                    </h3>
                  </div>
                  {selectedCategory !== "all" && (
                    <button
                      type="button"
                      onClick={() => handleSelectCategory("all")}
                      className="text-xs text-[#009F8D] hover:underline font-semibold font-editorial-sans"
                    >
                      Reset
                    </button>
                  )}
                </div>

                <div className="space-y-2 font-editorial-sans">
                  {/* All Articles Option */}
                  <button
                    type="button"
                    onClick={() => handleSelectCategory("all")}
                    className={`w-full flex items-center justify-between px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all ${
                      selectedCategory === "all"
                        ? "bg-[#006F66] text-white shadow-sm"
                        : "bg-[#FAF9F6] text-slate-700 hover:bg-[#E7F6F3] hover:text-[#006F66] border border-[#E8EAE5]/80"
                    }`}
                  >
                    <span>All Articles</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        selectedCategory === "all"
                          ? "bg-white/20 text-white"
                          : "bg-slate-200/80 text-slate-600"
                      }`}
                    >
                      {blogs.length}
                    </span>
                  </button>

                  {/* Database-Driven Dynamic Categories */}
                  {categories.map((cat) => {
                    const isActive = selectedCategory.toLowerCase() === cat.slug.toLowerCase();
                    const count = categoryCountMap[cat.slug.toLowerCase()] || 0;

                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleSelectCategory(cat.slug)}
                        className={`w-full flex items-center justify-between px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all ${
                          isActive
                            ? "bg-[#006F66] text-white shadow-sm"
                            : "bg-[#FAF9F6] text-slate-700 hover:bg-[#E7F6F3] hover:text-[#006F66] border border-[#E8EAE5]/80"
                        }`}
                      >
                        <span className="truncate pr-2">{cat.name}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-bold shrink-0 ${
                            isActive
                              ? "bg-white/20 text-white"
                              : "bg-slate-200/80 text-slate-600"
                          }`}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sidebar Card 2: Recent Posts */}
              <div className="bg-white rounded-3xl border border-[#E8EAE5] p-6 sm:p-7 shadow-xs">
                <div className="flex items-center gap-2 pb-4 mb-4 border-b border-[#E8EAE5]">
                  <span className="w-1.5 h-4 rounded-full bg-[#009F8D]" />
                  <h3 className="font-editorial-serif text-lg font-bold text-[#172B2A] tracking-tight">
                    Recent Posts
                  </h3>
                </div>

                <div className="divide-y divide-[#E8EAE5]/80">
                  {recentPosts.map((post) => {
                    const formattedDate = post.publishedAt
                      ? new Date(post.publishedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "Recently Published";

                    return (
                      <article
                        key={`recent-${post.id}`}
                        onClick={() => router.push(`/blog/${post.slug}`)}
                        className="py-3.5 first:pt-0 last:pb-0 flex items-center gap-3.5 group cursor-pointer"
                      >
                        {/* Small Thumbnail */}
                        <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-slate-100 border border-slate-200">
                          <Image
                            src={post.featuredImage}
                            alt={post.title}
                            fill
                            sizes="64px"
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>

                        {/* Title & Metadata */}
                        <div className="min-w-0 flex-1 space-y-1">
                          <span className="text-[10px] uppercase font-bold text-[#009F8D] tracking-wider block font-editorial-sans truncate">
                            {post.category}
                          </span>
                          <h4 className="font-editorial-serif text-xs sm:text-sm font-bold text-[#172B2A] line-clamp-2 group-hover:text-[#009F8D] transition-colors leading-snug">
                            {post.title}
                          </h4>
                          <span className="text-[11px] text-slate-400 block font-editorial-sans">
                            {formattedDate}
                          </span>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <Footer />
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </div>
  );
}

export default function BlogListingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6]">
          <div className="w-8 h-8 border-2 border-[#009F8D] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <BlogListingContent />
    </Suspense>
  );
}
