import { useRef } from 'react';
import {
  Palette, Layers, Circle, Printer, Monitor,
  PenTool, Pencil, User, Mountain, ChevronLeft, ChevronRight
} from 'lucide-react';

export const STUDIO_MEDIUMS = [
  { value: '',            label: 'All Mediums', icon: Palette },
  { value: 'painting',   label: 'Painting',    icon: Layers },
  { value: 'pottery',    label: 'Pottery',      icon: Circle },
  { value: 'sculpture',  label: 'Sculpture',    icon: Layers },
  { value: 'printmaking',label: 'Printmaking',  icon: Printer },
  { value: 'digital art',label: 'Digital Art',  icon: Monitor },
  { value: 'calligraphy',label: 'Calligraphy',  icon: PenTool },
  { value: 'charcoal',   label: 'Charcoal',     icon: Pencil },
  { value: 'portrait',   label: 'Portrait',     icon: User },
  { value: 'landscape',  label: 'Landscape',    icon: Mountain },
];

/**
 * MediumSelector — horizontal scrollable pill row for art medium filtering.
 *
 * Props:
 *   value    {string}   Current active medium value ('' = All)
 *   onChange {fn}       Called with new medium value string
 *   dark     {boolean}  Dark background variant
 */
const MediumSelector = ({ value, onChange, dark = false }) => {
  const scrollRef = useRef(null);

  const scroll = (dir) => {
    scrollRef.current?.scrollBy({ left: dir * 180, behavior: 'smooth' });
  };

  return (
    <div className="relative flex items-center gap-1" role="group" aria-label="Filter by art medium">
      {/* Left scroll button */}
      <button
        type="button"
        onClick={() => scroll(-1)}
        aria-label="Scroll left"
        className={`shrink-0 p-1.5 rounded-lg transition-colors ${
          dark
            ? 'text-charcoal-500 hover:text-charcoal-300 hover:bg-charcoal-800'
            : 'text-charcoal-400 hover:text-charcoal-700 hover:bg-charcoal-100'
        }`}
      >
        <ChevronLeft className="w-4 h-4" aria-hidden="true" />
      </button>

      {/* Scrollable pill row */}
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto scrollbar-hide py-1 flex-1"
        role="radiogroup"
      >
        {STUDIO_MEDIUMS.map(({ value: v, label, icon: Icon }) => {
          const active = value === v;
          return (
            <button
              key={v}
              type="button"
              onClick={() => onChange?.(v)}
              role="radio"
              aria-checked={active}
              aria-label={label}
              className={`
                flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium
                whitespace-nowrap transition-all duration-200 shrink-0 outline-none
                focus-visible:ring-2 focus-visible:ring-canvas-400 focus-visible:ring-offset-1
                ${active
                  ? dark
                    ? 'bg-canvas-500 text-white shadow-art'
                    : 'bg-canvas-500 text-white shadow-art'
                  : dark
                    ? 'bg-charcoal-800 text-charcoal-300 hover:bg-charcoal-700 hover:text-white'
                    : 'bg-white text-charcoal-600 border border-charcoal-200 hover:border-canvas-300 hover:text-canvas-600'
                }
              `}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              {label}
            </button>
          );
        })}
      </div>

      {/* Right scroll button */}
      <button
        type="button"
        onClick={() => scroll(1)}
        aria-label="Scroll right"
        className={`shrink-0 p-1.5 rounded-lg transition-colors ${
          dark
            ? 'text-charcoal-500 hover:text-charcoal-300 hover:bg-charcoal-800'
            : 'text-charcoal-400 hover:text-charcoal-700 hover:bg-charcoal-100'
        }`}
      >
        <ChevronRight className="w-4 h-4" aria-hidden="true" />
      </button>
    </div>
  );
};

export default MediumSelector;
