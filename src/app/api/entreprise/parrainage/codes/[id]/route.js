// Lot Parrainage — Suppression d'un code côté entreprise (soft delete)
// Si l'admin a déjà supprimé de son côté → suppression définitive.
import { NextResponse } from 'next/server';
import { supabaseAdmin, getCompteFromToken } from '@/lib/supabaseAdmin';

function getToken(request) {
  const auth = request.headers.get('authorization') || '';
  return auth.startsWith('Bearer ') ? auth.slice(7) : null;
}

export async function DELETE(request, { params }) {
  const compte = await getCompteFromToken(getToken(request));
  if (!compte) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  try {
    const { id } = await params;

    const { data: code } = await supabaseAdmin
      .from('codes_parrainage')
      .select('id, parrain_compte_id, supprime_par_admin, supprime_par_entreprise')
      .eq('id', id)
      .single();
    if (!code) return NextResponse.json({ error: 'Code introuvable' }, { status: 404 });
    if (code.parrain_compte_id !== compte.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    if (code.supprime_par_admin) {
      // Suppression définitive
      await supabaseAdmin.from('codes_parrainage').delete().eq('id', id);
      return NextResponse.json({ success: true, hard_delete: true });
    }

    await supabaseAdmin
      .from('codes_parrainage')
      .update({ supprime_par_entreprise: true })
      .eq('id', id);
    return NextResponse.json({ success: true, hard_delete: false });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
