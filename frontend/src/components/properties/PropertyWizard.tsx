"use client";
import { apiUrl } from "@/lib/apiUrl";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { adminClient } from "@/lib/adminClient";
import { useAuth } from "@/context/AuthContext";
import { createPropertyApi, updatePropertyApi, fetchPropertyByIdApi } from "@/lib/propertyClient";
import PropertyLocationMapPicker from "@/components/common/PropertyLocationMapPicker";
import {
  PropertyTypeCategory,
  PropertyImage,
  SeasonalPricingRule,
  SpecialDatePricingRule,
  PaidActivity,
  PaidActivityChargeType,
  PropertyPolicies,
} from "@backend/types/property";
import { CountryRecord, StateRecord, CityRecord, AreaRecord, ReviewRecord } from "@backend/types/admin";
import { formatPrice } from "@/lib/currency";
import {
  Building2,
  MapPin,
  Camera,
  DollarSign,
  IndianRupee,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Upload,
  Trash2,
  Star,
  Users,
  Bed,
  Bath,
  Clock,
  Sparkles,
  AlertCircle,
  Plus,
  Loader2,
  ShieldCheck,
  Check,
  Globe,
  Home,
  User,
  Calendar,
  Sun,
  Moon,
  Tag,
  Edit2,
  ChevronDown,
  ChevronUp,
  FileText,
  Info,
  RotateCcw,
  MessageSquare,
  X,
} from "lucide-react";

const PROPERTY_TYPES: PropertyTypeCategory[] = [
  "Luxury Hotels",
  "Resorts",
  "Villas",
  "Homestays",
  "Palace Stays",
  "Boutique Stays",
  "Guesthouses",
  "Apartments",
];

const PREDEFINED_AMENITIES = [
  "Swimming Pool",
  "High-Speed Wi-Fi",
  "Air Conditioning",
  "Free Valet Parking",
  "Kitchen & Dining",
  "Ayurvedic Spa",
  "Butler Service",
  "Hot Water",
  "Bathtub",
  "Mountain View",
  "Lake View",
  "Private Garden",
  "Rooftop Terrace",
  "Daily Housekeeping",
  "In-house Chef",
  "Pet Friendly",
  "First Aid Kit",
  "24/7 Security",
  "Fire Extinguisher",
];

const SAMPLE_PHOTO_PRESETS = [
  {
    url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80",
    caption: "Courtyard & Swimming Pool",
  },
  {
    url: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80",
    caption: "Master Bedroom Suite",
  },
  {
    url: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80",
    caption: "Heritage Dining Pavilion",
  },
  {
    url: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80",
    caption: "Spa & Wellness Lounge",
  },
];

export interface PropertyWizardProps {
  role?: "admin" | "owner";
  propertyId?: string;
  onSuccessRedirect?: string;
}

