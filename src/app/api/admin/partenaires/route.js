// Lot Partenaires — CRUD admin
// GET    /api/admin/partenaires           : liste (filtre actif/inactif/supprime)
// POST   /api/admin/partenaires           : créer un partenaire + code permanent + email
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireAdmin } from '@/lib/adminAuth';
import { logAdminAction } from '@/lib/auditLog';
import { genererCodePartenaireUnique } from '@/lib/partenaires';
import { sendEmail, baseTemplate, baseText } from '@/lib/email';

export async function GET(request) {
  const admin = await requireAdmin(request);
  if (admin instanceof Response) return admin;
  try {
    const { searchParams } = new URL(request.url);
    const filtre = searchParams.get('filtre') || 'actifs'; // actifs | inactifs | supprimes | tous

    let q = supabaseAdmin
      .from('comptes_partenaires')
      .select(`
        id, email, nom_complet, telephone,
        pourcentage_commission, commissions_actives,
        coordonnees_paiement, actif, supprime,
        email_verifie, derniere_connexion, created_at
      `)
      .order('created_at', { ascending: false });

    if (filtre === 'actifs') q = q.eq('actif', true).eq('supprime', false);
    else if (filtre === 'inactifs') q = q.eq('actif', false).eq('supprime', false);
    else if (filtre === 'supprimes') q = q.eq('supprime', true);

    const { data, error } = await q;
    if (error) throw error;

    // Récupérer stats (nb filleuls + commissions cumulées) par partenaire
    const ids = (data || []).map(p => p.id);
    const stats = {};
    if (ids.length) {
      const { data: filleulsCount } = await supabaseAdmin
        .from('comptes_structures')
        .select('partenaire_id')
        .in('partenaire_id', ids);
      (filleulsCount || []).forEach(f => {
        stats[f.partenaire_id] = stats[f.partenaire_id] || { filleuls: 0, commissions_a_payer: 0, commissions_payees: 0 };
        stats[f.partenaire_id].filleuls++;
      });

      const { data: comms } = await supabaseAdmin
        .from('commissions_partenaires')
        .select('partenaire_id, statut, montant_commission_mad')
        .in('partenaire_id', ids);
      (comms || []).forEach(c => {
        stats[c.partenaire_id] = stats[c.partenaire_id] || { filleuls: 0, commissions_a_payer: 0, commissions_payees: 0 };
        if (c.statut === 'a_payer') stats[c.partenaire_id].commissions_a_payer += Number(c.montant_commission_mad) || 0;
        else if (c.statut === 'payee') stats[c.partenaire_id].commissions_payees += Number(c.montant_commission_mad) || 0;
      });
    }

    const enriched = (data || []).map(p => ({
      ...p,
      stats: stats[p.id] || { filleuls: 0, commissions_a_payer: 0, commissions_payees: 0 },
    }));

    return NextResponse.json({ partenaires: enriched });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  const admin = await requireAdmin(request);
  if (admin instanceof Response) return admin;
  try {
    const body = await request.json();
    const {
      email, nom_complet, telephone,
      pourcentage_commission = 10,
      coordonnees_paiement = {},
      mois_filleul_permanent = 0,
      reduction_filleul_pct_permanent = 0,
    } = body;

    if (!email || !nom_complet) {
      return NextResponse.json({ error: 'Email et nom requis' }, { status: 400 });
    }

    // Vérifier doublon email (sur partenaires actifs + sur comptes_structures pour éviter conflit login)
    const [{ data: dupPart }, { data: dupEnt }] = await Promise.all([
      supabaseAdmin.from('comptes_partenaires').select('id').eq('email', email).eq('supprime', false).maybeSingle(),
      supabaseAdmin.from('comptes_structures').select('id').eq('email', email).maybeSingle(),
    ]);
    if (dupPart) return NextResponse.json({ error: 'Un partenaire avec cet email existe déjà' }, { status: 409 });
    if (dupEnt) return NextResponse.json({ error: 'Cet email est déjà utilisé par un compte entreprise' }, { status: 409 });

    // Génère mot de passe initial (10 chars)
    const mdpInitial = crypto.randomBytes(8).toString('base64').replace(/[+/=]/g, '').slice(0, 10);
    const hash = await bcrypt.hash(mdpInitial, 12);

    // Crée le partenaire
    const { data: partenaire, error: errP } = await supabaseAdmin
      .from('comptes_partenaires')
      .insert({
        email,
        mot_de_passe_hash: hash,
        nom_complet,
        telephone: telephone || null,
        pourcentage_commission,
        coordonnees_paiement,
        created_by_admin_id: admin.id,
      })
      .select()
      .single();
    if (errP) throw errP;

    // Crée le code permanent
    const codePermanent = await genererCodePartenaireUnique('permanent');
    const { data: code, error: errC } = await supabaseAdmin
      .from('codes_partenaires')
      .insert({
        partenaire_id: partenaire.id,
        code: codePermanent,
        type: 'permanent',
        mois_filleul: mois_filleul_permanent,
        reduction_filleul_pct: reduction_filleul_pct_permanent,
        created_by_admin_id: admin.id,
      })
      .select()
      .single();
    if (errC) throw errC;

    // Email avec credentials + code
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://chezmonami.ma';
    const lienInscription = `${siteUrl}/entreprise/inscription?part=${codePermanent}`;

    const sujet = `Activation de votre compte partenaire Chez Mon Ami`;
    const contenuHtml = `
          <p>Bonjour ${nom_complet},</p>
          <p>L'administration de Chez Mon Ami a créé pour vous un accès au programme partenaires.</p>
          <p>Pour accéder à votre tableau de bord, connectez-vous à l'adresse suivante avec les identifiants ci-dessous :</p>
          <p style="margin:16px 0;padding:12px 16px;background:#f5f7fa;border-left:3px solid #2e7d32;border-radius:4px;font-family:Arial,sans-serif;font-size:14px;line-height:1.7;">
            <strong>Identifiant :</strong> ${email}<br/>
            <strong>Code temporaire :</strong> ${mdpInitial}
          </p>
          <p style="font-size:13px;color:#666;">Ce code temporaire doit être modifié dès la première connexion depuis votre espace personnel (section Profil).</p>
          <p style="margin-top:24px;"><strong>Votre code de parrainage permanent :</strong></p>
          <p style="font-family:'Courier New',monospace;font-size:18px;font-weight:bold;color:#2e7d32;letter-spacing:2px;">${codePermanent}</p>
          <p style="font-size:14px;">Taux de commission appliqué : <strong>${pourcentage_commission}%</strong> du montant d'abonnement, à chaque renouvellement d'une entreprise inscrite avec votre code.</p>
          <p style="font-size:14px;">Lien d'inscription à partager :<br/><a href="${lienInscription}" style="color:#2e7d32;">${lienInscription}</a></p>
          <p style="font-size:13px;color:#666;margin-top:24px;">Pour toute question, répondez simplement à ce message.</p>
        `;
    const contenuText = `Bonjour ${nom_complet},

L'administration de Chez Mon Ami a créé pour vous un accès au programme partenaires.

Identifiant : ${email}
Code temporaire : ${mdpInitial}

Ce code temporaire doit être modifié dès la première connexion (section Profil de votre espace).

Votre code de parrainage permanent : ${codePermanent}
Taux de commission : ${pourcentage_commission}%

Lien d'inscription à partager : ${lienInscription}

Connexion : ${siteUrl}/entreprise/connexion

Pour toute question, répondez simplement à ce message.`;

    await sendEmail({
      to: email,
      subject: sujet,
      tag: 'partenaire_creation',
      replyTo: process.env.RESEND_REPLY_TO || 'infos@chezmonami.ma',
      headers: { 'X-Entity-Ref-ID': `partenaire-creation-${partenaire.id}` },
      html: baseTemplate({
        titre: 'Activation de votre compte partenaire',
        preheader: `Vos accès au programme partenaires Chez Mon Ami`,
        contenu: contenuHtml,
        ctaTexte: 'Accéder à mon espace',
        ctaLien: `${siteUrl}/entreprise/connexion`,
      }),
      text: baseText({
        titre: 'Activation de votre compte partenaire',
        contenu: contenuText,
        ctaTexte: 'Accéder à mon espace',
        ctaLien: `${siteUrl}/entreprise/connexion`,
      }),
    });

    await logAdminAction({
      request, admin,
      action: 'partenaire.creer',
      cibleType: 'partenaire',
      cibleId: partenaire.id,
      details: { email, code_permanent: codePermanent },
    });

    return NextResponse.json({
      success: true,
      partenaire: { ...partenaire, mot_de_passe_hash: undefined },
      code_permanent: code,
      mdp_envoye_par_email: true,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
