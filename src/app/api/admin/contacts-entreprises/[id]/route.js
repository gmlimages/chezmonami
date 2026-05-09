import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireAdmin } from '@/lib/adminAuth';
import { sendEmail, baseTemplate, baseText } from '@/lib/email';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://chezmonami.ma';

async function envoyerEmailApprobation(compte, nomDestinataire) {
  if (!compte?.email) return;
  const titre = 'Demande de contact approuvée';
  const contenu = `
    <p>Bonjour <strong>${compte.nom_contact}</strong>,</p>
    <p>Votre demande de mise en relation avec <strong>${nomDestinataire}</strong> a été approuvée par notre équipe.</p>
    <p>Vous pouvez maintenant démarrer la conversation depuis votre espace Réseau.</p>
  `;
  await sendEmail({
    to: compte.email,
    subject: `✅ Votre demande de contact avec ${nomDestinataire} a été approuvée`,
    html: baseTemplate({
      titre,
      emoji: '✅',
      preheader: `Vous pouvez maintenant échanger avec ${nomDestinataire}`,
      contenu,
      ctaTexte: 'Accéder à mon Réseau',
      ctaLien: `${siteUrl}/entreprise/dashboard/reseau`,
    }),
    text: baseText({
      titre,
      contenu: `Bonjour ${compte.nom_contact},\n\nVotre demande de contact avec ${nomDestinataire} a été approuvée.`,
      ctaTexte: 'Accéder à mon Réseau',
      ctaLien: `${siteUrl}/entreprise/dashboard/reseau`,
    }),
    tag: 'approbation_contact_b2b',
  });
}

// PATCH — approuver ou refuser une demande de contact
export async function PATCH(request, { params }) {
  const admin = await requireAdmin(request);
  if (admin instanceof Response) return admin;
  try {
    const { id } = await params;
    const { action, note_admin } = await request.json();

    if (!['approuver', 'refuser', 'suspendre', 'reactiver'].includes(action)) {
      return NextResponse.json({ error: 'Action invalide' }, { status: 400 });
    }

    // Récupérer la demande
    const { data: demande, error: fetchError } = await supabaseAdmin
      .from('demandes_contact')
      .select('*, conversation:conversations_b2b(id)')
      .eq('id', id)
      .single();

    if (fetchError || !demande) {
      return NextResponse.json({ error: 'Demande introuvable' }, { status: 404 });
    }

    if (action === 'approuver') {
      if (demande.statut === 'approuvee') {
        return NextResponse.json({ error: 'Demande déjà approuvée' }, { status: 409 });
      }

      // Mettre à jour la demande
      await supabaseAdmin
        .from('demandes_contact')
        .update({ statut: 'approuvee', note_admin: note_admin?.trim() || null, updated_at: new Date().toISOString() })
        .eq('id', id);

      // Créer la conversation si elle n'existe pas
      let convId = demande.conversation?.id;
      if (!convId) {
        const { data: conv, error: convError } = await supabaseAdmin
          .from('conversations_b2b')
          .insert({
            demande_id: id,
            compte_a_id: demande.demandeur_id,
            compte_b_id: demande.destinataire_id,
            active: true,
          })
          .select('id')
          .single();

        if (convError) throw convError;
        convId = conv.id;
      } else {
        // Réactiver si suspendue
        await supabaseAdmin.from('conversations_b2b').update({ active: true }).eq('id', convId);
      }

      // Envoyer email de confirmation au demandeur
      const { data: demandeurData } = await supabaseAdmin
        .from('comptes_structures')
        .select('email, nom_contact')
        .eq('id', demande.demandeur_id)
        .single();
      const { data: destinataireData } = await supabaseAdmin
        .from('comptes_structures')
        .select('nom_contact, structures(nom)')
        .eq('id', demande.destinataire_id)
        .single();
      const nomDest = destinataireData?.structures?.[0]?.nom || destinataireData?.nom_contact || '—';
      await envoyerEmailApprobation(demandeurData, nomDest);

      return NextResponse.json({ success: true, action: 'approuvee', conversation_id: convId });
    }

    if (action === 'refuser') {
      await supabaseAdmin
        .from('demandes_contact')
        .update({ statut: 'refusee', note_admin: note_admin?.trim() || null, updated_at: new Date().toISOString() })
        .eq('id', id);

      return NextResponse.json({ success: true, action: 'refusee' });
    }

    if (action === 'suspendre') {
      if (!demande.conversation?.id) {
        return NextResponse.json({ error: 'Aucune conversation à suspendre' }, { status: 400 });
      }
      await supabaseAdmin.from('conversations_b2b').update({ active: false }).eq('id', demande.conversation.id);
      return NextResponse.json({ success: true, action: 'suspendue' });
    }

    if (action === 'reactiver') {
      if (!demande.conversation?.id) {
        return NextResponse.json({ error: 'Aucune conversation à réactiver' }, { status: 400 });
      }
      await supabaseAdmin.from('conversations_b2b').update({ active: true }).eq('id', demande.conversation.id);
      return NextResponse.json({ success: true, action: 'reactivee' });
    }
  } catch (error) {
    console.error('PATCH contact admin error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
