'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { MapPin, Search, Loader2 } from 'lucide-react';

const LeafletMap = dynamic(() => import('./LeafletMap'), { ssr: false });

const DOUALA_LAT = 4.0511;
const DOUALA_LNG = 9.7679;

interface AddressData {
  lat: number;
  lng: number;
  address: string;
  city: string;
  country: string;
}

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
  address?: {
    road?: string;
    neighbourhood?: string;
    suburb?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    country?: string;
  };
}

interface AddressMapPickerProps {
  initialLat?: number;
  initialLng?: number;
  onChange: (data: AddressData) => void;
}

export default function AddressMapPicker({ initialLat, initialLng, onChange }: AddressMapPickerProps) {
  const startLat = initialLat && initialLat !== 0 ? initialLat : DOUALA_LAT;
  const startLng = initialLng && initialLng !== 0 ? initialLng : DOUALA_LNG;

  const [center, setCenter] = useState<[number, number]>([startLat, startLng]);
  const [markerPosition, setMarkerPosition] = useState<[number, number] | null>(
    initialLat && initialLat !== 0 ? [startLat, startLng] : null
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<NominatimResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searching, setSearching] = useState(false);
  const [reverseGeocoding, setReverseGeocoding] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    setReverseGeocoding(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lng=${lng}&accept-language=fr`
      );
      const data: NominatimResult = await res.json();
      const addr = data.address;
      const address = [addr?.road, addr?.neighbourhood, addr?.suburb].filter(Boolean).join(', ') || data.display_name.split(',').slice(0, 2).join(',').trim();
      const city = addr?.city || addr?.town || addr?.village || '';
      const country = addr?.country || '';
      onChange({ lat, lng, address, city, country });
    } catch {
      onChange({ lat, lng, address: '', city: '', country: '' });
    } finally {
      setReverseGeocoding(false);
    }
  }, [onChange]);

  function handleMapClick(lat: number, lng: number) {
    setMarkerPosition([lat, lng]);
    setCenter([lat, lng]);
    reverseGeocode(lat, lng);
  }

  function handleSearchInput(value: string) {
    setSearchQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.trim().length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value)}&countrycodes=cm&accept-language=fr&limit=5`
        );
        const data: NominatimResult[] = await res.json();
        setSearchResults(data);
        setShowDropdown(data.length > 0);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 500);
  }

  function handleSelectResult(result: NominatimResult) {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    setMarkerPosition([lat, lng]);
    setCenter([lat, lng]);
    setSearchQuery(result.display_name);
    setShowDropdown(false);

    const addr = result.address;
    const address = [addr?.road, addr?.neighbourhood, addr?.suburb].filter(Boolean).join(', ') || result.display_name.split(',').slice(0, 2).join(',').trim();
    const city = addr?.city || addr?.town || addr?.village || '';
    const country = addr?.country || '';
    onChange({ lat, lng, address, city, country });
  }

  return (
    <div className="mt-4 space-y-3">
      <label className="flex items-center gap-2 text-sm font-medium text-[#191919]">
        <MapPin className="h-4 w-4 text-[#E82328]" />
        Localisation sur la carte
      </label>

      {/* Search input */}
      <div className="relative" ref={dropdownRef}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher une adresse au Cameroun..."
            value={searchQuery}
            onChange={(e) => handleSearchInput(e.target.value)}
            onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
            className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-10 text-sm outline-none focus:border-[#E82328]"
          />
          {searching && (
            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-gray-400" />
          )}
        </div>

        {/* Dropdown results */}
        {showDropdown && searchResults.length > 0 && (
          <div className="absolute left-0 right-0 z-[1000] mt-1 max-h-48 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
            {searchResults.map((result, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectResult(result)}
                className="flex w-full items-start gap-2 px-3 py-2.5 text-left text-sm hover:bg-gray-100"
              >
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#E82328]" />
                <span className="text-gray-700">{result.display_name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map */}
      <div className="overflow-hidden rounded-lg border border-gray-200">
        <LeafletMap
          center={center}
          markerPosition={markerPosition}
          onMapClick={handleMapClick}
        />
      </div>

      {reverseGeocoding && (
        <p className="flex items-center gap-2 text-xs text-gray-500">
          <Loader2 className="h-3 w-3 animate-spin" />
          Recherche de l&apos;adresse...
        </p>
      )}

      {markerPosition && !reverseGeocoding && (
        <p className="text-xs text-gray-400">
          Coordonnees : {markerPosition[0].toFixed(5)}, {markerPosition[1].toFixed(5)}
        </p>
      )}
    </div>
  );
}
