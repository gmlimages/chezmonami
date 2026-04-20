import './globals.css'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/footer'
import CookieConsent from '@/components/CookieConsent'
import AdminBar from '@/components/AdminBar'

const BASE_URL = 'https://chezmonami.ma';

export const metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'ChezMonAmi - Trouvez les partenaires d\'affaires pour vos business',
    template: '%s | ChezMonAmi',
  },
  description:
    "Bienvenue sur ChezMonAmi, la plateforme panafricaine de BtoB qui vous connecte aux Apporteurs d'Affaires et partenaires commerciaux en toute confiance, maîtrisant les marchés locaux, les décideurs et circuits de distribution dans 10 pays Africains.",
  keywords: [
    'plateforme BtoB afrique',
    'apporteur affaires afrique',
    'partenaires commerciaux afrique',
    'business afrique',
    'réseau professionnel afrique',
    'marché local afrique',
    'chezmonami',
    'partenariat commercial',
    '10 pays africains',
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
    title: "ChezMonAmi - Trouvez les partenaires d'affaires pour vos business",
    description:
      "La plateforme panafricaine de BtoB qui vous connecte aux Apporteurs d'Affaires et partenaires commerciaux maîtrisant les marchés locaux dans 10 pays Africains.",
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
    title: "ChezMonAmi - Trouvez les partenaires d'affaires pour vos business",
    description:
      "La plateforme panafricaine de BtoB qui vous connecte aux Apporteurs d'Affaires et partenaires commerciaux maîtrisant les marchés locaux dans 10 pays Africains.",
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
    "Plateforme panafricaine de BtoB connectant les entreprises aux Apporteurs d'Affaires et partenaires commerciaux dans 10 pays Africains.",
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
        {/* Google Analytics 4 — scripts natifs dans <head> pour que Google Search Console puisse les détecter */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-CT6ZQF3D4P" />
        <script
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
