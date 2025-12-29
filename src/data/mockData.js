// src/data/mockData.js

export const ADMIN_CONTACT = {
  telephone: "+212 673-6230537",
  email: "contact@chezmonami.com"
};

export const categories = [
  { 
    id: 'restaurant', 
    nom: 'Restaurants', 
    icon: '🍽️',
    color: 'bg-orange-500' 
  },
  { 
    id: 'salon', 
    nom: 'Salons', 
    icon: '✂️',
    color: 'bg-pink-500' 
  },
  { 
    id: 'boutique', 
    nom: 'Boutiques', 
    icon: '🛍️',
    color: 'bg-blue-500' 
  },
  { 
    id: 'service', 
    nom: 'Services', 
    icon: '🔧',
    color: 'bg-green-500' 
  }
];

export const villes = [
  "Toutes les villes",
  "Dakar",
  "Abidjan", 
  "Casablanca",
  "Bamako",
  "Lomé",
  "Cotonou",
  "Ouagadougou",
  "Douala",
  "Kinshasa"
];

export const pays = [
  "Tous les pays",
  "Sénégal",
  "Côte d'Ivoire",
  "Maroc",
  "Mali",
  "Togo",
  "Bénin",
  "Burkina Faso",
  "Cameroun",
  "RD Congo"
];

