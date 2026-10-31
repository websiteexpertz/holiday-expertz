"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import { Property } from "@backend/types/property";
import { getPropertyCoordinates } from "@/utils/propertyCoordinates";
import { MapPin, ExternalLink, Navigation, LocateFixed, Plus, Minus } from "lucide-react";

interface PropertyDetailMapProps {
  property: Property;
  className?: string;
}

export default function PropertyDetailMap({ property, className }: PropertyDetailMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(14);

  // Derive coordinates accurately using the project's central coordinate resolver
  const coords = useMemo(() => {
    return getPropertyCoordinates(property);
  }, [property]);

  // Google Maps & Navigation deep links
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lng}`;

  // Formatted address string
  const formattedAddress = useMemo(() => {
    if (!property?.location) return "";
    return [
      property.location.address,
      property.location.locality,
      property.location.city,
      property.location.state,
      property.location.country,
    ]
      .filter(Boolean)
      .join(", ");
  }, [property]);

  // Fallback OpenStreetMap embed URL (always accurately centered on property coordinates)
  const fallbackEmbedUrl = useMemo(() => {
    const deltaLon = 0.05;
    const deltaLat = 0.03;
    const minLon = (coords.lng - deltaLon).toFixed(5);
    const maxLon = (coords.lng + deltaLon).toFixed(5);
    const minLat = (coords.lat - deltaLat).toFixed(5);
    const maxLat = (coords.lat + deltaLat).toFixed(5);

    return `https://www.openstreetmap.org/export/embed.html?bbox=${minLon}%2C${minLat}%2C${maxLon}%2C${maxLat}&layer=mapnik&marker=${coords.lat.toFixed(5)}%2C${coords.lng.toFixed(5)}`;
  }, [coords]);

  // Dynamically load Leaflet script & stylesheet
  useEffect(() => {
    let isCancelled = false;

    // Load Leaflet CSS
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

      // Tear down previous instance if re-initializing
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // Initialize map centered on property coordinates with full zoom capabilities (same as properties page)
      const map = L.map(mapContainerRef.current, {
        center: [coords.lat, coords.lng],
        zoom: 14,
        minZoom: 3,
        maxZoom: 19,
        zoomControl: false,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        touchZoom: true,
      });

      // Add standard Leaflet Zoom Control at bottom right (same as InteractivePropertyMap)
      L.control
        .zoom({
          position: "bottomright",
        })
        .addTo(map);

      // Listen to zoom changes to keep local state synchronized
      map.on("zoomend", () => {
        setCurrentZoom(map.getZoom());
      });

      // OpenStreetMap Mapnik tiles
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      // Custom high-contrast location pin
      const pinHtml = `
        <div class="relative group cursor-pointer" style="display: inline-block;">
          <div class="absolute -inset-2 bg-teal-500/30 rounded-full animate-ping pointer-events-none"></div>
          <svg width="34" height="42" viewBox="0 0 34 42" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.35));">
            <path
              d="M17 0.75C7.75 0.75 0.75 7.75 0.75 17C0.75 28.5 17 41.25 17 41.25C17 41.25 33.25 28.5 33.25 17C33.25 7.75 26.25 0.75 17 0.75Z"
              fill="#0d9488"
              stroke="#ffffff"
              stroke-width="2"
            />
            <circle cx="17" cy="16.5" r="5.5" fill="#ffffff" />
          </svg>
        </div>
      `;

      const customIcon = L.divIcon({
        className: "property-location-pin",
        html: pinHtml,
        iconSize: [34, 42],
        iconAnchor: [17, 42],
        popupAnchor: [0, -40],
      });

      const marker = L.marker([coords.lat, coords.lng], {
        icon: customIcon,
      }).addTo(map);

      // Clean interactive popup
      const popupHtml = `
        <div style="font-family: inherit; width: 230px; padding: 6px; color: #0f172a;">
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
            <span style="font-size: 10px; font-weight: 700; background: #f0fdfa; color: #0f766e; padding: 2px 7px; border-radius: 9999px; border: 1px solid #ccfbf1;">
              ${property.propertyType || "Stay"}
            </span>
            <span style="font-size: 11px; font-weight: 800; color: #0f172a; margin-left: auto;">
              ★ ${property.rating ? property.rating.toFixed(1) : "5.0"}
            </span>
          </div>
          <h4 style="font-size: 14px; font-weight: 800; color: #0f172a; margin: 0 0 4px 0; line-height: 1.3;">
            ${property.name}
          </h4>
          <p style="font-size: 11px; color: #64748b; margin: 0 0 10px 0; line-height: 1.4;">
            ${formattedAddress || "Property Location"}
          </p>
          <a
            href="${googleMapsUrl}"
            target="_blank"
            rel="noopener noreferrer"
            style="display: flex; align-items: center; justify-content: center; gap: 6px; width: 100%; padding: 6px 12px; background: #0d9488; color: #ffffff; font-size: 11px; font-weight: 700; text-decoration: none; border-radius: 8px;"
          >
            Open in Google Maps ↗
          </a>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        closeButton: true,
        className: "custom-leaflet-popup",
        maxWidth: 260,
      });

      markerRef.current = marker;
      mapInstanceRef.current = map;
      setMapLoaded(true);
      setCurrentZoom(map.getZoom());

      setTimeout(() => {
        map.invalidateSize();
      }, 200);
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
  }, [coords, property, formattedAddress, googleMapsUrl]);

  // Center map on marker reset handler
  const handleRecenter = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setView([coords.lat, coords.lng], 14, { animate: true });
    if (markerRef.current) {
      markerRef.current.openPopup();
    }
  };

  // Zoom In Handler
  const handleZoomIn = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.zoomIn();
  };

  // Zoom Out Handler
  const handleZoomOut = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.zoomOut();
  };

  return (
    <div className={`relative w-full rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100 ${className || "h-[380px] sm:h-[450px]"}`}>
      {/* ── Leaflet Container ── */}
      <div ref={mapContainerRef} className="w-full h-full relative z-0" />

      {/* ── Fallback Iframe if Leaflet fails or during initial SSR ── */}
      {!mapLoaded && (
        <iframe
          src={fallbackEmbedUrl}
          title={`Location Map for ${property.name}`}
          className="absolute inset-0 w-full h-full border-0 pointer-events-none"
          loading="lazy"
        />
      )}

      {/* ── Top Floating Actions (Google Maps, Directions, Recenter) ── */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
        <button
          type="button"
          onClick={handleRecenter}
          title="Recenter on Property"
          className="p-2 bg-white/95 hover:bg-white text-slate-700 hover:text-teal-700 rounded-xl shadow-md border border-slate-200/80 transition-all active:scale-95 flex items-center justify-center cursor-pointer backdrop-blur-xs"
        >
          <LocateFixed className="w-4 h-4" />
        </button>

        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="Get Directions in Google Maps"
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-white/95 hover:bg-white text-slate-700 hover:text-teal-700 font-bold text-xs rounded-xl shadow-md border border-slate-200/80 transition-all active:scale-95 cursor-pointer backdrop-blur-xs"
        >
          <Navigation className="w-3.5 h-3.5 text-teal-600" />
          <span className="hidden sm:inline">Directions</span>
        </a>

        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="Open in Google Maps"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
        >
          <span>Google Maps</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* ── Dedicated Zoom In & Zoom Out Buttons (Prominent Floating Stack) ── */}
      <div className="absolute right-3 bottom-14 z-10 flex flex-col items-center bg-white/95 backdrop-blur-md rounded-xl shadow-lg border border-slate-200/90 overflow-hidden">
        <button
          type="button"
          onClick={handleZoomIn}
          disabled={currentZoom >= 19}
          title="Zoom in (+)"
          aria-label="Zoom in"
          className="p-2.5 hover:bg-slate-100 text-slate-700 hover:text-teal-700 active:bg-slate-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer border-b border-slate-100"
        >
          <Plus className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={handleZoomOut}
          disabled={currentZoom <= 3}
          title="Zoom out (−)"
          aria-label="Zoom out"
          className="p-2.5 hover:bg-slate-100 text-slate-700 hover:text-teal-700 active:bg-slate-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer"
        >
          <Minus className="w-4 h-4" />
        </button>
      </div>

      {/* ── Bottom Overlay: Coordinates & City Pill ── */}
      <div className="absolute bottom-3 left-3 z-10 flex items-center gap-2">
        <div className="bg-slate-950/85 backdrop-blur-md text-white px-3 py-1.5 rounded-xl shadow-lg border border-slate-800 flex items-center gap-2 text-xs">
          <MapPin className="w-3.5 h-3.5 text-teal-400 shrink-0" />
          <span className="font-semibold text-slate-200">
            {property.location?.city || "Property Location"}
            {property.location?.country ? `, ${property.location.country}` : ""}
          </span>
          <span className="text-[10px] text-teal-300 font-mono pl-1 border-l border-slate-700">
            {coords.lat.toFixed(4)}°, {coords.lng.toFixed(4)}°
          </span>
          <span className="text-[10px] text-slate-400 font-mono pl-1 border-l border-slate-700">
            {currentZoom}x
          </span>
        </div>
      </div>
    </div>
  );
}
