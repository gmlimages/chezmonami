'use client';
// Gestion des favoris côté client (localStorage).
// Anonyme : aucun compte requis. Une clé unique par type (structures, produits).
//
// Stockage : { structures: [...ids], produits: [...ids] }
//
// API :
//   const { favoris, isFavori, toggle, ajouter, retirer, count } = useFavoris('structures');
//   isFavori(id)         → boolean
//   toggle(id)           → bascule
//   ajouter(id) / retirer(id)
//   count                → nombre total

import { useEffect, useState, useCallback } from 'react';

const STORAGE_KEY = 'chezmonami:favoris';

// Bus interne pour synchroniser tous les composants montés
const listeners = new Set();
function notifier() {
  listeners.forEach((fn) => fn());
}

function lire() {
  if (typeof window === 'undefined') return { structures: [], produits: [] };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { structures: [], produits: [] };
    const data = JSON.parse(raw);
    return {
      structures: Array.isArray(data.structures) ? data.structures : [],
      produits: Array.isArray(data.produits) ? data.produits : [],
    };
  } catch {
    return { structures: [], produits: [] };
  }
}

function ecrire(data) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  notifier();
}

export function useFavoris(type = 'structures') {
  const [data, setData] = useState({ structures: [], produits: [] });

  useEffect(() => {
    setData(lire());
    const handler = () => setData(lire());
    listeners.add(handler);
    // Synchro entre onglets
    const storageHandler = (e) => {
      if (e.key === STORAGE_KEY) handler();
    };
    window.addEventListener('storage', storageHandler);
    return () => {
      listeners.delete(handler);
      window.removeEventListener('storage', storageHandler);
    };
  }, []);

  const liste = data[type] || [];

  const isFavori = useCallback(
    (id) => liste.includes(id),
    [liste],
  );

  const ajouter = useCallback(
    (id) => {
      const courant = lire();
      const ids = courant[type] || [];
      if (ids.includes(id)) return;
      ecrire({ ...courant, [type]: [...ids, id] });
    },
    [type],
  );

  const retirer = useCallback(
    (id) => {
      const courant = lire();
      const ids = courant[type] || [];
      ecrire({ ...courant, [type]: ids.filter((x) => x !== id) });
    },
    [type],
  );

  const toggle = useCallback(
    (id) => {
      const courant = lire();
      const ids = courant[type] || [];
      if (ids.includes(id)) {
        ecrire({ ...courant, [type]: ids.filter((x) => x !== id) });
      } else {
        ecrire({ ...courant, [type]: [...ids, id] });
      }
    },
    [type],
  );

  const vider = useCallback(() => {
    const courant = lire();
    ecrire({ ...courant, [type]: [] });
  }, [type]);

  return {
    favoris: liste,
    isFavori,
    toggle,
    ajouter,
    retirer,
    vider,
    count: liste.length,
    countTotal: (data.structures?.length || 0) + (data.produits?.length || 0),
  };
}

// Hook léger qui ne renvoie que le total (pour le badge du Header)
export function useFavorisCount() {
  const [total, setTotal] = useState(0);
  useEffect(() => {
    const calc = () => {
      const d = lire();
      setTotal((d.structures?.length || 0) + (d.produits?.length || 0));
    };
    calc();
    listeners.add(calc);
    const storageHandler = (e) => {
      if (e.key === STORAGE_KEY) calc();
    };
    window.addEventListener('storage', storageHandler);
    return () => {
      listeners.delete(calc);
      window.removeEventListener('storage', storageHandler);
    };
  }, []);
  return total;
}
