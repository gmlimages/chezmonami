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

// Helper : valider un token de session entreprise.
// Accepte aussi les tokens d'impersonation (un admin "voit comme" un compte).
// Le compte renvoyé porte alors un flag `_impersonation` (méta-info, ne pas
// persister), utilisé par l'UI pour afficher la bannière et bloquer les
// actions destructives.
export async function getCompteFromToken(token) {
  if (!token) return null;

  // 1) Session entreprise classique
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

  if (session) {
    if (new Date(session.expires_at) < new Date()) {
      await supabaseAdmin.from('comptes_sessions').delete().eq('id', session.id);
      return null;
    }
    return session.comptes_structures;
  }

  // 2) Session d'impersonation admin → résout sur le compte cible
  const { data: imp } = await supabaseAdmin
    .from('impersonation_sessions')
    .select(`
      id, expires_at, termine_at, admin_id, compte_structure_id,
      comptes_structures (
        id, email, nom_contact, photo_profil, statut, abonnement,
        badge_verifie, structure_id, telephone_contact, email_contact,
        date_paiement, date_fin_abonnement, montant_paiement, notes_abonnement,
        structures (id, nom, categorie_id, verifie, pays_id, ville_id)
      )
    `)
    .eq('token', token)
    .single();

  if (!imp) return null;
  if (imp.termine_at) return null;
  if (new Date(imp.expires_at) < new Date()) return null;

  const compte = imp.comptes_structures;
  if (!compte) return null;
  return {
    ...compte,
    _impersonation: {
      session_id: imp.id,
      admin_id: imp.admin_id,
      expires_at: imp.expires_at,
    },
  };
}

// Helper : true si le compte courant est une session d'impersonation
export function isImpersonating(compte) {
  return !!(compte && compte._impersonation);
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
