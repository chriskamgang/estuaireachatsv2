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

async function reverseGeocodeNominatim(lat: number, lng: number): Promise<{ address: string; city: string; country: string }> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=fr`,
      { headers: { 'User-Agent': 'EstuaireAchats/1.0' } }
    );
    const data = await res.json();
    const address = data.display_name || '';
    const city = data.address?.city || data.address?.town || data.address?.village || data.address?.state || '';
    const country = data.address?.country || '';
    return { address, city, country };
  } catch {
    return { address: '', city: '', country: '' };
  }
}

async function searchNominatim(query: string): Promise<{ lat: number; lng: number; address: string; city: string; country: string } | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ', Cameroun')}&limit=1&addressdetails=1&accept-language=fr`,
      { headers: { 'User-Agent': 'EstuaireAchats/1.0' } }
    );
    const data = await res.json();
    if (data.length === 0) return null;
    const result = data[0];
    const city = result.address?.city || result.address?.town || result.address?.village || result.address?.state || '';
    const country = result.address?.country || '';
    return {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      address: result.display_name || '',
      city,
      country,
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

export default function AddressMapPicker({ initialLat, initialLng, onChange }: AddressMapPickerProps) {
  const startLat = initialLat && initialLat !== 0 ? initialLat : DOUALA_LAT;
  const startLng = initialLng && initialLng !== 0 ? initialLng : DOUALA_LNG;

  const [markerPos, setMarkerPos] = useState<[number, number] | null>(
    initialLat && initialLat !== 0 ? [startLat, startLng] : null
  );
  const [flyTo, setFlyTo] = useState<[number, number] | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [reverseGeocoding, setReverseGeocoding] = useState(false);
  const markerRef = useRef<L.Marker>(null);

  const handleMapClick = useCallback(async (lat: number, lng: number) => {
    setMarkerPos([lat, lng]);
    setReverseGeocoding(true);
    const { address, city, country } = await reverseGeocodeNominatim(lat, lng);
    setReverseGeocoding(false);
    onChange({ lat, lng, address, city, country });
  }, [onChange]);

  const handleMarkerDrag = useCallback(async () => {
    const marker = markerRef.current;
    if (!marker) return;
    const pos = marker.getLatLng();
    setMarkerPos([pos.lat, pos.lng]);
    setReverseGeocoding(true);
    const { address, city, country } = await reverseGeocodeNominatim(pos.lat, pos.lng);
    setReverseGeocoding(false);
    onChange({ lat: pos.lat, lng: pos.lng, address, city, country });
  }, [onChange]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    const result = await searchNominatim(searchQuery);
    setSearching(false);
    if (result) {
      setMarkerPos([result.lat, result.lng]);
      setFlyTo([result.lat, result.lng]);
      setSearchQuery('');
      onChange({ lat: result.lat, lng: result.lng, address: result.address, city: result.city, country: result.country });
    }
  };

  return (
    <div className="mt-4 space-y-3">
      <label className="flex items-center gap-2 text-sm font-medium text-[#191919]">
        <MapPin className="h-4 w-4 text-[#E82328]" />
        Localisation sur la carte
      </label>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher une adresse au Cameroun..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
          className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-10 text-sm outline-none focus:border-[#E82328]"
        />
        {searching && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-[#E82328]" />}
      </div>

      <div className="relative overflow-hidden rounded-lg border border-gray-200" style={{ height: 300 }}>
        <MapContainer
          center={[startLat, startLng]}
          zoom={14}
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

      {reverseGeocoding && (
        <p className="flex items-center gap-2 text-xs text-gray-500">
          <Loader2 className="h-3 w-3 animate-spin" />
          Recherche de l&apos;adresse...
        </p>
      )}

      {markerPos && !reverseGeocoding && (
        <p className="text-xs text-gray-400">
          Coordonnees : {markerPos[0].toFixed(5)}, {markerPos[1].toFixed(5)}
        </p>
      )}
    </div>
  );
}
