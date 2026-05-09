// Lot Parrainage — Paramètres globaux du programme
// GET   → { affichage_actif, message_promo, mois_parrain, mois_filleul }
// PATCH → met à jour les paramètres (super_admin uniquement pour le toggle global,
//         admin pour le message). On reste simple : tout admin authentifié.
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireAdmin } from '@/lib/adminAuth';
import { logAdminAction } from '@/lib/auditLog';

export async function GET(request) {
  const admin = await requireAdmin(request);
  if (admin instanceof Response) return admin;
  const { data } = await supabaseAdmin
    .from('parametres_parrainage')
    .select('*')
    .eq('id', 1)
    .single();
  return NextResponse.json({ parametres: data });
}

export async function PATCH(request) {
  const admin = await requireAdmin(request);
  if (admin instanceof Response) return admin;
  try {
    const body = await request.json();
    const updates = { updated_at: new Date().toISOString() };
    if (body.affichage_actif !== undefined) updates.affichage_actif = !!body.affichage_actif;
    if (body.message_promo !== undefined) updates.message_promo = body.message_promo || null;
    if (body.mois_parrain !== undefined) {
      const n = parseInt(body.mois_parrain, 10);
      if (!Number.isFinite(n) || n < 0 || n > 24) {
        return NextResponse.json({ error: 'Mois parrain invalide (0-24)' }, { status: 400 });
      }
      updates.mois_parrain = n;
    }
    if (body.mois_filleul !== undefined) {
      const n = parseInt(body.mois_filleul, 10);
      if (!Number.isFinite(n) || n < 0 || n > 24) {
        return NextResponse.json({ error: 'Mois filleul invalide (0-24)' }, { status: 400 });
      }
      updates.mois_filleul = n;
    }

    const { data, error } = await supabaseAdmin
      .from('parametres_parrainage')
      .update(updates)
      .eq('id', 1)
      .select('*')
      .single();
    if (error) throw error;

    await logAdminAction({
      request, admin,
      action: 'parrainage.parametres_modifier',
      cibleType: 'parametres_parrainage',
      cibleId: 1,
      details: updates,
    });

    return NextResponse.json({ parametres: data });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
