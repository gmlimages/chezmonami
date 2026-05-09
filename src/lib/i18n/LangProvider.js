'use client';
// Contexte de langue : stockage localStorage + cookie + RTL automatique pour l'arabe.

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { translations, LANGUES } from './translations';

const STORAGE_KEY = 'chezmonami:lang';
const COOKIE_NAME = 'cma_lang';
const DEFAULT_LANG = 'fr';

const LangContext = createContext({
  lang: DEFAULT_LANG,
  setLang: () => {},
  t: (key) => key,
  dir: 'ltr',
});

function lireCookie(nom) {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(^| )${nom}=([^;]+)`));
  return match ? match[2] : null;
}

function ecrireCookie(nom, valeur) {
  if (typeof document === 'undefined') return;
  // 1 an
  document.cookie = `${nom}=${valeur}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
}

function resoudreTrad(obj, cheminClef) {
  return cheminClef.split('.').reduce(
    (acc, segment) => (acc && acc[segment] !== undefined ? acc[segment] : null),
    obj
  );
}

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(DEFAULT_LANG);

  // Hydration : ?lang= dans l'URL > localStorage > cookie. Le param URL persiste si valide.
  useEffect(() => {
    let initial = null;
    try {
      const params = new URLSearchParams(window.location.search);
      const fromUrl = params.get('lang');
      if (fromUrl && translations[fromUrl]) initial = fromUrl;
    } catch {}
    if (!initial) {
      initial = localStorage.getItem(STORAGE_KEY) || lireCookie(COOKIE_NAME);
    }
    if (initial && translations[initial]) {
      setLangState(initial);
      // Persiste si la source est l'URL
      try {
        localStorage.setItem(STORAGE_KEY, initial);
        ecrireCookie(COOKIE_NAME, initial);
      } catch {}
    }
  }, []);

  // Appliquer dir + lang sur <html> à chaque changement
  useEffect(() => {
    const def = LANGUES.find((l) => l.code === lang);
    if (typeof document !== 'undefined' && def) {
      document.documentElement.lang = lang;
      document.documentElement.dir = def.dir;
    }
  }, [lang]);

  const setLang = useCallback((nouvelle) => {
    if (!translations[nouvelle]) return;
    setLangState(nouvelle);
    localStorage.setItem(STORAGE_KEY, nouvelle);
    ecrireCookie(COOKIE_NAME, nouvelle);
  }, []);

  const t = useCallback(
    (cheminClef, valeurDefaut) => {
      const trad = resoudreTrad(translations[lang], cheminClef);
      if (trad !== null && trad !== undefined) return trad;
      // Fallback sur le français
      const fb = resoudreTrad(translations[DEFAULT_LANG], cheminClef);
      return fb ?? valeurDefaut ?? cheminClef;
    },
    [lang]
  );

  const def = LANGUES.find((l) => l.code === lang) || LANGUES[0];

  return (
    <LangContext.Provider value={{ lang, setLang, t, dir: def.dir }}>
      {children}
    </LangContext.Provider>
  );
}

export function useT() {
  return useContext(LangContext);
}
