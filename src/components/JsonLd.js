// Helpers JSON-LD pour enrichir les pages avec des données structurées schema.org.
// À utiliser dans les pages détail (server ou client) :
//
//   import { JsonLd, structureSchema } from '@/components/JsonLd';
//   <JsonLd data={structureSchema(structure)} />

const BASE_URL = 'https://chezmonami.ma';

export function JsonLd({ data }) {
  if (!data) return null;
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function structureSchema(structure) {
  if (!structure) return null;
  const url = `${BASE_URL}/structure/${structure.slug || structure.id}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': url,
    name: structure.nom,
    description: structure.description || undefined,
    url,
    image:
      structure.image_principale ||
      structure.logo ||
      `${BASE_URL}/images/chezmonami.jpeg`,
    telephone: structure.telephone || undefined,
    email: structure.email || undefined,
    address: structure.adresse
      ? {
          '@type': 'PostalAddress',
          streetAddress: structure.adresse,
          addressLocality: structure.ville || undefined,
          addressCountry: structure.pays?.code || structure.pays_code || undefined,
        }
      : undefined,
    geo:
      structure.latitude && structure.longitude
        ? {
            '@type': 'GeoCoordinates',
            latitude: structure.latitude,
            longitude: structure.longitude,
          }
        : undefined,
    aggregateRating:
      structure.note_moyenne && structure.nombre_avis
        ? {
            '@type': 'AggregateRating',
            ratingValue: structure.note_moyenne,
            reviewCount: structure.nombre_avis,
          }
        : undefined,
  };
}

export function produitSchema(produit) {
  if (!produit) return null;
  const url = `${BASE_URL}/produit/${produit.id}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': url,
    name: produit.nom,
    description: produit.description || undefined,
    image: produit.image_principale || produit.images?.[0] || undefined,
    sku: produit.id,
    brand: produit.structure?.nom
      ? { '@type': 'Brand', name: produit.structure.nom }
      : undefined,
    offers:
      produit.prix != null
        ? {
            '@type': 'Offer',
            url,
            priceCurrency: produit.devise || 'XOF',
            price: produit.prix,
            availability:
              produit.stock_disponible !== false
                ? 'https://schema.org/InStock'
                : 'https://schema.org/OutOfStock',
          }
        : undefined,
  };
}

export function annonceSchema(annonce) {
  if (!annonce) return null;
  const url = `${BASE_URL}/annonce/${annonce.id}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': url,
    headline: annonce.titre,
    description: annonce.description || undefined,
    image: annonce.image_principale || undefined,
    datePublished: annonce.created_at || undefined,
    dateModified: annonce.updated_at || annonce.created_at || undefined,
    author: annonce.organisme
      ? { '@type': 'Organization', name: annonce.organisme }
      : undefined,
    publisher: {
      '@type': 'Organization',
      name: 'ChezMonAmi',
      logo: {
        '@type': 'ImageObject',
        url: `${BASE_URL}/images/chezmonami.jpeg`,
      },
    },
  };
}

export function breadcrumbSchema(items) {
  if (!Array.isArray(items) || items.length === 0) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: item.name,
      item: item.url ? `${BASE_URL}${item.url}` : undefined,
    })),
  };
}
