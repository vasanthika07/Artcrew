import { useState, useCallback, useRef } from 'react';
import api from '../api/axios';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

const geocodeText = async (query) => {
  const params = new URLSearchParams({
    q: query.trim(),
    format: 'json',
    limit: '1',
    addressdetails: '1',
    'accept-language': 'en',
  });
  const resp = await fetch(`${NOMINATIM_URL}?${params}`, {
    headers: { 'User-Agent': 'ArtCrew/1.0' },
  });
  if (!resp.ok) throw new Error('NETWORK_ERROR');
  const data = await resp.json();
  if (!data.length) throw new Error('INVALID_LOCATION');
  const r = data[0];
  const city =
    r.address?.city || r.address?.town || r.address?.village ||
    r.address?.county || r.display_name?.split(',')[0];
  const displayName = [city, r.address?.state, r.address?.country].filter(Boolean).join(', ');
  return { lat: parseFloat(r.lat), lon: parseFloat(r.lon), displayName };
};

const useStudioSearch = ({ medium: initMedium = '', radius: initRadius = 10000, sort: initSort = 'distance' } = {}) => {
  const [studios,      setStudios]      = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState(null);
  const [hasSearched,  setHasSearched]  = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [provider,     setProvider]     = useState(null);
  const [sort,         setSort]         = useState(initSort);
  const [medium,       setMedium]       = useState(initMedium);
  const [radius,       setRadius]       = useState(initRadius);

  const sortRef   = useRef(sort);
  const mediumRef = useRef(medium);
  const radiusRef = useRef(radius);
  sortRef.current   = sort;
  mediumRef.current = medium;
  radiusRef.current = radius;

  const search = useCallback(async (lat, lon) => {
    setLoading(true);
    setError(null);
    setHasSearched(true);
    try {
      const params = new URLSearchParams({ lat, lon, radius: radiusRef.current, sort: sortRef.current });
      if (mediumRef.current) params.set('medium', mediumRef.current);
      const { data } = await api.get(`/studios/nearby?${params}`);
      setStudios(data.data ?? []);
      setProvider(data.provider ?? null);
      if (!data.data?.length) {
        setError({ code: 'NO_RESULTS', message: 'No art studios found nearby. Try expanding the radius or choosing a different medium.' });
      }
    } catch (err) {
      const status = err.response?.status;
      const code   = err.response?.data?.code;
      if (!navigator.onLine || err.code === 'ERR_NETWORK') {
        setError({ code: 'NETWORK_ERROR', message: 'You appear to be offline. Please check your connection and try again.' });
      } else if (status === 422 && code === 'MISSING_COORDINATES') {
        setError({ code: 'INVALID_COORDINATES', message: 'Missing coordinates. Please search a location first.' });
      } else if (status === 422 && code === 'INVALID_COORDINATES') {
        setError({ code: 'INVALID_COORDINATES', message: 'The coordinates are outside valid bounds. Please try a different location.' });
      } else {
        setError({ code: 'API_ERROR', message: 'Failed to search studios. Please try again in a moment.' });
      }
      setStudios([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const geolocate = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const err = { code: 'NOT_SUPPORTED', message: 'Geolocation is not supported by your browser. Please search by city name instead.' };
        setError(err); reject(err); return;
      }
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lon: pos.coords.longitude };
          setUserLocation(loc); setError(null);
          search(loc.lat, loc.lon); resolve(loc);
        },
        (geoErr) => {
          setLoading(false);
          let err;
          switch (geoErr.code) {
            case geoErr.PERMISSION_DENIED:
              err = { code: 'PERMISSION_DENIED', message: 'Location access was denied. Allow location in browser settings, or search by city name.' }; break;
            case geoErr.POSITION_UNAVAILABLE:
              err = { code: 'POSITION_UNAVAILABLE', message: 'Your location could not be determined. Please search by city name instead.' }; break;
            case geoErr.TIMEOUT:
              err = { code: 'TIMEOUT', message: 'Location request timed out. Please try again or search by city name.' }; break;
            default:
              err = { code: 'GEO_ERROR', message: 'Could not get your location. Please search by city name.' };
          }
          setError(err); reject(err);
        },
        { timeout: 10000, maximumAge: 60000, enableHighAccuracy: false }
      );
    });
  }, [search]);

  const geocodeAndSearch = useCallback(async (query) => {
    if (!query?.trim()) return;
    setLoading(true);
    try {
      const loc = await geocodeText(query);
      setUserLocation({ lat: loc.lat, lon: loc.lon });
      setError(null);
      await search(loc.lat, loc.lon);
      return loc;
    } catch (err) {
      setLoading(false);
      if (err.message === 'INVALID_LOCATION') {
        const e = { code: 'INVALID_LOCATION', message: `"${query}" could not be found. Try a different city or area name.` };
        setError(e); throw e;
      } else {
        const e = { code: 'NETWORK_ERROR', message: 'Location search failed. Please check your connection and try again.' };
        setError(e); throw e;
      }
    }
  }, [search]);

  const reset = useCallback(() => {
    setStudios([]); setError(null); setHasSearched(false); setUserLocation(null); setProvider(null);
  }, []);

  return {
    studios, loading, error, hasSearched, userLocation, provider, sort, medium, radius,
    setSort, setMedium, setRadius, setUserLocation,
    search, geolocate, geocodeAndSearch, reset,
  };
};

export default useStudioSearch;
