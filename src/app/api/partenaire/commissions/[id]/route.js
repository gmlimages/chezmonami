// Lot Partenaires — Le partenaire confirme ou conteste une commission payée par l'admin.
// PATCH { action: 'confirmer' | 'contester', motif_contestation? }
import { NextResponse } from 'next/server';
import { supabaseAdmin, getPartenaireFromToken } from '@/lib/supabaseAdmin';
import { sendEmail, baseTemplate } from '@/lib/email';

function getToken(request) {
  const auth = request.headers.get('authorization') || '';
  return auth.startsWith('Bearer ') ? auth.slice(7) : null;
}

export async function PATCH(request, { params }) {
  const partenaire = await getPartenaireFromToken(getToken(request));
  if (!partenaire) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  try {
    const { id } = await params;
    const body = await request.json();

    const { data: c } = await supabaseAdmin
      .from('commissions_partenaires')
      .select('*')
      .eq('id', id)
      .single();
    if (!c) return NextResponse.json({ error: 'Commission introuvable' }, { status: 404 });
    if (c.partenaire_id !== partenaire.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    if (body.action === 'confirmer') {
      if (c.statut !== 'payee_admin') {
        return NextResponse.json({ error: 'Cette commission n\'est pas en attente de confirmation' }, { status: 400 });
      }
      await supabaseAdmin
        .from('commissions_partenaires')
        .update({
          statut: 'validee',
          date_validee_partenaire: new Date().toISOString(),
          validation_auto: false,
        })
        .eq('id', id);
      return NextResponse.json({ success: true });
    }

    if (body.action === 'contester') {
      if (c.statut !== 'payee_admin') {
        return NextResponse.json({ error: 'Cette commission n\'est pas en attente de confirmation' }, { status: 400 });
      }
      const motif = (body.motif_contestation || '').trim();
      if (!motif) {
        return NextResponse.json({ error: 'Motif de contestation obligatoire' }, { status: 400 });
      }
      await supabaseAdmin
        .from('commissions_partenaires')
        .update({
          statut: 'contestee',
          date_contestee: new Date().toISOString(),
          motif_contestation: motif,
        })
        .eq('id', id);

      // Notifie l'admin via notifications_admin
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://chezmonami.ma';
      await supabaseAdmin.from('notifications_admin').insert({
        admin_id: null,
        type: 'commission_contestee',
        titre: `Commission contestée par ${partenaire.nom_complet}`,
        contenu: `${partenaire.nom_complet} conteste la commission de ${Number(c.montant_commission_mad).toFixed(2)} MAD. Motif : ${motif}`,
        lien: '/admin/parrainage',
        reference_type: 'commission',
        reference_id: id,
      }).catch(() => {});

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Action invalide' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
