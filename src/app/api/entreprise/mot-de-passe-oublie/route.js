import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { rateLimit } from '@/lib/rateLimit';
import { sendEmail, baseTemplate, baseText } from '@/lib/email';
import crypto from 'crypto';

// POST /api/entreprise/mot-de-passe-oublie  { email }
// Génère un token de réinitialisation, l'enregistre, et envoie un email.
// Réponse identique que l'email existe ou non (anti-énumération).
export async function POST(request) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown';
    const rl = rateLimit(`reset:${ip}`, { limit: 5, windowMs: 60 * 60_000 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Trop de tentatives. Réessayez plus tard.' },
        { status: 429 }
      );
    }

    const { email } = await request.json();
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Email invalide' }, { status: 400 });
    }

    const emailNorm = email.toLowerCase().trim();
    const { data: compte } = await supabaseAdmin
      .from('comptes_structures')
      .select('id, email, nom_contact, statut')
      .eq('email', emailNorm)
      .maybeSingle();

    // Email inconnu → message clair invitant à créer un compte
    if (!compte) {
      return NextResponse.json(
        {
          success: false,
          code: 'EMAIL_INCONNU',
          error: "Cet email n'est lié à aucun compte. Veuillez créer un compte entreprise.",
        },
        { status: 404 }
      );
    }

    // Compte suspendu → message dédié
    if (compte.statut === 'suspendu') {
      return NextResponse.json(
        {
          success: false,
          code: 'COMPTE_SUSPENDU',
          error: 'Votre compte est suspendu. Contactez l\'administration.',
        },
        { status: 403 }
      );
    }

    const token = crypto.randomUUID();
    const expire = new Date(Date.now() + 60 * 60_000).toISOString(); // 1h

    const { error: updErr } = await supabaseAdmin
      .from('comptes_structures')
      .update({ reset_token: token, reset_token_expire: expire })
      .eq('id', compte.id);

    if (updErr) {
      console.error('Erreur stockage reset_token:', updErr);
      return NextResponse.json(
        { success: false, error: 'Erreur serveur, veuillez réessayer.' },
        { status: 500 }
      );
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://chezmonami.ma';
    const resetUrl = `${siteUrl}/entreprise/reinitialiser/${token}`;
    const titre = 'Réinitialisation du mot de passe';
    const contenu = `
      <p>Bonjour <strong>${compte.nom_contact}</strong>,</p>
      <p>Vous avez demandé la réinitialisation du mot de passe de votre compte ChezMonAmi.</p>
      <p>Cliquez sur le bouton ci-dessous pour définir un nouveau mot de passe. Ce lien est valable <strong>1 heure</strong>.</p>
    `;
    const highlight = `
      <strong>⚠️ Sécurité :</strong> si vous n'êtes pas à l'origine de cette demande, ignorez cet email.
      Votre mot de passe actuel reste inchangé tant que vous n'utilisez pas le lien.
    `;

    await sendEmail({
      to: compte.email,
      subject: '🔐 Réinitialisation de votre mot de passe ChezMonAmi',
      html: baseTemplate({
        titre,
        emoji: '🔐',
        preheader: 'Lien valable 1 heure',
        contenu,
        highlight,
        ctaTexte: 'Réinitialiser mon mot de passe',
        ctaLien: resetUrl,
      }),
      text: baseText({
        titre,
        contenu: `Bonjour ${compte.nom_contact},\n\nUtilisez ce lien (valable 1h) pour réinitialiser votre mot de passe :`,
        ctaTexte: 'Réinitialiser',
        ctaLien: resetUrl,
      }),
      tag: 'reset_password',
    });

    return NextResponse.json({
      success: true,
      code: 'EMAIL_ENVOYE',
      message: `Un lien de réinitialisation a été envoyé à ${compte.email}. Vérifiez votre boîte de réception (et vos spams). Le lien est valable 1 heure.`,
    });
  } catch (error) {
    console.error('mot-de-passe-oublie:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
