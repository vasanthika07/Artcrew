import { useEffect, useState } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import api from '../api/axios';
import MediumCard from '../components/MediumCard';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';

const DIFFICULTY_FILTERS = ['All', 'Beginner', 'Intermediate', 'Advanced'];

const Mediums = () => {
  const [mediums, setMediums] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/mediums')
      .then(r => {
        setMediums(r.data.data || []);
        setFiltered(r.data.data || []);
      })
      .catch(() => setError('Failed to load mediums'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let result = mediums;
    if (search) {
      result = result.filter(m =>
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.description.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (difficulty !== 'All') {
      result = result.filter(m => m.difficulty === difficulty);
    }
    setFiltered(result);
  }, [search, difficulty, mediums]);

  return (
    <div className="min-h-screen bg-cream">
      {/* Hero */}
      <div className="bg-gradient-to-br from-charcoal-950 via-charcoal-900 to-charcoal-800 py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-hero-pattern opacity-20" />
        <div className="container-art relative">
          <p className="text-canvas-400 text-sm font-medium uppercase tracking-widest mb-3">Explore</p>
          <h1 className="font-display font-bold text-5xl md:text-6xl text-white mb-4">Art Mediums</h1>
          <p className="text-charcoal-300 text-xl max-w-xl mb-8">
            Discover the perfect art form — from oil paints to pottery wheels. Each medium is a doorway to a new creative world.
          </p>

          {/* Search bar */}
          <div className="relative max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal-400" />
            <input
              type="text"
              placeholder="Search mediums..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-charcoal-800/80 border border-charcoal-700 text-white placeholder:text-charcoal-500 focus:outline-none focus:ring-2 focus:ring-canvas-500 focus:border-canvas-500 transition-all text-sm backdrop-blur-sm"
            />
          </div>
        </div>
      </div>

      <div className="container-art py-12">
        {/* Difficulty filters */}
        <div className="flex flex-wrap items-center gap-2 mb-8">
          <span className="flex items-center gap-1.5 text-sm text-charcoal-500 mr-2">
            <SlidersHorizontal className="w-4 h-4" /> Difficulty:
          </span>
          {DIFFICULTY_FILTERS.map(d => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                difficulty === d
                  ? 'bg-canvas-500 text-white shadow-art'
                  : 'bg-white border border-charcoal-200 text-charcoal-600 hover:border-canvas-300 hover:text-canvas-600'
              }`}
            >
              {d}
            </button>
          ))}
          {(search || difficulty !== 'All') && (
            <span className="text-xs text-charcoal-400 ml-2">
              {filtered.length} result{filtered.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card">
                <div className="skeleton aspect-video" />
                <div className="p-5 space-y-3">
                  <div className="skeleton h-5 w-3/4 rounded" />
                  <div className="skeleton h-4 w-full rounded" />
                  <div className="skeleton h-4 w-2/3 rounded" />
                  <div className="skeleton h-9 w-full rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <ErrorState message={error} />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No mediums found"
            description="Try a different search or filter."
            action={<button onClick={() => { setSearch(''); setDifficulty('All'); }} className="btn-outline btn-sm">Clear filters</button>}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(m => <MediumCard key={m._id} medium={m} />)}
          </div>
        )}
      </div>
    </div>
  );
};

export default Mediums;
