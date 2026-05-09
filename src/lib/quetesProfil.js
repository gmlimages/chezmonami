// Lot E — Quêtes de complétion de profil entreprise.
// Calcule un score % et la liste des quêtes à partir des données déjà existantes
// (compte_structure + structure liée + extras optionnels).
//
// Aucune table SQL dédiée : tout est dérivé de l'état actuel.
//
// Usage côté serveur OU client :
//   import { calculerProgression } from '@/lib/quetesProfil';
//   const { pourcentage, quetes, complet } = calculerProgression(compte, structure, { nbDocsValides });

const QUETES_DEF = [
  {
    key: 'compte_actif',
    label: 'Compte validé',
    description: 'Votre compte est validé par un admin',
    icon: '✅',
    poids: 1,
    test: (c) => c?.statut === 'actif',
    lien: null,
  },
  {
    key: 'logo',
    label: 'Ajouter un logo',
    description: 'Uploadez un logo ou une image principale',
    icon: '🖼️',
    poids: 1,
    test: (_c, s) => Array.isArray(s?.images) && s.images.length > 0,
    lien: '/entreprise/dashboard/ma-structure',
  },
  {
    key: 'description_courte',
    label: 'Renseigner la description',
    description: 'Au moins 50 caractères',
    icon: '📝',
    poids: 1,
    test: (_c, s) => typeof s?.description === 'string' && s.description.trim().length >= 50,
    lien: '/entreprise/dashboard/ma-structure',
  },
  {
    key: 'description_longue',
    label: 'Compléter la description longue',
    description: 'Au moins 200 caractères',
    icon: '📄',
    poids: 1,
    test: (_c, s) => typeof s?.description_longue === 'string' && s.description_longue.trim().length >= 200,
    lien: '/entreprise/dashboard/ma-structure',
  },
  {
    key: 'telephone',
    label: 'Ajouter un téléphone',
    description: 'Dans votre profil',
    icon: '📞',
    poids: 1,
    test: (c) => Boolean(c?.telephone),
    lien: '/entreprise/dashboard/profil',
  },
  {
    key: 'adresse',
    label: 'Ajouter une adresse',
    description: 'Dans votre fiche entreprise',
    icon: '📍',
    poids: 1,
    test: (_c, s) => Boolean(s?.adresse),
    lien: '/entreprise/dashboard/ma-structure',
  },
  {
    key: 'horaires',
    label: 'Renseigner les horaires',
    description: 'Horaires d\'ouverture',
    icon: '⏰',
    poids: 1,
    test: (_c, s) => Boolean(s?.horaires) || (s?.horaires_detailles && Object.keys(s.horaires_detailles).length > 0),
    lien: '/entreprise/dashboard/ma-structure',
  },
  {
    key: 'galerie',
    label: 'Ajouter au moins 3 photos',
    description: 'Galerie d\'images',
    icon: '📸',
    poids: 1,
    test: (_c, s) => {
      const totalImg = (Array.isArray(s?.images) ? s.images.length : 0)
        + (Array.isArray(s?.galerie) ? s.galerie.length : 0);
      return totalImg >= 3;
    },
    lien: '/entreprise/dashboard/ma-structure',
  },
  {
    key: 'site_ou_video',
    label: 'Ajouter un site web ou lien vidéo',
    description: 'De votre entreprise ou produits',
    icon: '🌐',
    poids: 1,
    test: (_c, s) => Boolean(s?.site_web) || Boolean(s?.youtube_video_url) || Boolean(s?.youtube_video_url_2) || (Array.isArray(s?.canaux_contact) && s.canaux_contact.length > 0),
    lien: '/entreprise/dashboard/ma-structure',
  },
  {
    key: 'documents',
    label: 'Soumettre les documents légaux',
    description: 'Au moins 1 document validé',
    icon: '📎',
    poids: 1,
    test: (_c, _s, extras) => (extras?.nbDocsValides || 0) >= 1,
    lien: '/entreprise/dashboard/documents',
  },
  {
    key: 'publie',
    label: 'Fiche publiée',
    description: 'Votre fiche est visible publiquement',
    icon: '🚀',
    poids: 1,
    test: (_c, s) => s?.statut === 'publie',
    lien: '/entreprise/dashboard/ma-structure',
  },
];

export function calculerProgression(compte, structure, extras = {}) {
  const quetes = QUETES_DEF.map((q) => {
    let fait = false;
    try {
      fait = !!q.test(compte, structure, extras);
    } catch {
      fait = false;
    }
    return {
      key: q.key,
      label: q.label,
      description: q.description,
      icon: q.icon,
      lien: q.lien,
      fait,
      poids: q.poids,
    };
  });

  const total = quetes.reduce((s, q) => s + q.poids, 0);
  const acquis = quetes.reduce((s, q) => s + (q.fait ? q.poids : 0), 0);
  const pourcentage = total > 0 ? Math.round((acquis / total) * 100) : 0;
  const complet = pourcentage >= 100;

  return { pourcentage, quetes, complet, total, acquis };
}
