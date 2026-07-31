'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Search, Loader2 } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icon
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface GoogleMapPickerProps {
  latitude: number | null;
  longitude: number | null;
  address?: string;
  onLocationChange: (lat: number, lng: number, address?: string, city?: string) => void;
}

const DOUALA_LAT = 4.0511;
const DOUALA_LNG = 9.7679;

async function reverseGeocodeNominatim(lat: number, lng: number): Promise<{ address: string; city: string }> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=fr`,
      { headers: { 'User-Agent': 'EstuaireAchats/1.0' } }
    );
    const data = await res.json();
    const addr = data.display_name || '';
    const city = data.address?.city || data.address?.town || data.address?.village || data.address?.state || '';
    return { address: addr, city };
  } catch {
    return { address: '', city: '' };
  }
}

async function searchNominatim(query: string): Promise<{ lat: number; lng: number; address: string; city: string } | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ', Cameroun')}&limit=1&addressdetails=1&accept-language=fr`,
      { headers: { 'User-Agent': 'EstuaireAchats/1.0' } }
    );
    const data = await res.json();
    if (data.length === 0) return null;
    const result = data[0];
    const city = result.address?.city || result.address?.town || result.address?.village || result.address?.state || '';
    return {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      address: result.display_name || '',
      city,
    };
  } catch {
    return null;
  }
}

function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function MapFlyTo({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], 16, { duration: 0.8 });
  }, [map, lat, lng]);
  return null;
}

export default function GoogleMapPicker({ latitude, longitude, address, onLocationChange }: GoogleMapPickerProps) {
  const [markerPos, setMarkerPos] = useState<[number, number] | null>(
    latitude && longitude ? [latitude, longitude] : null
  );
  const [flyTo, setFlyTo] = useState<[number, number] | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [currentAddress, setCurrentAddress] = useState(address || '');
  const markerRef = useRef<L.Marker>(null);

  const handleMapClick = useCallback(async (lat: number, lng: number) => {
    setMarkerPos([lat, lng]);
    const { address: addr, city } = await reverseGeocodeNominatim(lat, lng);
    setCurrentAddress(addr);
    onLocationChange(lat, lng, addr, city);
  }, [onLocationChange]);

  const handleMarkerDrag = useCallback(async () => {
    const marker = markerRef.current;
    if (!marker) return;
    const pos = marker.getLatLng();
    setMarkerPos([pos.lat, pos.lng]);
    const { address: addr, city } = await reverseGeocodeNominatim(pos.lat, pos.lng);
    setCurrentAddress(addr);
    onLocationChange(pos.lat, pos.lng, addr, city);
  }, [onLocationChange]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    const result = await searchNominatim(searchQuery);
    setSearching(false);
    if (result) {
      setMarkerPos([result.lat, result.lng]);
      setFlyTo([result.lat, result.lng]);
      setCurrentAddress(result.address);
      setSearchQuery('');
      onLocationChange(result.lat, result.lng, result.address, result.city);
    }
  };

  const centerLat = markerPos?.[0] ?? DOUALA_LAT;
  const centerLng = markerPos?.[1] ?? DOUALA_LNG;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-gray-1">
        <MapPin className="w-4 h-4 text-primary" />
        Emplacement de la boutique
      </div>

      <form onSubmit={handleSearch} className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-3" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Rechercher un lieu au Cameroun..."
          className="w-full pl-10 pr-3 py-2.5 border border-gray-5 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
        {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-primary" />}
      </form>

      <div className="relative rounded-lg overflow-hidden border border-gray-5" style={{ height: 350 }}>
        <MapContainer
          center={[centerLat, centerLng]}
          zoom={15}
          style={{ height: '100%', width: '100%' }}
          attributionControl={false}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapClickHandler onMapClick={handleMapClick} />
          {flyTo && <MapFlyTo lat={flyTo[0]} lng={flyTo[1]} />}
          {markerPos && (
            <Marker
              position={markerPos}
              icon={defaultIcon}
              draggable
              ref={markerRef}
              eventHandlers={{ dragend: handleMarkerDrag }}
            />
          )}
        </MapContainer>
      </div>

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
