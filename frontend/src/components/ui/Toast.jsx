import { createContext, useCallback, useContext, useRef, useState } from 'react';

const ToastContext = createContext(null);

const VARIANT_STYLES = {
  success: 'border-verified-500/30 bg-verified-50 text-verified-700',
  error: 'border-denied-500/30 bg-denied-50 text-denied-700',
  info: 'border-slate-200 bg-white text-ink',
};

const VARIANT_ICON = {
  success: (
    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5 shrink-0 text-verified-500" aria-hidden="true">
      <circle cx="10" cy="10" r="9" fill="currentColor" opacity="0.15" />
      <path d="M6 10l2.5 2.5L14 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  error: (
    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5 shrink-0 text-denied-500" aria-hidden="true">
      <circle cx="10" cy="10" r="9" fill="currentColor" opacity="0.15" />
      <path d="M10 6v5M10 14h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  info: (
    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5 shrink-0 text-slate-500" aria-hidden="true">
      <circle cx="10" cy="10" r="9" fill="currentColor" opacity="0.12" />
      <path d="M10 9v5M10 6h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const show = useCallback((message, { variant = 'info', duration = 4000 } = {}) => {
    const id = ++idRef.current;
    setToasts((current) => [...current, { id, message, variant }]);
    if (duration > 0) {
      setTimeout(() => dismiss(id), duration);
    }
    return id;
  }, [dismiss]);

  const toast = {
    show,
    success: (message, opts) => show(message, { ...opts, variant: 'success' }),
    error: (message, opts) => show(message, { ...opts, variant: 'error' }),
    info: (message, opts) => show(message, { ...opts, variant: 'info' }),
    dismiss,
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div
        className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2"
        aria-live="polite"
        aria-atomic="false"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto flex items-start gap-2 rounded-lg border px-4 py-3 text-sm shadow-card ${VARIANT_STYLES[t.variant] || VARIANT_STYLES.info}`}
          >
            {VARIANT_ICON[t.variant] || VARIANT_ICON.info}
            <span className="flex-1">{t.message}</span>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              className="shrink-0 text-slate-400 hover:text-slate-600"
              aria-label="Dismiss notification"
            >
              &times;
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}
