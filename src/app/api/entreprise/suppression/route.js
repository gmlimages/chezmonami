import { NextResponse } from 'next/server';
import { supabaseAdmin, getCompteFromToken } from '@/lib/supabaseAdmin';

// POST — demander la suppression du compte
export async function POST(request) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    const compte = await getCompteFromToken(token);
    if (!compte) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const { motif } = body;

    // Mettre à jour le compte avec la demande de suppression
    const { error: updateError } = await supabaseAdmin
      .from('comptes_structures')
      .update({
        demande_suppression: true,
        date_demande_suppression: new Date().toISOString(),
        motif_suppression: motif?.trim() || null,
      })
      .eq('id', compte.id);

    if (updateError) throw updateError;

    // Notifier les admins
    await supabaseAdmin.from('notifications_admin').insert({
      admin_id: null,
      type: 'demande_suppression',
      titre: `Suppression : ${compte.nom_contact}`,
      contenu: `${compte.nom_contact} demande la suppression de son compte`,
      lien: '/admin/comptes-entreprises',
      reference_type: 'compte',
      reference_id: compte.id,
    });

    return NextResponse.json({
      success: true,
      message: 'Demande de suppression enregistrée',
    });
  } catch (error) {
    console.error('Erreur POST suppression:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE — annuler la demande de suppression
export async function DELETE(request) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    const compte = await getCompteFromToken(token);
    if (!compte) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const { error: updateError } = await supabaseAdmin
      .from('comptes_structures')
      .update({
        demande_suppression: false,
        date_demande_suppression: null,
        motif_suppression: null,
      })
      .eq('id', compte.id);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur DELETE suppression:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
