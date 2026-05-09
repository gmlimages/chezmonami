// Lot H — Helpers 2FA email.
// - generateCode() : code à 6 chiffres
// - hashCode(code) : SHA-256 hex (déterministe — comparaison directe)
// - generateChallenge() : jeton aléatoire pour identifier la session de challenge

import crypto from 'crypto';

export function generateCode() {
  // 6 chiffres, zero-padded — entropie ~20 bits, suffisant avec rate-limit + expiration courte
  const n = crypto.randomInt(0, 1000000);
  return String(n).padStart(6, '0');
}

export function hashCode(code) {
  return crypto.createHash('sha256').update(String(code)).digest('hex');
}

export function generateChallenge() {
  return crypto.randomBytes(32).toString('hex');
}

export const TFA_CODE_TTL_MS = 10 * 60 * 1000;       // code valide 10 min
export const TFA_MAX_TENTATIVES = 5;
