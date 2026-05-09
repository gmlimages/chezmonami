// Groupes thématiques de catégories de structures (entreprises).
// Synchronisé avec le footer (src/components/layout/footer.js).
// Chaque groupe contient la liste des `categorie_id` (slugs) qu'il regroupe.

export const groupesCategoriesStructures = [
  {
    id: 'production',
    titre: 'Production & Industries',
    icon: '🏭',
    description: 'Producteurs, usines, artisanat',
    categories: [
      'producteurs', 'usines', 'laboratoires', 'agriculture', 'mines',
      'artisanat', 'bois', 'textile', 'conserves', 'miel', 'terroir',
    ],
  },
  {
    id: 'commerce',
    titre: 'Commerce & Distribution',
    icon: '🛒',
    description: 'Import-export, distribution, vente',
    categories: [
      'importateurs', 'exportateurs', 'distribution', 'grossistes',
      'commercants', 'franchises', 'commercial', 'apporteurs',
    ],
  },
  {
    id: 'batiment',
    titre: 'Bâtiment & Environnement',
    icon: '🏗️',
    description: 'Construction, énergie, immobilier',
    categories: [
      'gros_oeuvre', 'batiment', 'immobilier', 'energies_renouvelables',
      'eau', 'jardinage',
    ],
  },
  {
    id: 'services',
    titre: 'Services aux Entreprises',
    icon: '💼',
    description: 'Conseil, gestion, services pros',
    categories: [
      'prestataires', 'comptable', 'conseil', 'archivage', 'digitalisation',
      'conciergerie', 'securite', 'transporteurs', 'main_oeuvre',
    ],
  },
  {
    id: 'sante',
    titre: 'Santé & Éducation',
    icon: '🎓',
    description: 'Cliniques, écoles, formations',
    categories: [
      'clinique', 'paramedical', 'laboratoire_medical', 'ecole',
      'lycee', 'formation',
    ],
  },
  {
    id: 'finance',
    titre: 'Finance & Tourisme',
    icon: '🏦',
    description: 'Banques, hôtels, restaurants',
    categories: [
      'banques', 'assurances', 'location_voiture', 'hotel', 'restaurant',
    ],
  },
];
