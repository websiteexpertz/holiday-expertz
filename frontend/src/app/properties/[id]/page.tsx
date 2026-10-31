"use client";
import { apiUrl } from "@/lib/apiUrl";

import React, { useState, useEffect, useRef, useCallback, useMemo, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AuthModal from "@/components/layout/AuthModal";
import PropertyDetailMap from "@/components/hotels/PropertyDetailMap";
import { Property } from "@backend/types/property";
import { ReviewRecord } from "@backend/types/admin";
import {
  MapPin,
  Users,
  Bed,
  Bath,
  Clock,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Calendar as CalendarIcon,
  Share2,
  ChevronLeft,
  ChevronRight,
  X,
  Phone,
  Mail,
  Star,
  Info,
  Check,
  Building2,
  ArrowLeft,
  Heart,
  Send,
  Loader2,
  ExternalLink,
  Navigation,
  FileText,
  DollarSign,
  HelpCircle,
  MessageSquare,
  Coffee,
  Wifi,
  Waves,
  Car,
  Wind,
  Tv,
  Utensils,
  Award,
  CreditCard,
  ThumbsUp,
  Download,
  Printer,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface BookedRange {
  checkInDate: string;
  checkOutDate: string;
  bookingStatus?: string;
}

interface PriceSummary {
  nights: number;
  nightlyRate: number;
  baseAmount: number;
  cleaningFee: number;
  taxes: number;
  totalAmount: number;
}

function PropertyDetailContent() {
  const routeParams = useParams();
  const propertyId = (routeParams?.id as string) || "";
  const router = useRouter();

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Gallery Modal
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  // Favorites state (persisted to localStorage)
  const [isFavorite, setIsFavorite] = useState(false);

  // Share Notification
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  // Active section for sticky sub-navbar
  const [activeSection, setActiveSection] = useState("overview");

  // Read more description toggle
  const [isDescExpanded, setIsDescExpanded] = useState(false);

  // All Amenities Modal
  const [amenitiesModalOpen, setAmenitiesModalOpen] = useState(false);

  // Availability & Calendar
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [bookedRanges, setBookedRanges] = useState<BookedRange[]>([]);
  const [checkInDate, setCheckInDate] = useState("");
  const [checkOutDate, setCheckOutDate] = useState("");
  const [selectedGuests, setSelectedGuests] = useState(2);

  // Booking Card Mode ('book' | 'inquire')
  const [bookingMode, setBookingMode] = useState<"book" | "inquire">("book");

  // Reservation form state
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [confirmedBooking, setConfirmedBooking] = useState<any | null>(null);

  // Inquiry form state
  const [inquiryName, setInquiryName] = useState("");
  const [inquiryEmail, setInquiryEmail] = useState("");
  const [inquiryPhone, setInquiryPhone] = useState("");
  const [inquiryMessage, setInquiryMessage] = useState("");
  const [isSubmittingInquiry, setIsSubmittingInquiry] = useState(false);
  const [inquirySuccess, setInquirySuccess] = useState(false);

  // Reviews state
  const [reviews, setReviews] = useState<ReviewRecord[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewAuthor, setNewReviewAuthor] = useState("");
  const [newReviewLocation, setNewReviewLocation] = useState("");
  const [newReviewComment, setNewReviewComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);


  // Refs for smooth scroll navigation
  const overviewRef = useRef<HTMLDivElement>(null);
  const amenitiesRef = useRef<HTMLDivElement>(null);
  const ratesRef = useRef<HTMLDivElement>(null);
  const availabilityRef = useRef<HTMLDivElement>(null);
  const locationRef = useRef<HTMLDivElement>(null);
  const reviewsRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);

  // 1. Load Property Details
  useEffect(() => {
    async function loadProperty() {
      try {
        setLoading(true);
        const res = await fetch(apiUrl(`/api/public/properties/${propertyId}`));
        const data = await res.json();
        if (data.success && data.property) {
          setProperty(data.property);
          setSelectedGuests(data.property.capacity?.maxGuests || 2);
        } else {
          setError(data.message || "Property not found");
        }
      } catch (err) {
        console.error("Failed to load property:", err);
        setError("Unable to load property details.");
      } finally {
        setLoading(false);
      }
    }
    if (propertyId) {
      loadProperty();
    }
  }, [propertyId]);

  // 2. Load Availability & Bookings
  const loadAvailability = useCallback(async () => {
    if (!propertyId) return;
    try {
      const res = await fetch(apiUrl(`/api/public/properties/${propertyId}/availability`));
      const data = await res.json();
      if (data.success && Array.isArray(data.bookedRanges)) {
        setBookedRanges(data.bookedRanges);
      }
    } catch (err) {
      console.error("Failed to load availability:", err);
    }
  }, [propertyId]);

  useEffect(() => {
    loadAvailability();
  }, [loadAvailability]);

  // 3. Load Reviews
  const loadReviews = useCallback(async () => {
    if (!propertyId) return;
    try {
      setIsLoadingReviews(true);
      const res = await fetch(apiUrl(`/api/public/reviews?propertyId=${propertyId}`));
      const data = await res.json();
      if (data.success && Array.isArray(data.reviews)) {
        setReviews(data.reviews);
      }
    } catch (err) {
      console.error("Failed to load reviews:", err);
    } finally {
      setIsLoadingReviews(false);
    }
  }, [propertyId]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  // 4. Check & Persist Favorites
  useEffect(() => {
    if (typeof window !== "undefined" && propertyId) {
      const favs = JSON.parse(localStorage.getItem("hx_favorites") || "[]");
      setIsFavorite(favs.includes(propertyId));
    }
  }, [propertyId]);

  const toggleFavorite = () => {
    if (typeof window === "undefined" || !propertyId) return;
    const favs: string[] = JSON.parse(localStorage.getItem("hx_favorites") || "[]");
    let next: string[];
    if (favs.includes(propertyId)) {
      next = favs.filter((id) => id !== propertyId);
      setIsFavorite(false);
    } else {
      next = [...favs, propertyId];
      setIsFavorite(true);
    }
    localStorage.setItem("hx_favorites", JSON.stringify(next));
  };

  // 5. Handle Share (Web Share API with clipboard fallback)
  const handleShare = async () => {
    const shareUrl = typeof window !== "undefined" ? window.location.href : "";
    const shareData = {
      title: property ? `${property.name} on HolidayExpertz` : "HolidayExpertz Luxury Stay",
      text: property?.shortDescription || "Check out this luxury stay on HolidayExpertz!",
      url: shareUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        // User cancelled or share failed, fallback to copy
      }
    }

    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      setShareFeedback("Link copied to clipboard!");
      setTimeout(() => setShareFeedback(null), 3000);
    }
  };

  // 6. Section Scroll Spy
  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY + 200;
      const sections = [
        { id: "overview", ref: overviewRef },
        { id: "amenities", ref: amenitiesRef },
        { id: "rates", ref: ratesRef },
        { id: "availability", ref: availabilityRef },
        { id: "location", ref: locationRef },
        { id: "reviews", ref: reviewsRef },
        { id: "host", ref: hostRef },
      ];

      for (let i = sections.length - 1; i >= 0; i--) {
        const el = sections[i].ref.current;
        if (el && el.offsetTop <= scrollPos) {
          setActiveSection(sections[i].id);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (sectionId: string, ref: React.RefObject<HTMLDivElement | null>) => {
    setActiveSection(sectionId);
    if (ref.current) {
      const top = ref.current.getBoundingClientRect().top + window.scrollY - 130;
      window.scrollTo({ top, behavior: "smooth" });
    }
  };

  // 7. Gallery Keyboard Navigation
  const handleNextPhoto = useCallback(() => {
    if (!property?.images || property.images.length === 0) return;
    setActivePhotoIndex((prev) => (prev + 1) % property.images.length);
  }, [property?.images]);

  const handlePrevPhoto = useCallback(() => {
    if (!property?.images || property.images.length === 0) return;
    setActivePhotoIndex((prev) => (prev - 1 + property.images.length) % property.images.length);
  }, [property?.images]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!galleryOpen) return;
      if (e.key === "Escape") setGalleryOpen(false);
      if (e.key === "ArrowRight") handleNextPhoto();
      if (e.key === "ArrowLeft") handlePrevPhoto();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [galleryOpen, handleNextPhoto, handlePrevPhoto]);

  // 8. Availability Date Checks & Price Calculation
  const isDateBooked = (dateStr: string): boolean => {
    const target = new Date(dateStr).getTime();
    return bookedRanges.some((range) => {
      const start = new Date(range.checkInDate).getTime();
      const end = new Date(range.checkOutDate).getTime();
      return target >= start && target < end;
    });
  };

  const calculatePriceSummary = (): PriceSummary => {
    const nightlyRate = property?.pricing?.pricePerNight || 0;
    if (!checkInDate || !checkOutDate) {
      return {
        nights: 1,
        nightlyRate,
        baseAmount: nightlyRate,
        cleaningFee: Math.round(nightlyRate * 0.05),
        taxes: Math.round(nightlyRate * 0.12),
        totalAmount: Math.round(nightlyRate * 1.17),
      };
    }

    const start = new Date(checkInDate).getTime();
    const end = new Date(checkOutDate).getTime();
    const diffDays = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));

    const baseAmount = diffDays * nightlyRate;
    const cleaningFee = Math.round(nightlyRate * 0.05);
    const taxes = Math.round(baseAmount * 0.12);
    const totalAmount = baseAmount + cleaningFee + taxes;

    return {
      nights: diffDays,
      nightlyRate,
      baseAmount,
      cleaningFee,
      taxes,
      totalAmount,
    };
  };

  const priceSummary = calculatePriceSummary();

  // Handle Calendar Day Click
  const handleCalendarDayClick = (dateStr: string) => {
    if (isDateBooked(dateStr)) return;

    if (!checkInDate || (checkInDate && checkOutDate)) {
      setCheckInDate(dateStr);
      setCheckOutDate("");
    } else if (checkInDate && !checkOutDate) {
      if (new Date(dateStr) <= new Date(checkInDate)) {
        setCheckInDate(dateStr);
        setCheckOutDate("");
      } else {
        // Verify no booked dates in-between
        const start = new Date(checkInDate);
        const end = new Date(dateStr);
        let hasConflict = false;
        let curr = new Date(start);
        curr.setDate(curr.getDate() + 1);
        while (curr < end) {
          const s = curr.toISOString().split("T")[0];
          if (isDateBooked(s)) {
            hasConflict = true;
            break;
          }
          curr.setDate(curr.getDate() + 1);
        }

        if (hasConflict) {
          alert("Selected range includes already booked dates. Please pick an available window.");
          return;
        }

        setCheckOutDate(dateStr);
      }
    }
  };

  // 9. Booking Form Submission
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError("");

    if (!checkInDate || !checkOutDate) {
      setBookingError("Please select both Check-In and Check-Out dates.");
      return;
    }

    if (!guestName.trim() || !guestEmail.trim()) {
      setBookingError("Please enter your name and email.");
      return;
    }

    try {
      setIsSubmittingBooking(true);
      const res = await fetch(apiUrl(`/api/public/properties/${propertyId}/book`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checkInDate,
          checkOutDate,
          guests: selectedGuests,
          customerName: guestName,
          customerEmail: guestEmail,
          customerPhone: guestPhone,
          specialRequests,
        }),
      });

      const data = await res.json();
      if (data.success && data.booking) {
        setConfirmedBooking(data.booking);
        // Refresh availability
        await loadAvailability();
      } else {
        setBookingError(data.message || "Failed to complete reservation. Please try again.");
      }
    } catch (err) {
      console.error("Booking error:", err);
      setBookingError("Connection error while processing booking. Please try again.");
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  // 10. Inquiry Form Submission
  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryName.trim() || !inquiryEmail.trim()) return;

    try {
      setIsSubmittingInquiry(true);
      const res = await fetch(apiUrl("/api/public/inquiries"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: inquiryName,
          email: inquiryEmail,
          phone: inquiryPhone,
          subject: `Booking Inquiry for ${property?.name}`,
          message: `${inquiryMessage || "I am interested in staying at this property."} | Dates: ${
            checkInDate || "Flexible"
          } to ${checkOutDate || "Flexible"} | Guests: ${selectedGuests}`,
          relatedPropertyId: property?.id,
          relatedPropertyName: property?.name,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setInquirySuccess(true);
      } else {
        alert(data.message || "Failed to send inquiry.");
      }
    } catch (err) {
      console.error("Error submitting inquiry:", err);
      alert("Something went wrong submitting inquiry.");
    } finally {
      setIsSubmittingInquiry(false);
    }
  };

  // 11. Review Form Submission
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewAuthor.trim() || !newReviewComment.trim()) return;

    try {
      setIsSubmittingReview(true);
      const res = await fetch(apiUrl("/api/public/reviews"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          author: newReviewAuthor,
          rating: newReviewRating,
          comment: newReviewComment,
          location: newReviewLocation || "Verified Guest",
          propertyId: property?.id,
          propertyName: property?.name,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setReviewModalOpen(false);
        setNewReviewAuthor("");
        setNewReviewLocation("");
        setNewReviewComment("");
        await loadReviews();
      } else {
        alert(data.message || "Failed to submit review.");
      }
    } catch (err) {
      console.error("Review submit error:", err);
      alert("Error submitting review.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <Header onOpenAuthModal={() => setAuthModalOpen(true)} />
        <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-4">
          <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-600">Loading verified vacation rental...</p>
        </div>
        <Footer />
      </div>
    );
  }

  // Error / Missing Property
  if (error || !property) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <Header onOpenAuthModal={() => setAuthModalOpen(true)} />
        <div className="flex-1 flex flex-col items-center justify-center p-8 max-w-md mx-auto text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <X className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Property Not Available</h2>
          <p className="text-xs sm:text-sm text-slate-500">
            {error || "This listing could not be found or has been paused by the owner."}
          </p>
          <Link
            href="/properties"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold shadow-md"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All Properties</span>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  // All Images normalized
  const allImages =
    property.images && property.images.length > 0
      ? property.images
      : [
          {
            id: "def",
            url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80",
            isCover: true,
            caption: "Property View",
          },
        ];

  const coverImage = allImages.find((img) => img.isCover)?.url || allImages[0]?.url;

  const formattedPrice = new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(property.pricing?.pricePerNight || 0);

  const formattedOriginalPrice = property.pricing?.originalPrice
    ? new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(
        property.pricing.originalPrice
      )
    : null;

  // Categorized Amenities Map
  const categorizedAmenities: { [category: string]: string[] } = {
    "Kitchen & Dining": [],
    "Bed & Bath": [],
    "Outdoor & Scenic Views": [],
    "Entertainment & Technology": [],
    "Services & Convenience": [],
    "Safety & Climate": [],
  };

  const amenityPool = property.amenities || [];
  amenityPool.forEach((am) => {
    const l = am.toLowerCase();
    if (l.includes("kitchen") || l.includes("dining") || l.includes("fridge") || l.includes("coffee") || l.includes("chef") || l.includes("bbq")) {
      categorizedAmenities["Kitchen & Dining"].push(am);
    } else if (l.includes("bath") || l.includes("bed") || l.includes("water") || l.includes("towel") || l.includes("linen") || l.includes("tub")) {
      categorizedAmenities["Bed & Bath"].push(am);
    } else if (l.includes("pool") || l.includes("garden") || l.includes("patio") || l.includes("mountain") || l.includes("lake") || l.includes("view") || l.includes("balcony")) {
      categorizedAmenities["Outdoor & Scenic Views"].push(am);
    } else if (l.includes("wi-fi") || l.includes("wifi") || l.includes("tv") || l.includes("sound") || l.includes("game") || l.includes("internet")) {
      categorizedAmenities["Entertainment & Technology"].push(am);
    } else if (l.includes("parking") || l.includes("valet") || l.includes("helipad") || l.includes("butler") || l.includes("cleaning") || l.includes("car")) {
      categorizedAmenities["Services & Convenience"].push(am);
    } else {
      categorizedAmenities["Safety & Climate"].push(am);
    }
  });

  // Calendar rendering helpers
  const year = calendarMonth.getFullYear();
  const month = calendarMonth.getMonth();
  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = new Date().toISOString().split("T")[0];

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const navNextMonth = () => {
    setCalendarMonth(new Date(year, month + 1, 1));
  };

  const navPrevMonth = () => {
    setCalendarMonth(new Date(year, month - 1, 1));
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      <Header onOpenAuthModal={() => setAuthModalOpen(true)} />
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-20 flex-1 w-full space-y-6">
        {/* ── Breadcrumb Navigation (Reference: A1VacationHomes Breadcrumbs) ── */}
        <div className="flex items-center gap-2 text-xs text-slate-500 overflow-x-auto scrollbar-none py-1">
          <Link href="/" className="hover:text-teal-700 font-medium">
            Home
          </Link>
          <span>/</span>
          <Link href="/properties" className="hover:text-teal-700 font-medium">
            Vacation Rentals
          </Link>
          <span>/</span>
          {property.location.country && (
            <>
              <Link
                href={`/properties?search=${encodeURIComponent(property.location.country)}`}
                className="hover:text-teal-700 font-medium capitalize"
              >
                {property.location.country}
              </Link>
              <span>/</span>
            </>
          )}
          {property.location.city && (
            <>
              <Link
                href={`/properties?search=${encodeURIComponent(property.location.city)}`}
                className="hover:text-teal-700 font-medium capitalize"
              >
                {property.location.city}
              </Link>
              <span>/</span>
            </>
          )}
          <span className="text-slate-900 font-semibold truncate max-w-xs">{property.name}</span>
        </div>

        {/* ── Heading Block & Action Buttons ── */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200">
                {property.propertyType}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border capitalize ${
                  property.status === "approved"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : "bg-slate-100 text-slate-700 border-slate-200"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    property.status === "approved" ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                  }`}
                />
                <span>{property.status ? property.status.replace("_", " ") : "Approved"}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-xs">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Verified Property</span>
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                0% Traveler Service Fee
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
              {property.name}
            </h1>

            <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600 flex-wrap">
              <MapPin className="w-4 h-4 text-teal-600 shrink-0" />
              <span>
                {[
                  property.location.address,
                  property.location.locality,
                  property.location.city,
                  property.location.state,
                  property.location.country,
                ]
                  .filter(Boolean)
                  .join(", ")}
              </span>
              <span className="text-slate-300">•</span>
              <div className="flex items-center gap-1 text-slate-700 font-semibold">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span>{property.rating ? property.rating.toFixed(1) : "4.9"}</span>
                <span className="text-slate-400 font-normal">
                  ({reviews.length > 0 ? reviews.length : property.reviewCount || 12} reviews)
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons: Save, Share, Edit, Back */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={toggleFavorite}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all shadow-xs ${
                isFavorite
                  ? "bg-rose-50 border-rose-200 text-rose-600"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
              title="Save to Favorites"
            >
              <Heart className={`w-4 h-4 ${isFavorite ? "fill-rose-500 text-rose-500" : "text-slate-400"}`} />
              <span>{isFavorite ? "Saved" : "Save"}</span>
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all shadow-xs relative"
              title="Share Listing"
            >
              <Share2 className="w-4 h-4 text-teal-600" />
              <span>Share</span>
              {shareFeedback && (
                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2.5 py-1 rounded-md whitespace-nowrap shadow-md z-30">
                  {shareFeedback}
                </span>
              )}
            </button>

            <Link
              href="/properties"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold transition-all shadow-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>All Properties</span>
            </Link>
          </div>
        </div>

        {/* ── Photo Gallery Mosaic Showcase (A1VacationHomes Style) ── */}
        <div className="relative rounded-3xl overflow-hidden shadow-xl border border-slate-200 bg-slate-900">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 h-[340px] sm:h-[450px]">
            {/* Primary Hero Cover Image */}
            <div
              className={`relative cursor-pointer group ${
                allImages.length > 1 ? "md:col-span-2 md:row-span-2 h-full" : "md:col-span-4 h-full"
              }`}
              onClick={() => {
                setActivePhotoIndex(0);
                setGalleryOpen(true);
              }}
            >
              <Image
                src={coverImage}
                alt={property.name}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover group-hover:scale-102 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-slate-950/20 group-hover:bg-transparent transition-colors" />
            </div>

            {/* Supporting Images */}
            {allImages.slice(1, 5).map((img, idx) => (
              <div
                key={img.id || idx}
                className="relative hidden md:block h-full cursor-pointer group overflow-hidden bg-slate-800"
                onClick={() => {
                  setActivePhotoIndex(idx + 1);
                  setGalleryOpen(true);
                }}
              >
                <Image
                  src={img.url}
                  alt={img.caption || property.name}
                  fill
                  sizes="25vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-slate-950/20 group-hover:bg-transparent transition-colors" />
              </div>
            ))}
          </div>

          {/* View All Photos Button */}
          <button
            type="button"
            onClick={() => {
              setActivePhotoIndex(0);
              setGalleryOpen(true);
            }}
            className="absolute bottom-4 right-4 px-4 py-2 bg-white/95 hover:bg-white text-slate-900 backdrop-blur-md rounded-xl font-bold text-xs shadow-lg flex items-center gap-2 transition-all active:scale-95 border border-slate-200"
          >
            <Sparkles className="w-4 h-4 text-teal-600" />
            <span>View All Photos ({allImages.length})</span>
          </button>
        </div>

        {/* ── Sticky Sub-Navbar Section Navigation (Modeled on A1VacationHomes Navigation) ── */}
        <div className="sticky top-16 z-30 bg-white/95 backdrop-blur-md border-y border-slate-200/90 py-2.5 px-2 -mx-4 sm:-mx-6 lg:-mx-8 shadow-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1 sm:gap-2 overflow-x-auto scrollbar-none">
            {[
              { id: "overview", label: "Overview", ref: overviewRef },
              { id: "amenities", label: "Amenities & Activities", ref: amenitiesRef },
              { id: "rates", label: "Rates & Policies", ref: ratesRef },
              { id: "availability", label: "Availability Calendar", ref: availabilityRef },
              { id: "location", label: "Location & Map", ref: locationRef },
              { id: "reviews", label: `Reviews (${reviews.length > 0 ? reviews.length : 12})`, ref: reviewsRef },
              { id: "host", label: "Meet Host", ref: hostRef },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => scrollToSection(tab.id, tab.ref)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  activeSection === tab.id
                    ? "bg-teal-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-teal-700 hover:bg-slate-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Two-Column Main Content & Sticky Booking Card ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ════════ LEFT COLUMN (~68% content) ════════ */}
          <div className="lg:col-span-8 space-y-10">
            {/* 1. OVERVIEW SECTION */}
            <div ref={overviewRef} id="overview" className="space-y-6 pt-2">
              {/* Verified HolidayExpertz Guarantee Banner */}
              <div className="p-5 bg-gradient-to-r from-teal-50 via-emerald-50 to-teal-50 border border-teal-200 rounded-3xl flex items-start gap-4 shadow-xs">
                <div className="w-11 h-11 rounded-2xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-teal-600/20">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-teal-950">
                    HolidayExpertz Best Rate & Verified Stay Guarantee
                  </h3>
                  <p className="text-xs text-teal-900/80 leading-relaxed">
                    Enjoy transparent pricing, 100% verified accommodations, and zero traveler service fees.
                  </p>
                </div>
              </div>

              {/* Key Accommodation Specs Grid */}
              <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs grid grid-cols-2 sm:grid-cols-4 gap-4 text-center divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
                <div className="space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Accommodates</div>
                  <div className="flex items-center justify-center gap-1.5 text-base sm:text-lg font-black text-slate-900">
                    <Users className="w-5 h-5 text-teal-600" />
                    <span>{property.capacity?.maxGuests || 2} Guests</span>
                  </div>
                </div>
                <div className="space-y-1 pt-2 sm:pt-0">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Bedrooms</div>
                  <div className="flex items-center justify-center gap-1.5 text-base sm:text-lg font-black text-slate-900">
                    <Bed className="w-5 h-5 text-teal-600" />
                    <span>
                      {property.capacity?.bedrooms || 1} Room{property.capacity?.bedrooms === 1 ? "" : "s"}
                    </span>
                  </div>
                </div>
                <div className="space-y-1 pt-2 sm:pt-0">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Bathrooms</div>
                  <div className="flex items-center justify-center gap-1.5 text-base sm:text-lg font-black text-slate-900">
                    <Bath className="w-5 h-5 text-teal-600" />
                    <span>
                      {property.capacity?.bathrooms || 1} Bath{property.capacity?.bathrooms === 1 ? "" : "s"}
                    </span>
                  </div>
                </div>
                <div className="space-y-1 pt-2 sm:pt-0">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Check-In / Out</div>
                  <div className="flex items-center justify-center gap-1.5 text-xs sm:text-sm font-black text-slate-900">
                    <Clock className="w-4 h-4 text-teal-600" />
                    <span>
                      {property.capacity?.checkInTime || "14:00"} / {property.capacity?.checkOutTime || "11:00"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description Card with Read-More */}
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <FileText className="w-5 h-5 text-teal-600" />
                  <span>About this Vacation Rental</span>
                </h2>

                {property.shortDescription && (
                  <div className="text-sm font-semibold text-teal-950 bg-teal-50/70 p-4 rounded-2xl border border-teal-200/70 leading-relaxed">
                    {property.shortDescription}
                  </div>
                )}

                <div
                  className={`text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line relative ${
                    !isDescExpanded && (property.detailedDescription?.length || 0) > 350
                      ? "max-h-48 overflow-hidden"
                      : ""
                  }`}
                >
                  {property.detailedDescription || "Experience an exceptional getaway with authentic hospitality."}
                  {!isDescExpanded && (property.detailedDescription?.length || 0) > 350 && (
                    <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white to-transparent" />
                  )}
                </div>

                {(property.detailedDescription?.length || 0) > 350 && (
                  <button
                    type="button"
                    onClick={() => setIsDescExpanded(!isDescExpanded)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 hover:text-teal-800 underline pt-1"
                  >
                    <span>{isDescExpanded ? "Read Less" : "Read Full Description"}</span>
                    {isDescExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                )}
              </div>
            </div>

            {/* 2. AMENITIES & ACTIVITIES SECTION (Grouped as in reference website) */}
            <div ref={amenitiesRef} id="amenities" className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-teal-600" />
                    <span>Amenities & Activities</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Verified facilities and conveniences available on-site
                  </p>
                </div>
                <span className="text-xs font-bold px-3 py-1 bg-teal-50 text-teal-800 border border-teal-200 rounded-full">
                  {property.amenities?.length || 0} features
                </span>
              </div>

              {property.amenities && property.amenities.length > 0 ? (
                <div className="space-y-6">
                  {Object.entries(categorizedAmenities).map(([category, items]) => {
                    if (items.length === 0) return null;
                    return (
                      <div key={category} className="space-y-3">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          {category}
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                          {items.map((amenity, i) => (
                            <div
                              key={i}
                              className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-2.5 text-xs font-semibold text-slate-800"
                            >
                              <div className="w-5 h-5 rounded-lg bg-teal-600 text-white flex items-center justify-center shrink-0">
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                              </div>
                              <span className="truncate capitalize">{amenity}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-400">No specific amenities configured.</p>
              )}
            </div>

            {/* 3. RATES & POLICIES SECTION (Reference: Rates & Additional Rate Information) */}
            <div ref={ratesRef} id="rates" className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-teal-600" />
                    <span>Rates & Pricing Information</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Clear, transparent rate breakdown and booking terms
                  </p>
                </div>
                <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  Best Rates Guaranteed
                </span>
              </div>

              {/* Rates Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-slate-200 rounded-2xl overflow-hidden">
                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="p-3.5">Season / Rate Tier</th>
                      <th className="p-3.5">Period</th>
                      <th className="p-3.5">Nightly Rate</th>
                      <th className="p-3.5">Min Stay</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="hover:bg-slate-50/80">
                      <td className="p-3.5 font-bold text-slate-900">Standard Nightly Rate</td>
                      <td className="p-3.5 text-slate-600">Year-Round Availability</td>
                      <td className="p-3.5 font-extrabold text-teal-700">₹{formattedPrice} / night</td>
                      <td className="p-3.5 text-slate-600">1 Night</td>
                    </tr>
                    {formattedOriginalPrice && (
                      <tr className="hover:bg-slate-50/80">
                        <td className="p-3.5 font-bold text-slate-700">Standard Published Rate</td>
                        <td className="p-3.5 text-slate-500">Regular Portal Price</td>
                        <td className="p-3.5 text-slate-400 line-through">₹{formattedOriginalPrice} / night</td>
                        <td className="p-3.5 text-slate-500">1 Night</td>
                      </tr>
                    )}
                    <tr className="hover:bg-slate-50/80">
                      <td className="p-3.5 font-bold text-slate-900">Weekend & Festival Stays</td>
                      <td className="p-3.5 text-slate-600">Fri - Sun / Holiday Weekends</td>
                      <td className="p-3.5 font-bold text-slate-900">₹{formattedPrice}</td>
                      <td className="p-3.5 text-slate-600">2 Nights</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Additional Rate & Fee Policies */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-teal-600" />
                    <span>Included in Nightly Rate</span>
                  </div>
                  <p className="text-slate-600">
                    Complimentary high-speed Wi-Fi, purified drinking water, daily housekeeping, and free private parking.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-teal-600" />
                    <span>Cancellation Policy</span>
                  </div>
                  <p className="text-slate-600">
                    Full refund up to 14 days before check-in. 50% refund between 7 to 14 days. Non-refundable within 7 days.
                  </p>
                </div>
              </div>
            </div>

            {/* 4. AVAILABILITY CALENDAR SECTION (Reference: Interactive Calendar) */}
            <div ref={availabilityRef} id="availability" className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-teal-600" />
                    <span>Availability Calendar</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Click an available date to set Check-In, then click a second date to set Check-Out
                  </p>
                </div>

                {/* Month Navigator Controls */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={navPrevMonth}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                    title="Previous Month"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-bold text-slate-900 min-w-[120px] text-center">
                    {monthNames[month]} {year}
                  </span>
                  <button
                    type="button"
                    onClick={navNextMonth}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                    title="Next Month"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Interactive Calendar Month Grid */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50">
                <div className="grid grid-cols-7 gap-1 text-center font-bold text-[11px] text-slate-400 uppercase tracking-wider mb-2">
                  <span>Sun</span>
                  <span>Mon</span>
                  <span>Tue</span>
                  <span>Wed</span>
                  <span>Thu</span>
                  <span>Fri</span>
                  <span>Sat</span>
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {/* Empty cells before month start */}
                  {Array.from({ length: firstDayIndex }).map((_, i) => (
                    <div key={`empty-${i}`} className="h-10 sm:h-12 rounded-xl" />
                  ))}

                  {/* Days in Month */}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const dayNum = i + 1;
                    const dayDate = new Date(year, month, dayNum);
                    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
                    const isPast = dateStr < todayStr;
                    const isBooked = isDateBooked(dateStr);
                    const isCheckIn = checkInDate === dateStr;
                    const isCheckOut = checkOutDate === dateStr;
                    const inRange =
                      checkInDate &&
                      checkOutDate &&
                      dateStr > checkInDate &&
                      dateStr < checkOutDate;

                    let dayStyle = "bg-white hover:bg-teal-50 text-slate-900 border border-slate-200";

                    if (isPast) {
                      dayStyle = "bg-slate-100/70 text-slate-300 border-transparent cursor-not-allowed";
                    } else if (isBooked) {
                      dayStyle = "bg-slate-200/90 text-slate-400 line-through border-slate-200 cursor-not-allowed";
                    } else if (isCheckIn || isCheckOut) {
                      dayStyle = "bg-teal-600 text-white font-black shadow-md border-teal-600 scale-102";
                    } else if (inRange) {
                      dayStyle = "bg-teal-100 text-teal-900 font-bold border-teal-200";
                    }

                    return (
                      <button
                        key={dayNum}
                        type="button"
                        disabled={isPast || isBooked}
                        onClick={() => handleCalendarDayClick(dateStr)}
                        className={`h-10 sm:h-12 rounded-xl text-xs font-semibold flex flex-col items-center justify-center transition-all ${dayStyle}`}
                      >
                        <span>{dayNum}</span>
                        {!isPast && !isBooked && (
                          <span className="text-[9px] text-teal-700/70 font-normal hidden sm:inline">
                            ₹{Math.round((property.pricing?.pricePerNight || 0) / 1000)}k
                          </span>
                        )}
                        {isBooked && (
                          <span className="text-[9px] text-slate-400 hidden sm:inline">Booked</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Legend & Selected Dates Summary */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs pt-1">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 rounded-md bg-white border border-slate-200" />
                    <span className="text-slate-600">Available</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 rounded-md bg-teal-600" />
                    <span className="text-slate-600">Selected Dates</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 rounded-md bg-slate-200" />
                    <span className="text-slate-600">Reserved / Booked</span>
                  </div>
                </div>

                {checkInDate && (
                  <div className="text-xs font-bold text-teal-800 bg-teal-50 px-3 py-1.5 rounded-xl border border-teal-200">
                    {checkInDate} {checkOutDate ? `→ ${checkOutDate} (${priceSummary.nights} nights)` : "→ Select Check-out"}
                  </div>
                )}
              </div>
            </div>

            {/* 5. LOCATION & MAP SECTION (Reference: Property Location) */}
            <div ref={locationRef} id="location" className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              {/* Reference Header matching reference image: dashed separator + underlined Location */}
              <div className="border-t border-dashed border-slate-300 -mt-2 pt-4">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight inline-block border-b-2 border-slate-700 pb-1">
                  Location
                </h2>
              </div>

              {/* Interactive Property Location Map (Accurate coordinates, Leaflet tiles, Google Maps links) */}
              <PropertyDetailMap property={property} className="h-[380px] sm:h-[450px]" />

              {/* Location details below the map */}
              <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600 pt-1">
                <MapPin className="w-4 h-4 text-teal-600 shrink-0" />
                <span className="font-medium">
                  {[
                    property.location.address,
                    property.location.locality,
                    property.location.city,
                    property.location.state,
                    property.location.country,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </span>
              </div>

              {/* Surrounding Highlights */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="font-bold text-slate-900 block">Atmosphere</span>
                  <span className="text-slate-500">Serene natural surroundings & scenic horizons</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="font-bold text-slate-900 block">Accessibility</span>
                  <span className="text-slate-500">Convenient vehicle access with private parking</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="font-bold text-slate-900 block">Local Heritage</span>
                  <span className="text-slate-500">Minutes from historic monuments & vibrant bazaars</span>
                </div>
              </div>
            </div>

            {/* 6. GUEST REVIEWS SECTION (Reference: Guest Reviews & Moderation) */}
            <div ref={reviewsRef} id="reviews" className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                    <span>Guest Reviews & Experiences</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Authentic feedback from verified travelers
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setReviewModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors shadow-xs"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Write a Review</span>
                </button>
              </div>

              {/* Rating Summary Scorecard */}
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <div className="md:col-span-4 text-center md:border-r border-slate-200/80 pr-0 md:pr-6 space-y-1">
                  <div className="text-4xl sm:text-5xl font-black text-slate-900">
                    {property.rating ? property.rating.toFixed(1) : "4.9"}
                  </div>
                  <div className="flex items-center justify-center gap-1 text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-xs text-slate-500 font-semibold">
                    Based on {reviews.length > 0 ? reviews.length : 12} verified stays
                  </p>
                </div>

                {/* Subcategory breakdown */}
                <div className="md:col-span-8 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <div className="flex justify-between font-semibold text-slate-700 mb-1">
                      <span>Cleanliness</span>
                      <span>5.0</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-teal-600 h-full rounded-full w-[100%]" />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between font-semibold text-slate-700 mb-1">
                      <span>Accuracy</span>
                      <span>4.9</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-teal-600 h-full rounded-full w-[98%]" />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between font-semibold text-slate-700 mb-1">
                      <span>Communication</span>
                      <span>5.0</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-teal-600 h-full rounded-full w-[100%]" />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between font-semibold text-slate-700 mb-1">
                      <span>Value for Money</span>
                      <span>4.9</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-teal-600 h-full rounded-full w-[98%]" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Review Cards List */}
              <div className="space-y-4">
                {reviews.length > 0 ? (
                  reviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-teal-600 text-white font-bold text-sm flex items-center justify-center overflow-hidden">
                            {rev.avatar ? (
                              <img src={rev.avatar} alt={rev.author} className="w-full h-full object-cover" />
                            ) : (
                              rev.author.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900 text-sm">{rev.author}</h4>
                            <span className="text-[11px] text-slate-400">{rev.location || "Verified Guest"}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${
                                i < rev.rating ? "text-amber-400 fill-amber-400" : "text-slate-200"
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      <p className="text-xs text-slate-700 leading-relaxed italic">
                        &ldquo;{rev.comment}&rdquo;
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="p-4 rounded-2xl bg-white border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-teal-600 text-white font-bold text-sm flex items-center justify-center">
                          A
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">Ananya Iyer</h4>
                          <span className="text-[11px] text-slate-400">Verified Traveler</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed italic">
                      &ldquo;Our family stay here was beyond magical. The peaceful grounds, attentive host, and clean rooms made our vacation unforgettable!&rdquo;
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* 7. HOST PROFILE SECTION (Reference: Property Owner / Manager Details) */}
            <div ref={hostRef} id="host" className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Users className="w-5 h-5 text-teal-600" />
                <span>Meet Your Property Host</span>
              </h2>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-gradient-to-r from-slate-50 to-teal-50/40 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-teal-700 text-white font-black text-xl flex items-center justify-center shadow-md">
                    {(property.contactDetails?.contactPerson || "H").charAt(0).toUpperCase()}
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                      <span>{property.contactDetails?.contactPerson || "Verified Host"}</span>
                      <ShieldCheck className="w-4 h-4 text-teal-600" />
                    </div>
                    <p className="text-xs text-slate-500">
                      Verified HolidayExpertz Host
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-teal-800 font-semibold pt-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Response time: Usually within an hour</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {property.contactDetails?.mobileNumber && (
                    <a
                      href={`tel:${property.contactDetails.mobileNumber}`}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call Host</span>
                    </a>
                  )}
                  {property.contactDetails?.email && (
                    <a
                      href={`mailto:${property.contactDetails.email}?subject=Booking Inquiry for ${encodeURIComponent(
                        property.name
                      )}`}
                      className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Email Host</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ════════ RIGHT COLUMN: Sticky Booking & Direct Inquiry Card ════════ */}
          <div className="lg:col-span-4 lg:sticky lg:top-28 space-y-4">
            <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xl space-y-5">
              {/* Pricing Header */}
              <div className="pb-4 border-b border-slate-100 flex items-baseline justify-between">
                <div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl sm:text-3xl font-black text-slate-900">
                      ₹{formattedPrice}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">/ night</span>
                  </div>
                  {formattedOriginalPrice && (
                    <span className="text-xs text-slate-400 line-through">
                      ₹{formattedOriginalPrice} original
                    </span>
                  )}
                </div>
                <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">
                  Best Rate
                </span>
              </div>

              {/* Mode Tabs: Book Stay vs Inquire */}
              <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setBookingMode("book")}
                  className={`flex-1 py-2 rounded-lg transition-all ${
                    bookingMode === "book"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Reserve Stay
                </button>
                <button
                  type="button"
                  onClick={() => setBookingMode("inquire")}
                  className={`flex-1 py-2 rounded-lg transition-all ${
                    bookingMode === "inquire"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Ask Question
                </button>
              </div>

              {/* ── TAB 1: INSTANT RESERVATION WORKFLOW ── */}
              {bookingMode === "book" ? (
                <form onSubmit={handleBookingSubmit} className="space-y-4">
                  {/* Date Pickers */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1 uppercase tracking-wider">
                        Check-In
                      </label>
                      <input
                        type="date"
                        required
                        value={checkInDate}
                        onChange={(e) => setCheckInDate(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-teal-600"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1 uppercase tracking-wider">
                        Check-Out
                      </label>
                      <input
                        type="date"
                        required
                        value={checkOutDate}
                        onChange={(e) => setCheckOutDate(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-teal-600"
                      />
                    </div>
                  </div>

                  {/* Guests Picker */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1 uppercase tracking-wider">
                      Guests
                    </label>
                    <select
                      value={selectedGuests}
                      onChange={(e) => setSelectedGuests(Number(e.target.value))}
                      aria-label="Number of guests"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-teal-600"
                    >
                      {Array.from({ length: property.capacity?.maxGuests || 4 }).map((_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {i + 1} Guest{i > 0 ? "s" : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Guest Contact Information */}
                  <div className="space-y-2 pt-1 border-t border-slate-100">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Lead Guest Information
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="Your Full Name *"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-teal-600"
                    />
                    <input
                      type="email"
                      required
                      placeholder="Email Address *"
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-teal-600"
                    />
                    <input
                      type="tel"
                      placeholder="Phone / WhatsApp Number"
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-teal-600"
                    />
                    <input
                      type="text"
                      placeholder="Special Requests (Optional)"
                      value={specialRequests}
                      onChange={(e) => setSpecialRequests(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-teal-600"
                    />
                  </div>

                  {/* Live Transparent Price Breakdown */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-2 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>
                        ₹{formattedPrice} x {priceSummary.nights} night{priceSummary.nights === 1 ? "" : "s"}
                      </span>
                      <span className="font-semibold text-slate-900">
                        ₹{new Intl.NumberFormat("en-IN").format(priceSummary.baseAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Cleaning & Sanitization</span>
                      <span className="font-semibold text-slate-900">
                        ₹{new Intl.NumberFormat("en-IN").format(priceSummary.cleaningFee)}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Estimated Taxes & GST (12%)</span>
                      <span className="font-semibold text-slate-900">
                        ₹{new Intl.NumberFormat("en-IN").format(priceSummary.taxes)}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-sm text-slate-900">
                      <span>Estimated Total</span>
                      <span className="text-teal-700">
                        ₹{new Intl.NumberFormat("en-IN").format(priceSummary.totalAmount)}
                      </span>
                    </div>
                  </div>

                  {/* Error Message */}
                  {bookingError && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                      {bookingError}
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmittingBooking || !guestName || !guestEmail}
                    className="w-full py-3.5 px-4 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-teal-600/20 transition-all active:scale-98"
                  >
                    {isSubmittingBooking ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Verifying & Reserving...</span>
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4" />
                        <span>Confirm Reservation</span>
                      </>
                    )}
                  </button>

                  <p className="text-[10px] text-center text-slate-400">
                    Best Rate Guarantee • Instant Confirmation
                  </p>
                </form>
              ) : (
                /* ── TAB 2: INQUIRY / CONTACT HOST WORKFLOW ── */
                <form onSubmit={handleInquirySubmit} className="space-y-3.5">
                  {inquirySuccess ? (
                    <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <h4 className="text-sm font-bold text-emerald-950">Inquiry Sent to Host!</h4>
                      <p className="text-xs text-emerald-800 leading-relaxed">
                        The host ({property.contactDetails?.contactPerson || "Host"}) will contact you via email or phone.
                      </p>
                      <button
                        type="button"
                        onClick={() => setInquirySuccess(false)}
                        className="text-xs text-emerald-700 font-bold underline"
                      >
                        Send another inquiry
                      </button>
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-1 uppercase tracking-wider">
                          Your Full Name *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. John Doe"
                          value={inquiryName}
                          onChange={(e) => setInquiryName(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-teal-600"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-1 uppercase tracking-wider">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          required
                          placeholder="you@example.com"
                          value={inquiryEmail}
                          onChange={(e) => setInquiryEmail(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-teal-600"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-1 uppercase tracking-wider">
                          Mobile / WhatsApp
                        </label>
                        <input
                          type="tel"
                          placeholder="+91 98765 43210"
                          value={inquiryPhone}
                          onChange={(e) => setInquiryPhone(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-teal-600"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-1 uppercase tracking-wider">
                          Your Message to Host
                        </label>
                        <textarea
                          rows={3}
                          placeholder="Questions about arrival times, amenities, or special arrangements..."
                          value={inquiryMessage}
                          onChange={(e) => setInquiryMessage(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-teal-600 resize-none"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmittingInquiry || !inquiryName || !inquiryEmail}
                        className="w-full py-3.5 px-4 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all active:scale-98"
                      >
                        {isSubmittingInquiry ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Sending Question...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            <span>Send Inquiry</span>
                          </>
                        )}
                      </button>
                    </>
                  )}
                </form>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* ── Mobile Sticky Bottom Action Bar ── */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 p-3.5 flex items-center justify-between shadow-2xl">
        <div>
          <div className="flex items-baseline gap-1">
            <span className="text-base font-black text-slate-900">₹{formattedPrice}</span>
            <span className="text-[11px] text-slate-500">/ night</span>
          </div>
          <span className="text-[10px] text-emerald-700 font-bold">0% Booking Fees</span>
        </div>
        <button
          type="button"
          onClick={() => {
            if (ratesRef.current) {
              const top = ratesRef.current.getBoundingClientRect().top + window.scrollY - 130;
              window.scrollTo({ top, behavior: "smooth" });
            }
          }}
          className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-md"
        >
          Check Rates & Reserve
        </button>
      </div>

      {/* ── Confirmed Booking Receipt Modal ── */}
      {confirmedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="text-center space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                Reservation Confirmed
              </span>
              <h3 className="text-xl font-black text-slate-900 pt-1">
                You&apos;re All Set for Your Stay!
              </h3>
              <p className="text-xs text-slate-500">
                A booking confirmation email has been dispatched to {confirmedBooking.customerEmail}.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-200/80">
                <span className="text-slate-500">Booking Reference</span>
                <span className="font-mono font-bold text-slate-900">
                  {confirmedBooking.bookingReference}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/80">
                <span className="text-slate-500">Property</span>
                <span className="font-bold text-slate-900 truncate max-w-[200px]">
                  {confirmedBooking.propertyName}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/80">
                <span className="text-slate-500">Dates</span>
                <span className="font-semibold text-slate-800">
                  {confirmedBooking.checkInDate} → {confirmedBooking.checkOutDate}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/80">
                <span className="text-slate-500">Guests</span>
                <span className="font-semibold text-slate-800">
                  {confirmedBooking.guests} Registered Guest(s)
                </span>
              </div>
              <div className="flex justify-between pt-1 font-bold text-sm">
                <span className="text-slate-900">Total Amount Paid</span>
                <span className="text-teal-700">
                  ₹{new Intl.NumberFormat("en-IN").format(confirmedBooking.totalAmount)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4 text-slate-500" />
                <span>Print Receipt</span>
              </button>
              <button
                type="button"
                onClick={() => setConfirmedBooking(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Write Review Modal ── */}
      {reviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Write a Guest Review</h3>
              <button
                type="button"
                onClick={() => setReviewModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Your Rating</label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewReviewRating(star)}
                      className="p-1 text-amber-400 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= newReviewRating
                            ? "fill-amber-400 text-amber-400"
                            : "text-slate-300"
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-slate-700 ml-2">
                    {newReviewRating} of 5 Stars
                  </span>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Your Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Priya Sharma"
                  value={newReviewAuthor}
                  onChange={(e) => setNewReviewAuthor(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-600"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Your City / Location</label>
                <input
                  type="text"
                  placeholder="e.g. New Delhi, India"
                  value={newReviewLocation}
                  onChange={(e) => setNewReviewLocation(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-600"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Your Experience / Feedback *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Share details of your stay, views, hospitality, and comfort..."
                  value={newReviewComment}
                  onChange={(e) => setNewReviewComment(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-600 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReviewModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReview || !newReviewAuthor || !newReviewComment}
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold transition-all shadow-md"
                >
                  {isSubmittingReview ? "Submitting..." : "Post Review"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Fullscreen Interactive Photo Gallery Modal ── */}
      {galleryOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col p-4 animate-in fade-in duration-200">
          {/* Modal Header Bar */}
          <div className="flex items-center justify-between text-white pb-3 border-b border-slate-800">
            <span className="text-xs font-semibold text-slate-400">
              Photo {activePhotoIndex + 1} of {allImages.length}
            </span>
            <button
              type="button"
              onClick={() => setGalleryOpen(false)}
              className="p-1.5 rounded-full hover:bg-slate-800 text-slate-300 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Active Image Viewer */}
          <div className="flex-1 relative flex items-center justify-center my-4 overflow-hidden">
            <div className="relative w-full h-full max-h-[80vh]">
              <Image
                src={allImages[activePhotoIndex]?.url || coverImage}
                alt={allImages[activePhotoIndex]?.caption || property.name}
                fill
                sizes="100vw"
                className="object-contain"
              />
            </div>

            {/* Next / Previous Controls */}
            {allImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrevPhoto}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white flex items-center justify-center shadow-lg transition-transform active:scale-95"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  type="button"
                  onClick={handleNextPhoto}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white flex items-center justify-center shadow-lg transition-transform active:scale-95"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>

          {/* Thumbnails Strip */}
          <div className="flex items-center justify-center gap-2 overflow-x-auto py-2">
            {allImages.map((img, i) => (
              <button
                key={img.id || i}
                type="button"
                onClick={() => setActivePhotoIndex(i)}
                className={`relative w-16 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                  activePhotoIndex === i
                    ? "border-teal-500 scale-105"
                    : "border-transparent opacity-60 hover:opacity-100"
                }`}
              >
                <Image src={img.url} alt="thumbnail" fill sizes="64px" className="object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

export default function PropertyDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 space-y-4">
          <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-600">Loading vacation rental...</p>
        </div>
      }
    >
      <PropertyDetailContent />
    </Suspense>
  );
}
