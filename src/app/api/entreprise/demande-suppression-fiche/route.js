import { NextResponse } from 'next/server';
import { supabaseAdmin, getCompteFromToken } from '@/lib/supabaseAdmin';

// POST — demander la suppression de la fiche de l'entreprise
export async function POST(request) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    const compte = await getCompteFromToken(token);
    if (!compte) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    if (!compte.structure_id) {
      return NextResponse.json({ error: 'Aucune fiche liée à votre compte' }, { status: 400 });
    }

    const { motif } = await request.json();

    const { data: structure } = await supabaseAdmin
      .from('structures')
      .select('id, nom')
      .eq('id', compte.structure_id)
      .single();

    // Créer une notification admin
    await supabaseAdmin.from('notifications_admin').insert({
      admin_id: null,
      type: 'demande_suppression_fiche',
      titre: `Demande de suppression de fiche : ${structure?.nom || compte.structure_id}`,
      contenu: `${compte.nom_contact} demande la suppression de sa fiche "${structure?.nom}".${motif ? `\nMotif : ${motif}` : ''}`,
      lien: '/admin/comptes-entreprises',
      reference_type: 'structure',
      reference_id: compte.structure_id,
    });

    // Aussi créer un message admin pour traçabilité
    await supabaseAdmin.from('messages_entreprises').insert({
      compte_id: compte.id,
      sujet: `Demande de suppression de fiche — ${structure?.nom}`,
      contenu: `Je souhaite supprimer ma fiche "${structure?.nom}"${motif ? `.\n\nMotif : ${motif}` : '.'}`,
      statut: 'nouveau',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('POST demande-suppression-fiche:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
