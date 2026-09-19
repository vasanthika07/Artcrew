import { useState, useRef, useEffect, useCallback } from 'react';
import { MapPin, Search, Loader2, X } from 'lucide-react';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

/** Debounce helper */
const useDebounce = (value, delay) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
};

/**
 * LocationSearch — autocomplete input that geocodes a city/address
 * using the free Nominatim (OpenStreetMap) service.
 *
 * Props:
 *   value        {string}    Controlled input value
 *   onChange     {fn}        Called with raw text as user types
 *   onSelect     {fn({lat, lon, displayName})} Called when user picks a suggestion
 *   placeholder  {string}
 *   dark         {boolean}   Dark background variant
 */
const LocationSearch = ({ value, onChange, onSelect, placeholder = 'Search city or area…', dark = false, className = '' }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [open,        setOpen]        = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef      = useRef(null);
  const listRef       = useRef(null);
  const abortRef      = useRef(null);

  const debouncedValue = useDebounce(value, 350);

  // Fetch suggestions from Nominatim
  const fetchSuggestions = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    // Abort previous in-flight request
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        q:              query,
        format:         'json',
        limit:          '6',
        addressdetails: '1',
        'accept-language': 'en',
      });
      const resp = await fetch(`${NOMINATIM_URL}?${params}`, {
        signal: controller.signal,
        headers: { 'User-Agent': 'ArtCrew/1.0' },
      });
      const data = await resp.json();
      setSuggestions(data);
      setOpen(data.length > 0);
      setActiveIndex(-1);
    } catch (err) {
      if (err.name !== 'AbortError') {
        setSuggestions([]);
        setOpen(false);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSuggestions(debouncedValue);
  }, [debouncedValue, fetchSuggestions]);

  const handleSelect = (suggestion) => {
    const displayName = [
      suggestion.address?.city ||
      suggestion.address?.town ||
      suggestion.address?.village ||
      suggestion.address?.county ||
      suggestion.display_name?.split(',')[0],
      suggestion.address?.state,
      suggestion.address?.country,
    ].filter(Boolean).join(', ');

    onChange?.(displayName);
    onSelect?.({
      lat:         parseFloat(suggestion.lat),
      lon:         parseFloat(suggestion.lon),
      displayName,
    });
    setSuggestions([]);
    setOpen(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e) => {
    if (!open || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0) handleSelect(suggestions[activeIndex]);
    } else if (e.key === 'Escape') {
      setOpen(false);
      setSuggestions([]);
    }
  };

  const clear = () => {
    onChange?.('');
    setSuggestions([]);
    setOpen(false);
    inputRef.current?.focus();
  };

  const inputClass = dark
    ? 'w-full pl-10 pr-9 py-3 rounded-xl border border-charcoal-700 bg-charcoal-800 text-white placeholder:text-charcoal-500 focus:outline-none focus:ring-2 focus:ring-canvas-500 focus:border-canvas-500 transition-all text-sm'
    : 'w-full pl-10 pr-9 py-3 rounded-xl border border-charcoal-200 bg-white text-ink placeholder:text-charcoal-400 focus:outline-none focus:ring-2 focus:ring-canvas-400 focus:border-canvas-400 transition-all text-sm';

  return (
    <div className={`relative ${className}`}>
      {/* Input */}
      <div className="relative">
        {loading ? (
          <Loader2
            className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin pointer-events-none ${dark ? 'text-charcoal-400' : 'text-charcoal-400'}`}
            aria-hidden="true"
          />
        ) : (
          <MapPin
            className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${dark ? 'text-charcoal-400' : 'text-canvas-500'}`}
            aria-hidden="true"
          />
        )}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={placeholder}
          autoComplete="off"
          aria-label="Location search"
          aria-autocomplete="list"
          aria-controls="location-suggestions"
          aria-expanded={open}
          aria-activedescendant={activeIndex >= 0 ? `suggestion-${activeIndex}` : undefined}
          className={inputClass}
          role="combobox"
        />
        {value && (
          <button
            type="button"
            onClick={clear}
            aria-label="Clear location"
            className={`absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full transition-colors ${
              dark
                ? 'text-charcoal-500 hover:text-charcoal-300'
                : 'text-charcoal-400 hover:text-charcoal-700'
            }`}
          >
            <X className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && suggestions.length > 0 && (
        <ul
          id="location-suggestions"
          ref={listRef}
          role="listbox"
          aria-label="Location suggestions"
          className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-white border border-charcoal-100 rounded-2xl shadow-card-hover overflow-hidden animate-scale-in origin-top"
        >
          {suggestions.map((s, i) => {
            const city    = s.address?.city || s.address?.town || s.address?.village || s.address?.county || s.display_name?.split(',')[0];
            const country = s.address?.country || '';
            const state   = s.address?.state || '';
            const sub     = [state, country].filter(Boolean).join(', ');

            return (
              <li
                key={s.place_id}
                id={`suggestion-${i}`}
                role="option"
                aria-selected={i === activeIndex}
                onClick={() => handleSelect(s)}
                onMouseEnter={() => setActiveIndex(i)}
                className={`flex items-start gap-2.5 px-4 py-3 cursor-pointer transition-colors text-sm ${
                  i === activeIndex ? 'bg-canvas-50' : 'hover:bg-charcoal-50'
                } ${i > 0 ? 'border-t border-charcoal-50' : ''}`}
              >
                <MapPin className="w-4 h-4 text-terracotta-400 shrink-0 mt-0.5" aria-hidden="true" />
                <span className="min-w-0">
                  <span className="font-medium text-charcoal-900 block truncate">{city || s.display_name?.split(',')[0]}</span>
                  {sub && <span className="text-charcoal-400 text-xs">{sub}</span>}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default LocationSearch;
