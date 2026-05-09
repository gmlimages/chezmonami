// Lot Parrainage — Helpers serveur.
// - generateCodeParrainage() : code lisible 8 caractères (sans 0/O/1/I)
// - calculerExpiration({ days }) : ISO timestamp expiration ou null = illimité
// - appliquerRecompenses(parrainageId) : étend les date_fin_abonnement parrain + filleul,
//   marque le parrainage comme valide. Idempotent.
//
// Toutes les opérations DB passent par supabaseAdmin (service role).
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sans 0,O,1,I

export function generateCodeParrainage(longueur = 8) {
  let s = '';
  for (let i = 0; i < longueur; i++) {
    const idx = crypto.randomInt(0, ALPHABET.length);
    s += ALPHABET[idx];
  }
  return s;
}

export function calculerExpiration({ days }) {
  if (!days || days <= 0) return null; // illimité
  const d = new Date();
  d.setDate(d.getDate() + Number(days));
  return d.toISOString();
}

// Ajoute N mois à une date ISO. Si la date est null/passée, on part de maintenant.
export function ajouterMois(dateIso, mois) {
  const base = (() => {
    if (!dateIso) return new Date();
    const d = new Date(dateIso);
    return d > new Date() ? d : new Date();
  })();
  base.setMonth(base.getMonth() + Number(mois));
  return base.toISOString();
}

// Liste fermée des abonnements payants. Aligné avec hasFullAccess() côté client.
const ABO_PAYANTS = ['mensuel', 'trimestriel', 'semestriel', 'annuel'];
export function estAbonnementPayant(abo) {
  return ABO_PAYANTS.includes(abo);
}

/**
 * Applique les récompenses pour un parrainage (idempotent).
 * Conditions d'éligibilité doivent être vérifiées par l'appelant
 * (filleul a payé un abonnement payant).
 *
 * @returns { applied: boolean, parrainage, parrain_new_fin, filleul_new_fin }
 */
export async function appliquerRecompenses(parrainageId) {
  const { data: parr, error } = await supabaseAdmin
    .from('parrainages')
    .select('*')
    .eq('id', parrainageId)
    .single();
  if (error || !parr) return { applied: false, error: 'Parrainage introuvable' };
  if (parr.statut !== 'en_attente') return { applied: false, parrainage: parr };

  // Récupérer les comptes
  const { data: comptes, error: errC } = await supabaseAdmin
    .from('comptes_structures')
    .select('id, email, nom_contact, date_fin_abonnement')
    .in('id', [parr.parrain_compte_id, parr.filleul_compte_id]);
  if (errC || !comptes || comptes.length !== 2) {
    return { applied: false, error: 'Comptes introuvables' };
  }
  const parrain = comptes.find(c => c.id === parr.parrain_compte_id);
  const filleul = comptes.find(c => c.id === parr.filleul_compte_id);

  const parrain_new_fin = ajouterMois(parrain.date_fin_abonnement, parr.mois_parrain);
  const filleul_new_fin = ajouterMois(filleul.date_fin_abonnement, parr.mois_filleul);

  const now = new Date().toISOString();

  // Updates en parallèle
  const [u1, u2, u3] = await Promise.all([
    supabaseAdmin
      .from('comptes_structures')
      .update({ date_fin_abonnement: parrain_new_fin })
      .eq('id', parrain.id),
    supabaseAdmin
      .from('comptes_structures')
      .update({ date_fin_abonnement: filleul_new_fin })
      .eq('id', filleul.id),
    supabaseAdmin
      .from('parrainages')
      .update({
        statut: 'valide',
        date_premier_paiement_filleul: now,
        recompense_parrain_appliquee_at: now,
        recompense_filleul_appliquee_at: now,
      })
      .eq('id', parrainageId),
  ]);
  if (u1.error || u2.error || u3.error) {
    return { applied: false, error: 'Erreur lors de la mise à jour' };
  }

  return {
    applied: true,
    parrainage: { ...parr, statut: 'valide' },
    parrain,
    filleul,
    parrain_new_fin,
    filleul_new_fin,
  };
}
