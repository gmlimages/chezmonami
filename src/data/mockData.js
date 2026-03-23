// src/data/mockData.js - VERSION MAROC

export const ADMIN_CONTACT = {
  telephone: "+212 693-908389",
  email: "contact@chezmonami.ma"
};

export const categories = [
  {
    id: 'restaurant',
    nom: 'Restaurants & Cafés',
    icon: '🍽️',
    color: 'bg-orange-500'
  },
  {
    id: 'hotel',
    nom: 'Hôtels & Riads',
    icon: '🏨',
    color: 'bg-yellow-500'
  },
  {
    id: 'salon',
    nom: 'Salons & Beauté',
    icon: '✂️',
    color: 'bg-pink-500'
  },
  {
    id: 'boutique',
    nom: 'Boutiques & Mode',
    icon: '👗',
    color: 'bg-purple-500'
  },
  {
    id: 'artisanat',
    nom: 'Artisanat & Souvenirs',
    icon: '🏺',
    color: 'bg-amber-600'
  },
  {
    id: 'service',
    nom: 'Services',
    icon: '🔧',
    color: 'bg-gray-600'
  }
];

// Régions du Maroc (remplace "pays")
export const regions = [
  "Toutes les régions",
  "Casablanca-Settat",
  "Rabat-Salé-Kénitra",
  "Marrakech-Safi",
  "Fès-Meknès",
  "Tanger-Tétouan-Al Hoceïma",
  "Oriental",
  "Souss-Massa",
  "Béni Mellal-Khénifra",
  "Drâa-Tafilalet",
  "Guelmim-Oued Noun",
  "Laâyoune-Sakia El Hamra",
  "Dakhla-Oued Ed-Dahab"
];

// Pour compatibilité descendante (certains endroits utilisent encore "pays")
export const pays = regions;

// Villes par région
export const villesParRegion = {
  "Casablanca-Settat": ["Toutes", "Casablanca", "Mohammedia", "El Jadida", "Settat", "Berrechid"],
  "Rabat-Salé-Kénitra": ["Toutes", "Rabat", "Salé", "Témara", "Kénitra", "Skhirat", "Khémisset"],
  "Marrakech-Safi": ["Toutes", "Marrakech", "Safi", "Essaouira", "Kelaa des Sraghna"],
  "Fès-Meknès": ["Toutes", "Fès", "Meknès", "Taza", "Ifrane", "Sefrou"],
  "Tanger-Tétouan-Al Hoceïma": ["Toutes", "Tanger", "Tétouan", "Al Hoceïma", "Larache", "Chefchaouen", "Assilah"],
  "Oriental": ["Toutes", "Oujda", "Nador", "Berkane", "Taourirt"],
  "Souss-Massa": ["Toutes", "Agadir", "Tiznit", "Taroudant", "Inezgane", "Ait Melloul"],
  "Béni Mellal-Khénifra": ["Toutes", "Béni Mellal", "Khouribga", "Fkih Ben Salah", "Azilal"],
  "Drâa-Tafilalet": ["Toutes", "Ouarzazate", "Errachidia", "Zagora", "Tinghir", "Midelt"],
  "Guelmim-Oued Noun": ["Toutes", "Guelmim", "Tan-Tan", "Sidi Ifni"],
  "Laâyoune-Sakia El Hamra": ["Toutes", "Laâyoune", "Boujdour", "Smara"],
  "Dakhla-Oued Ed-Dahab": ["Toutes", "Dakhla", "Aousserd"]
};

// Pour compatibilité descendante
export const villesParPays = villesParRegion;

export const villes = [
  "Toutes les villes",
  "Casablanca",
  "Rabat",
  "Marrakech",
  "Fès",
  "Tanger",
  "Agadir",
  "Meknès",
  "Oujda",
  "Kénitra",
  "Tétouan"
];

