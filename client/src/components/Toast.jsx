import { useState, useEffect, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

let toastId = 0;
const listeners = new Set();

export const toast = {
  success: (message, duration = 4000) => addToast({ type: 'success', message, duration }),
  error: (message, duration = 5000) => addToast({ type: 'error', message, duration }),
  info: (message, duration = 4000) => addToast({ type: 'info', message, duration }),
  warning: (message, duration = 4000) => addToast({ type: 'warning', message, duration }),
};

const addToast = (toast) => {
  const id = ++toastId;
  listeners.forEach((fn) => fn({ ...toast, id }));
  return id;
};

const ICONS = {
  success: <CheckCircle className="w-5 h-5 text-sage-500" />,
  error: <AlertCircle className="w-5 h-5 text-red-400" />,
  info: <Info className="w-5 h-5 text-canvas-400" />,
  warning: <AlertTriangle className="w-5 h-5 text-yellow-400" />,
};

const STYLES = {
  success: 'border-l-sage-400',
  error: 'border-l-red-400',
  info: 'border-l-canvas-400',
  warning: 'border-l-yellow-400',
};

const ToastItem = ({ toast: t, onRemove }) => {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(t.id), t.duration || 4000);
    return () => clearTimeout(timer);
  }, [t, onRemove]);

  return (
    <div
      className={`flex items-start gap-3 bg-white rounded-xl shadow-card-hover border border-charcoal-100
        border-l-4 ${STYLES[t.type]} px-4 py-3 pr-10 max-w-sm w-full animate-fade-up relative`}
    >
      <span className="mt-0.5 shrink-0">{ICONS[t.type]}</span>
      <p className="text-sm text-charcoal-700 font-medium">{t.message}</p>
      <button
        onClick={() => onRemove(t.id)}
        className="absolute top-2 right-2 text-charcoal-400 hover:text-charcoal-600 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export const ToastContainer = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handler = (t) => setToasts((prev) => [...prev, t]);
    listeners.add(handler);
    return () => listeners.delete(handler);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 items-end">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onRemove={removeToast} />
      ))}
    </div>
  );
};

export default ToastContainer;
