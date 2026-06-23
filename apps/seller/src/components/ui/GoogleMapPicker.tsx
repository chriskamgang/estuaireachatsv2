'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Search, Loader2 } from 'lucide-react';

const GOOGLE_MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || 'AIzaSyAffUHSFli6kMnjkfJOKBGO6AN828ixJPo';

interface GoogleMapPickerProps {
  latitude: number | null;
  longitude: number | null;
  address?: string;
  onLocationChange: (lat: number, lng: number, address?: string, city?: string) => void;
}

declare global {
  interface Window {
    google: any;
    initGoogleMaps: () => void;
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

    window.initGoogleMaps = () => {
      googleMapsLoaded = true;
      loadCallbacks.forEach((cb) => cb());
      loadCallbacks.length = 0;
    };

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_KEY}&libraries=places&callback=initGoogleMaps`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  });
}

export default function GoogleMapPicker({ latitude, longitude, address, onLocationChange }: GoogleMapPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentAddress, setCurrentAddress] = useState(address || '');

  // Douala par defaut
  const defaultLat = latitude || 4.0511;
  const defaultLng = longitude || 9.7679;

  const reverseGeocode = useCallback((lat: number, lng: number) => {
    if (!window.google?.maps) return;
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results: any[], status: string) => {
      if (status === 'OK' && results[0]) {
        const addr = results[0].formatted_address;
        setCurrentAddress(addr);

        // Extraire la ville
        let city = '';
        for (const component of results[0].address_components) {
          if (component.types.includes('locality')) {
            city = component.long_name;
            break;
          }
          if (component.types.includes('administrative_area_level_2')) {
            city = component.long_name;
          }
        }

        onLocationChange(lat, lng, addr, city);
      }
    });
  }, [onLocationChange]);

  const updateMarker = useCallback((lat: number, lng: number) => {
    if (!mapInstanceRef.current) return;
    const pos = new window.google.maps.LatLng(lat, lng);

    if (markerRef.current) {
      markerRef.current.setPosition(pos);
    } else {
      markerRef.current = new window.google.maps.Marker({
        position: pos,
        map: mapInstanceRef.current,
        draggable: true,
        animation: window.google.maps.Animation.DROP,
        title: 'Emplacement de la boutique',
      });

      markerRef.current.addListener('dragend', (e: any) => {
        const newLat = e.latLng.lat();
        const newLng = e.latLng.lng();
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
        center: { lat: defaultLat, lng: defaultLng },
        zoom: 15,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        styles: [
          { featureType: 'poi', stylers: [{ visibility: 'simplified' }] },
        ],
      });

      mapInstanceRef.current = map;

      // Click sur la carte pour placer le marqueur
      map.addListener('click', (e: any) => {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        updateMarker(lat, lng);
        reverseGeocode(lat, lng);
      });

      // Placer le marqueur initial si coords existent
      if (latitude && longitude) {
        updateMarker(latitude, longitude);
      }

      // Autocomplete sur la barre de recherche
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

            const addr = place.formatted_address || '';
            setCurrentAddress(addr);
            setSearchQuery('');

            let city = '';
            for (const component of (place.address_components || [])) {
              if (component.types.includes('locality')) {
                city = component.long_name;
                break;
              }
              if (component.types.includes('administrative_area_level_2')) {
                city = component.long_name;
              }
            }

            onLocationChange(lat, lng, addr, city);
          }
        });
      }

      setLoading(false);
    });

    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || !window.google?.maps) return;

    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode(
      { address: searchQuery, componentRestrictions: { country: 'CM' } },
      (results: any[], status: string) => {
        if (status === 'OK' && results[0]) {
          const lat = results[0].geometry.location.lat();
          const lng = results[0].geometry.location.lng();
          updateMarker(lat, lng);
          mapInstanceRef.current?.setZoom(16);
          reverseGeocode(lat, lng);
          setSearchQuery('');
        }
      },
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-gray-1">
        <MapPin className="w-4 h-4 text-primary" />
        Emplacement de la boutique
      </div>

      {/* Barre de recherche */}
      <form onSubmit={handleSearchSubmit} className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-3" />
        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Rechercher un lieu au Cameroun..."
          className="w-full pl-10 pr-3 py-2.5 border border-gray-5 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
      </form>

      {/* Carte */}
      <div className="relative rounded-lg overflow-hidden border border-gray-5" style={{ height: 350 }}>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}
        <div ref={mapRef} className="w-full h-full" />
      </div>

      {/* Adresse detectee */}
      {currentAddress && (
        <div className="flex items-start gap-2 px-3 py-2 bg-green-50 rounded-lg">
          <MapPin className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
          <p className="text-xs text-green-700">{currentAddress}</p>
        </div>
      )}

      <p className="text-xs text-gray-3">
        Cliquez sur la carte ou glissez le marqueur pour ajuster l&apos;emplacement exact. Vous pouvez aussi rechercher une adresse.
      </p>
    </div>
  );
}
