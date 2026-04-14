// Rate limiter simple en mémoire — SERVER ONLY
// Utilisé pour les endpoints de connexion pour bloquer le brute-force au niveau réseau.
// Stocke les tentatives par IP avec un compteur glissant.

const store = new Map(); // ip -> { count, resetAt }

/**
 * Vérifie et incrémente le compteur de rate limit pour une IP.
 * @param {string} ip
 * @param {object} options
 * @param {number} options.limit - Nombre maximum de requêtes
 * @param {number} options.windowMs - Fenêtre en millisecondes
 * @returns {{ allowed: boolean, remaining: number, retryAfter: number }}
 */
export function rateLimit(ip, { limit = 10, windowMs = 60_000 } = {}) {
  const now = Date.now();
  const entry = store.get(ip);

  if (!entry || now > entry.resetAt) {
    // Nouvelle fenêtre
    store.set(ip, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfter: 0 };
  }

  entry.count += 1;

  if (entry.count > limit) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, remaining: 0, retryAfter };
  }

  return { allowed: true, remaining: limit - entry.count, retryAfter: 0 };
}

// Nettoyage périodique des entrées expirées (toutes les 5 minutes)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, val] of store.entries()) {
      if (now > val.resetAt) store.delete(key);
    }
  }, 5 * 60_000);
}
