// Lot Partenaires — Génération d'un code campagne pour un partenaire
// POST : crée un code campagne (avec %, mois, réduction filleul, date_expiration optionnelle)
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireAdmin } from '@/lib/adminAuth';
import { logAdminAction } from '@/lib/auditLog';
import { genererCodePartenaireUnique } from '@/lib/partenaires';
import { sendEmail, baseTemplate } from '@/lib/email';

export async function POST(request, { params }) {
  const admin = await requireAdmin(request);
  if (admin instanceof Response) return admin;
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      nom_campagne,
      pourcentage_override = null,
      mois_filleul = 0,
      reduction_filleul_pct = 0,
      validite_jours = null, // null = sans expiration
    } = body;

    const { data: partenaire } = await supabaseAdmin
      .from('comptes_partenaires')
      .select('id, email, nom_complet, actif, supprime')
      .eq('id', id)
      .single();
    if (!partenaire || partenaire.supprime || !partenaire.actif) {
      return NextResponse.json({ error: 'Partenaire introuvable ou inactif' }, { status: 404 });
    }

    const code = await genererCodePartenaireUnique('campagne');
    const date_expiration = (validite_jours && Number(validite_jours) > 0)
      ? new Date(Date.now() + Number(validite_jours) * 86400000).toISOString()
      : null;

    const { data: nouveau, error } = await supabaseAdmin
      .from('codes_partenaires')
      .insert({
        partenaire_id: id,
        code,
        type: 'campagne',
        pourcentage_override,
        mois_filleul,
        reduction_filleul_pct,
        nom_campagne: nom_campagne || null,
        date_expiration,
        created_by_admin_id: admin.id,
      })
      .select()
      .single();
    if (error) throw error;

    // Email notif au partenaire
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://chezmonami.ma';
    await sendEmail({
      to: partenaire.email,
      subject: '🎁 Nouveau code campagne disponible',
      tag: 'partenaire_code_campagne',
      html: baseTemplate({
        titre: 'Nouveau code campagne',
        contenu: `
          <p>Bonjour ${partenaire.nom_complet},</p>
          <p>L'administration vient de créer un code campagne pour vous :</p>
          <p><strong>Code :</strong> <code style="font-size:18px;font-weight:bold;">${code}</code>${nom_campagne ? ` — <em>${nom_campagne}</em>` : ''}</p>
          ${pourcentage_override != null ? `<p>Commission spécifique : <strong>${pourcentage_override}%</strong></p>` : ''}
          ${mois_filleul > 0 ? `<p>Bonus filleul : <strong>+${mois_filleul} mois offerts</strong></p>` : ''}
          ${reduction_filleul_pct > 0 ? `<p>Réduction filleul : <strong>-${reduction_filleul_pct}%</strong></p>` : ''}
          ${date_expiration ? `<p>Valable jusqu'au : <strong>${new Date(date_expiration).toLocaleDateString('fr-FR')}</strong></p>` : '<p>Sans date d\'expiration.</p>'}
        `,
        ctaTexte: 'Voir mon tableau de bord',
        ctaLien: `${siteUrl}/partenaire/dashboard`,
      }),
      text: `Nouveau code campagne: ${code}`,
    });

    await logAdminAction({
      request, admin,
      action: 'partenaire.code_campagne_creer',
      cibleType: 'code_partenaire',
      cibleId: nouveau.id,
      details: { code, partenaire_id: id, nom_campagne },
    });

    return NextResponse.json({ success: true, code: nouveau });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
