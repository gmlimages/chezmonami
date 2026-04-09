import { NextResponse } from 'next/server';
import { supabaseAdmin, getCompteFromToken } from '@/lib/supabaseAdmin';

// POST — créer une nouvelle structure (brouillon ou soumission) et la lier au compte
export async function POST(request) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    const compte = await getCompteFromToken(token);
    if (!compte) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    if (compte.structure_id) {
      return NextResponse.json({ error: 'Ce compte est déjà lié à une structure' }, { status: 400 });
    }

    const body = await request.json();
    const { nom } = body;

    if (!nom || !nom.trim()) {
      return NextResponse.json({ error: 'Le nom de la structure est requis' }, { status: 400 });
    }

    const { data: structure, error: errStructure } = await supabaseAdmin
      .from('structures')
      .insert({
        nom: nom.trim(),
        description: body.description?.trim() || null,
        description_longue: body.description_longue?.trim() || null,
        categorie_id: body.categorie_id || null,
        pays_id: body.pays_id || null,
        ville_id: body.ville_id || null,
        adresse: body.adresse?.trim() || null,
        site_web: body.site_web?.trim() || null,
        annee_creation: body.annee_creation === '' || body.annee_creation == null ? null : parseInt(body.annee_creation, 10) || null,
        nombre_employes: body.nombre_employes === '' || body.nombre_employes == null ? null : parseInt(body.nombre_employes, 10) || null,
        images: body.images || [],
        galerie: body.galerie || [],
        youtube_video_url: body.youtube_video_url || null,
        youtube_video_url_2: body.youtube_video_url_2 || null,
        horaires: body.horaires || {},
        horaires_detailles: body.horaires_detailles || {},
        langues_parlees: body.langues_parlees || [],
        modes_paiement: body.modes_paiement || [],
        services_inclus: body.services_inclus || [],
        certificats: body.certificats || [],
        livraison_locale: body.livraison_locale || false,
        livraison_internationale: body.livraison_internationale || false,
        click_and_collect: body.click_and_collect || false,
        sur_place: body.sur_place !== undefined ? body.sur_place : true,
        cta_principal: body.cta_principal || null,
        cta_secondaire: body.cta_secondaire || null,
        politique_annulation: body.politique_annulation?.trim() || null,
        statut: body.statut === 'soumis' ? 'soumis' : 'brouillon',
        // Champs réservés à l'admin
        telephone: '+212 693 908 389',
        email: 'contact@chezmonami.ma',
        verifie: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('id, nom')
      .single();

    if (errStructure) throw errStructure;

    // Lier la structure au compte
    const { error: errLien } = await supabaseAdmin
      .from('comptes_structures')
      .update({ structure_id: structure.id })
      .eq('id', compte.id);

    if (errLien) {
      await supabaseAdmin.from('structures').delete().eq('id', structure.id);
      throw errLien;
    }

    return NextResponse.json({ success: true, structure });
  } catch (error) {
    console.error('POST structures error:', error);
    return NextResponse.json({ error: 'Erreur lors de la création : ' + error.message }, { status: 500 });
  }
}
