import { NextResponse } from 'next/server';
import { supabaseAdmin, getCompteFromToken, hasFullAccess } from '@/lib/supabaseAdmin';

// GET — récupérer les messages d'une conversation
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    const compte = await getCompteFromToken(token);
    if (!compte) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    // Vérifier que le compte fait partie de cette conversation
    const { data: conv } = await supabaseAdmin
      .from('conversations_b2b')
      .select(`
        *,
        compte_a:compte_a_id(id, nom_contact, badge_verifie, structures(id, nom)),
        compte_b:compte_b_id(id, nom_contact, badge_verifie, structures(id, nom))
      `)
      .eq('id', id)
      .or(`compte_a_id.eq.${compte.id},compte_b_id.eq.${compte.id}`)
      .single();

    if (!conv) return NextResponse.json({ error: 'Conversation introuvable' }, { status: 404 });

    // Si abonnement expiré, bloquer l'accès
    if (!hasFullAccess(compte)) {
      return NextResponse.json(
        { error: 'Abonnement requis pour accéder aux conversations', code: 'ABONNEMENT_REQUIS' },
        { status: 403 }
      );
    }

    // Récupérer les messages
    const { data: messages } = await supabaseAdmin
      .from('messages_b2b')
      .select('*')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true });

    // Marquer les messages comme lus
    const estA = conv.compte_a_id === compte.id;
    const champLu = estA ? 'lu_a' : 'lu_b';
    await supabaseAdmin
      .from('messages_b2b')
      .update({ [champLu]: true })
      .eq('conversation_id', id)
      .neq('expediteur_id', compte.id);

    const interlocuteur = estA ? conv.compte_b : conv.compte_a;

    return NextResponse.json({ conversation: conv, messages: messages || [], interlocuteur });
  } catch (error) {
    console.error('GET conversation error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST — envoyer un message dans la conversation
export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    const compte = await getCompteFromToken(token);
    if (!compte) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    // Bloquer si abonnement inactif
    if (!hasFullAccess(compte)) {
      return NextResponse.json(
        { error: 'Abonnement requis pour envoyer des messages', code: 'ABONNEMENT_REQUIS' },
        { status: 403 }
      );
    }

    // Vérifier que le compte fait partie de la conversation et qu'elle est active
    const { data: conv } = await supabaseAdmin
      .from('conversations_b2b')
      .select('id, compte_a_id, compte_b_id, active')
      .eq('id', id)
      .or(`compte_a_id.eq.${compte.id},compte_b_id.eq.${compte.id}`)
      .single();

    if (!conv) return NextResponse.json({ error: 'Conversation introuvable' }, { status: 404 });
    if (!conv.active) return NextResponse.json({ error: 'Cette conversation est suspendue' }, { status: 403 });

    const { contenu } = await request.json();
    if (!contenu?.trim()) return NextResponse.json({ error: 'Message vide' }, { status: 400 });

    const estA = conv.compte_a_id === compte.id;

    // Créer le message
    const { data: message, error } = await supabaseAdmin
      .from('messages_b2b')
      .insert({
        conversation_id: id,
        expediteur_id: compte.id,
        contenu: contenu.trim(),
        lu_a: estA,       // lu par l'expéditeur directement
        lu_b: !estA,
      })
      .select()
      .single();

    if (error) throw error;

    // Mettre à jour updated_at de la conversation
    await supabaseAdmin
      .from('conversations_b2b')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', id);

    return NextResponse.json({ success: true, message }, { status: 201 });
  } catch (error) {
    console.error('POST message b2b error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
