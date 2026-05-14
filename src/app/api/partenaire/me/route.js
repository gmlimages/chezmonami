// Lot Partenaires — Vue partenaire de son propre dashboard
// GET → { partenaire, codes, filleuls, commissions, totaux }
import { NextResponse } from 'next/server';
import { supabaseAdmin, getPartenaireFromToken } from '@/lib/supabaseAdmin';

function getToken(request) {
  const auth = request.headers.get('authorization') || '';
  return auth.startsWith('Bearer ') ? auth.slice(7) : null;
}

export async function GET(request) {
  try {
    const partenaire = await getPartenaireFromToken(getToken(request));
    if (!partenaire) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    // Auto-validation des commissions payee_admin > 7 jours (best-effort)
    try { await supabaseAdmin.rpc('valider_auto_commissions_payee_admin'); } catch {}

    const [codesRes, filleulsRes, commissionsRes] = await Promise.all([
      supabaseAdmin
        .from('codes_partenaires')
        .select('id, code, type, pourcentage_override, mois_filleul, reduction_filleul_pct, nom_campagne, date_expiration, actif, created_at')
        .eq('partenaire_id', partenaire.id)
        .order('type', { ascending: true })
        .order('created_at', { ascending: false }),
      supabaseAdmin
        .from('comptes_structures')
        .select('id, nom_contact, abonnement, date_paiement, date_fin_abonnement, montant_paiement, code_partenaire_utilise, structures(id, nom)')
        .eq('partenaire_id', partenaire.id)
        .order('date_paiement', { ascending: false, nullsFirst: false }),
      supabaseAdmin
        .from('commissions_partenaires')
        .select('id, abonnement_type, montant_abonnement_mad, devise_paiement, pourcentage_applique, montant_commission_mad, date_paiement_filleul, statut, date_en_paiement, date_payee_admin, date_validee_partenaire, date_contestee, motif_contestation, validation_auto, date_paiement_commission, notes, justificatif_url, filleul:comptes_structures!commissions_partenaires_filleul_compte_id_fkey(id, nom_contact, structures(nom)), code:codes_partenaires!commissions_partenaires_code_id_fkey(code, type, nom_campagne)')
        .eq('partenaire_id', partenaire.id)
        .order('date_paiement_filleul', { ascending: false }),
    ]);

    if (codesRes.error) console.error('[partenaire/me] codes error:', codesRes.error);
    if (filleulsRes.error) console.error('[partenaire/me] filleuls error:', filleulsRes.error);
    if (commissionsRes.error) console.error('[partenaire/me] commissions error:', commissionsRes.error);

    const codes = codesRes.data || [];
    const filleuls = filleulsRes.data || [];
    const commissions = commissionsRes.data || [];

    const totaux = commissions.reduce((acc, c) => {
      const m = Number(c.montant_commission_mad) || 0;
      if (c.statut === 'a_payer') acc.a_payer += m;
      else if (c.statut === 'en_paiement') acc.en_paiement += m;
      else if (c.statut === 'payee_admin') acc.a_confirmer += m;
      else if (c.statut === 'validee') acc.recue += m;
      else if (c.statut === 'contestee') acc.contestee += m;
      return acc;
    }, { a_payer: 0, en_paiement: 0, a_confirmer: 0, recue: 0, contestee: 0 });

    return NextResponse.json({
      partenaire: { ...partenaire, mot_de_passe_hash: undefined },
      codes,
      filleuls,
      commissions,
      totaux,
      _errors: {
        codes: codesRes.error?.message || null,
        filleuls: filleulsRes.error?.message || null,
        commissions: commissionsRes.error?.message || null,
      },
    });
  } catch (err) {
    console.error('[partenaire/me] fatal:', err);
    return NextResponse.json({ error: err?.message || 'Erreur serveur' }, { status: 500 });
  }
}

export async function PATCH(request) {
  const partenaire = await getPartenaireFromToken(getToken(request));
  if (!partenaire) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  try {
    const body = await request.json();
    // Champs modifiables par le partenaire lui-même
    const allowed = ['nom_complet', 'telephone', 'coordonnees_paiement'];
    const updates = {};
    for (const k of allowed) {
      if (k in body) updates[k] = body[k];
    }
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Rien à mettre à jour' }, { status: 400 });
    }
    const { data, error } = await supabaseAdmin
      .from('comptes_partenaires')
      .update(updates)
      .eq('id', partenaire.id)
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json({ success: true, partenaire: { ...data, mot_de_passe_hash: undefined } });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
