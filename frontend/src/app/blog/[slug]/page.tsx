"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AuthModal from "@/components/layout/AuthModal";
import { apiUrl } from "@/lib/apiUrl";
import { BlogPostRecord, BlogCategoryRecord } from "@backend/types/admin";
import {
  Calendar,
  Clock,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Share2,
  Check,
  Copy,
  BookOpen,
  ChevronRight,
  Tag,
  MessageCircle,
  Compass,
  Mail,
  Send,
  CheckCircle2,
} from "lucide-react";

interface SingleBlogResponse {
  success: boolean;
  blog?: BlogPostRecord;
  relatedBlogs?: BlogPostRecord[];
  message?: string;
}

/**
 * Editorial Article Content Renderer
 * Parses structured markdown/text (headings, paragraphs, bullet lists, blockquotes, images, dividers)
 * into semantic, beautifully styled editorial typography.
 */
function ArticleBodyRenderer({ content }: { content: string }) {
  const blocks = useMemo(() => {
    if (!content) return [];
    const rawBlocks = content.split(/\n\s*\n/);
    return rawBlocks.map((b) => b.trim()).filter(Boolean);
  }, [content]);

  return (
    <div className="space-y-6 text-slate-800 font-editorial-sans text-base sm:text-lg leading-[1.85]">
      {blocks.map((block, idx) => {
        // H1 Heading (# Heading)
        if (block.startsWith("# ")) {
          const text = block.replace(/^#\s+/, "");
          const anchorId = text.toLowerCase().replace(/[^a-z0-9]+/g, "-");
          return (
            <h1
              key={`h1-${idx}`}
              id={anchorId}
              className="font-editorial-serif text-3xl sm:text-4xl font-bold text-[#172B2A] tracking-tight pt-6 pb-2 border-b border-[#E8EAE5]"
            >
              {text}
            </h1>
          );
        }

        // H2 Heading (## Heading)
        if (block.startsWith("## ")) {
          const text = block.replace(/^##\s+/, "");
          const anchorId = text.toLowerCase().replace(/[^a-z0-9]+/g, "-");
          return (
            <h2
              key={`h2-${idx}`}
              id={anchorId}
              className="font-editorial-serif text-2xl sm:text-3xl font-bold text-[#172B2A] tracking-tight pt-6 pb-1 scroll-mt-28"
            >
              {text}
            </h2>
          );
        }

        // H3 Heading (### Heading)
        if (block.startsWith("### ")) {
          const text = block.replace(/^###\s+/, "");
          const anchorId = text.toLowerCase().replace(/[^a-z0-9]+/g, "-");
          return (
            <h3
              key={`h3-${idx}`}
              id={anchorId}
              className="font-editorial-serif text-xl sm:text-2xl font-bold text-[#006F66] tracking-tight pt-4 pb-1 scroll-mt-28"
            >
              {text}
            </h3>
          );
        }

        // Horizontal Divider (--- or ***)
        if (block === "---" || block === "***") {
          return <hr key={`hr-${idx}`} className="my-8 border-t border-[#E8EAE5]" />;
        }

        // Blockquote (> Quote)
        if (block.startsWith("> ")) {
          const quoteText = block.replace(/^>\s*/gm, "");
          return (
            <blockquote
              key={`quote-${idx}`}
              className="my-6 p-5 sm:p-6 rounded-2xl bg-[#E7F6F3]/50 border-l-4 border-[#009F8D] font-editorial-serif italic text-lg sm:text-xl text-[#0e3b36]"
            >
              "{quoteText}"
            </blockquote>
          );
        }

        // Bullet List (- Item or * Item)
        if (block.startsWith("- ") || block.startsWith("* ")) {
          const items = block.split("\n").filter((l) => l.trim().startsWith("- ") || l.trim().startsWith("* "));
          return (
            <ul key={`ul-${idx}`} className="my-4 space-y-2 list-disc list-inside text-slate-700">
              {items.map((it, i) => {
                const itemText = it.replace(/^[-*]\s+/, "");
                return (
                  <li
                    key={`li-${i}`}
                    className="leading-relaxed"
                    dangerouslySetInnerHTML={{
                      __html: itemText
                        .replace(/\*\*(.*?)\*\*/g, "<strong class='text-slate-900 font-semibold'>$1</strong>")
                        .replace(/\*(.*?)\*/g, "<em>$1</em>"),
                    }}
                  />
                );
              })}
            </ul>
          );
        }

        // Numbered List (1. Item)
        if (/^\d+\.\s/.test(block)) {
          const items = block.split("\n").filter((l) => /^\d+\.\s/.test(l.trim()));
          return (
            <ol key={`ol-${idx}`} className="my-4 space-y-2 list-decimal list-inside text-slate-700">
              {items.map((it, i) => {
                const itemText = it.replace(/^\d+\.\s+/, "");
                return (
                  <li
                    key={`oli-${i}`}
                    className="leading-relaxed"
                    dangerouslySetInnerHTML={{
                      __html: itemText
                        .replace(/\*\*(.*?)\*\*/g, "<strong class='text-slate-900 font-semibold'>$1</strong>")
                        .replace(/\*(.*?)\*/g, "<em>$1</em>"),
                    }}
                  />
                );
              })}
            </ol>
          );
        }

        // Standard Paragraph with bold and italic support
        return (
          <p
            key={`p-${idx}`}
            className="leading-[1.85] text-slate-700"
            dangerouslySetInnerHTML={{
              __html: block
                .replace(/\*\*(.*?)\*\*/g, "<strong class='text-slate-900 font-semibold'>$1</strong>")
                .replace(/\*(.*?)\*/g, "<em>$1</em>"),
            }}
          />
        );
      })}
    </div>
  );
}

function BlogDetailContent() {
  const params = useParams();
  const router = useRouter();
  const rawSlug = (params?.slug as string) || "";
  const slug = decodeURIComponent(rawSlug).toLowerCase().trim();

  const [blog, setBlog] = useState<BlogPostRecord | null>(null);
  const [allBlogs, setAllBlogs] = useState<BlogPostRecord[]>([]);
  const [relatedBlogs, setRelatedBlogs] = useState<BlogPostRecord[]>([]);
  const [categories, setCategories] = useState<BlogCategoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Fetch Blog by Slug, Categories, and All Published Blogs
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      if (!slug) return;
      setIsLoading(true);

      try {
        const [blogRes, catRes, allBlogsRes] = await Promise.all([
          fetch(apiUrl(`/api/public/blogs/${encodeURIComponent(slug)}`), { cache: "no-store" }),
          fetch(apiUrl("/api/public/blog-categories"), { cache: "no-store" }),
          fetch(apiUrl("/api/public/blogs"), { cache: "no-store" }),
        ]);

        if (blogRes.ok) {
          const blogData: SingleBlogResponse = await blogRes.json();
          if (isMounted && blogData.success && blogData.blog) {
            setBlog(blogData.blog);
            setRelatedBlogs(blogData.relatedBlogs || []);
          }
        } else {
          if (isMounted) setBlog(null);
        }

        if (catRes.ok) {
          const catData = await catRes.json();
          if (isMounted && catData.success && Array.isArray(catData.categories)) {
            setCategories(catData.categories);
          }
        }

        if (allBlogsRes.ok) {
          const allData = await allBlogsRes.json();
          if (isMounted && allData.success && Array.isArray(allData.blogs)) {
            setAllBlogs(allData.blogs);
          }
        }
      } catch (err) {
        console.error("Error loading blog details:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  // Compute live count per category
  const categoryCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const b of allBlogs) {
      const catSlug = (b.categorySlug || "").toLowerCase();
      map[catSlug] = (map[catSlug] || 0) + 1;
    }
    return map;
  }, [allBlogs]);

  // Compute latest 4 recent posts (excluding currently viewed article)
  const recentPosts = useMemo(() => {
    return allBlogs
      .filter((b) => b.slug.toLowerCase() !== slug.toLowerCase())
      .sort(
        (a, b) =>
          new Date(b.publishedAt || b.createdAt).getTime() -
          new Date(a.publishedAt || a.createdAt).getTime()
      )
      .slice(0, 4);
  }, [allBlogs, slug]);

  // Handle Share Actions
  const currentUrl = typeof window !== "undefined" ? window.location.href : `https://holidayexpertz.com/blog/${slug}`;

  const handleCopyLink = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(currentUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(`${blog?.title} — Read on Holiday Expertz: ${currentUrl}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

  const handleShareFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`, "_blank");
  };

  const handleShareLinkedIn = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}`, "_blank");
  };

  const handleShareTwitter = () => {
    const text = encodeURIComponent(`${blog?.title} via @HolidayExpertz`);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(currentUrl)}`, "_blank");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#FAF9F6]">
        <Header onOpenAuthModal={() => setAuthModalOpen(true)} />
        <main className="flex-1 pt-32 pb-24 flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-3 border-[#009F8D] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="font-editorial-sans text-xs text-slate-500 uppercase tracking-widest font-semibold">
              Loading Editorial Article...
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen flex flex-col bg-[#FAF9F6]">
        <Header onOpenAuthModal={() => setAuthModalOpen(true)} />
        <main className="flex-1 pt-32 pb-24 max-w-xl mx-auto px-4 text-center space-y-5">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
            <BookOpen className="w-8 h-8" />
          </div>
          <h1 className="font-editorial-serif text-3xl font-bold text-[#172B2A]">
            Article Not Found
          </h1>
          <p className="text-slate-600 text-sm font-editorial-sans">
            The article you are looking for may have been moved, renamed, or unpublished.
          </p>
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#009F8D] hover:bg-[#00897a] text-white text-xs font-bold uppercase tracking-wider transition-all font-editorial-sans shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Travel Journal</span>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const formattedDate = blog.publishedAt
    ? new Date(blog.publishedAt).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "Recently Published";

  const formattedUpdatedDate = blog.updatedAt && blog.updatedAt !== blog.createdAt
    ? new Date(blog.updatedAt).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  // JSON-LD Structured Data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: blog.title,
    description: blog.excerpt,
    image: [blog.featuredImage],
    datePublished: blog.publishedAt || blog.createdAt,
    dateModified: blog.updatedAt || blog.publishedAt || blog.createdAt,
    author: {
      "@type": "Person",
      name: blog.author,
    },
    publisher: {
      "@type": "Organization",
      name: "Holiday Expertz",
      logo: {
        "@type": "ImageObject",
        url: "https://holidayexpertz.com/logo.png",
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": currentUrl,
    },
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6] text-[#172B2A]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Header onOpenAuthModal={() => setAuthModalOpen(true)} />

      <main className="flex-1">
        {/* ========================================================================= */}
        {/* SECTION 1: FULL-WIDTH SCENIC HERO SECTION (MATCHES BLOG LISTING HERO) */}
        {/* ========================================================================= */}
        <section
          aria-label="Article Hero Header"
          className="relative min-h-[440px] sm:min-h-[500px] lg:min-h-[540px] flex items-center justify-center overflow-hidden"
        >
          {/* Scenic Travel Photography / Article Cover Background */}
          <div className="absolute inset-0">
            <Image
              src={blog.featuredImage || "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=2000&q=85"}
              alt={blog.title}
              fill
              priority
              sizes="100vw"
              className="object-cover object-center scale-102"
            />
            {/* Cinematic Multilayer Dark Vignette Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950/75 via-slate-950/55 to-slate-950/85" />
            <div className="absolute inset-0 bg-radial from-transparent via-slate-950/30 to-slate-950/80 pointer-events-none" />
          </div>

          {/* Centered Hero Content */}
          <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-28 sm:pt-32 pb-14 sm:pb-16 space-y-4 sm:space-y-5">
            {/* Breadcrumbs & Category Badge */}
            <div className="flex items-center justify-center gap-2 flex-wrap text-xs font-semibold uppercase tracking-wider font-editorial-sans">
              <Link href="/" className="text-teal-300 hover:text-white transition-colors">
                Home
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-teal-400/60" />
              <Link href="/blog" className="text-teal-300 hover:text-white transition-colors">
                Blogs
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-teal-400/60" />
              <span className="text-white font-bold">{blog.category}</span>
            </div>

            {/* Badges: Category & Informative */}
            <div className="inline-flex items-center justify-center gap-2 flex-wrap">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-teal-300 text-xs font-bold uppercase tracking-[0.2em] font-editorial-sans shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-teal-300" />
                <span>{blog.category}</span>
              </div>
              {blog.isInformative && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500 text-slate-950 text-xs font-bold uppercase tracking-widest font-editorial-sans shadow-sm">
                  <Sparkles className="w-3 h-3 fill-current text-slate-950" />
                  <span>Informative Story</span>
                </div>
              )}
            </div>

            {/* Main Editorial Heading in Serif */}
            <h1 className="font-editorial-serif text-3xl sm:text-5xl lg:text-6xl font-normal text-white tracking-tight leading-[1.15] max-w-4xl mx-auto">
              {blog.title}
            </h1>

            {/* Supporting Excerpt / Subtitle */}
            <p className="font-editorial-sans text-slate-200 text-sm sm:text-base lg:text-lg font-light max-w-2xl mx-auto leading-relaxed">
              {blog.excerpt}
            </p>

            {/* Meta Row: Author, Date, Reading Time */}
            <div className="pt-2 sm:pt-4 flex items-center justify-center gap-4 text-xs sm:text-sm text-teal-200/90 font-editorial-sans flex-wrap">
              <span className="font-semibold text-white">By {blog.author}</span>
              <span>•</span>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-teal-300" />
                <span>{formattedDate}</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-teal-300" />
                <span>{blog.readTime || "5 min read"}</span>
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
            {/* LEFT COLUMN: ARTICLE HERO IMAGE & EDITORIAL BODY (APPROX. 70%) */}
            {/* ===================================================================== */}
            <div className="lg:col-span-8 space-y-8">
              {/* Featured Showcase Cover Image */}
              <div className="relative w-full h-[320px] sm:h-[440px] lg:h-[480px] rounded-3xl overflow-hidden shadow-xl border border-[#E8EAE5] bg-slate-100">
                <Image
                  src={blog.featuredImage}
                  alt={blog.title}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 840px"
                  className="object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/30 via-transparent to-transparent pointer-events-none" />
              </div>

              {/* Editorial Article Body Card */}
              <article className="bg-white p-6 sm:p-10 lg:p-12 rounded-3xl border border-[#E8EAE5] shadow-xs">
                <ArticleBodyRenderer content={blog.content} />

                {/* Additional Gallery Images if available */}
                {blog.additionalImages && blog.additionalImages.length > 0 && (
                  <div className="mt-10 pt-8 border-t border-[#E8EAE5] space-y-6">
                    <h3 className="font-editorial-serif text-2xl font-bold text-[#172B2A]">
                      Photographic Journey
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {blog.additionalImages.map((img, i) => (
                        <div key={`add-img-${i}`} className="space-y-1.5">
                          <div className="relative h-56 rounded-2xl overflow-hidden border border-slate-200">
                            <Image
                              src={img.url}
                              alt={img.alt || blog.title}
                              fill
                              sizes="(max-width: 640px) 100vw, 350px"
                              className="object-cover"
                            />
                          </div>
                          {img.caption && (
                            <p className="text-xs text-slate-500 italic text-center font-editorial-sans">
                              {img.caption}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tags & Updated date */}
                <div className="mt-10 pt-6 border-t border-[#E8EAE5] flex flex-wrap items-center justify-between gap-4 font-editorial-sans text-xs text-slate-500">
                  {blog.tags && blog.tags.length > 0 ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <Tag className="w-3.5 h-3.5 text-[#009F8D]" />
                      {blog.tags.map((t, idx) => (
                        <span
                          key={`tag-${idx}`}
                          className="px-2.5 py-1 rounded-full bg-[#FAF9F6] border border-[#E8EAE5] text-slate-700 font-medium"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div />
                  )}

                  {formattedUpdatedDate && (
                    <span className="italic">Last updated on {formattedUpdatedDate}</span>
                  )}
                </div>

                {/* ========================================================================= */}
                {/* SHARE THIS ARTICLE */}
                {/* ========================================================================= */}
                <div className="mt-8 pt-6 border-t border-[#E8EAE5]">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h4 className="font-editorial-serif text-lg font-bold text-[#172B2A]">
                        Share this article
                      </h4>
                      <p className="font-editorial-sans text-xs text-slate-500">
                        Inspire fellow travelers with this curated story.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {/* WhatsApp */}
                      <button
                        type="button"
                        onClick={handleShareWhatsApp}
                        className="w-9 h-9 rounded-full bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366] hover:text-white flex items-center justify-center transition-all shadow-xs"
                        aria-label="Share on WhatsApp"
                        title="Share on WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </button>

                      {/* Facebook */}
                      <button
                        type="button"
                        onClick={handleShareFacebook}
                        className="w-9 h-9 rounded-full bg-[#1877F2]/10 text-[#1877F2] hover:bg-[#1877F2] hover:text-white flex items-center justify-center transition-all shadow-xs"
                        aria-label="Share on Facebook"
                        title="Share on Facebook"
                      >
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                          <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" />
                        </svg>
                      </button>

                      {/* LinkedIn */}
                      <button
                        type="button"
                        onClick={handleShareLinkedIn}
                        className="w-9 h-9 rounded-full bg-[#0A66C2]/10 text-[#0A66C2] hover:bg-[#0A66C2] hover:text-white flex items-center justify-center transition-all shadow-xs"
                        aria-label="Share on LinkedIn"
                        title="Share on LinkedIn"
                      >
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                        </svg>
                      </button>

                      {/* Twitter / X */}
                      <button
                        type="button"
                        onClick={handleShareTwitter}
                        className="w-9 h-9 rounded-full bg-slate-900/10 text-slate-800 hover:bg-slate-900 hover:text-white flex items-center justify-center transition-all shadow-xs"
                        aria-label="Share on X (Twitter)"
                        title="Share on X"
                      >
                        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                      </button>

                      {/* Copy Link */}
                      <button
                        type="button"
                        onClick={handleCopyLink}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FAF9F6] hover:bg-[#E7F6F3] text-slate-700 hover:text-[#006F66] border border-[#E8EAE5] text-xs font-semibold transition-all font-editorial-sans"
                        title="Copy article link"
                      >
                        {copiedLink ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-700">Link Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-500" />
                            <span>Copy Link</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </article>

              {/* ========================================================================= */}
              {/* SECTION: RELATED ARTICLES ("CONTINUE EXPLORING") */}
              {/* ========================================================================= */}
              {relatedBlogs.length > 0 && (
                <div className="pt-6 space-y-6">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-4 rounded-full bg-[#009F8D]" />
                    <h3 className="font-editorial-serif text-2xl font-bold text-[#172B2A] tracking-tight">
                      Continue Exploring
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {relatedBlogs.map((item) => {
                      const relDate = item.publishedAt
                        ? new Date(item.publishedAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "Recent";

                      return (
                        <article
                          key={item.id}
                          onClick={() => router.push(`/blog/${item.slug}`)}
                          className="flex flex-col bg-white rounded-3xl overflow-hidden border border-[#E8EAE5] hover:border-[#009F8D]/40 hover:shadow-xl transition-all duration-300 group cursor-pointer"
                        >
                          <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                            <Image
                              src={item.featuredImage}
                              alt={item.title}
                              fill
                              sizes="(max-width: 640px) 100vw, 400px"
                              className="object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-editorial"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                            <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-white/95 text-[#006F66] font-editorial-sans shadow-sm">
                              {item.category}
                            </span>
                          </div>

                          <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                            <h4 className="font-editorial-serif text-lg font-bold text-[#172B2A] group-hover:text-[#006F66] transition-colors leading-snug line-clamp-2">
                              {item.title}
                            </h4>

                            <div className="flex items-center justify-between text-xs text-slate-500 font-editorial-sans pt-2 border-t border-[#E8EAE5]">
                              <span>{relDate}</span>
                              <span className="text-[#006F66] font-bold inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                                <span>Read</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </span>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* ===================================================================== */}
            {/* RIGHT COLUMN: SIDEBAR (MATCHES BLOG LISTING EXACTLY) */}
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
                  <Link
                    href="/blog"
                    className="text-xs text-[#009F8D] hover:underline font-semibold font-editorial-sans"
                  >
                    All Blogs
                  </Link>
                </div>

                <div className="space-y-2 font-editorial-sans">
                  {/* All Articles Option */}
                  <Link
                    href="/blog"
                    className="w-full flex items-center justify-between px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold bg-[#FAF9F6] text-slate-700 hover:bg-[#E7F6F3] hover:text-[#006F66] border border-[#E8EAE5]/80 transition-all"
                  >
                    <span>All Articles</span>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-200/80 text-slate-600">
                      {allBlogs.length}
                    </span>
                  </Link>

                  {/* Database-Driven Dynamic Categories */}
                  {categories.map((cat) => {
                    const isCurrentCategory = (blog.categorySlug || "").toLowerCase() === cat.slug.toLowerCase();
                    const count = categoryCountMap[cat.slug.toLowerCase()] || 0;

                    return (
                      <Link
                        key={cat.id}
                        href={`/blog?category=${cat.slug}`}
                        className={`w-full flex items-center justify-between px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all ${
                          isCurrentCategory
                            ? "bg-[#006F66] text-white shadow-sm"
                            : "bg-[#FAF9F6] text-slate-700 hover:bg-[#E7F6F3] hover:text-[#006F66] border border-[#E8EAE5]/80"
                        }`}
                      >
                        <span className="truncate pr-2">{cat.name}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-bold shrink-0 ${
                            isCurrentCategory
                              ? "bg-white/20 text-white"
                              : "bg-slate-200/80 text-slate-600"
                          }`}
                        >
                          {count}
                        </span>
                      </Link>
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
                    const postDate = post.publishedAt
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
                            {postDate}
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

export default function BlogDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6]">
          <div className="w-8 h-8 border-2 border-[#009F8D] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <BlogDetailContent />
    </Suspense>
  );
}
