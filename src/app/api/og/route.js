// Génération d'images Open Graph dynamiques (1200×630).
// Utilisation côté metadata :
//   openGraph: { images: [`/api/og?titre=${encodeURIComponent(nom)}&type=structure`] }
//
// Paramètres :
//   - titre  : titre principal (max ~80 caractères affichés proprement)
//   - sous   : sous-titre / catégorie (optionnel)
//   - type   : 'structure' | 'produit' | 'annonce' | 'appel_offres' (badge en haut)
//   - pays   : pays / ville (optionnel)
//
// 100% gratuit (next/og inclus dans Next.js 15, exécuté en Edge runtime).

import { ImageResponse } from 'next/og';

export const runtime = 'edge';

const COULEURS_TYPE = {
  structure: { bg: '#0F766E', label: 'Structure' },
  produit: { bg: '#7C3AED', label: 'Produit' },
  annonce: { bg: '#DC2626', label: 'Annonce' },
  appel_offres: { bg: '#EA580C', label: "Appel d'offres" },
  default: { bg: '#1E293B', label: 'ChezMonAmi' },
};

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const titre = (searchParams.get('titre') || 'ChezMonAmi').slice(0, 120);
    const sous = (searchParams.get('sous') || '').slice(0, 80);
    const pays = (searchParams.get('pays') || '').slice(0, 60);
    const type = searchParams.get('type') || 'default';
    const config = COULEURS_TYPE[type] || COULEURS_TYPE.default;

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            backgroundColor: '#FFFFFF',
            backgroundImage:
              'radial-gradient(circle at 25% 0%, rgba(15,118,110,0.10) 0%, transparent 50%), radial-gradient(circle at 100% 100%, rgba(124,58,237,0.10) 0%, transparent 50%)',
            padding: '60px 70px',
            fontFamily: 'sans-serif',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                fontSize: 30,
                fontWeight: 700,
                color: '#0F172A',
              }}
            >
              <div
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 14,
                  background: 'linear-gradient(135deg, #0F766E 0%, #7C3AED 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: 26,
                  fontWeight: 800,
                }}
              >
                C
              </div>
              <span>ChezMonAmi</span>
            </div>
            <div
              style={{
                display: 'flex',
                padding: '10px 22px',
                borderRadius: 999,
                backgroundColor: config.bg,
                color: '#FFFFFF',
                fontSize: 22,
                fontWeight: 600,
              }}
            >
              {config.label}
            </div>
          </div>

          {/* Body */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div
              style={{
                display: 'block',
                fontSize: titre.length > 60 ? 56 : 72,
                fontWeight: 800,
                color: '#0F172A',
                lineHeight: 1.1,
                letterSpacing: '-0.02em',
              }}
            >
              {titre}
            </div>
            {sous && (
              <div
                style={{
                  display: 'block',
                  fontSize: 30,
                  color: '#475569',
                  fontWeight: 500,
                }}
              >
                {sous}
              </div>
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: 24,
              color: '#64748B',
              borderTop: '2px solid #E2E8F0',
              paddingTop: 24,
            }}
          >
            <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              {pays && (
                <span
                  style={{
                    display: 'flex',
                    padding: '6px 14px',
                    borderRadius: 8,
                    backgroundColor: '#F1F5F9',
                    color: '#0F172A',
                    fontWeight: 600,
                  }}
                >
                  {pays}
                </span>
              )}
              <span>Plateforme B2B panafricaine</span>
            </div>
            <span style={{ fontWeight: 600, color: '#0F766E' }}>chezmonami.ma</span>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e) {
    return new Response(`Erreur génération OG: ${e?.message || 'inconnue'}`, {
      status: 500,
    });
  }
}
