'use client';
// Sélecteur de langue (FR / EN / AR). Utilisable dans le header (desktop + mobile).

import { useState, useRef, useEffect } from 'react';
import { useT } from '@/lib/i18n/LangProvider';
import { LANGUES } from '@/lib/i18n/translations';

export default function LanguageSwitcher({ variant = 'desktop' }) {
  const { lang, setLang, t } = useT();
  const [ouvert, setOuvert] = useState(false);
  const ref = useRef(null);

  // Fermer au clic extérieur
  useEffect(() => {
    if (!ouvert) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOuvert(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [ouvert]);

  const actuel = LANGUES.find((l) => l.code === lang) || LANGUES[0];

  // Variante mobile : liste plate dans le menu
  if (variant === 'mobile') {
    return (
      <div className="border-t border-white/20 pt-2 mt-1">
        <p className="px-4 py-2 text-xs uppercase opacity-70 font-semibold">
          🌐 {t('common.langue')}
        </p>
        <div className="flex gap-2 px-2">
          {LANGUES.map((l) => (
            <button
              key={l.code}
              onClick={() => setLang(l.code)}
              className={`flex-1 px-2 py-2 rounded-lg text-sm font-medium transition flex items-center justify-center gap-1 ${
                l.code === lang
                  ? 'bg-white text-primary shadow-md'
                  : 'bg-white/10 hover:bg-white/20'
              }`}
              aria-pressed={l.code === lang}
            >
              <span>{l.drapeau}</span>
              <span>{l.nom}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Variante desktop : dropdown
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOuvert(!ouvert)}
        aria-label={t('common.langue')}
        aria-expanded={ouvert}
        className="flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-white/10 transition text-sm font-medium"
      >
        <span className="text-base">{actuel.drapeau}</span>
        <span className="hidden lg:inline uppercase">{actuel.code}</span>
        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {ouvert && (
        <div className="absolute right-0 mt-2 w-44 bg-white text-gray-800 rounded-lg shadow-2xl overflow-hidden z-50 border border-gray-200">
          {LANGUES.map((l) => (
            <button
              key={l.code}
              onClick={() => {
                setLang(l.code);
                setOuvert(false);
              }}
              className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50 transition ${
                l.code === lang ? 'bg-green-50 font-semibold text-primary' : ''
              }`}
              aria-pressed={l.code === lang}
            >
              <span className="text-lg">{l.drapeau}</span>
              <span className="flex-1 text-left">{l.nom}</span>
              {l.code === lang && <span className="text-primary">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
