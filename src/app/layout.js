import './globals.css'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/footer'
import CookieConsent from '@/components/CookieConsent'
import AdminBar from '@/components/AdminBar'
import Script from 'next/script'

const BASE_URL = 'https://chezmonami.ma';

export const metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'ChezMonAmi — Trouvez les meilleures adresses en Afrique',
    template: '%s | ChezMonAmi',
  },
  description:
    "ChezMonAmi répertorie les meilleurs restaurants, salons, boutiques, hôtels et services de proximité à travers toute l'Afrique. Trouvez, comparez et contactez les professionnels près de chez vous.",
  keywords: [
    'annuaire afrique',
    'restaurants afrique',
    'boutiques maroc',
    'services proximité',
    'trouver professionnel afrique',
    'hôtels afrique',
    'salons beauté afrique',
    'chezmonami',
  ],
  authors: [{ name: 'ChezMonAmi', url: BASE_URL }],
  creator: 'ChezMonAmi',
  publisher: 'ChezMonAmi',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'fr_MA',
    url: BASE_URL,
    siteName: 'ChezMonAmi',
    title: 'ChezMonAmi — Trouvez les meilleures adresses en Afrique',
    description:
      'Restaurants, salons, boutiques, hôtels… Trouvez et contactez les professionnels près de chez vous partout en Afrique.',
    images: [
      {
        url: '/images/chezmonami.jpeg',
        width: 1200,
        height: 630,
        alt: 'ChezMonAmi — Annuaire des professionnels en Afrique',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ChezMonAmi — Trouvez les meilleures adresses en Afrique',
    description:
      'Restaurants, salons, boutiques, hôtels… Trouvez et contactez les professionnels près de chez vous partout en Afrique.',
    images: ['/images/chezmonami.jpeg'],
    creator: '@chezmonami',
  },
  alternates: {
    canonical: BASE_URL,
  },
};

// Données structurées Organisation (JSON-LD) — enrichissent les résultats Google
const jsonLdOrganization = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'ChezMonAmi',
  url: BASE_URL,
  logo: `${BASE_URL}/images/chezmonami.jpeg`,
  description:
    'Annuaire en ligne des professionnels et commerces en Afrique : restaurants, salons, boutiques, hôtels et services de proximité.',
  sameAs: [],
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer support',
    availableLanguage: ['French'],
  },
  areaServed: {
    '@type': 'Place',
    name: 'Afrique',
  },
};

const jsonLdWebSite = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'ChezMonAmi',
  url: BASE_URL,
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${BASE_URL}/structures?recherche={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <head>
        {/* Google Analytics 4 */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-CT6ZQF3D4P"
          strategy="afterInteractive"
        />
        <Script
          id="ga4-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-CT6ZQF3D4P');
            `,
          }}
        />

        {/* Données structurées JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdOrganization) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdWebSite) }}
        />
      </head>
      <body>
        <AdminBar />
        <Header />
        <main className="min-h-screen">
          {children}
        </main>
        <Footer />
        <CookieConsent />
      </body>
    </html>
  )
}
