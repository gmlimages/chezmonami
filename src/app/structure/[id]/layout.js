import { supabaseAdmin } from '@/lib/supabaseAdmin';

const BASE_URL = 'https://chezmonami.ma';

export async function generateMetadata({ params }) {
  const { id } = await params;

  try {
    const { data: structure } = await supabaseAdmin
      .from('structures')
      .select('id, nom, description, images, ville:ville_id(nom), pays:pays_id(nom), categorie:categorie_id(nom)')
      .eq('id', id)
      .single();

    if (!structure) {
      return {
        title: 'Structure introuvable',
        description: "Cette structure n'existe pas ou a été supprimée.",
      };
    }

    const lieu = [structure.ville?.nom, structure.pays?.nom].filter(Boolean).join(', ');
    const categorie = structure.categorie?.nom || 'Professionnel';
    const titre = `${structure.nom}${lieu ? ` — ${lieu}` : ''}`;
    const description =
      structure.description
        ? structure.description.slice(0, 160)
        : `Découvrez ${structure.nom}, ${categorie.toLowerCase()} situé${lieu ? ` à ${lieu}` : ''} sur ChezMonAmi.`;

    const imageUrl =
      Array.isArray(structure.images) && structure.images.length > 0
        ? structure.images[0]
        : `${BASE_URL}/images/chezmonami.jpeg`;

    return {
      title: titre,
      description,
      openGraph: {
        title: titre,
        description,
        url: `${BASE_URL}/structure/${id}`,
        type: 'website',
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: structure.nom,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: titre,
        description,
        images: [imageUrl],
      },
      alternates: {
        canonical: `${BASE_URL}/structure/${id}`,
      },
    };
  } catch {
    return {
      title: 'ChezMonAmi',
      description: 'Découvrez les meilleurs professionnels en Afrique sur ChezMonAmi.',
    };
  }
}

export default function StructureDetailLayout({ children }) {
  return children;
}
