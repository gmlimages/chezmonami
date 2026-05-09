// Module centralisé d'envoi d'emails via Resend.
// ----------------------------------------------------------------------------
// Usage :
//   import { sendEmail, baseTemplate } from '@/lib/email';
//   await sendEmail({
//     to: 'client@example.com',
//     subject: '✅ Bienvenue !',
//     html: baseTemplate({ titre: 'Bienvenue', contenu: '<p>...</p>', ctaTexte: 'Voir', ctaLien: '...' }),
//     text: 'Bienvenue …',
//   });
//
// Toutes les erreurs sont LOGGÉES (status + body Resend) — plus de "warning silencieux".
// La fonction NE LANCE PAS d'exception : elle retourne { ok, status, error } pour que
// l'API n'échoue pas si l'email plante (un compte créé doit rester créé).

const RESEND_URL = 'https://api.resend.com/emails';

// Adresses par défaut (utilisées si non passées en paramètre)
function getFrom(custom) {
  if (custom) return custom;
  return process.env.RESEND_FROM || 'Équipe ChezMonAmi <noreply@chezmonami.ma>';
}

function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || 'https://chezmonami.ma';
}

/**
 * Envoie un email via Resend.
 * @param {object} opts
 * @param {string|string[]} opts.to       — destinataire(s)
 * @param {string} opts.subject
 * @param {string} opts.html
 * @param {string} [opts.text]            — version texte brut (recommandé anti-spam)
 * @param {string} [opts.from]            — override de l'expéditeur
 * @param {string|string[]} [opts.replyTo]
 * @param {string|string[]} [opts.cc]
 * @param {string|string[]} [opts.bcc]
 * @param {object} [opts.headers]         — ex: { 'List-Unsubscribe': '<...>' }
 * @param {string} [opts.tag]             — étiquette pour les logs (ex: 'validation_compte')
 * @returns {Promise<{ok:boolean, status?:number, id?:string, error?:string}>}
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
  from,
  replyTo,
  cc,
  bcc,
  headers,
  tag = 'generic',
}) {
  if (!process.env.RESEND_API_KEY) {
    console.error(`[email:${tag}] RESEND_API_KEY manquante — email non envoyé`);
    return { ok: false, error: 'RESEND_API_KEY manquante' };
  }
  if (!to || !subject || !html) {
    console.error(`[email:${tag}] paramètres manquants (to/subject/html)`);
    return { ok: false, error: 'paramètres manquants' };
  }

  const payload = {
    from: getFrom(from),
    to: Array.isArray(to) ? to : [to],
    subject,
    html,
  };
  if (text) payload.text = text;
  if (replyTo) payload.reply_to = replyTo;
  if (cc) payload.cc = cc;
  if (bcc) payload.bcc = bcc;
  if (headers) payload.headers = headers;

  try {
    const res = await fetch(RESEND_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      console.error(
        `[email:${tag}] Resend ${res.status} ${res.statusText} →`,
        data?.message || data?.name || JSON.stringify(data),
      );
      return {
        ok: false,
        status: res.status,
        error: data?.message || `HTTP ${res.status}`,
      };
    }

    return { ok: true, status: res.status, id: data?.id };
  } catch (err) {
    console.error(`[email:${tag}] exception →`, err.message);
    return { ok: false, error: err.message };
  }
}

/**
 * Envoie un même email à plusieurs destinataires (1 par 1 avec rate limiting léger).
 * Utilisé pour la newsletter. Retourne { envoyes, erreurs }.
 *
 * @param {object} opts
 * @param {string[]} opts.destinataires
 * @param {string} opts.subject
 * @param {string} opts.html             — peut contenir {{EMAIL}} qui sera remplacé
 * @param {string} [opts.text]
 * @param {object} [opts.headers]
 * @param {string} [opts.tag]
 * @param {(email:string)=>object} [opts.headersFor]  — headers dynamiques par destinataire
 */
export async function sendBatchEmails({
  destinataires,
  subject,
  html,
  text,
  headers,
  tag = 'batch',
  headersFor,
  pauseMs = 100,
}) {
  let envoyes = 0;
  const erreurs = [];

  for (const email of destinataires) {
    const personalHtml = html.replace(/\{\{EMAIL\}\}/g, encodeURIComponent(email));
    const personalText = text
      ? text.replace(/\{\{EMAIL\}\}/g, encodeURIComponent(email))
      : undefined;

    const result = await sendEmail({
      to: email,
      subject,
      html: personalHtml,
      text: personalText,
      headers: headersFor ? headersFor(email) : headers,
      tag,
    });

    if (result.ok) {
      envoyes++;
    } else {
      erreurs.push({ email, raison: result.error });
    }
    // Pause anti-rate-limit
    if (pauseMs > 0) await new Promise((r) => setTimeout(r, pauseMs));
  }

  return { envoyes, erreurs };
}

