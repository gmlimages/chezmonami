// Lot Partenaires — Détail/modification/suppression d'un partenaire (admin)
// GET    : récupère le détail + codes + commissions + filleuls
// PATCH  : modifie infos / toggle actif / toggle commissions_actives / reset mdp
// DELETE : soft delete
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireAdmin } from '@/lib/adminAuth';
import { logAdminAction } from '@/lib/auditLog';
import { sendEmail, baseTemplate, baseText } from '@/lib/email';

export async function GET(request, { params }) {
  const admin = await requireAdmin(request);
  if (admin instanceof Response) return admin;
  try {
    const { id } = await params;

    const [{ data: partenaire }, { data: codes }, { data: filleuls }, { data: commissions }] = await Promise.all([
      supabaseAdmin
        .from('comptes_partenaires')
        .select('id, email, nom_complet, telephone, pourcentage_commission, commissions_actives, coordonnees_paiement, actif, supprime, email_verifie, derniere_connexion, created_at')
        .eq('id', id)
        .single(),
      supabaseAdmin
        .from('codes_partenaires')
        .select('*')
        .eq('partenaire_id', id)
        .order('type', { ascending: true })
        .order('created_at', { ascending: false }),
      supabaseAdmin
        .from('comptes_structures')
        .select('id, email, nom_contact, abonnement, date_paiement, date_fin_abonnement, montant_paiement, code_partenaire_utilise, structures(id, nom)')
        .eq('partenaire_id', id),
      supabaseAdmin
        .from('commissions_partenaires')
        .select('*, filleul:comptes_structures!commissions_partenaires_filleul_compte_id_fkey(id, nom_contact, structures(nom))')
        .eq('partenaire_id', id)
        .order('date_paiement_filleul', { ascending: false }),
    ]);

    if (!partenaire) return NextResponse.json({ error: 'Partenaire introuvable' }, { status: 404 });

    return NextResponse.json({
      partenaire,
      codes: codes || [],
      filleuls: filleuls || [],
      commissions: commissions || [],
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  const admin = await requireAdmin(request);
  if (admin instanceof Response) return admin;
  try {
    const { id } = await params;
    const body = await request.json();

    const { data: partenaire } = await supabaseAdmin
      .from('comptes_partenaires')
      .select('*')
      .eq('id', id)
      .single();
    if (!partenaire || partenaire.supprime) {
      return NextResponse.json({ error: 'Partenaire introuvable' }, { status: 404 });
    }

    // Action : reset mot de passe
    if (body.action === 'reset_mdp') {
      const mdp = crypto.randomBytes(8).toString('base64').replace(/[+/=]/g, '').slice(0, 10);
      const hash = await bcrypt.hash(mdp, 12);
      await supabaseAdmin
        .from('comptes_partenaires')
        .update({ mot_de_passe_hash: hash })
        .eq('id', id);
      // Invalide toutes les sessions
      await supabaseAdmin.from('comptes_partenaires_sessions').delete().eq('partenaire_id', id);

      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://chezmonami.ma';
      const contenuHtml = `
            <p>Bonjour ${partenaire.nom_complet},</p>
            <p>L'administration vient de réinitialiser le mot de passe de votre compte partenaire à votre demande.</p>
            <p style="margin:16px 0;padding:12px 16px;background:#f5f7fa;border-left:3px solid #2e7d32;border-radius:4px;font-family:Arial,sans-serif;font-size:14px;line-height:1.7;">
              <strong>Identifiant :</strong> ${partenaire.email}<br/>
              <strong>Code temporaire :</strong> ${mdp}
            </p>
            <p style="font-size:13px;color:#666;">Pour votre sécurité, modifiez ce code temporaire dès votre prochaine connexion (section Profil).</p>
            <p style="font-size:13px;color:#666;margin-top:24px;">Si vous n'êtes pas à l'origine de cette demande, contactez immédiatement l'administration en répondant à ce message.</p>
          `;
      const contenuText = `Bonjour ${partenaire.nom_complet},

L'administration vient de réinitialiser le mot de passe de votre compte partenaire à votre demande.

Identifiant : ${partenaire.email}
Code temporaire : ${mdp}

Pour votre sécurité, modifiez ce code temporaire dès votre prochaine connexion (section Profil).

Connexion : ${siteUrl}/entreprise/connexion

Si vous n'êtes pas à l'origine de cette demande, contactez immédiatement l'administration en répondant à ce message.`;

      await sendEmail({
        to: partenaire.email,
        subject: 'Réinitialisation de votre accès partenaire',
        tag: 'partenaire_reset_mdp',
        replyTo: process.env.RESEND_REPLY_TO || 'infos@chezmonami.ma',
        headers: { 'X-Entity-Ref-ID': `partenaire-reset-${id}` },
        html: baseTemplate({
          titre: 'Réinitialisation de votre accès',
          preheader: 'Nouvel identifiant temporaire pour votre compte partenaire',
          contenu: contenuHtml,
          ctaTexte: 'Se connecter',
          ctaLien: `${siteUrl}/entreprise/connexion`,
        }),
        text: baseText({
          titre: 'Réinitialisation de votre accès',
          contenu: contenuText,
          ctaTexte: 'Se connecter',
          ctaLien: `${siteUrl}/entreprise/connexion`,
        }),
      });

      await logAdminAction({
        request, admin,
        action: 'partenaire.reset_mdp',
        cibleType: 'partenaire',
        cibleId: id,
      });
      return NextResponse.json({ success: true, mdp_envoye: true });
    }

    // Modification générique (champs autorisés)
    const allowed = ['nom_complet', 'telephone', 'pourcentage_commission', 'commissions_actives', 'coordonnees_paiement', 'actif'];
    const updates = {};
    for (const k of allowed) {
      if (k in body) updates[k] = body[k];
    }
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Rien à mettre à jour' }, { status: 400 });
    }

    const { data: updated, error } = await supabaseAdmin
      .from('comptes_partenaires')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;

    await logAdminAction({
      request, admin,
      action: 'partenaire.modifier',
      cibleType: 'partenaire',
      cibleId: id,
      details: updates,
    });

    return NextResponse.json({ success: true, partenaire: { ...updated, mot_de_passe_hash: undefined } });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const admin = await requireAdmin(request);
  if (admin instanceof Response) return admin;
  try {
    const { id } = await params;

    // Soft delete + invalide sessions + désactive codes
    await supabaseAdmin.from('comptes_partenaires').update({ supprime: true, actif: false }).eq('id', id);
    await supabaseAdmin.from('comptes_partenaires_sessions').delete().eq('partenaire_id', id);
    await supabaseAdmin.from('codes_partenaires').update({ actif: false }).eq('partenaire_id', id);

    await logAdminAction({
      request, admin,
      action: 'partenaire.supprimer',
      cibleType: 'partenaire',
      cibleId: id,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
