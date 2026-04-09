import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// GET — liste toutes les structures (admin)
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('structures')
      .select(`
        *,
        pays:pays_id(id, nom, devise),
        ville:ville_id(id, nom),
        categorie:categorie_id(id, nom, icon, color)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ structures: data || [] });
  } catch (error) {
    console.error('GET admin/structures error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST — créer une structure (admin — publiée directement)
export async function POST(request) {
  try {
    const body = await request.json();

    const { data, error } = await supabaseAdmin
      .from('structures')
      .insert({ ...body, statut: 'publie' })
      .select(`
        *,
        pays:pays_id(id, nom, devise),
        ville:ville_id(id, nom),
        categorie:categorie_id(id, nom, icon, color)
      `)
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, structure: data });
  } catch (error) {
    console.error('POST admin/structures error:', error);
    return NextResponse.json({ error: 'Erreur serveur : ' + error.message }, { status: 500 });
  }
}
