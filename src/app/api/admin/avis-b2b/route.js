// Lot F admin — Liste des avis B2B avec filtres
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireAdmin } from '@/lib/adminAuth';

export async function GET(request) {
  const admin = await requireAdmin(request);
  if (admin instanceof Response) return admin;
  try {
    const { searchParams } = new URL(request.url);
    const statut = searchParams.get('statut'); // en_attente | publie | rejete
    const structureId = searchParams.get('structure_id');
    const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10), 500);

    let q = supabaseAdmin
      .from('avis_b2b')
      .select(`
        id, structure_id, auteur_compte_id, note, commentaire,
        statut, motif_rejet, modere_par, modere_at, created_at, updated_at,
        structures(id, nom),
        auteur:auteur_compte_id(id, nom_contact, email, structures(id, nom))
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (statut) q = q.eq('statut', statut);
    if (structureId) q = q.eq('structure_id', structureId);

    const { data, error } = await q;
    if (error) throw error;

    return NextResponse.json({ avis: data || [] });
  } catch (err) {
    console.error('GET admin avis-b2b error:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
