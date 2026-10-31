"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { adminClient } from "@/lib/adminClient";
import { CountryRecord, StateRecord, CityRecord, AreaRecord, DestinationHierarchyCounts } from "@backend/types/admin";
import { Property, PropertyImage, PropertyTypeCategory } from "@backend/types/property";
import DestinationHeroImageManager from "@/components/admin/DestinationHeroImageManager";
import FeaturedDestinationManager from "@/components/admin/FeaturedDestinationManager";
import {
  MapPin,
  ChevronRight,
  Plus,
  Trash2,
  Edit2,
  Building2,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Eye,
  Search,
  Globe,
  Layers,
  Star,
  Sparkles,
  Upload,
  X,
  Check,
  ImageIcon,
  PauseCircle,
  PlayCircle,
  ShieldCheck,
  Filter,
  DollarSign,
  Users,
  Bed,
  Bath,
  Clock,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

export type DestinationViewMode = "dashboard" | "countries" | "states" | "cities" | "properties" | "hero_slides" | "featured_destinations";

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
  "Ayurvedic Spa",
  "Butler Service",
  "Kitchen & Dining",
  "Hot Water",
  "Mountain View",
  "Lake View",
  "Private Garden",
  "Rooftop Terrace",
  "Daily Housekeeping",
  "In-house Chef",
  "Pet Friendly",
  "24/7 Security",
  "First Aid Kit",
];

const SAMPLE_PHOTO_PRESETS = [
  {
    name: "Luxury Courtyard & Pool",
    url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Heritage Master Bedroom",
    url: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Mountain Dining Pavilion",
    url: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Spa & Wellness Lounge",
    url: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80",
  },
];

interface PropertyFormState {
  name: string;
  propertyType: PropertyTypeCategory;
  shortDescription: string;
  detailedDescription: string;
  locality: string;
  areaId: string;
  address: string;
  postalCode: string;
  pricePerNight: number;
  originalPrice: number;
  maxGuests: number;
  bedrooms: number;
  bathrooms: number;
  checkInTime: string;
  checkOutTime: string;
  amenities: string[];
  images: PropertyImage[];
  contactPerson: string;
  mobileNumber: string;
  email: string;
  altPhone: string;
  status: "approved" | "pending_approval" | "draft";
  featured: boolean;
}

