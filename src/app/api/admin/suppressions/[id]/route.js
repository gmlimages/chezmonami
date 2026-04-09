import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// PATCH — valider (supprimer) ou rejeter une demande de suppression
export async function PATCH(request, { params }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Identifiant du compte requis' }, { status: 400 });
    }

    const body = await request.json();
    const { action } = body;

    if (!action || !['supprimer', 'rejeter'].includes(action)) {
      return NextResponse.json(
        { error: 'Action invalide. Valeurs acceptées : "supprimer" | "rejeter"' },
        { status: 400 }
      );
    }

    // Vérifier que le compte existe
    const { data: compte, error: fetchError } = await supabaseAdmin
      .from('comptes_structures')
      .select('id, nom_contact, demande_suppression')
      .eq('id', id)
      .single();

    if (fetchError || !compte) {
      return NextResponse.json({ error: 'Compte introuvable' }, { status: 404 });
    }

    if (action === 'supprimer') {
      // Supprimer le compte (les données liées sont supprimées en cascade)
      const { error: deleteError } = await supabaseAdmin
        .from('comptes_structures')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      return NextResponse.json({ success: true });
    }

    if (action === 'rejeter') {
      // Annuler le drapeau de suppression
      const { error: updateError } = await supabaseAdmin
        .from('comptes_structures')
        .update({
          demande_suppression: false,
          date_demande_suppression: null,
          motif_suppression: null,
        })
        .eq('id', id);

      if (updateError) throw updateError;

      return NextResponse.json({ success: true });
    }
  } catch (error) {
    console.error('Erreur PATCH admin suppression:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
