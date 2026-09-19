import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Play, Crown, Film, Sparkles, Filter, RefreshCw } from 'lucide-react';
import api from '../api/axios';
import RecordedSessionCard from '../components/RecordedSessionCard';
import VideoPlayerModal from '../components/VideoPlayerModal';
import ContinueWatching from '../components/ContinueWatching';
import EmptyState from '../components/EmptyState';
import { toast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';

const SkeletonCard = () => (
  <div className="bg-charcoal-900 rounded-2xl overflow-hidden border border-charcoal-800">
    <div className="skeleton-dark aspect-video" />
    <div className="p-4 space-y-3">
      <div className="skeleton-dark h-3 w-1/3 rounded" />
      <div className="skeleton-dark h-4 w-3/4 rounded" />
      <div className="skeleton-dark h-3 w-1/2 rounded" />
      <div className="skeleton-dark h-8 w-full rounded-xl mt-2" />
    </div>
  </div>
);

const RecordedSessions = () => {
  const [sessions, setSessions] = useState([]);
  const [mediums, setMediums] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [playingSession, setPlayingSession] = useState(null);
  const [playUrl, setPlayUrl] = useState(null);
  const [initialPosition, setInitialPosition] = useState(0);
  const [refreshQueueKey, setRefreshQueueKey] = useState(0);

  const { isAuthenticated, hasSubscription, user } = useAuth();
  const navigate = useNavigate();

  const loadData = () => {
    setLoading(true);
    Promise.all([api.get('/mediums'), api.get('/recordings')])
      .then(([medRes, recRes]) => {
        setMediums(medRes.data.data || []);
        setSessions(recRes.data.data || []);
      })
      .catch((err) => {
        console.error('Error fetching sessions:', err);
        setError('Failed to load workshops. Please check your connection.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handlePlay = async (session, startPosition = 0) => {
    if (!isAuthenticated) {
      toast.info('Please sign in to access workshop videos');
      navigate('/login', { state: { from: '/recorded-sessions' } });
      return;
    }

    try {
      const { data } = await api.get(`/recordings/${session._id}/play`);
      if (data.playbackUrl) {
        setPlayingSession(session);
        setPlayUrl(data.playbackUrl);
        setInitialPosition(startPosition || data.initialPositionSeconds || 0);
      } else {
        toast.error('Unable to load video stream');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Unable to play session';
      if (err.response?.data?.code === 'SUBSCRIPTION_REQUIRED' || err.response?.data?.code === 'UPGRADE_REQUIRED') {
        toast.error(msg);
        navigate('/subscriptions');
      } else {
        toast.error(msg);
      }
    }
  };

  const handleClosePlayer = () => {
    setPlayingSession(null);
    setPlayUrl(null);
    setInitialPosition(0);
    // Refresh queue and sessions list to update progress bars
    setRefreshQueueKey((k) => k + 1);
    loadData();
  };

  const featured = sessions.filter((s) => s.isFeatured);
  const filtered =
    activeFilter === 'all'
      ? sessions
      : sessions.filter(
          (s) => s.mediumId?._id === activeFilter || s.mediumId === activeFilter
        );

  return (
    <div className="min-h-screen bg-charcoal-950 text-white">
      {/* Active Video Player Modal */}
      {playingSession && playUrl && (
        <VideoPlayerModal
          session={playingSession}
          playbackUrl={playUrl}
          initialPositionSeconds={initialPosition}
          onClose={handleClosePlayer}
          onProgressUpdate={() => setRefreshQueueKey((k) => k + 1)}
        />
      )}

      {/* ── Hero Banner ── */}
      <header className="relative py-16 sm:py-20 border-b border-charcoal-800/80 overflow-hidden bg-gradient-to-b from-charcoal-900 to-charcoal-950">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-canvas-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="container-art text-center relative max-w-3xl mx-auto px-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-canvas-500/10 border border-canvas-500/20 text-canvas-400 text-xs font-semibold mb-3">
            <Film className="w-3.5 h-3.5" />
            On-Demand Masterclasses
          </div>
          <h1 className="font-display font-bold text-4xl sm:text-5xl md:text-6xl text-white mb-4 tracking-tight">
            Recorded Workshops
          </h1>
          <p className="text-charcoal-300 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
            Master traditional and modern art mediums step-by-step with high definition guided workshops.
          </p>
        </div>
      </header>

      <div className="container-art py-10 px-4">
        {/* ── Continue Watching Section (Feature 5) ── */}
        <ContinueWatching onPlay={handlePlay} refreshKey={refreshQueueKey} />

        {/* ── Featured Row ── */}
        {!loading && featured.length > 0 && activeFilter === 'all' && (
          <section className="mb-12" aria-label="Featured masterclasses">
            <h2 className="font-display font-semibold text-xl text-white mb-5 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-canvas-400" />
              Featured Workshops
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {featured.slice(0, 2).map((s) => (
                <RecordedSessionCard key={s._id} session={s} onPlay={handlePlay} />
              ))}
            </div>
          </section>
        )}

        {/* ── Filter Tabs ── */}
        <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-charcoal-800 overflow-x-auto scrollbar-hide">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer shrink-0 ${
                activeFilter === 'all'
                  ? 'bg-canvas-500 text-charcoal-950 shadow-md shadow-canvas-500/20'
                  : 'bg-charcoal-900 text-charcoal-400 hover:text-white border border-charcoal-800'
              }`}
            >
              All Workshops ({sessions.length})
            </button>
            {mediums.map((m) => (
              <button
                key={m._id}
                onClick={() => setActiveFilter(m._id)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer shrink-0 ${
                  activeFilter === m._id
                    ? 'bg-canvas-500 text-charcoal-950 shadow-md shadow-canvas-500/20'
                    : 'bg-charcoal-900 text-charcoal-400 hover:text-white border border-charcoal-800'
                }`}
              >
                {m.name}
              </button>
            ))}
          </div>

          <button
            onClick={loadData}
            title="Refresh list"
            className="p-2 rounded-xl text-charcoal-400 hover:text-white hover:bg-charcoal-800 transition-colors shrink-0"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* ── Content Grid ── */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="py-16 text-center space-y-4">
            <p className="text-charcoal-400 text-sm">{error}</p>
            <button
              onClick={loadData}
              className="btn-primary btn-sm inline-flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Try Again
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            dark
            title="No workshops found"
            description="Check back soon for new recordings from our resident artists."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((s, i) => (
              <div key={s._id} className="animate-fade-up flex flex-col" style={{ animationDelay: `${i * 40}ms` }}>
                <RecordedSessionCard session={s} onPlay={handlePlay} />
              </div>
            ))}
          </div>
        )}

        {/* ── Subscription Upsell for Non-Subscribers ── */}
        {!loading && !hasSubscription && (
          <div className="mt-16 rounded-3xl bg-gradient-to-r from-canvas-600 via-amber-600 to-terracotta-600 p-8 md:p-12 text-center relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative max-w-xl mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
                <Crown className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-display font-bold text-2xl md:text-3xl text-white mb-3">
                Unlock the Entire Art Library
              </h3>
              <p className="text-white/90 text-sm md:text-base mb-6 leading-relaxed">
                Subscribe to ArtCrew to watch unlimited workshops across all mediums, join interactive live sessions, and track your progress across devices.
              </p>
              <Link
                to="/subscriptions"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-charcoal-950 font-bold text-sm hover:bg-canvas-50 shadow-xl hover:-translate-y-0.5 transition-all cursor-pointer"
              >
                <Play className="w-4 h-4 fill-currentColor text-canvas-600" />
                View Subscription Plans — from ₹299/mo
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecordedSessions;
