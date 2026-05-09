// Slugify simple, sans dépendance.
// "Bâtiment & Travaux" → "batiment-travaux"
export function slugify(s = '') {
  return String(s)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Détecte si une chaîne est un UUID v4 (utilisé pour rediriger UUID → slug
// sur les routes /structure/[slug]).
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function isUUID(s) {
  return typeof s === 'string' && UUID_RE.test(s);
}
