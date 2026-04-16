export const metadata = {
  title: 'Toutes les structures — Restaurants, Salons, Boutiques & Services',
  description:
    "Explorez l'annuaire complet de ChezMonAmi : restaurants, salons de beauté, boutiques, hôtels et services professionnels partout en Afrique. Filtrez par pays, ville et catégorie.",
  keywords: [
    'annuaire professionnels afrique',
    'restaurants afrique',
    'salons beauté afrique',
    'boutiques afrique',
    'hôtels afrique',
    'services professionnels',
    'trouver commerce',
  ],
  openGraph: {
    title: 'Toutes les structures | ChezMonAmi',
    description:
      "Restaurants, salons, boutiques, hôtels… Explorez des centaines d'adresses professionnelles partout en Afrique.",
    url: 'https://chezmonami.ma/structures',
  },
  alternates: {
    canonical: 'https://chezmonami.ma/structures',
  },
};

export default function StructuresLayout({ children }) {
  return children;
}
