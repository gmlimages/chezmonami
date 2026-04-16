export const metadata = {
  title: 'Annonces — Offres & Opportunités en Afrique',
  description:
    "Consultez toutes les annonces professionnelles sur ChezMonAmi : offres d'emploi, opportunités commerciales, services et bien plus partout en Afrique.",
  keywords: [
    'annonces afrique',
    'offres emploi afrique',
    'opportunités commerciales',
    'annonces professionnelles',
    'petites annonces maroc',
  ],
  openGraph: {
    title: 'Annonces | ChezMonAmi',
    description:
      'Toutes les annonces et opportunités professionnelles en Afrique sur une seule plateforme.',
    url: 'https://chezmonami.ma/annonces',
  },
  alternates: {
    canonical: 'https://chezmonami.ma/annonces',
  },
};

export default function AnnoncesLayout({ children }) {
  return children;
}
