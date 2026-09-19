import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { X, Play, Lock, Crown, Film } from 'lucide-react';
import api from '../api/axios';
import RecordedSessionCard from '../components/RecordedSessionCard';
import EmptyState from '../components/EmptyState';
import { toast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';

/* ── Inline Video Player ── */
const VideoPlayer = ({ url, title, onClose }) => {
  const videoRef  = useRef(null);
  const playerRef = useRef(null);

  useEffect(() => {
    const initPlayer = async () => {
      const videojs = (await import('video.js')).default;
      await import('video.js/dist/video-js.css');
      if (videoRef.current && !playerRef.current) {
        playerRef.current = videojs(videoRef.current, {
          autoplay: true,
          controls: true,
          responsive: true,
          fluid: true,
          sources: [{ src: url, type: url.includes('.m3u8') ? 'application/x-mpegURL' : 'video/mp4' }],
        });
      }
    };
    initPlayer();
    return () => {
      if (playerRef.current) { playerRef.current.dispose(); playerRef.current = null; }
    };
  }, [url]);

  return (
    <div className="fixed inset-0 bg-charcoal-950/98 backdrop-blur-sm z-50 flex flex-col animate-fade-in" role="dialog" aria-modal="true" aria-label={`Playing: ${title}`}>
      <div className="flex items-center justify-between px-5 py-4 border-b border-charcoal-800/60">
        <div className="flex items-center gap-3">
          <Film className="w-4 h-4 text-canvas-400" aria-hidden="true" />
          <h2 className="font-display font-semibold text-white text-base truncate max-w-[60vw]">{title}</h2>
        </div>
        <button
          onClick={onClose}
          aria-label="Close video player"
          className="p-2 rounded-xl hover:bg-charcoal-800 text-charcoal-400 hover:text-white transition-all shrink-0"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-4xl">
          <div data-vjs-player>
            <video ref={videoRef} className="video-js vjs-big-play-centered vjs-theme-city" />
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Skeleton card ── */
const SkeletonCard = () => (
  <div className="bg-charcoal-900 rounded-xl overflow-hidden border border-charcoal-800/60">
    <div className="skeleton-dark aspect-video" />
    <div className="p-4 space-y-2">
      <div className="skeleton-dark h-3 w-1/3 rounded" />
      <div className="skeleton-dark h-4 w-3/4 rounded" />
      <div className="skeleton-dark h-3 w-1/2 rounded" />
      <div className="skeleton-dark h-8 w-full rounded-lg mt-2" />
    </div>
  </div>
);

const RecordedSessions = () => {
  const [sessions,       setSessions]       = useState([]);
  const [mediums,        setMediums]        = useState([]);
  const [activeFilter,   setActiveFilter]   = useState('all');
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState(null);
  const [playingSession, setPlayingSession] = useState(null);
  const [playUrl,        setPlayUrl]        = useState(null);
  const { isAuthenticated, hasSubscription } = useAuth();

  useEffect(() => {
    Promise.all([api.get('/mediums'), api.get('/recordings')])
      .then(([medRes, recRes]) => {
        setMediums(medRes.data.data || []);
        setSessions(recRes.data.data || []);
      })
      .catch(() => setError('Failed to load sessions'))
      .finally(() => setLoading(false));
  }, []);

  const handlePlay = async (session) => {
    if (!isAuthenticated) { toast.info('Please sign in to watch this session'); return; }
    try {
      const { data } = await api.get(`/recordings/${session._id}/play`);
      setPlayingSession(session);
      setPlayUrl(data.playbackUrl);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to play session');
    }
  };

  const featured  = sessions.filter(s => s.isFeatured);
  const filtered  = activeFilter === 'all'
    ? sessions
    : sessions.filter(s => s.mediumId?._id === activeFilter || s.mediumId === activeFilter);

  return (
    <div className="min-h-screen bg-charcoal-950">
      {/* Player */}
      {playingSession && playUrl && (
        <VideoPlayer
          url={playUrl}
          title={playingSession.title}
          onClose={() => { setPlayingSession(null); setPlayUrl(null); }}
        />
      )}

      {/* ── Hero ── */}
      <header className="relative py-20 border-b border-charcoal-800/60 overflow-hidden">
        <div className="absolute inset-0" aria-hidden="true">
          <div className="absolute inset-0 bg-gradient-to-br from-charcoal-950 via-charcoal-900 to-charcoal-950" />
          <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-canvas-500/8 blur-3xl animate-float-slow" />
          <div className="absolute bottom-0 left-1/4 w-64 h-64 rounded-full bg-terracotta-500/6 blur-3xl" />
        </div>
        <div className="relative container-art text-center">
          <p className="eyebrow-light animate-fade-in">Workshop Library</p>
          <h1 className="font-display font-bold text-5xl md:text-6xl text-white mb-4 animate-fade-up">
            Recorded Sessions
          </h1>
          <p className="text-charcoal-400 text-lg md:text-xl max-w-xl mx-auto animate-fade-up delay-100">
            Premium art workshops — watch at your own pace, on any device.
          </p>
        </div>
      </header>

      <div className="container-art py-10">

        {/* ── Featured row ── */}
        {!loading && featured.length > 0 && (
          <section className="mb-12" aria-label="Featured workshops">
            <h2 className="font-display font-semibold text-xl text-white mb-5 flex items-center gap-2">
              <span className="w-1.5 h-5 rounded-full bg-canvas-500 inline-block" aria-hidden="true" />
              Featured
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {featured.slice(0, 2).map(s => (
                <RecordedSessionCard key={s._id} session={s} onPlay={handlePlay} />
              ))}
            </div>
          </section>
        )}

        {/* ── Filter tabs ── */}
        <div
          className="flex gap-2 mb-7 pb-6 border-b border-charcoal-800 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0"
          role="group"
          aria-label="Filter by art medium"
        >
          <button
            onClick={() => setActiveFilter('all')}
            aria-pressed={activeFilter === 'all'}
            className={activeFilter === 'all' ? 'tab-pill-dark-active shrink-0' : 'tab-pill-dark-inactive shrink-0'}
          >
            All Workshops
          </button>
          {mediums.map(m => (
            <button
              key={m._id}
              onClick={() => setActiveFilter(m._id)}
              aria-pressed={activeFilter === m._id}
              className={activeFilter === m._id ? 'tab-pill-dark-active shrink-0' : 'tab-pill-dark-inactive shrink-0'}
            >
              {m.name}
            </button>
          ))}
        </div>

        {/* ── Content ── */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : error ? (
          <div className="py-16 text-center">
            <p className="text-charcoal-400 mb-4">{error}</p>
            <button onClick={() => window.location.reload()} className="btn border border-charcoal-700 text-charcoal-300 hover:border-canvas-500 hover:text-canvas-300">Try Again</button>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState dark title="No workshops yet" description="Check back soon for new recordings from our expert artists." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((s, i) => (
              <div key={s._id} className="animate-fade-up" style={{ animationDelay: `${Math.min(i, 7) * 50}ms` }}>
                <RecordedSessionCard session={s} onPlay={handlePlay} />
              </div>
            ))}
          </div>
        )}

        {/* ── Subscription upsell (show only if not subscribed) ── */}
        {!loading && !hasSubscription && (
          <div className="mt-14 rounded-3xl bg-gradient-to-r from-canvas-600 to-terracotta-600 p-8 md:p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-hero-pattern opacity-15" aria-hidden="true" />
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center mx-auto mb-4">
                <Crown className="w-7 h-7 text-white" aria-hidden="true" />
              </div>
              <h3 className="font-display font-bold text-2xl md:text-3xl text-white mb-3">
                Unlock the Full Library
              </h3>
              <p className="text-canvas-100 mb-7 max-w-md mx-auto leading-relaxed">
                Subscribe to access all workshops, join live sessions, and learn from expert artists across every medium.
              </p>
              <Link
                to="/subscriptions"
                className="btn bg-white text-canvas-700 hover:bg-canvas-50 font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
                aria-label="View subscription plans"
              >
                <Play className="w-4 h-4" fill="currentColor" aria-hidden="true" />
                View Plans — from ₹299/mo
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecordedSessions;
