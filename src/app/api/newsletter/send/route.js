import { NextResponse } from 'next/server';
import { sendBatchEmails, baseTemplate } from '@/lib/email';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://chezmonami.ma';

// ── Templates ─────────────────────────────────────────────────────────────────

function footerNewsletter() {
  return `
    <p>
      Vous recevez cet email car vous êtes abonné(e) à la newsletter de
      <a href="${siteUrl}">ChezMonAmi</a>.
    </p>
    <p>
      <a href="${siteUrl}/desinscription?email={{EMAIL}}">Me désabonner</a>
    </p>
  `;
}

function genererEmailAuto(item) {
  const estStructure = item.type === 'nouvelle_structure';
  const emoji = estStructure ? '🏢' : '📦';
  const titre = estStructure
    ? `Nouvelle entreprise : ${item.element_nom}`
    : `Nouveau produit : ${item.element_nom}`;
  const contenu = `<p>${
    item.description
      ? item.description.substring(0, 200) + (item.description.length > 200 ? '...' : '')
      : `Découvrez ${estStructure ? 'cette nouvelle entreprise' : 'ce nouveau produit'} sur notre plateforme.`
  }</p>`;

  return {
    sujet: estStructure
      ? `🏢 Nouvelle entreprise : ${item.element_nom}${item.secteur_activite ? ` — ${item.secteur_activite}` : ''}`
      : `📦 Nouveau produit : ${item.element_nom}${item.secteur_activite ? ` — Secteur ${item.secteur_activite}` : ''}`,
    html: baseTemplate({
      titre,
      emoji,
      badge: item.secteur_activite ? `🏷️ ${item.secteur_activite}` : undefined,
      contenu,
      ctaTexte: estStructure ? "Voir l'entreprise" : 'Voir le produit',
      ctaLien: `${siteUrl}${item.lien || ''}`,
      footer: footerNewsletter(),
    }),
    texte: estStructure
      ? `Nouvelle entreprise : ${item.element_nom}\n\n${item.description || ''}\n\nVoir : ${siteUrl}${item.lien || ''}`
      : `Nouveau produit : ${item.element_nom}\n\n${item.description || ''}\n\nVoir : ${siteUrl}${item.lien || ''}`,
  };
}

function genererEmailLibre(message) {
  return {
    sujet: message.sujet,
    html: baseTemplate({
      titre: message.sujet,
      contenu: `<p>${message.contenu.replace(/\n/g, '<br/>')}</p>`,
      footer: footerNewsletter(),
    }),
    texte: message.contenu,
  };
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

    // Ajout du lien de désinscription dans la version texte
    template.texte = `${template.texte}\n\nSe désabonner : ${siteUrl}/desinscription?email={{EMAIL}}`;

    const headersFor = (email) => {
      const lien = `${siteUrl}/desinscription?email=${encodeURIComponent(email)}`;
      return {
        'List-Unsubscribe': `<${lien}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        'X-Entity-Ref-ID': crypto.randomUUID(),
      };
    };

    const { envoyes, erreurs } = await sendBatchEmails({
      destinataires,
      subject: template.sujet,
      html: template.html,
      text: template.texte,
      headersFor,
      tag: type === 'libre' ? 'newsletter_libre' : 'newsletter_auto',
      pauseMs: 100,
    });

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