export default function AdminDestinationsPage() {
  // Navigation Flow State: "dashboard" -> "countries" -> "states" -> "cities" -> "properties"
  const [currentStep, setCurrentStep] = useState<DestinationViewMode>("dashboard");

  // Selection states for strict hierarchy: Country -> State -> City -> Properties
  const [selectedCountry, setSelectedCountry] = useState<CountryRecord | null>(null);
  const [selectedState, setSelectedState] = useState<StateRecord | null>(null);
  const [selectedCity, setSelectedCity] = useState<CityRecord | null>(null);

  // Data collections
  const [counts, setCounts] = useState<DestinationHierarchyCounts | null>(null);
  const [countries, setCountries] = useState<(CountryRecord & { statesCount?: number; citiesCount?: number; propertiesCount?: number })[]>([]);
  const [states, setStates] = useState<(StateRecord & { citiesCount?: number; propertiesCount?: number })[]>([]);
  const [cities, setCities] = useState<(CityRecord & { areasCount?: number; propertiesCount?: number })[]>([]);
  const [areas, setAreas] = useState<AreaRecord[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isPropertiesLoading, setIsPropertiesLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Step 1: Country Form State (Single Field)
  const [newCountryName, setNewCountryName] = useState("");
  const [countryFormError, setCountryFormError] = useState("");
  const [isSavingCountry, setIsSavingCountry] = useState(false);

  // Step 2: State Form State (Single Field)
  const [newStateName, setNewStateName] = useState("");
  const [stateFormError, setStateFormError] = useState("");
  const [isSavingState, setIsSavingState] = useState(false);

  // Step 3: City Form State (Single Field)
  const [newCityName, setNewCityName] = useState("");
  const [cityFormError, setCityFormError] = useState("");
  const [isSavingCity, setIsSavingCity] = useState(false);

  // Single-Field Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editEntityType, setEditEntityType] = useState<"country" | "state" | "city">("country");
  const [editingItem, setEditingItem] = useState<{ id: string; name: string } | null>(null);
  const [editNameValue, setEditNameValue] = useState("");
  const [editModalError, setEditModalError] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Step 4: Property Filters
  const [propertyFilterType, setPropertyFilterType] = useState<string>("all");
  const [propertyFilterStatus, setPropertyFilterStatus] = useState<string>("all");

  // Property Creation / Edit Modal State (Full Property Management Module)
  const [propertyModalOpen, setPropertyModalOpen] = useState(false);
  const [isEditPropertyMode, setIsEditPropertyMode] = useState(false);
  const [editingPropertyId, setEditingPropertyId] = useState<string | null>(null);
  const [propertyForm, setPropertyForm] = useState<PropertyFormState>({
    name: "",
    propertyType: "Luxury Hotels",
    shortDescription: "",
    detailedDescription: "",
    locality: "",
    areaId: "",
    address: "",
    postalCode: "",
    pricePerNight: 8500,
    originalPrice: 10500,
    maxGuests: 4,
    bedrooms: 2,
    bathrooms: 2,
    checkInTime: "14:00",
    checkOutTime: "11:00",
    amenities: ["Swimming Pool", "High-Speed Wi-Fi", "Air Conditioning", "Free Valet Parking", "Daily Housekeeping"],
    images: [],
    contactPerson: "HolidayExpertz Concierge",
    mobileNumber: "+91 98765 43210",
    email: "reservations@holidayexpertz.com",
    altPhone: "",
    status: "approved",
    featured: false,
  });
  const [propertyModalError, setPropertyModalError] = useState("");
  const [isSubmittingProperty, setIsSubmittingProperty] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [customAmenity, setCustomAmenity] = useState("");

  // Property Details View Modal State
  const [viewPropertyModalOpen, setViewPropertyModalOpen] = useState(false);
  const [viewingProperty, setViewingProperty] = useState<Property | null>(null);

  // ── Load All Destination Data ──
  const loadAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await adminClient.destinations.getAll();
      if (res.success && res.data) {
        setCounts(res.data.counts);
        setCountries(res.data.countries || []);
        setStates(res.data.states || []);
        setCities(res.data.cities || []);
        setAreas(res.data.areas || []);
      }
    } catch (err) {
      console.error("Failed to load destinations:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // ── Load Properties for Selected City ──
  const loadProperties = useCallback(async () => {
    if (!selectedCity) return;
    setIsPropertiesLoading(true);
    try {
      const res = await adminClient.destinations.getProperties({
        countryId: selectedCountry?.id,
        stateId: selectedState?.id,
        cityId: selectedCity?.id,
      });
      if (res.success && res.data?.properties) {
        setProperties(res.data.properties);
      }
    } catch (err) {
      console.error("Failed to load city properties:", err);
    } finally {
      setIsPropertiesLoading(false);
    }
  }, [selectedCountry, selectedState, selectedCity]);

  useEffect(() => {
    if (currentStep === "properties" && selectedCity) {
      loadProperties();
    }
  }, [currentStep, selectedCity, loadProperties]);

  // ── Hierarchy Filtering ──
  const filteredStatesForCountry = useMemo(() => {
    if (!selectedCountry) return [];
    return states.filter((s) => s.countryId === selectedCountry.id);
  }, [states, selectedCountry]);

  const filteredCitiesForState = useMemo(() => {
    if (!selectedState) return [];
    return cities.filter((c) => c.stateId === selectedState.id);
  }, [cities, selectedState]);

  const filteredPropertiesForCity = useMemo(() => {
    if (!selectedCity) return [];
    return properties.filter((p) => {
      // Matches selected city ID or fallback to matching city name
      const matchesCity =
        p.cityId === selectedCity.id ||
        p.location.cityId === selectedCity.id ||
        p.location.city.toLowerCase() === selectedCity.name.toLowerCase();

      if (!matchesCity) return false;

      if (propertyFilterType !== "all" && p.propertyType !== propertyFilterType) {
        return false;
      }

      if (propertyFilterStatus !== "all" && p.status !== propertyFilterStatus) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesLocality = p.location.locality?.toLowerCase().includes(q);
        const matchesAddress = p.location.address?.toLowerCase().includes(q);
        if (!matchesName && !matchesLocality && !matchesAddress) return false;
      }

      return true;
    });
  }, [properties, selectedCity, propertyFilterType, propertyFilterStatus, searchQuery]);

  const cityAreas = useMemo(() => {
    if (!selectedCity) return [];
    return areas.filter((a) => a.cityId === selectedCity.id);
  }, [areas, selectedCity]);

  // ── Navigation Sequence Handlers ──

  const handleStartWorkflow = () => {
    setSearchQuery("");
    setCurrentStep("countries");
  };

  const handleSelectCountry = (country: CountryRecord) => {
    setSelectedCountry(country);
    setSelectedState(null);
    setSelectedCity(null);
    setSearchQuery("");
    setCurrentStep("states");
  };

  const handleSelectState = (state: StateRecord) => {
    // Ensure parent country is locked
    const parentCountry = countries.find((c) => c.id === state.countryId);
    if (parentCountry) {
      setSelectedCountry(parentCountry);
    }
    setSelectedState(state);
    setSelectedCity(null);
    setSearchQuery("");
    setCurrentStep("cities");
  };

  const handleSelectCity = (city: CityRecord) => {
    // Ensure parent state and country are locked
    const parentState = states.find((s) => s.id === city.stateId);
    if (parentState) {
      setSelectedState(parentState);
      const parentCountry = countries.find((c) => c.id === parentState.countryId);
      if (parentCountry) {
        setSelectedCountry(parentCountry);
      }
    }
    setSelectedCity(city);
    setSearchQuery("");
    setCurrentStep("properties");
  };

  const handleBackToDashboard = () => {
    setCurrentStep("dashboard");
  };

  const handleBackToCountries = () => {
    setSelectedState(null);
    setSelectedCity(null);
    setSearchQuery("");
    setCurrentStep("countries");
  };

  const handleBackToStates = () => {
    setSelectedCity(null);
    setSearchQuery("");
    setCurrentStep("states");
  };

  const handleBackToCities = () => {
    setSearchQuery("");
    setCurrentStep("cities");
  };

  // ── Step 1: Save Country (Single Field: Country Name) ──
  const handleSaveCountry = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newCountryName.trim();
    if (!name) {
      setCountryFormError("Country Name is required.");
      return;
    }

    // Duplicate check
    const isDuplicate = countries.some((c) => c.name.toLowerCase() === name.toLowerCase());
    if (isDuplicate) {
      setCountryFormError(`Country "${name}" already exists.`);
      return;
    }

    setIsSavingCountry(true);
    setCountryFormError("");

    try {
      const code = name.slice(0, 3).toUpperCase();
      const res = await adminClient.destinations.create("country", { name, code });
      if (!res.success) {
        setCountryFormError(res.message || "Failed to create country.");
        setIsSavingCountry(false);
        return;
      }

      setNewCountryName("");
      await loadAll();

      // Proceed to State Management with newly created country
      const createdCountry = (res.data as any)?.data || res.data;
      if (createdCountry && createdCountry.id) {
        setSelectedCountry(createdCountry);
        setSelectedState(null);
        setSelectedCity(null);
        setCurrentStep("states");
      }
    } catch (err: any) {
      setCountryFormError(err.message || "Failed to save country.");
    } finally {
      setIsSavingCountry(false);
    }
  };

  // ── Step 2: Save State (Single Field: State Name) ──
  const handleSaveState = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCountry) {
      setStateFormError("Parent country selection is required.");
      return;
    }

    const name = newStateName.trim();
    if (!name) {
      setStateFormError("State Name is required.");
      return;
    }

    // Duplicate check within selected country
    const isDuplicate = states.some(
      (s) => s.countryId === selectedCountry.id && s.name.toLowerCase() === name.toLowerCase()
    );
    if (isDuplicate) {
      setStateFormError(`State "${name}" already exists in ${selectedCountry.name}.`);
      return;
    }

    setIsSavingState(true);
    setStateFormError("");

    try {
      const res = await adminClient.destinations.create("state", {
        name,
        countryId: selectedCountry.id,
      });
      if (!res.success) {
        setStateFormError(res.message || "Failed to create state.");
        setIsSavingState(false);
        return;
      }

      setNewStateName("");
      await loadAll();

      // Proceed to City Management with newly created state
      const createdState = (res.data as any)?.data || res.data;
      if (createdState && createdState.id) {
        setSelectedState(createdState);
        setSelectedCity(null);
        setCurrentStep("cities");
      }
    } catch (err: any) {
      setStateFormError(err.message || "Failed to save state.");
    } finally {
      setIsSavingState(false);
    }
  };

  // ── Step 3: Save City (Single Field: City Name) ──
  const handleSaveCity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedState) {
      setCityFormError("Parent state selection is required.");
      return;
    }

    const name = newCityName.trim();
    if (!name) {
      setCityFormError("City Name is required.");
      return;
    }

    // Duplicate check within selected state
    const isDuplicate = cities.some(
      (c) => c.stateId === selectedState.id && c.name.toLowerCase() === name.toLowerCase()
    );
    if (isDuplicate) {
      setCityFormError(`City "${name}" already exists in ${selectedState.name}.`);
      return;
    }

    setIsSavingCity(true);
    setCityFormError("");

    const effectiveCountryId = selectedCountry?.id || selectedState.countryId;

    try {
      const res = await adminClient.destinations.create("city", {
        name,
        stateId: selectedState.id,
        countryId: effectiveCountryId,
      });
      if (!res.success) {
        setCityFormError(res.message || "Failed to create city.");
        setIsSavingCity(false);
        return;
      }

      setNewCityName("");
      await loadAll();

      // Proceed to Property Listing with newly created city
      const createdCity = (res.data as any)?.data || res.data;
      if (createdCity && createdCity.id) {
        setSelectedCity(createdCity);
        setCurrentStep("properties");
      }
    } catch (err: any) {
      setCityFormError(err.message || "Failed to save city.");
    } finally {
      setIsSavingCity(false);
    }
  };

  // ── Single-Field Edit Modal Handlers ──
  const handleOpenEdit = (type: "country" | "state" | "city", item: { id: string; name: string }) => {
    setEditEntityType(type);
    setEditingItem(item);
    setEditNameValue(item.name);
    setEditModalError("");
    setEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    const trimmed = editNameValue.trim();
    if (!trimmed) {
      setEditModalError("Name is required.");
      return;
    }

    // Client-side duplicate validation
    if (editEntityType === "country") {
      const dup = countries.some(
        (c) => c.id !== editingItem.id && c.name.toLowerCase() === trimmed.toLowerCase()
      );
      if (dup) {
        setEditModalError(`Country "${trimmed}" already exists.`);
        return;
      }
    } else if (editEntityType === "state" && selectedCountry) {
      const dup = states.some(
        (s) =>
          s.id !== editingItem.id &&
          s.countryId === selectedCountry.id &&
          s.name.toLowerCase() === trimmed.toLowerCase()
      );
      if (dup) {
        setEditModalError(`State "${trimmed}" already exists in ${selectedCountry.name}.`);
        return;
      }
    } else if (editEntityType === "city" && selectedState) {
      const dup = cities.some(
        (c) =>
          c.id !== editingItem.id &&
          c.stateId === selectedState.id &&
          c.name.toLowerCase() === trimmed.toLowerCase()
      );
      if (dup) {
        setEditModalError(`City "${trimmed}" already exists in ${selectedState.name}.`);
        return;
      }
    }

    setIsSavingEdit(true);
    setEditModalError("");

    try {
      const res = await adminClient.destinations.update(editEntityType, editingItem.id, {
        name: trimmed,
      });

      if (!res.success) {
        setEditModalError(res.message || "Failed to update record.");
        setIsSavingEdit(false);
        return;
      }

      await loadAll();

      // If updating currently selected item, update local state
      if (editEntityType === "country" && selectedCountry?.id === editingItem.id) {
        setSelectedCountry({ ...selectedCountry, name: trimmed });
      } else if (editEntityType === "state" && selectedState?.id === editingItem.id) {
        setSelectedState({ ...selectedState, name: trimmed });
      } else if (editEntityType === "city" && selectedCity?.id === editingItem.id) {
        setSelectedCity({ ...selectedCity, name: trimmed });
      }

      setEditModalOpen(false);
    } catch (err: any) {
      setEditModalError(err.message || "Failed to update record.");
    } finally {
      setIsSavingEdit(false);
    }
  };

  // ── Safe Delete Handlers with Dependency & Property Check ──
  const handleDeleteItem = async (type: "country" | "state" | "city", id: string, name: string) => {
    if (
      !confirm(
        `Are you sure you want to delete ${type} "${name}"? This will check for any registered sub-destinations or properties.`
      )
    ) {
      return;
    }

    try {
      const res = await adminClient.destinations.delete(type, id);
      if (!res.success) {
        alert(`Cannot delete ${type}: ${res.message}`);
        return;
      }

      // Reset selection if deleted
      if (type === "country" && selectedCountry?.id === id) {
        setSelectedCountry(null);
        setSelectedState(null);
        setSelectedCity(null);
        setCurrentStep("countries");
      } else if (type === "state" && selectedState?.id === id) {
        setSelectedState(null);
        setSelectedCity(null);
        setCurrentStep("states");
      } else if (type === "city" && selectedCity?.id === id) {
        setSelectedCity(null);
        setCurrentStep("cities");
      }

      await loadAll();
    } catch (err: any) {
      alert(`Delete error: ${err.message || "Operation failed"}`);
    }
  };

  // ── Property Creation & Management Handlers ──
  const handleOpenAddProperty = () => {
    if (!selectedCountry || !selectedState || !selectedCity) {
      alert("Hierarchy incomplete. Please select Country, State, and City.");
      return;
    }

    const defaultLocality = cityAreas.length > 0 ? cityAreas[0].name : selectedCity.name;
    const defaultAreaId = cityAreas.length > 0 ? cityAreas[0].id : "";
    const defaultPostal = cityAreas.length > 0 ? cityAreas[0].postalCode || "248001" : "248001";

    setIsEditPropertyMode(false);
    setEditingPropertyId(null);
    setPropertyForm({
      name: "",
      propertyType: "Luxury Hotels",
      shortDescription: `Curated premium accommodation in ${selectedCity.name}, ${selectedState.name}.`,
      detailedDescription: `Experience exceptional luxury, modern comforts, and world-class hospitality in the heart of ${selectedCity.name}, ${selectedState.name}. Surrounded by picturesque scenery and iconic local heritage.`,
      locality: defaultLocality,
      areaId: defaultAreaId,
      address: "",
      postalCode: defaultPostal,
      pricePerNight: 8500,
      originalPrice: 10500,
      maxGuests: 4,
      bedrooms: 2,
      bathrooms: 2,
      checkInTime: "14:00",
      checkOutTime: "11:00",
      amenities: ["Swimming Pool", "High-Speed Wi-Fi", "Air Conditioning", "Free Valet Parking", "Daily Housekeeping"],
      images: [
        {
          id: `img_${Date.now()}_0`,
          url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80",
          isCover: true,
          caption: "Main Resort Facade",
        },
      ],
      contactPerson: "HolidayExpertz Concierge Desk",
      mobileNumber: "+91 98765 43210",
      email: "concierge@holidayexpertz.com",
      altPhone: "",
      status: "approved",
      featured: false,
    });
    setPropertyModalError("");
    setNewImageUrl("");
    setPropertyModalOpen(true);
  };

  const handleOpenEditProperty = (prop: Property) => {
    setIsEditPropertyMode(true);
    setEditingPropertyId(prop.id);
    setPropertyForm({
      name: prop.name,
      propertyType: prop.propertyType,
      shortDescription: prop.shortDescription,
      detailedDescription: prop.detailedDescription,
      locality: prop.location.locality || selectedCity?.name || "",
      areaId: prop.areaId || prop.location.areaId || "",
      address: prop.location.address || "",
      postalCode: prop.location.postalCode || "",
      pricePerNight: prop.pricing.pricePerNight,
      originalPrice: prop.pricing.originalPrice || prop.pricing.pricePerNight * 1.2,
      maxGuests: prop.capacity.maxGuests,
      bedrooms: prop.capacity.bedrooms,
      bathrooms: prop.capacity.bathrooms,
      checkInTime: prop.capacity.checkInTime || "14:00",
      checkOutTime: prop.capacity.checkOutTime || "11:00",
      amenities: prop.amenities || [],
      images: prop.images || [],
      contactPerson: prop.contactDetails.contactPerson,
      mobileNumber: prop.contactDetails.mobileNumber,
      email: prop.contactDetails.email,
      altPhone: prop.contactDetails.altPhone || "",
      status: prop.status as any,
      featured: Boolean(prop.featured),
    });
    setPropertyModalError("");
    setNewImageUrl("");
    setPropertyModalOpen(true);
  };

  const handleSavePropertyForm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCountry || !selectedState || !selectedCity) {
      setPropertyModalError("Hierarchy context missing. Country, state, and city must be active.");
      return;
    }

    if (!propertyForm.name.trim() || propertyForm.name.trim().length < 3) {
      setPropertyModalError("Property name must be at least 3 characters.");
      return;
    }

    if (!propertyForm.address.trim()) {
      setPropertyModalError("Full street address is required.");
      return;
    }

    if (propertyForm.pricePerNight <= 0) {
      setPropertyModalError("Valid price per night greater than 0 is required.");
      return;
    }

    if (propertyForm.images.length === 0 || !propertyForm.images[0].url) {
      setPropertyModalError("At least one cover photo is required.");
      return;
    }

    setIsSubmittingProperty(true);
    setPropertyModalError("");

    try {
      if (isEditPropertyMode && editingPropertyId) {
        // Edit existing property
        const updates = {
          name: propertyForm.name.trim(),
          propertyType: propertyForm.propertyType,
          shortDescription: propertyForm.shortDescription.trim(),
          detailedDescription: propertyForm.detailedDescription.trim(),
          pricePerNight: propertyForm.pricePerNight,
          originalPrice: propertyForm.originalPrice || undefined,
          maxGuests: propertyForm.maxGuests,
          bedrooms: propertyForm.bedrooms,
          bathrooms: propertyForm.bathrooms,
          checkInTime: propertyForm.checkInTime,
          checkOutTime: propertyForm.checkOutTime,
          amenities: propertyForm.amenities,
          images: propertyForm.images,
          contactDetails: {
            contactPerson: propertyForm.contactPerson.trim(),
            mobileNumber: propertyForm.mobileNumber.trim(),
            email: propertyForm.email.trim(),
            altPhone: propertyForm.altPhone.trim() || undefined,
          },
          status: propertyForm.status,
          featured: propertyForm.featured,
          locality: propertyForm.locality.trim(),
          address: propertyForm.address.trim(),
          postalCode: propertyForm.postalCode.trim(),
          countryId: selectedCountry.id,
          stateId: selectedState.id,
          cityId: selectedCity.id,
          areaId: propertyForm.areaId || undefined,
        };

        const res = await adminClient.properties.edit(editingPropertyId, updates);
        if (!res.success) {
          setPropertyModalError(res.message || "Failed to update property.");
          setIsSubmittingProperty(false);
          return;
        }
      } else {
        // Create new property under Country -> State -> City
        const payload = {
          name: propertyForm.name.trim(),
          propertyType: propertyForm.propertyType,
          shortDescription: propertyForm.shortDescription.trim(),
          detailedDescription: propertyForm.detailedDescription.trim(),
          countryId: selectedCountry.id,
          stateId: selectedState.id,
          cityId: selectedCity.id,
          areaId: propertyForm.areaId || undefined,
          locality: propertyForm.locality.trim(),
          address: propertyForm.address.trim(),
          postalCode: propertyForm.postalCode.trim(),
          pricePerNight: propertyForm.pricePerNight,
          originalPrice: propertyForm.originalPrice || undefined,
          maxGuests: propertyForm.maxGuests,
          bedrooms: propertyForm.bedrooms,
          bathrooms: propertyForm.bathrooms,
          checkInTime: propertyForm.checkInTime,
          checkOutTime: propertyForm.checkOutTime,
          amenities: propertyForm.amenities,
          images: propertyForm.images,
          contactPerson: propertyForm.contactPerson.trim(),
          mobileNumber: propertyForm.mobileNumber.trim(),
          email: propertyForm.email.trim(),
          altPhone: propertyForm.altPhone.trim() || undefined,
          status: propertyForm.status,
          featured: propertyForm.featured,
        };

        const res = await adminClient.properties.create(payload);
        if (!res.success) {
          setPropertyModalError(res.message || "Failed to create property.");
          setIsSubmittingProperty(false);
          return;
        }
      }

      setPropertyModalOpen(false);
      await loadProperties();
      await loadAll();
    } catch (err: any) {
      setPropertyModalError(err.message || "Failed to save property.");
    } finally {
      setIsSubmittingProperty(false);
    }
  };

  const handleTogglePause = async (propertyId: string) => {
    const res = await adminClient.properties.togglePause(propertyId);
    if (res.success) {
      await loadProperties();
    }
  };

  const handleToggleFeatured = async (propertyId: string) => {
    const res = await adminClient.properties.toggleFeatured(propertyId);
    if (res.success) {
      await loadProperties();
    }
  };

  const handleDeleteProperty = async (prop: Property) => {
    if (!confirm(`Are you sure you want to delete property "${prop.name}"?`)) return;
    const res = await adminClient.properties.delete(prop.id);
    if (res.success) {
      await loadProperties();
      await loadAll();
    } else {
      alert(`Cannot delete property: ${res.message}`);
    }
  };

  // Property Photo Handlers
  const handleAddPresetPhoto = (url: string, name: string) => {
    setPropertyForm((prev) => ({
      ...prev,
      images: [
        ...prev.images,
        {
          id: `img_${Date.now()}_${prev.images.length}`,
          url,
          caption: name,
          isCover: prev.images.length === 0,
        },
      ],
    }));
  };

  const handleAddCustomPhoto = () => {
    if (!newImageUrl.trim()) return;
    setPropertyForm((prev) => ({
      ...prev,
      images: [
        ...prev.images,
        {
          id: `img_${Date.now()}_${prev.images.length}`,
          url: newImageUrl.trim(),
          caption: `Photo ${prev.images.length + 1}`,
          isCover: prev.images.length === 0,
        },
      ],
    }));
    setNewImageUrl("");
  };

  const handleSetCoverPhoto = (imgId: string) => {
    setPropertyForm((prev) => ({
      ...prev,
      images: prev.images.map((img) => ({
        ...img,
        isCover: img.id === imgId,
      })),
    }));
  };

  const handleRemovePhoto = (imgId: string) => {
    setPropertyForm((prev) => {
      const remaining = prev.images.filter((img) => img.id !== imgId);
      if (remaining.length > 0 && !remaining.some((img) => img.isCover)) {
        remaining[0].isCover = true;
      }
      return { ...prev, images: remaining };
    });
  };

  // Amenity Toggle Handlers
  const handleToggleAmenity = (amenity: string) => {
    setPropertyForm((prev) => {
      const exists = prev.amenities.includes(amenity);
      return {
        ...prev,
        amenities: exists
          ? prev.amenities.filter((a) => a !== amenity)
          : [...prev.amenities, amenity],
      };
    });
  };

  const handleAddCustomAmenity = () => {
    const trimmed = customAmenity.trim();
    if (trimmed && !propertyForm.amenities.includes(trimmed)) {
      setPropertyForm((prev) => ({
        ...prev,
        amenities: [...prev.amenities, trimmed],
      }));
    }
    setCustomAmenity("");
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* ─────────────────────────────────────────────────────────────
            HEADER & WORKFLOW STATUS BAR
        ───────────────────────────────────────────────────────────── */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 text-teal-400 text-xs font-semibold mb-2">
                <Globe className="w-3.5 h-3.5" />
                <span>Super Admin Destinations Workflow</span>
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Destinations Management
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Streamlined hierarchy:{" "}
                <span className="text-teal-400 font-semibold">
                  Add Destination → Country Name → State Name → City Name → Property Listing
                </span>
              </p>
            </div>

            {/* Quick Action / Mode Switcher */}
            <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
              {currentStep !== "dashboard" ? (
                <button
                  onClick={handleBackToDashboard}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider transition-all"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Destinations Dashboard</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setCurrentStep("hero_slides")}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/30 font-bold text-xs uppercase tracking-wider transition-all shadow-sm"
                  >
                    <ImageIcon className="w-4 h-4" />
                    <span>Hero Slideshows</span>
                  </button>
                  <button
                    onClick={() => setCurrentStep("featured_destinations")}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold text-xs uppercase tracking-wider transition-all shadow-sm"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Featured Destinations</span>
                  </button>
                  <button
                    onClick={handleStartWorkflow}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-teal-500/20 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Destination Workflow</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Flow Stepper Progress Bar (Visible across country/state/city/properties steps) */}
          {currentStep !== "hero_slides" && currentStep !== "featured_destinations" && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6">
              {/* Step 1: Country */}
              <button
                onClick={() => {
                  setSearchQuery("");
                  setCurrentStep("countries");
                }}
                className={`p-3.5 rounded-2xl border text-left transition-all ${
                  currentStep === "countries"
                    ? "bg-teal-500/15 border-teal-500/50 shadow-md ring-1 ring-teal-500/20"
                    : selectedCountry
                    ? "bg-slate-950/70 border-teal-500/30 text-teal-300"
                    : "bg-slate-950/50 border-slate-800 hover:border-slate-700 text-slate-400"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                    Step 1
                  </span>
                  {selectedCountry && <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />}
                </div>
                <span className="text-sm font-bold text-white mt-0.5 block truncate">
                  {selectedCountry ? selectedCountry.name : "Country Name"}
                </span>
                <span className="text-xs text-slate-400 mt-1 block">
                  {countries.length} Available Countries
                </span>
              </button>

              {/* Step 2: State */}
              <button
                onClick={() => {
                  if (selectedCountry) {
                    setSelectedCity(null);
                    setSearchQuery("");
                    setCurrentStep("states");
                  }
                }}
                disabled={!selectedCountry}
                className={`p-3.5 rounded-2xl border text-left transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                  currentStep === "states"
                    ? "bg-teal-500/15 border-teal-500/50 shadow-md ring-1 ring-teal-500/20"
                    : selectedState
                    ? "bg-slate-950/70 border-teal-500/30 text-teal-300"
                    : "bg-slate-950/50 border-slate-800 hover:border-slate-700 text-slate-400"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                    Step 2
                  </span>
                  {selectedState && <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />}
                </div>
                <span className="text-sm font-bold text-white mt-0.5 block truncate">
                  {selectedState ? selectedState.name : "State Name"}
                </span>
                <span className="text-xs text-slate-400 mt-1 block">
                  {selectedCountry ? `${filteredStatesForCountry.length} in ${selectedCountry.name}` : "Select Country First"}
                </span>
              </button>

              {/* Step 3: City */}
              <button
                onClick={() => {
                  if (selectedState) {
                    setSearchQuery("");
                    setCurrentStep("cities");
                  }
                }}
                disabled={!selectedState}
                className={`p-3.5 rounded-2xl border text-left transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                  currentStep === "cities"
                    ? "bg-teal-500/15 border-teal-500/50 shadow-md ring-1 ring-teal-500/20"
                    : selectedCity
                    ? "bg-slate-950/70 border-teal-500/30 text-teal-300"
                    : "bg-slate-950/50 border-slate-800 hover:border-slate-700 text-slate-400"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                    Step 3
                  </span>
                  {selectedCity && <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />}
                </div>
                <span className="text-sm font-bold text-white mt-0.5 block truncate">
                  {selectedCity ? selectedCity.name : "City Name"}
                </span>
                <span className="text-xs text-slate-400 mt-1 block">
                  {selectedState ? `${filteredCitiesForState.length} in ${selectedState.name}` : "Select State First"}
                </span>
              </button>

              {/* Step 4: Property Listing */}
              <button
                onClick={() => {
                  if (selectedCity) {
                    setSearchQuery("");
                    setCurrentStep("properties");
                    loadProperties();
                  }
                }}
                disabled={!selectedCity}
                className={`p-3.5 rounded-2xl border text-left transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                  currentStep === "properties"
                    ? "bg-teal-500/15 border-teal-500/50 shadow-md ring-1 ring-teal-500/20"
                    : "bg-slate-950/50 border-slate-800 hover:border-slate-700 text-slate-400"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                    Step 4
                  </span>
                  {currentStep === "properties" && <Sparkles className="w-3.5 h-3.5 text-teal-400" />}
                </div>
                <span className="text-sm font-bold text-teal-400 mt-0.5 block truncate">
                  Property Listing
                </span>
                <span className="text-xs text-slate-400 mt-1 block">
                  {selectedCity ? `${properties.length} in ${selectedCity.name}` : "Select City First"}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* ─────────────────────────────────────────────────────────────
            DASHBOARD VIEW (First Card: Add Destination)
        ───────────────────────────────────────────────────────────── */}
        {currentStep === "dashboard" && (
          <div className="space-y-6">
            {/* Grid of Cards: The very first card MUST be "Add Destination" */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* ── CARD 1: ADD DESTINATION (Mandatory First Card) ── */}
              <div
                onClick={handleStartWorkflow}
                id="add-destination-card"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleStartWorkflow();
                  }
                }}
                className="relative overflow-hidden p-6 rounded-3xl bg-gradient-to-br from-teal-500/20 via-slate-900 to-slate-900 border-2 border-teal-500/40 hover:border-teal-400 transition-all cursor-pointer shadow-xl hover:shadow-teal-500/10 group flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-teal-500 text-slate-950 flex items-center justify-center font-bold mb-4 shadow-lg shadow-teal-500/30 group-hover:scale-105 transition-transform">
                    <Plus className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <h2 className="text-lg font-bold text-white tracking-tight group-hover:text-teal-300 transition-colors">
                    Add Destination
                  </h2>
                  <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                    Manage countries, states, cities and their properties.
                  </p>
                </div>
                <div className="pt-5 mt-4 border-t border-teal-500/20 flex items-center justify-between text-xs font-bold text-teal-400">
                  <span>Start Flow</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* CARD 2: Total Countries */}
              <div
                onClick={() => {
                  setSelectedCountry(null);
                  setSelectedState(null);
                  setSelectedCity(null);
                  setCurrentStep("countries");
                }}
                className="p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer shadow-lg flex flex-col justify-between group"
              >
                <div>
                  <div className="w-10 h-10 rounded-2xl bg-slate-800 text-teal-400 flex items-center justify-center mb-4">
                    <Globe className="w-5 h-5" />
                  </div>
                  <span className="text-2xl font-extrabold text-white block">
                    {counts?.countriesCount || countries.length}
                  </span>
                  <h3 className="text-sm font-semibold text-slate-300 mt-1">Countries</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Top-level jurisdictions</p>
                </div>
                <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 group-hover:text-white transition-colors">
                  <span>View Countries</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* CARD 3: Total States */}
              <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-lg flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-2xl bg-slate-800 text-teal-400 flex items-center justify-center mb-4">
                    <Layers className="w-5 h-5" />
                  </div>
                  <span className="text-2xl font-extrabold text-white block">
                    {counts?.statesCount || states.length}
                  </span>
                  <h3 className="text-sm font-semibold text-slate-300 mt-1">States / Provinces</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Child regions of countries</p>
                </div>
                <div className="pt-4 border-t border-slate-800 text-xs text-slate-400">
                  <span>Hierarchy Level 2</span>
                </div>
              </div>

              {/* CARD 4: Total Cities & Properties */}
              <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-lg flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-2xl bg-slate-800 text-teal-400 flex items-center justify-center mb-4">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <span className="text-2xl font-extrabold text-white block">
                    {counts?.citiesCount || cities.length}
                  </span>
                  <h3 className="text-sm font-semibold text-slate-300 mt-1">Cities & Hubs</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {counts?.propertiesCount || 0} Listed Properties
                  </p>
                </div>
                <div className="pt-4 border-t border-slate-800 text-xs text-slate-400">
                  <span>Hierarchy Level 3 & 4</span>
                </div>
              </div>
            </div>

            {/* Quick Destination Directory Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 flex-wrap gap-3">
                <div>
                  <h2 className="text-base font-bold text-white">Active Destinations Directory</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Select any country to begin managing its states, cities, and properties.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentStep("hero_slides")}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-teal-300 hover:bg-slate-700 text-xs font-bold border border-slate-700 transition-colors"
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-teal-400" />
                    <span>Hero Slideshows</span>
                  </button>
                  <button
                    onClick={() => setCurrentStep("featured_destinations")}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-amber-300 hover:bg-slate-700 text-xs font-bold border border-slate-700 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Featured Destinations</span>
                  </button>
                  <button
                    onClick={handleStartWorkflow}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-500/10 text-teal-400 hover:bg-teal-500/20 text-xs font-bold border border-teal-500/30 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Destination Flow</span>
                  </button>
                </div>
              </div>

              {isLoading ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin text-teal-400 mb-2" />
                  <p className="text-xs">Loading destinations directory...</p>
                </div>
              ) : countries.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-xs text-slate-400">No destinations found yet.</p>
                  <button
                    onClick={handleStartWorkflow}
                    className="mt-3 px-4 py-2 rounded-xl bg-teal-500 text-slate-950 font-bold text-xs"
                  >
                    Add First Country
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-slate-800/80 mt-2">
                  {countries.map((c) => {
                    const countryStates = states.filter((s) => s.countryId === c.id);
                    return (
                      <div
                        key={c.id}
                        className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-teal-400 font-bold text-xs">
                            {c.code || c.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-white group-hover:text-teal-300 transition-colors">
                              {c.name}
                            </h3>
                            <span className="text-xs text-slate-400">
                              {countryStates.length} states registered
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          <button
                            onClick={() => handleSelectCountry(c)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold transition-all shadow-sm"
                          >
                            <span>Manage States</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit("country", { id: c.id, name: c.name })}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                            title="Edit Country Name"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem("country", c.id, c.name)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                            title="Delete Country"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            HERO SLIDESHOW MANAGEMENT VIEW (Country & State Hero Images)
        ───────────────────────────────────────────────────────────── */}
        {currentStep === "hero_slides" && (
          <DestinationHeroImageManager
            countries={countries}
            states={states}
            onBack={() => setCurrentStep("dashboard")}
          />
        )}

        {/* ─────────────────────────────────────────────────────────────
            FEATURED DESTINATIONS MANAGEMENT VIEW
        ───────────────────────────────────────────────────────────── */}
        {currentStep === "featured_destinations" && (
          <FeaturedDestinationManager
            countries={countries}
            states={states}
            cities={cities}
            areas={areas}
            onBack={() => setCurrentStep("dashboard")}
          />
        )}

        {/* ─────────────────────────────────────────────────────────────
            STEP 1: COUNTRY MANAGEMENT (Single Field: Country Name)
        ───────────────────────────────────────────────────────────── */}
        {currentStep === "countries" && (
          <div className="space-y-6">
            {/* Breadcrumb & Navigation */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                <button
                  onClick={handleBackToDashboard}
                  className="hover:text-teal-400 transition-colors flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Destinations</span>
                </button>
                <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                <span className="text-white font-bold">Step 1 — Country Management</span>
              </div>

              {/* Quick Search */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search countries..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
                />
              </div>
            </div>

            {/* Country Form: EXACTLY ONE EDITABLE FIELD (Country Name) */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
              <div className="mb-4">
                <h2 className="text-base font-bold text-white">Add Country</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Enter the country name to establish the top-level destination.
                </p>
              </div>

              <form onSubmit={handleSaveCountry} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Country Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. India"
                    value={newCountryName}
                    onChange={(e) => {
                      setNewCountryName(e.target.value);
                      if (countryFormError) setCountryFormError("");
                    }}
                    className="w-full sm:max-w-md bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500 transition-colors"
                  />
                </div>

                {countryFormError && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2 sm:max-w-md">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{countryFormError}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={isSavingCountry || !newCountryName.trim()}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-teal-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{isSavingCountry ? "Saving..." : "Save Country"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setNewCountryName("");
                      setCountryFormError("");
                    }}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>

            {/* Existing Countries List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Existing Countries ({countries.length})
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {countries
                  .filter((c) =>
                    searchQuery.trim()
                      ? c.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
                      : true
                  )
                  .map((country) => {
                    const countryStates = states.filter((s) => s.countryId === country.id);
                    return (
                      <div
                        key={country.id}
                        className="p-5 rounded-3xl bg-slate-900 border border-slate-800 hover:border-teal-500/40 transition-all flex flex-col justify-between group shadow-lg"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <span className="px-2.5 py-1 rounded-lg bg-teal-500/10 text-teal-400 font-mono text-xs font-bold border border-teal-500/20">
                              {country.code || country.name.slice(0, 3).toUpperCase()}
                            </span>

                            <div className="flex items-center gap-1">
                              <button
                                onClick={() =>
                                  handleOpenEdit("country", { id: country.id, name: country.name })
                                }
                                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                                title="Edit Country Name"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteItem("country", country.id, country.name)}
                                className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800 transition-colors"
                                title="Delete Country"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <h3 className="text-base font-bold text-white group-hover:text-teal-400 transition-colors">
                            {country.name}
                          </h3>
                          <p className="text-xs text-slate-400 mt-1">
                            {countryStates.length} states registered
                          </p>
                        </div>

                        <div className="pt-4 mt-4 border-t border-slate-800">
                          <button
                            onClick={() => handleSelectCountry(country)}
                            className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-800 hover:bg-teal-500 hover:text-slate-950 text-slate-300 font-bold text-xs uppercase tracking-wider transition-all"
                          >
                            <span>Manage States</span>
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            STEP 2: STATE MANAGEMENT (Single Field: State Name)
        ───────────────────────────────────────────────────────────── */}
        {currentStep === "states" && selectedCountry && (
          <div className="space-y-6">
            {/* Breadcrumb & Navigation */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 flex-wrap">
                <button
                  onClick={handleBackToDashboard}
                  className="hover:text-teal-400 transition-colors"
                >
                  Destinations
                </button>
                <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                <button
                  onClick={handleBackToCountries}
                  className="hover:text-teal-400 transition-colors"
                >
                  Countries
                </button>
                <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                <span className="text-teal-400 font-bold">{selectedCountry.name}</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                <span className="text-white font-bold">Step 2 — State Management</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleBackToCountries}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Countries</span>
                </button>

                {/* Quick Search */}
                <div className="relative w-full sm:w-56">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder={`Search states in ${selectedCountry.name}...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Context Display Banner */}
            <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-teal-400" />
                <span className="text-xs text-slate-400">
                  Selected Country:{" "}
                  <strong className="text-white text-sm">{selectedCountry.name}</strong>
                </span>
              </div>
              <span className="text-xs text-teal-300 bg-teal-500/20 px-2.5 py-0.5 rounded-full font-semibold">
                Parent assigned automatically
              </span>
            </div>

            {/* State Form: EXACTLY ONE EDITABLE FIELD (State Name) */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
              <div className="mb-4">
                <h2 className="text-base font-bold text-white">Add State</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Enter the state name for {selectedCountry.name}. Parent country is assigned automatically.
                </p>
              </div>

              <form onSubmit={handleSaveState} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    State Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Uttarakhand"
                    value={newStateName}
                    onChange={(e) => {
                      setNewStateName(e.target.value);
                      if (stateFormError) setStateFormError("");
                    }}
                    className="w-full sm:max-w-md bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500 transition-colors"
                  />
                </div>

                {stateFormError && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2 sm:max-w-md">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{stateFormError}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={isSavingState || !newStateName.trim()}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-teal-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{isSavingState ? "Saving..." : "Save State"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setNewStateName("");
                      setStateFormError("");
                    }}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>

            {/* Existing States List for Selected Country */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  States in {selectedCountry.name} ({filteredStatesForCountry.length})
                </h3>
              </div>

              {filteredStatesForCountry.length === 0 ? (
                <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-3xl text-xs text-slate-400">
                  No states added to {selectedCountry.name} yet. Use the form above to add the first state.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredStatesForCountry
                    .filter((s) =>
                      searchQuery.trim()
                        ? s.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
                        : true
                    )
                    .map((state) => {
                      const stateCities = cities.filter((c) => c.stateId === state.id);
                      return (
                        <div
                          key={state.id}
                          className="p-5 rounded-3xl bg-slate-900 border border-slate-800 hover:border-teal-500/40 transition-all flex flex-col justify-between group shadow-lg"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                State / Province
                              </span>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() =>
                                    handleOpenEdit("state", { id: state.id, name: state.name })
                                  }
                                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                                  title="Edit State Name"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteItem("state", state.id, state.name)}
                                  className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800 transition-colors"
                                  title="Delete State"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            <h3 className="text-base font-bold text-white group-hover:text-teal-400 transition-colors">
                              {state.name}
                            </h3>
                            <p className="text-xs text-slate-400 mt-1">
                              {stateCities.length} cities registered
                            </p>
                          </div>

                          <div className="pt-4 mt-4 border-t border-slate-800">
                            <button
                              onClick={() => handleSelectState(state)}
                              className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-800 hover:bg-teal-500 hover:text-slate-950 text-slate-300 font-bold text-xs uppercase tracking-wider transition-all"
                            >
                              <span>Manage Cities</span>
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            STEP 3: CITY MANAGEMENT (Single Field: City Name)
        ───────────────────────────────────────────────────────────── */}
        {currentStep === "cities" && selectedCountry && selectedState && (
          <div className="space-y-6">
            {/* Breadcrumb & Navigation */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 flex-wrap">
                <button
                  onClick={handleBackToDashboard}
                  className="hover:text-teal-400 transition-colors"
                >
                  Destinations
                </button>
                <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                <button
                  onClick={handleBackToCountries}
                  className="hover:text-teal-400 transition-colors"
                >
                  {selectedCountry.name}
                </button>
                <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                <button
                  onClick={handleBackToStates}
                  className="hover:text-teal-400 transition-colors"
                >
                  {selectedState.name}
                </button>
                <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                <span className="text-white font-bold">Step 3 — City Management</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleBackToStates}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to States</span>
                </button>

                {/* Quick Search */}
                <div className="relative w-full sm:w-56">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder={`Search cities in ${selectedState.name}...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Context Hierarchy Display Banner */}
            <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-teal-400" />
                <span className="text-xs text-slate-400">
                  Country: <strong className="text-white">{selectedCountry.name}</strong> → State:{" "}
                  <strong className="text-white">{selectedState.name}</strong>
                </span>
              </div>
              <span className="text-xs text-teal-300 bg-teal-500/20 px-2.5 py-0.5 rounded-full font-semibold">
                State & Country assigned automatically
              </span>
            </div>

            {/* City Form: EXACTLY ONE EDITABLE FIELD (City Name) */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
              <div className="mb-4">
                <h2 className="text-base font-bold text-white">Add City</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Enter the city name for {selectedState.name}, {selectedCountry.name}.
                </p>
              </div>

              <form onSubmit={handleSaveCity} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    City Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dehradun"
                    value={newCityName}
                    onChange={(e) => {
                      setNewCityName(e.target.value);
                      if (cityFormError) setCityFormError("");
                    }}
                    className="w-full sm:max-w-md bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500 transition-colors"
                  />
                </div>

                {cityFormError && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2 sm:max-w-md">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{cityFormError}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={isSavingCity || !newCityName.trim()}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-teal-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{isSavingCity ? "Saving..." : "Save City"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setNewCityName("");
                      setCityFormError("");
                    }}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>

            {/* Existing Cities List for Selected State */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Cities in {selectedState.name} ({filteredCitiesForState.length})
                </h3>
              </div>

              {filteredCitiesForState.length === 0 ? (
                <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-3xl text-xs text-slate-400">
                  No cities added to {selectedState.name} yet. Use the form above to add the first city.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredCitiesForState
                    .filter((c) =>
                      searchQuery.trim()
                        ? c.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
                        : true
                    )
                    .map((city) => (
                      <div
                        key={city.id}
                        className="p-5 rounded-3xl bg-slate-900 border border-slate-800 hover:border-teal-500/40 transition-all flex flex-col justify-between group shadow-lg"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400">
                              City Destination
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() =>
                                  handleOpenEdit("city", { id: city.id, name: city.name })
                                }
                                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                                title="Edit City Name"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteItem("city", city.id, city.name)}
                                className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800 transition-colors"
                                title="Delete City"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <h3 className="text-base font-bold text-white group-hover:text-teal-400 transition-colors">
                            {city.name}
                          </h3>
                          <p className="text-xs text-slate-400 mt-1">
                            {selectedState.name}, {selectedCountry.name}
                          </p>
                        </div>

                        <div className="pt-4 mt-4 border-t border-slate-800">
                          <button
                            onClick={() => handleSelectCity(city)}
                            className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-800 hover:bg-teal-500 hover:text-slate-950 text-slate-300 font-bold text-xs uppercase tracking-wider transition-all"
                          >
                            <Building2 className="w-4 h-4" />
                            <span>View Properties</span>
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            STEP 4: PROPERTY LISTING (Context: Country -> State -> City)
        ───────────────────────────────────────────────────────────── */}
        {currentStep === "properties" && selectedCountry && selectedState && selectedCity && (
          <div className="space-y-6">
            {/* Display-Only Contextual Breadcrumbs */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 flex-wrap">
                <button
                  onClick={handleBackToDashboard}
                  className="hover:text-teal-400 transition-colors"
                >
                  Destinations
                </button>
                <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                <button
                  onClick={handleBackToCountries}
                  className="hover:text-teal-400 transition-colors"
                >
                  {selectedCountry.name}
                </button>
                <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                <button
                  onClick={handleBackToStates}
                  className="hover:text-teal-400 transition-colors"
                >
                  {selectedState.name}
                </button>
                <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                <button
                  onClick={handleBackToCities}
                  className="hover:text-teal-400 transition-colors"
                >
                  {selectedCity.name}
                </button>
                <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                <span className="text-teal-400 font-bold">Property Listing</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleBackToCities}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Cities</span>
                </button>

                <button
                  onClick={handleOpenAddProperty}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-teal-500/20 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Property</span>
                </button>
              </div>
            </div>

            {/* Contextual Hierarchy Banner */}
            <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-teal-400 shrink-0" />
                <span className="text-xs text-slate-300 font-medium">
                  {selectedCountry.name} → {selectedState.name} →{" "}
                  <strong className="text-white text-sm">{selectedCity.name}</strong>
                </span>
              </div>
              <span className="text-xs text-teal-300 bg-teal-500/20 px-3 py-1 rounded-full font-bold">
                {filteredPropertiesForCity.length} Properties in {selectedCity.name}
              </span>
            </div>

            {/* Search & Filter Toolbar */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={`Search properties in ${selectedCity.name}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={propertyFilterType}
                  onChange={(e) => setPropertyFilterType(e.target.value)}
                  aria-label="Filter properties by type"
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-teal-500 text-xs"
                >
                  <option value="all">All Property Types</option>
                  {PROPERTY_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>

                <select
                  value={propertyFilterStatus}
                  onChange={(e) => setPropertyFilterStatus(e.target.value)}
                  aria-label="Filter properties by status"
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-teal-500 text-xs"
                >
                  <option value="all">All Statuses</option>
                  <option value="approved">Approved / Live</option>
                  <option value="pending_approval">Pending Approval</option>
                  <option value="paused">Paused</option>
                  <option value="draft">Draft</option>
                </select>
              </div>
            </div>

            {/* Properties Grid */}
            {isPropertiesLoading ? (
              <div className="py-20 flex flex-col items-center justify-center text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin text-teal-400 mb-2" />
                <p className="text-xs">Fetching properties in {selectedCity.name}...</p>
              </div>
            ) : filteredPropertiesForCity.length === 0 ? (
              <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl">
                <div className="w-14 h-14 rounded-3xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 mx-auto mb-4">
                  <Building2 className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-white">
                  No properties found in {selectedCity.name} yet
                </h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 leading-relaxed">
                  Add the first property under {selectedCity.name}, {selectedState.name}. It will automatically inherit this hierarchy and appear in both admin and public searches.
                </p>
                <button
                  onClick={handleOpenAddProperty}
                  className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold uppercase tracking-wider shadow-lg shadow-teal-500/20 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add First Property in {selectedCity.name}</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPropertiesForCity.map((prop) => (
                  <div
                    key={prop.id}
                    className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden hover:border-slate-700 transition-all shadow-lg flex flex-col justify-between"
                  >
                    <div>
                      {/* Photo & Badges */}
                      <div className="relative h-44 bg-slate-800 overflow-hidden">
                        {prop.images?.[0]?.url ? (
                          <img
                            src={prop.images[0].url}
                            alt={prop.name}
                            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-600">
                            <Building2 className="w-10 h-10" />
                          </div>
                        )}

                        <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
                          <span className="px-2.5 py-1 rounded-lg bg-slate-950/80 backdrop-blur-md text-teal-300 font-bold text-[10px] uppercase tracking-wider border border-white/10">
                            {prop.propertyType}
                          </span>
                          {prop.featured && (
                            <span className="px-2 py-0.5 rounded-lg bg-amber-500/90 text-slate-950 text-[10px] font-extrabold flex items-center gap-1 shadow-md">
                              <Star className="w-3 h-3 fill-slate-950" />
                              <span>Featured</span>
                            </span>
                          )}
                        </div>

                        <div className="absolute top-3 right-3">
                          <span
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold capitalize backdrop-blur-md border ${
                              prop.status === "approved"
                                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                                : prop.status === "pending_approval"
                                ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                                : prop.status === "paused"
                                ? "bg-purple-500/20 text-purple-300 border-purple-500/30"
                                : "bg-red-500/20 text-red-300 border-red-500/30"
                            }`}
                          >
                            {prop.status.replace("_", " ")}
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4 space-y-2">
                        <h3 className="text-sm font-bold text-white truncate" title={prop.name}>
                          {prop.name}
                        </h3>

                        <div className="flex items-start gap-1.5 text-slate-400 text-xs">
                          <MapPin className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
                          <span className="truncate text-[11px]">
                            {prop.location.locality ? `${prop.location.locality}, ` : ""}
                            {selectedCity.name}, {selectedState.name}
                          </span>
                        </div>

                        <div className="pt-2 flex items-center justify-between border-t border-slate-800 text-xs">
                          <span className="text-white font-extrabold text-sm">
                            ₹{prop.pricing.pricePerNight?.toLocaleString()}
                            <span className="text-slate-500 text-[11px] font-normal"> / night</span>
                          </span>
                          <span className="text-slate-400 text-[11px]">
                            {prop.capacity.maxGuests} guests • {prop.capacity.bedrooms} bed
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions Toolbar */}
                    <div className="p-3 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between gap-1 text-xs">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setViewingProperty(prop);
                            setViewPropertyModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                          title="View Property Sheet"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEditProperty(prop)}
                          className="p-1.5 text-slate-400 hover:text-teal-400 hover:bg-slate-800 rounded-lg transition-colors"
                          title="Edit Property"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleTogglePause(prop.id)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            prop.status === "paused"
                              ? "text-purple-400 hover:bg-purple-500/10"
                              : "text-slate-400 hover:text-white hover:bg-slate-800"
                          }`}
                          title={prop.status === "paused" ? "Publish Property" : "Pause Property"}
                        >
                          {prop.status === "paused" ? (
                            <PlayCircle className="w-3.5 h-3.5" />
                          ) : (
                            <PauseCircle className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() => handleToggleFeatured(prop.id)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            prop.featured
                              ? "text-amber-400 hover:bg-amber-500/10"
                              : "text-slate-400 hover:text-white hover:bg-slate-800"
                          }`}
                          title={prop.featured ? "Unmark Featured" : "Mark Featured"}
                        >
                          <Star className={`w-3.5 h-3.5 ${prop.featured ? "fill-amber-400" : ""}`} />
                        </button>
                      </div>

                      <button
                        onClick={() => handleDeleteProperty(prop)}
                        className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                        title="Delete Property"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            SINGLE-FIELD EDIT MODAL (Country / State / City)
        ───────────────────────────────────────────────────────────── */}
        {editModalOpen && editingItem && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-base font-bold text-white capitalize">
                  Edit {editEntityType}
                </h3>
                <button
                  onClick={() => setEditModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {editModalError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                  {editModalError}
                </div>
              )}

              <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1.5 capitalize">
                    {editEntityType} Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editNameValue}
                    onChange={(e) => {
                      setEditNameValue(e.target.value);
                      if (editModalError) setEditModalError("");
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-teal-500 text-xs"
                  />
                </div>

                <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingEdit || !editNameValue.trim()}
                    className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold uppercase tracking-wider disabled:opacity-50"
                  >
                    {isSavingEdit ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            MODAL: ADD / EDIT PROPERTY FORM
        ───────────────────────────────────────────────────────────── */}
        {propertyModalOpen && selectedCountry && selectedState && selectedCity && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 shadow-2xl space-y-6">
              {/* Modal Top Header with Clear Destination Breadcrumb */}
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-1.5 text-xs text-teal-400 font-bold flex-wrap">
                    <span>{selectedCountry.name}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                    <span>{selectedState.name}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                    <span>{selectedCity.name}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-white">
                      {isEditPropertyMode ? "Edit Property" : "Add Property"}
                    </span>
                  </div>

                  <button
                    onClick={() => setPropertyModalOpen(false)}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="mt-4">
                  <h2 className="text-xl font-bold text-white tracking-tight">
                    {isEditPropertyMode ? `Edit Property Details` : `Create Property in ${selectedCity.name}`}
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Destination hierarchy is automatically locked to this city context and validated on the server.
                  </p>
                </div>

                {/* Pre-Populated Canonical Banner */}
                <div className="mt-3 p-3.5 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0" />
                    <div className="text-xs">
                      <span className="text-slate-400">Canonical Location: </span>
                      <span className="text-white font-bold">
                        {selectedCountry.name} → {selectedState.name} → {selectedCity.name}
                      </span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-teal-500/20 text-teal-300 text-[10px] font-bold">
                    Hierarchy Locked
                  </span>
                </div>
              </div>

              {propertyModalError && (
                <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{propertyModalError}</span>
                </div>
              )}

              <form onSubmit={handleSavePropertyForm} className="space-y-6">
                {/* Section 1: Basic Information */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-teal-400">
                    1. Basic Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Property Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Mountain View Boutique Resort"
                        value={propertyForm.name}
                        onChange={(e) => setPropertyForm({ ...propertyForm, name: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Property Type Category *
                      </label>
                      <select
                        value={propertyForm.propertyType}
                        onChange={(e) =>
                          setPropertyForm({ ...propertyForm, propertyType: e.target.value as PropertyTypeCategory })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-teal-500"
                      >
                        {PROPERTY_TYPES.map((type) => (
                          <option key={type} value={type} className="bg-slate-900 text-white">
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Short Summary / Tagline *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Tranquil hillside sanctuary with panoramic valley views"
                        value={propertyForm.shortDescription}
                        onChange={(e) => setPropertyForm({ ...propertyForm, shortDescription: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Detailed Description *
                      </label>
                      <textarea
                        rows={3}
                        required
                        placeholder="Full description covering architecture, interior design, dining, views, and unique highlights..."
                        value={propertyForm.detailedDescription}
                        onChange={(e) => setPropertyForm({ ...propertyForm, detailedDescription: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Location & Address */}
                <div className="space-y-3 pt-4 border-t border-slate-800">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-teal-400">
                    2. Location & Address Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Country (Preselected)
                      </label>
                      <input
                        type="text"
                        disabled
                        value={selectedCountry.name}
                        className="w-full bg-slate-950/50 border border-slate-800/80 rounded-xl px-3 py-2 text-xs text-slate-400 cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        State (Preselected)
                      </label>
                      <input
                        type="text"
                        disabled
                        value={selectedState.name}
                        className="w-full bg-slate-950/50 border border-slate-800/80 rounded-xl px-3 py-2 text-xs text-slate-400 cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        City (Preselected)
                      </label>
                      <input
                        type="text"
                        disabled
                        value={selectedCity.name}
                        className="w-full bg-slate-950/50 border border-slate-800/80 rounded-xl px-3 py-2 text-xs text-slate-400 cursor-not-allowed"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Locality / Area
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Rajpur Road / Mall Road"
                        value={propertyForm.locality}
                        onChange={(e) => setPropertyForm({ ...propertyForm, locality: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Postal Code
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 248001"
                        value={propertyForm.postalCode}
                        onChange={(e) => setPropertyForm({ ...propertyForm, postalCode: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500"
                      />
                    </div>

                    <div className="md:col-span-3">
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Street Address *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 42 Hill Crest Avenue, Near Clock Tower"
                        value={propertyForm.address}
                        onChange={(e) => setPropertyForm({ ...propertyForm, address: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 3: Pricing & Capacity */}
                <div className="space-y-3 pt-4 border-t border-slate-800">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-teal-400">
                    3. Pricing & Capacity
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Price / Night (₹) *
                      </label>
                      <input
                        type="number"
                        required
                        min={100}
                        value={propertyForm.pricePerNight}
                        onChange={(e) =>
                          setPropertyForm({ ...propertyForm, pricePerNight: Number(e.target.value) })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Original Price (₹)
                      </label>
                      <input
                        type="number"
                        min={100}
                        value={propertyForm.originalPrice}
                        onChange={(e) =>
                          setPropertyForm({ ...propertyForm, originalPrice: Number(e.target.value) })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Max Guests *
                      </label>
                      <input
                        type="number"
                        required
                        min={1}
                        value={propertyForm.maxGuests}
                        onChange={(e) =>
                          setPropertyForm({ ...propertyForm, maxGuests: Number(e.target.value) })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Bedrooms *
                      </label>
                      <input
                        type="number"
                        required
                        min={1}
                        value={propertyForm.bedrooms}
                        onChange={(e) =>
                          setPropertyForm({ ...propertyForm, bedrooms: Number(e.target.value) })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 4: Photos */}
                <div className="space-y-3 pt-4 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-teal-400">
                      4. Photos & Media ({propertyForm.images.length})
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      placeholder="Add image URL (e.g. https://images.unsplash.com/...)"
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomPhoto}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-400 text-xs font-bold"
                    >
                      Add URL
                    </button>
                  </div>

                  {/* Preset Photos */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] text-slate-400 block">Quick Photo Presets:</span>
                    <div className="flex items-center gap-2 flex-wrap">
                      {SAMPLE_PHOTO_PRESETS.map((preset) => (
                        <button
                          type="button"
                          key={preset.name}
                          onClick={() => handleAddPresetPhoto(preset.url, preset.name)}
                          className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 hover:border-teal-500/40 text-[11px] text-slate-300 transition-colors"
                        >
                          + {preset.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Added Photos Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                    {propertyForm.images.map((img) => (
                      <div
                        key={img.id}
                        className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 group h-28"
                      >
                        <img src={img.url} alt="Property" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          {!img.isCover && (
                            <button
                              type="button"
                              onClick={() => handleSetCoverPhoto(img.id)}
                              className="p-1 rounded bg-teal-500 text-slate-950 text-[10px] font-bold"
                              title="Set as Cover"
                            >
                              Cover
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemovePhoto(img.id)}
                            className="p-1 rounded bg-red-500 text-white"
                            title="Remove"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {img.isCover && (
                          <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded bg-teal-500 text-slate-950 font-bold text-[9px] uppercase">
                            Cover
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section 5: Amenities */}
                <div className="space-y-3 pt-4 border-t border-slate-800">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-teal-400">
                    5. Amenities & Facilities
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {PREDEFINED_AMENITIES.map((amenity) => {
                      const selected = propertyForm.amenities.includes(amenity);
                      return (
                        <button
                          type="button"
                          key={amenity}
                          onClick={() => handleToggleAmenity(amenity)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                            selected
                              ? "bg-teal-500 text-slate-950 border-teal-400 font-bold shadow-md shadow-teal-500/20"
                              : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                          }`}
                        >
                          {amenity}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Section 6: Contact & Status */}
                <div className="space-y-3 pt-4 border-t border-slate-800">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-teal-400">
                    6. Contact & Publication Status
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Contact Person *
                      </label>
                      <input
                        type="text"
                        required
                        value={propertyForm.contactPerson}
                        onChange={(e) =>
                          setPropertyForm({ ...propertyForm, contactPerson: e.target.value })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Mobile Number *
                      </label>
                      <input
                        type="text"
                        required
                        value={propertyForm.mobileNumber}
                        onChange={(e) =>
                          setPropertyForm({ ...propertyForm, mobileNumber: e.target.value })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={propertyForm.email}
                        onChange={(e) => setPropertyForm({ ...propertyForm, email: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Publication Status
                      </label>
                      <select
                        value={propertyForm.status}
                        onChange={(e) =>
                          setPropertyForm({ ...propertyForm, status: e.target.value as any })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                      >
                        <option value="approved">Approved & Live</option>
                        <option value="pending_approval">Pending Approval</option>
                        <option value="draft">Draft</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2 pt-6">
                      <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                        <input
                          type="checkbox"
                          checked={propertyForm.featured}
                          onChange={(e) =>
                            setPropertyForm({ ...propertyForm, featured: e.target.checked })
                          }
                          className="w-4 h-4 rounded text-teal-500 bg-slate-950 border-slate-800"
                        />
                        <span className="font-semibold">Mark as Featured Destination</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Form Footer Action Buttons */}
                <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setPropertyModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingProperty}
                    className="px-6 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-teal-500/20 disabled:opacity-50"
                  >
                    {isSubmittingProperty
                      ? "Saving Property..."
                      : isEditPropertyMode
                      ? "Update Property"
                      : "Save Property to City"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            VIEW PROPERTY MODAL
        ───────────────────────────────────────────────────────────── */}
        {viewPropertyModalOpen && viewingProperty && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 md:p-8 shadow-2xl space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="px-2.5 py-1 rounded-lg bg-teal-500/10 text-teal-400 font-bold text-xs">
                  {viewingProperty.propertyType}
                </span>
                <button
                  onClick={() => setViewPropertyModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {viewingProperty.images?.[0]?.url && (
                <div className="h-56 rounded-2xl overflow-hidden bg-slate-800">
                  <img
                    src={viewingProperty.images[0].url}
                    alt={viewingProperty.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div>
                <h2 className="text-xl font-bold text-white">{viewingProperty.name}</h2>
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-teal-400" />
                  <span>
                    {viewingProperty.location.address}, {viewingProperty.location.city},{" "}
                    {viewingProperty.location.state}, {viewingProperty.location.country}
                  </span>
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 grid grid-cols-3 gap-3 text-center text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px]">Price / Night</span>
                  <span className="text-white font-bold text-sm">
                    ₹{viewingProperty.pricing.pricePerNight?.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Capacity</span>
                  <span className="text-white font-bold text-sm">
                    {viewingProperty.capacity.maxGuests} Guests
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Status</span>
                  <span className="text-teal-400 font-bold capitalize text-sm">
                    {viewingProperty.status.replace("_", " ")}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                {viewingProperty.detailedDescription || viewingProperty.shortDescription}
              </p>

              <div className="flex justify-end pt-3 border-t border-slate-800">
                <button
                  onClick={() => setViewPropertyModalOpen(false)}
                  className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
