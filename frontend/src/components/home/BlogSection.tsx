"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Calendar, Clock, ArrowRight, ChevronLeft, ChevronRight, BookOpen, Sparkles } from "lucide-react";
import { mockBlogs } from "@/data/blogs";
import { useAutoScrollCarousel } from "@/hooks/useAutoScrollCarousel";
import { apiUrl } from "@/lib/apiUrl";
import { BlogPost } from "@/types/hotel";

export default function BlogSection() {
  const router = useRouter();
  const [blogs, setBlogs] = useState<BlogPost[]>(() => {
    // Sort mockBlogs so informative blogs appear up front
    return [...mockBlogs].sort((a, b) => {
      const aInf = Boolean(a.isInformative);
      const bInf = Boolean(b.isInformative);
      if (aInf !== bInf) return aInf ? -1 : 1;
      return 0;
    });
  });

  useEffect(() => {
    let isMounted = true;
    async function fetchBlogs() {
      try {
        const res = await fetch(apiUrl("/api/public/blogs"), { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (isMounted && data.success && Array.isArray(data.blogs) && data.blogs.length > 0) {
          const mapped: BlogPost[] = data.blogs.map((b: any) => ({
            id: b.id,
            title: b.title,
            slug: b.slug,
            excerpt: b.excerpt,
            coverImage:
              b.featuredImage ||
              b.coverImage ||
              "https://images.unsplash.com/photo-1506461883276-594a12b11cf3?auto=format&fit=crop&w=800&q=80",
            author: {
              name: b.author || "Editorial Team",
              avatar:
                b.authorAvatar ||
                "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
              role: b.authorRole || "Curator",
            },
            publishedDate: b.publishedAt
              ? new Date(b.publishedAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "Recently Published",
            readTime: b.readTime || "5 min read",
            category: b.category || "Travel Guides",
            isInformative: Boolean(b.isInformative),
          }));

          // Ensure informative blogs are visible up front
          mapped.sort((a, b) => {
            const aInf = Boolean(a.isInformative);
            const bInf = Boolean(b.isInformative);
            if (aInf !== bInf) return aInf ? -1 : 1;
            return 0;
          });

          setBlogs(mapped);
        }
      } catch (err) {
        // Fallback remains mockBlogs
      }
    }
    fetchBlogs();
    return () => {
      isMounted = false;
    };
  }, []);

  const {
    sectionRef,
    scrollRef,
    activeIndex,
    canAutoScroll,
    handlePrev,
    handleNext,
    handleGoTo,
    handleScroll,
    handleKeyDown,
    handleTouchStart,
    handleTouchEnd,
    handleTouchCancel,
  } = useAutoScrollCarousel({
    itemsCount: blogs.length,
    speed: 0.58,
    pauseOnHover: true,
    isModalOpen: false,
  });

  const itemsToRender = canAutoScroll
    ? [...blogs, ...blogs, ...blogs]
    : blogs;

  const handleCardClick = (slug: string) => {
    router.push(`/blog/${slug}`);
  };

  return (
    <section
      ref={sectionRef}
      id="blog"
      aria-label="Guides to Extraordinary Getaways"
      className="pt-6 sm:pt-7 lg:pt-8 pb-8 sm:pb-10 lg:pb-12 bg-[#FAF9F6] border-b border-[#E8EAE5]/60 scroll-mt-20 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-6 sm:mb-7">
          <div className="space-y-2.5 sm:space-y-3 max-w-3xl text-left">
            <h2 className="font-editorial-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#172B2A] tracking-tight leading-[1.12]">
              Guides to Extraordinary Getaways
            </h2>
            <div className="inline-flex items-center gap-2 text-[#006F66] text-xs font-bold uppercase tracking-[0.18em] font-editorial-sans">
              <span className="w-6 h-px bg-[#009F8D]" />
              <span>Travel Journal</span>
            </div>
            <p className="font-editorial-sans text-slate-600 sm:text-slate-700 text-sm sm:text-base leading-relaxed pt-0.5">
              Discover inspiring destinations, insider travel tips, exceptional places to stay, and expert recommendations to make every getaway extraordinary.
            </p>
          </div>

          {/* Controls: Weekly Pill, View All & Navigation Arrows */}
          <div className="flex items-center justify-between sm:justify-end gap-2.5 sm:gap-3 flex-wrap font-editorial-sans">
            <Link
              href="/blog"
              className="text-xs text-[#006F66] hover:text-[#009F8D] font-bold bg-[#E7F6F3] hover:bg-[#d8f1ec] px-3.5 py-2 rounded-xl border border-[#009F8D]/30 shadow-xs transition-colors inline-flex items-center gap-1.5"
            >
              <span>View All Articles</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            {canAutoScroll && (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={handlePrev}
                  className="w-10 h-10 rounded-full border border-[#E8EAE5] bg-white hover:bg-[#E7F6F3] flex items-center justify-center text-[#172B2A] hover:text-[#006F66] shadow-sm transition-all duration-200 active:scale-95"
                  aria-label="Previous articles"
                  title="Previous articles"
                >
                  <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="w-10 h-10 rounded-full border border-[#E8EAE5] bg-white hover:bg-[#E7F6F3] flex items-center justify-center text-[#172B2A] hover:text-[#006F66] shadow-sm transition-all duration-200 active:scale-95"
                  aria-label="Next articles"
                  title="Next articles"
                >
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Carousel Viewport with Mobile Peek */}
        <div
          className="group relative"
          onKeyDown={handleKeyDown}
          tabIndex={0}
          role="region"
          aria-roledescription="carousel"
          aria-label="Travel stories and guides auto-scrolling carousel"
        >
          {/* Floating Left Navigation Arrow */}
          {canAutoScroll && (
            <button
              type="button"
              onClick={handlePrev}
              className="hidden sm:flex absolute -left-4 sm:-left-5 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-white/95 text-slate-900 shadow-xl border border-slate-200/90 items-center justify-center transition-all duration-300 hover:bg-slate-900 hover:text-white hover:scale-110 active:scale-95 opacity-0 group-hover:opacity-100"
              aria-label="Previous articles"
              title="Slide left"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {/* Floating Right Navigation Arrow */}
          {canAutoScroll && (
            <button
              type="button"
              onClick={handleNext}
              className="hidden sm:flex absolute -right-4 sm:-right-5 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-white/95 text-slate-900 shadow-xl border border-slate-200/90 items-center justify-center transition-all duration-300 hover:bg-slate-900 hover:text-white hover:scale-110 active:scale-95 opacity-0 group-hover:opacity-100"
              aria-label="Next articles"
              title="Slide right"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}

          {/* Continuous Smooth Scroll Viewport */}
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchCancel}
            className="flex gap-4 sm:gap-6 overflow-x-auto scrollbar-none py-2 -mx-4 px-4 sm:mx-0 sm:px-0.5 touch-pan-y select-none"
            style={{
              scrollBehavior: "auto",
              WebkitOverflowScrolling: "touch",
            }}
          >
            {itemsToRender.map((post, index) => {
              const copyIndex = Math.floor(index / Math.max(blogs.length, 1));
              const uniqueKey = `blog-${post.id}-copy-${copyIndex}-${index}`;

              return (
                <article
                  key={uniqueKey}
                  data-carousel-card
                  onClick={() => handleCardClick(post.slug)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleCardClick(post.slug);
                    }
                  }}
                  className="flex-shrink-0 relative transition-transform duration-300 w-[82vw] max-w-[340px] sm:max-w-none sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)] h-[360px] sm:h-[420px] rounded-3xl overflow-hidden group/card shadow-md hover:shadow-2xl cursor-pointer select-none"
                  aria-label={`Read article: ${post.title}`}
                >
                  {/* Full-bleed Background Image with Hover Zoom */}
                  <Image
                    src={post.coverImage}
                    alt={post.title}
                    fill
                    sizes="(max-width: 640px) 82vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover group-hover/card:scale-105 transition-transform duration-700"
                  />

                  {/* Cinematic Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent pointer-events-none" />

                  {/* Content Overlay */}
                  <div className="absolute inset-0 p-5 sm:p-6 flex flex-col justify-between text-white z-10">
                    {/* Top Badges Row */}
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-md border border-white/30 text-white shadow-sm">
                          {post.category}
                        </span>
                        {post.isInformative && (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30 flex items-center gap-1">
                            <Sparkles className="w-3 h-3 fill-current text-slate-950" />
                            <span>Informative</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 text-xs font-bold text-white bg-white/20 backdrop-blur-md border border-white/30 px-2.5 py-1 rounded-full shadow-sm">
                        <Clock className="w-3.5 h-3.5 text-teal-300" />
                        <span>{post.readTime}</span>
                      </div>
                    </div>

                    {/* Bottom Metadata & Info Stack */}
                    <div className="space-y-1.5">
                      {/* Published Date */}
                      <div className="flex items-center gap-1.5 text-xs text-teal-300 font-medium">
                        <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{post.publishedDate}</span>
                      </div>

                      {/* Article Title */}
                      <h3 className="text-xl sm:text-2xl font-black tracking-tight leading-tight line-clamp-1">
                        {post.title}
                      </h3>

                      {/* Excerpt */}
                      <p className="text-xs text-slate-200 line-clamp-1 italic">
                        {post.excerpt}
                      </p>

                      {/* Author & Read Action CTA */}
                      <div className="pt-2 flex items-center justify-between gap-2 border-t border-white/20">
                        <div className="flex items-center gap-2">
                          <div className="relative w-6 h-6 rounded-full overflow-hidden border border-white/40 flex-shrink-0">
                            <Image
                              src={post.author.avatar}
                              alt={post.author.name}
                              fill
                              sizes="24px"
                              className="object-cover"
                            />
                          </div>
                          <span className="text-xs font-semibold text-slate-200 truncate max-w-[110px] sm:max-w-none">
                            {post.author.name}
                          </span>
                        </div>

                        <span className="text-xs font-bold text-teal-300 group-hover/card:text-white inline-flex items-center gap-1 transition-colors">
                          <span>Read Article</span>
                          <ArrowRight className="w-3.5 h-3.5 group-hover/card:translate-x-0.5 transition-transform" />
                        </span>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Bottom Controls: Pagination Dots & Counter */}
          {canAutoScroll && (
            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
              {/* Pagination Dots */}
              <div className="flex items-center gap-1.5 max-w-full overflow-x-auto py-1 scrollbar-none">
                {blogs.map((post, i) => (
                  <button
                    key={`dot-${post.id}-${i}`}
                    type="button"
                    onClick={() => handleGoTo(i)}
                    className={`h-2 sm:h-2.5 rounded-full transition-all duration-300 ${
                      activeIndex === i
                        ? "w-6 sm:w-8 bg-teal-600 shadow-sm shadow-teal-600/30"
                        : "w-2 sm:w-2.5 bg-slate-300 hover:bg-slate-400"
                    }`}
                    aria-label={`Go to slide ${i + 1}: ${post.title}`}
                    aria-current={activeIndex === i ? "true" : undefined}
                  />
                ))}
              </div>

              {/* Counter Badge */}
              <div className="flex items-center justify-between w-full sm:w-auto text-xs font-semibold text-slate-500 gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-teal-500" />
                  <span className="text-slate-600 font-medium text-[11px] sm:text-xs">
                    Editorial Stories
                  </span>
                </div>
                <span className="text-slate-300">•</span>
                <span className="text-[11px] sm:text-xs">
                  Viewing{" "}
                  <span className="text-slate-900 font-bold">
                    {activeIndex + 1}
                  </span>{" "}
                  of{" "}
                  <span className="text-slate-900 font-bold">
                    {blogs.length}
                  </span>{" "}
                  articles
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
