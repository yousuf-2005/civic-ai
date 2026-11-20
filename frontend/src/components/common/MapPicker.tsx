import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Navigation, Compass, Search, Loader2 } from 'lucide-react';

// Custom SVG Pin Icon
const pinIcon = L.divIcon({
  className: 'custom-map-pin',
  html: `
    <div style="
      background-color: #0270c7;
      color: white;
      width: 34px;
      height: 34px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 10px rgba(0,0,0,0.3);
      border: 2px solid white;
    ">
      <div style="
        transform: rotate(45deg);
        width: 12px;
        height: 12px;
        background-color: white;
        border-radius: 50%;
      "></div>
    </div>
  `,
  iconSize: [34, 34],
  iconAnchor: [17, 34],
  popupAnchor: [0, -34],
});

interface Props {
  latitude: number | null;
  longitude: number | null;
  address: string;
  onLocationChange: (lat: number, lng: number, addr?: string) => void;
  readOnly?: boolean;
  height?: string;
}

// Inner component to handle map clicks & panning
function MapEventsHandler({
  onLocationSelect,
  readOnly,
}: {
  onLocationSelect: (lat: number, lng: number) => void;
  readOnly?: boolean;
}) {
  useMapEvents({
    click(e) {
      if (!readOnly) {
        onLocationSelect(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

// Component to dynamically re-center map when lat/lng changes
function MapRecenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], map.getZoom(), { animate: true, duration: 0.8 });
  }, [lat, lng, map]);
  return null;
}

export const MapPicker: React.FC<Props> = ({
  latitude,
  longitude,
  address,
  onLocationChange,
  readOnly = false,
  height = '360px',
}) => {
  // Default fallback coords (Bangalore central coordinates or user default)
  const defaultLat = parseFloat(import.meta.env.VITE_MAP_DEFAULT_LAT || '12.9716');
  const defaultLng = parseFloat(import.meta.env.VITE_MAP_DEFAULT_LNG || '77.5946');

  const currentLat = latitude ?? defaultLat;
  const currentLng = longitude ?? defaultLng;

  const [isLocating, setIsLocating] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [localAddress, setLocalAddress] = useState(address || '');
  const [geoError, setGeoError] = useState<string | null>(null);

  useEffect(() => {
    setLocalAddress(address || '');
  }, [address]);

  // Request browser GPS with explicit user consent
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setIsLocating(false);
        onLocationChange(lat, lng);
        await reverseGeocode(lat, lng);
      },
      (err) => {
        setIsLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGeoError('Location access was denied. You can still click anywhere on the map to place a pin.');
        } else {
          setGeoError('Unable to retrieve GPS coordinates. Please click on the map.');
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Reverse geocoding via OpenStreetMap Nominatim with safety throttle
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      setIsGeocoding(true);
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;
      const res = await fetch(url, {
        headers: {
          'Accept-Language': 'en',
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.display_name) {
          setLocalAddress(data.display_name);
          onLocationChange(lat, lng, data.display_name);
        }
      }
    } catch {
      // Graceful fallback: coordinates remain valid even if geocoder is unreachable
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleMapClick = async (lat: number, lng: number) => {
    onLocationChange(lat, lng);
    await reverseGeocode(lat, lng);
  };

  return (
    <div className="w-full space-y-3">
      {/* Map Header Controls */}
      {!readOnly && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-civic-600 flex-shrink-0" />
            <span>Click on the map or drag the pin to mark the grievance site.</span>
          </div>
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={isLocating}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-civic-700 bg-civic-50 hover:bg-civic-100 border border-civic-200 rounded-xl transition-colors self-start sm:self-auto"
          >
            {isLocating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Navigation className="w-3.5 h-3.5" />
            )}
            <span>Use My Current Location</span>
          </button>
        </div>
      )}

      {/* Interactive Map Box */}
      <div
        className="relative w-full rounded-2xl overflow-hidden border border-slate-300 shadow-inner bg-slate-100"
        style={{ height }}
      >
        <MapContainer
          center={[currentLat, currentLng]}
          zoom={14}
          scrollWheelZoom={!readOnly}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapRecenter lat={currentLat} lng={currentLng} />

          <MapEventsHandler onLocationSelect={handleMapClick} readOnly={readOnly} />

          {latitude !== null && longitude !== null && (
            <Marker
              position={[latitude, longitude]}
              icon={pinIcon}
              draggable={!readOnly}
              eventHandlers={{
                dragend: (e) => {
                  const marker = e.target;
                  const pos = marker.getLatLng();
                  handleMapClick(pos.lat, pos.lng);
                },
              }}
            />
          )}
        </MapContainer>

        {isGeocoding && (
          <div className="absolute top-3 right-3 z-[1000] bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg shadow text-xs font-medium text-slate-700 flex items-center gap-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-civic-600" />
            <span>Resolving address...</span>
          </div>
        )}
      </div>

      {geoError && (
        <p className="text-xs text-amber-600 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
          {geoError}
        </p>
      )}

      {/* Coordinate & Address Input Field */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
        <div className="sm:col-span-2">
          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
            Confirmed Location / Address Landmark
          </label>
          <input
            type="text"
            value={localAddress}
            disabled={readOnly}
            onChange={(e) => {
              setLocalAddress(e.target.value);
              if (latitude && longitude) {
                onLocationChange(latitude, longitude, e.target.value);
              }
            }}
            placeholder="e.g. 4th Main Road near City Hospital, Ward 12"
            className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-800 text-xs focus:ring-2 focus:ring-civic-500 focus:outline-none disabled:bg-slate-100"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
            Geographic Coordinates
          </label>
          <div className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 font-mono text-[11px] truncate flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-civic-600 flex-shrink-0" />
            <span>
              {latitude && longitude
                ? `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
                : 'No pin set'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
