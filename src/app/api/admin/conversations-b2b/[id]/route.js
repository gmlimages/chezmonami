import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// DELETE — supprimer une conversation B2B et tous ses messages (admin uniquement)
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    // 1. Vérifier que la conversation existe
    const { data: conv, error: fetchError } = await supabaseAdmin
      .from('conversations_b2b')
      .select('id, demande_id, compte_a_id, compte_b_id')
      .eq('id', id)
      .single();

    if (fetchError || !conv) {
      return NextResponse.json({ error: 'Conversation introuvable' }, { status: 404 });
    }

    // 2. Supprimer tous les messages de la conversation
    const { error: msgError } = await supabaseAdmin
      .from('messages_b2b')
      .delete()
      .eq('conversation_id', id);

    if (msgError) throw msgError;

    // 3. Supprimer la conversation
    const { error: convError } = await supabaseAdmin
      .from('conversations_b2b')
      .delete()
      .eq('id', id);

    if (convError) throw convError;

    // 4. Mettre à jour la demande liée (retour à "en_attente" pour laisser trace)
    if (conv.demande_id) {
      await supabaseAdmin
        .from('demandes_contact')
        .update({ statut: 'refusee', note_admin: 'Conversation supprimée par l\'administration.' })
        .eq('id', conv.demande_id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE conversation B2B admin error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
