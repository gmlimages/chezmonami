'use client';
// Modal de confirmation qui remplace window.confirm().
// Usage : import { confirmDialog } from '@/lib/toast';
//   const ok = await confirmDialog({ message: 'Supprimer ?', danger: true });
//   if (ok) { ... }

import { useEffect, useState } from 'react';

const listeners = new Set();
let nextId = 1;

export function emitConfirm(payload) {
  listeners.forEach((l) => l(payload));
}

export function subscribeConfirm(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function requestConfirm(opts = {}) {
  return new Promise((resolve) => {
    emitConfirm({
      id: nextId++,
      title: opts.title || 'Confirmation',
      message: opts.message || 'Confirmer cette action ?',
      confirmLabel: opts.confirmLabel || 'Confirmer',
      cancelLabel: opts.cancelLabel || 'Annuler',
      danger: !!opts.danger,
      resolve,
    });
  });
}

export default function ConfirmDialogContainer() {
  const [dialog, setDialog] = useState(null);

  useEffect(() => {
    return subscribeConfirm((payload) => setDialog(payload));
  }, []);

  if (!dialog) return null;

  const close = (result) => {
    dialog.resolve(result);
    setDialog(null);
  };

  return (
    <div
      className="fixed inset-0 z-[9998] bg-black/60 flex items-center justify-center p-4"
      onClick={() => close(false)}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="confirm-title" className="text-xl font-bold text-gray-800 mb-3">
          {dialog.title}
        </h3>
        <p className="text-gray-700 mb-6 whitespace-pre-line">{dialog.message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={() => close(false)}
            className="px-5 py-2.5 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-semibold transition"
            autoFocus
          >
            {dialog.cancelLabel}
          </button>
          <button
            onClick={() => close(true)}
            className={`px-5 py-2.5 rounded-lg text-white font-semibold transition ${
              dialog.danger
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-primary hover:opacity-90'
            }`}
          >
            {dialog.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
