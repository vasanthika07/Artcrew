import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix Leaflet default marker icon issue with Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom colored marker
const createStudioIcon = (isSelected = false) =>
  L.divIcon({
    html: `<div style="
      width: 32px; height: 32px;
      background: ${isSelected ? '#d9522c' : '#d4892a'};
      border: 3px solid white;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    "></div>`,
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });

const userIcon = L.divIcon({
  html: `<div style="
    width: 16px; height: 16px;
    background: #2563eb;
    border: 3px solid white;
    border-radius: 50%;
    box-shadow: 0 0 0 4px rgba(37,99,235,0.2);
  "></div>`,
  className: '',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

// Component to pan map to selected studio
const MapPanner = ({ selectedStudio }) => {
  const map = useMap();
  useEffect(() => {
    if (selectedStudio) {
      map.flyTo([selectedStudio.latitude, selectedStudio.longitude], 15, { duration: 0.8 });
    }
  }, [selectedStudio, map]);
  return null;
};

const StudioMap = ({ studios = [], userLocation, selectedStudio, onStudioSelect }) => {
  const center = userLocation
    ? [userLocation.lat, userLocation.lon]
    : [20.5937, 78.9629]; // India center

  const zoom = userLocation ? 12 : 5;

  return (
    <div className="map-container h-full w-full min-h-[400px]">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%', minHeight: '400px' }}
        className="rounded-2xl"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapPanner selectedStudio={selectedStudio} />

        {/* User location marker */}
        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lon]} icon={userIcon}>
            <Popup>
              <div className="text-sm font-medium">📍 You are here</div>
            </Popup>
          </Marker>
        )}

        {/* Studio markers */}
        {studios.map((studio, i) => (
          <Marker
            key={studio.externalPlaceId || studio._id || i}
            position={[studio.latitude, studio.longitude]}
            icon={createStudioIcon(selectedStudio?.externalPlaceId === studio.externalPlaceId)}
            eventHandlers={{ click: () => onStudioSelect?.(studio) }}
          >
            <Popup>
              <div className="min-w-[180px]">
                <p className="font-semibold text-sm">{studio.name}</p>
                {studio.address && <p className="text-xs text-gray-500 mt-1">{studio.address}</p>}
                {studio.rating && (
                  <p className="text-xs mt-1">⭐ {studio.rating.toFixed(1)}</p>
                )}
                {studio.distance !== undefined && (
                  <p className="text-xs text-gray-500">
                    {studio.distance < 1
                      ? `${(studio.distance * 1000).toFixed(0)}m away`
                      : `${studio.distance.toFixed(1)}km away`}
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default StudioMap;
