"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, Search, MapPin, Star, Building2, ExternalLink } from "lucide-react";
import { Property } from "@backend/types/property";
import { getPropertyCoordinates } from "@/utils/propertyCoordinates";

interface InteractivePropertyMapProps {
  properties: Property[];
  onClose: () => void;
  selectedPropertyId?: string | null;
  onSelectProperty?: (id: string) => void;
}

export default function InteractivePropertyMap({
  properties,
  onClose,
  selectedPropertyId,
  onSelectProperty,
}: InteractivePropertyMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<Record<string, any>>({});
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapSearchQuery, setMapSearchQuery] = useState("");
  const [hoveredProperty, setHoveredProperty] = useState<Property | null>(null);

  // Dynamically load Leaflet script & CSS
  useEffect(() => {
    let isCancelled = false;

    // Check if Leaflet CSS already exists
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    const initMap = () => {
      if (isCancelled || !mapContainerRef.current) return;
      const L = (window as any).L;
      if (!L) return;

      // Clean up previous map if exists
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // Initialize map (Default centered over India/Europe region)
      const map = L.map(mapContainerRef.current, {
        center: [25.0, 75.0],
        zoom: 5,
        zoomControl: false,
      });

      // Add Zoom Control at bottom right
      L.control
        .zoom({
          position: "bottomright",
        })
        .addTo(map);

      // OpenStreetMap Mapnik tiles (Exact same map provider as property detail page - NO API key required)
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;
      setMapLoaded(true);
      setTimeout(() => {
        map.invalidateSize();
      }, 250);
    };

    if ((window as any).L) {
      initMap();
    } else {
      const script = document.createElement("script");
      script.id = "leaflet-js";
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.async = true;
      script.onload = () => initMap();
      document.body.appendChild(script);
    }

    return () => {
      isCancelled = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Markers whenever properties change
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    const map = mapInstanceRef.current;

    // Clear existing markers
    Object.values(markersRef.current).forEach((marker: any) => {
      map.removeLayer(marker);
    });
    markersRef.current = {};

    if (properties.length === 0) return;

    const bounds = L.latLngBounds([]);

    properties.forEach((prop) => {
      const coords = getPropertyCoordinates(prop);
      bounds.extend([coords.lat, coords.lng]);

      const formattedPrice = new Intl.NumberFormat("en-IN", {
        maximumFractionDigits: 0,
      }).format(prop.pricing?.pricePerNight || 0);

      const coverUrl =
        prop.images?.find((img) => img.isCover)?.url ||
        prop.images?.[0]?.url ||
        "";

      const isSelected = prop.id === selectedPropertyId;

      // Booking.com style classic dark blue teardrop location pin with white inner dot
      const pinColor = isSelected ? "#006ce4" : "#003580";
      const iconHtml = `
        <div class="cursor-pointer transform transition-all duration-200 ${
          isSelected ? "scale-125 z-50 -translate-y-1" : "hover:scale-115 hover:-translate-y-0.5"
        }" style="display: inline-block;">
          <svg width="26" height="34" viewBox="0 0 26 34" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 3px 5px rgba(0, 30, 80, 0.45));">
            <path
              d="M13 0.75C6.23 0.75 0.75 6.23 0.75 13C0.75 22.25 13 33.25 13 33.25C13 33.25 25.25 22.25 25.25 13C25.25 6.23 19.77 0.75 13 0.75Z"
              fill="${pinColor}"
              stroke="#ffffff"
              stroke-width="1.5"
            />
            <circle cx="13" cy="12.5" r="4.25" fill="#ffffff" />
          </svg>
        </div>
      `;

      const customIcon = L.divIcon({
        className: "property-map-pin",
        html: iconHtml,
        iconSize: [26, 34],
        iconAnchor: [13, 34],
        popupAnchor: [0, -32],
      });

      const marker = L.marker([coords.lat, coords.lng], {
        icon: customIcon,
      }).addTo(map);

      // Popup content with property preview
      const popupHtml = `
        <div style="font-family: inherit; width: 220px; overflow: hidden; border-radius: 12px; margin: -1px;">
          ${
            coverUrl
              ? `<div style="height: 110px; width: 100%; position: relative; overflow: hidden; background: #0f172a;">
                   <img src="${coverUrl}" alt="${prop.name}" style="width: 100%; height: 100%; object-fit: cover;" />
                 </div>`
              : `<div style="height: 80px; width: 100%; background: #f1f5f9; display: flex; align-items: center; justify-content: center; color: #94a3b8;">
                   Stays
                 </div>`
          }
          <div style="padding: 10px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
              <span style="font-size: 10px; font-weight: 700; background: #f0fdfa; color: #0f766e; padding: 2px 6px; border-radius: 9999px; border: 1px solid #ccfbf1;">
                ${prop.propertyType}
              </span>
              <span style="font-size: 11px; font-weight: 800; color: #0f172a; display: flex; align-items: center; gap: 2px;">
                ★ ${prop.rating ? prop.rating.toFixed(1) : "5.0"}
              </span>
            </div>
            <h4 style="font-size: 13px; font-weight: 700; color: #0f172a; margin: 0 0 4px 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
              ${prop.name}
            </h4>
            <p style="font-size: 11px; color: #64748b; margin: 0 0 8px 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
              ${prop.location?.city ? `${prop.location.city}, ${prop.location.country}` : "Location"}
            </p>
            <div style="display: flex; align-items: center; justify-content: space-between; padding-top: 6px; border-top: 1px solid #f1f5f9;">
              <div>
                <span style="font-size: 9px; color: #94a3b8; display: block; font-weight: 600;">PER NIGHT</span>
                <span style="font-size: 14px; font-weight: 800; color: #0f172a;">₹${formattedPrice}</span>
              </div>
              <a href="/properties/${prop.id}" style="display: inline-block; padding: 5px 10px; background: #0d9488; color: #ffffff; font-size: 11px; font-weight: 700; text-decoration: none; border-radius: 8px;">
                View
              </a>
            </div>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        closeButton: false,
        className: "custom-leaflet-popup",
        maxWidth: 240,
      });

      marker.on("click", () => {
        if (onSelectProperty) onSelectProperty(prop.id);
        setHoveredProperty(prop);
      });

      markersRef.current[prop.id] = marker;
    });

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
    }
  }, [mapLoaded, properties, selectedPropertyId, onSelectProperty]);

  // Center on selected property if specified
  useEffect(() => {
    if (!mapLoaded || !selectedPropertyId || !mapInstanceRef.current) return;
    const marker = markersRef.current[selectedPropertyId];
    if (marker) {
      const latLng = marker.getLatLng();
      mapInstanceRef.current.setView(latLng, Math.max(mapInstanceRef.current.getZoom(), 11), {
        animate: true,
      });
      marker.openPopup();
    }
  }, [selectedPropertyId, mapLoaded]);

  // Search destination filter on map
  const handleMapSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mapSearchQuery.trim() || !mapInstanceRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        mapSearchQuery
      )}&limit=1`
    )
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0 && mapInstanceRef.current) {
          const lat = parseFloat(data[0].lat);
          const lon = parseFloat(data[0].lon);
          mapInstanceRef.current.setView([lat, lon], 10, { animate: true });
        }
      })
      .catch(() => {});
  };

  return (
    <div className="relative w-full h-full bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 shadow-lg">
      {/* ── Top Floating Overlay: Search on Map & Close Map Button (Booking.com style) ── */}
      <div className="absolute top-3 left-3 right-3 z-[1000] flex items-center justify-between gap-3 pointer-events-none">
        {/* Search on Map input */}
        <form
          onSubmit={handleMapSearchSubmit}
          className="pointer-events-auto flex items-center gap-1.5 bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl shadow-lg border border-slate-200/90 text-xs text-slate-800 w-64 sm:w-72"
        >
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search on map..."
            value={mapSearchQuery}
            onChange={(e) => setMapSearchQuery(e.target.value)}
            className="w-full bg-transparent font-medium text-slate-900 focus:outline-none placeholder-slate-400"
          />
          {mapSearchQuery && (
            <button
              type="button"
              onClick={() => setMapSearchQuery("")}
              className="text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </form>

        {/* Close Map Button (Image 2 style) */}
        <button
          type="button"
          onClick={onClose}
          className="pointer-events-auto inline-flex items-center gap-1.5 px-3.5 py-2 bg-white/95 hover:bg-white text-slate-800 hover:text-teal-700 font-bold text-xs rounded-xl shadow-lg border border-slate-200 transition-all transform hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-md"
        >
          <span>Close map</span>
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* ── Leaflet Map Container ── */}
      <div ref={mapContainerRef} className="w-full h-full min-h-[450px]" />

      {/* ── Bottom Floating Info Pill ── */}
      <div className="absolute bottom-3 left-3 z-[1000] pointer-events-none">
        <div className="px-3 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-semibold flex items-center gap-2 shadow-lg">
          <MapPin className="w-3.5 h-3.5 text-teal-400" />
          <span>{properties.length} stays pinned across locations</span>
        </div>
      </div>
    </div>
  );
}
