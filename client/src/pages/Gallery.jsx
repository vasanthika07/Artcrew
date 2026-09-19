import { useEffect, useState, useCallback } from 'react';
import api from '../api/axios';
import GalleryCard from '../components/GalleryCard';
import EmptyState from '../components/EmptyState';

const LIMIT = 16;

const SkeletonItem = ({ tall }) => (
  <div className={`break-inside-avoid mb-4 rounded-2xl overflow-hidden ${tall ? 'aspect-[3/4]' : 'aspect-square'}`}>
    <div className="skeleton-dark w-full h-full" />
  </div>
);

const Gallery = () => {
  const [items,        setItems]        = useState([]);
  const [mediums,      setMediums]      = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [loading,      setLoading]      = useState(true);
  const [loadingMore,  setLoadingMore]  = useState(false);
  const [error,        setError]        = useState(null);
  const [page,         setPage]         = useState(1);
  const [hasMore,      setHasMore]      = useState(true);
  const [total,        setTotal]        = useState(0);

  useEffect(() => {
    api.get('/mediums').then(r => setMediums(r.data.data || [])).catch(console.error);
  }, []);

  const fetchItems = useCallback(async (filter, pg, replace = false) => {
    if (replace) setLoading(true); else setLoadingMore(true);
    setError(null);
    const params = new URLSearchParams({ limit: LIMIT, page: pg });
    if (filter !== 'all') params.set('medium', filter);

    try {
      const r = await api.get(`/gallery?${params}`);
      const newItems = r.data.data || [];
      const tot = r.data.pagination?.total || 0;
      setTotal(tot);
      setItems(prev => replace ? newItems : [...prev, ...newItems]);
      setHasMore(pg * LIMIT < tot);
    } catch {
      setError('Failed to load gallery. Please try again.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    setPage(1);
    setItems([]);
    fetchItems(activeFilter, 1, true);
  }, [activeFilter, fetchItems]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchItems(activeFilter, nextPage, false);
  };

  const filterTabs = [{ slug: 'all', name: 'All Works' }, ...mediums];

  return (
    <div className="min-h-screen bg-charcoal-950">

      {/* ── Hero ── */}
      <header className="relative py-24 overflow-hidden">
        <div className="absolute inset-0" aria-hidden="true">
          <img
            src="https://images.unsplash.com/photo-1579762593217-7b5d5d8e0a89?w=1400&q=80"
            alt=""
            className="w-full h-full object-cover opacity-10"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-charcoal-950/80 via-charcoal-950/60 to-charcoal-950" />
        </div>

        {/* Decorative paint blob */}
        <div className="absolute top-8 right-1/4 w-64 h-64 rounded-full bg-canvas-500/8 blur-3xl animate-float-slow pointer-events-none" aria-hidden="true" />

        <div className="relative container-art text-center">
          <p className="eyebrow-light text-[11px]">Community Art</p>
          <h1 className="font-display font-bold text-5xl md:text-6xl lg:text-7xl text-white mb-4 text-shadow-hero animate-fade-up">
            Gallery
          </h1>
          <p className="text-charcoal-400 text-lg md:text-xl max-w-lg mx-auto animate-fade-up delay-100">
            Original artwork by our community — from oil paintings to pottery.
          </p>
        </div>
      </header>

      <div className="container-art pb-24">

        {/* ── Filter tabs ── */}
        <div className="flex items-center gap-2 mb-8 pb-6 border-b border-charcoal-800 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
          {filterTabs.map(tab => (
            <button
              key={tab.slug}
              onClick={() => setActiveFilter(tab.slug)}
              aria-pressed={activeFilter === tab.slug}
              className={activeFilter === tab.slug
                ? 'tab-pill-dark-active shrink-0'
                : 'tab-pill-dark-inactive shrink-0'
              }
            >
              {tab.name}
            </button>
          ))}
          {total > 0 && (
            <span className="ml-auto text-charcoal-600 text-xs shrink-0 pl-4">
              {total.toLocaleString()} works
            </span>
          )}
        </div>

        {/* ── Grid ── */}
        {loading ? (
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4">
            {[...Array(12)].map((_, i) => <SkeletonItem key={i} tall={i % 3 === 0} />)}
          </div>
        ) : error ? (
          <div className="py-16 text-center">
            <p className="text-charcoal-400 mb-4">{error}</p>
            <button onClick={() => fetchItems(activeFilter, 1, true)} className="btn-outline btn-sm text-canvas-400 border-charcoal-700">
              Try Again
            </button>
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            dark
            title="No artworks yet"
            description="Gallery items will appear here once added by the admin."
          />
        ) : (
          <>
            <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4">
              {items.map((item, i) => (
                <div
                  key={item._id}
                  className="break-inside-avoid mb-4 animate-fade-in"
                  style={{ animationDelay: `${Math.min(i, 7) * 50}ms` }}
                >
                  <GalleryCard item={item} />
                </div>
              ))}
            </div>

            {/* Load More */}
            {hasMore && (
              <div className="mt-12 text-center">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="btn border-2 border-charcoal-700 text-charcoal-300 hover:border-canvas-500 hover:text-canvas-300 transition-all disabled:opacity-40 min-w-36"
                  aria-label="Load more artworks"
                >
                  {loadingMore ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full border-2 border-charcoal-600 border-t-canvas-400 animate-spin" />
                      Loading…
                    </span>
                  ) : 'Load More'}
                </button>
                <p className="text-charcoal-600 text-xs mt-3">{items.length} of {total} works</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Gallery;