export const structures = [
  {
    id: 1,
    nom: "Le Médersa Restaurant",
    categorie: "restaurant",
    ville: "Fès",
    region: "Fès-Meknès",
    description: "Restaurant traditionnel marocain au cœur de la médina de Fès. Spécialités : tajine d'agneau, couscous royal, pastilla aux pigeons. Vue panoramique sur la médina.",
    descriptionLongue: "Niché dans les ruelles de la médina de Fès, Le Médersa vous plonge dans l'authenticité de la gastronomie marocaine. Notre chef prépare chaque plat selon les recettes ancestrales transmises de génération en génération. Nous accueillons jusqu'à 60 personnes dans un cadre entièrement décoré de zellige et de bois sculpté. Menus groupe disponibles.",
    images: [
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800",
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800"
    ],
    telephone: ADMIN_CONTACT.telephone,
    email: ADMIN_CONTACT.email,
    horaires: "Mar-Dim: 12h-23h (Fermé Lundi)",
    note: 4.8,
    nombreAvis: 156,
    avis: [
      {
        id: 1,
        nom: "Youssef Alami",
        note: 5,
        commentaire: "Excellent restaurant ! La pastilla est exquise et le service impeccable. Vue magnifique sur la médina.",
        date: "2024-12-15"
      },
      {
        id: 2,
        nom: "Fatima Zahra",
        note: 5,
        commentaire: "Meilleure expérience culinaire à Fès. Le tajine d'agneau était parfait !",
        date: "2024-12-10"
      }
    ]
  },
  {
    id: 2,
    nom: "Riad Al Andalous",
    categorie: "hotel",
    ville: "Marrakech",
    region: "Marrakech-Safi",
    description: "Riad authentique au cœur de la médina de Marrakech. 8 chambres décorées avec soin, patio central avec fontaine, terrasse avec vue sur les toits. Petit-déjeuner marocain inclus.",
    descriptionLongue: "Le Riad Al Andalous est un havre de paix niché dans la médina de Marrakech. Ses 8 chambres et suites sont décorées dans le pur style andalou-marocain avec des matériaux nobles : zellige, tadelakt, bois de cèdre sculpté. Le patio central avec sa fontaine en marbre crée une atmosphère unique. Service de conciergerie disponible pour excursions.",
    images: [
      "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800",
      "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800"
    ],
    telephone: ADMIN_CONTACT.telephone,
    email: ADMIN_CONTACT.email,
    horaires: "Réception 24h/24",
    note: 4.9,
    nombreAvis: 234,
    avis: [
      {
        id: 1,
        nom: "Ahmed Benali",
        note: 5,
        commentaire: "Riad magnifique ! L'accueil est chaleureux et le petit-déjeuner exceptionnel.",
        date: "2024-12-18"
      }
    ]
  },
  {
    id: 3,
    nom: "Maison Argan Essaouira",
    categorie: "boutique",
    ville: "Essaouira",
    region: "Marrakech-Safi",
    description: "Coopérative féminine proposant des produits à base d'huile d'argan pure : huile cosmétique, amlou, savons, crèmes. Production locale certifiée. Vente directe sans intermédiaire.",
    descriptionLongue: "La Maison Argan est une coopérative fondée par des femmes berbères d'Essaouira. Nous produisons et vendons directement tous nos produits à base d'huile d'argan : huile d'argan pure cosmétique et alimentaire, amlou (pâte d'amande et argan), savons artisanaux, crèmes hydratantes. Certification biologique. Visite de l'atelier possible sur réservation.",
    images: [
      "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800",
      "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800"
    ],
    telephone: ADMIN_CONTACT.telephone,
    email: ADMIN_CONTACT.email,
    horaires: "Lun-Sam: 9h-19h",
    note: 4.7,
    nombreAvis: 189,
    produits: [
      {
        id: 101,
        nom: "Huile d'Argan Pure Cosmétique 100ml",
        description: "Huile d'argan pure première pression à froid, certifiée biologique",
        prix: 180,
        images: ["https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=600"],
        stock: 50
      },
      {
        id: 102,
        nom: "Amlou 250g",
        description: "Pâte d'amande, argan et miel - spécialité berbère",
        prix: 95,
        images: ["https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=600"],
        stock: 30
      }
    ],
    avis: [
      {
        id: 1,
        nom: "Marie Dupont",
        note: 5,
        commentaire: "Produits de qualité exceptionnelle ! L'huile d'argan est pure et efficace.",
        date: "2024-12-20"
      }
    ]
  },
  {
    id: 4,
    nom: "TechCasa",
    categorie: "service",
    ville: "Casablanca",
    region: "Casablanca-Settat",
    description: "Réparation téléphones, ordinateurs et tablettes. Toutes marques. Diagnostic gratuit. Service express en 2h. Pièces d'origine garanties. Intervention à domicile disponible.",
    descriptionLongue: "TechCasa est votre centre de réparation high-tech de référence à Casablanca. Nos techniciens certifiés réparent iPhone, Samsung, Huawei, laptops HP, Dell, Lenovo. Services : remplacement écrans, batteries, réparation carte mère, récupération de données. Garantie 6 mois sur toutes réparations. Service express en 2h pour les écrans.",
    images: [
      "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800"
    ],
    telephone: ADMIN_CONTACT.telephone,
    email: ADMIN_CONTACT.email,
    horaires: "Lun-Sam: 9h-20h",
    note: 4.8,
    nombreAvis: 267,
    avis: [
      {
        id: 1,
        nom: "Karim Tazi",
        note: 5,
        commentaire: "Service rapide et professionnel. Mon iPhone réparé en moins d'une heure !",
        date: "2024-12-20"
      }
    ]
  },
  {
    id: 5,
    nom: "Hammam Ain Soleil",
    categorie: "salon",
    ville: "Rabat",
    region: "Rabat-Salé-Kénitra",
    description: "Hammam traditionnel marocain proposant soins complets : gommage au savon beldi, massage aromatique aux huiles essentielles, soin à l'huile d'argan. Espace mixte et réservations privées.",
    descriptionLongue: "Le Hammam Ain Soleil perpétue la tradition du hammam marocain dans un cadre luxueux et authentique. Nos praticiens certifiés proposent des rituels complets : bain de vapeur, gommage au kessa et savon beldi, massage relaxant aux huiles essentielles. Formules à la carte ou en pack. Espace femmes, hommes et réservations privées pour groupes.",
    images: [
      "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800"
    ],
    telephone: ADMIN_CONTACT.telephone,
    email: ADMIN_CONTACT.email,
    horaires: "Lun-Dim: 9h-22h",
    note: 4.6,
    nombreAvis: 143,
    avis: [
      {
        id: 1,
        nom: "Leila Bensouda",
        note: 5,
        commentaire: "Une expérience magnifique ! Le gommage et le massage sont parfaits.",
        date: "2024-12-17"
      }
    ]
  },
  {
    id: 6,
    nom: "Galerie Berbère",
    categorie: "artisanat",
    ville: "Marrakech",
    region: "Marrakech-Safi",
    description: "Galerie d'artisanat marocain authentique : tapis berbères, poteries, lanières en cuir, babouches, dinanderie. Pièces uniques faites main par des artisans locaux. Expédition internationale.",
    descriptionLongue: "La Galerie Berbère réunit les plus beaux produits de l'artisanat marocain : tapis des tribus berbères (Beni Ouarain, Azilal, Boucherouite), poteries de Safi et Fès, cuir tanné de la Chouara, bijoux en argent berbère, lanières, dinanderie. Chaque pièce est certifiée artisanale. Nous proposons aussi des ateliers de découverte sur réservation.",
    images: [
      "https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=800"
    ],
    telephone: ADMIN_CONTACT.telephone,
    email: ADMIN_CONTACT.email,
    horaires: "Lun-Dim: 10h-20h",
    note: 4.7,
    nombreAvis: 98
  }
];

