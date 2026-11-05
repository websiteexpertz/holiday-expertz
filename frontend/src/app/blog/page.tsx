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
  const [visibleCount, setVisibleCount] = useState(9);

  // Sync state if URL query param changes
  useEffect(() => {
    const cat = searchParams.get("category") || "all";
    setSelectedCategory(cat);
  }, [searchParams]);

  // Load Categories & Initial Blogs
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

  // Handle category selection and update URL
  const handleSelectCategory = (slug: string) => {
    setSelectedCategory(slug);
    setVisibleCount(9);

    const params = new URLSearchParams(searchParams.toString());
    if (slug === "all") {
      params.delete("category");
    } else {
      params.set("category", slug);
    }
    const qs = params.toString() ? `?${params.toString()}` : "";
    router.push(`/blog${qs}`, { scroll: false });
  };

  // Filter blogs based on selected category and search
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

      <main className="flex-1 pt-[72px]">
        {/* ========================================================================= */}
        {/* HERO SECTION — PREMIUM EDITORIAL IDENTITY */}
        {/* ========================================================================= */}
        <section
          aria-label="Editorial Header"
          className="relative bg-gradient-to-b from-[#071f1d] via-[#092926] to-[#071f1d] text-white pt-14 pb-16 sm:pt-16 sm:pb-20 lg:pt-20 lg:pb-24 border-b border-[#14423c] overflow-hidden"
        >
          {/* Subtle Ambient Glow Accents */}
          <div className="absolute top-0 left-1/4 w-[500px] h-[300px] bg-radial from-[#009F8D]/15 to-transparent rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[250px] bg-radial from-teal-400/10 to-transparent rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4 sm:space-y-5">
            {/* Breadcrumb Navigation */}
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-300/80 font-editorial-sans">
              <Link href="/" className="hover:text-white transition-colors">
                Home
              </Link>
              <ChevronRight className="w-3 h-3 text-teal-400/50" />
              <span className="text-white">Travel Journal</span>
            </div>

            {/* Main Editorial Heading */}
            <h1 className="font-editorial-serif text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.15]">
              Guides to Extraordinary Getaways
            </h1>

            {/* Small Label with Sparkle */}
            <div className="inline-flex items-center justify-center gap-2 text-[#2DD4BF] text-xs font-bold uppercase tracking-[0.2em] font-editorial-sans">
              <span className="w-6 h-px bg-[#2DD4BF]/60" />
              <Sparkles className="w-3.5 h-3.5" />
              <span>Stories, Stays & Inspirations</span>
              <span className="w-6 h-px bg-[#2DD4BF]/60" />
            </div>

            {/* Description */}
            <p className="font-editorial-sans text-slate-200 text-sm sm:text-base lg:text-lg font-light max-w-2xl mx-auto leading-relaxed pt-1">
              Discover inspiring destinations, insider travel tips, exceptional places to stay, and expert recommendations to make every getaway extraordinary.
            </p>

            {/* Search Input Box */}
            <div className="max-w-md mx-auto pt-4">
              <div className="relative">
                <Search className="w-4 h-4 text-teal-300 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setVisibleCount(9);
                  }}
                  placeholder="Search articles by title, destination, topic..."
                  className="w-full pl-11 pr-10 py-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder:text-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#009F8D] focus:border-transparent transition-all font-editorial-sans"
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
        {/* CATEGORY FILTER NAVIGATION — HORIZONTAL SCROLLING ON MOBILE */}
        {/* ========================================================================= */}
        <section
          aria-label="Category Navigation"
          className="sticky top-[72px] z-30 bg-[#FAF9F6]/95 backdrop-blur-md border-b border-[#E8EAE5] shadow-xs"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 overflow-x-auto py-3.5 scrollbar-none">
              {/* All Articles Pill */}
              <button
                type="button"
                onClick={() => handleSelectCategory("all")}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-xs sm:text-sm font-bold tracking-wide transition-all font-editorial-sans ${
                  selectedCategory === "all"
                    ? "bg-[#009F8D] text-white shadow-sm shadow-[#009F8D]/30"
                    : "bg-white text-slate-700 hover:bg-[#E7F6F3] hover:text-[#006F66] border border-[#E8EAE5]"
                }`}
              >
                All Articles {blogs.length > 0 ? `(${blogs.length})` : ""}
              </button>

              {/* Dynamic Database Categories */}
              {categories.map((cat) => {
                const isActive = selectedCategory.toLowerCase() === cat.slug.toLowerCase();
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleSelectCategory(cat.slug)}
                    className={`flex-shrink-0 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold tracking-wide transition-all whitespace-nowrap font-editorial-sans ${
                      isActive
                        ? "bg-[#009F8D] text-white shadow-sm shadow-[#009F8D]/30"
                        : "bg-white text-slate-700 hover:bg-[#E7F6F3] hover:text-[#006F66] border border-[#E8EAE5]"
                    }`}
                  >
                    {cat.name}
                    {cat.blogCount !== undefined && cat.blogCount > 0 ? ` (${cat.blogCount})` : ""}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* BLOG ARTICLES GRID */}
        {/* ========================================================================= */}
        <section
          aria-label="Blog Articles"
          className="py-10 sm:py-12 lg:py-14 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        >
          {/* Active Filter Status & Result Count */}
          <div className="flex items-center justify-between mb-8 pb-3 border-b border-[#E8EAE5]/60 font-editorial-sans">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600">
              <span className="font-semibold text-[#006F66]">
                {selectedCategory === "all"
                  ? "All Publications"
                  : categories.find((c) => c.slug === selectedCategory)?.name || selectedCategory}
              </span>
              <span>•</span>
              <span>
                {filteredBlogs.length} {filteredBlogs.length === 1 ? "article" : "articles"} available
              </span>
            </div>

            {selectedCategory !== "all" && (
              <button
                type="button"
                onClick={() => handleSelectCategory("all")}
                className="text-xs font-semibold text-[#009F8D] hover:underline"
              >
                Reset Filter
              </button>
            )}
          </div>

          {/* Loading Skeletons */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div
                  key={`skeleton-${n}`}
                  className="rounded-3xl bg-white border border-[#E8EAE5] overflow-hidden shadow-xs animate-pulse"
                >
                  <div className="h-60 bg-slate-200" />
                  <div className="p-6 space-y-3">
                    <div className="h-4 w-24 bg-slate-200 rounded-full" />
                    <div className="h-6 bg-slate-200 rounded" />
                    <div className="h-4 bg-slate-200 rounded w-5/6" />
                    <div className="pt-4 flex justify-between items-center border-t border-slate-100">
                      <div className="h-4 w-20 bg-slate-200 rounded" />
                      <div className="h-4 w-24 bg-slate-200 rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredBlogs.length === 0 ? (
            /* Empty State */
            <div className="py-20 text-center bg-white rounded-3xl border border-[#E8EAE5] p-8 max-w-xl mx-auto shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-[#E7F6F3] text-[#006F66] flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8" />
              </div>
              <h3 className="font-editorial-serif text-2xl font-bold text-[#172B2A] mb-2">
                No Articles Found
              </h3>
              <p className="font-editorial-sans text-slate-600 text-sm max-w-md mx-auto mb-6">
                We couldn&apos;t find any stories matching your current category filter or search query. Try choosing another topic or viewing all articles.
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
            /* Blog Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
                    className="flex flex-col bg-white rounded-3xl overflow-hidden border border-[#E8EAE5] hover:border-[#009F8D]/40 hover:shadow-xl transition-all duration-300 group"
                  >
                    {/* Featured Image with Hover Zoom */}
                    <Link
                      href={`/blog/${blog.slug}`}
                      className="relative h-60 sm:h-64 w-full overflow-hidden block bg-slate-100"
                      aria-label={`Read article: ${blog.title}`}
                    >
                      <Image
                        src={blog.featuredImage}
                        alt={blog.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-editorial"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

                      {/* Category Pill Tag & Informative Badge */}
                      <div className="absolute top-4 left-4 flex items-center gap-2 flex-wrap">
                        <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/95 backdrop-blur-md text-[#006F66] shadow-sm font-editorial-sans">
                          {blog.category}
                        </span>
                        {blog.isInformative && (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30 flex items-center gap-1 font-editorial-sans">
                            <Sparkles className="w-3 h-3 fill-current text-slate-950" />
                            <span>Informative</span>
                          </span>
                        )}
                      </div>
                    </Link>

                    {/* Content Body */}
                    <div className="p-6 flex-1 flex flex-col justify-between">
                      <div className="space-y-3">
                        {/* Date and Read Time Row */}
                        <div className="flex items-center gap-3 text-xs text-[#697875] font-editorial-sans">
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

                        {/* Article Title */}
                        <h2 className="font-editorial-serif text-xl sm:text-2xl font-bold text-[#172B2A] group-hover:text-[#006F66] transition-colors leading-[1.25] line-clamp-2">
                          <Link href={`/blog/${blog.slug}`}>{blog.title}</Link>
                        </h2>

                        {/* Excerpt */}
                        <p className="font-editorial-sans text-slate-600 text-sm leading-relaxed line-clamp-3">
                          {blog.excerpt}
                        </p>
                      </div>

                      {/* Author & Read Article Action */}
                      <div className="pt-5 mt-5 border-t border-[#E8EAE5]/70 flex items-center justify-between gap-3 font-editorial-sans">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {blog.authorAvatar ? (
                            <div className="relative w-7 h-7 rounded-full overflow-hidden flex-shrink-0 border border-slate-200">
                              <Image
                                src={blog.authorAvatar}
                                alt={blog.author}
                                fill
                                sizes="28px"
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-[#E7F6F3] text-[#006F66] flex items-center justify-center font-bold text-xs">
                              {blog.author.charAt(0)}
                            </div>
                          )}
                          <span className="text-xs font-semibold text-slate-800 truncate">
                            {blog.author}
                          </span>
                        </div>

                        {/* Read Article Button */}
                        <Link
                          href={`/blog/${blog.slug}`}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#006F66] group-hover:text-[#009F8D] hover:underline transition-colors shrink-0"
                        >
                          <span>Read Article</span>
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {/* Load More Button */}
          {hasMore && (
            <div className="mt-12 text-center">
              <button
                type="button"
                onClick={() => setVisibleCount((prev) => prev + 6)}
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-white hover:bg-[#E7F6F3] text-[#006F66] border border-[#009F8D]/40 font-bold text-xs uppercase tracking-wider shadow-sm transition-all duration-200 hover:scale-102 font-editorial-sans"
              >
                <span>Load More Stories</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </section>
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