export const structures = [
  {
    id: 1,
    nom: "Le Savoureux",
    categorie: "restaurant",
    ville: "Dakar",
    pays: "Sénégal",
    description: "Restaurant traditionnel proposant des plats sénégalais authentiques dans une ambiance chaleureuse. Spécialités: Thiéboudienne, Yassa poulet, Mafé. Nos plats sont préparés avec des ingrédients frais et locaux. Service de livraison disponible dans toute la ville de Dakar.",
    descriptionLongue: "Depuis 2010, Le Savoureux est devenu une référence incontournable de la gastronomie sénégalaise à Dakar. Notre chef, formé dans les meilleures écoles culinaires, revisite les recettes traditionnelles tout en respectant leur authenticité. Nous travaillons exclusivement avec des producteurs locaux pour garantir la fraîcheur et la qualité de nos ingrédients. Notre restaurant peut accueillir jusqu'à 80 personnes dans un cadre élégant et climatisé. Nous proposons également un service traiteur pour vos événements.",
    images: [
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800",
      "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800",
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800"
    ],
    telephone: ADMIN_CONTACT.telephone,
    email: ADMIN_CONTACT.email,
    horaires: "Lun-Dim: 12h-23h",
    note: 4.8,
    nombreAvis: 156,
    avis: [
      {
        id: 1,
        nom: "Aminata Diop",
        note: 5,
        commentaire: "Excellent restaurant ! Le thiéboudienne est délicieux et le service est impeccable. Je recommande vivement.",
        date: "2024-12-15"
      },
      {
        id: 2,
        nom: "Mamadou Sall",
        note: 4,
        commentaire: "Très bon accueil et plats savoureux. Juste un peu d'attente mais ça vaut le coup.",
        date: "2024-12-10"
      },
      {
        id: 3,
        nom: "Fatou Ndiaye",
        note: 5,
        commentaire: "Mon restaurant préféré à Dakar ! L'ambiance est top et les prix sont corrects.",
        date: "2024-12-05"
      }
    ]
  },
  {
    id: 2,
    nom: "Beauté Africaine",
    categorie: "salon",
    ville: "Abidjan",
    pays: "Côte d'Ivoire",
    description: "Salon de coiffure spécialisé dans les coiffures africaines, tresses, locks et soins capillaires. Expert en défrisage, tissage et perruques. Produits professionnels de qualité.",
    descriptionLongue: "Beauté Africaine est le salon de référence à Abidjan depuis 2015. Notre équipe de 8 coiffeuses professionnelles maîtrise toutes les techniques de coiffure africaine : tresses africaines, box braids, vanilles, locks, tissage brésilien, perruques, défrisage, coloration. Nous utilisons exclusivement des produits de qualité professionnelle adaptés aux cheveux afro. Le salon est climatisé et dispose d'un espace détente. Prise de rendez-vous recommandée.",
    images: [
      "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800",
      "https://images.unsplash.com/photo-1582095133179-bfd08e2fc6b3?w=800",
      "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=800"
    ],
    telephone: ADMIN_CONTACT.telephone,
    email: ADMIN_CONTACT.email,
    horaires: "Lun-Sam: 9h-19h, Dim: 10h-16h",
    note: 4.6,
    nombreAvis: 89,
    avis: [
      {
        id: 1,
        nom: "Aïcha Touré",
        note: 5,
        commentaire: "Super salon ! Les coiffeuses sont très professionnelles et douces. Mes tresses sont magnifiques.",
        date: "2024-12-18"
      },
      {
        id: 2,
        nom: "Marie Kouassi",
        note: 4,
        commentaire: "Bon travail, prix raisonnables. Juste un peu d'attente le samedi.",
        date: "2024-12-12"
      }
    ]
  },
  {
    id: 3,
    nom: "Mode & Style",
    categorie: "boutique",
    ville: "Dakar",
    pays: "Sénégal",
    description: "Boutique de vêtements et accessoires tendance. Spécialiste du wax africain, bazin, boubous modernes. Collections hommes, femmes et enfants. Livraison disponible.",
    descriptionLongue: "Mode & Style vous propose une sélection exclusive de vêtements africains modernes alliant tradition et tendances contemporaines. Nous importons nos tissus directement des meilleurs fabricants d'Afrique de l'Ouest. Notre atelier de couture sur place peut réaliser vos tenues sur mesure sous 48h. Collections renouvelées chaque saison. Service de stylisme personnalisé disponible pour vos événements.",
    images: [
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800",
      "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800"
    ],
    telephone: ADMIN_CONTACT.telephone,
    email: ADMIN_CONTACT.email,
    horaires: "Lun-Sam: 10h-20h",
    note: 4.7,
    nombreAvis: 234,
    produits: [
      {
        id: 101,
        nom: "Robe Africaine Wax",
        description: "Robe longue en wax authentique, coupe moderne et élégante",
        prix: 25000,
        images: ["https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600"],
        variations: [
          {taille: "S", stock: 5},
          {taille: "M", stock: 8},
          {taille: "L", stock: 3},
          {taille: "XL", stock: 2}
        ],
        stock: 18
      },
      {
        id: 102,
        nom: "Chemise Homme Bazin",
        description: "Chemise en bazin riche brodé, idéale pour cérémonies",
        prix: 18000,
        images: ["https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600"],
        variations: [
          {taille: "M", stock: 10},
          {taille: "L", stock: 7},
          {taille: "XL", stock: 4}
        ],
        stock: 21
      },
      {
        id: 103,
        nom: "Ensemble Boubou",
        description: "Boubou complet homme, bazin damassé de qualité supérieure",
        prix: 35000,
        images: ["https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?w=600"],
        variations: [
          {taille: "M", stock: 3},
          {taille: "L", stock: 5},
          {taille: "XL", stock: 2}
        ],
        stock: 10
      },
      {
        id: 104,
        nom: "Sac à Main Cuir",
        description: "Sac artisanal en cuir véritable, fait main",
        prix: 15000,
        images: ["https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600"],
        variations: [
          {couleur: "Marron", stock: 6},
          {couleur: "Noir", stock: 8},
          {couleur: "Beige", stock: 4}
        ],
        stock: 18
      }
    ],
    avis: [
      {
        id: 1,
        nom: "Khady Ba",
        note: 5,
        commentaire: "Très belle boutique ! Les tissus sont de qualité et les prix sont compétitifs. J'ai commandé 3 robes.",
        date: "2024-12-20"
      },
      {
        id: 2,
        nom: "Ousmane Cissé",
        note: 5,
        commentaire: "Service impeccable, livraison rapide. Mon boubou est magnifique !",
        date: "2024-12-16"
      }
    ]
  },
  {
    id: 4,
    nom: "Plomberie Pro",
    categorie: "service",
    ville: "Dakar",
    pays: "Sénégal",
    description: "Services de plomberie, électricité et réparations diverses. Intervention rapide 7j/7. Devis gratuit. Artisans qualifiés et expérimentés.",
    descriptionLongue: "Plomberie Pro est votre partenaire de confiance pour tous vos travaux de plomberie et d'électricité à Dakar. Avec plus de 15 ans d'expérience, notre équipe de 12 techniciens certifiés intervient rapidement pour résoudre vos problèmes : fuites d'eau, débouchage canalisations, installation sanitaires, réparation électrique, climatisation, peinture. Garantie sur tous nos travaux. Service d'urgence 24h/24 disponible.",
    images: [
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800",
      "https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=800"
    ],
    telephone: ADMIN_CONTACT.telephone,
    email: ADMIN_CONTACT.email,
    horaires: "7j/7: 7h-21h (Urgences 24h/24)",
    note: 4.9,
    nombreAvis: 312,
    avis: [
      {
        id: 1,
        nom: "Ibrahima Diallo",
        note: 5,
        commentaire: "Intervention rapide et efficace ! Problème de fuite résolu en 1h. Tarifs honnêtes.",
        date: "2024-12-21"
      },
      {
        id: 2,
        nom: "Awa Sarr",
        note: 5,
        commentaire: "Très professionnels. Ils ont installé ma climatisation parfaitement. Je recommande !",
        date: "2024-12-19"
      }
    ]
  },
  {
    id: 5,
    nom: "Chez Fatou",
    categorie: "restaurant",
    ville: "Abidjan",
    pays: "Côte d'Ivoire",
    description: "Cuisine ivoirienne maison authentique. Spécialités: Attiéké poisson braisé, Alloco banane, Garba, Sauce graine. Maquis convivial.",
    descriptionLongue: "Chez Fatou est le maquis incontournable d'Abidjan depuis 2008. Fatou et son équipe vous accueillent dans une ambiance familiale et chaleureuse. Tous nos plats sont préparés le jour même avec des produits frais du marché. Nos spécialités : attiéké poisson braisé, poulet braisé, alloco, garba, sauce graine, foutou. Grand espace extérieur ombragé. Idéal pour déjeuners d'affaires ou soirées entre amis.",
    images: [
      "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800",
      "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800"
    ],
    telephone: ADMIN_CONTACT.telephone,
    email: ADMIN_CONTACT.email,
    horaires: "Mar-Dim: 11h-23h (Fermé Lundi)",
    note: 4.7,
    nombreAvis: 178,
    avis: [
      {
        id: 1,
        nom: "Kouadio Jean",
        note: 5,
        commentaire: "Le meilleur attiéké d'Abidjan ! Fatou est adorable et ses plats sont délicieux.",
        date: "2024-12-17"
      }
    ]
  },
  {
    id: 6,
    nom: "TechFix",
    categorie: "service",
    ville: "Casablanca",
    pays: "Maroc",
    description: "Réparation téléphones, ordinateurs, tablettes. Pièces d'origine garanties. Diagnostic gratuit. Intervention rapide à domicile possible.",
    descriptionLongue: "TechFix est le centre de réparation high-tech leader à Casablanca. Nos techniciens certifiés réparent toutes marques : iPhone, Samsung, Huawei, laptops HP, Dell, Lenovo, tablettes iPad, Samsung Tab. Nous proposons le remplacement d'écrans, batteries, réparation carte mère, récupération de données, installation logiciels. Stock permanent de pièces détachées d'origine. Garantie 6 mois sur toutes réparations. Service express en 2h pour écrans.",
    images: [
      "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800",
      "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=800"
    ],
    telephone: ADMIN_CONTACT.telephone,
    email: ADMIN_CONTACT.email,
    horaires: "Lun-Sam: 9h-20h",
    note: 4.8,
    nombreAvis: 267,
    avis: [
      {
        id: 1,
        nom: "Youssef Alami",
        note: 5,
        commentaire: "Excellent service ! Mon iPhone réparé en 1h. Prix très corrects.",
        date: "2024-12-20"
      }
    ]
  }
];

