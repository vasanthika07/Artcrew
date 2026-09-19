const LoadingState = ({ fullScreen = false, dark = false, message = 'Loading...' }) => {
  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-cream flex items-center justify-center z-50" role="status" aria-live="polite">
        <div className="text-center animate-fade-in">
          {/* Animated palette */}
          <div className="relative w-16 h-16 mx-auto mb-5">
            <div className={`absolute inset-0 rounded-full border-4 ${dark ? 'border-charcoal-800' : 'border-canvas-100'}`} />
            <div className="absolute inset-0 rounded-full border-4 border-canvas-500 border-t-transparent animate-spin" />
            <div className="absolute inset-2 rounded-full bg-gradient-to-br from-canvas-500/20 to-terracotta-500/20 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-canvas-400 animate-pulse-slow" />
            </div>
          </div>
          <p className={`font-medium text-sm ${dark ? 'text-charcoal-400' : 'text-charcoal-500'}`}>{message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-16 animate-fade-in" role="status" aria-live="polite" aria-label={message}>
      <div className="text-center">
        <div className="relative w-10 h-10 mx-auto mb-3">
          <div className={`absolute inset-0 rounded-full border-3 ${dark ? 'border-charcoal-800' : 'border-canvas-100'}`} style={{ borderWidth: 3 }} />
          <div className="absolute inset-0 rounded-full border-canvas-500 border-t-transparent animate-spin" style={{ borderWidth: 3 }} />
        </div>
        <p className={`text-sm ${dark ? 'text-charcoal-400' : 'text-charcoal-500'}`}>{message}</p>
      </div>
    </div>
  );
};

export default LoadingState;
