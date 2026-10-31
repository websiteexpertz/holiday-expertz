"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Search, MapPin, LocateFixed, Navigation, Check, Loader2, AlertCircle } from "lucide-react";

interface PropertyLocationMapPickerProps {
  latitude?: number;
  longitude?: number;
  onLocationSelect: (coords: { latitude: number; longitude: number; address?: string }) => void;
  className?: string;
  initialQuery?: string;
}

declare global {
  interface Window {
    L: any;
  }
}

export default function PropertyLocationMapPicker({
  latitude,
  longitude,
  onLocationSelect,
  className = "h-[360px] sm:h-[420px]",
  initialQuery = "",
}: PropertyLocationMapPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number }>(() => ({
    lat: latitude && !isNaN(Number(latitude)) ? Number(latitude) : 28.6139,
    lng: longitude && !isNaN(Number(longitude)) ? Number(longitude) : 77.209,
  }));
  const [hasConfirmedPin, setHasConfirmedPin] = useState(Boolean(latitude && longitude));
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [isLocating, setIsLocating] = useState(false);

  // Sync external coordinates if changed
  useEffect(() => {
    if (
      latitude !== undefined &&
      longitude !== undefined &&
      !isNaN(Number(latitude)) &&
      !isNaN(Number(longitude))
    ) {
      const newLat = Number(latitude);
      const newLng = Number(longitude);
      setCurrentCoords({ lat: newLat, lng: newLng });
      setHasConfirmedPin(true);

      if (markerRef.current) {
        markerRef.current.setLatLng([newLat, newLng]);
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setView([newLat, newLng], Math.max(mapInstanceRef.current.getZoom(), 14));
      }
    }
  }, [latitude, longitude]);

  // Load Leaflet dynamically if not loaded
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
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const L = window.L;
      if (!L) return;

      const initialLat = currentCoords.lat;
      const initialLng = currentCoords.lng;

      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: hasConfirmedPin ? 14 : 6,
        zoomControl: false,
        attributionControl: false,
      });

      L.control.zoom({ position: "bottomright" }).addTo(map);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      // Custom high-contrast luxury pin
      const customIcon = L.divIcon({
        className: "custom-property-pin",
        html: `
          <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; width: 36px; height: 36px; background: rgba(13, 148, 136, 0.25); border-radius: 50%; animation: pulse 2s infinite;"></div>
            <div style="width: 28px; height: 28px; background: #0f172a; border: 2.5px solid #14b8a6; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.35);">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
            </div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const marker = L.marker([initialLat, initialLng], {
        icon: customIcon,
        draggable: true,
      }).addTo(map);

      marker.on("dragend", (event: any) => {
        const position = event.target.getLatLng();
        const lat = Number(position.lat.toFixed(6));
        const lng = Number(position.lng.toFixed(6));
        setCurrentCoords({ lat, lng });
        setHasConfirmedPin(true);
        onLocationSelect({ latitude: lat, longitude: lng });
      });

      map.on("click", (e: any) => {
        const lat = Number(e.latlng.lat.toFixed(6));
        const lng = Number(e.latlng.lng.toFixed(6));
        marker.setLatLng([lat, lng]);
        setCurrentCoords({ lat, lng });
        setHasConfirmedPin(true);
        onLocationSelect({ latitude: lat, longitude: lng });
      });

      markerRef.current = marker;
      mapInstanceRef.current = map;
      setMapLoaded(true);

      setTimeout(() => {
        if (!isCancelled && mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 250);
    };

    if (window.L) {
      initMap();
    } else {
      let script = document.getElementById("leaflet-js") as HTMLScriptElement;
      if (!script) {
        script = document.createElement("script");
        script.id = "leaflet-js";
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
        script.async = true;
        document.body.appendChild(script);
      }
      script.addEventListener("load", initMap);
    }

    return () => {
      isCancelled = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []); // Run once on mount

  // Geocoding search using OpenStreetMap Nominatim
  const handleSearchAddress = useCallback(
    async (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      if (!searchQuery.trim()) return;

      setIsSearching(true);
      setSearchError("");

      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            searchQuery.trim()
          )}&limit=1`,
          {
            headers: {
              "Accept-Language": "en",
            },
          }
        );
        const data = await res.json();

        if (Array.isArray(data) && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lng = parseFloat(data[0].lon);
          const displayName = data[0].display_name;

          setCurrentCoords({ lat, lng });
          setHasConfirmedPin(true);

          if (markerRef.current) {
            markerRef.current.setLatLng([lat, lng]);
          }
          if (mapInstanceRef.current) {
            mapInstanceRef.current.setView([lat, lng], 15, { animate: true });
          }

          onLocationSelect({
            latitude: Number(lat.toFixed(6)),
            longitude: Number(lng.toFixed(6)),
            address: displayName,
          });
        } else {
          setSearchError("No results found. Try entering a city, landmark, or PIN code.");
        }
      } catch (err) {
        console.warn("Geocoding lookup failed:", err);
        setSearchError("Location search unavailable. You can click anywhere on the map to place the pin.");
      } finally {
        setIsSearching(false);
      }
    },
    [searchQuery, onLocationSelect]
  );

  // Device Geolocation
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));

        setCurrentCoords({ lat, lng });
        setHasConfirmedPin(true);

        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        }
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([lat, lng], 16, { animate: true });
        }

        onLocationSelect({ latitude: lat, longitude: lng });
        setIsLocating(false);
      },
      (err) => {
        console.warn("GPS error:", err);
        alert("Unable to retrieve your current location. Please click on the map to set coordinates.");
        setIsLocating(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  return (
    <div className={`relative w-full rounded-2xl overflow-hidden border border-slate-700/80 bg-slate-900 shadow-md flex flex-col ${className}`}>
      {/* Top Search Bar & Controls */}
      <div className="absolute top-3 left-3 right-3 z-[400] flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pointer-events-none">
        <form
          onSubmit={handleSearchAddress}
          className="pointer-events-auto flex-1 flex items-center bg-slate-950/90 backdrop-blur-md border border-slate-700/80 rounded-xl px-3 py-1.5 shadow-lg text-xs"
        >
          <Search className="w-3.5 h-3.5 text-slate-400 shrink-0 mr-2" />
          <input
            type="text"
            placeholder="Search city, landmark, street, or PIN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-white placeholder:text-slate-500 focus:outline-none font-medium"
          />
          <button
            type="submit"
            disabled={isSearching || !searchQuery.trim()}
            className="ml-2 px-2.5 py-1 bg-teal-500 hover:bg-teal-400 disabled:opacity-40 text-slate-950 font-bold rounded-lg text-[11px] shrink-0 transition-colors"
          >
            {isSearching ? <Loader2 className="w-3 h-3 animate-spin" /> : "Locate"}
          </button>
        </form>

        <button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={isLocating}
          className="pointer-events-auto shrink-0 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-900/90 hover:bg-slate-800 backdrop-blur-md border border-slate-700 text-teal-300 font-semibold text-xs rounded-xl shadow-lg transition-colors cursor-pointer"
          title="Use My Current GPS Location"
        >
          {isLocating ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-400" />
          ) : (
            <LocateFixed className="w-3.5 h-3.5 text-teal-400" />
          )}
          <span className="hidden sm:inline">My Location</span>
        </button>
      </div>

      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full relative z-0 min-h-[260px]" />

      {/* Search Error Notice */}
      {searchError && (
        <div className="absolute top-16 left-3 right-3 z-[400] bg-rose-500/90 text-white text-xs px-3 py-1.5 rounded-lg shadow-md flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{searchError}</span>
        </div>
      )}

      {/* Bottom Coordinates & Confirmation Bar */}
      <div className="absolute bottom-3 left-3 z-[400] pointer-events-none flex items-center gap-2">
        <div className="bg-slate-950/90 backdrop-blur-md text-white px-3 py-1.5 rounded-xl border border-slate-700/80 shadow-lg flex items-center gap-2 text-xs">
          <div className={`w-2 h-2 rounded-full ${hasConfirmedPin ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
          <span className="font-semibold text-slate-200">
            {hasConfirmedPin ? "Pin Position:" : "Click or drag to place pin:"}
          </span>
          <span className="font-mono text-teal-300 text-[11px] font-semibold">
            {currentCoords.lat.toFixed(5)}°, {currentCoords.lng.toFixed(5)}°
          </span>
        </div>
      </div>

      {/* Helper text overlay */}
      <div className="absolute top-16 sm:top-14 right-3 z-[400] pointer-events-none hidden md:block">
        <span className="px-2.5 py-1 rounded-md bg-slate-950/80 backdrop-blur-xs text-[10px] text-slate-400 border border-slate-800">
          Tip: Drag the pin marker to fine-tune exact property entrance
        </span>
      </div>
    </div>
  );
}

