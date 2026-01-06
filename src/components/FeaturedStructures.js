// components/FeaturedStructures.js
'use client';
import { useState, useEffect } from 'react';
import FeaturedBadge from './FeaturedBadge';

export default function FeaturedStructures() {
  const [structures, setStructures] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeatured();
  }, []);

  const loadFeatured = async () => {
    try {
      const { data } = await supabase.rpc('get_featured_structures', {
        p_position: 'listing',
        p_limit: 6
      });
      setStructures(data || []);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || structures.length === 0) return null;

  return (
    <section className="py-12 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-3">
          <span className="text-4xl">⭐</span>
          Entreprises mises en avant
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {structures.map(structure => (
            <a
              key={structure.structure_id}
              href={`/structure/${structure.structure_id}`}
              className="group bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition"
            >
              <div className="relative h-48">
                <img
                  src={structure.image_url}
                  alt={structure.nom}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
                <FeaturedBadge type="structure" />
              </div>

              <div className="p-5">
                {structure.titre_featured && (
                  <p className="text-xs font-semibold text-primary mb-1">
                    {structure.titre_featured}
                  </p>
                )}
                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary transition">
                  {structure.nom}
                </h3>
                <p className="text-gray-600 text-sm line-clamp-2">
                  {structure.description}
                </p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}