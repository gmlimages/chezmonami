// DELETE /api/entreprise/avis-b2b/[id] — l'auteur supprime son propre avis
import { NextResponse } from 'next/server';
import { supabaseAdmin, getCompteFromToken } from '@/lib/supabaseAdmin';

export async function DELETE(request, { params }) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    const compte = await getCompteFromToken(token);
    if (!compte) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const { id } = await params;

    const { data: avis } = await supabaseAdmin
      .from('avis_b2b')
      .select('id, auteur_compte_id')
      .eq('id', id)
      .maybeSingle();

    if (!avis) return NextResponse.json({ error: 'Avis introuvable' }, { status: 404 });
    if (avis.auteur_compte_id !== compte.id) {
      return NextResponse.json({ error: 'Action non autorisée' }, { status: 403 });
    }

    const { error } = await supabaseAdmin.from('avis_b2b').delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE avis-b2b error:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
