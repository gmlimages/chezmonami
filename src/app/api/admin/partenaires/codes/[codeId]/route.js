// Lot Partenaires — Activer/désactiver un code partenaire (admin)
// PATCH { action: 'activer' | 'desactiver' | 'prolonger', validite_jours? }
// DELETE : seulement codes campagne, jamais le code permanent
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireAdmin } from '@/lib/adminAuth';
import { logAdminAction } from '@/lib/auditLog';

export async function PATCH(request, { params }) {
  const admin = await requireAdmin(request);
  if (admin instanceof Response) return admin;
  try {
    const { codeId } = await params;
    const body = await request.json();

    const { data: code } = await supabaseAdmin
      .from('codes_partenaires')
      .select('id, type, partenaire_id')
      .eq('id', codeId)
      .single();
    if (!code) return NextResponse.json({ error: 'Code introuvable' }, { status: 404 });

    if (body.action === 'activer' || body.action === 'desactiver') {
      // Le code permanent ne peut pas être désactivé (sauf via suppression du partenaire)
      if (code.type === 'permanent' && body.action === 'desactiver') {
        return NextResponse.json({ error: 'Le code permanent ne peut être désactivé. Supprimez le partenaire pour cela.' }, { status: 400 });
      }
      await supabaseAdmin
        .from('codes_partenaires')
        .update({ actif: body.action === 'activer' })
        .eq('id', codeId);
      await logAdminAction({
        request, admin,
        action: `partenaire.code_${body.action}`,
        cibleType: 'code_partenaire',
        cibleId: codeId,
      });
      return NextResponse.json({ success: true });
    }

    if (body.action === 'prolonger') {
      const jours = Number(body.validite_jours);
      if (!Number.isFinite(jours) || jours < 0 || jours > 1825) {
        return NextResponse.json({ error: 'Validité invalide (0-1825 jours)' }, { status: 400 });
      }
      const date_expiration = jours === 0
        ? null
        : new Date(Date.now() + jours * 86400000).toISOString();
      await supabaseAdmin
        .from('codes_partenaires')
        .update({ date_expiration, actif: true })
        .eq('id', codeId);
      await logAdminAction({
        request, admin,
        action: 'partenaire.code_prolonger',
        cibleType: 'code_partenaire',
        cibleId: codeId,
        details: { date_expiration },
      });
      return NextResponse.json({ success: true, date_expiration });
    }

    return NextResponse.json({ error: 'Action invalide' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const admin = await requireAdmin(request);
  if (admin instanceof Response) return admin;
  try {
    const { codeId } = await params;
    const { data: code } = await supabaseAdmin
      .from('codes_partenaires')
      .select('id, type')
      .eq('id', codeId)
      .single();
    if (!code) return NextResponse.json({ error: 'Code introuvable' }, { status: 404 });
    if (code.type === 'permanent') {
      return NextResponse.json({ error: 'Le code permanent ne peut être supprimé' }, { status: 400 });
    }
    // Si le code a été utilisé (filleuls liés), on désactive plutôt que supprimer
    const { count } = await supabaseAdmin
      .from('comptes_structures')
      .select('id', { count: 'exact', head: true })
      .eq('code_partenaire_id', codeId);
    if ((count || 0) > 0) {
      await supabaseAdmin.from('codes_partenaires').update({ actif: false }).eq('id', codeId);
      await logAdminAction({
        request, admin,
        action: 'partenaire.code_desactiver',
        cibleType: 'code_partenaire',
        cibleId: codeId,
        details: { raison: 'code_deja_utilise' },
      });
      return NextResponse.json({ success: true, hard_delete: false });
    }
    await supabaseAdmin.from('codes_partenaires').delete().eq('id', codeId);
    await logAdminAction({
      request, admin,
      action: 'partenaire.code_supprimer',
      cibleType: 'code_partenaire',
      cibleId: codeId,
    });
    return NextResponse.json({ success: true, hard_delete: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
