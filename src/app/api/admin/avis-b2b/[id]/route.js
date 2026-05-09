// PATCH /api/admin/avis-b2b/[id] — modérer (publier / rejeter / remettre en attente)
// DELETE — supprimer définitivement
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireAdmin } from '@/lib/adminAuth';
import { logAdminAction } from '@/lib/auditLog';

const STATUTS = ['en_attente', 'publie', 'rejete'];

export async function PATCH(request, { params }) {
  const admin = await requireAdmin(request);
  if (admin instanceof Response) return admin;
  try {
    const { id } = await params;
    const body = await request.json();
    const { statut, motif_rejet } = body || {};

    if (!STATUTS.includes(statut)) {
      return NextResponse.json({ error: 'Statut invalide' }, { status: 400 });
    }

    const updates = {
      statut,
      motif_rejet: statut === 'rejete' ? (motif_rejet?.trim() || null) : null,
      modere_par: admin.id,
      modere_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from('avis_b2b')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await logAdminAction({
      request,
      admin,
      action: `avis_b2b.${statut}`,
      cibleType: 'avis_b2b',
      cibleId: id,
      details: { structure_id: data?.structure_id, motif_rejet: updates.motif_rejet },
    });

    return NextResponse.json({ success: true, avis: data });
  } catch (err) {
    console.error('PATCH admin avis-b2b error:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const admin = await requireAdmin(request);
  if (admin instanceof Response) return admin;
  try {
    const { id } = await params;
    const { error } = await supabaseAdmin.from('avis_b2b').delete().eq('id', id);
    if (error) throw error;

    await logAdminAction({
      request,
      admin,
      action: 'avis_b2b.supprimer',
      cibleType: 'avis_b2b',
      cibleId: id,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE admin avis-b2b error:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
