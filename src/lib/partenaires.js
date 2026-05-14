// Lot Partenaires — helpers communs.
// - Génération de codes (PART- pour permanent, CAMP- pour campagne)
// - Calcul de commission
// - Application du bonus filleul
import crypto from 'crypto';
import { supabaseAdmin } from './supabaseAdmin';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function randomSegment(longueur = 8) {
  let out = '';
  for (let i = 0; i < longueur; i++) {
    out += ALPHABET[crypto.randomInt(0, ALPHABET.length)];
  }
  return out;
}

/**
 * Génère un code partenaire avec préfixe.
 * @param {'permanent'|'campagne'} type
 */
export function generateCodePartenaire(type = 'permanent') {
  const prefix = type === 'campagne' ? 'CAMP-' : 'PART-';
  return prefix + randomSegment(8);
}

/**
 * Génère un code partenaire unique (loop 10x max sur collision).
 */
export async function genererCodePartenaireUnique(type = 'permanent') {
  for (let i = 0; i < 10; i++) {
    const code = generateCodePartenaire(type);
    const { data } = await supabaseAdmin
      .from('codes_partenaires')
      .select('id')
      .eq('code', code)
      .maybeSingle();
    if (!data) return code;
  }
  throw new Error('Impossible de générer un code partenaire unique');
}

const ABO_PAYANTS = ['mensuel', 'trimestriel', 'semestriel', 'annuel'];
export function estAbonnementPayant(abo) {
  return ABO_PAYANTS.includes(abo);
}

/**
 * Calcule le montant de commission en MAD.
 */
export function calculerCommission({ montant_mad, pourcentage }) {
  const m = Number(montant_mad) || 0;
  const p = Number(pourcentage) || 0;
  return Math.round(m * p) / 100;
}

/**
 * Crée une commission pour un paiement d'abonnement validé.
 * Idempotente : ne crée pas de doublon pour le même filleul/date_paiement.
 * Retourne { created: bool, commission?: row, raison?: string }
 */
export async function creerCommissionSiEligible({
  filleul_compte_id,
  montant_mad,
  abonnement_type,
  date_paiement,
  devise_paiement = 'MAD',
}) {
  // 1. Le filleul a-t-il un partenaire ?
  const { data: filleul } = await supabaseAdmin
    .from('comptes_structures')
    .select('id, partenaire_id, code_partenaire_id')
    .eq('id', filleul_compte_id)
    .single();
  if (!filleul?.partenaire_id) return { created: false, raison: 'pas_de_partenaire' };

  // 2. Abonnement payant ?
  if (!estAbonnementPayant(abonnement_type)) {
    return { created: false, raison: 'abonnement_gratuit' };
  }

  // 3. Récupère le partenaire et le code
  const [{ data: partenaire }, { data: code }] = await Promise.all([
    supabaseAdmin
      .from('comptes_partenaires')
      .select('id, pourcentage_commission, commissions_actives, actif, supprime')
      .eq('id', filleul.partenaire_id)
      .single(),
    filleul.code_partenaire_id
      ? supabaseAdmin
          .from('codes_partenaires')
          .select('id, pourcentage_override, actif')
          .eq('id', filleul.code_partenaire_id)
          .single()
      : Promise.resolve({ data: null }),
  ]);

  if (!partenaire || partenaire.supprime || !partenaire.actif) {
    return { created: false, raison: 'partenaire_inactif' };
  }
  if (!partenaire.commissions_actives) {
    return { created: false, raison: 'commissions_coupees' };
  }

  // 4. Pourcentage : override du code OU pourcentage du compte
  const pourcentage = code?.pourcentage_override ?? partenaire.pourcentage_commission;
  const montant_commission_mad = calculerCommission({ montant_mad, pourcentage });

  // 5. Idempotence — vérifier qu'il n'existe pas déjà une commission pour ce filleul + date
  const { data: existante } = await supabaseAdmin
    .from('commissions_partenaires')
    .select('id')
    .eq('filleul_compte_id', filleul_compte_id)
    .eq('date_paiement_filleul', date_paiement)
    .maybeSingle();
  if (existante) return { created: false, raison: 'deja_creee', commission: existante };

  // 6. Insert
  const { data: commission, error } = await supabaseAdmin
    .from('commissions_partenaires')
    .insert({
      partenaire_id: partenaire.id,
      filleul_compte_id,
      code_id: filleul.code_partenaire_id || null,
      abonnement_type,
      montant_abonnement_mad: montant_mad,
      devise_paiement,
      pourcentage_applique: pourcentage,
      montant_commission_mad,
      date_paiement_filleul: date_paiement,
      statut: 'a_payer',
    })
    .select()
    .single();
  if (error) throw error;
  return { created: true, commission };
}

/**
 * Vérifie un code partenaire (public, à l'inscription).
 * Retourne { valid, type?, partenaire_nom?, mois_filleul?, reduction_filleul_pct?, raison? }
 */
export async function verifierCodePartenaire(codeRaw) {
  const code = (codeRaw || '').trim().toUpperCase();
  if (!code) return { valid: false, raison: 'code_vide' };

  const { data: c } = await supabaseAdmin
    .from('codes_partenaires')
    .select(`
      id, type, mois_filleul, reduction_filleul_pct,
      date_expiration, actif,
      partenaire:comptes_partenaires!codes_partenaires_partenaire_id_fkey(
        id, nom_complet, actif, supprime
      )
    `)
    .eq('code', code)
    .maybeSingle();

  if (!c) return { valid: false, raison: 'code_introuvable' };
  if (!c.actif) return { valid: false, raison: 'code_inactif' };
  if (c.date_expiration && new Date(c.date_expiration) < new Date()) {
    return { valid: false, raison: 'code_expire' };
  }
  if (!c.partenaire || c.partenaire.supprime || !c.partenaire.actif) {
    return { valid: false, raison: 'partenaire_inactif' };
  }

  return {
    valid: true,
    code_id: c.id,
    partenaire_id: c.partenaire.id,
    partenaire_nom: c.partenaire.nom_complet,
    type: c.type,
    mois_filleul: c.mois_filleul || 0,
    reduction_filleul_pct: Number(c.reduction_filleul_pct) || 0,
  };
}
