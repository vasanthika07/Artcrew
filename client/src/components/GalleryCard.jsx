import { format } from 'date-fns';

const GalleryCard = ({ item }) => (
  <div
    className="gallery-item group relative overflow-hidden rounded-2xl cursor-pointer"
    tabIndex={0}
    role="img"
    aria-label={`${item.title}${item.artist ? ` by ${item.artist}` : ''}${item.mediumId?.name ? `, ${item.mediumId.name}` : ''}`}
  >
    <img
      src={item.imageUrl}
      alt={item.title}
      className="w-full object-cover group-hover:scale-105 transition-transform duration-700 ease-spring"
      loading="lazy"
    />

    {/* Hover overlay */}
    <div className="gallery-hover-reveal" aria-hidden="true" />

    {/* Info — revealed on hover */}
    <div
      className="absolute bottom-0 inset-x-0 p-4 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300"
      aria-hidden="true"
    >
      <p className="font-display font-semibold text-white text-sm leading-snug mb-1">
        {item.title}
      </p>
      <div className="flex items-center gap-2 flex-wrap">
        {item.mediumId?.name && (
          <span className="badge bg-canvas-500/80 text-white backdrop-blur-sm text-[10px]">
            {item.mediumId.name}
          </span>
        )}
        {item.artist && (
          <span className="text-charcoal-300 text-xs font-medium">by {item.artist}</span>
        )}
      </div>
    </div>
  </div>
);

export default GalleryCard;
