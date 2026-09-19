import { Palette } from 'lucide-react';

const EmptyState = ({ title = 'Nothing here yet', description, action, dark = false }) => (
  <div className="flex items-center justify-center py-16 animate-fade-in" role="status">
    <div className="text-center max-w-sm">
      {/* Art-themed icon */}
      <div className={`relative w-20 h-20 mx-auto mb-5`}>
        <div className={`absolute inset-0 rounded-3xl ${
          dark ? 'bg-charcoal-800 border border-charcoal-700' : 'bg-canvas-50 border border-canvas-100'
        } rotate-6`} aria-hidden="true" />
        <div className={`absolute inset-0 rounded-3xl ${
          dark ? 'bg-charcoal-900 border border-charcoal-800' : 'bg-white border border-canvas-100'
        } flex items-center justify-center shadow-sm`}>
          <Palette className={`w-8 h-8 ${dark ? 'text-charcoal-600' : 'text-canvas-300'}`} aria-hidden="true" />
        </div>
      </div>

      <h3 className={`font-display font-semibold text-lg mb-2 ${dark ? 'text-charcoal-200' : 'text-charcoal-800'}`}>
        {title}
      </h3>
      {description && (
        <p className={`text-sm leading-relaxed mb-4 ${dark ? 'text-charcoal-500' : 'text-charcoal-500'}`}>
          {description}
        </p>
      )}
      {action && (
        <div className="mt-4 flex justify-center">{action}</div>
      )}
    </div>
  </div>
);

export default EmptyState;