// ─────────────────────────────────────────────────────────────────────────────
// Template HTML de base — partagé par tous les emails du projet.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Construit le HTML d'un email avec la charte ChezMonAmi.
 *
 * @param {object} opts
 * @param {string} opts.titre            — affiché dans l'en-tête vert
 * @param {string} [opts.emoji]          — préfixé au titre
 * @param {string} opts.contenu          — HTML brut du corps (paragraphes, listes…)
 * @param {string} [opts.preheader]      — texte court visible dans l'aperçu (avant ouverture)
 * @param {string} [opts.ctaTexte]       — bouton d'action principal
 * @param {string} [opts.ctaLien]
 * @param {string} [opts.badge]          — petite étiquette sous l'en-tête
 * @param {string} [opts.highlight]      — bloc encadré vert
 * @param {string} [opts.footer]         — texte additionnel dans le footer (ex: lien désinscription)
 */
export function baseTemplate({
  titre,
  emoji,
  contenu,
  preheader,
  ctaTexte,
  ctaLien,
  badge,
  highlight,
  footer,
}) {
  const siteUrl = getSiteUrl();
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${titre}</title>
  <style>
    body { font-family: Arial, sans-serif; background:#f4f4f4; margin:0; padding:0; }
    .container { max-width:600px; margin:30px auto; background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.05); }
    .header { background:#2e7d32; padding:30px 24px; text-align:center; }
    .header h1 { color:#fff; margin:0; font-size:22px; line-height:1.4; }
    .body { padding:30px 24px; color:#333; line-height:1.7; font-size:15px; }
    .body p { margin:0 0 14px; }
    .badge { display:inline-block; background:#e8f5e9; color:#2e7d32; padding:4px 12px; border-radius:20px; font-size:13px; margin-bottom:16px; font-weight:600; }
    .highlight { background:#e8f5e9; border-left:4px solid #2e7d32; padding:14px 16px; border-radius:4px; margin:16px 0; }
    .cta { display:inline-block; margin-top:18px; padding:13px 30px; background:#2e7d32; color:#fff !important; text-decoration:none; border-radius:8px; font-weight:bold; font-size:15px; }
    .footer { background:#f9f9f9; padding:20px; text-align:center; font-size:12px; color:#999; border-top:1px solid #eee; }
    .footer a { color:#999; text-decoration:underline; }
    .preheader { display:none !important; visibility:hidden; opacity:0; color:transparent; height:0; width:0; }
  </style>
</head>
<body>
  ${preheader ? `<div class="preheader">${preheader}</div>` : ''}
  <div class="container">
    <div class="header">
      <h1>${emoji ? `${emoji} ` : ''}${titre}</h1>
    </div>
    <div class="body">
      ${badge ? `<p><span class="badge">${badge}</span></p>` : ''}
      ${contenu}
      ${highlight ? `<div class="highlight">${highlight}</div>` : ''}
      ${ctaTexte && ctaLien
        ? `<p style="text-align:center;"><a href="${ctaLien}" class="cta">${ctaTexte}</a></p>`
        : ''}
    </div>
    <div class="footer">
      ${footer || ''}
      <p style="margin:8px 0 4px;">
        <a href="${siteUrl}" style="color:#2e7d32;font-weight:bold;">ChezMonAmi</a> —
        Votre annuaire panafricain de confiance
      </p>
      <p style="color:#bbb;font-size:11px;margin:4px 0 0;">${siteUrl.replace(/^https?:\/\//, '')}</p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Petit helper pour produire la version texte d'un email à partir des morceaux.
 */
export function baseText({ titre, contenu, ctaTexte, ctaLien }) {
  const siteUrl = getSiteUrl();
  let out = `${titre}\n\n${contenu}\n`;
  if (ctaTexte && ctaLien) out += `\n${ctaTexte} : ${ctaLien}\n`;
  out += `\n— ChezMonAmi (${siteUrl})`;
  return out;
}
