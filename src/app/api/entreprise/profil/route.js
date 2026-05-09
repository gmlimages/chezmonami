import { NextResponse } from 'next/server';
import { supabaseAdmin, getCompteFromToken } from '@/lib/supabaseAdmin';
import bcrypt from 'bcryptjs';

// GET — récupérer le profil complet
export async function GET(request) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    const compte = await getCompteFromToken(token);
    if (!compte) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    // Récupérer réclamation en cours si elle existe
    const { data: reclamation } = await supabaseAdmin
      .from('reclamations')
      .select('id, statut, message, message_admin, created_at, structures(id, nom, categorie_id, ville_id, pays_id)')
      .eq('compte_id', compte.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Compter les documents validés (utilisé par les quêtes de profil)
    const { count: nbDocsValides } = await supabaseAdmin
      .from('documents_entreprises')
      .select('id', { count: 'exact', head: true })
      .eq('compte_id', compte.id)
      .eq('statut', 'valide');

    return NextResponse.json({
      compte,
      reclamation: reclamation || null,
      nb_docs_valides: nbDocsValides || 0,
    });
  } catch (error) {
    console.error('Erreur GET profil:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PUT — mettre à jour le profil
export async function PUT(request) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    const compte = await getCompteFromToken(token);
    if (!compte) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const body = await request.json();
    const { nom_contact, telephone, photo_profil, ancien_mdp, nouveau_mdp } = body;

    const updates = {};

    if (nom_contact?.trim()) updates.nom_contact = nom_contact.trim();
    if (telephone !== undefined) updates.telephone = telephone?.trim() || null;
    if (photo_profil !== undefined) updates.photo_profil = photo_profil;
    updates.updated_at = new Date().toISOString();

    // Changement de mot de passe
    if (nouveau_mdp) {
      if (!ancien_mdp) {
        return NextResponse.json({ error: 'Ancien mot de passe requis' }, { status: 400 });
      }
      if (nouveau_mdp.length < 8) {
        return NextResponse.json({ error: 'Le nouveau mot de passe doit contenir au moins 8 caractères' }, { status: 400 });
      }

      // Récupérer le hash actuel
      const { data: full } = await supabaseAdmin
        .from('comptes_structures')
        .select('mot_de_passe')
        .eq('id', compte.id)
        .single();

      const valid = await bcrypt.compare(ancien_mdp, full.mot_de_passe);
      if (!valid) {
        return NextResponse.json({ error: 'Ancien mot de passe incorrect' }, { status: 400 });
      }

      updates.mot_de_passe = await bcrypt.hash(nouveau_mdp, 12);
    }

    const { error } = await supabaseAdmin
      .from('comptes_structures')
      .update(updates)
      .eq('id', compte.id);

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Profil mis à jour avec succès' });

  } catch (error) {
    console.error('Erreur PUT profil:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
