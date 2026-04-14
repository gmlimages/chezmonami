// Helper client-side pour les appels API admin avec token automatique
// Usage : import { adminFetch } from '@/lib/adminFetch';

export function getAdminToken() {
  if (typeof window === 'undefined') return '';
  try {
    return JSON.parse(localStorage.getItem('adminAuth') || '{}').sessionToken || '';
  } catch {
    return '';
  }
}

/**
 * Wrapper autour de fetch qui injecte automatiquement le token admin
 * dans le header Authorization.
 */
export function adminFetch(url, options = {}) {
  const token = getAdminToken();
  const headers = {
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  return fetch(url, { ...options, headers });
}
