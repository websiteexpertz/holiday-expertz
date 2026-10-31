import React from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { getMemoryById } from "@backend/lib/storage/memoryStore";
import { MapPin, Calendar, User, ArrowLeft, Sparkles, Building2, Share2 } from "lucide-react";

interface MemoryDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: MemoryDetailPageProps) {
  const { id } = await params;
  const memory = getMemoryById(id);
  if (!memory) return { title: "Memory Story | HolidayExpertz" };
  return {
    title: `${memory.title} | HolidayExpertz Memories`,
    description: memory.shortDescription || memory.story.slice(0, 160),
  };
}

export default async function MemoryDetailPage({ params }: MemoryDetailPageProps) {
  const { id } = await params;
  const memory = getMemoryById(id);

  if (!memory || !memory.isPublished || !memory.isActive || memory.status !== "approved") {
    notFound();
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6] text-[#172B2A]">
      <Header />

      <main className="flex-1 pt-24 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Back Navigation & Share */}
          <div className="flex items-center justify-between">
            <Link
              href="/#memories"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#006F66] hover:text-[#009F8D] transition-colors font-editorial-sans"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Memories</span>
            </Link>

            <Link
              href="/memories/submit"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#E7F6F3] text-[#006F66] hover:bg-[#006F66] hover:text-white text-xs font-bold transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Share Your Story</span>
            </Link>
          </div>

          {/* Editorial Title & Metadata */}
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#E8EAE5] text-[#006F66] text-xs font-bold uppercase tracking-wider font-editorial-sans shadow-xs">
              <MapPin className="w-3.5 h-3.5 text-[#009F8D]" />
              <span>{memory.destinationName}</span>
            </div>

            <h1 className="font-editorial-serif text-3xl sm:text-5xl lg:text-6xl font-semibold text-[#172B2A] tracking-tight leading-[1.15]">
              {memory.title}
            </h1>

            <div className="flex items-center gap-4 text-xs sm:text-sm text-[#697875] font-editorial-sans flex-wrap pt-1 border-b border-[#E8EAE5] pb-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#006F66]/10 text-[#006F66] flex items-center justify-center font-bold text-xs uppercase">
                  {memory.guestName.charAt(0)}
                </div>
                <div>
                  <span className="block font-semibold text-[#172B2A] leading-tight">{memory.guestName}</span>
                  <span className="text-[11px] text-[#697875]">Holiday Traveller</span>
                </div>
              </div>

              {memory.travelDate && (
                <div className="flex items-center gap-1.5 pl-3 border-l border-[#E8EAE5]">
                  <Calendar className="w-4 h-4 text-[#006F66]" />
                  <span>{memory.travelDate}</span>
                </div>
              )}

              {memory.propertyName && (
                <div className="flex items-center gap-1.5 pl-3 border-l border-[#E8EAE5]">
                  <Building2 className="w-4 h-4 text-[#006F66]" />
                  <span>Stay: {memory.propertyName}</span>
                </div>
              )}
            </div>
          </div>

          {/* Hero Cover Photograph */}
          <div className="relative rounded-3xl overflow-hidden shadow-2xl aspect-[16/10] sm:aspect-[16/9] bg-slate-900 border border-[#E8EAE5]">
            <Image
              src={memory.coverImage}
              alt={memory.title}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 896px"
              className="object-cover object-center"
            />
          </div>

          {/* Long-form Editorial Story */}
          <div className="bg-white border border-[#E8EAE5] rounded-3xl p-6 sm:p-10 shadow-sm space-y-6">
            <h2 className="font-editorial-serif text-2xl sm:text-3xl font-semibold text-[#172B2A]">
              The Holiday Experience
            </h2>

            <div className="font-editorial-sans text-sm sm:text-base text-[#172B2A]/90 leading-relaxed space-y-4 font-light">
              {memory.story.split("\n\n").map((para, idx) => (
                <p key={idx} className="leading-relaxed">
                  {para}
                </p>
              ))}
            </div>
          </div>

          {/* Additional Gallery Photography */}
          {memory.images.length > 1 && (
            <div className="space-y-4 pt-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#006F66]" />
                <h3 className="font-editorial-serif text-2xl font-semibold text-[#172B2A]">
                  Photo Gallery ({memory.images.length})
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {memory.images.map((img) => (
                  <div
                    key={img.id}
                    className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-slate-900 border border-[#E8EAE5] shadow-md group"
                  >
                    <Image
                      src={img.url}
                      alt={img.caption || memory.title}
                      fill
                      sizes="(max-width: 640px) 100vw, 440px"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {img.caption && (
                      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent text-white text-xs font-editorial-sans">
                        {img.caption}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Share Your Story Footer Callout */}
          <div className="bg-[#E7F6F3] border border-[#006F66]/20 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h4 className="font-editorial-serif text-xl font-bold text-[#172B2A]">
                Have you stayed with HolidayExpertz?
              </h4>
              <p className="font-editorial-sans text-xs sm:text-sm text-[#697875] mt-1">
                Share your memorable holiday moments, scenic photographs, and personal reflections with our community.
              </p>
            </div>
            <Link
              href="/memories/submit"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#006F66] hover:bg-[#009F8D] text-white font-bold text-xs uppercase tracking-wider shadow-lg shrink-0 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Share My Story</span>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

