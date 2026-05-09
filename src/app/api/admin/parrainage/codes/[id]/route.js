// Lot Parrainage — Révoquer ou prolonger un code (admin)
// PATCH { action: 'revoquer' } | { action: 'prolonger', validite_jours: number }
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireAdmin } from '@/lib/adminAuth';
import { logAdminAction } from '@/lib/auditLog';
import { calculerExpiration } from '@/lib/parrainage';

export async function PATCH(request, { params }) {
  const admin = await requireAdmin(request);
  if (admin instanceof Response) return admin;
  try {
    const { id } = await params;
    const body = await request.json();

    const { data: code } = await supabaseAdmin
      .from('codes_parrainage')
      .select('*')
      .eq('id', id)
      .single();
    if (!code) return NextResponse.json({ error: 'Code introuvable' }, { status: 404 });

    if (body.action === 'revoquer') {
      if (code.utilise_par_compte_id) {
        return NextResponse.json({ error: 'Ce code a déjà été utilisé' }, { status: 400 });
      }
      await supabaseAdmin
        .from('codes_parrainage')
        .update({ actif: false })
        .eq('id', id);
      await logAdminAction({
        request, admin,
        action: 'parrainage.code_revoquer',
        cibleType: 'code_parrainage',
        cibleId: id,
      });
      return NextResponse.json({ success: true });
    }

    if (body.action === 'prolonger') {
      const jours = parseInt(body.validite_jours, 10);
      if (!Number.isFinite(jours) || jours < 0 || jours > 730) {
        return NextResponse.json({ error: 'Validité invalide (0-730)' }, { status: 400 });
      }
      const expiration = calculerExpiration({ days: jours });
      await supabaseAdmin
        .from('codes_parrainage')
        .update({ date_expiration: expiration, actif: true })
        .eq('id', id);
      await logAdminAction({
        request, admin,
        action: 'parrainage.code_prolonger',
        cibleType: 'code_parrainage',
        cibleId: id,
        details: { nouvelle_expiration: expiration },
      });
      return NextResponse.json({ success: true, date_expiration: expiration });
    }

    return NextResponse.json({ error: 'Action invalide' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE — Soft delete côté admin. Supprime définitivement si l'entreprise a aussi supprimé de son côté.
export async function DELETE(request, { params }) {
  const admin = await requireAdmin(request);
  if (admin instanceof Response) return admin;
  try {
    const { id } = await params;

    const { data: code } = await supabaseAdmin
      .from('codes_parrainage')
      .select('id, supprime_par_admin, supprime_par_entreprise')
      .eq('id', id)
      .single();
    if (!code) return NextResponse.json({ error: 'Code introuvable' }, { status: 404 });

    if (code.supprime_par_entreprise) {
      // Suppression définitive
      await supabaseAdmin.from('codes_parrainage').delete().eq('id', id);
      await logAdminAction({
        request, admin,
        action: 'parrainage.code_supprimer_definitif',
        cibleType: 'code_parrainage',
        cibleId: id,
      });
      return NextResponse.json({ success: true, hard_delete: true });
    }

    // Soft delete admin
    await supabaseAdmin
      .from('codes_parrainage')
      .update({ supprime_par_admin: true })
      .eq('id', id);
    await logAdminAction({
      request, admin,
      action: 'parrainage.code_supprimer_admin',
      cibleType: 'code_parrainage',
      cibleId: id,
    });
    return NextResponse.json({ success: true, hard_delete: false });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
