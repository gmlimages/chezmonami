import { supabase } from '@/lib/supabase';

// ── Envoi automatique (nouveau produit / nouvelle structure) ──────────────────

export async function envoyerNotificationNewsletter(item) {
  const { data: abonnes, error } = await supabase
    .from('newsletter_abonnes')
    .select('email, preferences')
    .eq('actif', true);

  if (error) throw new Error(`Erreur récupération abonnés : ${error.message}`);
  if (!abonnes?.length) return { success: false, reason: 'Aucun abonné actif' };

  const preferenceKey = item.type === 'nouvelle_structure'
    ? 'nouvelles_structures'
    : 'nouveaux_produits';

  const destinataires = abonnes
    .filter(a => (a.preferences || {})[preferenceKey] !== false)
    .map(a => a.email);

  if (!destinataires.length) {
    return { success: false, reason: 'Aucun abonné intéressé par ce type' };
  }

  await supabase
    .from('newsletter_queue')
    .update({ statut: 'envoi_en_cours' })
    .eq('id', item.id);

  const response = await fetch('/api/newsletter/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'auto', item, destinataires }),
  });

  const data = await response.json();

  if (!data.success) {
    await supabase
      .from('newsletter_queue')
      .update({ statut: 'erreur', erreur_detail: data.error })
      .eq('id', item.id);
    throw new Error(data.error);
  }

  await supabase
    .from('newsletter_queue')
    .update({
      statut: 'envoye',
      nb_destinataires: data.envoyes,
      envoye_at: new Date().toISOString(),
    })
    .eq('id', item.id);

  await supabase
    .from('newsletter_abonnes')
    .update({ derniere_notification: new Date().toISOString() })
    .in('email', destinataires);

  return { success: true, envoyes: data.envoyes, echecs: data.echecs };
}

// ── Envoi message libre ───────────────────────────────────────────────────────

export async function envoyerMessageLibre({ sujet, contenu, cible }) {
  // cible : 'tous' | 'preferences_structures' | 'preferences_produits' | 'preferences_promos'
  const { data: abonnes, error } = await supabase
    .from('newsletter_abonnes')
    .select('email, preferences')
    .eq('actif', true);

  if (error) throw new Error(`Erreur récupération abonnés : ${error.message}`);
  if (!abonnes?.length) return { success: false, reason: 'Aucun abonné actif' };

  // Filtrage selon la cible choisie
  let destinataires;
  if (cible === 'tous') {
    destinataires = abonnes.map(a => a.email);
  } else if (cible === 'preferences_structures') {
    destinataires = abonnes
      .filter(a => (a.preferences || {}).nouvelles_structures !== false)
      .map(a => a.email);
  } else if (cible === 'preferences_produits') {
    destinataires = abonnes
      .filter(a => (a.preferences || {}).nouveaux_produits !== false)
      .map(a => a.email);
  } else if (cible === 'preferences_promos') {
    destinataires = abonnes
      .filter(a => (a.preferences || {}).promotions !== false)
      .map(a => a.email);
  } else {
    destinataires = abonnes.map(a => a.email);
  }

  if (!destinataires.length) {
    return { success: false, reason: 'Aucun destinataire pour cette cible' };
  }

  const response = await fetch('/api/newsletter/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'libre',
      message: { sujet, contenu },
      destinataires,
    }),
  });

  const data = await response.json();
  if (!data.success) throw new Error(data.error);

  return { success: true, envoyes: data.envoyes, echecs: data.echecs };
}