import { NextResponse } from 'next/server';
import { supabaseAdmin, getCompteFromToken, hasFullAccess } from '@/lib/supabaseAdmin';

// GET — rechercher des comptes entreprises actifs (pour messagerie B2B)
export async function GET(request) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    const compte = await getCompteFromToken(token);
    if (!compte) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    if (!hasFullAccess(compte)) {
      return NextResponse.json({ error: 'Abonnement requis', code: 'ABONNEMENT_REQUIS' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim();

    if (!q || q.length < 2) return NextResponse.json({ comptes: [] });

    // Requête 1 : chercher par nom_contact
    const { data: parContact } = await supabaseAdmin
      .from('comptes_structures')
      .select(`id, nom_contact, badge_verifie, structures (id, nom, categories (nom, icon), villes (nom))`)
      .eq('statut', 'actif')
      .neq('id', compte.id)
      .ilike('nom_contact', `%${q}%`)
      .limit(10);

    // Requête 2 : chercher par nom de la structure
    const { data: parStructure } = await supabaseAdmin
      .from('structures')
      .select(`id, nom, categories (nom, icon), villes (nom), comptes_structures!inner (id, nom_contact, badge_verifie, statut)`)
      .ilike('nom', `%${q}%`)
      .eq('comptes_structures.statut', 'actif')
      .neq('comptes_structures.id', compte.id)
      .limit(10);

    // Fusionner sans doublons
    const comptesParContact = parContact || [];
    const comptesParStructure = (parStructure || [])
      .map(s => ({
        id: s.comptes_structures?.id,
        nom_contact: s.comptes_structures?.nom_contact,
        badge_verifie: s.comptes_structures?.badge_verifie,
        structures: { id: s.id, nom: s.nom, categories: s.categories, villes: s.villes },
      }))
      .filter(c => c.id && !comptesParContact.find(x => x.id === c.id));

    const comptes = [...comptesParContact, ...comptesParStructure].slice(0, 10);

    return NextResponse.json({ comptes });
  } catch (error) {
    console.error('GET comptes recherche error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
