// Lot H — Activer / désactiver la 2FA pour l'admin courant.
// GET   → { tfa_active }
// PATCH { active: true|false } → met à jour
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireAdmin } from '@/lib/adminAuth';
import { logAdminAction } from '@/lib/auditLog';

export async function GET(request) {
  const admin = await requireAdmin(request);
  if (admin instanceof Response) return admin;
  const { data } = await supabaseAdmin
    .from('admins')
    .select('tfa_active')
    .eq('id', admin.id)
    .single();
  return NextResponse.json({ tfa_active: !!data?.tfa_active });
}

export async function PATCH(request) {
  const admin = await requireAdmin(request);
  if (admin instanceof Response) return admin;
  try {
    const { active } = await request.json();
    const tfa_active = !!active;
    const { error } = await supabaseAdmin
      .from('admins')
      .update({ tfa_active })
      .eq('id', admin.id);
    if (error) throw error;

    await logAdminAction({
      request,
      admin,
      action: tfa_active ? 'admin.2fa_activer' : 'admin.2fa_desactiver',
      cibleType: 'admin',
      cibleId: admin.id,
    });

    return NextResponse.json({ success: true, tfa_active });
  } catch (err) {
    console.error('PATCH admin/tfa error:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
