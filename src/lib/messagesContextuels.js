// Helpers pour pré-remplir le message d'une demande de mise en relation
// en fonction du contexte (page produit, annonce, structure, appel d'offres).
//
// Utilisation côté appelant :
//   import { buildLienContact } from '@/lib/messagesContextuels';
//   const href = buildLienContact({ structureId, type: 'produit', nom: produit.nom });
//   <Link href={href}>Contacter</Link>
//
// Utilisation côté destinataire (drawer "nouvelle demande") :
//   import { lireContexteDepuisURL, messageContextuelDepuis } from '@/lib/messagesContextuels';
//   const ctx = lireContexteDepuisURL(searchParams);
//   const messagePrefill = messageContextuelDepuis(ctx, t);

export function buildLienContact({ structureId, type, nom = '' } = {}) {
  const base = '/entreprise/dashboard/reseau';
  const params = new URLSearchParams();
  if (structureId) params.set('contact', String(structureId));
  if (type) params.set('from', type);
  if (nom) params.set('ref', nom.slice(0, 80));
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

export function lireContexteDepuisURL(searchParams) {
  if (!searchParams) return null;
  const get = (k) =>
    typeof searchParams.get === 'function'
      ? searchParams.get(k)
      : searchParams[k];
  const contact = get('contact');
  const type = get('from');
  const ref = get('ref');
  if (!contact || !type) return null;
  return { structureId: contact, type, nom: ref || '' };
}

const TYPES_VALIDES = new Set(['structure', 'produit', 'annonce', 'appel_offres']);

export function messageContextuelDepuis(ctx, t) {
  if (!ctx || !TYPES_VALIDES.has(ctx.type)) return '';
  const cle = `messages_contextuels.depuis_${ctx.type}`;
  const tpl = t(cle);
  if (!tpl) return '';
  return tpl.replace('{{nom}}', ctx.nom || '');
}
