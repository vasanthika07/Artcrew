import React, { useEffect, useState } from 'react';
import { Play, Clock, Sparkles } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const formatDuration = (seconds) => {
  if (!seconds) return '0 min';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

const ContinueWatching = ({ onPlay, refreshKey }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();

  const loadProgress = async () => {
    if (!isAuthenticated) {
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      const { data } = await api.get('/recordings/continue-watching');
      setItems(data.data || []);
    } catch (err) {
      console.warn('[ContinueWatching] Error fetching queue:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProgress();
  }, [isAuthenticated, refreshKey]);

  if (!isAuthenticated || (!loading && items.length === 0)) {
    return null;
  }

  return (
    <section className="mb-10 animate-fade-up" aria-label="Continue Watching">
      <div className="flex items-center justify-between gap-4 mb-4">
        <h2 className="font-display font-semibold text-lg sm:text-xl text-white flex items-center gap-2">
          <span className="w-2 h-5 rounded-full bg-gradient-to-b from-canvas-400 to-terracotta-500 inline-block" />
          Continue Watching
        </h2>
        <span className="text-xs text-charcoal-400 font-mono">
          {items.length} session{items.length > 1 ? 's' : ''} in progress
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {items.map((item) => {
          const rec = item.recording;
          if (!rec) return null;

          const thumbnail =
            rec.thumbnailUrl ||
            (rec.muxPlaybackId
              ? `https://image.mux.com/${rec.muxPlaybackId}/thumbnail.jpg?width=640&height=360&fit_mode=smartcrop&time=5`
              : 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=640&q=80');

          return (
            <div
              key={item._id}
              className="group rounded-2xl bg-charcoal-900/80 border border-charcoal-800 overflow-hidden hover:border-canvas-500/50 transition-all flex flex-col justify-between shadow-lg"
            >
              {/* Thumbnail Container */}
              <div className="relative aspect-video bg-charcoal-950 overflow-hidden">
                <img
                  src={thumbnail}
                  alt={rec.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950 via-charcoal-950/20 to-transparent" />

                {/* Center Hover Play Button */}
                <button
                  type="button"
                  onClick={() => onPlay(rec, item.progressSeconds)}
                  aria-label={`Resume ${rec.title}`}
                  className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-charcoal-950/40 cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-full bg-canvas-500 text-charcoal-950 flex items-center justify-center shadow-lg shadow-canvas-500/30 group-hover:scale-110 transition-transform">
                    <Play className="w-5 h-5 ml-0.5" fill="currentColor" />
                  </div>
                </button>

                {/* Progress pill */}
                <div className="absolute top-2 right-2">
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-charcoal-900/90 text-canvas-300 border border-charcoal-700/80 backdrop-blur-sm">
                    {item.progressPercentage}%
                  </span>
                </div>

                {/* Progress bar overlay at bottom of thumbnail */}
                <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-charcoal-800/80">
                  <div
                    className="h-full bg-gradient-to-r from-canvas-500 to-terracotta-400 transition-all duration-300 shadow-sm shadow-canvas-500/50"
                    style={{ width: `${item.progressPercentage}%` }}
                  />
                </div>
              </div>

              {/* Info Container */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  {rec.mediumId && (
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-canvas-400 mb-1">
                      {rec.mediumId.name || rec.mediumId}
                    </p>
                  )}
                  <h3 className="font-display font-semibold text-white text-sm line-clamp-1 group-hover:text-canvas-300 transition-colors mb-2">
                    {rec.title}
                  </h3>
                </div>

                <div className="pt-2 border-t border-charcoal-800/60 flex items-center justify-between">
                  <span className="text-xs text-charcoal-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Resume @ {formatDuration(item.progressSeconds)}
                  </span>

                  <button
                    type="button"
                    onClick={() => onPlay(rec, item.progressSeconds)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-canvas-400 hover:text-canvas-300 cursor-pointer"
                  >
                    Resume <Play className="w-3 h-3 ml-0.5" fill="currentColor" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default ContinueWatching;