export default function PropertyWizard({
  role = "admin",
  propertyId,
  onSuccessRedirect,
}: PropertyWizardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { owner } = useAuth();

  const queryOwnerId = searchParams.get("ownerId") || "";
  const editPropertyId = propertyId || searchParams.get("edit") || searchParams.get("id") || "";
  const isEditMode = Boolean(editPropertyId);
  const redirectUrl = onSuccessRedirect || (role === "owner" ? "/dashboard/properties" : "/admin/properties");
  const backUrl = role === "owner" ? "/dashboard/properties" : "/admin/properties";

  // Navigation steps
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingProperty, setIsLoadingProperty] = useState(false);
  const [loadedPropertyNumber, setLoadedPropertyNumber] = useState("");
  const [originalProperty, setOriginalProperty] = useState<any>(null);
  const [errorBanner, setErrorBanner] = useState("");
  const [successBanner, setSuccessBanner] = useState("");

  // Owners list
  const [owners, setOwners] = useState<any[]>([]);
  const [ownerMode, setOwnerMode] = useState<"admin_managed" | "existing_owner">("admin_managed");
  const [selectedOwnerId, setSelectedOwnerId] = useState<string>("");

  // Destination hierarchy
  const [countries, setCountries] = useState<CountryRecord[]>([]);
  const [states, setStates] = useState<StateRecord[]>([]);
  const [cities, setCities] = useState<CityRecord[]>([]);
  const [areas, setAreas] = useState<AreaRecord[]>([]);

  // Selected hierarchy IDs
  const [selectedCountryId, setSelectedCountryId] = useState("");
  const [selectedStateId, setSelectedStateId] = useState("");
  const [selectedCityId, setSelectedCityId] = useState("");
  const [selectedAreaId, setSelectedAreaId] = useState("");

  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [isBannerUploading, setIsBannerUploading] = useState(false);
  const [isDraggingBanner, setIsDraggingBanner] = useState(false);
  const [customAmenity, setCustomAmenity] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerFileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    propertyType: "Luxury Hotels" as PropertyTypeCategory,
    shortDescription: "",
    detailedDescription: "",
    propertySize: "" as number | string,
    propertySizeUnit: "Square Feet (sq ft)",
    address: "",
    locality: "",
    postalCode: "",
    latitude: 28.6139,
    longitude: 77.209,
    hasConfirmedLocation: false,
    pricePerNight: 250,
    originalPrice: 300 as number | undefined,
    weekdayRate: "" as number | string,
    weekendRate: "" as number | string,
    weekendDays: [5, 6] as number[],
    seasonalRates: [] as SeasonalPricingRule[],
    specialDateRates: [] as SpecialDatePricingRule[],
    paidActivities: [] as PaidActivity[],
    maxGuests: 4 as number | string,
    bedrooms: 2 as number | string,
    bathrooms: 2 as number | string,
    checkInTime: "14:00",
    checkOutTime: "11:00",
    amenities: ["Swimming Pool", "High-Speed Wi-Fi", "Air Conditioning", "Free Valet Parking", "Daily Housekeeping"],
    images: [] as PropertyImage[],
    policies: {
      generalPolicy: "",
      refundPolicy: "",
      contractPolicy: "",
      additionalNotes: "",
    } as PropertyPolicies,
    contactPerson: "",
    mobileNumber: "",
    email: "",
    featured: false,
    handpicked: false,
  });

  // Coordinate inputs state & validation
  const [latInput, setLatInput] = useState<string>("28.6139");
  const [lngInput, setLngInput] = useState<string>("77.209");
  const [coordErrors, setCoordErrors] = useState<{ latitude?: string; longitude?: string }>({});

  const validateCoordinateString = (
    val: string,
    type: "lat" | "lng"
  ): { isValid: boolean; error?: string; isComplete: boolean; num?: number } => {
    const trimmed = val.trim();
    if (!trimmed) {
      return {
        isValid: false,
        isComplete: false,
        error: `${type === "lat" ? "Latitude" : "Longitude"} is required`,
      };
    }
    // Allow intermediate typing (e.g. "-", "+", ".", "-.", "+.", or ends with ".")
    if (
      trimmed === "-" ||
      trimmed === "+" ||
      trimmed === "." ||
      trimmed === "-." ||
      trimmed === "+." ||
      (trimmed.endsWith(".") && !trimmed.slice(0, -1).includes("."))
    ) {
      return { isValid: true, isComplete: false };
    }
    // Valid numeric pattern
    if (!/^[+-]?\d+(\.\d+)?$/.test(trimmed)) {
      return {
        isValid: false,
        isComplete: true,
        error: `Please enter a valid numeric ${type === "lat" ? "latitude (e.g. 24.5854)" : "longitude (e.g. 73.7125)"}`,
      };
    }
    const num = Number(trimmed);
    if (!isFinite(num)) {
      return { isValid: false, isComplete: true, error: "Coordinate must be a finite number" };
    }
    if (type === "lat") {
      if (num < -90 || num > 90) {
        return { isValid: false, isComplete: true, error: "Latitude must be between -90 and 90" };
      }
    } else {
      if (num < -180 || num > 180) {
        return { isValid: false, isComplete: true, error: "Longitude must be between -180 and 180" };
      }
    }
    return { isValid: true, isComplete: true, num };
  };

  const handleLatitudeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLatInput(val);
    const result = validateCoordinateString(val, "lat");
    if (!result.isValid) {
      setCoordErrors((prev) => ({ ...prev, latitude: result.error }));
    } else {
      setCoordErrors((prev) => ({ ...prev, latitude: undefined }));
      if (result.isComplete && typeof result.num === "number") {
        setFormData((prev) => ({
          ...prev,
          latitude: result.num!,
          hasConfirmedLocation: true,
        }));
      }
    }
  };

  const handleLongitudeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLngInput(val);
    const result = validateCoordinateString(val, "lng");
    if (!result.isValid) {
      setCoordErrors((prev) => ({ ...prev, longitude: result.error }));
    } else {
      setCoordErrors((prev) => ({ ...prev, longitude: undefined }));
      if (result.isComplete && typeof result.num === "number") {
        setFormData((prev) => ({
          ...prev,
          longitude: result.num!,
          hasConfirmedLocation: true,
        }));
      }
    }
  };

  const handleLatitudeBlur = () => {
    const result = validateCoordinateString(latInput, "lat");
    if (!result.isValid) {
      setCoordErrors((prev) => ({ ...prev, latitude: result.error }));
    } else if (result.isComplete && typeof result.num === "number") {
      setLatInput(String(result.num));
      setCoordErrors((prev) => ({ ...prev, latitude: undefined }));
      setFormData((prev) => ({
        ...prev,
        latitude: result.num!,
        hasConfirmedLocation: true,
      }));
    } else {
      const cleaned = latInput.replace(/[^\d.-]/g, "").replace(/\.$/, "");
      const num = Number(cleaned);
      if (!isNaN(num) && num >= -90 && num <= 90) {
        setLatInput(String(num));
        setCoordErrors((prev) => ({ ...prev, latitude: undefined }));
        setFormData((prev) => ({ ...prev, latitude: num, hasConfirmedLocation: true }));
      } else {
        setCoordErrors((prev) => ({ ...prev, latitude: "Latitude must be between -90 and 90" }));
      }
    }
  };

  const handleLongitudeBlur = () => {
    const result = validateCoordinateString(lngInput, "lng");
    if (!result.isValid) {
      setCoordErrors((prev) => ({ ...prev, longitude: result.error }));
    } else if (result.isComplete && typeof result.num === "number") {
      setLngInput(String(result.num));
      setCoordErrors((prev) => ({ ...prev, longitude: undefined }));
      setFormData((prev) => ({
        ...prev,
        longitude: result.num!,
        hasConfirmedLocation: true,
      }));
    } else {
      const cleaned = lngInput.replace(/[^\d.-]/g, "").replace(/\.$/, "");
      const num = Number(cleaned);
      if (!isNaN(num) && num >= -180 && num <= 180) {
        setLngInput(String(num));
        setCoordErrors((prev) => ({ ...prev, longitude: undefined }));
        setFormData((prev) => ({ ...prev, longitude: num, hasConfirmedLocation: true }));
      } else {
        setCoordErrors((prev) => ({ ...prev, longitude: "Longitude must be between -180 and 180" }));
      }
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // ADVANCED PRICING MANAGEMENT STATE & HANDLERS
  // ─────────────────────────────────────────────────────────────────────────
  const [pricingActiveTab, setPricingActiveTab] = useState<"nightly" | "seasonal" | "activities">("nightly");

  // Seasonal Rule Form State
  const [newSeasonName, setNewSeasonName] = useState("");
  const [newSeasonStart, setNewSeasonStart] = useState("");
  const [newSeasonEnd, setNewSeasonEnd] = useState("");
  const [newSeasonRate, setNewSeasonRate] = useState<string | number>("");
  const [seasonFormError, setSeasonFormError] = useState("");
  const [editingSeasonId, setEditingSeasonId] = useState<string | null>(null);

  // Special Date Rule Form State
  const [newSpecialName, setNewSpecialName] = useState("");
  const [newSpecialStart, setNewSpecialStart] = useState("");
  const [newSpecialEnd, setNewSpecialEnd] = useState("");
  const [newSpecialRate, setNewSpecialRate] = useState<string | number>("");
  const [specialFormError, setSpecialFormError] = useState("");
  const [editingSpecialId, setEditingSpecialId] = useState<string | null>(null);

  // Paid Activity Form State
  const [newActivityName, setNewActivityName] = useState("");
  const [newActivityPrice, setNewActivityPrice] = useState<string | number>("");
  const [newActivityChargeType, setNewActivityChargeType] = useState<PaidActivityChargeType>("PER_BOOKING");
  const [activityFormError, setActivityFormError] = useState("");
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);

  // Interactive Pricing Calculator State
  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);
  const in3DaysStr = useMemo(() => new Date(Date.now() + 3 * 86400000).toISOString().split("T")[0], []);
  const [calcCheckIn, setCalcCheckIn] = useState<string>(todayStr);
  const [calcCheckOut, setCalcCheckOut] = useState<string>(in3DaysStr);
  const [calcGuests, setCalcGuests] = useState<number>(2);
  const [calcSelectedExtras, setCalcSelectedExtras] = useState<string[]>([]);
  const [calcShowNightlyBreakdown, setCalcShowNightlyBreakdown] = useState<boolean>(false);

  // Keep calculator guest count in sync with property max guests
  useEffect(() => {
    const max = Number(formData.maxGuests);
    if (max > 0 && calcGuests > max) {
      setCalcGuests(max);
    }
  }, [formData.maxGuests, calcGuests]);

  // ─────────────────────────────────────────────────────────────────────────
  // PROPERTY REVIEWS STATE & HANDLERS (Step 6)
  // ─────────────────────────────────────────────────────────────────────────
  const [reviews, setReviews] = useState<ReviewRecord[]>([]);
  const [newReviewAuthor, setNewReviewAuthor] = useState("");
  const [newReviewDate, setNewReviewDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewTitle, setNewReviewTitle] = useState("");
  const [newReviewComment, setNewReviewComment] = useState("");
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [reviewFormError, setReviewFormError] = useState("");
  const [reviewDeleteConfirmId, setReviewDeleteConfirmId] = useState<string | null>(null);

  const reviewSummary = useMemo(() => {
    const total = reviews.length;
    if (total === 0) {
      return { total: 0, average: "Not Rated", numAvg: 0 };
    }
    const sum = reviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
    const avg = Math.round((sum / total) * 10) / 10;
    return { total, average: `${avg.toFixed(1)} ★`, numAvg: avg };
  }, [reviews]);

  const handleSaveReview = (e: React.FormEvent) => {
    e.preventDefault();
    setReviewFormError("");

    if (!newReviewAuthor.trim()) {
      setReviewFormError("Guest / Reviewer Name is required.");
      return;
    }
    if (!newReviewDate.trim()) {
      setReviewFormError("Review Date is required.");
      return;
    }
    if (newReviewRating < 1 || newReviewRating > 5) {
      setReviewFormError("Please select a rating between 1 and 5 stars.");
      return;
    }
    if (!newReviewComment.trim()) {
      setReviewFormError("Guest Review feedback is required.");
      return;
    }

    if (editingReviewId) {
      setReviews((prev) =>
        prev.map((r) =>
          r.id === editingReviewId
            ? {
                ...r,
                author: newReviewAuthor.trim(),
                date: newReviewDate.trim(),
                rating: newReviewRating,
                title: newReviewTitle.trim() || undefined,
                comment: newReviewComment.trim(),
                updatedAt: new Date().toISOString(),
              }
            : r
        )
      );
      setEditingReviewId(null);
    } else {
      const newRev: ReviewRecord = {
        id: `rev_temp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        propertyId: editPropertyId || undefined,
        propertyName: formData.name || undefined,
        author: newReviewAuthor.trim(),
        date: newReviewDate.trim(),
        rating: newReviewRating,
        title: newReviewTitle.trim() || undefined,
        comment: newReviewComment.trim(),
        status: "approved",
        featured: false,
        source: "ADMIN_IMPORTED",
        verificationStatus: "UNVERIFIED",
        createdAt: new Date().toISOString(),
      };
      setReviews((prev) => [newRev, ...prev]);
    }

    // Reset form
    setNewReviewAuthor("");
    setNewReviewDate(new Date().toISOString().split("T")[0]);
    setNewReviewRating(5);
    setNewReviewTitle("");
    setNewReviewComment("");
    setReviewFormError("");
  };

  const handleStartEditReview = (rev: ReviewRecord) => {
    setEditingReviewId(rev.id);
    setNewReviewAuthor(rev.author || "");
    setNewReviewDate(rev.date || (rev.createdAt ? rev.createdAt.split("T")[0] : new Date().toISOString().split("T")[0]));
    setNewReviewRating(rev.rating || 5);
    setNewReviewTitle(rev.title || "");
    setNewReviewComment(rev.comment || "");
    setReviewFormError("");
  };

  const handleCancelEditReview = () => {
    setEditingReviewId(null);
    setNewReviewAuthor("");
    setNewReviewDate(new Date().toISOString().split("T")[0]);
    setNewReviewRating(5);
    setNewReviewTitle("");
    setNewReviewComment("");
    setReviewFormError("");
  };

  const handleDeleteReview = (id: string) => {
    setReviews((prev) => prev.filter((r) => r.id !== id));
    if (editingReviewId === id) {
      handleCancelEditReview();
    }
    setReviewDeleteConfirmId(null);
  };

  // Weekend days toggler
  const handleToggleWeekendDay = (dayIdx: number) => {
    setFormData((prev) => {
      const current = Array.isArray(prev.weekendDays) ? prev.weekendDays : [5, 6];
      const exists = current.includes(dayIdx);
      if (exists) {
        if (current.length === 1) return prev; // Keep at least one weekend day
        return { ...prev, weekendDays: current.filter((d) => d !== dayIdx) };
      } else {
        return { ...prev, weekendDays: [...current, dayIdx].sort((a, b) => a - b) };
      }
    });
  };

  // Seasonal Rule Handlers
  const handleSaveSeasonRule = (e: React.FormEvent) => {
    e.preventDefault();
    setSeasonFormError("");
    if (!newSeasonName.trim()) {
      setSeasonFormError("Season Name is required.");
      return;
    }
    if (!newSeasonStart || !newSeasonEnd) {
      setSeasonFormError("Both Start Date and End Date are required.");
      return;
    }
    if (newSeasonEnd < newSeasonStart) {
      setSeasonFormError("End Date cannot be earlier than Start Date.");
      return;
    }
    if (newSeasonRate === "" || Number(newSeasonRate) <= 0) {
      setSeasonFormError("Seasonal Nightly Rate must be greater than $0.");
      return;
    }

    const overlap = formData.seasonalRates.find(
      (s) =>
        s.id !== editingSeasonId &&
        ((newSeasonStart >= s.startDate && newSeasonStart <= s.endDate) ||
          (newSeasonEnd >= s.startDate && newSeasonEnd <= s.endDate) ||
          (newSeasonStart <= s.startDate && newSeasonEnd >= s.endDate))
    );
    if (overlap) {
      setSeasonFormError(`Dates overlap with existing season "${overlap.name}" (${overlap.startDate} to ${overlap.endDate}).`);
      return;
    }

    if (editingSeasonId) {
      setFormData((prev) => ({
        ...prev,
        seasonalRates: prev.seasonalRates.map((s) =>
          s.id === editingSeasonId
            ? {
                ...s,
                name: newSeasonName.trim(),
                startDate: newSeasonStart,
                endDate: newSeasonEnd,
                nightlyRate: Number(newSeasonRate),
              }
            : s
        ),
      }));
      setEditingSeasonId(null);
    } else {
      const newRule: SeasonalPricingRule = {
        id: `season_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: newSeasonName.trim(),
        startDate: newSeasonStart,
        endDate: newSeasonEnd,
        nightlyRate: Number(newSeasonRate),
      };
      setFormData((prev) => ({
        ...prev,
        seasonalRates: [...prev.seasonalRates, newRule],
      }));
    }

    setNewSeasonName("");
    setNewSeasonStart("");
    setNewSeasonEnd("");
    setNewSeasonRate("");
  };

  const handleEditSeasonRule = (rule: SeasonalPricingRule) => {
    setEditingSeasonId(rule.id);
    setNewSeasonName(rule.name);
    setNewSeasonStart(rule.startDate);
    setNewSeasonEnd(rule.endDate);
    setNewSeasonRate(rule.nightlyRate);
    setSeasonFormError("");
  };

  const handleDeleteSeasonRule = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      seasonalRates: prev.seasonalRates.filter((s) => s.id !== id),
    }));
    if (editingSeasonId === id) {
      setEditingSeasonId(null);
      setNewSeasonName("");
      setNewSeasonStart("");
      setNewSeasonEnd("");
      setNewSeasonRate("");
    }
  };

  // Special Date Rule Handlers
  const handleSaveSpecialDateRule = (e: React.FormEvent) => {
    e.preventDefault();
    setSpecialFormError("");
    if (!newSpecialName.trim()) {
      setSpecialFormError("Special Date Name is required.");
      return;
    }
    if (!newSpecialStart) {
      setSpecialFormError("Date is required.");
      return;
    }
    const finalEnd = newSpecialEnd || newSpecialStart;
    if (finalEnd < newSpecialStart) {
      setSpecialFormError("End Date cannot be earlier than Start Date.");
      return;
    }
    if (newSpecialRate === "" || Number(newSpecialRate) <= 0) {
      setSpecialFormError("Special Nightly Rate must be greater than $0.");
      return;
    }

    const overlap = formData.specialDateRates.find(
      (sp) =>
        sp.id !== editingSpecialId &&
        ((newSpecialStart >= sp.startDate && newSpecialStart <= (sp.endDate || sp.startDate)) ||
          (finalEnd >= sp.startDate && finalEnd <= (sp.endDate || sp.startDate)) ||
          (newSpecialStart <= sp.startDate && finalEnd >= (sp.endDate || sp.startDate)))
    );
    if (overlap) {
      setSpecialFormError(`Dates overlap with existing special date rule "${overlap.name}".`);
      return;
    }

    if (editingSpecialId) {
      setFormData((prev) => ({
        ...prev,
        specialDateRates: prev.specialDateRates.map((sp) =>
          sp.id === editingSpecialId
            ? {
                ...sp,
                name: newSpecialName.trim(),
                startDate: newSpecialStart,
                endDate: finalEnd,
                nightlyRate: Number(newSpecialRate),
              }
            : sp
        ),
      }));
      setEditingSpecialId(null);
    } else {
      const newRule: SpecialDatePricingRule = {
        id: `special_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: newSpecialName.trim(),
        startDate: newSpecialStart,
        endDate: finalEnd,
        nightlyRate: Number(newSpecialRate),
      };
      setFormData((prev) => ({
        ...prev,
        specialDateRates: [...prev.specialDateRates, newRule],
      }));
    }

    setNewSpecialName("");
    setNewSpecialStart("");
    setNewSpecialEnd("");
    setNewSpecialRate("");
  };

  const handleEditSpecialDateRule = (rule: SpecialDatePricingRule) => {
    setEditingSpecialId(rule.id);
    setNewSpecialName(rule.name);
    setNewSpecialStart(rule.startDate);
    setNewSpecialEnd(rule.endDate || rule.startDate);
    setNewSpecialRate(rule.nightlyRate);
    setSpecialFormError("");
  };

  const handleDeleteSpecialDateRule = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      specialDateRates: prev.specialDateRates.filter((sp) => sp.id !== id),
    }));
    if (editingSpecialId === id) {
      setEditingSpecialId(null);
      setNewSpecialName("");
      setNewSpecialStart("");
      setNewSpecialEnd("");
      setNewSpecialRate("");
    }
  };

  // Paid Activity Handlers
  const handleSaveActivity = (e: React.FormEvent) => {
    e.preventDefault();
    setActivityFormError("");
    if (!newActivityName.trim()) {
      setActivityFormError("Activity Name is required.");
      return;
    }
    if (newActivityPrice === "" || Number(newActivityPrice) < 0) {
      setActivityFormError("Price must be a valid non-negative amount ($0 or more).");
      return;
    }

    if (editingActivityId) {
      setFormData((prev) => ({
        ...prev,
        paidActivities: prev.paidActivities.map((act) =>
          act.id === editingActivityId
            ? {
                ...act,
                name: newActivityName.trim(),
                price: Number(newActivityPrice),
                chargeType: newActivityChargeType,
              }
            : act
        ),
      }));
      setEditingActivityId(null);
    } else {
      const newAct: PaidActivity = {
        id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: newActivityName.trim(),
        price: Number(newActivityPrice),
        chargeType: newActivityChargeType,
      };
      setFormData((prev) => ({
        ...prev,
        paidActivities: [...prev.paidActivities, newAct],
      }));
    }

    setNewActivityName("");
    setNewActivityPrice("");
    setNewActivityChargeType("PER_BOOKING");
  };

  const handleEditActivity = (act: PaidActivity) => {
    setEditingActivityId(act.id);
    setNewActivityName(act.name);
    setNewActivityPrice(act.price);
    setNewActivityChargeType(act.chargeType);
    setActivityFormError("");
  };

  const handleDeleteActivity = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      paidActivities: prev.paidActivities.filter((act) => act.id !== id),
    }));
    setCalcSelectedExtras((prev) => prev.filter((actId) => actId !== id));
    if (editingActivityId === id) {
      setEditingActivityId(null);
      setNewActivityName("");
      setNewActivityPrice("");
      setNewActivityChargeType("PER_BOOKING");
    }
  };

  const handleToggleExtraInCalculator = (activityId: string) => {
    setCalcSelectedExtras((prev) =>
      prev.includes(activityId) ? prev.filter((id) => id !== activityId) : [...prev, activityId]
    );
  };

  // Pricing Estimator Calculation
  const stayEstimate = useMemo(() => {
    if (!calcCheckIn || !calcCheckOut) {
      return { error: "Please select both check-in and check-out dates." };
    }
    const checkInDate = new Date(calcCheckIn + "T00:00:00");
    const checkOutDate = new Date(calcCheckOut + "T00:00:00");
    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
      return { error: "Invalid check-in or check-out date." };
    }
    if (checkOutDate <= checkInDate) {
      return { error: "Check-out date must be after check-in date." };
    }
    const maxAllowedGuests = Number(formData.maxGuests) > 0 ? Number(formData.maxGuests) : undefined;
    const effectiveCalcGuests = maxAllowedGuests ? Math.min(calcGuests, maxAllowedGuests) : Math.max(1, calcGuests);
    if (effectiveCalcGuests < 1) {
      return { error: "Guest count must be at least 1." };
    }

    const nightlyBreakdown: {
      date: string;
      dayName: string;
      rate: number;
      ruleType: "special" | "seasonal" | "weekend" | "weekday" | "base";
      ruleName?: string;
    }[] = [];

    const basePriceNum = Number(formData.pricePerNight) || 0;
    const weekdayNum =
      formData.weekdayRate !== "" && !isNaN(Number(formData.weekdayRate))
        ? Number(formData.weekdayRate)
        : basePriceNum;
    const weekendNum =
      formData.weekendRate !== "" && !isNaN(Number(formData.weekendRate))
        ? Number(formData.weekendRate)
        : (weekdayNum || basePriceNum);
    const activeWeekendDays = Array.isArray(formData.weekendDays) ? formData.weekendDays : [5, 6];

    let current = new Date(checkInDate);
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    while (current < checkOutDate) {
      const yyyy = current.getFullYear();
      const mm = String(current.getMonth() + 1).padStart(2, "0");
      const dd = String(current.getDate()).padStart(2, "0");
      const dateStr = `${yyyy}-${mm}-${dd}`;
      const dayOfWeek = current.getDay();
      const dayName = dayNames[dayOfWeek];

      // Priority 1: Special Date Rule
      const specialRule = formData.specialDateRates?.find(
        (sp) => dateStr >= sp.startDate && dateStr <= (sp.endDate || sp.startDate)
      );

      if (specialRule) {
        nightlyBreakdown.push({
          date: dateStr,
          dayName,
          rate: Number(specialRule.nightlyRate) || 0,
          ruleType: "special",
          ruleName: specialRule.name,
        });
      } else {
        // Priority 2: Seasonal Rule
        const seasonalRule = formData.seasonalRates?.find(
          (s) => dateStr >= s.startDate && dateStr <= s.endDate
        );

        if (seasonalRule) {
          nightlyBreakdown.push({
            date: dateStr,
            dayName,
            rate: Number(seasonalRule.nightlyRate) || 0,
            ruleType: "seasonal",
            ruleName: seasonalRule.name,
          });
        } else if (activeWeekendDays.includes(dayOfWeek)) {
          // Priority 3: Weekend Rate
          nightlyBreakdown.push({
            date: dateStr,
            dayName,
            rate: weekendNum,
            ruleType: "weekend",
            ruleName: "Weekend Rate",
          });
        } else {
          // Priority 4: Weekday Rate
          nightlyBreakdown.push({
            date: dateStr,
            dayName,
            rate: weekdayNum,
            ruleType: "weekday",
            ruleName: "Weekday Rate",
          });
        }
      }

      current.setDate(current.getDate() + 1);
    }

    const accommodationTotal = nightlyBreakdown.reduce((sum, n) => sum + n.rate, 0);
    const nightsCount = nightlyBreakdown.length;
    const averageNightlyRate = nightsCount > 0 ? Math.round(accommodationTotal / nightsCount) : 0;

    // Extras
    const extrasBreakdown: {
      activityId: string;
      name: string;
      chargeType: string;
      price: number;
      quantity: number;
      total: number;
    }[] = [];

    (formData.paidActivities || []).forEach((act) => {
      if (calcSelectedExtras.includes(act.id)) {
        let quantity = 1;
        let total = act.price;
        if (act.chargeType === "PER_PERSON") {
          quantity = effectiveCalcGuests;
          total = act.price * effectiveCalcGuests;
        }
        extrasBreakdown.push({
          activityId: act.id,
          name: act.name,
          chargeType: act.chargeType,
          price: act.price,
          quantity,
          total,
        });
      }
    });

    const extrasTotal = extrasBreakdown.reduce((sum, e) => sum + e.total, 0);
    const estimatedTotal = accommodationTotal + extrasTotal;

    return {
      nightsCount,
      nightlyBreakdown,
      accommodationTotal,
      averageNightlyRate,
      extrasBreakdown,
      extrasTotal,
      estimatedTotal,
    };
  }, [
    calcCheckIn,
    calcCheckOut,
    calcGuests,
    calcSelectedExtras,
    formData.maxGuests,
    formData.pricePerNight,
    formData.weekdayRate,
    formData.weekendRate,
    formData.weekendDays,
    formData.seasonalRates,
    formData.specialDateRates,
    formData.paidActivities,
  ]);

  // Load initial destinations and owners
  useEffect(() => {
    async function loadInitialData() {
      try {
        const destRes = await adminClient.destinations.getAll();
        if (destRes.success && destRes.data) {
          setCountries(destRes.data.countries || []);
          setStates(destRes.data.states || []);
          setCities(destRes.data.cities || []);
          setAreas(destRes.data.areas || []);

          if (destRes.data.countries?.length > 0 && !editPropertyId) {
            const queryCountryId = searchParams.get("countryId") || searchParams.get("country");
            const queryStateId = searchParams.get("stateId") || searchParams.get("state");
            const queryCityId = searchParams.get("cityId") || searchParams.get("city");

            const targetCountry = (destRes.data.countries || []).find((c: CountryRecord) =>
              c.id === queryCountryId || c.name.toLowerCase() === queryCountryId?.toLowerCase()
            ) || destRes.data.countries[0];

            setSelectedCountryId(targetCountry.id);
            const countryStates = (destRes.data.states || []).filter((s: StateRecord) => s.countryId === targetCountry.id);
            const targetState = countryStates.find((s: StateRecord) =>
              s.id === queryStateId || s.name.toLowerCase() === queryStateId?.toLowerCase()
            ) || countryStates[0];

            if (targetState) {
              setSelectedStateId(targetState.id);
              const stateCities = (destRes.data.cities || []).filter((c: CityRecord) => c.stateId === targetState.id);
              const targetCity = stateCities.find((c: CityRecord) =>
                c.id === queryCityId || c.name.toLowerCase() === queryCityId?.toLowerCase()
              ) || stateCities[0];

              if (targetCity) {
                setSelectedCityId(targetCity.id);
              }
            }
          }
        }

        if (role === "admin") {
          const ownersRes = await adminClient.owners.getAll();
          if (ownersRes.success && ownersRes.data?.owners) {
            const loadedOwners = ownersRes.data.owners;
            setOwners(loadedOwners);

            // Handle ownerId preselection from URL query parameter (only in add mode)
            if (queryOwnerId && !editPropertyId) {
              const matchedOwner = loadedOwners.find((o: any) => o.id === queryOwnerId);
              if (matchedOwner) {
                if (matchedOwner.status === "suspended") {
                  setErrorBanner(
                    `Owner ${matchedOwner.fullName} is currently suspended. Properties cannot be assigned to suspended owner accounts.`
                  );
                } else {
                  setOwnerMode("existing_owner");
                  setSelectedOwnerId(matchedOwner.id);
                  setFormData((prev) => ({
                    ...prev,
                    contactPerson: prev.contactPerson || matchedOwner.fullName || "",
                    email: prev.email || matchedOwner.email || "",
                    mobileNumber: prev.mobileNumber || matchedOwner.mobileNumber || "",
                  }));
                }
              } else {
                setErrorBanner(`Owner with ID "${queryOwnerId}" was not found.`);
              }
            }
          }
        } else if (role === "owner" && owner) {
          setOwnerMode("existing_owner");
          setSelectedOwnerId(owner.id);
          setOwners([owner]);
          setFormData((prev) => ({
            ...prev,
            contactPerson: prev.contactPerson || owner.fullName || "",
            email: prev.email || owner.email || "",
            mobileNumber: prev.mobileNumber || owner.mobileNumber || "",
          }));
        }
      } catch (err) {
        console.warn("Failed to load initial destination or owner records:", err);
      }
    }

    loadInitialData();
  }, [editPropertyId, queryOwnerId, role, owner]);

  // Synchronize authenticated owner profile when in owner role
  useEffect(() => {
    if (role === "owner" && owner && !editPropertyId) {
      setOwnerMode("existing_owner");
      setSelectedOwnerId(owner.id);
      setOwners([owner]);
      setFormData((prev) => ({
        ...prev,
        contactPerson: prev.contactPerson || owner.fullName || "",
        email: prev.email || owner.email || "",
        mobileNumber: prev.mobileNumber || owner.mobileNumber || "",
      }));
    }
  }, [role, owner, editPropertyId]);

  // In Edit Mode, fetch the existing property details and prefill all fields
  useEffect(() => {
    if (!editPropertyId) return;

    let isMounted = true;
    async function loadPropertyToEdit() {
      setIsLoadingProperty(true);
      setErrorBanner("");
      try {
        let prop: any = null;
        if (role === "owner") {
          const res = await fetchPropertyByIdApi(editPropertyId);
          if (!isMounted) return;
          if (res.success && res.property) {
            prop = res.property;
          } else {
            setErrorBanner(res.message || "Property not found or invalid property ID.");
            return;
          }
        } else {
          const res = await adminClient.properties.getById(editPropertyId);
          if (!isMounted) return;
          if (res.success && res.data?.property) {
            prop = res.data.property;
          } else {
            setErrorBanner(res.message || "Property not found or invalid property ID.");
            return;
          }
        }

        if (prop) {
          setOriginalProperty(prop);
          setLoadedPropertyNumber(prop.propertyNumber || "");

          if (prop.countryId) setSelectedCountryId(prop.countryId);
          if (prop.stateId) setSelectedStateId(prop.stateId);
          if (prop.cityId) setSelectedCityId(prop.cityId);
          if (prop.areaId) setSelectedAreaId(prop.areaId);

          if (prop.createdByRole === "admin" && (!prop.ownerId || prop.ownerId.startsWith("admin_") || prop.ownerId === "admin")) {
            setOwnerMode("admin_managed");
            setSelectedOwnerId("");
          } else if (prop.ownerId) {
            setOwnerMode("existing_owner");
            setSelectedOwnerId(prop.ownerId);
          }

          const rawLat = prop.location?.coordinates?.latitude ?? prop.location?.coordinates?.lat ?? (prop as any).latitude;
          const rawLng = prop.location?.coordinates?.longitude ?? prop.location?.coordinates?.lng ?? (prop as any).longitude;
          const parsedLat = rawLat !== undefined && rawLat !== null && !isNaN(Number(rawLat)) ? Number(rawLat) : 28.6139;
          const parsedLng = rawLng !== undefined && rawLng !== null && !isNaN(Number(rawLng)) ? Number(rawLng) : 77.209;

          setFormData({
            name: prop.name || "",
            propertyType: prop.propertyType || "Luxury Hotels",
            shortDescription: prop.shortDescription || "",
            detailedDescription: prop.detailedDescription || "",
            propertySize: prop.propertySize !== undefined && prop.propertySize !== null ? prop.propertySize : "",
            propertySizeUnit: prop.propertySizeUnit || "Square Feet (sq ft)",
            address: prop.location?.address || "",
            locality: prop.location?.locality || "",
            postalCode: prop.location?.postalCode || "",
            latitude: parsedLat,
            longitude: parsedLng,
            hasConfirmedLocation: true,
            pricePerNight: Number(prop.pricing?.pricePerNight) || 0,
            originalPrice: prop.pricing?.originalPrice ? Number(prop.pricing.originalPrice) : undefined,
            weekdayRate: prop.pricing?.weekdayRate !== undefined ? Number(prop.pricing.weekdayRate) : "",
            weekendRate: prop.pricing?.weekendRate !== undefined ? Number(prop.pricing.weekendRate) : "",
            weekendDays: Array.isArray(prop.pricing?.weekendDays) && prop.pricing.weekendDays.length > 0 ? prop.pricing.weekendDays : [5, 6],
            seasonalRates: Array.isArray(prop.pricing?.seasonalRates) ? prop.pricing.seasonalRates : [],
            specialDateRates: Array.isArray(prop.pricing?.specialDateRates) ? prop.pricing.specialDateRates : [],
            paidActivities: Array.isArray(prop.pricing?.paidActivities) ? prop.pricing.paidActivities : [],
            maxGuests: Number(prop.capacity?.maxGuests) || 2,
            bedrooms: Number(prop.capacity?.bedrooms) || 1,
            bathrooms: Number(prop.capacity?.bathrooms) || 1,
            checkInTime: prop.capacity?.checkInTime || "14:00",
            checkOutTime: prop.capacity?.checkOutTime || "11:00",
            amenities: Array.isArray(prop.amenities) ? prop.amenities : [],
            images: Array.isArray(prop.images)
              ? prop.images.map((img: any, idx: number) => ({
                  id: img.id || `img_${Date.now()}_${idx}`,
                  url: img.url,
                  isCover: Boolean(img.isCover),
                  title: typeof img.title === "string" ? img.title : (img.caption || ""),
                  caption: img.caption,
                }))
              : [],
            policies: {
              generalPolicy: prop.policies?.generalPolicy || "",
              refundPolicy: prop.policies?.refundPolicy || "",
              contractPolicy: prop.policies?.contractPolicy || "",
              additionalNotes: prop.policies?.additionalNotes || "",
            },
            contactPerson: prop.contactDetails?.contactPerson || "",
            mobileNumber: prop.contactDetails?.mobileNumber || "",
            email: prop.contactDetails?.email || "",
            featured: Boolean(prop.featured ?? prop.isFeatured),
            handpicked: Boolean(prop.handpicked ?? prop.isHandpicked),
          });
          setLatInput(String(parsedLat));
          setLngInput(String(parsedLng));
          setCoordErrors({});

          // Load property reviews
          try {
            if (role === "admin") {
              const revRes = await adminClient.reviews.getAll(editPropertyId);
              if (revRes.success && Array.isArray(revRes.data?.reviews)) {
                setReviews(revRes.data.reviews);
              }
            } else {
              const revRes = await fetch(apiUrl(`/api/public/reviews?propertyId=${encodeURIComponent(editPropertyId)}`));
              const revJson = await revRes.json();
              if (revJson.success && Array.isArray(revJson.reviews)) {
                setReviews(revJson.reviews);
              }
            }
          } catch (err) {
            console.error("Failed to load reviews for property:", err);
          }
        }
      } catch (err: any) {
        if (!isMounted) return;
        setErrorBanner(err.message || "Failed to load property details.");
      } finally {
        if (isMounted) setIsLoadingProperty(false);
      }
    }

    loadPropertyToEdit();
    return () => {
      isMounted = false;
    };
  }, [editPropertyId]);

  // Filtered dropdown lists based on hierarchy
  const availableStates = states.filter((s) => s.countryId === selectedCountryId);
  const availableCities = cities.filter((c) => c.stateId === selectedStateId);
  const availableAreas = areas.filter((a) => a.cityId === selectedCityId);

  // When country changes, reset child selections
  const handleCountryChange = (cid: string) => {
    setSelectedCountryId(cid);
    const subStates = states.filter((s) => s.countryId === cid);
    if (subStates.length > 0) {
      setSelectedStateId(subStates[0].id);
      const subCities = cities.filter((c) => c.stateId === subStates[0].id);
      if (subCities.length > 0) {
        setSelectedCityId(subCities[0].id);
      } else {
        setSelectedCityId("");
      }
    } else {
      setSelectedStateId("");
      setSelectedCityId("");
    }
    setSelectedAreaId("");
  };

  const handleStateChange = (sid: string) => {
    setSelectedStateId(sid);
    const subCities = cities.filter((c) => c.stateId === sid);
    if (subCities.length > 0) {
      setSelectedCityId(subCities[0].id);
    } else {
      setSelectedCityId("");
    }
    setSelectedAreaId("");
  };

  const handleCityChange = (cid: string) => {
    setSelectedCityId(cid);
    setSelectedAreaId("");
  };

  // Image Upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setErrorBanner("");

    try {
      const uploadPromises = Array.from(files).map(async (file, idx) => {
        const formDataUpload = new FormData();
        formDataUpload.append("file", file);

        const res = await fetch(apiUrl("/api/upload"), {
          method: "POST",
          body: formDataUpload,
        });

        if (!res.ok) throw new Error("Upload failed");
        const data = await res.json();
        return {
          id: `img_${Date.now()}_${idx}`,
          url: data.url || data.secure_url,
          isCover: formData.images.length === 0 && idx === 0,
          title: "",
          caption: file.name.replace(/\.[^/.]+$/, ""),
        };
      });

      const newImages = await Promise.all(uploadPromises);
      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, ...newImages],
      }));
    } catch (err: any) {
      console.error("Image upload error:", err);
      setErrorBanner("Failed to upload image. Please check file format and try again.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleAddSamplePhotos = () => {
    const presetImages: PropertyImage[] = SAMPLE_PHOTO_PRESETS.map((p, idx) => ({
      id: `img_preset_${Date.now()}_${idx}`,
      url: p.url,
      isCover: formData.images.length === 0 && idx === 0,
      title: p.caption || "",
      caption: p.caption,
    }));

    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, ...presetImages],
    }));
  };

  const handleSetCoverPhoto = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.map((img) => ({
        ...img,
        isCover: img.id === id,
      })),
    }));
  };

  const handleImageTitleChange = (id: string, newTitle: string) => {
    const trimmedToMax = newTitle.slice(0, 120);
    setFormData((prev) => ({
      ...prev,
      images: prev.images.map((img) =>
        img.id === id ? { ...img, title: trimmedToMax } : img
      ),
    }));
  };

  const handleRemovePhoto = (id: string) => {
    setFormData((prev) => {
      const filtered = prev.images.filter((img) => img.id !== id);
      if (filtered.length > 0 && !filtered.some((img) => img.isCover)) {
        filtered[0].isCover = true;
      }
      return { ...prev, images: filtered };
    });
  };

  const handleBannerUpload = async (file: File) => {
    if (!file) return;
    setIsBannerUploading(true);
    setErrorBanner("");

    try {
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);

      const res = await fetch(apiUrl("/api/upload"), {
        method: "POST",
        body: formDataUpload,
      });

      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      const bannerUrl = data.url || data.secure_url;

      const newBannerImage: PropertyImage = {
        id: `img_banner_${Date.now()}`,
        url: bannerUrl,
        isCover: true,
        title: "",
        caption: file.name.replace(/\.[^/.]+$/, ""),
      };

      setFormData((prev) => {
        const otherImages = prev.images
          .filter((img) => !img.isCover)
          .map((img) => ({ ...img, isCover: false }));
        return {
          ...prev,
          images: [newBannerImage, ...otherImages],
        };
      });
    } catch (err: any) {
      console.error("Banner upload error:", err);
      setErrorBanner("Failed to upload banner image. Please check file format and try again.");
    } finally {
      setIsBannerUploading(false);
      if (bannerFileInputRef.current) bannerFileInputRef.current.value = "";
    }
  };

  const handleRemoveBanner = () => {
    setFormData((prev) => {
      const remaining = prev.images.filter((img) => !img.isCover);
      return {
        ...prev,
        images: remaining,
      };
    });
  };

  const handleToggleAmenity = (amenity: string) => {
    setFormData((prev) => {
      const exists = prev.amenities.includes(amenity);
      return {
        ...prev,
        amenities: exists
          ? prev.amenities.filter((a) => a !== amenity)
          : [...prev.amenities, amenity],
      };
    });
  };

  const handleAddCustomAmenity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customAmenity.trim()) return;
    if (!formData.amenities.includes(customAmenity.trim())) {
      setFormData((prev) => ({
        ...prev,
        amenities: [...prev.amenities, customAmenity.trim()],
      }));
    }
    setCustomAmenity("");
  };

  // Validation
  const validateStep = (step: number): boolean => {
    setErrorBanner("");
    if (step === 1) {
      if (!formData.name.trim() || formData.name.trim().length < 3) {
        setErrorBanner("Property name is required (minimum 3 characters).");
        return false;
      }
      if (!formData.propertyType) {
        setErrorBanner("Please select a valid property type.");
        return false;
      }
      if (!formData.pricePerNight || Number(formData.pricePerNight) <= 0) {
        setErrorBanner("Please enter a valid Base Price (minimum starting price) greater than 0.");
        return false;
      }
    } else if (step === 2) {
      if (!selectedCountryId || !selectedStateId || !selectedCityId) {
        setErrorBanner("Please select a complete destination hierarchy (Country, State, and City).");
        return false;
      }
      if (!formData.address.trim()) {
        setErrorBanner("Complete street address is required.");
        return false;
      }
      const latRes = validateCoordinateString(latInput, "lat");
      if (!latRes.isValid || !latRes.isComplete || typeof latRes.num !== "number") {
        const msg = latRes.error || "Latitude must be a valid number between -90 and 90.";
        setErrorBanner(msg);
        setCoordErrors((prev) => ({ ...prev, latitude: msg }));
        return false;
      }
      const lngRes = validateCoordinateString(lngInput, "lng");
      if (!lngRes.isValid || !lngRes.isComplete || typeof lngRes.num !== "number") {
        const msg = lngRes.error || "Longitude must be a valid number between -180 and 180.";
        setErrorBanner(msg);
        setCoordErrors((prev) => ({ ...prev, longitude: msg }));
        return false;
      }
      setFormData((prev) => ({
        ...prev,
        latitude: latRes.num!,
        longitude: lngRes.num!,
        hasConfirmedLocation: true,
      }));
    } else if (step === 3) {
      if (formData.images.length === 0) {
        setErrorBanner("Please upload at least one property photograph or add curated sample photos.");
        return false;
      }
    } else if (step === 4) {
      if (!formData.pricePerNight || Number(formData.pricePerNight) <= 0) {
        setErrorBanner("Base Price must be greater than 0 (set in Step 1).");
        return false;
      }
    } else if (step === 5) {
      if (formData.policies?.generalPolicy && formData.policies.generalPolicy.length > 5000) {
        setErrorBanner("General Policy cannot exceed 5,000 characters.");
        return false;
      }
      if (formData.policies?.refundPolicy && formData.policies.refundPolicy.length > 5000) {
        setErrorBanner("Refund & Cancellation Policy cannot exceed 5,000 characters.");
        return false;
      }
      if (formData.policies?.contractPolicy && formData.policies.contractPolicy.length > 5000) {
        setErrorBanner("Contract Policy cannot exceed 5,000 characters.");
        return false;
      }
      if (formData.policies?.additionalNotes && formData.policies.additionalNotes.length > 5000) {
        setErrorBanner("Additional Notes cannot exceed 5,000 characters.");
        return false;
      }
    } else if (step === 6) {
      // Step 6: Property Reviews (optional guest feedback)
      return true;
    }
    return true;
  };

  const handleSaveProperty = async (status: "approved" | "draft") => {
    if (!validateStep(1) || !validateStep(2) || !validateStep(3) || !validateStep(4) || !validateStep(5) || !validateStep(6)) {
      return;
    }

    setIsSubmitting(true);
    setErrorBanner("");
    setSuccessBanner("");

    try {
      const payload = {
        name: formData.name.trim(),
        propertyType: formData.propertyType,
        shortDescription: formData.shortDescription.trim() || formData.name.trim(),
        detailedDescription: formData.detailedDescription.trim(),
        propertySize: formData.propertySize !== "" ? Number(formData.propertySize) : undefined,
        propertySizeUnit: formData.propertySizeUnit || "Square Feet (sq ft)",
        countryId: selectedCountryId,
        stateId: selectedStateId,
        cityId: selectedCityId,
        areaId: selectedAreaId || undefined,
        locality: formData.locality.trim() || undefined,
        address: formData.address.trim(),
        postalCode: formData.postalCode.trim() || "000000",
        coordinates: {
          latitude: formData.latitude,
          longitude: formData.longitude,
          lat: formData.latitude,
          lng: formData.longitude,
        },
        latitude: formData.latitude,
        longitude: formData.longitude,
        pricePerNight: Number(formData.pricePerNight),
        currency: "USD",
        originalPrice: formData.originalPrice ? Number(formData.originalPrice) : undefined,
        weekdayRate: formData.weekdayRate !== "" && !isNaN(Number(formData.weekdayRate)) ? Number(formData.weekdayRate) : undefined,
        weekendRate: formData.weekendRate !== "" && !isNaN(Number(formData.weekendRate)) ? Number(formData.weekendRate) : undefined,
        weekendDays: formData.weekendDays,
        seasonalRates: formData.seasonalRates,
        specialDateRates: formData.specialDateRates,
        paidActivities: formData.paidActivities,
        pricing: {
          pricePerNight: Number(formData.pricePerNight),
          currency: "USD",
          originalPrice: formData.originalPrice ? Number(formData.originalPrice) : undefined,
          weekdayRate: formData.weekdayRate !== "" && !isNaN(Number(formData.weekdayRate)) ? Number(formData.weekdayRate) : undefined,
          weekendRate: formData.weekendRate !== "" && !isNaN(Number(formData.weekendRate)) ? Number(formData.weekendRate) : undefined,
          weekendDays: formData.weekendDays,
          seasonalRates: formData.seasonalRates,
          specialDateRates: formData.specialDateRates,
          paidActivities: formData.paidActivities,
        },
        maxGuests: Number(formData.maxGuests),
        bedrooms: Number(formData.bedrooms),
        bathrooms: Number(formData.bathrooms),
        checkInTime: formData.checkInTime,
        checkOutTime: formData.checkOutTime,
        amenities: formData.amenities,
        images: formData.images.map((img) => ({
          ...img,
          title: typeof img.title === "string" ? img.title.trim().slice(0, 120) : "",
        })),
        policies: formData.policies,
        reviews: reviews.map((r) => ({
          ...r,
          propertyName: formData.name.trim(),
        })),
        contactPerson: formData.contactPerson.trim(),
        mobileNumber: formData.mobileNumber.trim(),
        email: formData.email.trim(),
        featured: formData.featured,
        handpicked: formData.handpicked,
        status,
        ownerId: ownerMode === "existing_owner" && selectedOwnerId ? selectedOwnerId : undefined,
      };

      if (isEditMode) {
        const updatePayload = {
          name: formData.name.trim(),
          propertyType: formData.propertyType,
          shortDescription: formData.shortDescription.trim() || formData.name.trim(),
          detailedDescription: formData.detailedDescription.trim(),
          propertySize: formData.propertySize !== "" ? Number(formData.propertySize) : undefined,
          propertySizeUnit: formData.propertySizeUnit || "Square Feet (sq ft)",
          countryId: selectedCountryId,
          stateId: selectedStateId,
          cityId: selectedCityId,
          areaId: selectedAreaId || undefined,
          locality: formData.locality.trim() || undefined,
          address: formData.address.trim(),
          postalCode: formData.postalCode.trim() || "000000",
          coordinates: {
            latitude: formData.latitude,
            longitude: formData.longitude,
            lat: formData.latitude,
            lng: formData.longitude,
          },
          latitude: formData.latitude,
          longitude: formData.longitude,
          pricePerNight: Number(formData.pricePerNight),
          currency: "USD",
          originalPrice: formData.originalPrice ? Number(formData.originalPrice) : undefined,
          weekdayRate: formData.weekdayRate !== "" && !isNaN(Number(formData.weekdayRate)) ? Number(formData.weekdayRate) : undefined,
          weekendRate: formData.weekendRate !== "" && !isNaN(Number(formData.weekendRate)) ? Number(formData.weekendRate) : undefined,
          weekendDays: formData.weekendDays,
          seasonalRates: formData.seasonalRates,
          specialDateRates: formData.specialDateRates,
          paidActivities: formData.paidActivities,
          pricing: {
            pricePerNight: Number(formData.pricePerNight),
            currency: "USD",
            originalPrice: formData.originalPrice ? Number(formData.originalPrice) : undefined,
            weekdayRate: formData.weekdayRate !== "" && !isNaN(Number(formData.weekdayRate)) ? Number(formData.weekdayRate) : undefined,
            weekendRate: formData.weekendRate !== "" && !isNaN(Number(formData.weekendRate)) ? Number(formData.weekendRate) : undefined,
            weekendDays: formData.weekendDays,
            seasonalRates: formData.seasonalRates,
            specialDateRates: formData.specialDateRates,
            paidActivities: formData.paidActivities,
          },
          maxGuests: Number(formData.maxGuests),
          bedrooms: Number(formData.bedrooms),
          bathrooms: Number(formData.bathrooms),
          checkInTime: formData.checkInTime,
          checkOutTime: formData.checkOutTime,
          amenities: formData.amenities,
          images: formData.images.map((img) => ({
            ...img,
            title: typeof img.title === "string" ? img.title.trim().slice(0, 120) : "",
          })),
          policies: formData.policies,
          reviews: reviews.map((r) => ({
            ...r,
            propertyId: editPropertyId,
            propertyName: formData.name.trim(),
          })),
          contactPerson: formData.contactPerson.trim(),
          mobileNumber: formData.mobileNumber.trim(),
          email: formData.email.trim(),
          featured: formData.featured,
          handpicked: formData.handpicked,
          ownerId: ownerMode === "existing_owner" && selectedOwnerId ? selectedOwnerId : undefined,
          ownerMode,
        };

        if (role === "owner") {
          const res = await updatePropertyApi(editPropertyId, updatePayload as any, status === "approved");
          if (res.success) {
            setSuccessBanner(
              status === "approved"
                ? "Property updated and submitted for review! Our audit team will verify the listing."
                : "Property details updated successfully."
            );
            setTimeout(() => {
              router.push(redirectUrl);
            }, 1200);
          } else {
            setErrorBanner(res.message || "Failed to update property.");
          }
        } else {
          const res = await adminClient.properties.edit(editPropertyId, updatePayload);
          if (res.success) {
            setSuccessBanner("Property Updated Successfully! The changes have been saved.");
            setTimeout(() => {
              router.push(redirectUrl);
            }, 1200);
          } else {
            setErrorBanner(res.message || "Failed to update property.");
          }
        }
      } else {
        if (role === "owner") {
          const res = await createPropertyApi(payload as any, status === "approved");
          if (res.success) {
            setSuccessBanner(
              status === "approved"
                ? "Property successfully submitted for review! Our audit team will review it within 24-48 hours."
                : "Property draft successfully saved."
            );
            setTimeout(() => {
              router.push(redirectUrl);
            }, 1200);
          } else {
            setErrorBanner(res.message || "Failed to create property.");
          }
        } else {
          const res = await adminClient.properties.create(payload);
          if (res.success) {
            setSuccessBanner(
              status === "approved"
                ? "Property created and published successfully! Live in public listings and map."
                : "Property saved as draft."
            );
            setTimeout(() => {
              router.push(redirectUrl);
            }, 1200);
          } else {
            setErrorBanner(res.message || "Failed to create property.");
          }
        }
      }
    } catch (err: any) {
      console.error("Create property error:", err);
      setErrorBanner(err.message || "An unexpected error occurred while saving property.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const STEPS = [
    { num: 1, title: "Basic Information", desc: "Name, Type & Story" },
    { num: 2, title: "Location & Map", desc: "Hierarchy & Coordinates" },
    { num: 3, title: "Photos & Media", desc: "Gallery & Cover" },
    { num: 4, title: "Details & Pricing", desc: "Rates, Capacity & Amenities" },
    { num: 5, title: "Property Policies", desc: "Rules, Refunds & Terms" },
    { num: 6, title: "Property Reviews", desc: "Guest Ratings & Feedback" },
    { num: 7, title: "Owner & Publish", desc: "Ownership & Verification" },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Header Breadcrumbs & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-2">
            <Link href={backUrl} className="hover:text-teal-400 transition-colors flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{role === "owner" ? "My Properties" : "All Properties"}</span>
            </Link>
            <span>/</span>
            <span className="text-teal-400 font-bold">
              {isEditMode ? `Edit Property ${loadedPropertyNumber ? `(${loadedPropertyNumber})` : ""}` : "Manual Property Creation"}
            </span>
          </div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2 flex-wrap">
              <span>{isEditMode ? "Edit Property" : "Add Luxury Property"}</span>
              {isEditMode && loadedPropertyNumber && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-teal-500/15 text-teal-300 border border-teal-500/30">
                  {loadedPropertyNumber}
                </span>
              )}
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-teal-500/20 text-teal-300 border border-teal-500/30">
                Super Admin
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              {isEditMode
                ? "Modify property details, location, gallery, amenities and pricing. Property Number remains permanent."
                : "Manually publish new luxury stays or associate with registered owners. Direct map coordinates integration enabled."}
            </p>
            {ownerMode === "existing_owner" && selectedOwnerId && (
              <div className="mt-2.5 inline-flex items-center gap-2 px-3 py-1.5 bg-teal-500/10 border border-teal-500/30 rounded-xl text-xs text-teal-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span>
                  Owner Account:{" "}
                  <strong className="text-white">
                    {owners.find((o) => o.id === selectedOwnerId)?.fullName || selectedOwnerId}
                  </strong>{" "}
                  ({owners.find((o) => o.id === selectedOwnerId)?.email || ""})
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isEditMode ? (
              <>
                <Link
                  href="/admin/properties"
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all"
                >
                  Cancel
                </Link>
                <button
                  type="button"
                  disabled={isSubmitting || isLoadingProperty}
                  onClick={() => handleSaveProperty("approved")}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-teal-500/20 transition-all disabled:opacity-40 cursor-pointer"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>Save Changes</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleSaveProperty("draft")}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all disabled:opacity-40"
                >
                  Save as Draft
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleSaveProperty("approved")}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-teal-500/20 transition-all disabled:opacity-40"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>Publish Property</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Status Alerts */}
        {errorBanner && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 shadow-lg animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span className="font-medium">{errorBanner}</span>
          </div>
        )}

        {successBanner && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 shadow-lg animate-in fade-in">
            <Check className="w-4 h-4 shrink-0 text-emerald-400" />
            <span className="font-medium">{successBanner}</span>
          </div>
        )}

        {/* Loading State for Edit Mode */}
        {isLoadingProperty ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-16 text-center shadow-xl">
            <Loader2 className="w-10 h-10 animate-spin text-teal-400 mx-auto mb-4" />
            <h3 className="text-base font-bold text-white">Loading Saved Property Details...</h3>
            <p className="text-xs text-slate-400 mt-1">Please wait while the property information is retrieved.</p>
          </div>
        ) : errorBanner && !formData.name && isEditMode ? (
          <div className="bg-slate-900 border border-red-500/30 rounded-3xl p-12 text-center shadow-xl">
            <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white">Unable to Load Property</h3>
            <p className="text-xs text-slate-400 mt-1 mb-5">{errorBanner}</p>
            <Link
              href="/admin/properties"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Properties Management</span>
            </Link>
          </div>
        ) : (
          <>
            {/* Stepper Wizard Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-2.5 shadow-lg">
          {STEPS.map((s) => {
            const isCurrent = currentStep === s.num;
            const isCompleted = currentStep > s.num;

            return (
              <button
                key={s.num}
                type="button"
                onClick={() => {
                  if (s.num < currentStep) setCurrentStep(s.num);
                  else if (validateStep(currentStep)) setCurrentStep(s.num);
                }}
                className={`p-3 rounded-xl text-left transition-all flex items-center gap-2.5 ${
                  isCurrent
                    ? "bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm"
                    : isCompleted
                    ? "bg-slate-800/70 text-slate-300 hover:bg-slate-800"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                    isCurrent
                      ? "bg-teal-500 text-slate-950 font-extrabold"
                      : isCompleted
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                      : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : s.num}
                </div>
                <div className="min-w-0">
                  <span className="block text-xs font-bold truncate leading-tight">{s.title}</span>
                  <span className="block text-[10px] text-slate-400 truncate mt-0.5">{s.desc}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Step Panels */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
          {/* STEP 1: BASIC INFORMATION */}
          {currentStep === 1 && (() => {
            const bannerImage =
              formData.images.find((img) => img.isCover) ||
              (formData.images.length > 0 ? formData.images[0] : null);

            return (
              <div className="space-y-6 animate-in fade-in text-xs sm:text-sm">
                <div className="border-b border-slate-800 pb-4">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-teal-400" />
                    <span>Step 1: Basic Information</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Essential property details and primary presentation
                  </p>
                </div>

                {/* Hidden File Input for Banner Image */}
                <input
                  ref={bannerFileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleBannerUpload(e.target.files[0]);
                    }
                  }}
                />

                <div className="space-y-5">
                  {/* 1. Property Name (Full width) */}
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1.5">
                      Property Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. The Oberoi Udaivilas, Mountain Haven Villa"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500 font-medium"
                    />
                  </div>

                  {/* 2. Property Type + Base Price (Two columns) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Column A: Property Type */}
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1.5">
                        Property Type <span className="text-rose-400">*</span>
                      </label>
                      <select
                        value={formData.propertyType}
                        onChange={(e) =>
                          setFormData({ ...formData, propertyType: e.target.value as PropertyTypeCategory })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-teal-500 font-medium cursor-pointer"
                      >
                        <option value="" disabled>Select Property Type</option>
                        {PROPERTY_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Column B: Base Price (USD) */}
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1.5">
                        Base Price (USD) <span className="text-rose-400">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm sm:text-base pointer-events-none">
                          $
                        </span>
                        <input
                          type="number"
                          min="1"
                          required
                          placeholder="Enter minimum starting price"
                          value={!formData.pricePerNight || Number(formData.pricePerNight) === 0 ? "" : formData.pricePerNight}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => {
                            const raw = e.target.value;
                            if (!raw) {
                              setFormData({ ...formData, pricePerNight: "" as any });
                              return;
                            }
                            const clean = raw.replace(/^0+/, "");
                            setFormData({
                              ...formData,
                              pricePerNight: clean ? Number(clean) : ("" as any),
                            });
                          }}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500 font-mono font-medium text-sm sm:text-base"
                        />
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Minimum starting price for this property.
                      </p>
                    </div>
                  </div>

                  {/* 3. Full Property Description (Full width) */}
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1.5">
                      Full Property Description
                    </label>
                    <textarea
                      rows={6}
                      placeholder="Describe the property, its atmosphere, special features, facilities and guest experience..."
                      value={formData.detailedDescription}
                      onChange={(e) => setFormData({ ...formData, detailedDescription: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500 font-medium leading-relaxed resize-none"
                    />
                  </div>

                  {/* 4. Banner Image (Full width upload area) */}
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1.5">
                      Banner Image
                    </label>

                    {bannerImage ? (
                      <div className="space-y-2">
                        <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 group shadow-lg">
                          <img
                            src={bannerImage.url}
                            alt={bannerImage.caption || "Banner Image Preview"}
                            className="w-full h-full object-cover group-hover:scale-[1.01] transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/30 pointer-events-none" />

                          {/* Top Badges */}
                          <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                            <span className="px-3 py-1 rounded-full bg-teal-500 text-slate-950 font-bold text-xs shadow-md flex items-center gap-1.5">
                              <Star className="w-3.5 h-3.5 fill-slate-950" />
                              <span>Primary Cover Banner</span>
                            </span>
                          </div>

                          {/* Bottom Controls Bar */}
                          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs">
                            <div className="text-slate-200 truncate font-medium max-w-[50%] bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/50">
                              {bannerImage.caption || "Cover Banner Uploaded"}
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                disabled={isBannerUploading}
                                onClick={() => bannerFileInputRef.current?.click()}
                                className="px-3.5 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold backdrop-blur-md transition-all shadow-md inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                              >
                                {isBannerUploading ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-400" />
                                ) : (
                                  <Upload className="w-3.5 h-3.5" />
                                )}
                                <span>Replace</span>
                              </button>
                              <button
                                type="button"
                                onClick={handleRemoveBanner}
                                className="px-3.5 py-1.5 rounded-xl bg-rose-500/80 hover:bg-rose-500 text-white text-xs font-semibold backdrop-blur-md transition-all shadow-md inline-flex items-center gap-1.5 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Remove</span>
                              </button>
                            </div>
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Recommended: 16:9 aspect ratio, high resolution (min 1920×1080). This image is featured on property cards and search results.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div
                          onDragOver={(e) => {
                            e.preventDefault();
                            setIsDraggingBanner(true);
                          }}
                          onDragLeave={() => setIsDraggingBanner(false)}
                          onDrop={(e) => {
                            e.preventDefault();
                            setIsDraggingBanner(false);
                            if (e.dataTransfer.files?.[0]) {
                              handleBannerUpload(e.dataTransfer.files[0]);
                            }
                          }}
                          onClick={() => bannerFileInputRef.current?.click()}
                          className={`w-full border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all cursor-pointer group ${
                            isDraggingBanner
                              ? "border-teal-400 bg-teal-500/10"
                              : "border-slate-800 bg-slate-950/60 hover:bg-slate-950 hover:border-slate-700"
                          }`}
                        >
                          <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-400 group-hover:text-teal-400 transition-colors">
                            {isBannerUploading ? (
                              <Loader2 className="w-7 h-7 animate-spin text-teal-400" />
                            ) : (
                              <Upload className="w-7 h-7 text-teal-400" />
                            )}
                          </div>
                          <h3 className="text-sm font-bold text-white mb-1">
                            Drag and drop or click to upload
                          </h3>
                          <p className="text-xs text-slate-400 mb-3">
                            PNG, JPG, WebP supported. Recommended: 16:9 ratio, min 1920×1080
                          </p>
                          <button
                            type="button"
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 border border-slate-700 text-xs font-semibold transition-all pointer-events-none"
                          >
                            <Camera className="w-3.5 h-3.5" />
                            <span>Browse Banner Image</span>
                          </button>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Recommended: 16:9 aspect ratio, high resolution (min 1920×1080). This image is featured on property cards and search results.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* 5. Property Size + Measurement Unit (Two columns) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Column A: Property Size */}
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1.5">
                        Property Size
                      </label>
                      <input
                        type="number"
                        min="0"
                        placeholder="e.g. 3500"
                        value={formData.propertySize}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            propertySize: e.target.value ? Number(e.target.value) : "",
                          })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500 font-medium"
                      />
                      <p className="text-[11px] text-slate-400 mt-1">
                        Total built-up or plot area.
                      </p>
                    </div>

                    {/* Column B: Measurement Unit */}
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1.5">
                        Measurement Unit
                      </label>
                      <select
                        value={formData.propertySizeUnit}
                        onChange={(e) =>
                          setFormData({ ...formData, propertySizeUnit: e.target.value })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-teal-500 font-medium cursor-pointer"
                      >
                        <option value="Square Feet (sq ft)">Square Feet (sq ft)</option>
                        <option value="Square Meters (m²)">Square Meters (m²)</option>
                        <option value="Acres">Acres</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* STEP 2: LOCATION & INTERACTIVE MAP */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in">
              <div className="border-b border-slate-800 pb-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-teal-400" />
                  <span>Step 2: Destination Hierarchy & Exact Map Coordinates</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Select destination hierarchy and place the marker on the interactive map for accurate public search and website map plotting.
                </p>
              </div>

              {/* Hierarchy Dropdowns: Country -> State -> City -> Area */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs sm:text-sm">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1.5">
                    Country <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={selectedCountryId}
                    onChange={(e) => handleCountryChange(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-teal-500 font-medium cursor-pointer"
                  >
                    {countries.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1.5">
                    State / Province <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={selectedStateId}
                    onChange={(e) => handleStateChange(e.target.value)}
                    disabled={availableStates.length === 0}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-teal-500 font-medium disabled:opacity-50 cursor-pointer"
                  >
                    <option value="">-- Select State --</option>
                    {availableStates.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1.5">
                    City / Town <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={selectedCityId}
                    onChange={(e) => handleCityChange(e.target.value)}
                    disabled={availableCities.length === 0}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-teal-500 font-medium disabled:opacity-50 cursor-pointer"
                  >
                    <option value="">-- Select City --</option>
                    {availableCities.map((ci) => (
                      <option key={ci.id} value={ci.id}>
                        {ci.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1.5">
                    Area / Locality <span className="text-slate-500 font-normal">(Optional)</span>
                  </label>
                  <select
                    value={selectedAreaId}
                    onChange={(e) => setSelectedAreaId(e.target.value)}
                    disabled={availableAreas.length === 0}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-teal-500 font-medium disabled:opacity-50 cursor-pointer"
                  >
                    <option value="">-- Select Area --</option>
                    {availableAreas.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Address Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs sm:text-sm pt-2">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-300 mb-1.5">
                    Full Street Address <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Haridas Ji Ki Magri, Mulla Talai"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1.5">
                    Postal / PIN Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 313001"
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500 font-medium"
                  />
                </div>
              </div>

              {/* Latitude & Longitude Coordinate Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm pt-2">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1.5">
                    Latitude <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter latitude"
                    value={latInput}
                    onChange={handleLatitudeChange}
                    onBlur={handleLatitudeBlur}
                    className={`w-full bg-slate-950 border rounded-xl px-4 py-2.5 text-white placeholder:text-slate-600 focus:outline-none font-medium transition-colors ${
                      coordErrors.latitude
                        ? "border-rose-500/60 focus:border-rose-500"
                        : "border-slate-800 focus:border-teal-500"
                    }`}
                  />
                  {coordErrors.latitude && (
                    <p className="text-rose-400 text-xs mt-1">{coordErrors.latitude}</p>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1.5">
                    Longitude <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter longitude"
                    value={lngInput}
                    onChange={handleLongitudeChange}
                    onBlur={handleLongitudeBlur}
                    className={`w-full bg-slate-950 border rounded-xl px-4 py-2.5 text-white placeholder:text-slate-600 focus:outline-none font-medium transition-colors ${
                      coordErrors.longitude
                        ? "border-rose-500/60 focus:border-rose-500"
                        : "border-slate-800 focus:border-teal-500"
                    }`}
                  />
                  {coordErrors.longitude && (
                    <p className="text-rose-400 text-xs mt-1">{coordErrors.longitude}</p>
                  )}
                </div>
              </div>

              {/* Interactive Map Picker Section */}
              <div className="space-y-2 pt-3">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-xs uppercase tracking-wider text-teal-400">
                    Interactive Map Location Picker <span className="text-rose-400">*</span>
                  </label>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Coords: {formData.latitude.toFixed(5)}°, {formData.longitude.toFixed(5)}°
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Search address or click/drag the pin marker directly to place the property at its exact geographic coordinates.
                </p>

                <PropertyLocationMapPicker
                  latitude={formData.latitude}
                  longitude={formData.longitude}
                  initialQuery={formData.address}
                  onLocationSelect={({ latitude, longitude, address }) => {
                    setFormData((prev) => ({
                      ...prev,
                      latitude,
                      longitude,
                      hasConfirmedLocation: true,
                      address: prev.address || address || "",
                    }));
                    setLatInput(String(latitude));
                    setLngInput(String(longitude));
                    setCoordErrors({});
                  }}
                  className="h-[380px] sm:h-[440px] mt-2"
                />
              </div>
            </div>
          )}

          {/* STEP 3: PHOTOS & MEDIA */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in">
              <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Camera className="w-5 h-5 text-teal-400" />
                    <span>Step 3: Property Photography & Gallery</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Upload multiple high-resolution photographs or choose from curated presets. Designate primary cover.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddSamplePhotos}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/30 text-xs font-bold transition-all self-start sm:self-auto"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Add Sample Presets</span>
                </button>
              </div>

              {/* Upload Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-teal-500 rounded-3xl p-8 text-center cursor-pointer bg-slate-950/50 hover:bg-slate-950 transition-all group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-2xl bg-slate-800 group-hover:bg-teal-500/20 flex items-center justify-center mx-auto mb-3 text-slate-400 group-hover:text-teal-400 transition-colors">
                  {isUploading ? (
                    <Loader2 className="w-6 h-6 animate-spin text-teal-400" />
                  ) : (
                    <Upload className="w-6 h-6" />
                  )}
                </div>
                <h3 className="text-sm font-bold text-white mb-1">
                  Click to upload property photographs
                </h3>
                <p className="text-xs text-slate-500">
                  PNG, JPG, WebP supported. Multiple uploads allowed without fixed limit.
                </p>
              </div>

              {/* Image Previews Grid */}
              {formData.images.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Uploaded Photos ({formData.images.length})
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {formData.images.map((img) => (
                      <div
                        key={img.id}
                        className={`relative rounded-2xl overflow-hidden border group shadow-md bg-slate-900 flex flex-col ${
                          img.isCover ? "border-teal-400 ring-2 ring-teal-400/30" : "border-slate-800"
                        }`}
                      >
                        <div className="aspect-[4/3] relative bg-slate-950 shrink-0">
                          <img
                            src={img.url}
                            alt={img.title || img.caption || "Property photo"}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />

                          {/* Top Badges / Actions */}
                          <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none">
                            {img.isCover ? (
                              <span className="px-2 py-0.5 rounded-full bg-teal-500 text-slate-950 font-extrabold text-[10px] shadow-sm">
                                Cover
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleSetCoverPhoto(img.id)}
                                className="pointer-events-auto px-2 py-0.5 rounded-full bg-slate-950/80 hover:bg-teal-500 hover:text-slate-950 text-white text-[10px] font-semibold backdrop-blur-xs transition-colors"
                              >
                                Set Cover
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleRemovePhoto(img.id)}
                              className="pointer-events-auto p-1 rounded-full bg-slate-950/80 hover:bg-rose-500 text-white transition-colors"
                              title="Remove photo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Image Title Field */}
                        <div className="p-2.5 bg-slate-900 border-t border-slate-800 space-y-1">
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Image Title
                          </label>
                          <input
                            type="text"
                            maxLength={120}
                            placeholder="Enter image title"
                            value={img.title || ""}
                            onChange={(e) => handleImageTitleChange(img.id, e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-slate-600 focus:outline-none transition-colors font-medium"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: DETAILS, AMENITIES & PRICING */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-in fade-in">
              <div className="border-b border-slate-800 pb-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-teal-400" />
                  <span>Step 4: Pricing, Capacity & Amenities</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Review starting rates, accommodations capacity, and select luxury amenities.
                </p>
              </div>

              {/* Pricing Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-semibold text-slate-300">
                      Base Price (Minimum Starting Price)
                    </label>
                    <span className="text-[10px] text-teal-400 font-medium bg-teal-500/10 px-2 py-0.5 rounded-full border border-teal-500/20">
                      Configured in Step 1
                    </span>
                  </div>
                  <div className="text-xl font-bold font-mono text-white mt-2">
                    {formatPrice(formData.pricePerNight, { currency: "USD" })}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Minimum starting price for this property. Return to Step 1 to update.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                  <label className="block font-semibold text-slate-300 mb-1">
                    Original Strike-through Price (USD)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm pointer-events-none">
                      $
                    </span>
                    <input
                      type="number"
                      min="0"
                      placeholder="e.g. 350"
                      value={!formData.originalPrice || Number(formData.originalPrice) === 0 ? "" : formData.originalPrice}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => {
                        const raw = e.target.value;
                        if (!raw) {
                          setFormData({ ...formData, originalPrice: undefined });
                          return;
                        }
                        const clean = raw.replace(/^0+/, "");
                        setFormData({
                          ...formData,
                          originalPrice: clean ? Number(clean) : undefined,
                        });
                      }}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-4 py-2.5 text-white font-mono font-bold text-base focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Optional higher price shown crossed-out.</p>
                </div>
              </div>

              {/* ─────────────────────────────────────────────────────────────
                  ADVANCED PRICING CONFIGURATION (Nightly, Seasonal, Activities)
              ───────────────────────────────────────────────────────────── */}
              <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Tag className="w-4 h-4 text-teal-400" />
                      <span>Pricing Configuration</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Manage rates by day, season and optional services.
                    </p>
                  </div>

                  {/* Tabs */}
                  <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 p-1 rounded-xl self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setPricingActiveTab("nightly")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        pricingActiveTab === "nightly"
                          ? "bg-teal-500 text-slate-950 shadow-sm"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Nightly Rates
                    </button>
                    <button
                      type="button"
                      onClick={() => setPricingActiveTab("seasonal")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        pricingActiveTab === "seasonal"
                          ? "bg-teal-500 text-slate-950 shadow-sm"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Seasonal & Special Dates
                    </button>
                    <button
                      type="button"
                      onClick={() => setPricingActiveTab("activities")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        pricingActiveTab === "activities"
                          ? "bg-teal-500 text-slate-950 shadow-sm"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Extra Activities
                    </button>
                  </div>
                </div>

                {/* TAB 1: NIGHTLY RATES */}
                {pricingActiveTab === "nightly" && (
                  <div className="space-y-5">
                    {/* Weekday & Weekend Rates Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Weekday Rate */}
                      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                            <Sun className="w-3.5 h-3.5 text-amber-400" />
                            <span>Weekday Rate (USD)</span>
                          </label>
                          <span className="text-[10px] text-slate-400">Standard</span>
                        </div>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xs pointer-events-none">
                            $
                          </span>
                          <input
                            type="number"
                            min="0"
                            placeholder="Enter weekday nightly rate"
                            value={!formData.weekdayRate || Number(formData.weekdayRate) === 0 ? "" : formData.weekdayRate}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => {
                              const raw = e.target.value;
                              if (!raw) {
                                setFormData({ ...formData, weekdayRate: "" });
                                return;
                              }
                              const clean = raw.replace(/^0+/, "");
                              setFormData({
                                ...formData,
                                weekdayRate: clean ? Number(clean) : "",
                              });
                            }}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-7 pr-3 py-2 text-white font-mono font-semibold text-sm focus:outline-none focus:border-teal-500"
                          />
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Standard accommodation rate for weekday nights.
                        </p>
                      </div>

                      {/* Weekend Rate */}
                      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                            <Moon className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Weekend Rate (USD)</span>
                          </label>
                          <span className="text-[10px] text-teal-400">Premium</span>
                        </div>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xs pointer-events-none">
                            $
                          </span>
                          <input
                            type="number"
                            min="0"
                            placeholder="Enter weekend nightly rate"
                            value={!formData.weekendRate || Number(formData.weekendRate) === 0 ? "" : formData.weekendRate}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => {
                              const raw = e.target.value;
                              if (!raw) {
                                setFormData({ ...formData, weekendRate: "" });
                                return;
                              }
                              const clean = raw.replace(/^0+/, "");
                              setFormData({
                                ...formData,
                                weekendRate: clean ? Number(clean) : "",
                              });
                            }}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-7 pr-3 py-2 text-white font-mono font-bold text-sm focus:outline-none focus:border-teal-500"
                          />
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Standard accommodation rate for weekend nights.
                        </p>
                      </div>
                    </div>

                    {/* Configurable Weekend Days */}
                    <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <div>
                          <label className="text-xs font-bold text-white uppercase tracking-wider">
                            Weekend Days Selection
                          </label>
                          <p className="text-[11px] text-slate-400">
                            Select which days qualify for the weekend rate (defaults to Friday and Saturday for international luxury stays).
                          </p>
                        </div>
                        <span className="text-[10px] text-teal-300 font-semibold bg-teal-500/10 border border-teal-500/30 px-2 py-0.5 rounded-md self-start sm:self-auto">
                          {formData.weekendDays.length} Days Selected
                        </span>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {[
                          { idx: 0, label: "Sun" },
                          { idx: 1, label: "Mon" },
                          { idx: 2, label: "Tue" },
                          { idx: 3, label: "Wed" },
                          { idx: 4, label: "Thu" },
                          { idx: 5, label: "Fri" },
                          { idx: 6, label: "Sat" },
                        ].map((d) => {
                          const isSelected = formData.weekendDays.includes(d.idx);
                          return (
                            <button
                              key={d.idx}
                              type="button"
                              onClick={() => handleToggleWeekendDay(d.idx)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                                isSelected
                                  ? "bg-teal-500/20 text-teal-300 border-teal-500/40 shadow-sm"
                                  : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800"
                              }`}
                            >
                              {d.label} {isSelected && "✓"}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Weekly Rate Overview (7 days) */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                          Weekly Rate Overview
                        </label>
                        <span className="text-[10px] text-slate-500">Live preview of standard 7-day cycle</span>
                      </div>

                      <div className="grid grid-cols-7 gap-1.5 sm:gap-2 text-center">
                        {[
                          { idx: 0, day: "Sun" },
                          { idx: 1, day: "Mon" },
                          { idx: 2, day: "Tue" },
                          { idx: 3, day: "Wed" },
                          { idx: 4, day: "Thu" },
                          { idx: 5, day: "Fri" },
                          { idx: 6, day: "Sat" },
                        ].map((item) => {
                          const isWknd = formData.weekendDays.includes(item.idx);
                          const basePriceNum = Number(formData.pricePerNight) || 0;
                          const weekdayNum =
                            formData.weekdayRate !== "" && !isNaN(Number(formData.weekdayRate))
                              ? Number(formData.weekdayRate)
                              : basePriceNum;
                          const weekendNum =
                            formData.weekendRate !== "" && !isNaN(Number(formData.weekendRate))
                              ? Number(formData.weekendRate)
                              : (weekdayNum || basePriceNum);
                          const dayRate = isWknd ? weekendNum : weekdayNum;

                          return (
                            <div
                              key={item.day}
                              className={`p-2.5 rounded-xl border transition-all ${
                                isWknd
                                  ? "bg-teal-500/10 border-teal-500/30 text-teal-300"
                                  : "bg-slate-900 border-slate-800 text-slate-300"
                              }`}
                            >
                              <span className="block text-[11px] font-bold uppercase tracking-wider mb-1">
                                {item.day}
                              </span>
                              <span className="block font-mono font-bold text-xs sm:text-sm text-white">
                                {formatPrice(dayRate, { currency: "USD" })}
                              </span>
                              <span
                                className={`block text-[9px] uppercase font-semibold mt-1 ${
                                  isWknd ? "text-teal-400" : "text-slate-500"
                                }`}
                              >
                                {isWknd ? "Weekend" : "Weekday"}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: SEASONAL & SPECIAL DATES */}
                {pricingActiveTab === "seasonal" && (
                  <div className="space-y-6">
                    {/* Priority Banner */}
                    <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/20 text-xs text-teal-300 flex items-center justify-between flex-wrap gap-2">
                      <span className="font-semibold">
                        Automatic Rate Priority: Special-Date Rate → Seasonal Rate → Weekend/Weekday Rate
                      </span>
                      <span className="text-[10px] text-teal-400 font-mono">Highest specificity applies</span>
                    </div>

                    {/* Section 1: Seasonal Pricing */}
                    <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4">
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                          Seasonal Pricing Rules ({formData.seasonalRates.length})
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Define custom nightly rates for high, peak, or holiday seasons across calendar date ranges.
                        </p>
                      </div>

                      {/* Add / Edit Season Form */}
                      <form onSubmit={handleSaveSeasonRule} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                          <div>
                            <label className="block text-slate-300 font-semibold mb-1">
                              Season Name *
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. Christmas Peak, Summer Season"
                              value={newSeasonName}
                              onChange={(e) => setNewSeasonName(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-slate-300 font-semibold mb-1">Start Date *</label>
                              <input
                                type="date"
                                value={newSeasonStart}
                                onChange={(e) => setNewSeasonStart(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-teal-500"
                              />
                            </div>
                            <div>
                              <label className="block text-slate-300 font-semibold mb-1">End Date *</label>
                              <input
                                type="date"
                                value={newSeasonEnd}
                                onChange={(e) => setNewSeasonEnd(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-teal-500"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-slate-300 font-semibold mb-1">
                              Seasonal Nightly Rate (USD) *
                            </label>
                            <div className="relative">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xs pointer-events-none">
                                $
                              </span>
                              <input
                                type="number"
                                min="1"
                                placeholder="e.g. 350"
                                value={newSeasonRate}
                                onFocus={(e) => e.target.select()}
                                onChange={(e) => setNewSeasonRate(e.target.value.replace(/^0+/, ""))}
                                className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-6 pr-3 py-1.5 text-white font-mono font-semibold focus:outline-none focus:border-teal-500 text-xs"
                              />
                            </div>
                          </div>
                        </div>

                        {seasonFormError && (
                          <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>{seasonFormError}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="submit"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold transition-all shadow-sm cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>{editingSeasonId ? "Update Seasonal Rule" : "Add Seasonal Rule"}</span>
                          </button>
                          {editingSeasonId && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingSeasonId(null);
                                setNewSeasonName("");
                                setNewSeasonStart("");
                                setNewSeasonEnd("");
                                setNewSeasonRate("");
                                setSeasonFormError("");
                              }}
                              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </form>

                      {/* Configured Seasons List */}
                      {formData.seasonalRates.length > 0 && (
                        <div className="space-y-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                            Configured Seasons
                          </span>
                          <div className="divide-y divide-slate-800/80 border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
                            {formData.seasonalRates.map((season) => (
                              <div
                                key={season.id}
                                className="p-3 flex items-center justify-between gap-3 text-xs flex-wrap"
                              >
                                <div>
                                  <span className="font-bold text-white block">{season.name}</span>
                                  <span className="text-[11px] text-slate-400 font-mono">
                                    {season.startDate} to {season.endDate}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="font-mono font-bold text-teal-300 text-sm">
                                    {formatPrice(season.nightlyRate, { currency: "USD" })}
                                    <span className="text-[10px] text-slate-400 font-normal"> / night</span>
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleEditSeasonRule(season)}
                                    className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                                    title="Edit rule"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteSeasonRule(season.id)}
                                    className="p-1 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                                    title="Delete rule"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Section 2: Special-Date & Holiday Pricing */}
                    <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4">
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                          Special-Date & Holiday Pricing ({formData.specialDateRates.length})
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Apply specific nightly rates for holidays (New Year's Eve, Christmas, local festivals). Takes highest precedence.
                        </p>
                      </div>

                      {/* Add / Edit Special Date Form */}
                      <form onSubmit={handleSaveSpecialDateRule} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                          <div>
                            <label className="block text-slate-300 font-semibold mb-1">
                              Holiday / Event Name *
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. New Year's Eve, Christmas"
                              value={newSpecialName}
                              onChange={(e) => setNewSpecialName(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-slate-300 font-semibold mb-1">Start Date *</label>
                              <input
                                type="date"
                                value={newSpecialStart}
                                onChange={(e) => setNewSpecialStart(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-teal-500"
                              />
                            </div>
                            <div>
                              <label className="block text-slate-300 font-semibold mb-1">End Date</label>
                              <input
                                type="date"
                                value={newSpecialEnd}
                                onChange={(e) => setNewSpecialEnd(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-teal-500"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-slate-300 font-semibold mb-1">
                              Special Nightly Rate (USD) *
                            </label>
                            <div className="relative">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xs pointer-events-none">
                                $
                              </span>
                              <input
                                type="number"
                                min="1"
                                placeholder="e.g. 450"
                                value={newSpecialRate}
                                onFocus={(e) => e.target.select()}
                                onChange={(e) => setNewSpecialRate(e.target.value.replace(/^0+/, ""))}
                                className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-6 pr-3 py-1.5 text-white font-mono font-semibold focus:outline-none focus:border-teal-500 text-xs"
                              />
                            </div>
                          </div>
                        </div>

                        {specialFormError && (
                          <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>{specialFormError}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="submit"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold transition-all shadow-sm cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>{editingSpecialId ? "Update Special Date Rule" : "Add Special Date Rule"}</span>
                          </button>
                          {editingSpecialId && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingSpecialId(null);
                                setNewSpecialName("");
                                setNewSpecialStart("");
                                setNewSpecialEnd("");
                                setNewSpecialRate("");
                                setSpecialFormError("");
                              }}
                              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </form>

                      {/* Configured Special Dates List */}
                      {formData.specialDateRates.length > 0 && (
                        <div className="space-y-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                            Configured Special Dates
                          </span>
                          <div className="divide-y divide-slate-800/80 border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
                            {formData.specialDateRates.map((sp) => (
                              <div
                                key={sp.id}
                                className="p-3 flex items-center justify-between gap-3 text-xs flex-wrap"
                              >
                                <div>
                                  <span className="font-bold text-white block">{sp.name}</span>
                                  <span className="text-[11px] text-slate-400 font-mono">
                                    {sp.startDate} {sp.endDate && sp.endDate !== sp.startDate ? `to ${sp.endDate}` : ""}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="font-mono font-bold text-teal-300 text-sm">
                                    {formatPrice(sp.nightlyRate, { currency: "USD" })}
                                    <span className="text-[10px] text-slate-400 font-normal"> / night</span>
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleEditSpecialDateRule(sp)}
                                    className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                                    title="Edit rule"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteSpecialDateRule(sp.id)}
                                    className="p-1 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                                    title="Delete rule"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 3: EXTRA ACTIVITIES */}
                {pricingActiveTab === "activities" && (
                  <div className="space-y-5">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                        Optional Paid Activities & Additional Services ({formData.paidActivities.length})
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Configure add-on services (Airport Transfer, Private Chef, Guided Tour, Spa) available for guest selection.
                      </p>
                    </div>

                    {/* Add / Edit Activity Form */}
                    <form onSubmit={handleSaveActivity} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div>
                          <label className="block text-slate-300 font-semibold mb-1">
                            Activity / Service Name *
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Airport Transfer, Private Chef, Spa"
                            value={newActivityName}
                            onChange={(e) => setNewActivityName(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-300 font-semibold mb-1">
                            Price (USD) *
                          </label>
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xs pointer-events-none">
                              $
                            </span>
                            <input
                              type="number"
                              min="0"
                              placeholder="e.g. 45"
                              value={newActivityPrice}
                              onFocus={(e) => e.target.select()}
                              onChange={(e) => setNewActivityPrice(e.target.value.replace(/^0+/, ""))}
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-6 pr-3 py-1.5 text-white font-mono font-semibold focus:outline-none focus:border-teal-500 text-xs"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-slate-300 font-semibold mb-1">
                            Charge Type *
                          </label>
                          <select
                            value={newActivityChargeType}
                            onChange={(e) => setNewActivityChargeType(e.target.value as PaidActivityChargeType)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-teal-500 cursor-pointer"
                          >
                            <option value="PER_BOOKING">Per Booking (Flat fee once per stay)</option>
                            <option value="PER_PERSON">Per Person (Multiplied by guest count)</option>
                            <option value="PER_SESSION">Per Session (Single appointment)</option>
                            <option value="PER_TRIP">Per Trip (Single one-way / round trip)</option>
                          </select>
                        </div>
                      </div>

                      {activityFormError && (
                        <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{activityFormError}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="submit"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold transition-all shadow-sm cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>{editingActivityId ? "Update Activity" : "Add Activity"}</span>
                        </button>
                        {editingActivityId && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingActivityId(null);
                              setNewActivityName("");
                              setNewActivityPrice("");
                              setNewActivityChargeType("PER_BOOKING");
                              setActivityFormError("");
                            }}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </form>

                    {/* Configured Activities List */}
                    {formData.paidActivities.length > 0 ? (
                      <div className="divide-y divide-slate-800/80 border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
                        {formData.paidActivities.map((act) => {
                          const chargeTypeLabels: Record<string, string> = {
                            PER_BOOKING: "Per Booking",
                            PER_PERSON: "Per Person",
                            PER_SESSION: "Per Session",
                            PER_TRIP: "Per Trip",
                          };
                          return (
                            <div
                              key={act.id}
                              className="p-3 flex items-center justify-between gap-3 text-xs flex-wrap"
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-white">{act.name}</span>
                                <span className="text-[10px] font-semibold bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md border border-slate-700">
                                  {chargeTypeLabels[act.chargeType] || act.chargeType}
                                </span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="font-mono font-bold text-teal-300 text-sm">
                                  {formatPrice(act.price, { currency: "USD" })}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleEditActivity(act)}
                                  className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                                  title="Edit activity"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteActivity(act.id)}
                                  className="p-1 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                                  title="Delete activity"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-6 text-center border border-dashed border-slate-800 rounded-xl text-xs text-slate-500">
                        No optional paid activities added yet. Use the form above to add airport pickup, chef service, spa, or excursions.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ─────────────────────────────────────────────────────────────
                  PHASE 10: PRICING CHECK & ESTIMATE (Interactive Calculator)
              ───────────────────────────────────────────────────────────── */}
              <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 flex-wrap gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Clock className="w-4 h-4 text-teal-400" />
                      <span>Pricing Check & Estimate</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Preview how nightly rates and selected extras affect a sample booking.
                    </p>
                  </div>
                  <span className="text-[10px] text-teal-300 font-semibold bg-teal-500/10 border border-teal-500/30 px-2.5 py-1 rounded-lg">
                    Real-Time Rate Verification
                  </span>
                </div>

                {/* Calculator Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Check-in Date</label>
                    <input
                      type="date"
                      value={calcCheckIn}
                      onChange={(e) => setCalcCheckIn(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-teal-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Check-out Date</label>
                    <input
                      type="date"
                      value={calcCheckOut}
                      onChange={(e) => setCalcCheckOut(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-teal-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Number of Guests</label>
                    <select
                      value={Math.min(calcGuests, Math.max(1, Number(formData.maxGuests) || 4))}
                      onChange={(e) => setCalcGuests(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-teal-500 cursor-pointer font-medium"
                    >
                      {Array.from({ length: Math.max(1, Number(formData.maxGuests) || 4) }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n}>
                          {n} {n === 1 ? "Guest" : "Guests"}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Optional Activities Selector */}
                {formData.paidActivities.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                      Sample Selected Extras
                    </span>
                    <div className="flex items-center gap-2 flex-wrap">
                      {formData.paidActivities.map((act) => {
                        const isSelected = calcSelectedExtras.includes(act.id);
                        return (
                          <button
                            key={act.id}
                            type="button"
                            onClick={() => handleToggleExtraInCalculator(act.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
                              isSelected
                                ? "bg-teal-500/20 text-teal-300 border-teal-500/40"
                                : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
                            }`}
                          >
                            <span>{act.name} ({formatPrice(act.price, { currency: "USD" })})</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-teal-400" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Calculation Output Card */}
                {stayEstimate.error ? (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{stayEstimate.error}</span>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800/80">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-300 font-semibold">
                          Accommodation ({stayEstimate.nightsCount} {stayEstimate.nightsCount === 1 ? "night" : "nights"})
                        </span>
                        <button
                          type="button"
                          onClick={() => setCalcShowNightlyBreakdown(!calcShowNightlyBreakdown)}
                          className="text-[10px] text-teal-400 hover:text-teal-300 underline font-medium cursor-pointer"
                        >
                          {calcShowNightlyBreakdown ? "Hide Breakdown" : "View Nightly Breakdown"}
                        </button>
                      </div>
                      <span className="font-mono font-bold text-white text-sm">
                        {formatPrice(stayEstimate.accommodationTotal || 0, { currency: "USD" })}
                      </span>
                    </div>

                    {/* Expandable Nightly Breakdown */}
                    {calcShowNightlyBreakdown && stayEstimate.nightlyBreakdown && (
                      <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5 text-xs">
                        {stayEstimate.nightlyBreakdown.map((nb) => (
                          <div key={nb.date} className="flex items-center justify-between text-[11px] font-mono">
                            <span className="text-slate-400">
                              {nb.date} ({nb.dayName.slice(0, 3)}) —{" "}
                              <span
                                className={
                                  nb.ruleType === "special"
                                    ? "text-rose-400 font-semibold"
                                    : nb.ruleType === "seasonal"
                                    ? "text-amber-400 font-semibold"
                                    : nb.ruleType === "weekend"
                                    ? "text-teal-400 font-semibold"
                                    : "text-slate-300"
                                }
                              >
                                {nb.ruleName || nb.ruleType}
                              </span>
                            </span>
                            <span className="text-white font-bold">
                              {formatPrice(nb.rate, { currency: "USD" })}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Extras Breakdown */}
                    {stayEstimate.extrasBreakdown && stayEstimate.extrasBreakdown.length > 0 && (
                      <div className="space-y-1.5 pb-2 border-b border-slate-800/80 text-xs">
                        <div className="flex items-center justify-between text-slate-300 font-semibold">
                          <span>Selected Extras ({stayEstimate.extrasBreakdown.length})</span>
                          <span className="font-mono font-bold text-white text-sm">
                            {formatPrice(stayEstimate.extrasTotal || 0, { currency: "USD" })}
                          </span>
                        </div>
                        {stayEstimate.extrasBreakdown.map((eb) => (
                          <div key={eb.activityId} className="flex items-center justify-between text-[11px] text-slate-400 font-mono pl-2">
                            <span>
                              {eb.name} ({eb.quantity > 1 ? `${eb.quantity} × ` : ""}{formatPrice(eb.price, { currency: "USD" })})
                            </span>
                            <span className="text-slate-200">
                              {formatPrice(eb.total, { currency: "USD" })}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Final Estimated Total */}
                    <div className="flex items-center justify-between pt-1">
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-white block">
                          Estimated Total
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Average: {formatPrice(stayEstimate.averageNightlyRate || 0, { currency: "USD" })} / night
                        </span>
                      </div>
                      <span className="font-mono font-extrabold text-teal-300 text-xl">
                        {formatPrice(stayEstimate.estimatedTotal || 0, { currency: "USD" })}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 text-[10px] text-slate-500 leading-relaxed">
                      <strong>Note:</strong> Estimate reflects configured accommodation rules and selected extras. Taxes, platform charges, and security deposits are calculated at guest checkout.
                    </div>
                  </div>
                )}
              </div>

              {/* Capacity & Timings */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs sm:text-sm">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Max Guests</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 4"
                    value={!formData.maxGuests || Number(formData.maxGuests) === 0 ? "" : formData.maxGuests}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      const raw = e.target.value;
                      if (!raw) {
                        setFormData({ ...formData, maxGuests: "" as any });
                        return;
                      }
                      const clean = raw.replace(/^0+/, "");
                      if (!clean) {
                        setFormData({ ...formData, maxGuests: "" as any });
                      } else {
                        const parsed = parseInt(clean, 10);
                        setFormData({ ...formData, maxGuests: isNaN(parsed) ? ("" as any) : parsed });
                      }
                    }}
                    onBlur={() => {
                      if (!formData.maxGuests || Number(formData.maxGuests) < 1) {
                        setFormData({ ...formData, maxGuests: 2 });
                      }
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-teal-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Bedrooms</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 2"
                    value={!formData.bedrooms || Number(formData.bedrooms) === 0 ? "" : formData.bedrooms}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      const raw = e.target.value;
                      if (!raw) {
                        setFormData({ ...formData, bedrooms: "" as any });
                        return;
                      }
                      const clean = raw.replace(/^0+/, "");
                      if (!clean) {
                        setFormData({ ...formData, bedrooms: "" as any });
                      } else {
                        const parsed = parseInt(clean, 10);
                        setFormData({ ...formData, bedrooms: isNaN(parsed) ? ("" as any) : parsed });
                      }
                    }}
                    onBlur={() => {
                      if (!formData.bedrooms || Number(formData.bedrooms) < 1) {
                        setFormData({ ...formData, bedrooms: 1 });
                      }
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-teal-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Bathrooms</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 2"
                    value={!formData.bathrooms || Number(formData.bathrooms) === 0 ? "" : formData.bathrooms}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      const raw = e.target.value;
                      if (!raw) {
                        setFormData({ ...formData, bathrooms: "" as any });
                        return;
                      }
                      const clean = raw.replace(/^0+/, "");
                      if (!clean) {
                        setFormData({ ...formData, bathrooms: "" as any });
                      } else {
                        const parsed = parseInt(clean, 10);
                        setFormData({ ...formData, bathrooms: isNaN(parsed) ? ("" as any) : parsed });
                      }
                    }}
                    onBlur={() => {
                      if (!formData.bathrooms || Number(formData.bathrooms) < 1) {
                        setFormData({ ...formData, bathrooms: 1 });
                      }
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-teal-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Check-in / Check-out</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      placeholder="14:00"
                      value={formData.checkInTime}
                      onChange={(e) => setFormData({ ...formData, checkInTime: e.target.value })}
                      className="w-1/2 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-white text-center text-xs focus:outline-none focus:border-teal-500 font-medium"
                    />
                    <input
                      type="text"
                      placeholder="11:00"
                      value={formData.checkOutTime}
                      onChange={(e) => setFormData({ ...formData, checkOutTime: e.target.value })}
                      className="w-1/2 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-white text-center text-xs focus:outline-none focus:border-teal-500 font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Amenities Grid */}
              <div className="space-y-3 pt-2">
                <label className="block font-bold text-xs uppercase tracking-wider text-slate-400">
                  Selected Amenities ({formData.amenities.length})
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                  {PREDEFINED_AMENITIES.map((amenity) => {
                    const selected = formData.amenities.includes(amenity);
                    return (
                      <button
                        key={amenity}
                        type="button"
                        onClick={() => handleToggleAmenity(amenity)}
                        className={`p-2.5 rounded-xl text-xs font-semibold flex items-center justify-between text-left transition-all ${
                          selected
                            ? "bg-teal-500/20 text-teal-300 border border-teal-500/40"
                            : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800"
                        }`}
                      >
                        <span className="truncate">{amenity}</span>
                        {selected && <Check className="w-3.5 h-3.5 text-teal-400 shrink-0 ml-1.5" />}
                      </button>
                    );
                  })}
                </div>

                {/* Add Custom Amenity */}
                <form onSubmit={handleAddCustomAmenity} className="flex items-center gap-2 pt-2 max-w-md">
                  <input
                    type="text"
                    placeholder="Add custom amenity (e.g. Helipad, Golf Course)..."
                    value={customAmenity}
                    onChange={(e) => setCustomAmenity(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                  />
                  <button
                    type="submit"
                    disabled={!customAmenity.trim()}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-xs font-semibold rounded-xl transition-colors"
                  >
                    Add
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* STEP 5: PROPERTY POLICIES (Rules, Refunds, Contracts & Additional Notes) */}
          {currentStep === 5 && (
            <div className="space-y-6 animate-in fade-in">
              <div className="border-b border-slate-800 pb-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-teal-400" />
                  <span>Step 5: Property Policies — Rules, Refunds & Terms</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Establish comprehensive property rules, refund deadlines, guest contracts and stay guidelines. All fields are optional and formatted with multiline support.
                </p>
              </div>

              {/* 2x2 Policy Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* 1. General Policy */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-4 hover:border-slate-700 transition-colors">
                  <div>
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-white">General Policy & House Rules</h3>
                          <p className="text-[11px] text-slate-400">Rules, check-in criteria, smoking & pets</p>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {(formData.policies?.generalPolicy || "").length} / 5,000
                      </span>
                    </div>

                    <textarea
                      rows={7}
                      placeholder="Enter property rules, guest responsibilities, check-in requirements, smoking restrictions, pet policies and other general guidelines..."
                      value={formData.policies?.generalPolicy || ""}
                      maxLength={5000}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          policies: {
                            ...prev.policies,
                            generalPolicy: e.target.value,
                          },
                        }))
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500 transition-colors resize-y leading-relaxed"
                    />
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-2 border-t border-slate-800/60">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-500/60 shrink-0" />
                    <span>Displayed to guests on property page under House Rules.</span>
                  </div>
                </div>

                {/* 2. Refund & Cancellation Policy */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-4 hover:border-slate-700 transition-colors">
                  <div>
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                          <RotateCcw className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-white">Refund & Cancellation Policy</h3>
                          <p className="text-[11px] text-slate-400">Deadlines, refund eligibility & fees</p>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {(formData.policies?.refundPolicy || "").length} / 5,000
                      </span>
                    </div>

                    <textarea
                      rows={7}
                      placeholder="Describe cancellation deadlines, full or partial refund eligibility, non-refundable charges, refund processing conditions and applicable exceptions..."
                      value={formData.policies?.refundPolicy || ""}
                      maxLength={5000}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          policies: {
                            ...prev.policies,
                            refundPolicy: e.target.value,
                          },
                        }))
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500 transition-colors resize-y leading-relaxed"
                    />
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-2 border-t border-slate-800/60">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-500/60 shrink-0" />
                    <span>Governs cancellation timelines & booking refund terms.</span>
                  </div>
                </div>

                {/* 3. Contract Policy */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-4 hover:border-slate-700 transition-colors">
                  <div>
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-white">Contract & Legal Agreement</h3>
                          <p className="text-[11px] text-slate-400">Damage rules, deposits & legal liabilities</p>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {(formData.policies?.contractPolicy || "").length} / 5,000
                      </span>
                    </div>

                    <textarea
                      rows={7}
                      placeholder="Enter property-specific booking agreements, guest responsibilities, security deposit conditions, property damage rules and contractual obligations..."
                      value={formData.policies?.contractPolicy || ""}
                      maxLength={5000}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          policies: {
                            ...prev.policies,
                            contractPolicy: e.target.value,
                          },
                        }))
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500 transition-colors resize-y leading-relaxed"
                    />
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-2 border-t border-slate-800/60">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500/60 shrink-0" />
                    <span>Included in official booking confirmation contract terms.</span>
                  </div>
                </div>

                {/* 4. Additional Notes */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-4 hover:border-slate-700 transition-colors">
                  <div>
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                          <Info className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-white">Additional Notes & Arrival Instructions</h3>
                          <p className="text-[11px] text-slate-400">Directions, accessibility, special requests</p>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {(formData.policies?.additionalNotes || "").length} / 5,000
                      </span>
                    </div>

                    <textarea
                      rows={7}
                      placeholder="Enter additional instructions, arrival information, accessibility details, special arrangements or other important notes for guests..."
                      value={formData.policies?.additionalNotes || ""}
                      maxLength={5000}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          policies: {
                            ...prev.policies,
                            additionalNotes: e.target.value,
                          },
                        }))
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500 transition-colors resize-y leading-relaxed"
                    />
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-2 border-t border-slate-800/60">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-500/60 shrink-0" />
                    <span>Shared in guest confirmation itinerary & pre-arrival email.</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: PROPERTY REVIEWS (Summary, Add/Edit Form & Reviews List) */}
          {currentStep === 6 && (
            <div className="space-y-6 animate-in fade-in">
              <div className="border-b border-slate-800 pb-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                  <span>Step 6: Property Reviews</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Manage authentic guest feedback and ratings associated with this property.
                </p>
              </div>

              {/* 1. Review Summary (3 Cards) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Card 1: Total Reviews */}
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Total Reviews</span>
                    <span className="text-2xl font-bold text-white mt-1 block">{reviewSummary.total}</span>
                    <span className="text-[11px] text-slate-500 mt-0.5 block">Recorded guest reviews</span>
                  </div>
                  <div className="w-11 h-11 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                </div>

                {/* Card 2: Average Rating */}
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Average Rating</span>
                    <span className="text-2xl font-bold text-amber-400 mt-1 flex items-center gap-1.5">
                      {reviewSummary.average}
                    </span>
                    <span className="text-[11px] text-slate-500 mt-0.5 block">Based on property stays</span>
                  </div>
                  <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                    <Star className="w-5 h-5 fill-amber-400" />
                  </div>
                </div>

                {/* Card 3: Rating Scale */}
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Rating Scale</span>
                    <span className="text-2xl font-bold text-teal-300 mt-1 block">1 – 5 Stars</span>
                    <span className="text-[11px] text-slate-500 mt-0.5 block">Standard international scale</span>
                  </div>
                  <div className="w-11 h-11 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-400">
                    <Sparkles className="w-5 h-5 text-teal-400" />
                  </div>
                </div>
              </div>

              {/* 2. Add / Edit Property Review Form */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Edit2 className="w-4 h-4 text-teal-400" />
                      <span>{editingReviewId ? "Edit Property Review" : "Add Property Review"}</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {editingReviewId
                        ? "Update the selected review details. Changes preserve property association."
                        : "Enter details of a genuine guest review. Admin-entered reviews are preserved with source metadata."}
                    </p>
                  </div>
                  {editingReviewId && (
                    <button
                      type="button"
                      onClick={handleCancelEditReview}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Cancel Edit</span>
                    </button>
                  )}
                </div>

                <form onSubmit={handleSaveReview} className="space-y-4">
                  {/* Row: Reviewer Name & Review Date */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Guest / Reviewer Name <span className="text-rose-400">*</span>
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          placeholder="Enter guest's name"
                          value={newReviewAuthor}
                          onChange={(e) => setNewReviewAuthor(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500 transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Review Date <span className="text-rose-400">*</span>
                      </label>
                      <div className="relative">
                        <Calendar className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="date"
                          required
                          max={new Date().toISOString().split("T")[0]}
                          value={newReviewDate}
                          onChange={(e) => setNewReviewDate(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-teal-500 transition-colors [color-scheme:dark]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Field: Interactive Star Rating */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Guest Rating <span className="text-rose-400">*</span>
                    </label>
                    <div className="flex items-center gap-3 bg-slate-950 border border-slate-800 rounded-xl p-3 max-w-md">
                      <div className="flex items-center gap-1.5">
                        {[1, 2, 3, 4, 5].map((starVal) => {
                          const isFilled = starVal <= newReviewRating;
                          return (
                            <button
                              key={starVal}
                              type="button"
                              onClick={() => setNewReviewRating(starVal)}
                              aria-label={`Rate ${starVal} out of 5 stars`}
                              className="p-1 text-slate-600 hover:text-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 rounded-lg transition-transform hover:scale-110 cursor-pointer"
                            >
                              <Star
                                className={`w-5 h-5 transition-colors ${
                                  isFilled ? "text-amber-400 fill-amber-400" : "text-slate-700"
                                }`}
                              />
                            </button>
                          );
                        })}
                      </div>
                      <span className="text-xs font-bold text-amber-400 font-mono">
                        {newReviewRating} / 5 Stars
                      </span>
                      <span className="text-[11px] text-slate-500 ml-auto">
                        {newReviewRating === 5
                          ? "Exceptional"
                          : newReviewRating === 4
                          ? "Very Good"
                          : newReviewRating === 3
                          ? "Average"
                          : newReviewRating === 2
                          ? "Below Average"
                          : "Poor"}
                      </span>
                    </div>
                  </div>

                  {/* Field: Review Title */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Review Title
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Wonderful stay and excellent hospitality"
                      value={newReviewTitle}
                      onChange={(e) => setNewReviewTitle(e.target.value)}
                      maxLength={150}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500 transition-colors"
                    />
                  </div>

                  {/* Field: Guest Review */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-slate-300">
                        Guest Review <span className="text-rose-400">*</span>
                      </label>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {newReviewComment.length} / 5,000
                      </span>
                    </div>
                    <textarea
                      rows={5}
                      required
                      maxLength={5000}
                      placeholder="Enter the guest's actual feedback about this property..."
                      value={newReviewComment}
                      onChange={(e) => setNewReviewComment(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500 transition-colors resize-y leading-relaxed"
                    />
                  </div>

                  {reviewFormError && (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{reviewFormError}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                    <span className="text-[11px] text-slate-500 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                      <span>Reviews are tracked as Admin-Imported (Unverified) for platform transparency.</span>
                    </span>
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-teal-500/20 transition-all cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{editingReviewId ? "Save Changes" : "+ Add Review"}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* 3. Existing Property Reviews List */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <span>Property Reviews ({reviews.length})</span>
                  </h3>
                  {reviews.length > 0 && (
                    <span className="text-xs text-teal-300 font-semibold bg-teal-500/10 border border-teal-500/20 px-3 py-1 rounded-xl">
                      Avg: {reviewSummary.average}
                    </span>
                  )}
                </div>

                {reviews.length === 0 ? (
                  <div className="py-12 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 mx-auto mb-3">
                      <MessageSquare className="w-6 h-6" />
                    </div>
                    <h4 className="text-sm font-bold text-white">No Reviews Added Yet</h4>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 leading-relaxed">
                      Use the form above to add genuine traveler reviews and ratings for this property. Reviews are saved with draft/published state.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {reviews.map((rev) => (
                      <div
                        key={rev.id}
                        className="p-5 rounded-2xl bg-slate-950 border border-slate-800/90 hover:border-slate-700 transition-colors space-y-3"
                      >
                        {/* Top: Author, Stars & Date */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-800/60">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-300 font-bold text-xs uppercase">
                              {rev.author ? rev.author.slice(0, 2) : "G"}
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                <span>{rev.author}</span>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                                  Admin-Imported
                                </span>
                              </h4>
                              <span className="text-[11px] text-slate-500">
                                {rev.date || (rev.createdAt ? rev.createdAt.split("T")[0] : "Recent stay")}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 self-start sm:self-auto">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-3.5 h-3.5 ${
                                  star <= rev.rating ? "text-amber-400 fill-amber-400" : "text-slate-800"
                                }`}
                              />
                            ))}
                            <span className="text-xs font-bold text-amber-400 ml-1.5 font-mono">
                              {rev.rating}.0
                            </span>
                          </div>
                        </div>

                        {/* Title & Feedback */}
                        <div>
                          {rev.title && (
                            <h5 className="text-xs font-bold text-teal-300 mb-1">{rev.title}</h5>
                          )}
                          <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                            {rev.comment}
                          </p>
                        </div>

                        {/* Card Footer: Actions & Metadata */}
                        <div className="flex items-center justify-between pt-2 text-xs">
                          <span className="text-[10px] text-slate-500">
                            Status: <strong className="text-slate-400 uppercase">{rev.status || "approved"}</strong>
                          </span>

                          <div className="flex items-center gap-2">
                            {reviewDeleteConfirmId === rev.id ? (
                              <div className="flex items-center gap-1.5 animate-in fade-in">
                                <span className="text-[11px] text-rose-400 font-semibold">Delete review?</span>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteReview(rev.id)}
                                  className="px-2.5 py-1 rounded-lg bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold text-[11px] transition-colors cursor-pointer"
                                >
                                  Yes, Delete
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setReviewDeleteConfirmId(null)}
                                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition-colors cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleStartEditReview(rev)}
                                  className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-teal-400 border border-slate-800 text-xs font-semibold transition-colors cursor-pointer"
                                  title="Edit Review"
                                >
                                  <Edit2 className="w-3 h-3" />
                                  <span>Edit</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setReviewDeleteConfirmId(rev.id)}
                                  className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-slate-900 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-800 text-xs font-semibold transition-colors cursor-pointer"
                                  title="Delete Review"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span>Delete</span>
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 7: OWNER INFORMATION & PUBLISHING */}
          {currentStep === 7 && (
            <div className="space-y-6 animate-in fade-in">
              <div className="border-b border-slate-800 pb-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-teal-400" />
                  <span>Step 7: Owner Association & Publication Badges</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Choose how this property is managed, configure contact information, and assign featured badges.
                </p>
              </div>

              {/* Owner Association Options */}
              <div className="space-y-3">
                <label className="block font-semibold text-slate-300 text-xs uppercase tracking-wider">
                  Property Ownership Mode
                </label>
                {role === "owner" ? (
                  <div className="p-5 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-white space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <User className="w-5 h-5 text-teal-400" />
                        <span className="font-bold text-sm text-teal-300">Registered Owner Account</span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/40">
                        Verified Host
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1 border-t border-teal-500/20">
                      <div>
                        <span className="text-slate-400 text-[10px] block">Host Name</span>
                        <span className="font-semibold text-white">{owner?.fullName || formData.contactPerson || "Host"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block">Email Address</span>
                        <span className="font-semibold text-white">{owner?.email || formData.email || "—"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block">Mobile / WhatsApp</span>
                        <span className="font-semibold text-white">{owner?.mobileNumber || formData.mobileNumber || "—"}</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-400 italic">
                      This property will be registered and managed under your verified owner account.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div
                        onClick={() => setOwnerMode("admin_managed")}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                          ownerMode === "admin_managed"
                            ? "bg-teal-500/10 border-teal-500/40 text-white"
                            : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/40"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-bold text-sm text-teal-300">Admin Managed</span>
                          {ownerMode === "admin_managed" && <Check className="w-4 h-4 text-teal-400" />}
                        </div>
                        <p className="text-xs text-slate-400">
                          Property is created and fully managed by HolidayExpertz super admin without an external owner account.
                        </p>
                      </div>

                      <div
                        onClick={() => setOwnerMode("existing_owner")}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                          ownerMode === "existing_owner"
                            ? "bg-teal-500/10 border-teal-500/40 text-white"
                            : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/40"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-bold text-sm text-teal-300">Assign to Registered Owner</span>
                          {ownerMode === "existing_owner" && <Check className="w-4 h-4 text-teal-400" />}
                        </div>
                        <p className="text-xs text-slate-400">
                          Link this property to an existing registered property owner on HolidayExpertz.
                        </p>
                      </div>
                    </div>

                    {/* Owner Select Dropdown if existing_owner selected */}
                    {ownerMode === "existing_owner" && (
                      <div className="pt-2 animate-in fade-in">
                        <label className="block font-semibold text-slate-300 text-xs mb-1.5">
                          Select Registered Owner <span className="text-rose-400">*</span>
                        </label>
                        <select
                          value={selectedOwnerId}
                          onChange={(e) => setSelectedOwnerId(e.target.value)}
                          className="w-full sm:max-w-md bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-teal-500 font-medium cursor-pointer"
                        >
                          <option value="">-- Choose registered owner --</option>
                          {owners.map((o) => (
                            <option key={o.id} value={o.id}>
                              {o.fullName} ({o.email})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Promotional Badges */}
              <div className="pt-4 border-t border-slate-800 space-y-3">
                <label className="block font-semibold text-slate-300 text-xs uppercase tracking-wider">
                  Promotional Badges
                </label>
                {role === "owner" ? (
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-3 text-slate-400 text-xs">
                    <Info className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>
                      Promotional badges (&ldquo;Featured Property&rdquo; and &ldquo;Handpicked Luxury Collection&rdquo;) are assigned by HolidayExpertz super administrators during listing quality audits.
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-6 flex-wrap">
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.featured}
                        onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                        className="rounded text-teal-500 focus:ring-teal-500"
                      />
                      <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                        <Star className="w-3.5 h-3.5 text-amber-400" />
                        <span>Featured Property</span>
                      </span>
                    </label>

                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.handpicked}
                        onChange={(e) => setFormData({ ...formData, handpicked: e.target.checked })}
                        className="rounded text-teal-500 focus:ring-teal-500"
                      />
                      <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                        <span>Handpicked Luxury Collection</span>
                      </span>
                    </label>
                  </div>
                )}
              </div>

              {/* Contact Information */}
              <div className="pt-4 border-t border-slate-800 space-y-4">
                <label className="block font-semibold text-slate-300 text-xs uppercase tracking-wider">
                  Contact & Concierge Information
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs sm:text-sm">
                  <div>
                    <label className="block text-slate-400 mb-1">Contact Person</label>
                    <input
                      type="text"
                      placeholder="e.g. Estate Manager"
                      value={formData.contactPerson}
                      onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Mobile / WhatsApp</label>
                    <input
                      type="text"
                      placeholder="+91 98765 43210"
                      value={formData.mobileNumber}
                      onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Email Address</label>
                    <input
                      type="email"
                      placeholder="reservations@holidayexpertz.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Stepper Navigation Buttons */}
          <div className="flex items-center justify-between pt-8 border-t border-slate-800/80 mt-8">
            <button
              type="button"
              disabled={currentStep === 1}
              onClick={() => setCurrentStep((prev) => Math.max(prev - 1, 1))}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Previous Step</span>
            </button>

            <div className="flex items-center gap-3">
              {currentStep < 7 ? (
                <button
                  type="button"
                  onClick={() => {
                    if (validateStep(currentStep)) {
                      setCurrentStep((prev) => Math.min(prev + 1, 7));
                    }
                  }}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-teal-500/20 transition-all cursor-pointer"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <div className="flex items-center gap-3">
                  {role === "owner" && !isEditMode && (
                    <button
                      type="button"
                      disabled={isSubmitting || isLoadingProperty}
                      onClick={() => handleSaveProperty("draft")}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer"
                    >
                      <span>Save as Draft</span>
                    </button>
                  )}
                  {role === "admin" && !isEditMode && (
                    <button
                      type="button"
                      disabled={isSubmitting || isLoadingProperty}
                      onClick={() => handleSaveProperty("draft")}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer"
                    >
                      <span>Save as Draft</span>
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={isSubmitting || isLoadingProperty}
                    onClick={() => handleSaveProperty("approved")}
                    className="inline-flex items-center gap-2 px-7 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-teal-500/20 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    <span>
                      {isEditMode
                        ? "Save Changes"
                        : role === "owner"
                        ? "Submit for Verification"
                        : "Publish Property Live"}
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
          </>
        )}
    </div>
  );
}

