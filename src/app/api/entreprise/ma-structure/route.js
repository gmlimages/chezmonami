import { NextResponse } from 'next/server';
import { supabaseAdmin, getCompteFromToken } from '@/lib/supabaseAdmin';

// GET — récupérer la structure liée au compte
export async function GET(request) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    const compte = await getCompteFromToken(token);
    if (!compte) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    if (!compte.structure_id) {
      return NextResponse.json({ error: 'Aucune structure liée à ce compte' }, { status: 404 });
    }

    const { data: structure, error } = await supabaseAdmin
      .from('structures')
      .select(`
        *,
        categorie:categorie_id(id, nom, icon, color),
        pays:pays_id(id, nom, devise),
        ville:ville_id(id, nom)
      `)
      .eq('id', compte.structure_id)
      .single();

    if (error) throw error;
    if (!structure) return NextResponse.json({ error: 'Structure introuvable' }, { status: 404 });

    return NextResponse.json({ structure });
  } catch (error) {
    console.error('GET ma-structure error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PUT — mettre à jour les informations de la structure (champs autorisés seulement)
export async function PUT(request) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    const compte = await getCompteFromToken(token);
    if (!compte) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    if (!compte.structure_id) {
      return NextResponse.json({ error: 'Aucune structure liée à ce compte' }, { status: 404 });
    }

    const body = await request.json();

    // Champs autorisés (téléphone, email, verifie, badge_verifie réservés à l'admin)
    const CHAMPS_AUTORISES = [
      'nom', 'description', 'description_longue',
      'categorie_id',
      'adresse', 'site_web',
      'pays_id', 'ville_id',
      'images', 'galerie',
      'cta_principal', 'cta_secondaire', 'canaux_contact',
      'services_inclus', 'politique_annulation',
      'annee_creation', 'nombre_employes',
      'horaires', 'horaires_detailles',
      'langues_parlees', 'modes_paiement', 'certificats',
      'livraison_locale', 'livraison_internationale',
      'click_and_collect', 'sur_place',
      'youtube_video_url', 'youtube_video_url_2',
      'statut',
    ];

    const CHAMPS_INTEGER = ['annee_creation', 'nombre_employes'];

    const updates = {};
    for (const champ of CHAMPS_AUTORISES) {
      if (body[champ] !== undefined) {
        if (CHAMPS_INTEGER.includes(champ)) {
          updates[champ] = body[champ] === '' || body[champ] === null ? null : parseInt(body[champ], 10) || null;
        } else {
          updates[champ] = body[champ];
        }
      }
    }

    // Empêcher la société de remettre le statut en brouillon depuis soumis
    if (updates.statut && !['brouillon', 'soumis'].includes(updates.statut)) {
      delete updates.statut;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Aucune donnée à mettre à jour' }, { status: 400 });
    }

    updates.updated_at = new Date().toISOString();

    const { data: structure, error } = await supabaseAdmin
      .from('structures')
      .update(updates)
      .eq('id', compte.structure_id)
      .select(`
        *,
        categorie:categorie_id(id, nom, icon, color),
        pays:pays_id(id, nom, devise),
        ville:ville_id(id, nom)
      `)
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, structure, message: 'Fiche mise à jour avec succès' });
  } catch (error) {
    console.error('PUT ma-structure error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