export const annonces = [
  {
    id: 1,
    titre: "Appel à projets - Entrepreneuriat Jeunesse 2025",
    organisme: "Ministère de la Jeunesse - Sénégal",
    type: "Financement",
    pays: "Sénégal",
    ville: "National",
    description: "Le Ministère de la Jeunesse lance un appel à projets pour soutenir l'entrepreneuriat des jeunes de 18 à 35 ans. Financement jusqu'à 5 millions FCFA par projet.",
    descriptionLongue: "Dans le cadre de sa politique de promotion de l'entrepreneuriat jeunesse, le Ministère de la Jeunesse du Sénégal lance un appel à projets pour l'année 2025. Ce programme vise à accompagner les jeunes porteurs de projets innovants dans les secteurs de l'agriculture, du numérique, de l'artisanat et des services. Financement: de 500 000 à 5 000 000 FCFA par projet. Accompagnement technique et formation inclus. Critères: avoir entre 18 et 35 ans, être sénégalais, présenter un business plan viable.",
    dateDebut: "2025-01-15",
    dateFin: "2025-03-31",
    datePublication: "2024-12-20",
    contact: "entrepreneuriat@jeunesse.sn",
    telephone: "+221 33 823 45 67",
    lienExterne: "https://jeunesse.gouv.sn/appel-projets-2025"
  },
  {
    id: 2,
    titre: "Appel d'offres - Construction Marché Municipal",
    organisme: "Mairie de Cotonou",
    type: "Appel d'offres",
    pays: "Bénin",
    ville: "Cotonou",
    description: "Appel d'offres pour la construction d'un marché municipal moderne à Cotonou. Budget: 800 millions FCFA. Date limite: 28 Février 2025.",
    descriptionLongue: "La Mairie de Cotonou lance un appel d'offres international pour la construction d'un marché municipal moderne dans le quartier de Vossa. Le projet comprend : construction d'un bâtiment de 2500m², aménagement de 200 étals, installation électrique et sanitaire, parking de 50 places. Budget total : 800 000 000 FCFA. Les entreprises intéressées doivent avoir une expérience de 5 ans minimum dans la construction de bâtiments publics. Dossier technique disponible à la mairie.",
    dateDebut: "2025-01-10",
    dateFin: "2025-02-28",
    datePublication: "2024-12-18",
    contact: "marchesp publics@cotonou.bj",
    telephone: "+229 21 30 45 67"
  },
  {
    id: 3,
    titre: "Subvention ONG - Éducation des Filles",
    organisme: "UNICEF Afrique de l'Ouest",
    type: "Financement",
    pays: "Tous les pays",
    ville: "Régional",
    description: "L'UNICEF finance des projets d'éducation des filles en Afrique de l'Ouest. Subventions de 10 000 à 50 000 USD. Candidature jusqu'au 30 Avril 2025.",
    descriptionLongue: "Dans le cadre de son programme régional pour l'éducation des filles, l'UNICEF Afrique de l'Ouest offre des subventions aux ONG et associations locales. Projets éligibles : scolarisation des filles, formation professionnelle, lutte contre le décrochage scolaire, alphabétisation. Montants : de 10 000 à 50 000 USD selon l'ampleur du projet. Les organisations doivent avoir au moins 2 ans d'expérience dans le domaine de l'éducation. Accompagnement technique de l'UNICEF inclus.",
    dateDebut: "2025-01-20",
    dateFin: "2025-04-30",
    datePublication: "2024-12-15",
    contact: "grants@unicef-wca.org",
    telephone: "+221 33 869 58 00",
    lienExterne: "https://unicef.org/wca/grants-education"
  },
  {
    id: 4,
    titre: "Recrutement - 50 Agents Commerciaux",
    organisme: "Orange Côte d'Ivoire",
    type: "Emploi",
    pays: "Côte d'Ivoire",
    ville: "Abidjan",
    description: "Orange recrute 50 agents commerciaux pour ses agences à Abidjan. Expérience en vente requise. Candidature avant le 15 Janvier 2025.",
    descriptionLongue: "Orange Côte d'Ivoire recherche 50 agents commerciaux dynamiques pour renforcer ses équipes dans ses agences d'Abidjan. Missions : accueil clients, vente de produits et services télécoms, conseil personnalisé. Profil recherché : Bac+2 minimum, expérience de 1 an en vente, maîtrise du français et d'une langue locale, sens du service client. Salaire : à partir de 150 000 FCFA + commissions attractives. Formation assurée par Orange.",
    dateDebut: "2024-12-22",
    dateFin: "2025-01-15",
    datePublication: "2024-12-22",
    contact: "recrutement@orange.ci",
    telephone: "+225 07 08 98 76 54"
  },
  
];


