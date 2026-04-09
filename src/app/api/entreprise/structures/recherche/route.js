import { NextResponse } from 'next/server';
import { supabaseAdmin, getCompteFromToken, hasFullAccess } from '@/lib/supabaseAdmin';

// GET — rechercher des structures par nom (avec info sur le compte lié)
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
    if (!q || q.length < 2) return NextResponse.json({ structures: [] });

    // Recherche par nom de structure publiée
    const { data, error } = await supabaseAdmin
      .from('structures')
      .select(`id, nom, villes (nom), categories (nom, icon)`)
      .ilike('nom', `%${q}%`)
      .eq('statut', 'publie')
      .limit(15);

    if (error) throw error;

    // Pour chaque structure trouvée, chercher le compte actif lié
    const ids = (data || []).map(s => s.id);
    const { data: comptes } = await supabaseAdmin
      .from('comptes_structures')
      .select('id, nom_contact, badge_verifie, statut, structure_id')
      .in('structure_id', ids)
      .eq('statut', 'actif')
      .neq('id', compte.id); // exclure sa propre structure

    const compteParStructure = {};
    (comptes || []).forEach(c => { compteParStructure[c.structure_id] = c; });

    // Exclure la propre structure du compte connecté
    const maStructureId = compte.structures?.[0]?.id || compte.structure_id || null;

    const structures = (data || [])
      .filter(s => s.id !== maStructureId)
      .map(s => {
        const compteLie = compteParStructure[s.id] || null;
        return {
          structure_id: s.id,
          nom: s.nom,
          ville: s.villes?.nom,
          categorie: s.categories,
          a_compte: !!compteLie,
          compte: compteLie
            ? { id: compteLie.id, nom_contact: compteLie.nom_contact, badge_verifie: compteLie.badge_verifie }
            : null,
        };
      })
      .slice(0, 10);

    return NextResponse.json({ structures });
  } catch (error) {
    console.error('GET structures/recherche error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
