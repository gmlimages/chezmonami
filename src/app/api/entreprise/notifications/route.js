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

    // Appels d'offres actifs sans réponse de cette société
    let nbAppels = 0;
    const maintenant = new Date().toISOString();
    const { data: appels } = await supabaseAdmin
      .from('appels_offres')
      .select('id, reponses_appels_offres(compte_id)')
      .eq('statut', 'actif')
      .gt('date_limite', maintenant);

    if (appels) {
      nbAppels = appels.filter(a =>
        !(a.reponses_appels_offres || []).some(r => r.compte_id === compte.id)
      ).length;
    }

    // Totaux pour les cartes stats du dashboard
    const [{ count: totalMessages }, { count: totalDocuments }] = await Promise.all([
      supabaseAdmin
        .from('messages_entreprises')
        .select('id', { count: 'exact', head: true })
        .eq('compte_id', compte.id),
      supabaseAdmin
        .from('documents_entreprises')
        .select('id', { count: 'exact', head: true })
        .eq('compte_id', compte.id),
    ]);

    return NextResponse.json({
      nb_messages: nbMessages || 0,
      nb_b2b: nbB2b,
      nb_appels: nbAppels,
      total_messages: totalMessages || 0,
      total_documents: totalDocuments || 0,
    });
  } catch (error) {
    console.error('GET entreprise notifications:', error);
    return NextResponse.json({ nb_messages: 0, nb_b2b: 0, nb_appels: 0, total_messages: 0, total_documents: 0 });
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
