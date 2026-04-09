import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// POST — envoyer un message libre aux abonnés
// body: { sujet, contenu, cible }
export async function POST(request) {
  try {
    const { sujet, contenu, cible } = await request.json();

    if (!sujet?.trim() || !contenu?.trim()) {
      return NextResponse.json({ error: 'Sujet et contenu requis' }, { status: 400 });
    }

    // Récupérer les abonnés actifs
    const { data: abonnes, error: errAb } = await supabaseAdmin
      .from('newsletter_abonnes')
      .select('email, preferences')
      .eq('actif', true);

    if (errAb) throw errAb;
    if (!abonnes?.length) {
      return NextResponse.json({ success: false, error: 'Aucun abonné actif' });
    }

    // Filtrage selon la cible
    let destinataires;
    if (cible === 'tous') {
      destinataires = abonnes.map(a => a.email);
    } else if (cible === 'preferences_structures') {
      destinataires = abonnes.filter(a => (a.preferences || {}).nouvelles_structures !== false).map(a => a.email);
    } else if (cible === 'preferences_produits') {
      destinataires = abonnes.filter(a => (a.preferences || {}).nouveaux_produits !== false).map(a => a.email);
    } else if (cible === 'preferences_promos') {
      destinataires = abonnes.filter(a => (a.preferences || {}).promotions !== false).map(a => a.email);
    } else {
      destinataires = abonnes.map(a => a.email);
    }

    if (!destinataires.length) {
      return NextResponse.json({ success: false, error: 'Aucun destinataire pour cette cible' });
    }

    // Appel à la route d'envoi email
    const sendRes = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL}/api/newsletter/send`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'libre', message: { sujet, contenu }, destinataires }),
      }
    );
    const sendData = await sendRes.json();

    if (!sendData.success) {
      return NextResponse.json({ success: false, error: sendData.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, envoyes: sendData.envoyes, echecs: sendData.echecs });
  } catch (err) {
    console.error('Erreur message-libre newsletter:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
