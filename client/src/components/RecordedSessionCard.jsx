import { Link } from 'react-router-dom';
import { Lock, Play, Clock, User, Crown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const TIER_LABELS  = { basic: 'Basic', pro: 'Pro', studio: 'Studio' };
const TIER_ORDER   = { basic: 1, pro: 2, studio: 3 };

const formatDuration = (seconds) => {
  if (!seconds) return null;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m} min`;
};

const RecordedSessionCard = ({ session, onPlay }) => {
  const { hasSubscription, subscriptionTier } = useAuth();

  const userTierLevel = TIER_ORDER[subscriptionTier] || 0;
  const requiredLevel = TIER_ORDER[session.requiredTier] || 1;
  const hasAccess    = hasSubscription && userTierLevel >= requiredLevel;
  const duration     = formatDuration(session.durationSeconds);

  const thumbnail = session.thumbnailUrl
    || (session.muxPlaybackId
      ? `https://image.mux.com/${session.muxPlaybackId}/thumbnail.jpg?width=640&height=360&fit_mode=smartcrop&time=5`
      : 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=640&q=80');

  return (
    <article className="card-stream group relative flex flex-col">
      {/* ── Thumbnail ── */}
      <div className="aspect-video overflow-hidden relative">
        <img
          src={thumbnail}
          alt={session.title}
          className={`w-full h-full object-cover transition-all duration-500 ${
            hasAccess
              ? 'group-hover:scale-105 group-hover:brightness-75'
              : 'brightness-[0.35]'
          }`}
          loading="lazy"
        />

        {/* Play button — center hover reveal */}
        {hasAccess ? (
          <button
            onClick={() => onPlay?.(session)}
            aria-label={`Play ${session.title}`}
            className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          >
            <div className="play-btn">
              <Play className="w-6 h-6 text-canvas-600 ml-0.5" fill="currentColor" aria-hidden="true" />
            </div>
          </button>
        ) : (
          <div className="locked-overlay" aria-label="Subscription required">
            <div className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center mb-1">
              <Lock className="w-5 h-5 text-white/90" aria-hidden="true" />
            </div>
            <p className="text-white/90 text-xs font-semibold uppercase tracking-wide">
              {TIER_LABELS[session.requiredTier]}+ Plan
            </p>
          </div>
        )}

        {/* Duration badge */}
        {duration && (
          <div className="absolute bottom-2 right-2">
            <span className="badge-dark flex items-center gap-1 badge">
              <Clock className="w-3 h-3" aria-hidden="true" />
              {duration}
            </span>
          </div>
        )}

        {/* Access badge */}
        <div className="absolute top-2 left-2">
          {hasAccess ? (
            <span className="badge bg-sage-500 text-white shadow-sm">✓ Unlocked</span>
          ) : (
            <span className="badge bg-charcoal-950/80 text-charcoal-200 backdrop-blur-sm">
              <Crown className="w-3 h-3 text-canvas-400" aria-hidden="true" />
              {TIER_LABELS[session.requiredTier]}+
            </span>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="p-4 flex flex-col flex-1">
        {/* Medium label */}
        {session.mediumId && (
          <p className="eyebrow-light text-[10px] mb-1.5">
            {session.mediumId.name || session.mediumId}
          </p>
        )}

        <h3 className="font-display font-semibold text-white text-sm mb-2 line-clamp-2 leading-snug group-hover:text-canvas-300 transition-colors">
          {session.title}
        </h3>

        {/* Instructor */}
        {session.instructor && (
          <div className="flex items-center gap-1.5 text-xs text-charcoal-400 mb-3">
            <div className="w-5 h-5 rounded-full bg-canvas-800 flex items-center justify-center text-canvas-300 text-[9px] font-bold shrink-0">
              {session.instructor.charAt(0).toUpperCase()}
            </div>
            <span className="truncate">{session.instructor}</span>
          </div>
        )}

        {/* CTA */}
        <div className="mt-auto">
          {hasAccess ? (
            <button
              onClick={() => onPlay?.(session)}
              className="btn-primary btn-sm w-full justify-center"
              aria-label={`Watch ${session.title}`}
            >
              <Play className="w-3.5 h-3.5" fill="currentColor" aria-hidden="true" />
              Watch Now
            </button>
          ) : (
            <Link
              to="/subscriptions"
              className="btn btn-sm w-full justify-center border border-charcoal-700 text-charcoal-300 hover:border-canvas-500 hover:text-canvas-300 transition-all"
              aria-label="Subscribe to watch this session"
            >
              <Crown className="w-3.5 h-3.5 text-canvas-400" aria-hidden="true" />
              Unlock with Plan
            </Link>
          )}
        </div>
      </div>
    </article>
  );
};

export default RecordedSessionCard;
