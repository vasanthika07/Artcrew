import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  User,
  CreditCard,
  Monitor,
  LogOut,
  Clock,
  Shield,
  Crown,
  Play,
  Film,
  Sparkles,
  CheckCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { toast } from '../components/Toast';
import LoadingState from '../components/LoadingState';
import VideoPlayerModal from '../components/VideoPlayerModal';

const formatDuration = (seconds) => {
  if (!seconds) return '0 min';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

const Account = () => {
  const { user, logout, refreshUser } = useAuth();
  const [devices, setDevices] = useState([]);
  const [loadingDevices, setLoadingDevices] = useState(true);
  const [revokingDevice, setRevokingDevice] = useState(null);

  // Continue Watching state
  const [continueWatchingItems, setContinueWatchingItems] = useState([]);
  const [loadingProgress, setLoadingProgress] = useState(true);
  const [playingSession, setPlayingSession] = useState(null);
  const [playUrl, setPlayUrl] = useState(null);
  const [initialPosition, setInitialPosition] = useState(0);

  const loadContinueWatching = async () => {
    try {
      const { data } = await api.get('/recordings/continue-watching');
      setContinueWatchingItems(data.data || []);
    } catch (err) {
      console.warn('[Account] Error fetching continue watching:', err.message);
    } finally {
      setLoadingProgress(false);
    }
  };

  useEffect(() => {
    refreshUser();
    loadContinueWatching();

    api
      .get('/auth/devices')
      .then((r) => setDevices(r.data.devices || []))
      .catch(console.error)
      .finally(() => setLoadingDevices(false));
  }, []);

  const handlePlayFromProgress = async (session, position = 0) => {
    try {
      const { data } = await api.get(`/recordings/${session._id}/play`);
      if (data.playbackUrl) {
        setPlayingSession(session);
        setPlayUrl(data.playbackUrl);
        setInitialPosition(position || 0);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to play recording');
    }
  };

  const handleClosePlayer = () => {
    setPlayingSession(null);
    setPlayUrl(null);
    setInitialPosition(0);
    loadContinueWatching();
  };

  const handleRevokeDevice = async (deviceId, isCurrent) => {
    setRevokingDevice(deviceId);
    try {
      await api.delete(`/auth/devices/${deviceId}`);
      toast.success(isCurrent ? 'Logged out from this device' : 'Device removed');
      if (isCurrent) {
        await logout();
      } else {
        setDevices((d) => d.filter((x) => x.deviceId !== deviceId));
      }
    } catch (err) {
      toast.error('Failed to revoke device');
    } finally {
      setRevokingDevice(null);
    }
  };

  if (!user) return <LoadingState fullScreen />;

  const TIER_LABELS = { basic: 'Basic Plan', pro: 'Pro Plan', studio: 'Studio Access' };
  const TIER_COLORS = {
    basic: 'badge-muted',
    pro: 'badge-primary',
    studio: 'badge-warning',
  };

  return (
    <div className="min-h-screen bg-cream">
      {/* Video Player Modal */}
      {playingSession && playUrl && (
        <VideoPlayerModal
          session={playingSession}
          playbackUrl={playUrl}
          initialPositionSeconds={initialPosition}
          onClose={handleClosePlayer}
          onProgressUpdate={() => loadContinueWatching()}
        />
      )}

      {/* Header */}
      <div className="bg-gradient-to-br from-charcoal-950 via-charcoal-900 to-charcoal-950 py-14">
        <div className="container-art">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-canvas-400 to-terracotta-400 flex items-center justify-center text-white text-2xl font-display font-bold shadow-art-lg">
              {user.name?.charAt(0)}
            </div>
            <div>
              <h1 className="font-display font-bold text-3xl text-white">{user.name}</h1>
              <p className="text-charcoal-400 text-sm">{user.email}</p>
              <div className="flex items-center gap-2 mt-2">
                {user.role === 'admin' && (
                  <span className="badge badge-warning">
                    <Shield className="w-3 h-3" /> Admin
                  </span>
                )}
                {user.subscriptionTier && (
                  <span className={`badge ${TIER_COLORS[user.subscriptionTier] || 'badge-primary'}`}>
                    <Crown className="w-3 h-3" /> {TIER_LABELS[user.subscriptionTier]}
                  </span>
                )}
                <span
                  className={`badge ${
                    user.subscriptionStatus === 'active' ? 'badge-success' : 'badge-muted'
                  }`}
                >
                  {user.subscriptionStatus === 'active' ? 'Active Subscription' : 'Free Plan'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container-art py-10">
        {/* ── Feature 5: Continue Watching in User Account / Dashboard ── */}
        {continueWatchingItems.length > 0 && (
          <div className="card p-6 mb-8 border-l-4 border-l-canvas-500 shadow-md">
            <div className="flex items-center justify-between gap-4 mb-4">
              <h2 className="font-display font-bold text-xl text-charcoal-900 flex items-center gap-2">
                <Film className="w-5 h-5 text-canvas-500" />
                Continue Watching
              </h2>
              <Link
                to="/recorded-sessions"
                className="text-xs font-semibold text-canvas-600 hover:text-canvas-700"
              >
                View all workshops →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {continueWatchingItems.map((item) => {
                const rec = item.recording;
                if (!rec) return null;

                const thumb =
                  rec.thumbnailUrl ||
                  (rec.muxPlaybackId
                    ? `https://image.mux.com/${rec.muxPlaybackId}/thumbnail.jpg?width=640&height=360&fit_mode=smartcrop&time=5`
                    : 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=640&q=80');

                return (
                  <div
                    key={item._id}
                    className="p-3 rounded-2xl bg-charcoal-50 border border-charcoal-100 flex items-center gap-3.5 hover:shadow-md transition-all group"
                  >
                    <div className="relative w-24 h-16 rounded-xl overflow-hidden bg-charcoal-900 shrink-0">
                      <img
                        src={thumb}
                        alt={rec.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <button
                        type="button"
                        onClick={() => handlePlayFromProgress(rec, item.progressSeconds)}
                        className="absolute inset-0 bg-charcoal-950/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white"
                      >
                        <Play className="w-5 h-5 fill-white" />
                      </button>
                      {/* Mini progress bar */}
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-charcoal-800">
                        <div
                          className="h-full bg-canvas-500"
                          style={{ width: `${item.progressPercentage}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] uppercase tracking-wider font-semibold text-canvas-600 truncate">
                        {rec.mediumId?.name || 'Workshop'}
                      </p>
                      <h4 className="font-medium text-charcoal-900 text-xs sm:text-sm line-clamp-1 group-hover:text-canvas-600 transition-colors">
                        {rec.title}
                      </h4>
                      <p className="text-[11px] text-charcoal-400 mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {item.progressPercentage}% ({formatDuration(item.progressSeconds)})
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handlePlayFromProgress(rec, item.progressSeconds)}
                      className="btn-primary btn-sm px-3 py-1 text-xs shrink-0 cursor-pointer"
                    >
                      Resume
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile & Subscription info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Account Info Card */}
            <div className="card p-5">
              <h2 className="font-display font-semibold text-charcoal-900 mb-4 flex items-center gap-2">
                <User className="w-4.5 h-4.5 text-canvas-500" /> Account Info
              </h2>
              <div className="space-y-3">
                {[
                  { label: 'Name', value: user.name },
                  { label: 'Email', value: user.email },
                  {
                    label: 'Role',
                    value: user.role === 'admin' ? 'Administrator' : 'Member',
                  },
                  {
                    label: 'Member since',
                    value: user.createdAt
                      ? format(new Date(user.createdAt), 'MMMM yyyy')
                      : 'N/A',
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex justify-between items-center py-2 border-b border-charcoal-50 last:border-0"
                  >
                    <span className="text-sm text-charcoal-500">{item.label}</span>
                    <span className="text-sm font-medium text-charcoal-800">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Subscription Card */}
            <div className="card p-5">
              <h2 className="font-display font-semibold text-charcoal-900 mb-4 flex items-center gap-2">
                <CreditCard className="w-4.5 h-4.5 text-canvas-500" /> Subscription Plan
              </h2>
              {user.subscriptionStatus === 'active' ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-charcoal-500">Plan Tier</span>
                    <span className={`badge ${TIER_COLORS[user.subscriptionTier] || 'badge-primary'}`}>
                      {TIER_LABELS[user.subscriptionTier] || 'Active Plan'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-charcoal-500">Status</span>
                    <span className="badge badge-success">✓ Active</span>
                  </div>
                  {user.subscriptionExpiresAt && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-charcoal-500">Renews</span>
                      <span className="text-sm font-medium text-charcoal-700">
                        {format(new Date(user.subscriptionExpiresAt), 'dd MMM yyyy')}
                      </span>
                    </div>
                  )}
                  <div className="pt-2">
                    <Link
                      to="/subscriptions"
                      className="btn-outline btn-sm w-full justify-center"
                    >
                      Change Plan
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 space-y-3">
                  <p className="text-charcoal-500 text-sm">
                    You are currently on the free preview tier.
                  </p>
                  <Link to="/subscriptions" className="btn-primary btn-sm w-full justify-center">
                    <Crown className="w-4 h-4 mr-1" /> Upgrade to Pro
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Devices & Billing */}
          <div className="lg:col-span-2 space-y-6">
            {/* Active Devices Card */}
            <div className="card p-5">
              <h2 className="font-display font-semibold text-charcoal-900 mb-4 flex items-center gap-2">
                <Monitor className="w-4.5 h-4.5 text-canvas-500" /> Active Devices
              </h2>
              {loadingDevices ? (
                <div className="space-y-3">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="skeleton h-16 rounded-xl" />
                  ))}
                </div>
              ) : devices.length === 0 ? (
                <p className="text-charcoal-400 text-sm text-center py-4">No devices recorded</p>
              ) : (
                <div className="space-y-3">
                  {devices.map((device) => (
                    <div
                      key={device.deviceId}
                      className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${
                        device.isCurrent
                          ? 'border-canvas-200 bg-canvas-50/50'
                          : 'border-charcoal-100 bg-charcoal-50/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                            device.isCurrent ? 'bg-canvas-100' : 'bg-charcoal-100'
                          }`}
                        >
                          <Monitor
                            className={`w-5 h-5 ${
                              device.isCurrent ? 'text-canvas-500' : 'text-charcoal-400'
                            }`}
                          />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-charcoal-800 flex items-center gap-2">
                            {device.userAgent?.slice(0, 50) || 'Unknown device'}
                            {device.isCurrent && (
                              <span className="badge badge-success text-[10px]">
                                Current Session
                              </span>
                            )}
                          </p>
                          {device.lastActive && (
                            <p className="text-xs text-charcoal-400 flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3" />
                              Last active {format(new Date(device.lastActive), 'dd MMM yyyy, p')}
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRevokeDevice(device.deviceId, device.isCurrent)}
                        disabled={revokingDevice === device.deviceId}
                        className="btn-danger btn-sm shrink-0 ml-3 cursor-pointer"
                      >
                        {revokingDevice === device.deviceId ? (
                          <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        ) : (
                          <LogOut className="w-3.5 h-3.5" />
                        )}
                        {device.isCurrent ? 'Sign Out' : 'Revoke'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Billing History Card */}
            {user.billingHistory?.length > 0 && (
              <div className="card p-5">
                <h2 className="font-display font-semibold text-charcoal-900 mb-4 flex items-center gap-2">
                  <CreditCard className="w-4.5 h-4.5 text-canvas-500" /> Billing History
                </h2>
                <div className="overflow-x-auto">
                  <table className="table-art w-full">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Plan</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Payment Reference</th>
                      </tr>
                    </thead>
                    <tbody>
                      {user.billingHistory.map((bill, i) => (
                        <tr key={i}>
                          <td className="text-charcoal-600">
                            {format(new Date(bill.date || Date.now()), 'dd MMM yyyy')}
                          </td>
                          <td className="text-charcoal-700 font-medium">{bill.plan}</td>
                          <td className="text-charcoal-700 font-semibold">
                            ₹{bill.amount?.toLocaleString('en-IN')}
                          </td>
                          <td>
                            <span className="badge badge-success capitalize">
                              {bill.status || 'paid'}
                            </span>
                          </td>
                          <td className="text-xs font-mono text-charcoal-400">
                            {bill.paymentId || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Account;
