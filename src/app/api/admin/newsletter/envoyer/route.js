import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireAdmin } from '@/lib/adminAuth';

// POST — envoyer une notification depuis la file d'attente
// body: { itemId: string }
export async function POST(request) {
  const admin = await requireAdmin(request);
  if (admin instanceof Response) return admin;
  try {
    const { itemId } = await request.json();
    if (!itemId) return NextResponse.json({ error: 'itemId requis' }, { status: 400 });

    // Récupérer l'item de la queue
    const { data: item, error: errItem } = await supabaseAdmin
      .from('newsletter_queue')
      .select('*')
      .eq('id', itemId)
      .single();

    if (errItem || !item) {
      return NextResponse.json({ error: 'Item introuvable dans la file' }, { status: 404 });
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

    const preferenceKey = item.type === 'nouvelle_structure'
      ? 'nouvelles_structures'
      : 'nouveaux_produits';

    const destinataires = abonnes
      .filter(a => (a.preferences || {})[preferenceKey] !== false)
      .map(a => a.email);

    if (!destinataires.length) {
      return NextResponse.json({ success: false, error: 'Aucun abonné intéressé par ce type' });
    }

    // Marquer comme en cours
    await supabaseAdmin
      .from('newsletter_queue')
      .update({ statut: 'envoi_en_cours' })
      .eq('id', itemId);

    // Appel à la route d'envoi email
    const sendRes = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL}/api/newsletter/send`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'auto', item, destinataires }),
      }
    );
    const sendData = await sendRes.json();

    if (!sendData.success) {
      await supabaseAdmin
        .from('newsletter_queue')
        .update({ statut: 'erreur', erreur_detail: sendData.error })
        .eq('id', itemId);
      return NextResponse.json({ success: false, error: sendData.error }, { status: 500 });
    }

    // Marquer comme envoyé
    await supabaseAdmin
      .from('newsletter_queue')
      .update({
        statut: 'envoye',
        nb_destinataires: sendData.envoyes,
        envoye_at: new Date().toISOString(),
      })
      .eq('id', itemId);

    // Mettre à jour la date de dernière notification
    await supabaseAdmin
      .from('newsletter_abonnes')
      .update({ derniere_notification: new Date().toISOString() })
      .in('email', destinataires);

    return NextResponse.json({ success: true, envoyes: sendData.envoyes, echecs: sendData.echecs });
  } catch (err) {
    console.error('Erreur envoyer newsletter:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
