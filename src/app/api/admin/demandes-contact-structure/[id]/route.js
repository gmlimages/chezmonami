import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://chezmonami.ma';

async function envoyerEmail(to, subject, html, text) {
  if (!process.env.RESEND_API_KEY || !to) return;
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM || 'noreply@chezmonami.ma',
      to: [to],
      subject,
      html,
      text,
    }),
  }).catch(err => console.warn('Email non envoyé:', err.message));
}

// PATCH — traiter une demande de mise en relation
export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const { action, note_admin } = await request.json();

    if (!['valider', 'refuser'].includes(action)) {
      return NextResponse.json({ error: 'Action invalide' }, { status: 400 });
    }

    // Récupérer la demande avec la structure et son éventuel compte
    const { data: demande, error: fetchError } = await supabaseAdmin
      .from('demandes_mise_en_relation')
      .select(`
        *,
        structure:structures(
          id, nom,
          comptes_structures(id, email, nom_contact)
        )
      `)
      .eq('id', id)
      .single();

    if (fetchError || !demande) {
      return NextResponse.json({ error: 'Demande introuvable' }, { status: 404 });
    }

    if (action === 'valider') {
      const compteStructure = demande.structure?.comptes_structures?.[0];

      if (!compteStructure) {
        // La structure n'a pas de compte — informer le demandeur
        await supabaseAdmin
          .from('demandes_mise_en_relation')
          .update({
            statut: 'traite',
            note_admin: note_admin?.trim() || 'Structure sans compte enregistré',
            updated_at: new Date().toISOString(),
          })
          .eq('id', id);

        // Email au demandeur pour expliquer la situation
        const htmlNoCompte = `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#f4f4f4;padding:20px">
          <div style="max-width:600px;margin:auto;background:#fff;border-radius:12px;padding:30px">
            <h2 style="color:#2e7d32">Votre demande de contact — ChezMonAmi</h2>
            <p>Bonjour <strong>${demande.nom_demandeur}</strong>,</p>
            <p>Nous avons bien reçu votre demande de contact pour la structure <strong>${demande.structure.nom}</strong>.</p>
            <p>Malheureusement, cette structure n'est pas encore enregistrée comme compte entreprise sur notre plateforme.
            Pour entrer en contact, vous pouvez les rejoindre directement ou les encourager à s'inscrire sur
            <a href="${siteUrl}">${siteUrl}</a>.</p>
            ${note_admin ? `<p style="background:#f9f9f9;padding:12px;border-radius:8px"><strong>Note de l'administration :</strong> ${note_admin}</p>` : ''}
            <p>Cordialement,<br/>L'équipe ChezMonAmi</p>
          </div></body></html>`;

        await envoyerEmail(
          demande.email_demandeur,
          `Réponse à votre demande de contact — ${demande.structure.nom}`,
          htmlNoCompte,
          `Bonjour ${demande.nom_demandeur},\n\nLa structure ${demande.structure.nom} n'est pas encore enregistrée sur ChezMonAmi.\n\nCordialement, ChezMonAmi`
        );

        return NextResponse.json({ success: true, action: 'traite_sans_compte' });
      }

      // La structure a un compte — créer une demande de contact B2B
      // D'abord, vérifier si le demandeur a un compte entreprise
      const compteDemandeur = demande.compte_demandeur_id
        ? await supabaseAdmin
            .from('comptes_structures')
            .select('id, email, nom_contact')
            .eq('id', demande.compte_demandeur_id)
            .single()
            .then(r => r.data)
        : null;

      await supabaseAdmin
        .from('demandes_mise_en_relation')
        .update({
          statut: 'traite',
          note_admin: note_admin?.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      // Email de confirmation au demandeur
      const htmlConfirmation = `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#f4f4f4;padding:20px">
        <div style="max-width:600px;margin:auto;background:#fff;border-radius:12px;padding:30px">
          <h2 style="color:#2e7d32">✅ Votre demande a été validée — ChezMonAmi</h2>
          <p>Bonjour <strong>${demande.nom_demandeur}</strong>,</p>
          <p>Bonne nouvelle ! Votre demande de contact avec <strong>${demande.structure.nom}</strong> a été validée par notre équipe.</p>
          ${compteDemandeur
            ? `<p>Vous pouvez maintenant accéder à votre espace pour démarrer la conversation.</p>
               <p><a href="${siteUrl}/entreprise/dashboard/reseau" style="display:inline-block;padding:12px 24px;background:#2e7d32;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold">Accéder à mon espace</a></p>`
            : `<p>Pour commencer à échanger, créez votre compte entreprise sur ChezMonAmi.</p>
               <p><a href="${siteUrl}/entreprise/inscription" style="display:inline-block;padding:12px 24px;background:#2e7d32;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold">Créer mon compte</a></p>`
          }
          <p>Cordialement,<br/>L'équipe ChezMonAmi</p>
        </div></body></html>`;

      await envoyerEmail(
        demande.email_demandeur,
        `✅ Votre demande de contact avec ${demande.structure.nom} a été validée`,
        htmlConfirmation,
        `Votre demande de contact avec ${demande.structure.nom} a été validée. Connectez-vous sur ${siteUrl}`
      );

      return NextResponse.json({ success: true, action: 'valide' });
    }

    if (action === 'refuser') {
      await supabaseAdmin
        .from('demandes_mise_en_relation')
        .update({
          statut: 'refuse',
          note_admin: note_admin?.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      // Email de refus au demandeur
      const htmlRefus = `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#f4f4f4;padding:20px">
        <div style="max-width:600px;margin:auto;background:#fff;border-radius:12px;padding:30px">
          <h2 style="color:#c62828">Votre demande de contact — ChezMonAmi</h2>
          <p>Bonjour <strong>${demande.nom_demandeur}</strong>,</p>
          <p>Votre demande de contact pour la structure <strong>${demande.structure.nom}</strong> n'a pas pu être traitée.</p>
          ${note_admin ? `<p style="background:#fff3f3;padding:12px;border-radius:8px;border-left:3px solid #c62828"><strong>Motif :</strong> ${note_admin}</p>` : ''}
          <p>Pour toute question, contactez-nous via <a href="${siteUrl}">${siteUrl}</a>.</p>
          <p>Cordialement,<br/>L'équipe ChezMonAmi</p>
        </div></body></html>`;

      await envoyerEmail(
        demande.email_demandeur,
        `Votre demande de contact — ${demande.structure.nom}`,
        htmlRefus,
        `Votre demande de contact pour ${demande.structure.nom} n'a pas abouti.`
      );

      return NextResponse.json({ success: true, action: 'refuse' });
    }
  } catch (error) {
    console.error('PATCH demandes-contact-structure:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
