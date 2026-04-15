import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireAdmin } from '@/lib/adminAuth';

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
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE admin/structures/[id] error:', error);
    return NextResponse.json({ error: 'Erreur serveur : ' + error.message }, { status: 500 });
  }
}
