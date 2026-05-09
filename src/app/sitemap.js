import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { slugify } from '@/lib/slug';

const BASE_URL = 'https://chezmonami.ma';

// Revalider toutes les heures (sitemap re-généré à la demande)
export const revalidate = 3600;

export default async function sitemap() {
  // ── Pages statiques ────────────────────────────────────────────────────────
  const pagesStatiques = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/structures`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/boutique`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/annonces`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/entreprise/inscription`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  // ── Pages dynamiques : structures publiées ─────────────────────────────────
  let pagesStructures = [];
  try {
    const { data: structures } = await supabaseAdmin
      .from('structures')
      .select('id, slug, updated_at')
      .eq('statut', 'publie');

    if (structures?.length) {
      pagesStructures = structures.map((s) => ({
        url: `${BASE_URL}/structure/${s.slug || s.id}`,
        lastModified: s.updated_at ? new Date(s.updated_at) : new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
      }));
    }
  } catch (err) {
    console.error('[sitemap] Erreur chargement structures:', err);
  }

  // ── Pages dynamiques : produits boutique ────────────────────────────────────
  let pagesProduits = [];
  try {
    const { data: produits } = await supabaseAdmin
      .from('produits')
      .select('id, updated_at')
      .eq('actif', true);

    if (produits?.length) {
      pagesProduits = produits.map((p) => ({
        url: `${BASE_URL}/boutique/${p.id}`,
        lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
        changeFrequency: 'weekly',
        priority: 0.6,
      }));
    }
  } catch (err) {
    console.error('[sitemap] Erreur chargement produits:', err);
  }

  // ── Pages programmatiques : par secteur ────────────────────────────────────
  let pagesSecteurs = [];
  try {
    const { data: cats } = await supabaseAdmin.from('categories').select('nom');
    if (cats?.length) {
      pagesSecteurs = cats.map((c) => ({
        url: `${BASE_URL}/structures/secteur/${slugify(c.nom)}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
      }));
    }
  } catch (err) {
    console.error('[sitemap] Erreur chargement catégories:', err);
  }

  // ── Pages programmatiques : par pays ───────────────────────────────────────
  let pagesPays = [];
  try {
    const { data: pays } = await supabaseAdmin.from('pays').select('nom');
    if (pays?.length) {
      pagesPays = pays.map((p) => ({
        url: `${BASE_URL}/structures/pays/${slugify(p.nom)}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
      }));
    }
  } catch (err) {
    console.error('[sitemap] Erreur chargement pays:', err);
  }

  return [
    ...pagesStatiques,
    ...pagesStructures,
    ...pagesProduits,
    ...pagesSecteurs,
    ...pagesPays,
  ];
}
