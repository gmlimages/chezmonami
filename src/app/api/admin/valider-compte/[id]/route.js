import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireAdmin } from '@/lib/adminAuth';
import { logAdminAction } from '@/lib/auditLog';
import { sendEmail, baseTemplate, baseText } from '@/lib/email';

// POST /api/admin/valider-compte/[id]
export async function POST(request, { params }) {
  const admin = await requireAdmin(request);
  if (admin instanceof Response) return admin;
  try {
    const { id } = await params;

    // Récupérer le compte
    const { data: compte, error: errCompte } = await supabaseAdmin
      .from('comptes_structures')
      .select('id, email, nom_contact, statut, structures(id, nom)')
      .eq('id', id)
      .single();

    if (errCompte || !compte) {
      return NextResponse.json({ error: 'Compte introuvable' }, { status: 404 });
    }

    // Mettre à jour le statut
    const { error: errUpdate } = await supabaseAdmin
      .from('comptes_structures')
      .update({ statut: 'actif' })
      .eq('id', id);

    if (errUpdate) throw errUpdate;

    // Audit log
    await logAdminAction({
      request,
      admin,
      action: 'compte.valider',
      cibleType: 'compte_structure',
      cibleId: id,
      details: { email: compte.email, statut_precedent: compte.statut },
    });

    // Envoyer l'email de validation
    if (compte.email) {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://chezmonami.ma';
      const nomEntreprise = compte.structures?.[0]?.nom || compte.nom_contact;
      const titre = 'Votre compte a été validé !';
      const contenu = `
        <p>Bonjour <strong>${compte.nom_contact}</strong>,</p>
        <p>Nous avons le plaisir de vous informer que votre compte entreprise <strong>${nomEntreprise}</strong> a été validé par notre équipe.</p>
      `;
      const highlight = `
        <strong>Vous pouvez dès maintenant :</strong><br/>
        • Compléter et soumettre votre fiche entreprise<br/>
        • Accéder aux appels d'offres<br/>
        • Contacter d'autres entreprises partenaires<br/>
        • Gérer vos documents
      `;

      await sendEmail({
        to: compte.email,
        subject: '✅ Votre compte ChezMonAmi a été validé',
        html: baseTemplate({
          titre,
          emoji: '✅',
          preheader: 'Votre compte entreprise est maintenant actif',
          contenu,
          highlight,
          ctaTexte: 'Accéder à mon espace',
          ctaLien: `${siteUrl}/entreprise/connexion`,
        }),
        text: baseText({
          titre,
          contenu: `Bonjour ${compte.nom_contact},\n\nVotre compte entreprise ${nomEntreprise} a été validé.`,
          ctaTexte: 'Accéder à mon espace',
          ctaLien: `${siteUrl}/entreprise/connexion`,
        }),
        tag: 'validation_compte',
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('POST valider-compte:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
