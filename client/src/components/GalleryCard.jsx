import React, { useState } from 'react';
import { Sparkles, ZoomIn, X, User } from 'lucide-react';

const GalleryCard = ({ item }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const imgSrc = item.imageUrl || 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800';

  return (
    <>
      <div
        className="gallery-item group relative overflow-hidden rounded-xl sm:rounded-2xl cursor-pointer bg-charcoal-900 border border-charcoal-800 hover:border-canvas-500/50 transition-all duration-300 shadow-sm hover:shadow-xl select-none"
        tabIndex={0}
        role="button"
        onClick={() => setIsModalOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsModalOpen(true);
          }
        }}
        aria-label={`${item.title}${item.artist ? ` by ${item.artist}` : ''}`}
      >
        {/* Shimmer loading placeholder */}
        {!isLoaded && (
          <div className="absolute inset-0 skeleton-dark animate-pulse min-h-[140px] sm:min-h-[220px]" />
        )}

        <img
          src={imgSrc}
          alt={item.title}
          className={`w-full h-auto object-cover group-hover:scale-105 transition-all duration-700 ease-spring ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          loading="lazy"
          onLoad={() => setIsLoaded(true)}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800';
            setIsLoaded(true);
          }}
        />

        {/* Ambient Gradient overlay - always visible at bottom for mobile legibility, intensifies on hover */}
        <div
          className="absolute inset-0 bg-gradient-to-t from-charcoal-950 via-charcoal-950/40 to-transparent opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          aria-hidden="true"
        />

        {/* Top-right quick zoom badge */}
        <div className="absolute top-2 right-2 sm:top-3 sm:right-3 opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-charcoal-950/70 backdrop-blur-md border border-white/20 text-white flex items-center justify-center shadow-lg">
            <ZoomIn className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-canvas-300" />
          </div>
        </div>

        {/* Artwork Info */}
        <div className="absolute bottom-0 inset-x-0 p-2.5 sm:p-4 transition-all duration-300">
          <p className="font-display font-semibold text-white text-xs sm:text-sm leading-snug line-clamp-1 mb-0.5 sm:mb-1 drop-shadow-md">
            {item.title}
          </p>
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            {item.mediumId?.name && (
              <span className="badge bg-canvas-500/90 text-white text-[9px] sm:text-[10px] px-1.5 py-0.5 shadow-sm">
                {item.mediumId.name}
              </span>
            )}
            {item.artist && (
              <span className="text-charcoal-300 text-[10px] sm:text-xs font-medium truncate max-w-[120px] sm:max-w-none">
                by {item.artist}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox Modal for Ultra-Detailed Full-Screen View on Any Screen / Mini Devices */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-charcoal-950/90 backdrop-blur-md animate-fade-in"
          onClick={() => setIsModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-artwork-title"
        >
          <div
            className="relative max-w-4xl w-full bg-charcoal-900 border border-charcoal-700 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-charcoal-950/80 hover:bg-canvas-500 text-white flex items-center justify-center transition-all border border-white/10 shadow-lg cursor-pointer"
              aria-label="Close artwork preview"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col md:flex-row max-h-[85vh] overflow-y-auto">
              {/* Full Image Container */}
              <div className="md:w-3/5 bg-charcoal-950 flex items-center justify-center p-2 sm:p-4 overflow-hidden">
                <img
                  src={imgSrc}
                  alt={item.title}
                  className="max-h-[50vh] md:max-h-[75vh] w-auto max-w-full object-contain rounded-xl shadow-lg"
                />
              </div>

              {/* Details Pane */}
              <div className="md:w-2/5 p-5 sm:p-7 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    {item.mediumId?.name && (
                      <span className="badge bg-canvas-500/20 text-canvas-300 border border-canvas-500/30 text-xs font-semibold px-2.5 py-1">
                        {item.mediumId.name}
                      </span>
                    )}
                    {item.isFeatured && (
                      <span className="badge bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold px-2.5 py-1 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Featured
                      </span>
                    )}
                  </div>

                  <h3
                    id="modal-artwork-title"
                    className="font-display font-bold text-xl sm:text-2xl text-white mb-2 leading-tight"
                  >
                    {item.title}
                  </h3>

                  {item.artist && (
                    <div className="flex items-center gap-2 text-sm text-charcoal-300 mb-4 pb-4 border-b border-charcoal-800">
                      <div className="w-6 h-6 rounded-full bg-canvas-500/20 text-canvas-300 flex items-center justify-center text-xs font-bold">
                        <User className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-medium text-white">{item.artist}</span>
                    </div>
                  )}

                  {item.description && (
                    <p className="text-charcoal-300 text-xs sm:text-sm leading-relaxed mb-4">
                      {item.description}
                    </p>
                  )}
                </div>

                <div className="pt-4 border-t border-charcoal-800/80 flex items-center justify-between text-xs text-charcoal-400">
                  <span>ArtCrew Community Work</span>
                  <span className="text-canvas-400 font-medium">Original Artwork</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GalleryCard;
