import React from 'react';
import { Link } from 'react-router-dom';
import { Lock, Play, Clock, Crown, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const TIER_LABELS = { basic: 'Basic', pro: 'Pro', studio: 'Studio' };
const TIER_ORDER = { basic: 1, pro: 2, studio: 3 };

const formatDuration = (seconds) => {
  if (!seconds) return null;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m} min`;
};

const RecordedSessionCard = ({ session, onPlay }) => {
  const { user, hasSubscription, subscriptionTier } = useAuth();

  const userTierLevel = TIER_ORDER[subscriptionTier] || 0;
  const requiredLevel = TIER_ORDER[session.requiredTier] || 1;
  const isAdmin = user?.role === 'admin';
  const hasAccess = isAdmin || (hasSubscription && userTierLevel >= requiredLevel);
  const duration = formatDuration(session.durationSeconds);
  const watchProgress = session.watchProgress;

  const thumbnail =
    session.thumbnailUrl ||
    (session.muxPlaybackId
      ? `https://image.mux.com/${session.muxPlaybackId}/thumbnail.jpg?width=640&height=360&fit_mode=smartcrop&time=5`
      : 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=640&q=80');

  return (
    <article className="card-stream group relative flex flex-col rounded-2xl overflow-hidden bg-charcoal-900 border border-charcoal-800 hover:border-canvas-500/40 transition-all duration-300 shadow-md flex-1">
      {/* ── Thumbnail Container ── */}
      <div className="aspect-video overflow-hidden relative bg-charcoal-950">
        <img
          src={thumbnail}
          alt={session.title}
          className={`w-full h-full object-cover transition-all duration-500 ${
            hasAccess
              ? 'group-hover:scale-105 group-hover:brightness-95'
              : 'group-hover:scale-105 brightness-95'
          }`}
          loading="lazy"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=640&q=80';
          }}
        />

        {/* Access Overlays */}
        {hasAccess ? (
          <button
            type="button"
            onClick={() => onPlay?.(session, watchProgress?.progressSeconds || 0)}
            aria-label={`Play ${session.title}`}
            className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-charcoal-950/20 cursor-pointer"
          >
            <div className="w-13 h-13 rounded-full bg-canvas-500 text-charcoal-950 flex items-center justify-center shadow-xl shadow-canvas-500/30 group-hover:scale-110 transition-transform">
              <Play className="w-6 h-6 ml-0.5" fill="currentColor" aria-hidden="true" />
            </div>
          </button>
        ) : (
          /* LOCKED Non-subscriber Overlay */
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-charcoal-950/25 backdrop-blur-[0.5px]">
            <div className="w-10 h-10 rounded-2xl bg-charcoal-900/80 border border-charcoal-700/70 flex items-center justify-center mb-1.5 shadow-lg backdrop-blur-sm">
              <Lock className="w-4 h-4 text-canvas-400" aria-hidden="true" />
            </div>
            <p className="text-white text-xs font-bold uppercase tracking-wider mb-0.5 drop-shadow-md">
              LOCKED
            </p>
            <p className="text-charcoal-200 text-[11px] font-medium drop-shadow-sm">
              Requires {TIER_LABELS[session.requiredTier] || 'Basic'}+ Plan
            </p>
          </div>
        )}

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
          {hasAccess ? (
            <span className="badge bg-green-500/90 text-white font-bold text-[10px] px-2 py-0.5 shadow-sm">
              ✓ Unlocked
            </span>
          ) : (
            <span className="badge bg-charcoal-900/90 text-canvas-400 border border-charcoal-700 text-[10px] px-2 py-0.5 backdrop-blur-sm">
              <Crown className="w-3 h-3 inline mr-1" />
              {TIER_LABELS[session.requiredTier] || 'Basic'}+
            </span>
          )}

          {duration && (
            <span className="badge bg-charcoal-950/85 text-white/90 text-[10px] px-2 py-0.5 backdrop-blur-sm flex items-center gap-1 font-mono">
              <Clock className="w-3 h-3" />
              {duration}
            </span>
          )}
        </div>

        {/* Watch Progress Bar if in-progress */}
        {hasAccess && watchProgress && watchProgress.progressPercentage > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-charcoal-800">
            <div
              className="h-full bg-gradient-to-r from-canvas-500 to-terracotta-400"
              style={{ width: `${watchProgress.progressPercentage}%` }}
            />
          </div>
        )}
      </div>

      {/* ── Content ── */}
      <div className="p-4 flex flex-col flex-1 justify-between">
        <div>
          {/* Medium label */}
          {session.mediumId && (
            <p className="text-[10px] uppercase font-semibold tracking-wider text-canvas-400 mb-1">
              {session.mediumId.name || session.mediumId}
            </p>
          )}

          <h3 className="font-display font-semibold text-white text-sm sm:text-base line-clamp-2 leading-snug group-hover:text-canvas-300 transition-colors mb-2">
            {session.title}
          </h3>

          {/* Instructor */}
          {session.instructor && (
            <div className="flex items-center gap-2 text-xs text-charcoal-400 mb-4">
              <div className="w-5 h-5 rounded-full bg-canvas-500/20 text-canvas-400 flex items-center justify-center text-[10px] font-bold">
                {session.instructor.charAt(0).toUpperCase()}
              </div>
              <span className="truncate">{session.instructor}</span>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="mt-2 pt-2 border-t border-charcoal-800/80">
          {hasAccess ? (
            <button
              type="button"
              onClick={() => onPlay?.(session, watchProgress?.progressSeconds || 0)}
              className="btn-primary btn-sm w-full justify-center cursor-pointer"
              aria-label={`Watch ${session.title}`}
            >
              <Play className="w-3.5 h-3.5" fill="currentColor" aria-hidden="true" />
              {watchProgress && watchProgress.progressPercentage > 0 && !watchProgress.isCompleted
                ? `Resume (${watchProgress.progressPercentage}%)`
                : 'Watch Now'}
            </button>
          ) : (
            <Link
              to="/subscriptions"
              className="btn btn-sm w-full justify-center bg-charcoal-800 hover:bg-charcoal-700 text-canvas-300 border border-charcoal-700 hover:border-canvas-500 transition-all font-medium"
              aria-label="Subscribe to watch this session"
            >
              <Lock className="w-3.5 h-3.5 text-canvas-400 mr-1" />
              Subscribe to Watch
            </Link>
          )}
        </div>
      </div>
    </article>
  );
};

export default RecordedSessionCard;
