'use client';
// Système de notifications toast léger (sans dépendance externe).
// Usage : import { toast } from '@/lib/toast'; toast.success('OK'); toast.error('Échec');

import { useEffect, useState } from 'react';

// Bus d'événements simple (singleton module-scope)
const listeners = new Set();
let nextId = 1;

export function emit(toast) {
  listeners.forEach((l) => l(toast));
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function makeToast(type, message, options = {}) {
  return {
    id: nextId++,
    type, // success | error | info | warning
    message,
    duration: options.duration ?? (type === 'error' ? 6000 : 4000),
  };
}

// Composant ToastContainer monté une seule fois dans le RootLayout
export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    return subscribe((toast) => {
      setToasts((prev) => [...prev, toast]);
      if (toast.duration > 0) {
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== toast.id));
        }, toast.duration);
      }
    });
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-[calc(100vw-2rem)] sm:w-auto">
      {toasts.map((t) => (
        <ToastItem
          key={t.id}
          toast={t}
          onClose={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
        />
      ))}
    </div>
  );
}

function ToastItem({ toast, onClose }) {
  const styles = {
    success: { bg: 'bg-green-50', border: 'border-green-500', text: 'text-green-800', icon: '✅' },
    error:   { bg: 'bg-red-50',   border: 'border-red-500',   text: 'text-red-800',   icon: '❌' },
    info:    { bg: 'bg-blue-50',  border: 'border-blue-500',  text: 'text-blue-800',  icon: 'ℹ️' },
    warning: { bg: 'bg-yellow-50',border: 'border-yellow-500',text: 'text-yellow-800',icon: '⚠️' },
  }[toast.type] || { bg: 'bg-gray-50', border: 'border-gray-400', text: 'text-gray-800', icon: '' };

  return (
    <div
      role="status"
      className={`${styles.bg} ${styles.text} border-l-4 ${styles.border} shadow-lg rounded-lg p-4 pr-10 flex items-start gap-3 animate-[slideIn_0.2s_ease-out] relative`}
    >
      <span className="text-xl flex-shrink-0" aria-hidden="true">{styles.icon}</span>
      <p className="text-sm leading-relaxed flex-1 whitespace-pre-line">{toast.message}</p>
      <button
        onClick={onClose}
        aria-label="Fermer"
        className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-lg leading-none"
      >
        ×
      </button>
    </div>
  );
}
