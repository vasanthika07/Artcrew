import { Link } from 'react-router-dom';
import { ArrowRight, CircleDollarSign } from 'lucide-react';

const DIFFICULTY_CONFIG = {
  Beginner:     { cls: 'bg-sage-100 text-sage-700',       label: 'Beginner' },
  Intermediate: { cls: 'bg-amber-100 text-amber-700',     label: 'Intermediate' },
  Advanced:     { cls: 'bg-terracotta-100 text-terracotta-700', label: 'Advanced' },
};

const MediumCard = ({ medium, compact = false }) => {
  const diff = DIFFICULTY_CONFIG[medium.difficulty] || { cls: 'bg-charcoal-100 text-charcoal-600', label: medium.difficulty || 'Beginner' };
  const imgSrc = medium.coverImage || 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&q=80';

  if (compact) {
    return (
      <Link
        to={`/mediums/${medium.slug || medium._id}`}
        className="card-editorial group block"
        aria-label={`Explore ${medium.name}`}
      >
        <div className="aspect-video overflow-hidden relative">
          <img
            src={imgSrc}
            alt={medium.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal-900/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" aria-hidden="true" />
        </div>
        <div className="p-4">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-display font-semibold text-charcoal-900 group-hover:text-canvas-600 transition-colors">
              {medium.name}
            </h3>
            <span className={`badge ${diff.cls}`}>{diff.label}</span>
          </div>
          <p className="text-sm text-charcoal-500 line-clamp-2">{medium.description}</p>
        </div>
      </Link>
    );
  }

  return (
    <article className="card-editorial group flex flex-col h-full">
      {/* ── Image ── */}
      <div className="aspect-[4/3] overflow-hidden relative">
        <img
          src={imgSrc}
          alt={medium.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-spring"
          loading="lazy"
        />
        {/* Difficulty badge — floated on image */}
        <div className="absolute top-3 left-3">
          <span className={`badge ${diff.cls} shadow-sm backdrop-blur-sm`}>{diff.label}</span>
        </div>
        {/* Subtle gradient at bottom for readability */}
        <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-charcoal-900/30 to-transparent" aria-hidden="true" />
      </div>

      {/* ── Content ── */}
      <div className="p-5 flex flex-col flex-1">
        {/* Eyebrow — supplies preview */}
        {medium.supplies?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {medium.supplies.slice(0, 3).map((s) => (
              <span key={s} className="tag">{s}</span>
            ))}
            {medium.supplies.length > 3 && (
              <span className="tag text-charcoal-400">+{medium.supplies.length - 3}</span>
            )}
          </div>
        )}

        <h3 className="font-display font-bold text-xl text-charcoal-900 mb-2 group-hover:text-canvas-600 transition-colors leading-snug">
          {medium.name}
        </h3>
        <p className="text-charcoal-500 text-sm mb-4 flex-1 line-clamp-3 leading-relaxed">
          {medium.description}
        </p>

        {/* Budget */}
        {medium.estimatedBudget && (
          <div className="flex items-center gap-1.5 text-sm text-charcoal-600 mb-4">
            <CircleDollarSign className="w-4 h-4 text-canvas-500 shrink-0" aria-hidden="true" />
            <span>Starting from <strong className="text-charcoal-800 font-semibold">{medium.estimatedBudget}</strong></span>
          </div>
        )}

        {/* CTA — text link style */}
        <Link
          to={`/mediums/${medium.slug || medium._id}`}
          className="group/btn inline-flex items-center gap-1.5 text-sm font-semibold text-canvas-600 hover:text-canvas-700 transition-colors mt-auto"
          aria-label={`Explore ${medium.name} medium`}
        >
          Explore Medium
          <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform duration-200" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
};

export default MediumCard;