export const annonces = [
  {
    id: 1,
    titre: "Appel à projets - Start-up Maroc 2025",
    organisme: "Ministère de l'Investissement - Maroc",
    type: "Financement",
    region: "National",
    ville: "Rabat",
    description: "Le Ministère de l'Investissement lance un appel à projets pour soutenir les start-ups marocaines innovantes. Financement jusqu'à 500 000 MAD par projet sélectionné.",
    descriptionLongue: "Dans le cadre du Plan d'Accélération Industrielle 2025, le Ministère de l'Investissement lance un appel à projets pour start-ups innovantes dans les secteurs : numérique, agriculture, énergies renouvelables, santé, tourisme. Financement: de 100 000 à 500 000 MAD. Accompagnement technique et mise en réseau inclus. Critères: avoir moins de 3 ans d'existence, être immatriculé au Maroc.",
    dateDebut: "2025-01-15",
    dateFin: "2025-04-30",
    datePublication: "2024-12-20",
    contact: "startup@investissement.gov.ma",
    telephone: "+212 537 67 89 10"
  },
  {
    id: 2,
    titre: "Appel d'offres - Rénovation Médina de Tanger",
    organisme: "Commune de Tanger",
    type: "Appel d'offres",
    region: "Tanger-Tétouan-Al Hoceïma",
    ville: "Tanger",
    description: "Appel d'offres pour la rénovation de 3 places publiques dans la médina de Tanger. Budget : 8 millions MAD. Date limite de soumission : 28 Février 2025.",
    descriptionLongue: "La Commune de Tanger lance un appel d'offres pour la rénovation et la mise en valeur de trois places emblématiques de la médina historique. Le projet comprend : réfection des sols en zellige, installation de fontaines, éclairage patrimonial, mobilier urbain. Budget total : 8 000 000 MAD. Entreprises éligibles : 5 ans d'expérience minimum en réhabilitation du patrimoine.",
    dateDebut: "2025-01-10",
    dateFin: "2025-02-28",
    datePublication: "2024-12-18",
    contact: "marches@commune-tanger.ma",
    telephone: "+212 539 33 44 55"
  },
  {
    id: 3,
    titre: "Recrutement - 30 Conseillers Clients",
    organisme: "Maroc Telecom",
    type: "Emploi",
    region: "Casablanca-Settat",
    ville: "Casablanca",
    description: "Maroc Telecom recrute 30 conseillers clients pour ses agences de Casablanca. Bac+2 minimum, expérience souhaitée. Candidature avant le 20 Janvier 2025.",
    descriptionLongue: "Maroc Telecom recherche des conseillers clients dynamiques pour renforcer ses équipes à Casablanca. Missions : accueil et conseil clients, vente de solutions télécom et internet, gestion des réclamations. Profil : Bac+2 minimum, maîtrise du français et de l'arabe, sens du service client, dynamisme. Salaire attractif + commissions + avantages sociaux.",
    dateDebut: "2024-12-22",
    dateFin: "2025-01-20",
    datePublication: "2024-12-22",
    contact: "rh@iam.ma",
    telephone: "+212 522 98 76 54"
  },
  {
    id: 4,
    titre: "Forum Investissement Maroc-Europe 2025",
    organisme: "CGEM - Confédération Générale des Entreprises",
    type: "Salon BtoB",
    region: "Rabat-Salé-Kénitra",
    ville: "Rabat",
    description: "3ème édition du Forum Investissement Maroc-Europe. Rencontres B2B, ateliers sectoriels, opportunités de partenariat. 2-3 Mars 2025 à Rabat.",
    descriptionLongue: "Le Forum Investissement Maroc-Europe réunit chaque année des entrepreneurs, investisseurs et décideurs marocains et européens. Cette 3ème édition mettra en avant les secteurs : industrie verte, tourisme durable, agroalimentaire, numérique. Au programme : conférences plénières, ateliers sectoriels, matchmaking B2B, visite de sites industriels. Inscription gratuite pour les entreprises marocaines.",
    dateDebut: "2025-03-02",
    dateFin: "2025-03-03",
    datePublication: "2024-12-15",
    contact: "forum@cgem.ma",
    telephone: "+212 522 99 70 00"
  }
];

