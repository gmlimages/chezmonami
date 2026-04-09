import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

function emailBadgeHTML(compte) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://chezmonami.ma';
  const nomEntreprise = compte.structures?.[0]?.nom || compte.nom_contact;
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Badge Vérifié — ChezMonAmi</title>
  <style>
    body { font-family: Arial, sans-serif; background:#f4f4f4; margin:0; padding:0; }
    .container { max-width:600px; margin:30px auto; background:#fff; border-radius:12px; overflow:hidden; }
    .header { background:#2e7d32; padding:30px; text-align:center; }
    .header h1 { color:#fff; margin:0; font-size:22px; }
    .body { padding:30px; color:#333; line-height:1.8; font-size:15px; }
    .badge-box { background:#e8f5e9; border:2px solid #2e7d32; border-radius:12px; padding:20px; text-align:center; margin:20px 0; }
    .badge-box .badge-icon { font-size:48px; display:block; margin-bottom:8px; }
    .cta { display:inline-block; margin-top:20px; padding:13px 30px; background:#2e7d32; color:#fff; text-decoration:none; border-radius:8px; font-weight:bold; font-size:15px; }
    .footer { background:#f9f9f9; padding:20px; text-align:center; font-size:12px; color:#999; border-top:1px solid #eee; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏅 Félicitations !</h1>
    </div>
    <div class="body">
      <p>Bonjour <strong>${compte.nom_contact}</strong>,</p>
      <p>Nous avons le plaisir de vous informer que <strong>${nomEntreprise}</strong> vient d'obtenir le badge de vérification ChezMonAmi.</p>
      <div class="badge-box">
        <span class="badge-icon">✅</span>
        <strong style="font-size:18px;color:#2e7d32;">Entreprise Vérifiée</strong><br/>
        <span style="color:#555;font-size:13px;">Vos documents ont été vérifiés et validés par notre équipe.</span>
      </div>
      <p>Ce badge apparaît désormais sur votre fiche publique et renforce la confiance des partenaires potentiels.</p>
      <p><a href="${siteUrl}/entreprise/dashboard" class="cta">Voir mon espace</a></p>
    </div>
    <div class="footer">
      <p>ChezMonAmi — Votre annuaire panafricain de confiance</p>
    </div>
  </div>
</body>
</html>`;
}

// PATCH /api/admin/badge-verifie/[id]  — toggle badge et email si activé
export async function PATCH(request, { params }) {
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

    // Email seulement quand on accorde le badge (pas quand on le retire)
    if (badge_verifie && process.env.RESEND_API_KEY && compte.email) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM || 'noreply@chezmonami.ma',
          to: [compte.email],
          subject: '🏅 Vous avez obtenu le badge Vérifié sur ChezMonAmi !',
          html: emailBadgeHTML(compte),
          text: `Bonjour ${compte.nom_contact},\n\nFélicitations ! Votre entreprise a obtenu le badge "Vérifié" sur ChezMonAmi. Connectez-vous sur ${process.env.NEXT_PUBLIC_SITE_URL}/entreprise/dashboard\n\nChezMonAmi`,
        }),
      }).catch(err => console.warn('Email badge non envoyé:', err.message));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PATCH badge-verifie:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
