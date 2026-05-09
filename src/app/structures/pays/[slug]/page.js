// Pages programmatiques SEO : /structures/pays/[slug]
// Liste publique des structures d'un pays.

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { slugify } from '@/lib/slug';
import { JsonLd, breadcrumbSchema } from '@/components/JsonLd';

const BASE_URL = 'https://chezmonami.ma';
export const revalidate = 3600;

async function chargerPays(slug) {
  const { data: pays } = await supabaseAdmin.from('pays').select('id, nom, devise');
  if (!pays) return null;
  return pays.find((p) => slugify(p.nom) === slug) || null;
}

async function chargerStructures(paysId) {
  const { data } = await supabaseAdmin
    .from('structures')
    .select(`id, nom, ville, description, image_principale,
             pays:pays_id(id, nom),
             categorie:categorie_id(id, nom, icon)`)
    .eq('pays_id', paysId)
    .eq('statut', 'publie')
    .order('created_at', { ascending: false })
    .limit(60);
  return data || [];
}

export async function generateMetadata({ params }) {
  const p = await params;
  const pays = await chargerPays(p.slug);
  if (!pays) return { title: 'Pays introuvable' };
  const titre = `Entreprises au ${pays.nom} — Annuaire B2B`;
  const desc = `Découvrez les entreprises africaines basées au ${pays.nom} sur ChezMonAmi : annuaire B2B, partenaires commerciaux, mise en relation directe.`;
  const url = `${BASE_URL}/structures/pays/${p.slug}`;
  return {
    title: titre,
    description: desc,
    alternates: { canonical: url },
    openGraph: {
      title: titre,
      description: desc,
      url,
      images: [`/api/og?titre=${encodeURIComponent('Entreprises au ' + pays.nom)}&sous=${encodeURIComponent('Annuaire B2B Afrique')}&type=structure&pays=${encodeURIComponent(pays.nom)}`],
    },
  };
}

export async function generateStaticParams() {
  const { data } = await supabaseAdmin.from('pays').select('nom').limit(30);
  return (data || []).map((p) => ({ slug: slugify(p.nom) }));
}

export default async function PagePays({ params }) {
  const p = await params;
  const pays = await chargerPays(p.slug);
  if (!pays) notFound();
  const structures = await chargerStructures(pays.id);

  return (
    <div className="min-h-screen bg-gray-50">
      <JsonLd data={breadcrumbSchema([
        { name: 'Accueil', url: '/' },
        { name: 'Structures', url: '/structures' },
        { name: pays.nom, url: `/structures/pays/${p.slug}` },
      ])} />

      <header className="bg-gradient-to-r from-accent to-primary text-white py-12">
        <div className="max-w-6xl mx-auto px-4">
          <p className="text-sm uppercase tracking-wide opacity-90">Pays</p>
          <h1 className="text-3xl md:text-4xl font-bold mt-2">
            Entreprises au {pays.nom}
          </h1>
          <p className="mt-3 text-white/90 max-w-3xl">
            Annuaire des structures référencées au {pays.nom} sur ChezMonAmi, la plateforme B2B
            panafricaine de mise en relation.
          </p>
          <p className="mt-2 text-white/80 text-sm">
            {structures.length} entreprise{structures.length > 1 ? 's' : ''} référencée
            {structures.length > 1 ? 's' : ''}
          </p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-10">
        {structures.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            Aucune entreprise référencée pour le moment au {pays.nom}.{' '}
            <Link href="/entreprise/inscription" className="text-primary font-semibold underline">
              Inscrivez la vôtre
            </Link>.
          </div>
        ) : (
          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {structures.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/structure/${s.slug || s.id}`}
                  className="block bg-white rounded-2xl shadow-sm hover:shadow-md transition border border-gray-100 overflow-hidden"
                >
                  {s.image_principale && (
                    <div
                      className="h-40 bg-gray-100 bg-cover bg-center"
                      style={{ backgroundImage: `url(${s.image_principale})` }}
                    />
                  )}
                  <div className="p-4">
                    <h2 className="font-bold text-gray-800 text-lg">{s.nom}</h2>
                    <p className="text-xs text-gray-500 mt-1">
                      {s.ville && <>{s.ville} · </>}
                      {s.categorie?.icon} {s.categorie?.nom}
                    </p>
                    {s.description && (
                      <p className="mt-2 text-sm text-gray-600 line-clamp-3">{s.description}</p>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
