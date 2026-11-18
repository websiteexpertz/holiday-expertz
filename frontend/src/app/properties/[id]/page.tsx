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
import { formatPrice } from "@/lib/currency";
import {
  MapPin,
  Users,
  Bed,
  Bath,
  Clock,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
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
  hasDates: boolean;
  nights: number;
  nightlyRate: number;
  baseAmount: number;
  activitiesAmount: number;
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
  const [selectedActivityIds, setSelectedActivityIds] = useState<string[]>([]);

  const toggleActivity = (actId: string) => {
    setSelectedActivityIds((prev) =>
      prev.includes(actId) ? prev.filter((id) => id !== actId) : [...prev, actId]
    );
  };

  // Unified Property Inquiry Form State
  const [inquiryName, setInquiryName] = useState("");
  const [inquiryEmail, setInquiryEmail] = useState("");
  const [inquiryPhone, setInquiryPhone] = useState("");
  const [inquiryMessage, setInquiryMessage] = useState("");
  const [isSubmittingInquiry, setIsSubmittingInquiry] = useState(false);
  const [inquirySuccess, setInquirySuccess] = useState(false);
  const [inquiryError, setInquiryError] = useState("");

  const todayString = useMemo(() => new Date().toISOString().split("T")[0], []);

  // Detect whether selected dates overlap with host's already reserved windows
  const isDateRangeConflicted = useMemo(() => {
    if (!checkInDate || !checkOutDate) return false;
    const start = new Date(checkInDate).getTime();
    const end = new Date(checkOutDate).getTime();
    return bookedRanges.some((range) => {
      const rStart = new Date(range.checkInDate).getTime();
      const rEnd = new Date(range.checkOutDate).getTime();
      return start < rEnd && end > rStart;
    });
  }, [checkInDate, checkOutDate, bookedRanges]);

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
        const adminToken = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
        const headers: Record<string, string> = {};
        if (adminToken) {
          headers["Authorization"] = `Bearer ${adminToken}`;
        }
        const res = await fetch(apiUrl(`/api/public/properties/${propertyId}`), {
          headers,
          credentials: "include",
        });
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

  const getNightlyRateForDate = (dateStr: string): number => {
    if (!property?.pricing) return 0;
    const {
      pricePerNight = 0,
      weekdayRate,
      weekendRate,
      weekendDays = [5, 6],
      seasonalRates = [],
      specialDateRates = [],
    } = property.pricing;

    // 1. Special date rule
    const special = specialDateRates.find((s) => dateStr >= s.startDate && dateStr <= (s.endDate || s.startDate));
    if (special && Number(special.nightlyRate) > 0) return Number(special.nightlyRate);

    // 2. Seasonal pricing rule
    const seasonal = seasonalRates.find((s) => dateStr >= s.startDate && dateStr <= s.endDate);
    if (seasonal && Number(seasonal.nightlyRate) > 0) return Number(seasonal.nightlyRate);

    // 3. Day of week rule
    const d = new Date(dateStr + "T00:00:00");
    const dayOfWeek = d.getDay();
    const effectiveWeekday = weekdayRate !== undefined && Number(weekdayRate) > 0 ? Number(weekdayRate) : Number(pricePerNight);
    const effectiveWeekend = weekendRate !== undefined && Number(weekendRate) > 0 ? Number(weekendRate) : effectiveWeekday;

    if (weekendDays.includes(dayOfWeek)) {
      return effectiveWeekend;
    }
    return effectiveWeekday;
  };

  const calculatePriceSummary = (): PriceSummary => {
    const basePrice = Number(property?.pricing?.pricePerNight) || 0;
    if (!checkInDate || !checkOutDate) {
      return {
        hasDates: false,
        nights: 1,
        nightlyRate: basePrice,
        baseAmount: basePrice,
        activitiesAmount: 0,
        cleaningFee: Math.round(basePrice * 0.05),
        taxes: Math.round(basePrice * 0.12),
        totalAmount: Math.round(basePrice * 1.17),
      };
    }

    const start = new Date(checkInDate + "T00:00:00");
    const end = new Date(checkOutDate + "T00:00:00");
    const diffNights = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));

    let accommodationSubtotal = 0;
    const curr = new Date(start);
    for (let i = 0; i < diffNights; i++) {
      const yyyy = curr.getFullYear();
      const mm = String(curr.getMonth() + 1).padStart(2, "0");
      const dd = String(curr.getDate()).padStart(2, "0");
      const dateStr = `${yyyy}-${mm}-${dd}`;
      accommodationSubtotal += getNightlyRateForDate(dateStr);
      curr.setDate(curr.getDate() + 1);
    }

    // Selected activities calculation
    const paidActivities = property?.pricing?.paidActivities || [];
    let activitiesTotal = 0;
    selectedActivityIds.forEach((actId) => {
      const act = paidActivities.find((a) => a.id === actId);
      if (act) {
        if (act.chargeType === "PER_PERSON") {
          activitiesTotal += Number(act.price) * selectedGuests;
        } else {
          activitiesTotal += Number(act.price);
        }
      }
    });

    const avgNightly = Math.round(accommodationSubtotal / diffNights);
    const cleaningFee = Math.round(avgNightly * 0.05);
    const taxes = Math.round((accommodationSubtotal + activitiesTotal) * 0.12);
    const totalAmount = accommodationSubtotal + activitiesTotal + cleaningFee + taxes;

    return {
      hasDates: true,
      nights: diffNights,
      nightlyRate: avgNightly,
      baseAmount: accommodationSubtotal,
      activitiesAmount: activitiesTotal,
      cleaningFee,
      taxes,
      totalAmount,
    };
  };

  const priceSummary = calculatePriceSummary();

  // Handle Calendar Day Click — Two-Way Synchronized with Inquiry Form
  const handleCalendarDayClick = (dateStr: string) => {
    if (!checkInDate || (checkInDate && checkOutDate)) {
      setCheckInDate(dateStr);
      setCheckOutDate("");
    } else if (checkInDate && !checkOutDate) {
      if (new Date(dateStr) <= new Date(checkInDate)) {
        setCheckInDate(dateStr);
        setCheckOutDate("");
      } else {
        setCheckOutDate(dateStr);
      }
    }
  };

  // Property Inquiry Form Submission
  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInquiryError("");

    if (!checkInDate || !checkOutDate) {
      setInquiryError("Please select both Check-In and Check-Out dates.");
      return;
    }

    if (checkInDate < todayString) {
      setInquiryError("Check-In date cannot be in the past.");
      return;
    }

    if (checkOutDate <= checkInDate) {
      setInquiryError("Check-Out date must be later than Check-In date.");
      return;
    }

    if (!inquiryName.trim()) {
      setInquiryError("Your full name is required.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!inquiryEmail.trim() || !emailRegex.test(inquiryEmail.trim())) {
      setInquiryError("Please provide a valid email address.");
      return;
    }

    const maxAllowedGuests = property?.capacity?.maxGuests || 20;
    if (selectedGuests < 1 || selectedGuests > maxAllowedGuests) {
      setInquiryError(`Guest count must be between 1 and ${maxAllowedGuests}.`);
      return;
    }

    try {
      setIsSubmittingInquiry(true);
      const res = await fetch(apiUrl("/api/public/inquiries"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: property?.id,
          relatedPropertyId: property?.id,
          propertyName: property?.name,
          name: inquiryName.trim(),
          email: inquiryEmail.trim().toLowerCase(),
          phone: inquiryPhone.trim(),
          checkInDate,
          checkOutDate,
          guestCount: selectedGuests,
          message: inquiryMessage.trim(),
          type: "property_inquiry",
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setInquirySuccess(true);
        setInquiryError("");
      } else {
        setInquiryError(data.message || "Failed to submit inquiry. Please try again.");
      }
    } catch (err) {
      console.error("Error submitting inquiry:", err);
      setInquiryError("Unable to submit inquiry. Please check your internet connection and try again.");
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

  const formattedPrice = formatPrice(property.pricing?.pricePerNight, {
    currency: property.pricing?.currency || "USD",
  });

  const formattedOriginalPrice = property.pricing?.originalPrice
    ? formatPrice(property.pricing.originalPrice, {
        currency: property.pricing?.currency || "USD",
      })
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
        {/* Super Admin Preview Banner */}
        {property.status !== "approved" && (
          <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-amber-950 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-800 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-amber-900">
                    Super Admin Preview Mode
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase bg-amber-200 text-amber-900 border border-amber-300">
                    {property.status.replace("_", " ")}
                  </span>
                </div>
                <p className="text-xs text-amber-900/80 mt-0.5">
                  This listing is unpublished and hidden from ordinary visitors. Public booking actions are disabled in preview.
                </p>
              </div>
            </div>
            <Link
              href="/admin/properties"
              className="text-xs font-bold px-3.5 py-2 rounded-xl bg-amber-600 text-white hover:bg-amber-700 transition-colors shadow-xs whitespace-nowrap"
            >
              Return to Admin
            </Link>
          </div>
        )}

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

                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="px-3 py-1 rounded-xl bg-teal-50 text-teal-800 border border-teal-200/80 font-bold text-xs">
                    {property.propertyType}
                  </span>
                  {property.propertySize && Number(property.propertySize) > 0 && (
                    <span className="px-3 py-1 rounded-xl bg-slate-100 text-slate-800 border border-slate-200 font-semibold text-xs flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-teal-600" />
                      <span>
                        {Number(property.propertySize).toLocaleString()} {property.propertySizeUnit || "sq. ft."}
                      </span>
                    </span>
                  )}
                </div>

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

              {/* Optional Experiences & Activities */}
              {property.pricing?.paidActivities && property.pricing.paidActivities.length > 0 && (
                <div className="pt-6 border-t border-slate-100 space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-teal-600" />
                      <span>Optional Experiences & Activities</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Enhance your stay with additional experiences and services available at this property.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {property.pricing.paidActivities.map((act) => {
                      const chargeLabel =
                        act.chargeType === "PER_PERSON"
                          ? "/ person"
                          : act.chargeType === "PER_TRIP"
                          ? "/ trip"
                          : act.chargeType === "PER_SESSION"
                          ? "/ session"
                          : "/ booking";

                      return (
                        <div
                          key={act.id}
                          className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-teal-50/20 border border-slate-200/90 flex items-center justify-between gap-3 shadow-xs hover:border-teal-300 transition-colors"
                        >
                          <div className="space-y-0.5 min-w-0">
                            <span className="font-bold text-slate-900 text-xs sm:text-sm block truncate">
                              {act.name}
                            </span>
                            <span className="text-[11px] text-teal-700 font-semibold inline-block">
                              Optional Add-on
                            </span>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="font-black text-slate-900 text-sm">
                              {formatPrice(act.price, { currency: property.pricing?.currency || "USD" })}
                            </div>
                            <span className="text-[10px] text-slate-500 font-medium">
                              {chargeLabel}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 3. RATES & POLICIES SECTION (Reference: Rates & Additional Rate Information) */}
            <div ref={ratesRef} id="rates" className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-teal-600" />
                    <span>Rates & Pricing Information</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Clear, transparent rate breakdown, seasonal rules, and booking terms
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
                      <th className="p-3.5">Rate Tier / Rule</th>
                      <th className="p-3.5">Schedule / Period</th>
                      <th className="p-3.5">Rate (USD)</th>
                      <th className="p-3.5">Basis</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {/* Minimum Starting Price */}
                    <tr className="hover:bg-slate-50/80">
                      <td className="p-3.5 font-bold text-slate-900">Minimum Starting Price</td>
                      <td className="p-3.5 text-slate-600">Base Entry Price</td>
                      <td className="p-3.5 font-extrabold text-teal-700">{formattedPrice}</td>
                      <td className="p-3.5 text-slate-600">Starting Price</td>
                    </tr>

                    {/* Weekday Rate */}
                    <tr className="hover:bg-slate-50/80">
                      <td className="p-3.5 font-bold text-slate-900">Weekday Nightly Rate</td>
                      <td className="p-3.5 text-slate-600">Standard Weekdays</td>
                      <td className="p-3.5 font-extrabold text-slate-900">
                        {formatPrice(
                          property.pricing?.weekdayRate !== undefined && Number(property.pricing.weekdayRate) > 0
                            ? property.pricing.weekdayRate
                            : property.pricing?.pricePerNight,
                          { currency: property.pricing?.currency || "USD" }
                        )} / night
                      </td>
                      <td className="p-3.5 text-slate-600">Per Night</td>
                    </tr>

                    {/* Weekend Rate */}
                    <tr className="hover:bg-slate-50/80">
                      <td className="p-3.5 font-bold text-slate-900">Weekend Nightly Rate</td>
                      <td className="p-3.5 text-slate-600">
                        {(property.pricing?.weekendDays || [5, 6])
                          .map((d) => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d])
                          .join(" & ")}
                      </td>
                      <td className="p-3.5 font-extrabold text-slate-900">
                        {formatPrice(
                          property.pricing?.weekendRate !== undefined && Number(property.pricing.weekendRate) > 0
                            ? property.pricing.weekendRate
                            : (property.pricing?.weekdayRate || property.pricing?.pricePerNight),
                          { currency: property.pricing?.currency || "USD" }
                        )} / night
                      </td>
                      <td className="p-3.5 text-slate-600">Per Night</td>
                    </tr>

                    {/* Seasonal Rules */}
                    {property.pricing?.seasonalRates &&
                      property.pricing.seasonalRates.map((season) => (
                        <tr key={season.id} className="hover:bg-slate-50/80 bg-teal-50/20">
                          <td className="p-3.5 font-bold text-teal-950 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                            <span>{season.name}</span>
                          </td>
                          <td className="p-3.5 text-slate-700 font-mono text-[11px]">
                            {season.startDate} to {season.endDate}
                          </td>
                          <td className="p-3.5 font-extrabold text-teal-700">
                            {formatPrice(season.nightlyRate, { currency: property.pricing?.currency || "USD" })} / night
                          </td>
                          <td className="p-3.5 text-teal-800 font-semibold text-[11px]">Seasonal Override</td>
                        </tr>
                      ))}

                    {/* Special Date Rules */}
                    {property.pricing?.specialDateRates &&
                      property.pricing.specialDateRates.map((sp) => (
                        <tr key={sp.id} className="hover:bg-slate-50/80 bg-amber-50/20">
                          <td className="p-3.5 font-bold text-amber-950 flex items-center gap-1.5">
                            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                            <span>{sp.name}</span>
                          </td>
                          <td className="p-3.5 text-slate-700 font-mono text-[11px]">
                            {sp.startDate} {sp.endDate && sp.endDate !== sp.startDate ? `to ${sp.endDate}` : ""}
                          </td>
                          <td className="p-3.5 font-extrabold text-amber-700">
                            {formatPrice(sp.nightlyRate, { currency: property.pricing?.currency || "USD" })} / night
                          </td>
                          <td className="p-3.5 text-amber-800 font-semibold text-[11px]">Holiday / Special Rate</td>
                        </tr>
                      ))}

                    {/* Original Published Comparison Price */}
                    {property.pricing?.originalPrice &&
                      Number(property.pricing.originalPrice) > Number(property.pricing.pricePerNight) && (
                        <tr className="hover:bg-slate-50/80">
                          <td className="p-3.5 font-bold text-slate-500">Standard Published Rate</td>
                          <td className="p-3.5 text-slate-500">Regular Portal Price</td>
                          <td className="p-3.5 text-slate-400 line-through">
                            {formattedOriginalPrice}
                          </td>
                          <td className="p-3.5 text-slate-500">Reference</td>
                        </tr>
                      )}
                  </tbody>
                </table>
              </div>

              {/* ── PROPERTY POLICIES (Approved 4-Card 2x2 Layout) ── */}
              <div className="pt-6 border-t border-slate-100 space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-teal-600" />
                    <span>Property Policies</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Essential house rules, cancellation guidelines, and contractual terms for your stay
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Card 1 — General Policy */}
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 shadow-xs space-y-2">
                    <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                      <div className="w-7 h-7 rounded-lg bg-teal-600/10 text-teal-600 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <h4>General Policy & House Rules</h4>
                    </div>
                    <div className="text-xs text-slate-600 leading-relaxed whitespace-pre-line pt-1">
                      {property.policies?.generalPolicy?.trim() ||
                        "Standard quiet hours apply between 22:00 and 07:00. Parties and unauthorized events are strictly prohibited on premises."}
                    </div>
                  </div>

                  {/* Card 2 — Refund & Cancellation Policy */}
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 shadow-xs space-y-2">
                    <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                      <div className="w-7 h-7 rounded-lg bg-teal-600/10 text-teal-600 flex items-center justify-center shrink-0">
                        <Clock className="w-4 h-4" />
                      </div>
                      <h4>Refund & Cancellation Policy</h4>
                    </div>
                    <div className="text-xs text-slate-600 leading-relaxed whitespace-pre-line pt-1">
                      {property.policies?.refundPolicy?.trim() ||
                        "Full refund up to 14 days before check-in. 50% refund between 7 to 14 days. Non-refundable within 7 days of scheduled arrival."}
                    </div>
                  </div>

                  {/* Card 3 — Contract Policy */}
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 shadow-xs space-y-2">
                    <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                      <div className="w-7 h-7 rounded-lg bg-teal-600/10 text-teal-600 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <h4>Contract Policy & Obligations</h4>
                    </div>
                    <div className="text-xs text-slate-600 leading-relaxed whitespace-pre-line pt-1">
                      {property.policies?.contractPolicy?.trim() ||
                        "Guests agree to treat the home with care and comply with local municipal ordinances. Primary guest must be at least 18 years of age with valid government photo ID."}
                    </div>
                  </div>

                  {/* Card 4 — Additional Notes */}
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 shadow-xs space-y-2">
                    <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                      <div className="w-7 h-7 rounded-lg bg-teal-600/10 text-teal-600 flex items-center justify-center shrink-0">
                        <Info className="w-4 h-4" />
                      </div>
                      <h4>Additional Notes & Special Rules</h4>
                    </div>
                    <div className="text-xs text-slate-600 leading-relaxed whitespace-pre-line pt-1">
                      {property.policies?.additionalNotes?.trim() ||
                        "Pre-arrival verification and estimated arrival time required. Check-in is handled in-person by the property concierge or host."}
                    </div>
                  </div>
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
                            ${Math.round(getNightlyRateForDate(dateStr))}
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

                      {rev.title && (
                        <h5 className="font-bold text-slate-900 text-xs pt-0.5">
                          {rev.title}
                        </h5>
                      )}
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
            <div ref={hostRef} id="host" className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-5">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Users className="w-5 h-5 text-teal-600" />
                <span>Meet Your Property Host</span>
              </h2>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-gradient-to-r from-slate-50 to-teal-50/40 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-4">
                  {property.owner?.profileImage || property.owner?.avatar ? (
                    <img
                      src={property.owner.profileImage || property.owner.avatar}
                      alt={property.owner.fullName || "Property Host"}
                      className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shadow-md shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-teal-700 text-white font-black text-xl flex items-center justify-center shadow-md shrink-0">
                      {(property.owner?.fullName || property.contactDetails?.contactPerson || "H").charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="space-y-0.5">
                    <div className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                      <span>{property.owner?.fullName || property.contactDetails?.contactPerson || "Verified Host"}</span>
                      <ShieldCheck className="w-4 h-4 text-teal-600" />
                    </div>
                    <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500">
                      <span>Verified HolidayExpertz Host</span>
                      {(property.owner?.ownerNumber || property.ownerNumber) && (
                        <span className="font-mono text-teal-700 font-bold bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200 text-[10px]">
                          {property.owner?.ownerNumber || property.ownerNumber}
                        </span>
                      )}
                    </div>
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

              {/* About the Host Biography */}
              {property.owner?.aboutOwner && (
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    About the Host
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                    {property.owner.aboutOwner}
                  </p>
                </div>
              )}

              {/* Languages Spoken */}
              {property.owner?.languagesSpoken && property.owner.languagesSpoken.length > 0 && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Languages Spoken
                  </h3>
                  <div className="flex items-center gap-2 flex-wrap">
                    {property.owner.languagesSpoken.map((lang, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs font-semibold shadow-2xs"
                      >
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ════════ RIGHT COLUMN: Sticky Direct Property Inquiry Card ════════ */}
          <div id="inquiry-card" className="lg:col-span-4 lg:sticky lg:top-28 space-y-4">
            <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xl space-y-5">
              {/* Pricing Header */}
              <div className="pb-4 border-b border-slate-100 flex items-baseline justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Starting From
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-black text-slate-900">
                      {formattedPrice}
                    </span>
                    {formattedOriginalPrice && (
                      <span className="text-xs text-slate-400 line-through">
                        {formattedOriginalPrice} original
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">
                  Best Rate
                </span>
              </div>

              {/* Form Heading & Subtitle */}
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                  Ask About This Property
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Interested in this property? Share your travel details and send your inquiry directly to the host.
                </p>
              </div>

              {/* Success Feedback Card */}
              {inquirySuccess ? (
                <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3 animate-in fade-in">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-emerald-950">Inquiry Sent Successfully</h4>
                  <p className="text-xs text-emerald-800 leading-relaxed">
                    Your inquiry has been submitted successfully. Our team will review your request and get back to you.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setInquirySuccess(false);
                      setInquiryMessage("");
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                  >
                    <span>Send Another Inquiry</span>
                  </button>
                </div>
              ) : (
                /* ── ONE UNIFIED PROPERTY INQUIRY FORM ── */
                <form onSubmit={handleInquirySubmit} className="space-y-3.5">
                  {/* Field 1 & 2: Check-in and Check-out Dates */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1 uppercase tracking-wider">
                        Check-In *
                      </label>
                      <input
                        type="date"
                        required
                        min={todayString}
                        value={checkInDate}
                        onChange={(e) => {
                          setCheckInDate(e.target.value);
                          if (checkOutDate && e.target.value >= checkOutDate) {
                            setCheckOutDate("");
                          }
                        }}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-teal-600"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1 uppercase tracking-wider">
                        Check-Out *
                      </label>
                      <input
                        type="date"
                        required
                        min={checkInDate || todayString}
                        value={checkOutDate}
                        onChange={(e) => setCheckOutDate(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-teal-600"
                      />
                    </div>
                  </div>

                  {/* Reserved Date Conflict Advisory */}
                  {isDateRangeConflicted && (
                    <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <span>
                        Selected travel window includes reserved dates. Your inquiry will be forwarded to the host for custom arrangements.
                      </span>
                    </div>
                  )}

                  {/* Field 3: Number of Guests */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1 uppercase tracking-wider">
                      Number of Guests *
                    </label>
                    <select
                      value={selectedGuests}
                      onChange={(e) => setSelectedGuests(Number(e.target.value))}
                      aria-label="Number of Guests"
                      required
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-teal-600"
                    >
                      {Array.from({ length: property.capacity?.maxGuests || 4 }).map((_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {i + 1} Guest{i > 0 ? "s" : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Field 4: Your Full Name */}
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
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-teal-600 font-medium"
                    />
                  </div>

                  {/* Field 5: Email Address */}
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
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-teal-600 font-medium"
                    />
                  </div>

                  {/* Field 6: Mobile / WhatsApp (Optional) */}
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

                  {/* Field 7: Your Message to Host (Optional) */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1 uppercase tracking-wider">
                      Your Message to Host
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Questions about availability, amenities, or special arrangements..."
                      value={inquiryMessage}
                      onChange={(e) => setInquiryMessage(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-teal-600 resize-none leading-relaxed"
                    />
                  </div>

                  {/* Error Feedback */}
                  {inquiryError && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                      {inquiryError}
                    </div>
                  )}

                  {/* Field 8: Send Inquiry Button */}
                  <button
                    type="submit"
                    disabled={isSubmittingInquiry}
                    className="w-full py-3.5 px-4 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-teal-600/20 transition-all active:scale-98"
                  >
                    {isSubmittingInquiry ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Sending Inquiry...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Send Inquiry</span>
                      </>
                    )}
                  </button>

                  {/* Footnote */}
                  <p className="text-[11px] text-center text-slate-400 font-medium pt-1">
                    Inquiry only — sending this form does not confirm a reservation.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* ── Mobile Sticky Bottom Action Bar ── */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 p-3.5 flex items-center justify-between shadow-2xl">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Starting From
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-base font-black text-slate-900">{formattedPrice}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            const el = document.getElementById("inquiry-card");
            if (el) {
              const top = el.getBoundingClientRect().top + window.scrollY - 100;
              window.scrollTo({ top, behavior: "smooth" });
            }
          }}
          className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-md flex items-center gap-1.5"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Ask About Property</span>
        </button>
      </div>



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

            {/* Image Title / Caption Overlay */}
            {allImages[activePhotoIndex]?.caption && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-900/90 border border-slate-700/80 text-white text-xs px-4 py-1.5 rounded-full backdrop-blur-md shadow-xl z-20 font-medium">
                {allImages[activePhotoIndex].caption}
              </div>
            )}

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
