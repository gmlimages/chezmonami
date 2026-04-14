import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// GET — rechercher des comptes société (pour initier une conversation depuis l'admin)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get('q') || '').trim();

    let query = supabaseAdmin
      .from('comptes_structures')
      .select('id, nom_contact, email, badge_verifie, photo_profil, statut')
      .eq('statut', 'actif')
      .order('nom_contact');

    if (q.length >= 2) {
      query = query.ilike('nom_contact', `%${q}%`);
    }

    const { data, error } = await query.limit(20);
    if (error) throw error;

    return NextResponse.json({ comptes: data || [] });
  } catch (error) {
    console.error('GET admin comptes-entreprises:', error);
    return NextResponse.json({ comptes: [] });
  }
}
