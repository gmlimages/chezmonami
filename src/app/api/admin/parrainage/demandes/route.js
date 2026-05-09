// Lot Parrainage — Liste des demandes de code (admin)
// GET ?statut=en_attente|approuvee|refusee|tous
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireAdmin } from '@/lib/adminAuth';

export async function GET(request) {
  const admin = await requireAdmin(request);
  if (admin instanceof Response) return admin;
  try {
    const { searchParams } = new URL(request.url);
    const statut = searchParams.get('statut') || 'en_attente';

    let q = supabaseAdmin
      .from('demandes_parrainage')
      .select(`
        id, statut, message_demandeur, motif_refus, traite_at, created_at,
        compte_id,
        comptes_structures!demandes_parrainage_compte_id_fkey (
          id, email, nom_contact, abonnement, date_fin_abonnement,
          structures (id, nom)
        )
      `)
      .order('created_at', { ascending: false });

    if (statut !== 'tous') q = q.eq('statut', statut);

    const { data, error } = await q;
    if (error) throw error;
    return NextResponse.json({ demandes: data });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
