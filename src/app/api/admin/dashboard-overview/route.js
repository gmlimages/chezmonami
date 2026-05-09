// API : KPIs unifiés pour le dashboard admin global.
import { requireAdmin } from '@/lib/adminAuth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

async function count(table, filters = {}) {
  let q = supabaseAdmin.from(table).select('id', { count: 'exact', head: true });
  for (const [k, v] of Object.entries(filters)) {
    if (Array.isArray(v)) q = q.in(k, v);
    else if (v?.gte) q = q.gte(k, v.gte);
    else q = q.eq(k, v);
  }
  const { count: c } = await q;
  return c || 0;
}

export async function GET(request) {
  const admin = await requireAdmin(request);
  if (admin instanceof Response) return admin;

  const il_y_a_24h = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const il_y_a_7j = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();

  try {
    const [
      structures_total,
      structures_publie,
      structures_brouillon,
      comptes_actifs,
      comptes_24h,
      comptes_payants,
      docs_attente,
      reclamations_ouvertes,
      messages_24h,
      demandes_attente,
      appels_ouverts,
      audit_24h,
      impersonations_actives,
    ] = await Promise.all([
      count('structures'),
      count('structures', { statut: 'publie' }),
      count('structures', { statut: 'brouillon' }),
      count('comptes_structures', { statut: 'actif' }),
      count('comptes_structures', { created_at: { gte: il_y_a_24h } }),
      count('comptes_structures', { abonnement: ['mensuel', 'trimestriel', 'semestriel', 'annuel'] }),
      count('documents_entreprises', { statut: 'en_attente' }),
      count('reclamations', { statut: 'ouverte' }),
      count('messages_entreprises', { created_at: { gte: il_y_a_24h } }),
      count('demandes_contact', { statut: 'en_attente' }),
      count('appels_offres', { statut: 'ouvert' }),
      count('admin_audit_logs', { created_at: { gte: il_y_a_24h } }),
      count('impersonation_sessions', { termine_at: null }),
    ]);

    return Response.json({
      structures: {
        total: structures_total,
        publie: structures_publie,
        brouillon: structures_brouillon,
      },
      comptes: {
        actifs: comptes_actifs,
        nouveaux_24h: comptes_24h,
        payants: comptes_payants,
      },
      moderation: {
        docs_a_valider: docs_attente,
        reclamations_ouvertes,
        demandes_contact_en_attente: demandes_attente,
      },
      activite: {
        messages_24h,
        appels_offres_ouverts: appels_ouverts,
        actions_admin_24h: audit_24h,
        impersonations_actives,
      },
    });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
