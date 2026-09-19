import { AlertCircle } from 'lucide-react';

const ErrorState = ({ message = 'Something went wrong.', retry }) => (
  <div className="flex items-center justify-center py-16 animate-fade-in">
    <div className="text-center max-w-sm">
      <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
        <AlertCircle className="w-7 h-7 text-red-400" />
      </div>
      <h3 className="font-display font-semibold text-charcoal-800 mb-2">Something went wrong</h3>
      <p className="text-charcoal-500 text-sm mb-4">{message}</p>
      {retry && (
        <button onClick={retry} className="btn-outline btn-sm">
          Try again
        </button>
      )}
    </div>
  </div>
);

export default ErrorState;
