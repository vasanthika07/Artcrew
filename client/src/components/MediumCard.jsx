import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CircleDollarSign, Palette, Sparkles } from 'lucide-react';

const DIFFICULTY_CONFIG = {
  Beginner: { cls: 'bg-sage-100 text-sage-800 border-sage-200', label: 'Beginner' },
  Intermediate: { cls: 'bg-amber-100 text-amber-800 border-amber-200', label: 'Intermediate' },
  Advanced: { cls: 'bg-terracotta-100 text-terracotta-800 border-terracotta-200', label: 'Advanced' },
};

const getOptimizedUrls = (rawUrl) => {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return {
      src: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80',
      srcSet: '',
    };
  }

  // If already full Unsplash URL, append auto=format & responsive widths
  if (rawUrl.includes('images.unsplash.com')) {
    const baseUrl = rawUrl.split('?')[0];
    return {
      src: `${baseUrl}?auto=format&fit=crop&w=800&q=80`,
      srcSet: `${baseUrl}?auto=format&fit=crop&w=400&q=75 400w, ${baseUrl}?auto=format&fit=crop&w=800&q=80 800w, ${baseUrl}?auto=format&fit=crop&w=1200&q=85 1200w`,
    };
  }

  return { src: rawUrl, srcSet: '' };
};

const MediumCard = ({ medium, compact = false }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const diff = DIFFICULTY_CONFIG[medium.difficulty] || {
    cls: 'bg-charcoal-100 text-charcoal-700 border-charcoal-200',
    label: medium.difficulty || 'Beginner',
  };

  const { src, srcSet } = getOptimizedUrls(medium.coverImage);

  if (compact) {
    return (
      <Link
        to={`/mediums/${medium.slug || medium._id}`}
        className="card-editorial group block overflow-hidden rounded-2xl bg-white border border-charcoal-100 shadow-sm hover:shadow-card-hover transition-all duration-300"
        aria-label={`Explore ${medium.name}`}
      >
        <div className="aspect-video overflow-hidden relative bg-charcoal-100">
          {!isLoaded && !hasError && (
            <div className="absolute inset-0 skeleton animate-pulse bg-charcoal-200" />
          )}

          <img
            src={src}
            srcSet={srcSet || undefined}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            alt={medium.name}
            loading="lazy"
            decoding="async"
            onLoad={() => setIsLoaded(true)}
            onError={() => {
              setHasError(true);
              setIsLoaded(true);
            }}
            className={`w-full h-full object-cover group-hover:scale-105 transition-all duration-500 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />

          <div
            className="absolute inset-0 bg-gradient-to-t from-charcoal-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            aria-hidden="true"
          />
        </div>

        <div className="p-4">
          <div className="flex items-center justify-between mb-1.5">
            <h3 className="font-display font-semibold text-charcoal-900 group-hover:text-canvas-600 transition-colors">
              {medium.name}
            </h3>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${diff.cls}`}>
              {diff.label}
            </span>
          </div>
          <p className="text-xs text-charcoal-500 line-clamp-2 leading-relaxed">
            {medium.description}
          </p>
        </div>
      </Link>
    );
  }

  return (
    <article className="card-editorial group flex flex-col h-full bg-white rounded-3xl border border-charcoal-100 shadow-sm hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 overflow-hidden">
      {/* ── Responsive Image Container ── */}
      <div className="aspect-[4/3] overflow-hidden relative bg-charcoal-100">
        {/* Shimmer skeleton while loading */}
        {!isLoaded && !hasError && (
          <div className="absolute inset-0 skeleton animate-pulse bg-charcoal-200 flex items-center justify-center">
            <Palette className="w-8 h-8 text-charcoal-300 animate-bounce" />
          </div>
        )}

        <img
          src={src}
          srcSet={srcSet || undefined}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          alt={medium.name}
          loading="lazy"
          decoding="async"
          onLoad={() => setIsLoaded(true)}
          onError={() => {
            setHasError(true);
            setIsLoaded(true);
          }}
          className={`w-full h-full object-cover group-hover:scale-105 transition-all duration-700 ease-spring ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Floating difficulty badge */}
        <div className="absolute top-3.5 left-3.5 z-10">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full shadow-sm backdrop-blur-md border ${diff.cls}`}>
            {diff.label}
          </span>
        </div>

        {/* Subtle dark gradient overlay */}
        <div
          className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-charcoal-900/40 to-transparent pointer-events-none"
          aria-hidden="true"
        />
      </div>

      {/* ── Content Details ── */}
      <div className="p-6 flex flex-col flex-1">
        {/* Supplies preview tags */}
        {medium.supplies?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3.5">
            {medium.supplies.slice(0, 3).map((s) => (
              <span
                key={s}
                className="text-[11px] font-medium bg-charcoal-50 text-charcoal-600 border border-charcoal-200/60 px-2 py-0.5 rounded-lg"
              >
                {s}
              </span>
            ))}
            {medium.supplies.length > 3 && (
              <span className="text-[11px] text-charcoal-400 font-medium px-1.5 py-0.5">
                +{medium.supplies.length - 3}
              </span>
            )}
          </div>
        )}

        <h3 className="font-display font-bold text-xl text-charcoal-900 mb-2 group-hover:text-canvas-600 transition-colors leading-snug">
          {medium.name}
        </h3>

        <p className="text-charcoal-500 text-sm mb-4 flex-1 line-clamp-3 leading-relaxed">
          {medium.description}
        </p>

        {/* Budget estimate */}
        {medium.estimatedBudget && (
          <div className="flex items-center gap-1.5 text-xs text-charcoal-600 mb-5 bg-canvas-50/60 border border-canvas-100/80 px-3 py-2 rounded-xl">
            <CircleDollarSign className="w-4 h-4 text-canvas-600 shrink-0" aria-hidden="true" />
            <span>
              Estimated Budget: <strong className="text-charcoal-900 font-semibold">{medium.estimatedBudget}</strong>
            </span>
          </div>
        )}

        {/* CTA Link */}
        <Link
          to={`/mediums/${medium.slug || medium._id}`}
          className="group/btn inline-flex items-center justify-between w-full text-sm font-semibold text-canvas-600 hover:text-canvas-700 bg-canvas-50 hover:bg-canvas-100/70 border border-canvas-200/80 px-4 py-2.5 rounded-xl transition-all mt-auto"
          aria-label={`Explore ${medium.name} medium`}
        >
          <span>Explore Medium Guide</span>
          <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform duration-200" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
};

export default MediumCard;