export const villesParPaysCompat = villesParRegion;

// Fonction utilitaire pour obtenir les villes d'une région
export function getVillesByRegion(region) {
  return villesParRegion[region] || ["Toutes"];
}

// Alias pour compatibilité
export function getVillesByPays(region) {
  return getVillesByRegion(region);
}

// Produits ajoutés directement par l'admin (sans structure associée)
export const produitsGlobaux = [
  {
    id: 1001,
    nom: "Tapis Beni Ouarain Authentique",
    description: "Tapis berbère laine naturelle, motifs géométriques noirs sur fond ivoire, 200x300cm",
    prix: 2800,
    images: ["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600"],
    categorie: "Artisanat Marocain",
    stock: 5,
    region: "Marrakech-Safi",
    ville: "Marrakech",
    livraisonLocale: true,
    livraisonInternationale: true,
    structureId: null
  },
  {
    id: 1002,
    nom: "Huile d'Argan Bio 250ml",
    description: "Huile d'argan pure alimentaire, première pression à froid, certifiée bio",
    prix: 220,
    images: ["https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=600"],
    categorie: "Alimentation & Épicerie",
    stock: 40,
    region: "Souss-Massa",
    ville: "Agadir",
    livraisonLocale: true,
    livraisonInternationale: true,
    structureId: null
  }
];

