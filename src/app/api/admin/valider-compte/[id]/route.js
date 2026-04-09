import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

function emailValidationHTML(compte) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://chezmonami.ma';
  const nomEntreprise = compte.structures?.[0]?.nom || compte.nom_contact;
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Compte validé — ChezMonAmi</title>
  <style>
    body { font-family: Arial, sans-serif; background:#f4f4f4; margin:0; padding:0; }
    .container { max-width:600px; margin:30px auto; background:#fff; border-radius:12px; overflow:hidden; }
    .header { background:#2e7d32; padding:30px; text-align:center; }
    .header h1 { color:#fff; margin:0; font-size:22px; }
    .body { padding:30px; color:#333; line-height:1.8; font-size:15px; }
    .cta { display:inline-block; margin-top:20px; padding:13px 30px; background:#2e7d32; color:#fff; text-decoration:none; border-radius:8px; font-weight:bold; font-size:15px; }
    .footer { background:#f9f9f9; padding:20px; text-align:center; font-size:12px; color:#999; border-top:1px solid #eee; }
    .highlight { background:#e8f5e9; border-left:4px solid #2e7d32; padding:12px 16px; border-radius:4px; margin:16px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Votre compte a été validé !</h1>
    </div>
    <div class="body">
      <p>Bonjour <strong>${compte.nom_contact}</strong>,</p>
      <p>Nous avons le plaisir de vous informer que votre compte entreprise <strong>${nomEntreprise}</strong> a été validé par notre équipe.</p>
      <div class="highlight">
        <strong>Vous pouvez dès maintenant :</strong><br/>
        • Compléter et soumettre votre fiche entreprise<br/>
        • Accéder aux appels d'offres<br/>
        • Contacter d'autres entreprises partenaires<br/>
        • Gérer vos documents
      </div>
      <p>Connectez-vous à votre espace entreprise pour commencer :</p>
      <p><a href="${siteUrl}/entreprise/connexion" class="cta">Accéder à mon espace</a></p>
      <p style="color:#888;font-size:13px;margin-top:24px;">
        Si vous n'êtes pas à l'origine de cette inscription, ignorez cet email.
      </p>
    </div>
    <div class="footer">
      <p>ChezMonAmi — Votre annuaire panafricain de confiance</p>
      <p><a href="${siteUrl}" style="color:#999;">chezmonami.ma</a></p>
    </div>
  </div>
</body>
</html>`;
}

// POST /api/admin/valider-compte/[id]
export async function POST(request, { params }) {
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

    // Envoyer l'email de validation via Resend
    if (process.env.RESEND_API_KEY && compte.email) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM || 'noreply@chezmonami.ma',
          to: [compte.email],
          subject: '✅ Votre compte ChezMonAmi a été validé',
          html: emailValidationHTML(compte),
          text: `Bonjour ${compte.nom_contact},\n\nVotre compte entreprise a été validé. Connectez-vous sur ${process.env.NEXT_PUBLIC_SITE_URL}/entreprise/connexion\n\nChezMonAmi`,
        }),
      }).catch(err => console.warn('Email validation non envoyé:', err.message));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('POST valider-compte:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
