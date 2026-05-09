import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireAdmin } from '@/lib/adminAuth';
import { logAdminAction } from '@/lib/auditLog';
import { sendEmail, baseTemplate, baseText } from '@/lib/email';

// PATCH /api/admin/badge-verifie/[id]  — toggle badge et email si activé
export async function PATCH(request, { params }) {
  const admin = await requireAdmin(request);
  if (admin instanceof Response) return admin;
  try {
    const { id } = await params;
    const { badge_verifie } = await request.json();

    const { data: compte, error: errCompte } = await supabaseAdmin
      .from('comptes_structures')
      .select('id, email, nom_contact, structures(id, nom)')
      .eq('id', id)
      .single();

    if (errCompte || !compte) {
      return NextResponse.json({ error: 'Compte introuvable' }, { status: 404 });
    }

    const { error } = await supabaseAdmin
      .from('comptes_structures')
      .update({ badge_verifie })
      .eq('id', id);

    if (error) throw error;

    // Audit log
    await logAdminAction({
      request,
      admin,
      action: badge_verifie ? 'compte.badge_accorder' : 'compte.badge_retirer',
      cibleType: 'compte_structure',
      cibleId: id,
      details: { email: compte.email, badge_verifie },
    });

    // Email seulement quand on accorde le badge (pas quand on le retire)
    if (badge_verifie && compte.email) {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://chezmonami.ma';
      const nomEntreprise = compte.structures?.[0]?.nom || compte.nom_contact;
      const titre = 'Félicitations !';
      const contenu = `
        <p>Bonjour <strong>${compte.nom_contact}</strong>,</p>
        <p>Nous avons le plaisir de vous informer que <strong>${nomEntreprise}</strong> vient d'obtenir le badge de vérification ChezMonAmi.</p>
      `;
      const highlight = `
        <div style="text-align:center;">
          <span style="font-size:40px;display:block;margin-bottom:6px;">✅</span>
          <strong style="font-size:18px;color:#2e7d32;">Entreprise Vérifiée</strong><br/>
          <span style="color:#555;font-size:13px;">Vos documents ont été vérifiés et validés par notre équipe.</span>
        </div>
      `;

      await sendEmail({
        to: compte.email,
        subject: '🏅 Vous avez obtenu le badge Vérifié sur ChezMonAmi !',
        html: baseTemplate({
          titre,
          emoji: '🏅',
          preheader: 'Votre entreprise est désormais Vérifiée',
          contenu: contenu + `<p>Ce badge apparaît désormais sur votre fiche publique et renforce la confiance des partenaires potentiels.</p>`,
          highlight,
          ctaTexte: 'Voir mon espace',
          ctaLien: `${siteUrl}/entreprise/dashboard`,
        }),
        text: baseText({
          titre,
          contenu: `Bonjour ${compte.nom_contact},\n\nFélicitations ! ${nomEntreprise} a obtenu le badge "Vérifié" sur ChezMonAmi.`,
          ctaTexte: 'Voir mon espace',
          ctaLien: `${siteUrl}/entreprise/dashboard`,
        }),
        tag: 'badge_verifie',
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PATCH badge-verifie:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
