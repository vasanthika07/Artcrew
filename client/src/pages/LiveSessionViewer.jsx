import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Radio,
  Calendar,
  Clock,
  User,
  Lock,
  ArrowLeft,
  Crown,
  Play,
  Share2,
  CheckCircle,
  AlertCircle,
  Layers,
} from 'lucide-react';
import { format } from 'date-fns';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { toast } from '../components/Toast';
import LoadingState from '../components/LoadingState';

const TIER_LABELS = { basic: 'Basic', pro: 'Pro', studio: 'Studio' };
const TIER_ORDER = { basic: 1, pro: 2, studio: 3 };

const LiveSessionViewer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, hasSubscription, subscriptionTier, isAuthenticated } = useAuth();

  const [session, setSession] = useState(null);
  const [streamUrl, setStreamUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  const videoRef = useRef(null);
  const playerRef = useRef(null);

  useEffect(() => {
    const fetchSessionAndStream = async () => {
      setLoading(true);
      setAuthError(null);

      try {
        // 1. Fetch public session info
        const { data: sessionRes } = await api.get(`/live-sessions/${id}`);
        const sessionData = sessionRes.data;
        setSession(sessionData);

        // 2. If user is authenticated, attempt to join and fetch streamUrl
        if (isAuthenticated) {
          try {
            const { data: joinRes } = await api.get(`/live-sessions/${id}/join`);
            setStreamUrl(joinRes.streamUrl);
          } catch (joinErr) {
            console.warn('[LiveSessionViewer] Join error:', joinErr.response?.data);
            setAuthError(
              joinErr.response?.data?.message ||
                `A ${TIER_LABELS[sessionData.requiredTier] || 'Basic'} subscription is required to join this live session.`
            );
          }
        } else {
          setAuthError('Please sign in with an active subscription to join this live stream.');
        }
      } catch (err) {
        console.error('[LiveSessionViewer] Fetch error:', err);
        setAuthError(err.response?.data?.message || 'Failed to load live session');
      } finally {
        setLoading(false);
      }
    };

    fetchSessionAndStream();
  }, [id, isAuthenticated, subscriptionTier]);

  // Initialize Video.js when streamUrl is available
  useEffect(() => {
    let active = true;

    const initVideo = async () => {
      if (!streamUrl || !videoRef.current) return;

      const videojs = (await import('video.js')).default;
      await import('video.js/dist/video-js.css');

      if (active && videoRef.current && !playerRef.current) {
        const isHls = streamUrl.includes('.m3u8');
        playerRef.current = videojs(videoRef.current, {
          autoplay: true,
          controls: true,
          responsive: true,
          fluid: true,
          liveui: true,
          sources: [
            {
              src: streamUrl,
              type: isHls ? 'application/x-mpegURL' : 'video/mp4',
            },
          ],
        });
      }
    };

    initVideo();

    return () => {
      active = false;
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, [streamUrl]);

  if (loading) {
    return <LoadingState fullScreen message="Connecting to live stream..." />;
  }

  if (!session) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center bg-charcoal-950 text-white">
        <AlertCircle className="w-12 h-12 text-canvas-400 mb-3" />
        <h2 className="text-xl font-bold font-display mb-2">Session Not Found</h2>
        <p className="text-charcoal-400 text-sm mb-6">The requested live session does not exist or has been removed.</p>
        <Link to="/live-sessions" className="btn-primary btn-sm">
          Browse Live Sessions
        </Link>
      </div>
    );
  }

  const isLive = session.status === 'live';
  const isEnded = session.status === 'ended';
  const isScheduled = session.status === 'scheduled';

  const userTierLevel = TIER_ORDER[subscriptionTier] || 0;
  const requiredLevel = TIER_ORDER[session.requiredTier] || 1;
  const hasAccess = user?.role === 'admin' || (hasSubscription && userTierLevel >= requiredLevel);

  return (
    <div className="min-h-screen bg-charcoal-950 text-white">
      {/* Top Bar */}
      <div className="border-b border-charcoal-800 bg-charcoal-900/60 backdrop-blur-md sticky top-0 z-30 px-4 py-3">
        <div className="container-art flex items-center justify-between gap-4">
          <Link
            to="/live-sessions"
            className="inline-flex items-center gap-2 text-xs font-semibold text-charcoal-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> All Live Sessions
          </Link>

          <div className="flex items-center gap-2">
            {isLive ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold uppercase tracking-wider">
                <Radio className="w-3.5 h-3.5 animate-pulse" />
                Live Now
              </span>
            ) : isScheduled ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-canvas-500/15 text-canvas-400 border border-canvas-500/30 text-xs font-semibold">
                <Calendar className="w-3.5 h-3.5" />
                Scheduled
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-charcoal-800 text-charcoal-400 text-xs font-semibold">
                Ended
              </span>
            )}

            <span className="text-xs px-2.5 py-1 rounded-full bg-charcoal-800 text-canvas-400 border border-charcoal-700 font-medium">
              <Crown className="w-3 h-3 inline mr-1" />
              {TIER_LABELS[session.requiredTier] || 'Basic'}+ Plan
            </span>
          </div>
        </div>
      </div>

      <div className="container-art py-8 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Stage (Video or Locked Box) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-3xl overflow-hidden border border-charcoal-800 bg-black aspect-video relative flex items-center justify-center shadow-2xl">
              {streamUrl && hasAccess ? (
                /* Active Stream Player */
                <div className="w-full h-full" data-vjs-player>
                  <video
                    ref={videoRef}
                    className="video-js vjs-big-play-centered vjs-theme-city vjs-fluid"
                    playsInline
                  />
                </div>
              ) : (
                /* Locked Stream Screen */
                <div className="relative w-full h-full flex flex-col items-center justify-center p-6 text-center">
                  {session.thumbnailUrl && (
                    <img
                      src={session.thumbnailUrl}
                      alt={session.title}
                      className="absolute inset-0 w-full h-full object-cover opacity-20 filter blur-sm scale-105"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950 via-charcoal-950/80 to-charcoal-950/40" />

                  <div className="relative max-w-md mx-auto space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-charcoal-900/90 border border-charcoal-700 flex items-center justify-center mx-auto shadow-2xl text-canvas-400">
                      <Lock className="w-8 h-8" />
                    </div>

                    <div>
                      <h3 className="font-display font-bold text-2xl text-white mb-2">
                        {isEnded
                          ? 'This Session Has Ended'
                          : !isAuthenticated
                          ? 'Sign in to Watch'
                          : 'Subscription Required'}
                      </h3>
                      <p className="text-charcoal-300 text-sm leading-relaxed">
                        {isEnded
                          ? 'This live session has concluded. The recording will be available in the recorded workshop library soon.'
                          : authError ||
                            `Unlock this live workshop with an active ${TIER_LABELS[session.requiredTier] || 'Basic'} subscription.`}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                      {!isAuthenticated ? (
                        <Link
                          to="/login"
                          state={{ from: `/live-sessions/${session._id}` }}
                          className="btn-primary btn-sm px-6"
                        >
                          Sign In
                        </Link>
                      ) : !hasAccess ? (
                        <Link to="/subscriptions" className="btn-primary btn-sm px-6">
                          <Crown className="w-4 h-4 mr-1" /> Upgrade to {TIER_LABELS[session.requiredTier] || 'Pro'}
                        </Link>
                      ) : null}

                      <Link
                        to="/live-sessions"
                        className="btn btn-sm bg-charcoal-800 hover:bg-charcoal-700 text-white border border-charcoal-700"
                      >
                        Browse Schedule
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Session Info Header */}
            <div className="space-y-4">
              {session.mediumId && (
                <span className="text-xs uppercase font-bold tracking-wider text-canvas-400">
                  {session.mediumId.name || session.mediumId}
                </span>
              )}
              <h1 className="font-display font-bold text-2xl sm:text-3xl text-white">
                {session.title}
              </h1>

              {session.description && (
                <p className="text-charcoal-300 text-sm sm:text-base leading-relaxed">
                  {session.description}
                </p>
              )}
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            {/* Host Card */}
            <div className="p-6 rounded-3xl bg-charcoal-900/80 border border-charcoal-800 space-y-4">
              <h3 className="font-display font-semibold text-lg text-white">
                Session Details
              </h3>

              <div className="space-y-3 text-sm">
                {session.host && (
                  <div className="flex items-center gap-3 py-2 border-b border-charcoal-800/60">
                    <div className="w-10 h-10 rounded-xl bg-canvas-500/20 text-canvas-400 flex items-center justify-center font-bold">
                      {session.host.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{session.host}</p>
                      <p className="text-xs text-charcoal-400">Resident Artist</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 text-charcoal-300">
                  <Calendar className="w-4 h-4 text-canvas-400 shrink-0" />
                  <span>
                    {session.scheduledAt
                      ? format(new Date(session.scheduledAt), 'EEEE, dd MMMM yyyy')
                      : 'Scheduled'}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-charcoal-300">
                  <Clock className="w-4 h-4 text-canvas-400 shrink-0" />
                  <span>
                    {session.scheduledAt ? format(new Date(session.scheduledAt), 'p') : ''} ({session.durationMinutes || 60} mins)
                  </span>
                </div>

                <div className="flex items-center gap-3 text-charcoal-300">
                  <Crown className="w-4 h-4 text-canvas-400 shrink-0" />
                  <span>Required Tier: <strong>{TIER_LABELS[session.requiredTier] || 'Basic'}+</strong></span>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="p-6 rounded-3xl bg-charcoal-900/80 border border-charcoal-800 space-y-3">
              <h3 className="font-display font-semibold text-sm text-white">
                Explore ArtCrew
              </h3>
              <div className="flex flex-col gap-2 text-xs">
                <Link
                  to="/recorded-sessions"
                  className="p-2.5 rounded-xl bg-charcoal-950/60 hover:bg-charcoal-800 text-charcoal-300 hover:text-white transition-colors flex items-center justify-between"
                >
                  <span>Browse Recorded Workshops</span>
                  <Play className="w-3.5 h-3.5 text-canvas-400" />
                </Link>
                <Link
                  to="/subscriptions"
                  className="p-2.5 rounded-xl bg-charcoal-950/60 hover:bg-charcoal-800 text-charcoal-300 hover:text-white transition-colors flex items-center justify-between"
                >
                  <span>Compare Subscription Plans</span>
                  <Crown className="w-3.5 h-3.5 text-canvas-400" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveSessionViewer;
