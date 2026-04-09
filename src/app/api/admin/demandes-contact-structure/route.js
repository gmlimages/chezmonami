import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// GET — liste toutes les demandes de mise en relation (depuis la page structure publique)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const statut = searchParams.get('statut');

    let query = supabaseAdmin
      .from('demandes_mise_en_relation')
      .select(`
        *,
        structure:structures(id, nom, ville:villes(nom), categorie:categories(nom, icon)),
        compte_demandeur:comptes_structures(id, nom_contact, email, badge_verifie)
      `)
      .order('created_at', { ascending: false });

    if (statut && statut !== 'tous') query = query.eq('statut', statut);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ demandes: data || [] });
  } catch (error) {
    console.error('GET demandes-contact-structure:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
