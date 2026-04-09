import { NextResponse } from 'next/server';
import { supabaseAdmin, getCompteFromToken } from '@/lib/supabaseAdmin';

// DELETE — la société supprime l'un de ses propres messages
export async function DELETE(request, { params }) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    const compte = await getCompteFromToken(token);
    if (!compte) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const { id } = await params;

    // Vérifier que le message appartient bien à ce compte
    const { data: msg } = await supabaseAdmin
      .from('messages_entreprises')
      .select('id, compte_id, fichier_url')
      .eq('id', id)
      .single();

    if (!msg) return NextResponse.json({ error: 'Message introuvable' }, { status: 404 });
    if (msg.compte_id !== compte.id) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });

    // Supprimer le fichier attaché si présent
    if (msg.fichier_url) {
      await supabaseAdmin.storage.from('messages').remove([msg.fichier_url]).catch(() => {});
    }

    const { error } = await supabaseAdmin.from('messages_entreprises').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE message entreprise:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
