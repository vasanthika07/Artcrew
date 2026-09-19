import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, CircleDollarSign, BookOpen, Package, Users, Play, MapPin } from 'lucide-react';
import api from '../api/axios';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import RecordedSessionCard from '../components/RecordedSessionCard';
import LiveSessionCard from '../components/LiveSessionCard';

const RESOURCE_ICONS = {
  guide: <BookOpen className="w-4 h-4" />,
  video: <Play className="w-4 h-4" />,
  course: <BookOpen className="w-4 h-4" />,
  community: <Users className="w-4 h-4" />,
  'supply-list': <Package className="w-4 h-4" />,
};

const MediumDetail = () => {
  const { id } = useParams();
  const [medium, setMedium] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get(`/mediums/${id}`)
      .then(r => setMedium(r.data.data))
      .catch(() => setError('Medium not found'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingState fullScreen />;
  if (error || !medium) return <ErrorState message={error || 'Medium not found'} />;

  return (
    <div className="min-h-screen bg-cream">
      {/* Hero */}
      <div className="relative h-[50vh] min-h-[320px] overflow-hidden">
        <img
          src={medium.coverImage || 'https://images.unsplash.com/photo-1579762593217-7b5d5d8e0a89?w=1400'}
          alt={medium.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950 via-charcoal-950/40 to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-end p-8 container-art">
          <Link to="/mediums" className="inline-flex items-center gap-2 text-charcoal-300 hover:text-white mb-4 text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" /> All Mediums
          </Link>
          <div className="flex items-end gap-4 flex-wrap">
            <div>
              <span className={`badge mb-2 ${
                medium.difficulty === 'Beginner' ? 'badge-success' :
                medium.difficulty === 'Intermediate' ? 'badge-warning' : 'badge-danger'
              }`}>
                {medium.difficulty}
              </span>
              <h1 className="font-display font-bold text-5xl text-white">{medium.name}</h1>
            </div>
            {medium.estimatedBudget && (
              <div className="glass px-4 py-2 mb-1">
                <div className="flex items-center gap-2 text-canvas-300 text-sm">
                  <CircleDollarSign className="w-4 h-4" />
                  <span>Starting at <strong>{medium.estimatedBudget}</strong></span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container-art py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <div className="card p-6">
              <h2 className="font-display font-semibold text-xl text-charcoal-900 mb-3">About this Medium</h2>
              <p className="text-charcoal-600 leading-relaxed">{medium.description}</p>
            </div>

            {/* Beginner guide */}
            {medium.beginnerGuide && (
              <div className="card p-6 border-l-4 border-l-canvas-400">
                <h2 className="font-display font-semibold text-xl text-charcoal-900 mb-3 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-canvas-500" /> Beginner's Guide
                </h2>
                <p className="text-charcoal-600 leading-relaxed">{medium.beginnerGuide}</p>
              </div>
            )}

            {/* Recorded sessions */}
            {medium.recordings?.length > 0 && (
              <div>
                <h2 className="font-display font-semibold text-xl text-charcoal-900 mb-4">Related Workshops</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {medium.recordings.map(r => <RecordedSessionCard key={r._id} session={r} />)}
                </div>
              </div>
            )}

            {/* Live sessions */}
            {medium.liveSessions?.length > 0 && (
              <div>
                <h2 className="font-display font-semibold text-xl text-charcoal-900 mb-4">Live Sessions</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {medium.liveSessions.map(s => <LiveSessionCard key={s._id} session={s} />)}
                </div>
              </div>
            )}

            {/* Resources */}
            {medium.resources?.length > 0 && (
              <div>
                <h2 className="font-display font-semibold text-xl text-charcoal-900 mb-4">Learning Resources</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {medium.resources.map(r => (
                    <a
                      key={r._id}
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="card p-4 hover:shadow-card-hover hover:-translate-y-0.5 transition-all group block"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-canvas-50 flex items-center justify-center text-canvas-500 shrink-0">
                          {RESOURCE_ICONS[r.resourceType] || <BookOpen className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-charcoal-800 text-sm group-hover:text-canvas-600 transition-colors line-clamp-1">
                            {r.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="badge badge-muted">{r.provider}</span>
                            {r.isFree ? <span className="badge badge-success">Free</span> : <span className="badge badge-warning">Paid</span>}
                          </div>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Supplies */}
            {medium.supplies?.length > 0 && (
              <div className="card p-5">
                <h3 className="font-display font-semibold text-charcoal-900 mb-3 flex items-center gap-2">
                  <Package className="w-4.5 h-4.5 text-canvas-500" /> Required Supplies
                </h3>
                <ul className="space-y-2">
                  {medium.supplies.map((s, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-charcoal-600">
                      <div className="w-1.5 h-1.5 rounded-full bg-canvas-400 shrink-0" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Quick stats */}
            <div className="card p-5 bg-canvas-50 border-canvas-100">
              <h3 className="font-display font-semibold text-charcoal-900 mb-3">At a Glance</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-charcoal-500">Difficulty</span>
                  <span className="font-medium text-charcoal-800">{medium.difficulty}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-charcoal-500">Starting Budget</span>
                  <span className="font-medium text-charcoal-800">{medium.estimatedBudget || 'Varies'}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-charcoal-500">Resources</span>
                  <span className="font-medium text-charcoal-800">{medium.resources?.length || 0} available</span>
                </div>
              </div>
            </div>

            {/* Find nearby studios */}
            <Link to={`/studios?medium=${medium.name}`}
              className="btn-primary w-full justify-center">
              <MapPin className="w-4 h-4" /> Find Nearby Studios
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MediumDetail;
