// Lot Partenaires — Liste des commissions (admin)
// GET ?statut=a_payer|payee|annulee|tous&partenaire_id=...
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireAdmin } from '@/lib/adminAuth';

export async function GET(request) {
  const admin = await requireAdmin(request);
  if (admin instanceof Response) return admin;
  try {
    // Validation auto des commissions payee_admin > 7 jours (best-effort)
    await supabaseAdmin.rpc('valider_auto_commissions_payee_admin').catch(() => {});

    const { searchParams } = new URL(request.url);
    const statut = searchParams.get('statut') || 'tous';
    const partenaireId = searchParams.get('partenaire_id');

    let q = supabaseAdmin
      .from('commissions_partenaires')
      .select(`
        *,
        partenaire:comptes_partenaires!commissions_partenaires_partenaire_id_fkey(id, nom_complet, email),
        filleul:comptes_structures!commissions_partenaires_filleul_compte_id_fkey(id, nom_contact, email, structures(id, nom)),
        code:codes_partenaires!commissions_partenaires_code_id_fkey(id, code, type, nom_campagne)
      `)
      .order('date_paiement_filleul', { ascending: false });

    if (statut !== 'tous') q = q.eq('statut', statut);
    if (partenaireId) q = q.eq('partenaire_id', partenaireId);

    const { data, error } = await q;
    if (error) throw error;

    // Totaux
    const totaux = (data || []).reduce((acc, c) => {
      const montant = Number(c.montant_commission_mad) || 0;
      acc.total++;
      if (c.statut === 'a_payer') acc.a_payer += montant;
      else if (c.statut === 'en_paiement') acc.en_paiement += montant;
      else if (c.statut === 'payee_admin') acc.payee_admin += montant;
      else if (c.statut === 'validee') acc.validee += montant;
      else if (c.statut === 'contestee') acc.contestee += montant;
      return acc;
    }, { total: 0, a_payer: 0, en_paiement: 0, payee_admin: 0, validee: 0, contestee: 0 });

    return NextResponse.json({ commissions: data || [], totaux });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
