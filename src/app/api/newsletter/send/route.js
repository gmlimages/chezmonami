import { NextResponse } from 'next/server';

// ── Templates ─────────────────────────────────────────────────────────────────

function genererEmailAuto(item) {
  const estStructure = item.type === 'nouvelle_structure';
  const emoji = estStructure ? '🏢' : '📦';
  const titre = estStructure
    ? `Nouvelle entreprise : ${item.element_nom}`
    : `Nouveau produit : ${item.element_nom}`;

  return {
    sujet: estStructure
      ? `🏢 Nouvelle entreprise : ${item.element_nom}${item.secteur_activite ? ` — ${item.secteur_activite}` : ''}`
      : `📦 Nouveau produit : ${item.element_nom}${item.secteur_activite ? ` — Secteur ${item.secteur_activite}` : ''}`,
    html: genererHTML({
      titre,
      emoji,
      badge: item.secteur_activite ? `🏷️ Secteur : ${item.secteur_activite}` : null,
      contenu: item.description
        ? item.description.substring(0, 200) + (item.description.length > 200 ? '...' : '')
        : `Découvrez ${estStructure ? 'cette nouvelle entreprise' : 'ce nouveau produit'} sur notre plateforme.`,
      ctaTexte: estStructure ? "Voir l'entreprise" : 'Voir le produit',
      ctaLien: `${process.env.NEXT_PUBLIC_SITE_URL}${item.lien || ''}`,
    }),
    texte: estStructure
      ? `Nouvelle entreprise : ${item.element_nom}\n\n${item.description || ''}\n\nVoir : ${process.env.NEXT_PUBLIC_SITE_URL}${item.lien || ''}`
      : `Nouveau produit : ${item.element_nom}\n\n${item.description || ''}\n\nVoir : ${process.env.NEXT_PUBLIC_SITE_URL}${item.lien || ''}`,
  };
}

function genererEmailLibre(message) {
  return {
    sujet: message.sujet,
    html: genererHTML({
      titre: message.sujet,
      emoji: null,
      badge: null,
      contenu: message.contenu.replace(/\n/g, '<br/>'),
      ctaTexte: null,
      ctaLien: null,
    }),
    texte: message.contenu,
  };
}

function genererHTML({ titre, emoji, badge, contenu, ctaTexte, ctaLien }) {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${titre}</title>
  <style>
    body { font-family: Arial, sans-serif; background:#f4f4f4; margin:0; padding:0; }
    .container { max-width:600px; margin:30px auto; background:#fff; border-radius:12px; overflow:hidden; }
    .header { background:#2e7d32; padding:30px; text-align:center; }
    .header h1 { color:#fff; margin:0; font-size:20px; line-height:1.4; }
    .body { padding:30px; color:#333; line-height:1.8; font-size:15px; }
    .badge { display:inline-block; background:#e8f5e9; color:#2e7d32; padding:4px 12px; border-radius:20px; font-size:13px; margin-bottom:16px; }
    .cta { display:inline-block; margin-top:20px; padding:12px 28px; background:#2e7d32; color:#ffffff; text-decoration:none; border-radius:8px; font-weight:bold; font-size:15px; }
    .footer { background:#f9f9f9; padding:20px; text-align:center; font-size:12px; color:#999; border-top:1px solid #eee; }
    .footer a { color:#999; text-decoration:underline; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${emoji ? `${emoji} ` : ''}${titre}</h1>
    </div>
    <div class="body">
      ${badge ? `<p><span class="badge">${badge}</span></p>` : ''}
      <p>${contenu}</p>
      ${ctaTexte && ctaLien
        ? `<p><a href="${ctaLien}" class="cta">${ctaTexte}</a></p>`
        : ''}
    </div>
    <div class="footer">
      <p>
        Vous recevez cet email car vous êtes abonné(e) à la newsletter de
        <a href="${process.env.NEXT_PUBLIC_SITE_URL}">ChezMonAmi</a>.
      </p>
      <p>
        <a href="${process.env.NEXT_PUBLIC_SITE_URL}/desinscription?email={{EMAIL}}">
          Me désabonner
        </a>
      </p>
      <p style="color:#bbb;font-size:11px;">ChezMonAmi — chezmonami.ma</p>
    </div>
  </div>
</body>
</html>`;
}

// ── Envoi via Resend ──────────────────────────────────────────────────────────

async function envoyerViaResend(destinataires, sujet, html, texte) {
  const erreurs = [];
  let envoyes = 0;
  const BATCH_SIZE = 50;

  for (let i = 0; i < destinataires.length; i += BATCH_SIZE) {
    const batch = destinataires.slice(i, i + BATCH_SIZE);

    for (const email of batch) {
      const htmlPersonnalise = html.replace(
        /\{\{EMAIL\}\}/g,
        encodeURIComponent(email)
      );
      const lienDesinscription =
        `${process.env.NEXT_PUBLIC_SITE_URL}/desinscription?email=${encodeURIComponent(email)}`;

      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: process.env.RESEND_FROM,
            to: [email],
            subject: sujet,
            html: htmlPersonnalise,
            // ✅ Version texte brut — réduit le score spam
            text: texte + `\n\nSe désabonner : ${lienDesinscription}`,
            // ✅ Headers anti-spam — Gmail affiche bouton désabonnement natif
            headers: {
              'List-Unsubscribe': `<${lienDesinscription}>`,
              'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
              'X-Entity-Ref-ID': crypto.randomUUID(),
            },
          }),
        });

        if (response.ok) {
          envoyes++;
        } else {
          const err = await response.json();
          erreurs.push({ email, raison: err.message || 'Erreur Resend' });
        }

        // Pause entre envois
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (err) {
        erreurs.push({ email, raison: err.message });
      }
    }
  }

  if (envoyes === 0 && erreurs.length > 0) {
    throw new Error(`Tous les envois ont échoué : ${erreurs[0].raison}`);
  }

  return { envoyes, erreurs };
}

// ── Handler POST ──────────────────────────────────────────────────────────────

export async function POST(request) {
  try {
    const body = await request.json();
    const { type, item, message, destinataires } = body;

    if (!destinataires?.length) {
      return NextResponse.json(
        { success: false, error: 'Aucun destinataire fourni' },
        { status: 400 }
      );
    }

    let template;
    if (type === 'libre') {
      if (!message?.sujet || !message?.contenu) {
        return NextResponse.json(
          { success: false, error: 'Sujet et contenu requis' },
          { status: 400 }
        );
      }
      template = genererEmailLibre(message);
    } else {
      if (!item) {
        return NextResponse.json(
          { success: false, error: 'Item requis pour un envoi automatique' },
          { status: 400 }
        );
      }
      template = genererEmailAuto(item);
    }

    const { envoyes, erreurs } = await envoyerViaResend(
      destinataires,
      template.sujet,
      template.html,
      template.texte
    );

    return NextResponse.json({
      success: true,
      envoyes,
      echecs: erreurs.length,
      erreurs,
    });

  } catch (error) {
    console.error('❌ Erreur route newsletter:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}