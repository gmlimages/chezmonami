import { NextResponse } from 'next/server';
import { supabaseAdmin, getCompteFromToken } from '@/lib/supabaseAdmin';

// DELETE — suppression douce côté société (masque le message, ne supprime pas en DB)
export async function DELETE(request, { params }) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    const compte = await getCompteFromToken(token);
    if (!compte) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const { id } = await params;

    // Vérifier que le message appartient bien à ce compte
    const { data: msg } = await supabaseAdmin
      .from('messages_entreprises')
      .select('id, compte_id')
      .eq('id', id)
      .single();

    if (!msg) return NextResponse.json({ error: 'Message introuvable' }, { status: 404 });
    if (msg.compte_id !== compte.id) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });

    // Suppression douce : on masque le message côté société sans le supprimer
    const { error } = await supabaseAdmin
      .from('messages_entreprises')
      .update({ supprime_par_societe: true })
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE message entreprise:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