export const villesParPays = {
  "Sénégal": ["Toutes", "Dakar", "Thiès", "Saint-Louis", "Kaolack", "Ziguinchor", "Louga"],
  "Côte d'Ivoire": ["Toutes", "Abidjan", "Bouaké", "Yamoussoukro", "San-Pédro", "Daloa", "Korhogo"],
  "Maroc": ["Toutes", "Casablanca", "Rabat", "Marrakech", "Fès", "Tanger", "Agadir"],
  "Mali": ["Toutes", "Bamako", "Sikasso", "Mopti", "Kayes", "Ségou", "Gao"],
  "Togo": ["Toutes", "Lomé", "Sokodé", "Kara", "Atakpamé", "Kpalimé"],
  "Bénin": ["Toutes", "Cotonou", "Porto-Novo", "Parakou", "Djougou", "Abomey"],
  "Burkina Faso": ["Toutes", "Ouagadougou", "Bobo-Dioulasso", "Koudougou", "Ouahigouya"],
  "Cameroun": ["Toutes", "Douala", "Yaoundé", "Bafoussam", "Garoua", "Bamenda"],
  "RD Congo": ["Toutes", "Kinshasa", "Lubumbashi", "Mbuji-Mayi", "Kisangani", "Kananga"],
  "Ghana": ["Toutes", "Accra", "Kumasi", "Tamale", "Takoradi", "Cape Coast"],
  "Guinée": ["Toutes", "Conakry", "Kankan", "Nzérékoré", "Kindia", "Labé"],
  "Niger": ["Toutes", "Niamey", "Zinder", "Maradi", "Agadez", "Tahoua"]
};

