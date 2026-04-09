import { NextResponse } from 'next/server';
import { supabaseAdmin, getCompteFromToken, hasFullAccess } from '@/lib/supabaseAdmin';

// GET — lister les conversations actives du compte
export async function GET(request) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    const compte = await getCompteFromToken(token);
    if (!compte) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const { data: conversations } = await supabaseAdmin
      .from('conversations_b2b')
      .select(`
        *,
        compte_a:compte_a_id(id, nom_contact, badge_verifie, structures(id, nom)),
        compte_b:compte_b_id(id, nom_contact, badge_verifie, structures(id, nom)),
        messages_b2b(id, created_at, lu_a, lu_b)
      `)
      .or(`compte_a_id.eq.${compte.id},compte_b_id.eq.${compte.id}`)
      .eq('active', true)
      .order('updated_at', { ascending: false });

    // Enrichir avec le nombre de messages non lus
    const convAvecInfos = (conversations || []).map(conv => {
      const estA = conv.compte_a_id === compte.id;
      const interlocuteur = estA ? conv.compte_b : conv.compte_a;
      const nonLus = (conv.messages_b2b || []).filter(m => estA ? !m.lu_a : !m.lu_b).length;
      return {
        ...conv,
        interlocuteur,
        nonLus,
      };
    });

    return NextResponse.json({ conversations: convAvecInfos });
  } catch (error) {
    console.error('GET conversations error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
