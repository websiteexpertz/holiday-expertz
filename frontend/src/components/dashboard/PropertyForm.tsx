"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  createPropertyApi,
  fetchPropertyByIdApi,
  updatePropertyApi,
  uploadImageApi,
} from "@/lib/propertyClient";
import {
  Property,
  PropertyInput,
  PropertyImage,
  PropertyTypeCategory,
} from "@backend/types/property";
import PropertyLocationMapPicker from "@/components/common/PropertyLocationMapPicker";
import {
  Building2,
  MapPin,
  Camera,
  IndianRupee,
  CheckCircle2,
  FileEdit,
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
  AlertTriangle,
  HelpCircle,
  Plus,
  X,
  Loader2,
  ShieldCheck,
  Check,
} from "lucide-react";

interface PropertyFormProps {
  propertyId?: string; // If provided, edit mode
}

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

export default function PropertyForm({ propertyId }: PropertyFormProps) {
  const router = useRouter();
  const { owner } = useAuth();

  const isEditMode = Boolean(propertyId);

  const [currentStep, setCurrentStep] = useState(1);
  const [loadingInitial, setLoadingInitial] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [customAmenityInput, setCustomAmenityInput] = useState("");
  const [existingProperty, setExistingProperty] = useState<Property | null>(null);
  const [availableCountries, setAvailableCountries] = useState<string[]>([
    "India",
    "United Arab Emirates",
    "Maldives",
    "United States",
    "United Kingdom",
    "Thailand",
    "Singapore",
    "Indonesia",
    "Switzerland",
  ]);

  // Fetch available countries dynamically
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const res = await fetch("/api/public/locations/autocomplete?level=country");
        const json = await res.json();
        if (json.success && Array.isArray(json.suggestions)) {
          const names = json.suggestions.map((s: any) => s.name).filter(Boolean);
          setAvailableCountries((prev) => Array.from(new Set([...names, ...prev])));
        }
      } catch (err) {
        console.error("Failed to load country list:", err);
      }
    };
    fetchCountries();
  }, []);

  // Form State
  const [formData, setFormData] = useState<PropertyInput>({
    name: "",
    propertyType: "Villas",
    shortDescription: "",
    detailedDescription: "",
    location: {
      country: "India",
      state: "Rajasthan",
      city: "",
      locality: "",
      address: "",
      postalCode: "",
    },
    images: [],
    pricing: {
      pricePerNight: 8500,
      currency: "INR",
      originalPrice: 10500,
    },
    capacity: {
      maxGuests: 4,
      bedrooms: 2,
      bathrooms: 2,
      checkInTime: "14:00",
      checkOutTime: "11:00",
    },
    amenities: [
      "High-Speed Wi-Fi",
      "Air Conditioning",
      "Swimming Pool",
      "Free Valet Parking",
      "Hot Water",
    ],
    contactDetails: {
      contactPerson: owner?.fullName || "",
      mobileNumber: owner?.mobileNumber || "",
      email: owner?.email || "",
      altPhone: "",
    },
  });

  // Prepopulate if edit mode
  useEffect(() => {
    if (!propertyId) return;

    let isMounted = true;
    const fetchExisting = async () => {
      try {
        const res = await fetchPropertyByIdApi(propertyId);
        if (!isMounted) return;
        if (res.success && res.property) {
          setExistingProperty(res.property);
          setFormData({
            name: res.property.name,
            propertyType: res.property.propertyType,
            shortDescription: res.property.shortDescription,
            detailedDescription: res.property.detailedDescription,
            location: res.property.location,
            images: res.property.images,
            pricing: res.property.pricing,
            capacity: res.property.capacity,
            amenities: res.property.amenities,
            contactDetails: res.property.contactDetails,
          });
        } else {
          setErrorBanner(res.message || "Could not find property.");
        }
      } catch {
        if (isMounted) setErrorBanner("Failed to retrieve property details.");
      } finally {
        if (isMounted) setLoadingInitial(false);
      }
    };

    fetchExisting();
    return () => {
      isMounted = false;
    };
  }, [propertyId]);

  // Steps definition
  const STEPS = [
    { num: 1, title: "Basic Info", desc: "Name & Type" },
    { num: 2, title: "Location", desc: "City & Address" },
    { num: 3, title: "Media", desc: "Photos & Cover" },
    { num: 4, title: "Pricing & Rooms", desc: "Rates & Capacity" },
    { num: 5, title: "Amenities", desc: "Features & Inclusions" },
    { num: 6, title: "Contact", desc: "Host Details" },
    { num: 7, title: "Review & Submit", desc: "Audit Readiness" },
  ];

  // Image Upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImage(true);
    setErrorBanner(null);

    try {
      const newImages: PropertyImage[] = [...formData.images];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const res = await uploadImageApi(file);
        if (res.success && res.url) {
          newImages.push({
            id: `img_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            url: res.url,
            isCover: newImages.length === 0, // First uploaded image is cover by default
            caption: file.name.replace(/\.[^/.]+$/, ""),
          });
        } else {
          setErrorBanner(res.message || "One or more images failed to upload.");
        }
      }

      setFormData((prev) => ({ ...prev, images: newImages }));
    } catch {
      setErrorBanner("Failed to upload image. Please ensure file is an image under 10MB.");
    } finally {
      setUploadingImage(false);
      // Reset input
      e.target.value = "";
    }
  };

  const handleAddSamplePresetPhotos = () => {
    const currentImgs = [...formData.images];
    SAMPLE_PHOTO_PRESETS.forEach((preset, idx) => {
      currentImgs.push({
        id: `img_sample_${Date.now()}_${idx}`,
        url: preset.url,
        isCover: currentImgs.length === 0 && idx === 0,
        caption: preset.caption,
      });
    });
    setFormData((prev) => ({ ...prev, images: currentImgs }));
  };

  const setCoverImage = (index: number) => {
    const updated = formData.images.map((img, i) => ({
      ...img,
      isCover: i === index,
    }));
    setFormData((prev) => ({ ...prev, images: updated }));
  };

  const removeImage = (index: number) => {
    const wasCover = formData.images[index]?.isCover;
    const updated = formData.images.filter((_, i) => i !== index);
    if (wasCover && updated.length > 0) {
      updated[0].isCover = true;
    }
    setFormData((prev) => ({ ...prev, images: updated }));
  };

  const toggleAmenity = (amenity: string) => {
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

  const addCustomAmenity = () => {
    const raw = customAmenityInput.trim();
    if (!raw) return;

    // Support comma-separated items if user types e.g. "Helipad, Jacuzzi, Wine Cellar"
    const items = raw
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    setFormData((prev) => {
      const current = [...prev.amenities];
      for (const item of items) {
        if (!current.includes(item)) {
          current.push(item);
        }
      }
      return { ...prev, amenities: current };
    });
    setCustomAmenityInput("");
  };

  const removeCustomAmenity = (amenityToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      amenities: prev.amenities.filter((a) => a !== amenityToRemove),
    }));
  };

  // Validation before going to next step
  const validateStep = (step: number): boolean => {
    setErrorBanner(null);
    if (step === 1) {
      if (!formData.name.trim()) {
        setErrorBanner("Property name is required.");
        return false;
      }
      if (!formData.shortDescription.trim()) {
        setErrorBanner("Short headline/description is required.");
        return false;
      }
      if (!formData.detailedDescription.trim()) {
        setErrorBanner("Detailed description is required.");
        return false;
      }
    } else if (step === 2) {
      if (!formData.location.country.trim()) {
        setErrorBanner("Country is required.");
        return false;
      }
      if (!formData.location.city.trim()) {
        setErrorBanner("City is required.");
        return false;
      }
      if (!formData.location.address.trim()) {
        setErrorBanner("Complete address is required.");
        return false;
      }
      if (!formData.location.postalCode.trim()) {
        setErrorBanner("Postal code is required.");
        return false;
      }
      if (!formData.location.coordinates?.latitude || !formData.location.coordinates?.longitude) {
        setErrorBanner("Please place and confirm the property's exact location pin on the map.");
        return false;
      }
    } else if (step === 3) {
      if (formData.images.length === 0) {
        setErrorBanner("Please upload or add at least 1 photo for your property.");
        return false;
      }
    } else if (step === 4) {
      if (formData.pricing.pricePerNight <= 0) {
        setErrorBanner("Nightly price must be greater than zero.");
        return false;
      }
      if (formData.capacity.maxGuests <= 0) {
        setErrorBanner("Max guests must be at least 1.");
        return false;
      }
    } else if (step === 6) {
      if (!formData.contactDetails.contactPerson.trim()) {
        setErrorBanner("Host contact name is required.");
        return false;
      }
      if (!formData.contactDetails.mobileNumber.trim()) {
        setErrorBanner("Primary mobile number is required.");
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 7));
    }
  };

  const handlePrev = () => {
    setErrorBanner(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  // Submit Handler
  const handleSubmit = async (submitImmediately: boolean) => {
    setErrorBanner(null);

    // Validate essential fields
    if (!formData.name.trim() || !formData.location.city.trim()) {
      setErrorBanner("Please complete essential basic info and location fields.");
      return;
    }

    setSubmitting(true);

    try {
      if (isEditMode && propertyId) {
        const res = await updatePropertyApi(propertyId, formData, submitImmediately);
        if (res.success) {
          router.push(`/dashboard/properties?view=${propertyId}`);
        } else {
          setErrorBanner(res.message || "Failed to update property.");
        }
      } else {
        const res = await createPropertyApi(formData, submitImmediately);
        if (res.success && res.property) {
          router.push(`/dashboard/properties?view=${res.property.id}`);
        } else {
          setErrorBanner(res.message || "Failed to create property.");
        }
      }
    } catch {
      setErrorBanner("A network error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingInitial) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600 mb-3" />
        <p className="text-sm font-medium">Retrieving listing details...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/properties"
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Properties</span>
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            {isEditMode ? "Edit Property Listing" : "List Your Property"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Complete the 7-step onboarding process to list your luxury stay on HolidayExpertz.
          </p>
        </div>

        {existingProperty?.status === "rejected" && existingProperty.rejectionReason && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs max-w-sm">
            <span className="font-bold flex items-center gap-1 text-rose-900 mb-0.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              Audit Revision Required
            </span>
            <span>{existingProperty.rejectionReason}</span>
          </div>
        )}
      </div>

      {/* ── ERROR BANNER ── */}
      {errorBanner && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorBanner}</span>
          </div>
          <button
            onClick={() => setErrorBanner(null)}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── STEP INDICATOR ── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs overflow-x-auto scrollbar-none">
        <div className="flex items-center justify-between min-w-[600px]">
          {STEPS.map((s, idx) => {
            const isCompleted = currentStep > s.num;
            const isCurrent = currentStep === s.num;

            return (
              <React.Fragment key={s.num}>
                <button
                  type="button"
                  onClick={() => {
                    // Allow navigating back freely or forward if validated
                    if (s.num < currentStep) setCurrentStep(s.num);
                    else if (validateStep(currentStep)) setCurrentStep(s.num);
                  }}
                  className="flex items-center gap-2.5 text-left group cursor-pointer focus:outline-none"
                >
                  <div
                    className={`w-8 h-8 rounded-xl font-bold text-xs flex items-center justify-center transition-all ${
                      isCompleted
                        ? "bg-teal-600 text-white"
                        : isCurrent
                        ? "bg-teal-100 text-teal-800 ring-2 ring-teal-600 ring-offset-2"
                        : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
                    }`}
                  >
                    {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : s.num}
                  </div>
                  <div>
                    <div
                      className={`text-xs font-bold ${
                        isCurrent ? "text-teal-900" : "text-slate-700"
                      }`}
                    >
                      {s.title}
                    </div>
                    <div className="text-[10px] text-slate-400 hidden sm:block">{s.desc}</div>
                  </div>
                </button>
                {idx < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 ${
                      currentStep > idx + 1 ? "bg-teal-600" : "bg-slate-200"
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* ── STEP FORM CONTENT ── */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
        {/* STEP 1: BASIC INFORMATION */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Step 1: Basic Information</h2>
              <p className="text-xs text-slate-500">Provide the title, stay style, and descriptive overview.</p>
            </div>

            <div className="space-y-4 text-xs sm:text-sm">
              {/* Property Name */}
              <div>
                <label className="block font-semibold text-slate-800 mb-1.5">
                  Property Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Singhania Heritage Palace & Spa"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 font-medium"
                />
              </div>

              {/* Property Type Category */}
              <div>
                <label className="block font-semibold text-slate-800 mb-1.5">
                  Property Category <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {PROPERTY_TYPES.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormData({ ...formData, propertyType: type })}
                      className={`p-3 rounded-xl border text-xs font-bold text-center transition-all ${
                        formData.propertyType === type
                          ? "bg-teal-50 border-teal-600 text-teal-800 ring-2 ring-teal-500/20"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Short Tagline */}
              <div>
                <label className="block font-semibold text-slate-800 mb-1.5">
                  Short Tagline / Highlight <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Regal 18th-century Rajput palace overlooking private lotus lakes and Aravali hills."
                  value={formData.shortDescription}
                  onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 font-medium"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  A compelling 1-2 sentence overview shown on search result cards.
                </p>
              </div>

              {/* Detailed Description */}
              <div>
                <label className="block font-semibold text-slate-800 mb-1.5">
                  Detailed Property Narrative <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={5}
                  placeholder="Describe your property's architecture, atmosphere, luxury amenities, scenic views, and hospitality ethos..."
                  value={formData.detailedDescription}
                  onChange={(e) => setFormData({ ...formData, detailedDescription: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 font-medium leading-relaxed"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: LOCATION */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Step 2: Location & Address</h2>
              <p className="text-xs text-slate-500">
                Help travelers pinpoint your exact stay location and proximity to tourist attractions.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold text-slate-800 mb-1.5">
                  Country <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    list="available-countries-list"
                    placeholder="e.g. India, United Arab Emirates, Maldives"
                    value={formData.location.country}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        location: { ...formData.location, country: e.target.value },
                      })
                    }
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 font-medium"
                  />
                  <datalist id="available-countries-list">
                    {availableCountries.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Select from registered countries or enter any custom country.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1.5">
                  State / Region <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rajasthan, Goa, Kerala, Himachal Pradesh"
                  value={formData.location.state}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      location: { ...formData.location, state: e.target.value },
                    })
                  }
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1.5">
                  City / Town <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Udaipur, Jaipur, Panaji, Manali"
                  value={formData.location.city}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      location: { ...formData.location, city: e.target.value },
                    })
                  }
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1.5">
                  Locality / Landmark
                </label>
                <input
                  type="text"
                  placeholder="e.g. Lake Pichola Outer Area, Calangute Beach"
                  value={formData.location.locality}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      location: { ...formData.location, locality: e.target.value },
                    })
                  }
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 font-medium"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-800 mb-1.5">
                  Full Street Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 12 Palace Road, Near Royal Ghats"
                  value={formData.location.address}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      location: { ...formData.location, address: e.target.value },
                    })
                  }
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1.5">
                  Postal Code / PIN <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 313001"
                  value={formData.location.postalCode}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      location: { ...formData.location, postalCode: e.target.value },
                    })
                  }
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 font-medium"
                />
              </div>

              {/* Interactive Map Location Picker */}
              <div className="sm:col-span-2 space-y-2 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-xs uppercase tracking-wider text-teal-800">
                    Exact Map Location Picker <span className="text-rose-500">*</span>
                  </label>
                  {formData.location.coordinates?.latitude && formData.location.coordinates?.longitude ? (
                    <span className="text-[11px] font-mono font-semibold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200">
                      Confirmed: {formData.location.coordinates.latitude.toFixed(5)}°, {formData.location.coordinates.longitude.toFixed(5)}°
                    </span>
                  ) : (
                    <span className="text-[11px] text-amber-600 font-medium">
                      Marker unconfirmed — drag or click map to locate
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  Search address or click/drag the pin on the map to mark your property&apos;s exact physical entrance for travelers.
                </p>

                <PropertyLocationMapPicker
                  latitude={formData.location.coordinates?.latitude}
                  longitude={formData.location.coordinates?.longitude}
                  initialQuery={[formData.location.address, formData.location.city, formData.location.country].filter(Boolean).join(", ")}
                  onLocationSelect={({ latitude, longitude }) => {
                    setFormData((prev) => ({
                      ...prev,
                      location: {
                        ...prev.location,
                        coordinates: {
                          latitude,
                          longitude,
                          lat: latitude,
                          lng: longitude,
                        },
                      },
                    }));
                  }}
                  className="h-[360px] sm:h-[400px] mt-2"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: IMAGES & MEDIA */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Step 3: Photos & Visuals</h2>
                <p className="text-xs text-slate-500">
                  Upload high-resolution photography. The first or designated photo will serve as your primary cover.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddSamplePresetPhotos}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 transition-colors flex items-center gap-1 self-start sm:self-auto"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Add Curated Sample Photos</span>
              </button>
            </div>

            {/* Upload Area */}
            <label className="relative border-2 border-dashed border-slate-300 hover:border-teal-600 rounded-3xl p-8 flex flex-col items-center justify-center cursor-pointer bg-slate-50/50 hover:bg-teal-50/20 transition-all group">
              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,image/avif"
                onChange={handleFileUpload}
                disabled={uploadingImage}
                className="hidden"
              />
              <div className="w-14 h-14 rounded-2xl bg-teal-100/60 text-teal-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                {uploadingImage ? (
                  <Loader2 className="w-7 h-7 animate-spin" />
                ) : (
                  <Upload className="w-7 h-7" />
                )}
              </div>
              <p className="text-sm font-bold text-slate-800">
                {uploadingImage ? "Uploading photos..." : "Click or drag photos to upload"}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Supports JPG, PNG, WEBP up to 10MB each. High-definition horizontal photos recommended.
              </p>
            </label>

            {/* Gallery Grid */}
            {formData.images.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Uploaded Photos ({formData.images.length})
                  </h4>
                  <span className="text-xs text-teal-600 font-medium">
                    Click &ldquo;Set Cover&rdquo; to choose your primary card visual
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {formData.images.map((img, idx) => (
                    <div
                      key={img.id || idx}
                      className="group relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 aspect-4/3 shadow-xs"
                    >
                      <img src={img.url} alt="" className="w-full h-full object-cover" />

                      {/* Cover Badge */}
                      {img.isCover && (
                        <div className="absolute top-2 left-2 bg-teal-600 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-md shadow-xs flex items-center gap-1">
                          <Star className="w-3 h-3 fill-white" />
                          <span>Cover</span>
                        </div>
                      )}

                      {/* Hover Overlay Controls */}
                      <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => removeImage(idx)}
                            className="p-1.5 bg-rose-600 text-white rounded-lg hover:bg-rose-500 transition-colors"
                            title="Remove photo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {!img.isCover && (
                          <button
                            type="button"
                            onClick={() => setCoverImage(idx)}
                            className="w-full py-1.5 bg-white/90 hover:bg-white text-slate-900 font-bold text-xs rounded-lg transition-colors"
                          >
                            Set Cover
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 4: PRICING & CAPACITY */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Step 4: Pricing & Capacity</h2>
              <p className="text-xs text-slate-500">
                Configure nightly rates, discount benchmarks, and guest limits.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold text-slate-800 mb-1.5">
                  Nightly Base Price (INR) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-500">
                    ₹
                  </span>
                  <input
                    type="number"
                    min={1}
                    value={formData.pricing.pricePerNight}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        pricing: {
                          ...formData.pricing,
                          pricePerNight: Number(e.target.value) || 0,
                        },
                      })
                    }
                    className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1.5">
                  Regular / Strike-through Price (INR)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                    ₹
                  </span>
                  <input
                    type="number"
                    min={1}
                    value={formData.pricing.originalPrice || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        pricing: {
                          ...formData.pricing,
                          originalPrice: Number(e.target.value) || undefined,
                        },
                      })
                    }
                    placeholder="e.g. 12000"
                    className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1.5">
                  Maximum Guests <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  value={formData.capacity.maxGuests}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      capacity: {
                        ...formData.capacity,
                        maxGuests: Number(e.target.value) || 1,
                      },
                    })
                  }
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1.5">
                  Bedrooms Count <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  value={formData.capacity.bedrooms}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      capacity: {
                        ...formData.capacity,
                        bedrooms: Number(e.target.value) || 1,
                      },
                    })
                  }
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1.5">
                  Bathrooms Count <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  value={formData.capacity.bathrooms}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      capacity: {
                        ...formData.capacity,
                        bathrooms: Number(e.target.value) || 1,
                      },
                    })
                  }
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-800 mb-1.5">Check-In</label>
                  <input
                    type="time"
                    value={formData.capacity.checkInTime}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        capacity: { ...formData.capacity, checkInTime: e.target.value },
                      })
                    }
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-800 mb-1.5">Check-Out</label>
                  <input
                    type="time"
                    value={formData.capacity.checkOutTime}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        capacity: { ...formData.capacity, checkOutTime: e.target.value },
                      })
                    }
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: AMENITIES & FEATURES */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">Step 5: Amenities & Features</h2>
                <span className="text-xs font-semibold px-2.5 py-1 bg-teal-50 text-teal-700 border border-teal-200 rounded-full">
                  {formData.amenities.length} Selected
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Select amenities provided on-site. Properties with 8+ highlighted features see higher booking velocity.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {PREDEFINED_AMENITIES.map((amenity) => {
                const isSelected = formData.amenities.includes(amenity);
                return (
                  <button
                    key={amenity}
                    type="button"
                    onClick={() => toggleAmenity(amenity)}
                    className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 text-left transition-all ${
                      isSelected
                        ? "bg-teal-50 border-teal-600 text-teal-900 ring-1 ring-teal-600"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                        isSelected
                          ? "bg-teal-600 border-teal-600 text-white"
                          : "border-slate-300 bg-white"
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span className="truncate">{amenity}</span>
                  </button>
                );
              })}
            </div>

            {/* Custom Amenity Adder */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <div>
                <label className="block font-semibold text-slate-800 text-xs mb-1">
                  Add Custom Amenity or Feature
                </label>
                <p className="text-[11px] text-slate-400 mb-2">
                  Can&apos;t find an amenity in the list above? Type custom features (or comma-separated values) and click Add.
                </p>
                <div className="flex gap-2 max-w-md">
                  <input
                    type="text"
                    placeholder="e.g. Private Helipad, Jacuzzi, Wine Cellar"
                    value={customAmenityInput}
                    onChange={(e) => setCustomAmenityInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addCustomAmenity();
                      }
                    }}
                    className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                  />
                  <button
                    type="button"
                    onClick={addCustomAmenity}
                    disabled={!customAmenityInput.trim()}
                    className="px-4 py-2.5 bg-teal-700 hover:bg-teal-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>
              </div>

              {/* Display Custom Amenities Added */}
              {formData.amenities.filter((a) => !PREDEFINED_AMENITIES.includes(a)).length > 0 && (
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-800">
                      Custom Amenities Added ({formData.amenities.filter((a) => !PREDEFINED_AMENITIES.includes(a)).length})
                    </span>
                    <span className="text-[11px] text-slate-400">Click &times; to remove</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.amenities
                      .filter((a) => !PREDEFINED_AMENITIES.includes(a))
                      .map((amenity) => (
                        <span
                          key={amenity}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 border border-teal-500 text-teal-900 rounded-xl text-xs font-semibold shadow-xs"
                        >
                          <Check className="w-3.5 h-3.5 text-teal-600 stroke-[3]" />
                          <span>{amenity}</span>
                          <button
                            type="button"
                            onClick={() => removeCustomAmenity(amenity)}
                            className="ml-1 p-0.5 hover:bg-teal-200/60 rounded-full text-teal-700 hover:text-rose-600 transition-colors"
                            title={`Remove ${amenity}`}
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 6: CONTACT INFORMATION */}
        {currentStep === 6 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Step 6: Host & Contact Details</h2>
              <p className="text-xs text-slate-500">
                These credentials will be verified by our team and shared with confirmed travelers.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold text-slate-800 mb-1.5">
                  Host / Manager Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.contactDetails.contactPerson}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      contactDetails: {
                        ...formData.contactDetails,
                        contactPerson: e.target.value,
                      },
                    })
                  }
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1.5">
                  Primary Mobile Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.contactDetails.mobileNumber}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      contactDetails: {
                        ...formData.contactDetails,
                        mobileNumber: e.target.value,
                      },
                    })
                  }
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1.5">
                  Notification Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.contactDetails.email}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      contactDetails: {
                        ...formData.contactDetails,
                        email: e.target.value,
                      },
                    })
                  }
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1.5">
                  Alternate Phone / WhatsApp
                </label>
                <input
                  type="tel"
                  placeholder="e.g. +91 98765 00000"
                  value={formData.contactDetails.altPhone || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      contactDetails: {
                        ...formData.contactDetails,
                        altPhone: e.target.value,
                      },
                    })
                  }
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 7: REVIEW & SUBMIT */}
        {currentStep === 7 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Step 7: Final Review & Submission</h2>
              <p className="text-xs text-slate-500">
                Confirm your property specifications before submitting for curation audit.
              </p>
            </div>

            {/* Summary Review Card */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-4 text-xs sm:text-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                <div>
                  <span className="text-[10px] font-black uppercase text-teal-700 bg-teal-100 px-2 py-0.5 rounded">
                    {formData.propertyType}
                  </span>
                  <h3 className="text-lg font-black text-slate-900 mt-1">{formData.name}</h3>
                  <p className="text-xs text-slate-500">{formData.shortDescription}</p>
                </div>
                <div className="text-right">
                  <div className="text-xl font-black text-slate-900">
                    ₹{formData.pricing.pricePerNight.toLocaleString("en-IN")}
                  </div>
                  <span className="text-xs text-slate-400">per night</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-700">
                <div>
                  <span className="text-[10px] text-slate-400 block">Location</span>
                  <span className="font-semibold">
                    {formData.location.city ? `${formData.location.city}, ` : ""}
                    {formData.location.state ? `${formData.location.state}, ` : ""}
                    {formData.location.country}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Capacity</span>
                  <span className="font-semibold">{formData.capacity.maxGuests} Guests</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Rooms</span>
                  <span className="font-semibold">
                    {formData.capacity.bedrooms} Bed · {formData.capacity.bathrooms} Bath
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Photos</span>
                  <span className="font-semibold">{formData.images.length} Visuals</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block mb-1">Amenities Included</span>
                <div className="flex flex-wrap gap-1.5">
                  {formData.amenities.map((a, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 bg-white border border-slate-200 text-slate-700 text-[11px] rounded"
                    >
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Quality Pledge */}
            <div className="p-4 bg-teal-50 border border-teal-200 rounded-2xl flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
              <div className="text-xs text-teal-900 space-y-1">
                <div className="font-bold">HolidayExpertz Host Quality Standard</div>
                <p className="leading-relaxed">
                  By submitting this property, you certify that all information provided is accurate and that your property complies with local hospitality safety regulations. Our audit team reviews listings within 24 business hours.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── FOOTER NAVIGATION CONTROLS ── */}
        <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handlePrev}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs sm:text-sm rounded-xl transition-colors flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Previous Step</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            {/* Draft Save Button (available anywhere or on step 7) */}
            <button
              type="button"
              onClick={() => handleSubmit(false)}
              disabled={submitting}
              className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm rounded-xl border border-slate-200 transition-all shadow-xs disabled:opacity-50 flex items-center gap-1.5"
            >
              <FileEdit className="w-4 h-4 text-slate-400" />
              <span>Save as Draft</span>
            </button>

            {currentStep < 7 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md shadow-teal-600/20 flex items-center gap-1.5"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSubmit(true)}
                disabled={submitting}
                className="px-6 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md shadow-teal-600/25 disabled:opacity-50 flex items-center gap-2"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>Submit for Approval</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
