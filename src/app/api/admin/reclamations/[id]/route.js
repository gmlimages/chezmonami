import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// PATCH — approuver ou refuser une réclamation
export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const { statut, message_admin } = await request.json();

    if (!['approuvee', 'refusee'].includes(statut)) {
      return NextResponse.json({ error: 'Statut invalide' }, { status: 400 });
    }

    // Récupérer la réclamation
    const { data: reclamation, error: errReclam } = await supabaseAdmin
      .from('reclamations')
      .select('id, compte_id, structure_id, statut')
      .eq('id', id)
      .single();

    if (errReclam || !reclamation) {
      return NextResponse.json({ error: 'Réclamation introuvable' }, { status: 404 });
    }

    // Mettre à jour le statut
    const { error } = await supabaseAdmin
      .from('reclamations')
      .update({ statut, message_admin: message_admin || null })
      .eq('id', id);

    if (error) throw error;

    // Si approuvée → lier la structure au compte
    if (statut === 'approuvee') {
      await supabaseAdmin
        .from('comptes_structures')
        .update({ structure_id: reclamation.structure_id })
        .eq('id', reclamation.compte_id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PATCH admin reclamation:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE — supprimer une réclamation
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const { error } = await supabaseAdmin.from('reclamations').delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE admin reclamation:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
