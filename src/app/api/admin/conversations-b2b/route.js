import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// GET — liste toutes les conversations B2B (lecture seule admin)
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('conversations_b2b')
      .select(`
        id, created_at, updated_at, active,
        compte_a:compte_a_id(id, nom_contact, structures(id, nom)),
        compte_b:compte_b_id(id, nom_contact, structures(id, nom)),
        messages_b2b(id, contenu, created_at, expediteur_id)
      `)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    const conversations = (data || []).map(conv => ({
      ...conv,
      nb_messages: conv.messages_b2b?.length || 0,
      dernier_message: conv.messages_b2b?.sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      )[0] || null,
    }));

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error('GET admin conversations-b2b:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
