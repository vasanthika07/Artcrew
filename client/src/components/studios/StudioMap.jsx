import { useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icon paths broken by bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

/** Create a custom SVG marker icon */
const createMarkerIcon = (selected = false) =>
  L.divIcon({
    html: `
      <svg width="${selected ? 40 : 32}" height="${selected ? 52 : 42}" viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg">
        <filter id="shadow">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.30)"/>
        </filter>
        <path filter="url(#shadow)"
          d="M16 0C9.373 0 4 5.373 4 12c0 9 12 26 12 26S28 21 28 12C28 5.373 22.627 0 16 0Z"
          fill="${selected ? '#bf6f1f' : '#d4892a'}"
          stroke="white" stroke-width="2"
        />
        <circle cx="16" cy="12" r="5" fill="white" opacity="${selected ? '1' : '0.85'}"/>
      </svg>
    `,
    className:    '',
    iconSize:     [selected ? 40 : 32, selected ? 52 : 42],
    iconAnchor:   [selected ? 20 : 16, selected ? 52 : 42],
    popupAnchor:  [0, -44],
  });

/** User location dot icon */
const userIcon = L.divIcon({
  html: `
    <div style="
      width: 16px; height: 16px;
      background: #3b82f6;
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 0 0 3px rgba(59,130,246,0.3);
    "></div>
  `,
  className:  '',
  iconSize:   [16, 16],
  iconAnchor: [8, 8],
});

/** Fly the map to a target location */
const MapFlyTo = ({ target, zoom = 14 }) => {
  const map = useMap();
  useEffect(() => {
    if (target) {
      map.flyTo([target.lat, target.lon], zoom, { duration: 1.2, easeLinearity: 0.25 });
    }
  }, [target, zoom, map]);
  return null;
};

/** Detect map pan/zoom end and call onBoundsChange */
const BoundsChangeDetector = ({ onBoundsChange, initialBounds }) => {
  const initialRef = useRef(initialBounds);
  useMapEvents({
    moveend(e) {
      const center = e.target.getCenter();
      const bounds = e.target.getBounds();
      const radiusM = Math.round(
        e.target.distance(bounds.getNorthEast(), bounds.getSouthWest()) / 2
      );
      onBoundsChange?.({
        lat:    center.lat,
        lon:    center.lng,
        radius: Math.min(radiusM, 50000),
      });
    },
  });
  return null;
};

/**
 * StudioMap — React Leaflet map with custom art-themed markers.
 *
 * Props:
 *   studios          {array}   Normalized studio objects
 *   userLocation     {object}  { lat, lon }
 *   selectedStudio   {object}  Currently selected studio (highlighted marker)
 *   onStudioSelect   {fn}      Called when a marker is clicked
 *   onBoundsChange   {fn}      Called when map is panned/zoomed with { lat, lon, radius }
 *   onSearchThisArea {fn}      Called when "Search This Area" button is clicked
 *   showSearchButton {boolean} Whether the "Search This Area" button is visible
 */
const StudioMap = ({
  studios          = [],
  userLocation     = null,
  selectedStudio   = null,
  onStudioSelect,
  onBoundsChange,
  onSearchThisArea,
  showSearchButton = false,
}) => {
  const defaultCenter = userLocation
    ? [userLocation.lat, userLocation.lon]
    : [20.5937, 78.9629]; // Centre of India

  const defaultZoom = userLocation ? 13 : 5;

  const handleMarkerClick = useCallback((studio) => {
    onStudioSelect?.(studio);
  }, [onStudioSelect]);

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        style={{ width: '100%', height: '100%' }}
        zoomControl={true}
        attributionControl={true}
        className="z-0"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors'
          maxZoom={19}
        />

        {/* Fly to selected studio */}
        {selectedStudio && (
          <MapFlyTo
            target={{ lat: selectedStudio.latitude, lon: selectedStudio.longitude }}
            zoom={15}
          />
        )}

        {/* Fly to user location when it changes */}
        {userLocation && !selectedStudio && (
          <MapFlyTo
            target={userLocation}
            zoom={13}
          />
        )}

        {/* Bounds change detector for "Search this area" */}
        <BoundsChangeDetector onBoundsChange={onBoundsChange} />

        {/* User location marker */}
        {userLocation && (
          <>
            <Marker
              position={[userLocation.lat, userLocation.lon]}
              icon={userIcon}
              zIndexOffset={1000}
            >
              <Popup>
                <div className="text-sm font-medium text-charcoal-800">📍 Your location</div>
              </Popup>
            </Marker>
            <Circle
              center={[userLocation.lat, userLocation.lon]}
              radius={200}
              pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.08, weight: 1 }}
            />
          </>
        )}

        {/* Studio markers */}
        {studios.map((studio, i) => {
          const isSelected = selectedStudio?.id === studio.id || selectedStudio?.externalPlaceId === studio.externalPlaceId;
          if (!studio.latitude || !studio.longitude) return null;
          return (
            <Marker
              key={studio.id || studio.externalPlaceId || i}
              position={[studio.latitude, studio.longitude]}
              icon={createMarkerIcon(isSelected)}
              zIndexOffset={isSelected ? 500 : 0}
              eventHandlers={{
                click: () => handleMarkerClick(studio),
              }}
              aria-label={studio.name}
            >
              <Popup>
                <div className="min-w-[160px]">
                  <p className="font-semibold text-sm text-charcoal-900 mb-0.5">{studio.name}</p>
                  {studio.address && (
                    <p className="text-xs text-charcoal-500 mb-1">{studio.address}</p>
                  )}
                  {studio.rating && (
                    <p className="text-xs text-canvas-600 font-medium">⭐ {studio.rating.toFixed(1)}</p>
                  )}
                  <button
                    onClick={() => handleMarkerClick(studio)}
                    className="mt-2 text-xs text-canvas-600 font-semibold hover:text-canvas-700 transition-colors"
                  >
                    View Details →
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* "Search This Area" button overlay */}
      {showSearchButton && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[400]">
          <button
            onClick={onSearchThisArea}
            className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-card-hover border border-charcoal-200
              text-sm font-semibold text-charcoal-800 hover:bg-canvas-50 hover:border-canvas-300 hover:text-canvas-700
              transition-all duration-200 active:scale-95"
            aria-label="Search studios in this area"
          >
            <svg className="w-3.5 h-3.5 text-canvas-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            Search This Area
          </button>
        </div>
      )}

      {/* Attribution override for cleaner look */}
      <style>{`
        .leaflet-control-attribution {
          font-size: 10px !important;
          opacity: 0.7;
        }
        .leaflet-popup-content-wrapper {
          border-radius: 12px !important;
          box-shadow: 0 4px 20px rgba(0,0,0,0.12) !important;
        }
        .leaflet-popup-tip {
          box-shadow: none !important;
        }
      `}</style>
    </div>
  );
};

export default StudioMap;
