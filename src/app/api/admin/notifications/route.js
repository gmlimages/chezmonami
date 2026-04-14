import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// GET — compter les badges admin : messages non traités, documents en attente, réponses appels d'offres
export async function GET() {
  try {
    const [messagesRes, docsRes, appelsRes] = await Promise.all([
      supabaseAdmin
        .from('messages_entreprises')
        .select('id', { count: 'exact', head: true })
        .eq('statut', 'nouveau')
        .eq('de_admin', false),
      supabaseAdmin
        .from('documents_entreprises')
        .select('id', { count: 'exact', head: true })
        .eq('statut', 'en_attente'),
      supabaseAdmin
        .from('reponses_appels_offres')
        .select('id', { count: 'exact', head: true }),
    ]);

    return NextResponse.json({
      nb_messages: messagesRes.count || 0,
      nb_docs: docsRes.count || 0,
      nb_appels: appelsRes.count || 0,
    });
  } catch (error) {
    console.error('GET admin notifications:', error);
    return NextResponse.json({ nb_messages: 0, nb_docs: 0, nb_appels: 0 });
  }
}
