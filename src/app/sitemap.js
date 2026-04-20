import { supabaseAdmin } from '@/lib/supabaseAdmin';

const BASE_URL = 'https://chezmonami.ma';

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
      .select('id, updated_at')
      .eq('statut', 'publie');

    if (structures?.length) {
      pagesStructures = structures.map((s) => ({
        url: `${BASE_URL}/structure/${s.id}`,
        lastModified: s.updated_at ? new Date(s.updated_at) : new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
      }));
    }
  } catch (err) {
    console.error('[sitemap] Erreur chargement structures:', err);
  }

  return [...pagesStatiques, ...pagesStructures];
}
