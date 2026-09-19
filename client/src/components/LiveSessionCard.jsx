import { format } from 'date-fns';
import { Calendar, Clock, User, Lock, Radio } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const STATUS_CONFIG = {
  scheduled: {
    badge: 'bg-charcoal-100 text-charcoal-600',
    dot:   'bg-charcoal-400',
    label: 'Upcoming',
  },
  live: {
    badge: 'bg-red-500 text-white',
    dot:   'bg-red-400 animate-pulse',
    label: 'Live Now',
  },
  ended: {
    badge: 'bg-charcoal-100 text-charcoal-400',
    dot:   'bg-charcoal-300',
    label: 'Ended',
  },
};

const TIER_LABELS = { basic: 'Basic', pro: 'Pro', studio: 'Studio' };

const LiveSessionCard = ({ session }) => {
  const { hasSubscription, subscriptionTier } = useAuth();
  const status = STATUS_CONFIG[session.status] || STATUS_CONFIG.scheduled;

  const tierOrder     = { basic: 1, pro: 2, studio: 3 };
  const userTierLevel = tierOrder[subscriptionTier] || 0;
  const requiredLevel = tierOrder[session.requiredTier] || 1;
  const hasAccess     = hasSubscription && userTierLevel >= requiredLevel;
  const isLive        = session.status === 'live';

  return (
    <article className={`card-hover group relative overflow-hidden ${isLive ? 'ring-2 ring-red-500/60' : ''}`}>
      {/* ── Thumbnail ── */}
      <div className="aspect-video overflow-hidden relative">
        <img
          src={session.thumbnailUrl || session.mediumId?.coverImage || 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&q=80'}
          alt={session.title}
          className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105 brightness-95"
          loading="lazy"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&q=80';
          }}
        />

        {/* Status */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${status.dot} shrink-0`} aria-hidden="true" />
          <span className={`badge ${status.badge} backdrop-blur-sm shadow-sm`}>
            {isLive && <Radio className="w-3 h-3" aria-hidden="true" />}
            {status.label}
          </span>
        </div>

        {/* Tier */}
        <div className="absolute top-3 right-3">
          <span className={`badge backdrop-blur-sm shadow-sm ${
            hasAccess ? 'bg-sage-500 text-white' : 'bg-charcoal-950/60 text-charcoal-200'
          }`}>
            {hasAccess ? '✓ Unlocked' : `${TIER_LABELS[session.requiredTier] || 'Basic'}+`}
          </span>
        </div>

        {/* Lock overlay */}
        {!hasAccess && (
          <div className="locked-overlay" aria-label="Subscription required">
            <Lock className="w-8 h-8 text-white/90 drop-shadow-md" aria-hidden="true" />
          </div>
        )}
      </div>

      <div className="p-5">
        {/* Medium */}
        {session.mediumId && (
          <p className="eyebrow mb-2">
            {session.mediumId.name || session.mediumId}
          </p>
        )}

        <h3 className="font-display font-semibold text-lg text-charcoal-900 mb-3 group-hover:text-canvas-600 transition-colors line-clamp-2 leading-snug">
          {session.title}
        </h3>

        <div className="space-y-1.5 mb-4">
          <div className="flex items-center gap-2 text-sm text-charcoal-500">
            <Calendar className="w-4 h-4 text-canvas-400 shrink-0" aria-hidden="true" />
            <span>{format(new Date(session.scheduledAt), 'PPP')}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-charcoal-500">
            <Clock className="w-4 h-4 text-canvas-400 shrink-0" aria-hidden="true" />
            <span>{format(new Date(session.scheduledAt), 'p')} · {session.durationMinutes || 60} min</span>
          </div>
          {session.host && (
            <div className="flex items-center gap-2 text-sm text-charcoal-500">
              <User className="w-4 h-4 text-canvas-400 shrink-0" aria-hidden="true" />
              <span className="truncate">{session.host}</span>
            </div>
          )}
        </div>

        {/* CTA */}
        {isLive && hasAccess ? (
          <Link
            to={`/live-sessions/${session._id}`}
            className="btn-primary btn-sm w-full justify-center animate-pulse-slow"
            aria-label={`Join live session: ${session.title}`}
          >
            <Radio className="w-4 h-4" aria-hidden="true" /> Join Now
          </Link>
        ) : session.status === 'scheduled' ? (
          <button
            disabled
            aria-disabled="true"
            className="btn btn-sm w-full justify-center bg-charcoal-50 text-charcoal-400 border border-charcoal-100"
          >
            <Calendar className="w-3.5 h-3.5" aria-hidden="true" /> Scheduled
          </button>
        ) : !hasAccess ? (
          <Link
            to="/subscriptions"
            className="btn-outline btn-sm w-full justify-center"
            aria-label="Subscribe to access this session"
          >
            <Lock className="w-3.5 h-3.5" aria-hidden="true" /> Subscribe to Access
          </Link>
        ) : (
          <button disabled aria-disabled="true" className="btn btn-sm w-full justify-center bg-charcoal-50 text-charcoal-400 border border-charcoal-100">
            Session Ended
          </button>
        )}
      </div>
    </article>
  );
};

export default LiveSessionCard;
