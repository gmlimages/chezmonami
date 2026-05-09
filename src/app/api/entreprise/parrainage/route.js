// Lot Parrainage — Vue entreprise du programme de parrainage
// GET → {
//   parametres,                // { affichage_actif, message_promo, mois_parrain, mois_filleul }
//   demande_en_cours,          // demande en_attente la plus récente (ou null)
//   codes,                     // codes émis pour ce compte
//   filleuls,                  // parrainages dont ce compte est parrain
//   parraine_par,              // parrainage où ce compte est filleul (pour bandeau "+1 mois")
// }
import { NextResponse } from 'next/server';
import { supabaseAdmin, getCompteFromToken } from '@/lib/supabaseAdmin';

function getToken(request) {
  const auth = request.headers.get('authorization') || '';
  return auth.startsWith('Bearer ') ? auth.slice(7) : null;
}

export async function GET(request) {
  const compte = await getCompteFromToken(getToken(request));
  if (!compte) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const [parametresRes, demandeRes, codesRes, filleulsRes, parraineParRes] = await Promise.all([
    supabaseAdmin.from('parametres_parrainage').select('*').eq('id', 1).single(),
    supabaseAdmin
      .from('demandes_parrainage')
      .select('id, statut, message_demandeur, motif_refus, traite_at, created_at')
      .eq('compte_id', compte.id)
      .order('created_at', { ascending: false })
      .limit(5),
    supabaseAdmin
      .from('codes_parrainage')
      .select(`
        id, code, date_expiration, actif, utilise_par_compte_id, utilise_at, created_at,
        filleul:comptes_structures!codes_parrainage_utilise_par_compte_id_fkey (
          id, nom_contact, structures (nom)
        )
      `)
      .eq('parrain_compte_id', compte.id)
      .eq('supprime_par_entreprise', false)
      .order('created_at', { ascending: false }),
    supabaseAdmin
      .from('parrainages')
      .select(`
        id, statut, date_inscription_filleul, date_premier_paiement_filleul,
        mois_parrain, recompense_parrain_appliquee_at,
        filleul:comptes_structures!parrainages_filleul_compte_id_fkey (
          id, nom_contact, email, structures (nom)
        )
      `)
      .eq('parrain_compte_id', compte.id)
      .order('date_inscription_filleul', { ascending: false }),
    supabaseAdmin
      .from('parrainages')
      .select(`
        id, statut, mois_filleul, recompense_filleul_appliquee_at,
        parrain:comptes_structures!parrainages_parrain_compte_id_fkey (
          id, nom_contact, structures (nom)
        )
      `)
      .eq('filleul_compte_id', compte.id)
      .maybeSingle(),
  ]);

  const now = new Date();
  const codes = (codesRes.data || []).map(c => {
    const expire = c.date_expiration && new Date(c.date_expiration) < now;
    let etat = 'actif';
    if (!c.actif) etat = 'revoque';
    else if (c.utilise_par_compte_id) etat = 'utilise';
    else if (expire) etat = 'expire';
    return { ...c, etat };
  });

  const demande_en_cours = (demandeRes.data || []).find(d => d.statut === 'en_attente') || null;
  const historique_demandes = demandeRes.data || [];

  const total_mois_gagnes = (filleulsRes.data || [])
    .filter(p => p.statut === 'valide')
    .reduce((s, p) => s + (p.mois_parrain || 0), 0);

  return NextResponse.json({
    parametres: parametresRes.data,
    demande_en_cours,
    historique_demandes,
    codes,
    filleuls: filleulsRes.data || [],
    parraine_par: parraineParRes.data || null,
    total_mois_gagnes,
  });
}
