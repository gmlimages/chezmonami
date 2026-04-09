// Client Supabase avec la clé service_role — SERVEUR UNIQUEMENT
// Ne jamais importer ce fichier dans un composant client ('use client')
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey || supabaseServiceKey === 'REMPLACER_PAR_LA_CLE_SERVICE_ROLE') {
  console.warn('⚠️ SUPABASE_SERVICE_ROLE_KEY manquante dans .env.local');
}

export const supabaseAdmin = createClient(
  supabaseUrl || '',
  supabaseServiceKey || '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Helper : valider un token de session entreprise
export async function getCompteFromToken(token) {
  if (!token) return null;

  const { data: session } = await supabaseAdmin
    .from('comptes_sessions')
    .select(`
      id, expires_at,
      comptes_structures (
        id, email, nom_contact, photo_profil, statut, abonnement,
        badge_verifie, structure_id, telephone_contact, email_contact,
        date_paiement, date_fin_abonnement, montant_paiement, notes_abonnement,
        structures (id, nom, categorie_id, verifie, pays_id, ville_id)
      )
    `)
    .eq('token', token)
    .single();

  if (!session) return null;

  if (new Date(session.expires_at) < new Date()) {
    await supabaseAdmin.from('comptes_sessions').delete().eq('id', session.id);
    return null;
  }

  return session.comptes_structures;
}

/**
 * Vérifie si un compte a un abonnement payant valide (accès complet).
 * Gratuit, expiré, en_attente, suspendu → false.
 */
export function hasFullAccess(compte) {
  if (!compte) return false;
  if (compte.statut !== 'actif') return false;
  // Gratuit ou type non défini → accès restreint
  const typePayant = ['mensuel', 'trimestriel', 'semestriel', 'annuel'];
  if (!compte.abonnement || !typePayant.includes(compte.abonnement)) return false;
  // Payant mais date de fin dépassée → expiré
  if (compte.date_fin_abonnement && new Date(compte.date_fin_abonnement) <= new Date()) return false;
  return true;
}
