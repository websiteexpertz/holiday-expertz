"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { adminClient } from "@/lib/adminClient";
import PropertyLocationMapPicker from "@/components/common/PropertyLocationMapPicker";
import {
  PropertyTypeCategory,
  PropertyImage,
} from "@backend/types/property";
import { CountryRecord, StateRecord, CityRecord, AreaRecord } from "@backend/types/admin";
import {
  Building2,
  MapPin,
  Camera,
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

export default function AdminNewPropertyPage() {
  const router = useRouter();

  // Navigation steps
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
  const [customAmenity, setCustomAmenity] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    propertyType: "Luxury Hotels" as PropertyTypeCategory,
    shortDescription: "",
    detailedDescription: "",
    address: "",
    locality: "",
    postalCode: "",
    latitude: 28.6139,
    longitude: 77.209,
    hasConfirmedLocation: false,
    pricePerNight: 12500,
    originalPrice: 15000,
    maxGuests: 4,
    bedrooms: 2,
    bathrooms: 2,
    checkInTime: "14:00",
    checkOutTime: "11:00",
    amenities: ["Swimming Pool", "High-Speed Wi-Fi", "Air Conditioning", "Free Valet Parking", "Daily Housekeeping"],
    images: [] as PropertyImage[],
    contactPerson: "",
    mobileNumber: "",
    email: "",
    featured: false,
    handpicked: false,
  });

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

          if (destRes.data.countries?.length > 0) {
            const firstCountry = destRes.data.countries[0];
            setSelectedCountryId(firstCountry.id);
            const countryStates = (destRes.data.states || []).filter((s: StateRecord) => s.countryId === firstCountry.id);
            if (countryStates.length > 0) {
              setSelectedStateId(countryStates[0].id);
              const stateCities = (destRes.data.cities || []).filter((c: CityRecord) => c.stateId === countryStates[0].id);
              if (stateCities.length > 0) {
                setSelectedCityId(stateCities[0].id);
              }
            }
          }
        }

        const ownersRes = await adminClient.owners.getAll();
        if (ownersRes.success && ownersRes.data?.owners) {
          setOwners(ownersRes.data.owners);
        }
      } catch (err) {
        console.warn("Failed to load initial destination or owner records:", err);
      }
    }

    loadInitialData();
  }, []);

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

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formDataUpload,
        });

        if (!res.ok) throw new Error("Upload failed");
        const data = await res.json();
        return {
          id: `img_${Date.now()}_${idx}`,
          url: data.url || data.secure_url,
          isCover: formData.images.length === 0 && idx === 0,
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

  const handleRemovePhoto = (id: string) => {
    setFormData((prev) => {
      const filtered = prev.images.filter((img) => img.id !== id);
      if (filtered.length > 0 && !filtered.some((img) => img.isCover)) {
        filtered[0].isCover = true;
      }
      return { ...prev, images: filtered };
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
    } else if (step === 2) {
      if (!selectedCountryId || !selectedStateId || !selectedCityId) {
        setErrorBanner("Please select a complete destination hierarchy (Country, State, and City).");
        return false;
      }
      if (!formData.address.trim()) {
        setErrorBanner("Complete street address is required.");
        return false;
      }
      if (!formData.hasConfirmedLocation) {
        setErrorBanner("Please confirm the property's map pin location on the interactive map picker.");
        return false;
      }
    } else if (step === 3) {
      if (formData.images.length === 0) {
        setErrorBanner("Please upload at least one property photograph or add curated sample photos.");
        return false;
      }
    } else if (step === 4) {
      if (!formData.pricePerNight || formData.pricePerNight <= 0) {
        setErrorBanner("Please enter a valid price per night greater than 0.");
        return false;
      }
    }
    return true;
  };

  const handleSaveProperty = async (status: "approved" | "draft") => {
    if (!validateStep(1) || !validateStep(2) || !validateStep(3) || !validateStep(4)) {
      return;
    }

    setIsSubmitting(true);
    setErrorBanner("");
    setSuccessBanner("");

    try {
      const payload = {
        name: formData.name.trim(),
        propertyType: formData.propertyType,
        shortDescription: formData.shortDescription.trim(),
        detailedDescription: formData.detailedDescription.trim(),
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
        originalPrice: formData.originalPrice ? Number(formData.originalPrice) : undefined,
        maxGuests: Number(formData.maxGuests),
        bedrooms: Number(formData.bedrooms),
        bathrooms: Number(formData.bathrooms),
        checkInTime: formData.checkInTime,
        checkOutTime: formData.checkOutTime,
        amenities: formData.amenities,
        images: formData.images,
        contactPerson: formData.contactPerson.trim(),
        mobileNumber: formData.mobileNumber.trim(),
        email: formData.email.trim(),
        featured: formData.featured,
        handpicked: formData.handpicked,
        status,
        ownerId: ownerMode === "existing_owner" && selectedOwnerId ? selectedOwnerId : undefined,
      };

      const res = await adminClient.properties.create(payload);

      if (res.success) {
        setSuccessBanner(
          status === "approved"
            ? "Property created and published successfully! Live in public listings and map."
            : "Property saved as draft."
        );
        setTimeout(() => {
          router.push("/admin/properties");
        }, 1200);
      } else {
        setErrorBanner(res.message || "Failed to create property.");
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
    { num: 4, title: "Details & Pricing", desc: "Capacity, Amenities & Rates" },
    { num: 5, title: "Owner & Publish", desc: "Ownership & Verification" },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-6xl mx-auto pb-16">
        {/* Header Breadcrumbs & Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-2">
              <Link href="/admin/properties" className="hover:text-teal-400 transition-colors flex items-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>All Properties</span>
              </Link>
              <span>/</span>
              <span className="text-teal-400 font-bold">Manual Property Creation</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>Add Luxury Property</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-teal-500/20 text-teal-300 border border-teal-500/30">
                Super Admin
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Manually publish new luxury stays or associate with registered owners. Direct map coordinates integration enabled.
            </p>
          </div>

          <div className="flex items-center gap-2">
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

        {/* Stepper Wizard Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-2.5 shadow-lg">
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
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in">
              <div className="border-b border-slate-800 pb-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-teal-400" />
                  <span>Step 1: Basic Information</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Establish the luxury property identity, category classification, and editorial storytelling.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs sm:text-sm">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-300 mb-1.5">
                    Property Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. The Oberoi Udaivilas, Taj Lake Palace, Mountain Haven Villa"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1.5">
                    Property Category Type <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={formData.propertyType}
                    onChange={(e) =>
                      setFormData({ ...formData, propertyType: e.target.value as PropertyTypeCategory })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-teal-500 font-medium cursor-pointer"
                  >
                    {PROPERTY_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1.5">
                    Short Catchy Tagline
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Royal heritage sanctuary on the tranquil waters of Lake Pichola"
                    value={formData.shortDescription}
                    onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500 font-medium"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-300 mb-1.5">
                    Full Editorial Description
                  </label>
                  <textarea
                    rows={5}
                    placeholder="Describe the architectural heritage, premium amenities, private infinity pools, dining experiences, and bespoke concierge hospitality..."
                    value={formData.detailedDescription}
                    onChange={(e) => setFormData({ ...formData, detailedDescription: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500 font-medium leading-relaxed resize-none"
                  />
                </div>
              </div>
            </div>
          )}

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
                        className={`relative rounded-2xl overflow-hidden border group shadow-md ${
                          img.isCover ? "border-teal-400 ring-2 ring-teal-400/30" : "border-slate-800"
                        }`}
                      >
                        <div className="aspect-[4/3] relative bg-slate-950">
                          <img
                            src={img.url}
                            alt={img.caption || "Property photo"}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>

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

                        {img.caption && (
                          <div className="p-2 bg-slate-900 border-t border-slate-800 text-[11px] text-slate-300 truncate">
                            {img.caption}
                          </div>
                        )}
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
                  <IndianRupee className="w-5 h-5 text-teal-400" />
                  <span>Step 4: Pricing, Capacity & Amenities</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Set base night rates, maximum guest accommodations, and select luxury amenities.
                </p>
              </div>

              {/* Pricing Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                  <label className="block font-semibold text-slate-300 mb-1">
                    Price per Night (₹ INR) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.pricePerNight}
                    onChange={(e) => setFormData({ ...formData, pricePerNight: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white font-mono font-bold text-base focus:outline-none focus:border-teal-500"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">Standard tariff charged to customer.</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                  <label className="block font-semibold text-slate-300 mb-1">
                    Original Strike-through Price (₹ INR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.originalPrice || ""}
                    onChange={(e) => setFormData({ ...formData, originalPrice: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white font-mono font-bold text-base focus:outline-none focus:border-teal-500"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">Optional higher price shown crossed-out.</p>
                </div>
              </div>

              {/* Capacity & Timings */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs sm:text-sm">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Max Guests</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.maxGuests}
                    onChange={(e) => setFormData({ ...formData, maxGuests: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-teal-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Bedrooms</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.bedrooms}
                    onChange={(e) => setFormData({ ...formData, bedrooms: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-teal-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Bathrooms</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.bathrooms}
                    onChange={(e) => setFormData({ ...formData, bathrooms: Number(e.target.value) })}
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

          {/* STEP 5: OWNER INFORMATION & PUBLISHING */}
          {currentStep === 5 && (
            <div className="space-y-6 animate-in fade-in">
              <div className="border-b border-slate-800 pb-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-teal-400" />
                  <span>Step 5: Owner Association & Publication Badges</span>
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
              </div>

              {/* Promotional Badges */}
              <div className="pt-4 border-t border-slate-800 space-y-3">
                <label className="block font-semibold text-slate-300 text-xs uppercase tracking-wider">
                  Promotional Badges
                </label>
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
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Previous Step</span>
            </button>

            <div className="flex items-center gap-3">
              {currentStep < 5 ? (
                <button
                  type="button"
                  onClick={() => {
                    if (validateStep(currentStep)) {
                      setCurrentStep((prev) => Math.min(prev + 1, 5));
                    }
                  }}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-teal-500/20 transition-all"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleSaveProperty("approved")}
                  className="inline-flex items-center gap-2 px-7 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-teal-500/20 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>Publish Property Live</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

