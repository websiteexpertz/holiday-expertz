import { Hotel } from "@/types/hotel";

export function convertPropertyToHotel(p: any): Hotel {
  const coverImage =
    p.images?.find((img: any) => img.isCover)?.url ||
    p.images?.[0]?.url ||
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80";

  return {
    id: p.id,
    name: p.name,
    tagline: p.shortDescription || "",
    location: [p.location?.locality, p.location?.city, p.location?.state].filter(Boolean).join(", "),
    city: p.location?.city || "",
    state: p.location?.state || "",
    country: p.location?.country || "",
    locality: p.location?.locality || "",
    countryId: p.countryId,
    stateId: p.stateId,
    cityId: p.cityId,
    areaId: p.areaId,
    rating: p.rating || 4.9,
    reviewScore: (p.rating || 5) >= 4.8 ? "Superb" : "Excellent",
    reviewCount: p.reviewCount || 16,
    pricePerNight: p.pricing?.pricePerNight || 8500,
    originalPrice: p.pricing?.originalPrice,
    currency: p.pricing?.currency || "INR",
    featuredImage: coverImage,
    galleryImages: p.images?.map((img: any) => img.url) || [coverImage],
    description: p.detailedDescription || p.shortDescription || "",
    amenities: p.amenities || [],
    propertyType: (p.propertyType as any) || "Villas",
    tags: p.amenities?.slice(0, 3) || ["Verified Owner", "Luxury"],
    featured: Boolean(p.featured),
    dealTag: p.pricing?.originalPrice ? "Special Offer" : undefined,
    availableRooms: p.capacity?.bedrooms || 1,
  };
}
