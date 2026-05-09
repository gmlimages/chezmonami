import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import bcrypt from 'bcryptjs';
import { rateLimit } from '@/lib/rateLimit';
import { sendEmail, baseTemplate, baseText } from '@/lib/email';

export async function POST(request) {
  try {
    // Rate limiting : 5 inscriptions par IP par heure
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown';
    const rl = rateLimit(`inscription:${ip}`, { limit: 5, windowMs: 60 * 60_000 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Trop de tentatives. Réessayez plus tard.' },
        { status: 429 }
      );
    }

    const { email, mot_de_passe, nom_contact, code_parrainage } = await request.json();

    if (!email || !mot_de_passe || !nom_contact) {
      return NextResponse.json({ error: 'Tous les champs sont obligatoires' }, { status: 400 });
    }
    if (mot_de_passe.length < 8) {
      return NextResponse.json({ error: 'Le mot de passe doit contenir au moins 8 caractères' }, { status: 400 });
    }

    // Email déjà utilisé ?
    const { data: existing } = await supabaseAdmin
      .from('comptes_structures')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: 'Cet email est déjà utilisé' }, { status: 409 });
    }

    // ── Validation du code de parrainage (optionnel) ──
    let codeParrainageRow = null;
    if (code_parrainage && String(code_parrainage).trim()) {
      const codeStr = String(code_parrainage).trim().toUpperCase();
      const { data: c } = await supabaseAdmin
        .from('codes_parrainage')
        .select('id, parrain_compte_id, actif, date_expiration, utilise_par_compte_id')
        .eq('code', codeStr)
        .maybeSingle();
      if (!c || !c.actif || c.utilise_par_compte_id ||
          (c.date_expiration && new Date(c.date_expiration) < new Date())) {
        return NextResponse.json(
          { error: 'Code de parrainage invalide ou expiré' },
          { status: 400 }
        );
      }
      codeParrainageRow = c;
    }

    // Contacts par défaut depuis config_coordination
    const { data: config } = await supabaseAdmin
      .from('config_coordination')
      .select('telephone, email')
      .single();

    // Hash du mot de passe
    const hash = await bcrypt.hash(mot_de_passe, 12);

    // Créer le compte
    const { data: compte, error } = await supabaseAdmin
      .from('comptes_structures')
      .insert({
        email: email.toLowerCase().trim(),
        mot_de_passe: hash,
        nom_contact: nom_contact.trim(),
        telephone_contact: config?.telephone || '',
        email_contact: config?.email || '',
        statut: 'en_attente',
      })
      .select('id, email, nom_contact, statut')
      .single();

    if (error) throw error;

    // ── Si code de parrainage fourni : créer le parrainage en_attente ──
    if (codeParrainageRow) {
      // Sécurité : pas d'auto-parrainage (le parrain ne peut pas être le compte
      // qu'on vient de créer, mais on garde le check pour la cohérence)
      if (codeParrainageRow.parrain_compte_id !== compte.id) {
        // Snapshot des paramètres au moment de l'inscription
        const { data: paramsParr } = await supabaseAdmin
          .from('parametres_parrainage')
          .select('mois_parrain, mois_filleul')
          .eq('id', 1)
          .single();

        // Récupérer le code (snapshot du texte)
        const { data: codeFull } = await supabaseAdmin
          .from('codes_parrainage')
          .select('code')
          .eq('id', codeParrainageRow.id)
          .single();

        await supabaseAdmin.from('parrainages').insert({
          code_id: codeParrainageRow.id,
          code_utilise: codeFull?.code,
          parrain_compte_id: codeParrainageRow.parrain_compte_id,
          filleul_compte_id: compte.id,
          mois_parrain: paramsParr?.mois_parrain ?? 2,
          mois_filleul: paramsParr?.mois_filleul ?? 1,
        });

        // Marquer le code comme utilisé (1 code = 1 filleul)
        await supabaseAdmin
          .from('codes_parrainage')
          .update({
            utilise_par_compte_id: compte.id,
            utilise_at: new Date().toISOString(),
          })
          .eq('id', codeParrainageRow.id);
      }
    }

    // Notifier tous les admins
    await supabaseAdmin.from('notifications_admin').insert({
      admin_id: null,
      type: 'nouveau_compte',
      titre: `Nouveau compte entreprise : ${nom_contact.trim()}`,
      contenu: `${email} vient de créer un compte et attend validation.`,
      lien: '/admin/comptes-entreprises',
      reference_type: 'compte',
      reference_id: compte.id,
    });

    // Email de bienvenue (en attente de validation)
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://chezmonami.ma';
    const titre = 'Bienvenue sur ChezMonAmi !';
    const contenu = `
      <p>Bonjour <strong>${compte.nom_contact}</strong>,</p>
      <p>Merci d'avoir créé votre compte entreprise sur <strong>ChezMonAmi</strong>, l'annuaire panafricain de confiance.</p>
      <p>Votre compte est actuellement <strong>en attente de validation</strong> par notre équipe. Vous recevrez un email dès qu'il sera activé (généralement sous 24-48h).</p>
    `;
    const highlight = `
      <strong>Prochaines étapes :</strong><br/>
      1. Notre équipe vérifie votre inscription<br/>
      2. Vous recevez un email de validation<br/>
      3. Vous pouvez compléter votre fiche entreprise et accéder à toutes les fonctionnalités
    `;

    await sendEmail({
      to: compte.email,
      subject: '👋 Bienvenue sur ChezMonAmi — Compte en attente de validation',
      html: baseTemplate({
        titre,
        emoji: '👋',
        preheader: 'Votre compte est créé et attend validation',
        contenu,
        highlight,
        ctaTexte: 'Visiter ChezMonAmi',
        ctaLien: siteUrl,
      }),
      text: baseText({
        titre,
        contenu: `Bonjour ${compte.nom_contact},\n\nMerci d'avoir créé votre compte. Votre compte est en attente de validation par notre équipe (24-48h).`,
      }),
      tag: 'inscription_entreprise',
    });

    return NextResponse.json({
      success: true,
      message: "Compte créé avec succès. Vous recevrez un email dès validation par l'administration.",
      compte: { id: compte.id, email: compte.email, nom_contact: compte.nom_contact },
    }, { status: 201 });

  } catch (error) {
    console.error('Erreur inscription:', error);
    return NextResponse.json({ error: 'Erreur serveur. Veuillez réessayer.' }, { status: 500 });
  }
}
