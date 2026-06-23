'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Search, Loader2 } from 'lucide-react';

const GOOGLE_MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || 'AIzaSyAffUHSFli6kMnjkfJOKBGO6AN828ixJPo';

const DOUALA_LAT = 4.0511;
const DOUALA_LNG = 9.7679;

interface AddressData {
  lat: number;
  lng: number;
  address: string;
  city: string;
  country: string;
}

interface AddressMapPickerProps {
  initialLat?: number;
  initialLng?: number;
  onChange: (data: AddressData) => void;
}

declare global {
  interface Window {
    google: any;
    initGoogleMapsWeb: () => void;
  }
}

let googleMapsLoaded = false;
let googleMapsLoading = false;
const loadCallbacks: (() => void)[] = [];

function loadGoogleMaps(): Promise<void> {
  return new Promise((resolve) => {
    if (googleMapsLoaded && window.google?.maps) {
      resolve();
      return;
    }

    loadCallbacks.push(resolve);

    if (googleMapsLoading) return;
    googleMapsLoading = true;

    window.initGoogleMapsWeb = () => {
      googleMapsLoaded = true;
      loadCallbacks.forEach((cb) => cb());
      loadCallbacks.length = 0;
    };

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_KEY}&libraries=places&callback=initGoogleMapsWeb`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  });
}

export default function AddressMapPicker({ initialLat, initialLng, onChange }: AddressMapPickerProps) {
  const startLat = initialLat && initialLat !== 0 ? initialLat : DOUALA_LAT;
  const startLng = initialLng && initialLng !== 0 ? initialLng : DOUALA_LNG;

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [reverseGeocoding, setReverseGeocoding] = useState(false);
  const [currentCoords, setCurrentCoords] = useState<[number, number] | null>(
    initialLat && initialLat !== 0 ? [startLat, startLng] : null
  );

  const reverseGeocode = useCallback((lat: number, lng: number) => {
    if (!window.google?.maps) return;
    setReverseGeocoding(true);

    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results: any[], status: string) => {
      setReverseGeocoding(false);
      if (status === 'OK' && results[0]) {
        const components = results[0].address_components || [];
        let city = '';
        let country = '';
        let address = results[0].formatted_address || '';

        for (const c of components) {
          if (c.types.includes('locality')) city = c.long_name;
          else if (!city && c.types.includes('administrative_area_level_2')) city = c.long_name;
          if (c.types.includes('country')) country = c.long_name;
        }

        onChange({ lat, lng, address, city, country });
      } else {
        onChange({ lat, lng, address: '', city: '', country: '' });
      }
    });
  }, [onChange]);

  const updateMarker = useCallback((lat: number, lng: number) => {
    if (!mapInstanceRef.current) return;
    const pos = new window.google.maps.LatLng(lat, lng);
    setCurrentCoords([lat, lng]);

    if (markerRef.current) {
      markerRef.current.setPosition(pos);
    } else {
      markerRef.current = new window.google.maps.Marker({
        position: pos,
        map: mapInstanceRef.current,
        draggable: true,
        animation: window.google.maps.Animation.DROP,
      });

      markerRef.current.addListener('dragend', (e: any) => {
        const newLat = e.latLng.lat();
        const newLng = e.latLng.lng();
        setCurrentCoords([newLat, newLng]);
        reverseGeocode(newLat, newLng);
      });
    }

    mapInstanceRef.current.panTo(pos);
  }, [reverseGeocode]);

  useEffect(() => {
    let cancelled = false;

    loadGoogleMaps().then(() => {
      if (cancelled || !mapRef.current) return;

      const map = new window.google.maps.Map(mapRef.current, {
        center: { lat: startLat, lng: startLng },
        zoom: 14,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });

      mapInstanceRef.current = map;

      map.addListener('click', (e: any) => {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        updateMarker(lat, lng);
        reverseGeocode(lat, lng);
      });

      if (initialLat && initialLat !== 0 && initialLng) {
        updateMarker(initialLat, initialLng);
      }

      // Autocomplete
      if (searchInputRef.current) {
        const autocomplete = new window.google.maps.places.Autocomplete(searchInputRef.current, {
          componentRestrictions: { country: 'cm' },
          fields: ['geometry', 'formatted_address', 'address_components'],
        });

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          if (place.geometry?.location) {
            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();
            updateMarker(lat, lng);
            map.setZoom(16);
            setSearchQuery('');

            const components = place.address_components || [];
            let city = '';
            let country = '';
            for (const c of components) {
              if (c.types.includes('locality')) city = c.long_name;
              else if (!city && c.types.includes('administrative_area_level_2')) city = c.long_name;
              if (c.types.includes('country')) country = c.long_name;
            }

            onChange({
              lat,
              lng,
              address: place.formatted_address || '',
              city,
              country,
            });
          }
        });
      }

      setLoading(false);
    });

    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="mt-4 space-y-3">
      <label className="flex items-center gap-2 text-sm font-medium text-[#191919]">
        <MapPin className="h-4 w-4 text-[#E82328]" />
        Localisation sur la carte
      </label>

      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Rechercher une adresse au Cameroun..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-10 text-sm outline-none focus:border-[#E82328]"
        />
      </div>

      {/* Map */}
      <div className="relative overflow-hidden rounded-lg border border-gray-200" style={{ height: 300 }}>
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-50">
            <Loader2 className="h-6 w-6 animate-spin text-[#E82328]" />
          </div>
        )}
        <div ref={mapRef} className="h-full w-full" />
      </div>

      {reverseGeocoding && (
        <p className="flex items-center gap-2 text-xs text-gray-500">
          <Loader2 className="h-3 w-3 animate-spin" />
          Recherche de l&apos;adresse...
        </p>
      )}

      {currentCoords && !reverseGeocoding && (
        <p className="text-xs text-gray-400">
          Coordonnees : {currentCoords[0].toFixed(5)}, {currentCoords[1].toFixed(5)}
        </p>
      )}
    </div>
  );
}
