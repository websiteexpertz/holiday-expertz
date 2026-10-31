"use client";

import React, { useState } from "react";
import Image from "next/image";
import { BookOpen, Calendar, Clock, ArrowRight, X, User, ChevronLeft, ChevronRight } from "lucide-react";
import { mockBlogs } from "@/data/blogs";
import { BlogPost } from "@/types/hotel";
import { useAutoScrollCarousel } from "@/hooks/useAutoScrollCarousel";

export default function BlogSection() {
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);

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
    itemsCount: mockBlogs.length,
    speed: 0.58,
    pauseOnHover: false,
    isModalOpen: selectedPost !== null,
  });

  const itemsToRender = canAutoScroll
    ? [...mockBlogs, ...mockBlogs, ...mockBlogs]
    : mockBlogs;

  return (
    <section
      ref={sectionRef}
      id="blog"
      aria-label="Travel Journal & Editorial Dispatches"
      className="pt-8 sm:pt-10 lg:pt-12 pb-12 sm:pb-16 lg:pb-20 bg-[#FAF9F6] border-b border-[#E8EAE5]/60 scroll-mt-20 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 sm:mb-14">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 text-[#006F66] text-xs font-bold uppercase tracking-[0.18em] font-editorial-sans">
              <span className="w-6 h-px bg-[#009F8D]" />
              <span>Travel Journal</span>
            </div>
            <h2 className="font-editorial-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#172B2A] tracking-tight leading-[1.12]">
              Stories, Tips & Dispatches. <br />
              <span className="italic font-light text-[#006F66]">Written by seasoned explorers & curators.</span>
            </h2>
          </div>

          {/* Controls: Weekly Pill & Navigation Arrows */}
          <div className="flex items-center justify-between sm:justify-end gap-2.5 sm:gap-3 flex-wrap font-editorial-sans">
            <span className="text-xs text-[#697875] font-semibold bg-white px-3.5 py-2 rounded-xl border border-[#E8EAE5] shadow-xs">
              Updated Weekly
            </span>

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
              const copyIndex = Math.floor(index / mockBlogs.length);
              const uniqueKey = `blog-${post.id}-copy-${copyIndex}-${index}`;

              return (
                <article
                  key={uniqueKey}
                  data-carousel-card
                  onClick={() => setSelectedPost(post)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedPost(post);
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
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-md border border-white/30 text-white shadow-sm">
                        {post.category}
                      </span>

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
                {mockBlogs.map((post, i) => (
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
                    {mockBlogs.length}
                  </span>{" "}
                  articles
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Article Reader Preview Modal */}
      {selectedPost && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-md animate-in fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col border border-slate-100">
            {/* Top Close Bar */}
            <div className="p-4 sm:p-6 pb-2 flex items-center justify-between border-b border-slate-100">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200">
                {selectedPost.category}
              </span>
              <button
                type="button"
                onClick={() => setSelectedPost(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors"
                aria-label="Close article"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Article Body */}
            <div className="p-6 sm:p-8 overflow-y-auto space-y-6">
              <div className="space-y-3">
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                  {selectedPost.title}
                </h2>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-teal-600" />
                    <span className="font-semibold text-slate-700">
                      {selectedPost.author.name}
                    </span>
                    <span>• {selectedPost.author.role}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{selectedPost.publishedDate}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{selectedPost.readTime}</span>
                  </div>
                </div>
              </div>

              <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden bg-slate-100">
                <Image
                  src={selectedPost.coverImage}
                  alt={selectedPost.title}
                  fill
                  sizes="700px"
                  className="object-cover"
                />
              </div>

              {/* Sample Article Content */}
              <div className="prose prose-slate max-w-none text-slate-700 text-sm sm:text-base leading-relaxed space-y-4">
                <p className="font-semibold text-slate-900 text-base sm:text-lg">
                  {selectedPost.excerpt}
                </p>
                <p>
                  Traveling across India offers an extraordinary kaleidoscope of scenery, architecture, and traditions. When planning your journey, curating the right hotel forms the foundation of every experience.
                </p>
                <p>
                  At HolidayExpertz, our specialists evaluate properties based on three core pillars: authentic hospitality, distinctive regional character, and effortless comfort. Whether waking up to tea-carpeted slopes in Munnar or admiring palace courtyards in Udaipur, choosing the right base turns a simple trip into a cherished memory.
                </p>
                <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 text-teal-900 text-xs sm:text-sm font-medium">
                  💡 <strong>Expert Tip:</strong> Always verify check-in flexibility and look for stays offering tailored regional culinary experiences and verified guest testimonials.
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedPost(null)}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-teal-600 text-white font-bold text-sm rounded-xl transition-colors"
                >
                  Done Reading
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
