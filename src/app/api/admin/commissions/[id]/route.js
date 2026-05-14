// Lot Partenaires — Mise à jour d'une commission (admin)
// PATCH { action: 'marquer_payee' | 'annuler', justificatif_url?, notes? }
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireAdmin } from '@/lib/adminAuth';
import { logAdminAction } from '@/lib/auditLog';
import { sendEmail, baseTemplate } from '@/lib/email';

export async function PATCH(request, { params }) {
  const admin = await requireAdmin(request);
  if (admin instanceof Response) return admin;
  try {
    const { id } = await params;
    const body = await request.json();

    const { data: commission } = await supabaseAdmin
      .from('commissions_partenaires')
      .select('*, partenaire:comptes_partenaires!commissions_partenaires_partenaire_id_fkey(email, nom_complet), filleul:comptes_structures!commissions_partenaires_filleul_compte_id_fkey(nom_contact, structures(nom))')
      .eq('id', id)
      .single();
    if (!commission) return NextResponse.json({ error: 'Commission introuvable' }, { status: 404 });

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://chezmonami.ma';
    const dashLink = `${siteUrl}/partenaire/dashboard/commissions`;

    // ── Action : passer en "en_paiement" (le virement est lancé) ──
    if (body.action === 'marquer_en_paiement') {
      if (!['a_payer'].includes(commission.statut)) {
        return NextResponse.json({ error: 'Transition non autorisée' }, { status: 400 });
      }
      const { data: updated, error } = await supabaseAdmin
        .from('commissions_partenaires')
        .update({
          statut: 'en_paiement',
          date_en_paiement: new Date().toISOString(),
          notes: body.notes || commission.notes,
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;

      if (commission.partenaire?.email) {
        sendEmail({
          to: commission.partenaire.email,
          subject: 'Paiement en cours de votre commission',
          tag: 'commission_en_paiement',
          replyTo: process.env.RESEND_REPLY_TO || 'infos@chezmonami.ma',
          html: baseTemplate({
            titre: 'Paiement en cours',
            contenu: `
              <p>Bonjour ${commission.partenaire.nom_complet},</p>
              <p>Le paiement de votre commission de <strong>${Number(commission.montant_commission_mad).toFixed(2)} MAD</strong> pour ${commission.filleul?.structures?.nom || commission.filleul?.nom_contact} est en cours de traitement.</p>
              <p>Vous serez notifié(e) dès la confirmation du virement.</p>
            `,
            ctaTexte: 'Voir mes commissions',
            ctaLien: dashLink,
          }),
        }).catch(() => {});
      }

      await logAdminAction({ request, admin, action: 'commission.marquer_en_paiement', cibleType: 'commission', cibleId: id });
      return NextResponse.json({ success: true, commission: updated });
    }

    // ── Action : marquer payée par l'admin (le virement est parti) ──
    if (body.action === 'marquer_payee_admin' || body.action === 'marquer_payee') {
      if (!['a_payer', 'en_paiement'].includes(commission.statut)) {
        return NextResponse.json({ error: 'Transition non autorisée' }, { status: 400 });
      }
      const now = new Date().toISOString();
      const { data: updated, error } = await supabaseAdmin
        .from('commissions_partenaires')
        .update({
          statut: 'payee_admin',
          date_payee_admin: now,
          date_paiement_commission: now,
          paye_par_admin_id: admin.id,
          justificatif_url: body.justificatif_url || null,
          notes: body.notes || commission.notes,
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;

      if (commission.partenaire?.email) {
        sendEmail({
          to: commission.partenaire.email,
          subject: 'Confirmation requise — paiement de votre commission',
          tag: 'commission_payee_admin',
          replyTo: process.env.RESEND_REPLY_TO || 'infos@chezmonami.ma',
          html: baseTemplate({
            titre: 'Paiement effectué — merci de confirmer',
            contenu: `
              <p>Bonjour ${commission.partenaire.nom_complet},</p>
              <p>Votre commission de <strong>${Number(commission.montant_commission_mad).toFixed(2)} MAD</strong> pour ${commission.filleul?.structures?.nom || commission.filleul?.nom_contact} vient d'être versée.</p>
              ${body.justificatif_url ? `<p>Justificatif : <a href="${body.justificatif_url}">${body.justificatif_url}</a></p>` : ''}
              ${body.notes ? `<p style="font-size:13px;color:#666;">Note : ${body.notes}</p>` : ''}
              <p>Merci de bien vouloir confirmer la réception depuis votre espace partenaire.</p>
              <p style="font-size:13px;color:#666;">Sans confirmation de votre part dans les 7 jours, le paiement sera considéré comme validé automatiquement.</p>
            `,
            ctaTexte: 'Confirmer la réception',
            ctaLien: dashLink,
          }),
        }).catch(() => {});
      }

      await logAdminAction({ request, admin, action: 'commission.marquer_payee_admin', cibleType: 'commission', cibleId: id, details: { montant: commission.montant_commission_mad } });
      return NextResponse.json({ success: true, commission: updated });
    }

    // ── Action : annuler ──
    if (body.action === 'annuler') {
      if (commission.statut === 'validee') {
        return NextResponse.json({ error: 'Impossible d\'annuler une commission validée' }, { status: 400 });
      }
      const { error } = await supabaseAdmin
        .from('commissions_partenaires')
        .update({ statut: 'annulee', notes: body.notes || null })
        .eq('id', id);
      if (error) throw error;
      await logAdminAction({ request, admin, action: 'commission.annuler', cibleType: 'commission', cibleId: id });
      return NextResponse.json({ success: true });
    }

    // ── Action : rouvrir une contestation (admin) ──
    if (body.action === 'rouvrir') {
      if (commission.statut !== 'contestee') {
        return NextResponse.json({ error: 'Seules les commissions contestées peuvent être rouvertes' }, { status: 400 });
      }
      await supabaseAdmin
        .from('commissions_partenaires')
        .update({ statut: 'en_paiement', notes: body.notes || commission.notes })
        .eq('id', id);
      await logAdminAction({ request, admin, action: 'commission.rouvrir', cibleType: 'commission', cibleId: id });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Action invalide' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
