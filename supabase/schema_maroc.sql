-- ============================================================
-- SCHÉMA SUPABASE - CHEZ MON AMI MAROC
-- Version Maroc uniquement - devise fixe MAD
-- ============================================================
--
-- Instructions de déploiement :
-- 1. Créer un nouveau projet Supabase sur https://app.supabase.com
-- 2. Aller dans SQL Editor > New query
-- 3. Coller et exécuter ce fichier complet
-- 4. Copier les clés API dans votre .env.local
-- ============================================================


-- ============================================================
-- EXTENSION UUID
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ============================================================
-- TABLE RÉGIONS (anciennement pays - adaptée pour le Maroc)
-- Contient les 12 régions administratives du Maroc
-- ============================================================
CREATE TABLE IF NOT EXISTS pays (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  nom VARCHAR(100) NOT NULL UNIQUE,
  devise VARCHAR(10) DEFAULT 'MAD',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- ============================================================
-- TABLE VILLES
-- ============================================================
CREATE TABLE IF NOT EXISTS villes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,
  pays_id UUID REFERENCES pays(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(nom, pays_id)
);


-- ============================================================
-- TABLE CATÉGORIES (pour les structures/entreprises)
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,
  icon VARCHAR(10) DEFAULT '🏢',
  color VARCHAR(50) DEFAULT 'bg-gray-500',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- ============================================================
-- TABLE CATÉGORIES PRODUITS
-- ============================================================
CREATE TABLE IF NOT EXISTS categories_produits (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,
  icon VARCHAR(10) DEFAULT '📦',
  color VARCHAR(50) DEFAULT 'bg-gray-500',
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- ============================================================
-- TABLE STRUCTURES (entreprises, commerces, services)
-- ============================================================
CREATE TABLE IF NOT EXISTS structures (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  nom VARCHAR(200) NOT NULL,
  categorie_id UUID REFERENCES categories(id),
  ville_id UUID REFERENCES villes(id),
  pays_id UUID REFERENCES pays(id),
  description TEXT,
  description_longue TEXT,
  telephone VARCHAR(30),
  email VARCHAR(100),
  horaires TEXT,
  adresse TEXT,
  images JSONB DEFAULT '[]',
  galerie JSONB DEFAULT '[]',
  note DECIMAL(3,2) DEFAULT 0,
  nombre_avis INTEGER DEFAULT 0,
  vues_total INTEGER DEFAULT 0,
  -- CTA (Call to action)
  cta_principal VARCHAR(50),
  cta_secondaire VARCHAR(50),
  canaux_contact JSONB DEFAULT '[]',
  -- Services & équipements
  services_inclus JSONB DEFAULT '[]',
  politique_annulation TEXT,
  -- Informations entreprise
  annee_creation INTEGER,
  nombre_employes INTEGER,
  nombre_produits_vendus INTEGER DEFAULT 0,
  -- Horaires détaillés (JSON par jour)
  horaires_detailles JSONB DEFAULT '{}',
  -- Langues parlées
  langues_parlees JSONB DEFAULT '[]',
  -- Modes de paiement
  modes_paiement JSONB DEFAULT '[]',
  -- Options de livraison/commande
  livraison_locale BOOLEAN DEFAULT false,
  livraison_internationale BOOLEAN DEFAULT false,
  click_and_collect BOOLEAN DEFAULT false,
  sur_place BOOLEAN DEFAULT true,
  -- Vérification & certificats
  verifie BOOLEAN DEFAULT false,
  certificats JSONB DEFAULT '[]',
  -- Médias
  youtube_video_url TEXT,
  youtube_video_url_2 TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- ============================================================
-- TABLE PRODUITS
-- ============================================================
CREATE TABLE IF NOT EXISTS produits (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  nom VARCHAR(200) NOT NULL,
  description TEXT,
  prix DECIMAL(12,2) NOT NULL DEFAULT 0,
  structure_id UUID REFERENCES structures(id) ON DELETE SET NULL,
  categorie UUID REFERENCES categories_produits(id),
  ville_id UUID REFERENCES villes(id),
  pays_id UUID REFERENCES pays(id),
  images JSONB DEFAULT '[]',
  stock INTEGER DEFAULT 0,
  vues_total INTEGER DEFAULT 0,
  livraison_locale BOOLEAN DEFAULT false,
  livraison_internationale BOOLEAN DEFAULT false,
  variations JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- ============================================================
-- TABLE CHAMBRES (pour hôtels, riads, gîtes)
-- ============================================================
CREATE TABLE IF NOT EXISTS chambres (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  structure_id UUID REFERENCES structures(id) ON DELETE CASCADE,
  nom VARCHAR(100) NOT NULL,
  description TEXT,
  prix_standard DECIMAL(12,2) DEFAULT 0,
  disponible BOOLEAN DEFAULT true,
  ordre_affichage INTEGER DEFAULT 0,
  images JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- ============================================================
-- TABLE ANNONCES (emploi, appel d'offres, financement, etc.)
-- ============================================================
CREATE TABLE IF NOT EXISTS annonces (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  titre VARCHAR(300) NOT NULL,
  organisme VARCHAR(200) NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'Financement',
  sous_type VARCHAR(100),
  pays_id UUID REFERENCES pays(id),
  ville_id UUID REFERENCES villes(id),
  description TEXT,
  description_longue TEXT,
  date_publication DATE DEFAULT CURRENT_DATE,
  date_debut DATE,
  date_fin DATE,
  contact VARCHAR(100),
  telephone VARCHAR(30),
  lien_externe TEXT,
  pieces_jointes JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- ============================================================
-- TABLE ANNONCES ÉPINGLÉES (pour page d'accueil)
-- ============================================================
CREATE TABLE IF NOT EXISTS annonces_epinglees (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  titre VARCHAR(300) NOT NULL,
  description TEXT,
  lien TEXT,
  position VARCHAR(20) DEFAULT 'haut',
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- ============================================================
-- TABLE COMMENTAIRES (avis visiteurs)
-- ============================================================
CREATE TABLE IF NOT EXISTS commentaires (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  structure_id UUID REFERENCES structures(id) ON DELETE CASCADE,
  nom_visiteur VARCHAR(100) NOT NULL,
  commentaire TEXT NOT NULL,
  note INTEGER CHECK (note >= 1 AND note <= 5) DEFAULT 5,
  actif BOOLEAN DEFAULT true,
  date_creation TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- ============================================================
-- TABLE BANNIÈRES (carousel homepage)
-- ============================================================
CREATE TABLE IF NOT EXISTS bannieres (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  titre VARCHAR(200),
  sous_titre TEXT,
  image_url TEXT,
  structure_id UUID REFERENCES structures(id) ON DELETE SET NULL,
  lien TEXT,
  actif BOOLEAN DEFAULT true,
  ordre INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- ============================================================
-- TABLE MISES EN AVANT (featured elements)
-- ============================================================
CREATE TABLE IF NOT EXISTS mises_en_avant (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  element_type VARCHAR(20) NOT NULL, -- 'structure' ou 'produit'
  element_id UUID NOT NULL,
  titre VARCHAR(200),
  actif BOOLEAN DEFAULT true,
  date_debut TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  date_fin TIMESTAMP WITH TIME ZONE,
  position VARCHAR(20) DEFAULT 'listing', -- 'home', 'listing', 'tous'
  ordre INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- ============================================================
-- TABLE PROMOTIONS (réductions sur produits)
-- ============================================================
CREATE TABLE IF NOT EXISTS promotions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  produit_id UUID REFERENCES produits(id) ON DELETE CASCADE,
  reduction_type VARCHAR(20) DEFAULT 'pourcentage', -- 'pourcentage' ou 'montant'
  reduction_valeur DECIMAL(10,2) NOT NULL,
  date_debut TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  date_fin TIMESTAMP WITH TIME ZONE,
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- ============================================================
-- TABLE NEWSLETTER ABONNÉS
-- ============================================================
CREATE TABLE IF NOT EXISTS newsletter_abonnes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email VARCHAR(200) NOT NULL UNIQUE,
  actif BOOLEAN DEFAULT true,
  preferences JSONB DEFAULT '{"nouvelles_structures": true, "nouveaux_produits": true, "promotions": true}',
  token_desinscription UUID DEFAULT uuid_generate_v4(),
  derniere_notification TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- ============================================================
-- TABLE NEWSLETTER QUEUE (file d'envoi)
-- ============================================================
CREATE TABLE IF NOT EXISTS newsletter_queue (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  element_type VARCHAR(20) NOT NULL, -- 'structure', 'produit', 'promotion'
  element_id UUID,
  statut VARCHAR(30) DEFAULT 'pending', -- 'pending', 'envoi_en_cours', 'envoye', 'erreur'
  nb_destinataires INTEGER DEFAULT 0,
  envoye_at TIMESTAMP WITH TIME ZONE,
  erreur_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- ============================================================
-- TABLE VISITES (analytics)
-- ============================================================
CREATE TABLE IF NOT EXISTS visites (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  page_url TEXT,
  page_titre TEXT,
  element_type VARCHAR(30),
  element_id UUID,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- ============================================================
-- TABLE ÉLÉMENTS POPULAIRES
-- ============================================================
CREATE TABLE IF NOT EXISTS elements_populaires (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  element_id UUID NOT NULL,
  element_type VARCHAR(20) NOT NULL, -- 'structure' ou 'produit'
  element_nom VARCHAR(200),
  vues_total INTEGER DEFAULT 0,
  vues_semaine INTEGER DEFAULT 0,
  vues_mois INTEGER DEFAULT 0,
  derniere_mise_a_jour TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(element_id, element_type)
);


-- ============================================================
-- TABLE STATS QUOTIDIENNES
-- ============================================================
CREATE TABLE IF NOT EXISTS stats_quotidiennes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  visiteurs_uniques INTEGER DEFAULT 0,
  total_visites INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- ============================================================
-- TABLE COMPTES ADMIN
-- ============================================================
CREATE TABLE IF NOT EXISTS comptes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,
  email VARCHAR(200) NOT NULL UNIQUE,
  mot_de_passe TEXT NOT NULL,
  role VARCHAR(20) DEFAULT 'admin',
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- ============================================================
-- TABLE COMMANDES
-- ============================================================
CREATE TABLE IF NOT EXISTS commandes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  reference VARCHAR(50) UNIQUE,
  nom_client VARCHAR(200),
  telephone_client VARCHAR(30),
  email_client VARCHAR(200),
  adresse_livraison TEXT,
  ville_id UUID REFERENCES villes(id),
  articles JSONB DEFAULT '[]',
  total DECIMAL(12,2) DEFAULT 0,
  statut VARCHAR(30) DEFAULT 'en_attente',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- ============================================================
-- INDEX POUR PERFORMANCES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_structures_categorie ON structures(categorie_id);
CREATE INDEX IF NOT EXISTS idx_structures_ville ON structures(ville_id);
CREATE INDEX IF NOT EXISTS idx_structures_region ON structures(pays_id);
CREATE INDEX IF NOT EXISTS idx_produits_structure ON produits(structure_id);
CREATE INDEX IF NOT EXISTS idx_produits_ville ON produits(ville_id);
CREATE INDEX IF NOT EXISTS idx_produits_region ON produits(pays_id);
CREATE INDEX IF NOT EXISTS idx_annonces_type ON annonces(type);
CREATE INDEX IF NOT EXISTS idx_annonces_region ON annonces(pays_id);
CREATE INDEX IF NOT EXISTS idx_commentaires_structure ON commentaires(structure_id);
CREATE INDEX IF NOT EXISTS idx_villes_region ON villes(pays_id);
CREATE INDEX IF NOT EXISTS idx_visites_date ON visites(date);
CREATE INDEX IF NOT EXISTS idx_elements_pop_type ON elements_populaires(element_type);


-- ============================================================
-- STORED PROCEDURE : Recalculer la note d'une structure
-- ============================================================
CREATE OR REPLACE FUNCTION recalculer_note_structure(p_structure_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE structures
  SET
    note = (
      SELECT COALESCE(AVG(note::decimal), 0)
      FROM commentaires
      WHERE structure_id = p_structure_id AND actif = true
    ),
    nombre_avis = (
      SELECT COUNT(*)
      FROM commentaires
      WHERE structure_id = p_structure_id AND actif = true
    )
  WHERE id = p_structure_id;
END;
$$ LANGUAGE plpgsql;


-- ============================================================
-- STORED PROCEDURE : Enregistrer élément populaire
-- ============================================================
CREATE OR REPLACE FUNCTION enregistrer_element_populaire(
  p_element_type VARCHAR,
  p_element_id UUID,
  p_element_nom VARCHAR
)
RETURNS void AS $$
BEGIN
  INSERT INTO elements_populaires (element_id, element_type, element_nom, vues_total, vues_semaine, vues_mois)
  VALUES (p_element_id, p_element_type, p_element_nom, 1, 1, 1)
  ON CONFLICT (element_id, element_type)
  DO UPDATE SET
    vues_total = elements_populaires.vues_total + 1,
    vues_semaine = elements_populaires.vues_semaine + 1,
    vues_mois = elements_populaires.vues_mois + 1,
    element_nom = p_element_nom,
    derniere_mise_a_jour = NOW();
END;
$$ LANGUAGE plpgsql;


-- ============================================================
-- STORED PROCEDURE : Incrémenter vue page
-- ============================================================
CREATE OR REPLACE FUNCTION incrementer_vue_page(
  p_page_url TEXT,
  p_page_titre TEXT,
  p_page_type VARCHAR DEFAULT NULL,
  p_element_id UUID DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO visites (page_url, page_titre, element_type, element_id)
  VALUES (p_page_url, p_page_titre, p_page_type, p_element_id);

  -- Mettre à jour vues_total sur la structure si c'est une page structure
  IF p_page_type = 'structure' AND p_element_id IS NOT NULL THEN
    UPDATE structures SET vues_total = vues_total + 1 WHERE id = p_element_id;
  END IF;

  -- Mettre à jour vues_total sur le produit si c'est une page produit
  IF p_page_type = 'produit' AND p_element_id IS NOT NULL THEN
    UPDATE produits SET vues_total = vues_total + 1 WHERE id = p_element_id;
  END IF;
END;
$$ LANGUAGE plpgsql;


-- ============================================================
-- STORED PROCEDURE : Mise à jour stats quotidiennes
-- ============================================================
CREATE OR REPLACE FUNCTION maj_stats_quotidiennes()
RETURNS void AS $$
DECLARE
  today DATE := CURRENT_DATE;
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM visites
  WHERE date::date = today;

  INSERT INTO stats_quotidiennes (date, total_visites, visiteurs_uniques)
  VALUES (today, v_count, v_count)
  ON CONFLICT (date)
  DO UPDATE SET
    total_visites = v_count,
    visiteurs_uniques = v_count;
END;
$$ LANGUAGE plpgsql;


-- ============================================================
-- RLS (Row Level Security) - Accès public en lecture
-- ============================================================
ALTER TABLE structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE produits ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories_produits ENABLE ROW LEVEL SECURITY;
ALTER TABLE villes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pays ENABLE ROW LEVEL SECURITY;
ALTER TABLE annonces ENABLE ROW LEVEL SECURITY;
ALTER TABLE commentaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE bannieres ENABLE ROW LEVEL SECURITY;
ALTER TABLE mises_en_avant ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_abonnes ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE visites ENABLE ROW LEVEL SECURITY;
ALTER TABLE elements_populaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE stats_quotidiennes ENABLE ROW LEVEL SECURITY;
ALTER TABLE chambres ENABLE ROW LEVEL SECURITY;
ALTER TABLE annonces_epinglees ENABLE ROW LEVEL SECURITY;
ALTER TABLE commandes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comptes ENABLE ROW LEVEL SECURITY;

-- Lecture publique pour les tables publiques
CREATE POLICY "Public read structures" ON structures FOR SELECT USING (true);
CREATE POLICY "Public read produits" ON produits FOR SELECT USING (true);
CREATE POLICY "Public read categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Public read categories_produits" ON categories_produits FOR SELECT USING (actif = true);
CREATE POLICY "Public read villes" ON villes FOR SELECT USING (true);
CREATE POLICY "Public read pays" ON pays FOR SELECT USING (true);
CREATE POLICY "Public read annonces" ON annonces FOR SELECT USING (true);
CREATE POLICY "Public read commentaires" ON commentaires FOR SELECT USING (actif = true);
CREATE POLICY "Public read bannieres" ON bannieres FOR SELECT USING (true);
CREATE POLICY "Public read mises_en_avant" ON mises_en_avant FOR SELECT USING (true);
CREATE POLICY "Public read promotions" ON promotions FOR SELECT USING (true);
CREATE POLICY "Public read chambres" ON chambres FOR SELECT USING (true);
CREATE POLICY "Public read annonces_epinglees" ON annonces_epinglees FOR SELECT USING (true);
CREATE POLICY "Public read elements_populaires" ON elements_populaires FOR SELECT USING (true);
CREATE POLICY "Public read stats_quotidiennes" ON stats_quotidiennes FOR SELECT USING (true);

-- Accès complet (admin utilise la clé service_role)
CREATE POLICY "Full access structures" ON structures FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Full access produits" ON produits FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Full access categories" ON categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Full access categories_produits" ON categories_produits FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Full access villes" ON villes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Full access pays" ON pays FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Full access annonces" ON annonces FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Full access commentaires" ON commentaires FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Full access bannieres" ON bannieres FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Full access mises_en_avant" ON mises_en_avant FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Full access promotions" ON promotions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Full access chambres" ON chambres FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Full access newsletter_abonnes" ON newsletter_abonnes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Full access newsletter_queue" ON newsletter_queue FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Full access visites" ON visites FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Full access elements_populaires" ON elements_populaires FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Full access stats_quotidiennes" ON stats_quotidiennes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Full access comptes" ON comptes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Full access commandes" ON commandes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Full access annonces_epinglees" ON annonces_epinglees FOR ALL USING (true) WITH CHECK (true);


-- ============================================================
-- DONNÉES INITIALES : 12 RÉGIONS DU MAROC
-- ============================================================
INSERT INTO pays (id, nom, devise) VALUES
  ('11111111-0001-0000-0000-000000000001', 'Casablanca-Settat', 'MAD'),
  ('11111111-0002-0000-0000-000000000002', 'Rabat-Salé-Kénitra', 'MAD'),
  ('11111111-0003-0000-0000-000000000003', 'Marrakech-Safi', 'MAD'),
  ('11111111-0004-0000-0000-000000000004', 'Fès-Meknès', 'MAD'),
  ('11111111-0005-0000-0000-000000000005', 'Tanger-Tétouan-Al Hoceïma', 'MAD'),
  ('11111111-0006-0000-0000-000000000006', 'Oriental', 'MAD'),
  ('11111111-0007-0000-0000-000000000007', 'Souss-Massa', 'MAD'),
  ('11111111-0008-0000-0000-000000000008', 'Béni Mellal-Khénifra', 'MAD'),
  ('11111111-0009-0000-0000-000000000009', 'Drâa-Tafilalet', 'MAD'),
  ('11111111-0010-0000-0000-000000000010', 'Guelmim-Oued Noun', 'MAD'),
  ('11111111-0011-0000-0000-000000000011', 'Laâyoune-Sakia El Hamra', 'MAD'),
  ('11111111-0012-0000-0000-000000000012', 'Dakhla-Oued Ed-Dahab', 'MAD')
ON CONFLICT (nom) DO NOTHING;


-- ============================================================
-- DONNÉES INITIALES : VILLES PAR RÉGION
-- ============================================================

-- Casablanca-Settat
INSERT INTO villes (nom, pays_id) VALUES
  ('Casablanca', '11111111-0001-0000-0000-000000000001'),
  ('Mohammedia', '11111111-0001-0000-0000-000000000001'),
  ('El Jadida', '11111111-0001-0000-0000-000000000001'),
  ('Settat', '11111111-0001-0000-0000-000000000001'),
  ('Berrechid', '11111111-0001-0000-0000-000000000001'),
  ('Benslimane', '11111111-0001-0000-0000-000000000001'),
  ('Nouaceur', '11111111-0001-0000-0000-000000000001')
ON CONFLICT DO NOTHING;

-- Rabat-Salé-Kénitra
INSERT INTO villes (nom, pays_id) VALUES
  ('Rabat', '11111111-0002-0000-0000-000000000002'),
  ('Salé', '11111111-0002-0000-0000-000000000002'),
  ('Témara', '11111111-0002-0000-0000-000000000002'),
  ('Kénitra', '11111111-0002-0000-0000-000000000002'),
  ('Skhirat', '11111111-0002-0000-0000-000000000002'),
  ('Khémisset', '11111111-0002-0000-0000-000000000002')
ON CONFLICT DO NOTHING;

-- Marrakech-Safi
INSERT INTO villes (nom, pays_id) VALUES
  ('Marrakech', '11111111-0003-0000-0000-000000000003'),
  ('Safi', '11111111-0003-0000-0000-000000000003'),
  ('Essaouira', '11111111-0003-0000-0000-000000000003'),
  ('Kelaa des Sraghna', '11111111-0003-0000-0000-000000000003'),
  ('Youssoufia', '11111111-0003-0000-0000-000000000003')
ON CONFLICT DO NOTHING;

-- Fès-Meknès
INSERT INTO villes (nom, pays_id) VALUES
  ('Fès', '11111111-0004-0000-0000-000000000004'),
  ('Meknès', '11111111-0004-0000-0000-000000000004'),
  ('Taza', '11111111-0004-0000-0000-000000000004'),
  ('Ifrane', '11111111-0004-0000-0000-000000000004'),
  ('Sefrou', '11111111-0004-0000-0000-000000000004'),
  ('Moulay Yacoub', '11111111-0004-0000-0000-000000000004')
ON CONFLICT DO NOTHING;

-- Tanger-Tétouan-Al Hoceïma
INSERT INTO villes (nom, pays_id) VALUES
  ('Tanger', '11111111-0005-0000-0000-000000000005'),
  ('Tétouan', '11111111-0005-0000-0000-000000000005'),
  ('Al Hoceïma', '11111111-0005-0000-0000-000000000005'),
  ('Larache', '11111111-0005-0000-0000-000000000005'),
  ('Chefchaouen', '11111111-0005-0000-0000-000000000005'),
  ('Assilah', '11111111-0005-0000-0000-000000000005'),
  ('Mdiq', '11111111-0005-0000-0000-000000000005')
ON CONFLICT DO NOTHING;

-- Oriental
INSERT INTO villes (nom, pays_id) VALUES
  ('Oujda', '11111111-0006-0000-0000-000000000006'),
  ('Nador', '11111111-0006-0000-0000-000000000006'),
  ('Berkane', '11111111-0006-0000-0000-000000000006'),
  ('Taourirt', '11111111-0006-0000-0000-000000000006'),
  ('Jerrada', '11111111-0006-0000-0000-000000000006')
ON CONFLICT DO NOTHING;

-- Souss-Massa
INSERT INTO villes (nom, pays_id) VALUES
  ('Agadir', '11111111-0007-0000-0000-000000000007'),
  ('Tiznit', '11111111-0007-0000-0000-000000000007'),
  ('Taroudant', '11111111-0007-0000-0000-000000000007'),
  ('Inezgane', '11111111-0007-0000-0000-000000000007'),
  ('Ait Melloul', '11111111-0007-0000-0000-000000000007'),
  ('Biougra', '11111111-0007-0000-0000-000000000007')
ON CONFLICT DO NOTHING;

-- Béni Mellal-Khénifra
INSERT INTO villes (nom, pays_id) VALUES
  ('Béni Mellal', '11111111-0008-0000-0000-000000000008'),
  ('Khouribga', '11111111-0008-0000-0000-000000000008'),
  ('Fkih Ben Salah', '11111111-0008-0000-0000-000000000008'),
  ('Azilal', '11111111-0008-0000-0000-000000000008')
ON CONFLICT DO NOTHING;

-- Drâa-Tafilalet
INSERT INTO villes (nom, pays_id) VALUES
  ('Ouarzazate', '11111111-0009-0000-0000-000000000009'),
  ('Errachidia', '11111111-0009-0000-0000-000000000009'),
  ('Zagora', '11111111-0009-0000-0000-000000000009'),
  ('Tinghir', '11111111-0009-0000-0000-000000000009'),
  ('Midelt', '11111111-0009-0000-0000-000000000009')
ON CONFLICT DO NOTHING;

-- Guelmim-Oued Noun
INSERT INTO villes (nom, pays_id) VALUES
  ('Guelmim', '11111111-0010-0000-0000-000000000010'),
  ('Tan-Tan', '11111111-0010-0000-0000-000000000010'),
  ('Sidi Ifni', '11111111-0010-0000-0000-000000000010')
ON CONFLICT DO NOTHING;

-- Laâyoune-Sakia El Hamra
INSERT INTO villes (nom, pays_id) VALUES
  ('Laâyoune', '11111111-0011-0000-0000-000000000011'),
  ('Boujdour', '11111111-0011-0000-0000-000000000011'),
  ('Smara', '11111111-0011-0000-0000-000000000011')
ON CONFLICT DO NOTHING;

-- Dakhla-Oued Ed-Dahab
INSERT INTO villes (nom, pays_id) VALUES
  ('Dakhla', '11111111-0012-0000-0000-000000000012'),
  ('Aousserd', '11111111-0012-0000-0000-000000000012')
ON CONFLICT DO NOTHING;


-- ============================================================
-- DONNÉES INITIALES : CATÉGORIES D'ENTREPRISES
-- ============================================================
INSERT INTO categories (nom, icon, color) VALUES
  ('Restaurants & Cafés', '🍽️', 'bg-orange-500'),
  ('Hôtels & Riads', '🏨', 'bg-yellow-500'),
  ('Salons & Beauté', '✂️', 'bg-pink-500'),
  ('Boutiques & Mode', '👗', 'bg-purple-500'),
  ('Artisanat & Souvenirs', '🏺', 'bg-amber-600'),
  ('Immobilier', '🏠', 'bg-blue-600'),
  ('Services Médicaux', '🏥', 'bg-red-500'),
  ('Éducation & Formation', '🎓', 'bg-indigo-500'),
  ('Informatique & Tech', '💻', 'bg-cyan-600'),
  ('Transport & Logistique', '🚗', 'bg-gray-600'),
  ('Construction & BTP', '🏗️', 'bg-stone-600'),
  ('Agriculture & Agroalimentaire', '🌾', 'bg-green-600'),
  ('Finance & Assurance', '🏦', 'bg-teal-600'),
  ('Tourisme & Loisirs', '🌴', 'bg-emerald-500'),
  ('Bien-être & Hammam', '🧖', 'bg-rose-500'),
  ('Électronique & Électroménager', '📱', 'bg-blue-500'),
  ('Auto & Garage', '🔧', 'bg-zinc-600'),
  ('Épiceries & Superettes', '🛒', 'bg-lime-600'),
  ('Pharmacies & Parapharmacie', '💊', 'bg-green-500'),
  ('Événementiel & Traiteur', '🎉', 'bg-fuchsia-500')
ON CONFLICT DO NOTHING;


-- ============================================================
-- DONNÉES INITIALES : CATÉGORIES PRODUITS
-- ============================================================
INSERT INTO categories_produits (nom, icon, color, actif) VALUES
  ('Alimentation & Épicerie', '🥗', 'bg-green-500', true),
  ('Mode & Vêtements', '👗', 'bg-purple-500', true),
  ('Artisanat Marocain', '🏺', 'bg-amber-600', true),
  ('Électronique', '📱', 'bg-blue-500', true),
  ('Beauté & Cosmétiques', '💄', 'bg-pink-500', true),
  ('Maison & Décoration', '🏡', 'bg-yellow-500', true),
  ('Bijoux & Accessoires', '💍', 'bg-yellow-600', true),
  ('Huiles & Argan', '🌿', 'bg-green-600', true),
  ('Épices & Herbes', '🌶️', 'bg-red-500', true),
  ('Tapis & Textiles', '🧶', 'bg-rose-500', true),
  ('Jouets & Enfants', '🧸', 'bg-orange-400', true),
  ('Sport & Outdoor', '⚽', 'bg-cyan-500', true)
ON CONFLICT DO NOTHING;


-- ============================================================
-- COMPTE ADMIN PAR DÉFAUT
-- Mot de passe : Admin123! (à changer immédiatement)
-- ============================================================
INSERT INTO comptes (nom, email, mot_de_passe, role) VALUES
  ('Super Admin', 'admin@chezmonami.ma', 'Admin123!', 'super_admin')
ON CONFLICT (email) DO NOTHING;


-- ============================================================
-- FIN DU SCHÉMA
-- ============================================================
-- Pour vérifier l'installation :
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
-- SELECT nom FROM pays ORDER BY nom;
-- SELECT nom FROM villes ORDER BY nom LIMIT 20;
