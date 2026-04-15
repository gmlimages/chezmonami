import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireAdmin } from '@/lib/adminAuth';

// GET — toutes les réclamations (admin)
export async function GET(request) {
  const admin = await requireAdmin(request);
  if (admin instanceof Response) return admin;
  try {
    const { searchParams } = new URL(request.url);
    const compteId = searchParams.get('compte_id');
    const statut = searchParams.get('statut');

    let query = supabaseAdmin
      .from('reclamations')
      .select('id, statut, message, message_admin, created_at, structure_id, compte_id, structures(id, nom, categorie_id), comptes_structures(id, nom_contact, email)')
      .order('created_at', { ascending: false });

    if (compteId) query = query.eq('compte_id', compteId);
    if (statut) query = query.eq('statut', statut);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ reclamations: data || [] });
  } catch (error) {
    console.error('GET admin reclamations:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
