// Pages programmatiques SEO : /structures/secteur/[slug]
// Liste publique des structures d'un secteur (catégorie). Server component pour
// que Google indexe le contenu directement.

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { slugify } from '@/lib/slug';
import { JsonLd, breadcrumbSchema } from '@/components/JsonLd';

const BASE_URL = 'https://chezmonami.ma';
export const revalidate = 3600; // 1h

async function chargerCategorie(slug) {
  const { data: categories } = await supabaseAdmin
    .from('categories')
    .select('id, nom, icon, color, description');
  if (!categories) return null;
  return categories.find((c) => slugify(c.nom) === slug) || null;
}

async function chargerStructures(categorieId) {
  const { data } = await supabaseAdmin
    .from('structures')
    .select(`id, nom, ville, description, image_principale,
             pays:pays_id(id, nom),
             categorie:categorie_id(id, nom)`)
    .eq('categorie_id', categorieId)
    .eq('statut', 'publie')
    .order('created_at', { ascending: false })
    .limit(60);
  return data || [];
}

export async function generateMetadata({ params }) {
  const p = await params;
  const cat = await chargerCategorie(p.slug);
  if (!cat) return { title: 'Secteur introuvable' };
  const titre = `Entreprises ${cat.nom} en Afrique`;
  const desc = `Découvrez les meilleures entreprises du secteur ${cat.nom} sur ChezMonAmi : annuaire B2B panafricain, mise en relation directe.`;
  const url = `${BASE_URL}/structures/secteur/${p.slug}`;
  return {
    title: titre,
    description: desc,
    alternates: { canonical: url },
    openGraph: {
      title: titre,
      description: desc,
      url,
      images: [`/api/og?titre=${encodeURIComponent(cat.nom)}&sous=${encodeURIComponent('Annuaire B2B Afrique')}&type=structure`],
    },
  };
}

export async function generateStaticParams() {
  // Pré-rend les principales catégories au build (les autres sont ISR).
  const { data } = await supabaseAdmin.from('categories').select('nom').limit(50);
  return (data || []).map((c) => ({ slug: slugify(c.nom) }));
}

export default async function PageSecteur({ params }) {
  const p = await params;
  const cat = await chargerCategorie(p.slug);
  if (!cat) notFound();
  const structures = await chargerStructures(cat.id);

  return (
    <div className="min-h-screen bg-gray-50">
      <JsonLd data={breadcrumbSchema([
        { name: 'Accueil', url: '/' },
        { name: 'Structures', url: '/structures' },
        { name: cat.nom, url: `/structures/secteur/${p.slug}` },
      ])} />

      <header className="bg-gradient-to-r from-primary to-accent text-white py-12">
        <div className="max-w-6xl mx-auto px-4">
          <p className="text-sm uppercase tracking-wide opacity-90">Secteur d'activité</p>
          <h1 className="text-3xl md:text-4xl font-bold mt-2">
            {cat.icon ? `${cat.icon} ` : ''}Entreprises {cat.nom} en Afrique
          </h1>
          <p className="mt-3 text-white/90 max-w-3xl">
            {cat.description ||
              `Annuaire des structures du secteur ${cat.nom} référencées sur ChezMonAmi, la plateforme B2B panafricaine.`}
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
            Aucune entreprise référencée pour le moment dans ce secteur.{' '}
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
                      {s.pays?.nom}
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

        <section className="mt-12 bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-xl font-bold mb-2">Pourquoi {cat.nom} sur ChezMonAmi&nbsp;?</h2>
          <p className="text-gray-600">
            ChezMonAmi connecte des milliers d'entreprises africaines du secteur {cat.nom} avec
            des partenaires, fournisseurs et clients dans 10 pays du continent. Trouvez en
            quelques clics une entreprise de confiance, vérifiée par notre équipe.
          </p>
        </section>
      </main>
    </div>
  );
}
