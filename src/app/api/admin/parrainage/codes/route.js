// Lot Parrainage — Liste des codes émis (admin)
// GET ?statut=actif|expire|utilise|tous
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireAdmin } from '@/lib/adminAuth';

export async function GET(request) {
  const admin = await requireAdmin(request);
  if (admin instanceof Response) return admin;
  try {
    const { searchParams } = new URL(request.url);
    const statut = searchParams.get('statut') || 'tous';

    let q = supabaseAdmin
      .from('codes_parrainage')
      .select(`
        id, code, parrain_compte_id, date_expiration, actif,
        utilise_par_compte_id, utilise_at, created_at,
        parrain:comptes_structures!codes_parrainage_parrain_compte_id_fkey (
          id, email, nom_contact, structures (id, nom)
        ),
        filleul:comptes_structures!codes_parrainage_utilise_par_compte_id_fkey (
          id, email, nom_contact, structures (id, nom)
        )
      `)
      .eq('supprime_par_admin', false)
      .order('created_at', { ascending: false });

    const { data, error } = await q;
    if (error) throw error;

    const now = new Date();
    const enriched = (data || []).map(c => {
      const expire = c.date_expiration && new Date(c.date_expiration) < now;
      const utilise = !!c.utilise_par_compte_id;
      let etat = 'actif';
      if (!c.actif) etat = 'revoque';
      else if (utilise) etat = 'utilise';
      else if (expire) etat = 'expire';
      return { ...c, etat };
    });

    const filtered = statut === 'tous'
      ? enriched
      : enriched.filter(c => c.etat === statut);

    return NextResponse.json({ codes: filtered });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
