import { NextResponse } from 'next/server';
import { supabaseAdmin, getCompteFromToken, hasFullAccess } from '@/lib/supabaseAdmin';

export async function GET(request) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    const compte = await getCompteFromToken(token);

    if (!compte) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    if (!hasFullAccess(compte)) {
      return NextResponse.json({ error: 'Abonnement requis', code: 'ABONNEMENT_REQUIS' }, { status: 403 });
    }

    const { data: appels, error } = await supabaseAdmin
      .from('appels_offres')
      .select(`
        id, titre, description, description_longue, type,
        international, date_limite, date_publication, statut, pieces_jointes, fichiers,
        categories (id, nom, icon),
        pays (id, nom),
        villes (id, nom),
        reponses_appels_offres (id, statut, compte_id, contenu, fichiers, created_at)
      `)
      .eq('statut', 'actif')
      .gt('date_limite', new Date().toISOString())
      .order('date_publication', { ascending: false });

    if (error) throw error;

    // Filtrer selon le profil de la société et marquer la réponse de la société
    const structure = compte.structures;
    const appelsFiltered = (appels || [])
      .filter(appel => {
        // Visible si : international OU pas de filtre pays OU même pays
        if (appel.international) return true;
        if (!appel.pays_id) return true;
        if (structure && appel.pays_id === structure.pays_id) return true;
        if (!structure) return true; // compte sans structure liée voit tout
        return false;
      })
      .map(appel => ({
        ...appel,
        ma_reponse: appel.reponses_appels_offres?.find(r => r.compte_id === compte.id) ?? null,
        nb_reponses: appel.reponses_appels_offres?.length || 0,
        reponses_appels_offres: undefined,
      }));

    return NextResponse.json({ appels: appelsFiltered });

  } catch (error) {
    console.error('Erreur liste appels offres:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
