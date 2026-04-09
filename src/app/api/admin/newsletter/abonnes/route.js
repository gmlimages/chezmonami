import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// GET — liste des abonnés + stats
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const statsOnly = searchParams.get('stats') === '1';

    if (statsOnly) {
      const [{ data: ab }, { data: queue }] = await Promise.all([
        supabaseAdmin.from('newsletter_abonnes').select('actif'),
        supabaseAdmin.from('newsletter_queue').select('statut'),
      ]);
      return NextResponse.json({
        total:      ab?.length || 0,
        actifs:     ab?.filter(a => a.actif).length || 0,
        inactifs:   ab?.filter(a => !a.actif).length || 0,
        en_attente: queue?.filter(q => q.statut === 'en_attente').length || 0,
        envoyes:    queue?.filter(q => q.statut === 'envoye').length || 0,
      });
    }

    const { data, error } = await supabaseAdmin
      .from('newsletter_abonnes')
      .select('id, email, nom, actif, date_inscription, derniere_notification, preferences')
      .order('date_inscription', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ abonnes: data || [] });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
