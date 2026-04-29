import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireAdmin } from '@/lib/adminAuth';

export async function GET(request, { params }) {
  const admin = await requireAdmin(request);
  if (admin instanceof Response) return admin;
  try {
    const { id } = await params;
    // Retourne l'historique de la commande
    const { data, error } = await supabaseAdmin
      .from('commandes_historique')
      .select('*')
      .eq('commande_id', id)
      .order('date_modification', { ascending: true });
    if (error) throw error;
    return NextResponse.json({ historique: data });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  const admin = await requireAdmin(request);
  if (admin instanceof Response) return admin;
  try {
    const { id } = await params;
    const body = await request.json();
    const { historique, ...updateData } = body;

    // Mise à jour de la commande
    const { data, error } = await supabaseAdmin
      .from('commandes')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;

    // Ajouter entrée historique si fournie
    if (historique) {
      await supabaseAdmin.from('commandes_historique').insert({
        commande_id: id,
        ...historique,
      }).catch(() => {});
    }

    return NextResponse.json({ commande: data });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const admin = await requireAdmin(request);
  if (admin instanceof Response) return admin;
  try {
    const { id } = await params;
    const { error } = await supabaseAdmin
      .from('commandes')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