// Fonction pour obtenir TOUS les produits (structures + globaux)
export function getTousProduits() {
  const produitsStructures = structures
    .filter(s => s.produits && s.produits.length > 0)
    .flatMap(s =>
      s.produits.map(p => ({
        ...p,
        structureId: s.id,
        structureNom: s.nom,
        region: s.region,
        ville: s.ville,
        livraisonLocale: true,
        livraisonInternationale: false
      }))
    );

  return [...produitsStructures, ...produitsGlobaux];
}

// Comptes administrateurs
export const admins = [
  {
    id: 1,
    nom: "Super Admin",
    email: "admin@chezmonami.ma",
    motDePasse: "Admin123!",
    role: "super_admin",
    dateCreation: "2024-01-01"
  }
];

// Configuration des régions et villes (modifiable par l'admin)
export let regionsConfig = [...regions];
export let villesConfig = {...villesParRegion};

// Fonctions pour modifier la configuration (admin)
export function ajouterRegion(nouvelleRegion, villes = ["Toutes"]) {
  if (!regionsConfig.includes(nouvelleRegion)) {
    regionsConfig.push(nouvelleRegion);
    villesConfig[nouvelleRegion] = villes;
    return true;
  }
  return false;
}

export function supprimerRegion(region) {
  const index = regionsConfig.indexOf(region);
  if (index > -1 && region !== "Toutes les régions") {
    regionsConfig.splice(index, 1);
    delete villesConfig[region];
    return true;
  }
  return false;
}

export function ajouterVille(region, nouvelleVille) {
  if (villesConfig[region] && !villesConfig[region].includes(nouvelleVille)) {
    villesConfig[region].push(nouvelleVille);
    return true;
  }
  return false;
}

export function supprimerVille(region, ville) {
  if (villesConfig[region] && ville !== "Toutes") {
    const index = villesConfig[region].indexOf(ville);
    if (index > -1) {
      villesConfig[region].splice(index, 1);
      return true;
    }
  }
  return false;
}

// Devise fixe pour le Maroc
export const DEVISE_MAROC = 'MAD';
export const SYMBOLE_DEVISE = 'DH';

// Fonction pour formater un prix en MAD
export function formatPrix(prix) {
  if (!prix && prix !== 0) return '0 DH';
  return `${Number(prix).toLocaleString('fr-MA')} DH`;
}
