import { NextResponse } from 'next/server';
import { supabaseAdmin, getCompteFromToken } from '@/lib/supabaseAdmin';

// GET — compter les notifications non lues pour la société
export async function GET(request) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    const compte = await getCompteFromToken(token);
    if (!compte) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    // Messages admin non lus (messages initiés par admin + réponses admin non consultées)
    const { count: nbMessages } = await supabaseAdmin
      .from('messages_entreprises')
      .select('id', { count: 'exact', head: true })
      .eq('compte_id', compte.id)
      .eq('lu_par_entreprise', false)
      .or('de_admin.eq.true,reponse_admin.not.is.null');

    // Conversations B2B non lues
    let nbB2b = 0;
    const { data: convs } = await supabaseAdmin
      .from('conversations_b2b')
      .select('id, compte_a_id, compte_b_id, messages_b2b(expediteur_id, lu)')
      .or(`compte_a_id.eq.${compte.id},compte_b_id.eq.${compte.id}`);

    if (convs) {
      convs.forEach(conv => {
        (conv.messages_b2b || []).forEach(msg => {
          if (msg.expediteur_id !== compte.id && !msg.lu) nbB2b++;
        });
      });
    }

    return NextResponse.json({
      nb_messages: nbMessages || 0,
      nb_b2b: nbB2b,
    });
  } catch (error) {
    console.error('GET entreprise notifications:', error);
    return NextResponse.json({ nb_messages: 0, nb_b2b: 0 });
  }
}

// PATCH — marquer tous les messages admin comme lus
export async function PATCH(request) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    const compte = await getCompteFromToken(token);
    if (!compte) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    await supabaseAdmin
      .from('messages_entreprises')
      .update({ lu_par_entreprise: true })
      .eq('compte_id', compte.id)
      .eq('lu_par_entreprise', false);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PATCH entreprise notifications:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
