import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireAdmin } from '@/lib/adminAuth';
import { logAdminAction } from '@/lib/auditLog';

// PUT — modifier une structure (admin)
export async function PUT(request, { params }) {
  const admin = await requireAdmin(request);
  if (admin instanceof Response) return admin;
  try {
    const { id } = await params;
    const body = await request.json();

    const { data, error } = await supabaseAdmin
      .from('structures')
      .update(body)
      .eq('id', id)
      .select(`
        *,
        pays:pays_id(id, nom, devise),
        ville:ville_id(id, nom),
        categorie:categorie_id(id, nom, icon, color)
      `)
      .single();

    if (error) throw error;

    // Détecter publication / dépublication pour un audit log précis
    let action = 'structure.modifier';
    if (Object.prototype.hasOwnProperty.call(body, 'statut')) {
      if (body.statut === 'publie') action = 'structure.publier';
      else if (body.statut === 'brouillon') action = 'structure.depublier';
    }
    await logAdminAction({
      request,
      admin,
      action,
      cibleType: 'structure',
      cibleId: id,
      details: { champs_modifies: Object.keys(body) },
    });

    return NextResponse.json({ success: true, structure: data });
  } catch (error) {
    console.error('PUT admin/structures/[id] error:', error);
    return NextResponse.json({ error: 'Erreur serveur : ' + error.message }, { status: 500 });
  }
}

// DELETE — supprimer une structure (admin)
export async function DELETE(request, { params }) {
  const admin = await requireAdmin(request);
  if (admin instanceof Response) return admin;
  try {
    const { id } = await params;

    const { error } = await supabaseAdmin
      .from('structures')
      .delete()
      .eq('id', id);

    if (error) throw error;

    await logAdminAction({
      request,
      admin,
      action: 'structure.supprimer',
      cibleType: 'structure',
      cibleId: id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE admin/structures/[id] error:', error);
    return NextResponse.json({ error: 'Erreur serveur : ' + error.message }, { status: 500 });
  }
}
