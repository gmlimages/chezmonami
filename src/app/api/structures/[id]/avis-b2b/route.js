// GET public — Avis B2B publiés pour une structure donnée
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(_request, { params }) {
  try {
    const { id } = await params;

    const { data, error } = await supabaseAdmin
      .from('avis_b2b')
      .select(`
        id, note, commentaire, created_at,
        auteur:auteur_compte_id(id, nom_contact, structures(id, nom))
      `)
      .eq('structure_id', id)
      .eq('statut', 'publie')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    const avis = (data || []).map((a) => ({
      id: a.id,
      note: a.note,
      commentaire: a.commentaire,
      created_at: a.created_at,
      auteur_nom: a.auteur?.structures?.[0]?.nom || a.auteur?.nom_contact || 'Anonyme',
    }));

    const totalNotes = avis.reduce((s, a) => s + a.note, 0);
    const moyenne = avis.length > 0 ? Math.round((totalNotes / avis.length) * 10) / 10 : 0;

    return NextResponse.json({
      avis,
      stats: { nombre: avis.length, moyenne },
    });
  } catch (err) {
    console.error('GET structures/[id]/avis-b2b error:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
