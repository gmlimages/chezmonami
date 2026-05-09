-- Migration : ajout des colonnes pour la réinitialisation du mot de passe entreprise.
-- À exécuter dans le SQL Editor de Supabase.

ALTER TABLE comptes_structures
  ADD COLUMN IF NOT EXISTS reset_token TEXT,
  ADD COLUMN IF NOT EXISTS reset_token_expire TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_comptes_structures_reset_token
  ON comptes_structures (reset_token)
  WHERE reset_token IS NOT NULL;

COMMENT ON COLUMN comptes_structures.reset_token IS
  'Token unique (UUID) pour la réinitialisation du mot de passe — usage unique';
COMMENT ON COLUMN comptes_structures.reset_token_expire IS
  'Expiration du reset_token (en général 1h après émission)';