// Fonction utilitaire pour obtenir les villes d'un pays
export function getVillesByPays(pays) {
  return villesParPays[pays] || ["Toutes"];
}

// Produits ajoutés directement par l'admin (sans structure associée)
export const produitsGlobaux = [
  {
    id: 1001,
    nom: "Téléphone Samsung Galaxy A54",
    description: "Smartphone 5G, 128GB, écran 6.4 pouces",
    prix: 185000,
    images: ["https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600"],
    categorie: "Électronique",
    stock: 15,
    pays: "Sénégal",
    ville: "Dakar",
    livraisonAutreVille: true,
    livraisonAutrePays: true,
    structureId: null // null = produit ajouté par admin
  },
  {
    id: 1002,
    nom: "Ordinateur Portable HP",
    description: "HP 15, Intel Core i5, 8GB RAM, 512GB SSD",
    prix: 350000,
    images: ["https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600"],
    categorie: "Électronique",
    stock: 8,
    pays: "Côte d'Ivoire",
    ville: "Abidjan",
    livraisonAutreVille: true,
    livraisonAutrePays: false,
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
        pays: s.pays,
        ville: s.ville,
        livraisonAutreVille: true, // Par défaut pour les structures
        livraisonAutrePays: false
      }))
    );
  
  return [...produitsStructures, ...produitsGlobaux];
}

// Comptes administrateurs
export const admins = [
  {
    id: 1,
    nom: "Super Admin",
    email: "admin@chezmonami.com",
    motDePasse: "Admin123!", // En production, utilisez bcrypt
    role: "super_admin",
    dateCreation: "2024-01-01"
  },
  {
    id: 2,
    nom: "Admin Assistant",
    email: "assistant@chezmonami.com",
    motDePasse: "Assistant123!",
    role: "admin",
    dateCreation: "2024-06-15"
  }
];

// Configuration des pays et villes (modifiable par l'admin)
export let paysConfig = [...pays];
export let villesConfig = {...villesParPays};

// Fonctions pour modifier la configuration
export function ajouterPays(nouveauPays, villes = ["Toutes"]) {
  if (!paysConfig.includes(nouveauPays)) {
    paysConfig.push(nouveauPays);
    villesConfig[nouveauPays] = villes;
    return true;
  }
  return false;
}

export function supprimerPays(pays) {
  const index = paysConfig.indexOf(pays);
  if (index > -1 && pays !== "Tous les pays") {
    paysConfig.splice(index, 1);
    delete villesConfig[pays];
    return true;
  }
  return false;
}

export function ajouterVille(pays, nouvelleVille) {
  if (villesConfig[pays] && !villesConfig[pays].includes(nouvelleVille)) {
    villesConfig[pays].push(nouvelleVille);
    return true;
  }
  return false;
}

export function supprimerVille(pays, ville) {
  if (villesConfig[pays] && ville !== "Toutes") {
    const index = villesConfig[pays].indexOf(ville);
    if (index > -1) {
      villesConfig[pays].splice(index, 1);
      return true;
    }
  }
  return false;
}

// Devises par pays
export const devisesParPays = {
  "Sénégal": "FCFA",
  "Côte d'Ivoire": "FCFA",
  "Mali": "FCFA",
  "Togo": "FCFA",
  "Bénin": "FCFA",
  "Burkina Faso": "FCFA",
  "Maroc": "MAD",
  "Cameroun": "FCFA",
  "RD Congo": "CDF",
  "Ghana": "GHS",
  "Guinée": "GNF",
  "Niger": "FCFA"
};

// Fonction pour obtenir la devise d'un pays
export function getDevise(pays) {
  return devisesParPays[pays] || "FCFA";
}