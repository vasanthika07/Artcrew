import { useEffect, useState } from 'react';
import api from '../api/axios';
import LiveSessionCard from '../components/LiveSessionCard';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';

const STATUS_TABS = [
  { label: 'All', value: '' },
  { label: '🔴 Live Now', value: 'live' },
  { label: 'Upcoming', value: 'scheduled' },
  { label: 'Past', value: 'ended' },
];

const LiveSessions = () => {
  const [sessions, setSessions] = useState([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    const params = status ? `?status=${status}` : '';
    api.get(`/live-sessions${params}`)
      .then(r => setSessions(r.data.data || []))
      .catch(() => setError('Failed to load sessions'))
      .finally(() => setLoading(false));
  }, [status]);

  const liveNow = sessions.filter(s => s.status === 'live');

  return (
    <div className="min-h-screen bg-cream">
      {/* Hero */}
      <div className="bg-gradient-to-br from-charcoal-950 to-charcoal-900 py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-hero-pattern opacity-20" />
        <div className="container-art relative text-center">
          {liveNow.length > 0 && (
            <div className="inline-flex items-center gap-2 bg-red-500/20 border border-red-500/30 text-red-400 px-4 py-2 rounded-full text-sm font-medium mb-4">
              <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
              {liveNow.length} session{liveNow.length > 1 ? 's' : ''} live right now
            </div>
          )}
          <h1 className="font-display font-bold text-5xl md:text-6xl text-white mb-4">Live Sessions</h1>
          <p className="text-charcoal-300 text-xl max-w-lg mx-auto">
            Join live art workshops with expert artists. Watch, learn, and ask questions in real-time.
          </p>
        </div>
      </div>

      <div className="container-art py-12">
        {/* Status tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {STATUS_TABS.map(tab => (
            <button
              key={tab.value}
              onClick={() => setStatus(tab.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                status === tab.value
                  ? 'bg-canvas-500 text-white shadow-art'
                  : 'bg-white border border-charcoal-200 text-charcoal-600 hover:border-canvas-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card">
                <div className="skeleton aspect-video" />
                <div className="p-5 space-y-3">
                  <div className="skeleton h-5 w-3/4 rounded" />
                  <div className="skeleton h-4 w-full rounded" />
                  <div className="skeleton h-9 w-full rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <ErrorState message={error} />
        ) : sessions.length === 0 ? (
          <EmptyState title="No sessions found" description="Check back later for upcoming live sessions." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessions.map(s => <LiveSessionCard key={s._id} session={s} />)}
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveSessions;
