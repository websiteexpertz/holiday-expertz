import { Property } from "@backend/types/property";

export interface GeoCoordinate {
  lat: number;
  lng: number;
}

// Known coordinates for cities and regions in project database
const KNOWN_COORDINATES: Record<string, GeoCoordinate> = {
  zermatt: { lat: 45.9765, lng: 7.7491 },
  valais: { lat: 46.1905, lng: 7.545 },
  switzerland: { lat: 46.8182, lng: 8.2275 },
  brandenburg: { lat: 52.4125, lng: 12.5316 },
  berlin: { lat: 52.52, lng: 13.405 },
  germany: { lat: 51.1657, lng: 10.4515 },
  ghaziabad: { lat: 28.6692, lng: 77.4538 },
  uttarpradesh: { lat: 26.8467, lng: 80.9462 },
  jaipur: { lat: 26.9124, lng: 75.7873 },
  udaipur: { lat: 24.5854, lng: 73.7125 },
  rajasthan: { lat: 27.0238, lng: 74.2179 },
  dehradun: { lat: 30.3165, lng: 78.0322 },
  mussoorie: { lat: 30.4598, lng: 78.0644 },
  uttarakhand: { lat: 30.0668, lng: 79.0193 },
  anjuna: { lat: 15.5733, lng: 73.7412 },
  goa: { lat: 15.2993, lng: 74.124 },
  manali: { lat: 32.2432, lng: 77.1892 },
  shimla: { lat: 31.1048, lng: 77.1734 },
  rishikesh: { lat: 30.0869, lng: 78.2676 },
  mumbai: { lat: 19.076, lng: 72.8777 },
  bangalore: { lat: 12.9716, lng: 77.5946 },
  bengaluru: { lat: 12.9716, lng: 77.5946 },
  hyderabad: { lat: 17.385, lng: 78.4867 },
  chennai: { lat: 13.0827, lng: 80.2707 },
  kolkata: { lat: 22.5726, lng: 88.3639 },
  pune: { lat: 18.5204, lng: 73.8567 },
  kochi: { lat: 9.9312, lng: 76.2673 },
  cochin: { lat: 9.9312, lng: 76.2673 },
  munnar: { lat: 10.0889, lng: 77.0595 },
  kerala: { lat: 10.8505, lng: 76.2711 },
  ooty: { lat: 11.4102, lng: 76.695 },
  kodaikanal: { lat: 10.2381, lng: 77.4892 },
  agra: { lat: 27.1767, lng: 78.0081 },
  varanasi: { lat: 25.3176, lng: 82.9739 },
  srinagar: { lat: 34.0837, lng: 74.7973 },
  kashmir: { lat: 33.7782, lng: 76.5762 },
  leh: { lat: 34.1526, lng: 77.5771 },
  ladakh: { lat: 34.1526, lng: 77.5771 },
  nainital: { lat: 29.3919, lng: 79.4542 },
  dubai: { lat: 25.2048, lng: 55.2708 },
  london: { lat: 51.5074, lng: -0.1278 },
  paris: { lat: 48.8566, lng: 2.3522 },
  "blue ridge": { lat: 34.864, lng: -84.3241 },
  india: { lat: 20.5937, lng: 78.9629 },
};

function getPropertyOffset(id: string): { latOffset: number; lngOffset: number } {
  if (!id) return { latOffset: 0, lngOffset: 0 };
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  const latOffset = (((Math.abs(hash) % 100) - 50) / 100) * 0.015;
  const lngOffset = (((Math.abs(hash >> 3) % 100) - 50) / 100) * 0.015;
  return { latOffset, lngOffset };
}

export function getPropertyCoordinates(property: Property): GeoCoordinate {
  if (!property) return { lat: 28.6139, lng: 77.209 };

  // 1. Check explicit coordinates in property location
  const loc = property.location as any;
  if (loc?.coordinates?.latitude && loc?.coordinates?.longitude) {
    return {
      lat: Number(loc.coordinates.latitude),
      lng: Number(loc.coordinates.longitude),
    };
  }
  if (loc?.coordinates?.lat && loc?.coordinates?.lng) {
    return {
      lat: Number(loc.coordinates.lat),
      lng: Number(loc.coordinates.lng),
    };
  }
  if (loc?.latitude && loc?.longitude) {
    return {
      lat: Number(loc.latitude),
      lng: Number(loc.longitude),
    };
  }

  const { latOffset, lngOffset } = getPropertyOffset(property.id || property.name || "");

  // 2. City-level resolution
  const city = (property.location?.city || "").toLowerCase().trim();
  if (city && KNOWN_COORDINATES[city]) {
    return {
      lat: KNOWN_COORDINATES[city].lat + latOffset,
      lng: KNOWN_COORDINATES[city].lng + lngOffset,
    };
  }

  // Check partial city match
  for (const [key, coords] of Object.entries(KNOWN_COORDINATES)) {
    if (city.includes(key)) {
      return {
        lat: coords.lat + latOffset,
        lng: coords.lng + lngOffset,
      };
    }
  }

  // 3. State-level resolution
  const state = (property.location?.state || "").toLowerCase().trim();
  if (state && KNOWN_COORDINATES[state]) {
    return {
      lat: KNOWN_COORDINATES[state].lat + latOffset,
      lng: KNOWN_COORDINATES[state].lng + lngOffset,
    };
  }

  // 4. Country-level resolution
  const country = (property.location?.country || "").toLowerCase().trim();
  if (country && KNOWN_COORDINATES[country]) {
    return {
      lat: KNOWN_COORDINATES[country].lat + latOffset,
      lng: KNOWN_COORDINATES[country].lng + lngOffset,
    };
  }

  // Fallback to Northern India
  return { lat: 28.6139 + latOffset, lng: 77.209 + lngOffset };
}
