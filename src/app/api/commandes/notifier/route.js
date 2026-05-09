import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { sendEmail, baseTemplate, baseText } from '@/lib/email';

// POST /api/commandes/notifier  { commande_id }
// Envoie l'email de confirmation au client (si email fourni) + notification à la boutique.
export async function POST(request) {
  try {
    const { commande_id } = await request.json();
    if (!commande_id) {
      return NextResponse.json({ error: 'commande_id requis' }, { status: 400 });
    }

    const { data: commande, error } = await supabaseAdmin
      .from('commandes')
      .select('*')
      .eq('id', commande_id)
      .single();

    if (error || !commande) {
      return NextResponse.json({ error: 'Commande introuvable' }, { status: 404 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://chezmonami.ma';
    const numero = commande.numero_commande || commande.id;
    const total = `${commande.montant_total} ${commande.devise || ''}`.trim();
    const lignesProduits = (commande.produits || [])
      .map((p) => `<li>${p.quantite || 1} × <strong>${p.nom}</strong> — ${p.prix}</li>`)
      .join('');
    const lignesText = (commande.produits || [])
      .map((p) => `- ${p.quantite || 1} x ${p.nom} (${p.prix})`)
      .join('\n');

    // ── Email au client ─────────────────────────────────────────────
    if (commande.client_email && commande.client_email !== 'Non fourni') {
      const titreCli = 'Commande reçue !';
      const contenuCli = `
        <p>Bonjour <strong>${commande.client_nom}</strong>,</p>
        <p>Nous avons bien reçu votre commande <strong>#${numero}</strong>.</p>
        <p><strong>Vos articles :</strong></p>
        <ul>${lignesProduits}</ul>
        <p><strong>Total :</strong> ${total}</p>
      `;
      const highlightCli = `
        <strong>Prochaines étapes :</strong><br/>
        La boutique prend contact avec vous (${commande.client_telephone || 'téléphone non fourni'}) pour confirmer la livraison et le paiement.
      `;

      await sendEmail({
        to: commande.client_email,
        subject: `✅ Commande #${numero} reçue — ChezMonAmi`,
        html: baseTemplate({
          titre: titreCli,
          emoji: '✅',
          preheader: `Votre commande #${numero} a bien été enregistrée`,
          contenu: contenuCli,
          highlight: highlightCli,
          ctaTexte: 'Suivre ma commande',
          ctaLien: `${siteUrl}/mes-commandes`,
        }),
        text: baseText({
          titre: titreCli,
          contenu: `Bonjour ${commande.client_nom},\n\nVotre commande #${numero} a été enregistrée.\n\nArticles :\n${lignesText}\n\nTotal : ${total}`,
          ctaTexte: 'Suivre ma commande',
          ctaLien: `${siteUrl}/mes-commandes`,
        }),
        tag: 'commande_confirmation_client',
      });
    }

    // ── Email à la boutique (premier produit pour retrouver la structure) ─
    const premierProduitId = commande.produits?.[0]?.id;
    if (premierProduitId) {
      const { data: produit } = await supabaseAdmin
        .from('produits')
        .select('structure_id, structures(nom, comptes_structures(email, nom_contact))')
        .eq('id', premierProduitId)
        .maybeSingle();

      const compte = produit?.structures?.comptes_structures?.[0];
      if (compte?.email) {
        const titreBou = 'Nouvelle commande reçue !';
        const contenuBou = `
          <p>Bonjour <strong>${compte.nom_contact}</strong>,</p>
          <p>Vous avez reçu une nouvelle commande <strong>#${numero}</strong>.</p>
          <p><strong>Client :</strong> ${commande.client_nom}<br/>
          <strong>Téléphone :</strong> ${commande.client_telephone}<br/>
          <strong>Email :</strong> ${commande.client_email}<br/>
          <strong>Adresse :</strong> ${commande.client_adresse}</p>
          <p><strong>Articles :</strong></p>
          <ul>${lignesProduits}</ul>
          <p><strong>Total :</strong> ${total}</p>
          ${commande.client_message ? `<p><em>Message du client :</em> ${commande.client_message}</p>` : ''}
        `;

        await sendEmail({
          to: compte.email,
          subject: `🛒 Nouvelle commande #${numero} — ChezMonAmi`,
          html: baseTemplate({
            titre: titreBou,
            emoji: '🛒',
            preheader: `Commande #${numero} de ${commande.client_nom}`,
            contenu: contenuBou,
            ctaTexte: 'Voir la commande',
            ctaLien: `${siteUrl}/entreprise/dashboard/commandes`,
          }),
          text: baseText({
            titre: titreBou,
            contenu: `Nouvelle commande #${numero}\nClient : ${commande.client_nom} (${commande.client_telephone})\nTotal : ${total}\n\n${lignesText}`,
            ctaTexte: 'Voir la commande',
            ctaLien: `${siteUrl}/entreprise/dashboard/commandes`,
          }),
          tag: 'commande_notification_boutique',
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('POST /api/commandes/notifier:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
