import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireAdmin } from '@/lib/adminAuth';
import { sendEmail, baseTemplate, baseText } from '@/lib/email';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://chezmonami.ma';

async function envoyerEmail(to, subject, html, text) {
  if (!to) return;
  await sendEmail({ to, subject, html, text, tag: 'demande_contact_structure' });
}

// PATCH — traiter une demande de mise en relation
export async function PATCH(request, { params }) {
  const admin = await requireAdmin(request);
  if (admin instanceof Response) return admin;
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
        const titreNoCompte = 'Votre demande de contact';
        const contenuNoCompte = `
          <p>Bonjour <strong>${demande.nom_demandeur}</strong>,</p>
          <p>Nous avons bien reçu votre demande de contact pour la structure <strong>${demande.structure.nom}</strong>.</p>
          <p>Malheureusement, cette structure n'est pas encore enregistrée comme compte entreprise sur notre plateforme.
          Pour entrer en contact, vous pouvez les rejoindre directement ou les encourager à s'inscrire sur
          <a href="${siteUrl}">${siteUrl}</a>.</p>
        `;
        await envoyerEmail(
          demande.email_demandeur,
          `Réponse à votre demande de contact — ${demande.structure.nom}`,
          baseTemplate({
            titre: titreNoCompte,
            contenu: contenuNoCompte,
            highlight: note_admin ? `<strong>Note de l'administration :</strong> ${note_admin}` : undefined,
          }),
          baseText({
            titre: titreNoCompte,
            contenu: `Bonjour ${demande.nom_demandeur},\n\nLa structure ${demande.structure.nom} n'est pas encore enregistrée sur ChezMonAmi.`,
          }),
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
      const titreOk = 'Votre demande a été validée';
      const contenuOk = `
        <p>Bonjour <strong>${demande.nom_demandeur}</strong>,</p>
        <p>Bonne nouvelle ! Votre demande de contact avec <strong>${demande.structure.nom}</strong> a été validée par notre équipe.</p>
        ${compteDemandeur
          ? `<p>Vous pouvez maintenant accéder à votre espace pour démarrer la conversation.</p>`
          : `<p>Pour commencer à échanger, créez votre compte entreprise sur ChezMonAmi.</p>`}
      `;
      await envoyerEmail(
        demande.email_demandeur,
        `✅ Votre demande de contact avec ${demande.structure.nom} a été validée`,
        baseTemplate({
          titre: titreOk,
          emoji: '✅',
          contenu: contenuOk,
          ctaTexte: compteDemandeur ? 'Accéder à mon espace' : 'Créer mon compte',
          ctaLien: compteDemandeur ? `${siteUrl}/entreprise/dashboard/reseau` : `${siteUrl}/entreprise/inscription`,
        }),
        baseText({
          titre: titreOk,
          contenu: `Votre demande de contact avec ${demande.structure.nom} a été validée.`,
          ctaTexte: compteDemandeur ? 'Accéder à mon espace' : 'Créer mon compte',
          ctaLien: compteDemandeur ? `${siteUrl}/entreprise/dashboard/reseau` : `${siteUrl}/entreprise/inscription`,
        }),
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
      const titreRefus = 'Votre demande de contact';
      const contenuRefus = `
        <p>Bonjour <strong>${demande.nom_demandeur}</strong>,</p>
        <p>Votre demande de contact pour la structure <strong>${demande.structure.nom}</strong> n'a pas pu être traitée.</p>
        <p>Pour toute question, contactez-nous via <a href="${siteUrl}">${siteUrl}</a>.</p>
      `;
      await envoyerEmail(
        demande.email_demandeur,
        `Votre demande de contact — ${demande.structure.nom}`,
        baseTemplate({
          titre: titreRefus,
          contenu: contenuRefus,
          highlight: note_admin ? `<strong>Motif :</strong> ${note_admin}` : undefined,
        }),
        baseText({
          titre: titreRefus,
          contenu: `Votre demande de contact pour ${demande.structure.nom} n'a pas abouti.`,
        }),
      );

      return NextResponse.json({ success: true, action: 'refuse' });
    }
  } catch (error) {
    console.error('PATCH demandes-contact-structure:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
