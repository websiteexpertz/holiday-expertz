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
          const quoteText = block.replace(/^>\s+/, "").replace(/\n>\s+/g, " ");
          return (
            <blockquote
              key={`quote-${idx}`}
              className="my-6 pl-6 py-2 border-l-4 border-[#009F8D] bg-[#E7F6F3]/30 rounded-r-2xl italic font-editorial-serif text-xl sm:text-2xl text-[#172B2A] leading-snug"
            >
              &ldquo;{quoteText}&rdquo;
            </blockquote>
          );
        }

        // Bullet List (- item or * item)
        if (block.startsWith("- ") || block.startsWith("* ")) {
          const items = block.split(/\n/).map((line) => line.replace(/^[-*]\s+/, ""));
          return (
            <ul key={`ul-${idx}`} className="space-y-2.5 my-4 list-disc pl-6 marker:text-[#009F8D]">
              {items.map((it, iIdx) => (
                <li key={`li-${iIdx}`} className="leading-relaxed">
                  <span
                    dangerouslySetInnerHTML={{
                      __html: it
                        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                        .replace(/\*(.*?)\*/g, "<em>$1</em>"),
                    }}
                  />
                </li>
              ))}
            </ul>
          );
        }

        // Numbered List (1. item)
        if (/^\d+\.\s+/.test(block)) {
          const items = block.split(/\n/).map((line) => line.replace(/^\d+\.\s+/, ""));
          return (
            <ol key={`ol-${idx}`} className="space-y-2.5 my-4 list-decimal pl-6 marker:text-[#009F8D] marker:font-bold">
              {items.map((it, iIdx) => (
                <li key={`oli-${iIdx}`} className="leading-relaxed">
                  <span
                    dangerouslySetInnerHTML={{
                      __html: it
                        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                        .replace(/\*(.*?)\*/g, "<em>$1</em>"),
                    }}
                  />
                </li>
              ))}
            </ol>
          );
        }

        // Standard Paragraph with inline bold and italics
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
  const [relatedBlogs, setRelatedBlogs] = useState<BlogPostRecord[]>([]);
  const [categories, setCategories] = useState<BlogCategoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [email, setEmail] = useState("");
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);

  // Fetch Blog by Slug and Categories
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      if (!slug) return;
      setIsLoading(true);

      try {
        const [blogRes, catRes] = await Promise.all([
          fetch(apiUrl(`/api/public/blogs/${encodeURIComponent(slug)}`), { cache: "no-store" }),
          fetch(apiUrl("/api/public/blog-categories"), { cache: "no-store" }),
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

  // Extract Table of Contents from headings
  const tableOfContents = useMemo(() => {
    if (!blog?.content) return [];
    const lines = blog.content.split("\n");
    const headings: { text: string; id: string; level: number }[] = [];

    for (const line of lines) {
      if (line.startsWith("## ")) {
        const text = line.replace(/^##\s+/, "").trim();
        headings.push({
          text,
          id: text.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          level: 2,
        });
      } else if (line.startsWith("### ")) {
        const text = line.replace(/^###\s+/, "").trim();
        headings.push({
          text,
          id: text.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          level: 3,
        });
      }
    }

    return headings;
  }, [blog?.content]);

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

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setNewsletterSubscribed(true);
      setEmail("");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#FAF9F6]">
        <Header onOpenAuthModal={() => setAuthModalOpen(true)} />
        <main className="flex-1 pt-32 pb-24 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-10 h-10 border-3 border-[#009F8D] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="font-editorial-sans text-sm text-slate-500 font-medium">
              Opening travel journal...
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // 404 Not Found State
  if (!blog) {
    return (
      <div className="min-h-screen flex flex-col bg-[#FAF9F6]">
        <Header onOpenAuthModal={() => setAuthModalOpen(true)} />
        <main className="flex-1 pt-32 pb-24 max-w-xl mx-auto px-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#E7F6F3] text-[#006F66] flex items-center justify-center mx-auto mb-5">
            <BookOpen className="w-8 h-8" />
          </div>
          <h1 className="font-editorial-serif text-3xl sm:text-4xl font-bold text-[#172B2A] mb-3">
            Article Not Found
          </h1>
          <p className="font-editorial-sans text-slate-600 text-sm sm:text-base leading-relaxed mb-6">
            We couldn&apos;t find the story you were looking for. It may have been moved, updated, or unpublished.
          </p>
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#009F8D] hover:bg-[#00897a] text-white font-bold text-xs uppercase tracking-wider transition-all font-editorial-sans shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to All Stories</span>
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

  const formattedUpdatedDate = blog.updatedAt
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

      <main className="flex-1 pt-[72px]">
        {/* ========================================================================= */}
        {/* SECTION 1: ARTICLE HEADER & BREADCRUMBS */}
        {/* ========================================================================= */}
        <header className="bg-white border-b border-[#E8EAE5] pt-8 pb-10 sm:pt-10 sm:pb-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
            {/* Breadcrumb Navigation */}
            <nav
              aria-label="Breadcrumbs"
              className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 font-editorial-sans overflow-x-auto scrollbar-none"
            >
              <Link href="/" className="hover:text-[#006F66] transition-colors">
                Home
              </Link>
              <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
              <Link href="/blog" className="hover:text-[#006F66] transition-colors">
                Travel Journal
              </Link>
              <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
              <Link
                href={`/blog?category=${blog.categorySlug || "all"}`}
                className="text-[#009F8D] hover:underline transition-colors shrink-0 font-bold"
              >
                {blog.category}
              </Link>
            </nav>

            {/* Category Pill Badge & Informative Badge */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#E7F6F3] text-[#006F66] text-xs font-bold uppercase tracking-widest font-editorial-sans">
                <Sparkles className="w-3 h-3" />
                <span>{blog.category}</span>
              </div>
              {blog.isInformative && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500 text-slate-950 text-xs font-bold uppercase tracking-widest font-editorial-sans shadow-sm">
                  <Sparkles className="w-3 h-3 fill-current" />
                  <span>Informative Story</span>
                </div>
              )}
            </div>

            {/* Full Editorial Title */}
            <h1 className="font-editorial-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#172B2A] tracking-tight leading-[1.15]">
              {blog.title}
            </h1>

            {/* Short Introduction / Subtitle */}
            <p className="font-editorial-sans text-slate-600 text-base sm:text-lg lg:text-xl font-light leading-relaxed">
              {blog.excerpt}
            </p>

            {/* Author, Dates, Read Time Stack */}
            <div className="pt-4 border-t border-[#E8EAE5] flex flex-wrap items-center justify-between gap-4 font-editorial-sans text-xs sm:text-sm">
              <div className="flex items-center gap-3">
                {blog.authorAvatar ? (
                  <div className="relative w-10 h-10 rounded-full overflow-hidden border border-slate-200 shrink-0">
                    <Image
                      src={blog.authorAvatar}
                      alt={blog.author}
                      fill
                      sizes="40px"
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#E7F6F3] text-[#006F66] flex items-center justify-center font-bold text-sm shrink-0">
                    {blog.author.charAt(0)}
                  </div>
                )}
                <div>
                  <div className="font-bold text-slate-900">{blog.author}</div>
                  <div className="text-xs text-slate-500">{blog.authorRole || "Editorial Writer"}</div>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs sm:text-sm text-slate-500">
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
            </div>
          </div>
        </header>

        {/* ========================================================================= */}
        {/* SECTION 2: FEATURED HERO IMAGE */}
        {/* ========================================================================= */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 sm:mt-8">
          <div className="relative h-[340px] sm:h-[460px] lg:h-[540px] w-full rounded-3xl overflow-hidden shadow-xl border border-slate-200">
            <Image
              src={blog.featuredImage}
              alt={blog.title}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 1100px"
              className="object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent" />
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 3: ARTICLE CONTENT WITH DESKTOP SIDEBAR */}
        {/* ========================================================================= */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
            {/* Left Column: Full Editorial Body */}
            <article className="lg:col-span-8 bg-white p-6 sm:p-10 rounded-3xl border border-[#E8EAE5] shadow-xs">
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

                  <div className="flex items-center gap-2">
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
                        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                      </svg>
                    </button>

                    {/* Copy Link */}
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold font-editorial-sans transition-all shadow-xs ${
                        copiedLink
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-800"
                      }`}
                      aria-label="Copy article link"
                    >
                      {copiedLink ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Link</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </article>

            {/* Right Column: Sticky Editorial Sidebar (Desktop) */}
            <aside className="lg:col-span-4 space-y-6">
              {/* 1. Dynamic Table of Contents */}
              {tableOfContents.length > 0 && (
                <div className="bg-white p-6 rounded-3xl border border-[#E8EAE5] shadow-xs space-y-3.5 sticky top-28">
                  <div className="flex items-center gap-2 pb-2 border-b border-[#E8EAE5]">
                    <BookOpen className="w-4 h-4 text-[#009F8D]" />
                    <h3 className="font-editorial-serif text-lg font-bold text-[#172B2A]">
                      Table of Contents
                    </h3>
                  </div>
                  <nav className="space-y-2 font-editorial-sans text-xs sm:text-sm">
                    {tableOfContents.map((h, i) => (
                      <a
                        key={`toc-${i}`}
                        href={`#${h.id}`}
                        className={`block hover:text-[#006F66] transition-colors leading-snug ${
                          h.level === 3 ? "pl-3 text-slate-500" : "text-slate-800 font-medium"
                        }`}
                      >
                        {h.text}
                      </a>
                    ))}
                  </nav>
                </div>
              )}

              {/* 2. Related Categories Navigator */}
              <div className="bg-white p-6 rounded-3xl border border-[#E8EAE5] shadow-xs space-y-3.5">
                <div className="flex items-center gap-2 pb-2 border-b border-[#E8EAE5]">
                  <Compass className="w-4 h-4 text-[#009F8D]" />
                  <h3 className="font-editorial-serif text-lg font-bold text-[#172B2A]">
                    Explore Topics
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <Link
                      key={cat.id}
                      href={`/blog?category=${cat.slug}`}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all font-editorial-sans ${
                        cat.slug === blog.categorySlug
                          ? "bg-[#009F8D] text-white border-[#009F8D]"
                          : "bg-[#FAF9F6] text-slate-700 hover:bg-[#E7F6F3] hover:text-[#006F66] border-[#E8EAE5]"
                      }`}
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              </div>

              {/* 3. Editorial Newsletter Box */}
              <div className="bg-gradient-to-br from-[#071f1d] to-[#0d3631] text-white p-6 rounded-3xl border border-[#174842] shadow-md space-y-3">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/10 text-teal-300 text-xs font-semibold font-editorial-sans">
                  <Mail className="w-3.5 h-3.5" />
                  <span>Curated Travel Dispatch</span>
                </div>
                <h4 className="font-editorial-serif text-xl font-bold">
                  Handpicked stories in your inbox
                </h4>
                <p className="text-xs text-slate-300 font-editorial-sans leading-relaxed">
                  Join travelers who receive private hotel reviews and regional travel guides weekly.
                </p>

                {newsletterSubscribed ? (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-teal-900/60 border border-teal-500/40 text-teal-300 text-xs font-editorial-sans animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Thank you for subscribing!</span>
                  </div>
                ) : (
                  <form onSubmit={handleNewsletterSubmit} className="space-y-2 pt-1 font-editorial-sans">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email address"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#092723] border border-[#1b4e47] text-white text-xs placeholder-slate-400 focus:outline-none focus:border-[#009F8D]"
                    />
                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-[#009F8D] hover:bg-[#00897a] text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-sm"
                    >
                      <span>Subscribe</span>
                      <Send className="w-3 h-3" />
                    </button>
                  </form>
                )}
              </div>
            </aside>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 4: RELATED ARTICLES ("CONTINUE EXPLORING") */}
        {/* ========================================================================= */}
        {relatedBlogs.length > 0 && (
          <section
            aria-label="Continue Exploring"
            className="py-12 sm:py-16 bg-white border-t border-[#E8EAE5]"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {/* Header */}
              <div className="max-w-3xl mb-8 space-y-2">
                <div className="inline-flex items-center gap-2 text-[#006F66] text-xs font-bold uppercase tracking-[0.18em] font-editorial-sans">
                  <span className="w-6 h-px bg-[#009F8D]" />
                  <span>Related Articles</span>
                </div>
                <h2 className="font-editorial-serif text-3xl sm:text-4xl font-bold text-[#172B2A] tracking-tight">
                  Continue Exploring
                </h2>
                <p className="font-editorial-sans text-slate-600 text-sm sm:text-base leading-relaxed">
                  Discover more stories and travel inspiration.
                </p>
              </div>

              {/* Related Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
                      className="flex flex-col bg-[#FAF9F6] rounded-3xl overflow-hidden border border-[#E8EAE5] hover:border-[#009F8D]/40 hover:shadow-xl transition-all duration-300 group"
                    >
                      <Link
                        href={`/blog/${item.slug}`}
                        className="relative h-52 w-full overflow-hidden block bg-slate-100"
                        aria-label={`Read article: ${item.title}`}
                      >
                        <Image
                          src={item.featuredImage}
                          alt={item.title}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          className="object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-editorial"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                        <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-white/95 text-[#006F66] font-editorial-sans shadow-sm">
                          {item.category}
                        </span>
                      </Link>

                      <div className="p-5 flex-1 flex flex-col justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs text-slate-500 font-editorial-sans">
                            <span>{relDate}</span>
                            <span>•</span>
                            <span>{item.readTime || "5 min read"}</span>
                          </div>
                          <h3 className="font-editorial-serif text-lg font-bold text-[#172B2A] group-hover:text-[#006F66] transition-colors leading-snug line-clamp-2">
                            <Link href={`/blog/${item.slug}`}>{item.title}</Link>
                          </h3>
                          <p className="font-editorial-sans text-xs text-slate-600 line-clamp-2 leading-relaxed">
                            {item.excerpt}
                          </p>
                        </div>

                        <div className="pt-4 mt-4 border-t border-[#E8EAE5] flex items-center justify-between font-editorial-sans">
                          <span className="text-xs text-slate-700 font-medium">
                            {item.author}
                          </span>
                          <Link
                            href={`/blog/${item.slug}`}
                            className="inline-flex items-center gap-1 text-xs font-bold text-[#006F66] group-hover:text-[#009F8D]"
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
            </div>
          </section>
        )}
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
