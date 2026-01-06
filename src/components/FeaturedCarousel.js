// components/FeaturedCarousel.js
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function FeaturedCarousel() {
  const [featured, setFeatured] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeatured();
  }, []);

  useEffect(() => {
    if (featured.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex(prev => (prev + 1) % featured.length);
      }, 6000); // Change toutes les 6s
      return () => clearInterval(interval);
    }
  }, [featured.length]);

  const loadFeatured = async () => {
    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('mises_en_avant')
        .select(`
          *,
          structures (
            id, nom, description, images, 
            ville:villes(nom),
            categorie:categories(nom, icon)
          )
        `)
        .eq('element_type', 'structure')
        .eq('actif', true)
        .lte('date_debut', now)
        .or(`date_fin.is.null,date_fin.gte.${now}`)
        .in('position', ['accueil', 'tous'])
        .order('ordre', { ascending: true })
        .limit(5);

      if (error) throw error;
      
      const validFeatured = (data || []).filter(f => f.structures);
      setFeatured(validFeatured);
    } catch (error) {
      console.error('Erreur chargement featured:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || featured.length === 0) return null;

  const current = featured[currentIndex];
  const structure = current.structures;

  return (
    <section className="mb-12">
      <div className="relative h-[500px] rounded-2xl overflow-hidden shadow-2xl">
        {/* Image background */}
        <div className="absolute inset-0">
          <img
            src={structure.images?.[0] || '/placeholder-structure.jpg'}
            alt={structure.nom}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
        </div>

        {/* Badge Featured */}
        <div className="absolute top-6 left-6 z-10">
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-sm font-bold rounded-full shadow-lg">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Mis en avant
          </span>
        </div>

        {/* Contenu */}
        <div className="relative h-full flex items-end p-8 md:p-12">
          <div className="text-white max-w-3xl">
            {current.titre && (
              <p className="text-sm font-bold mb-2 text-yellow-400 uppercase tracking-wide">
                {current.titre}
              </p>
            )}
            
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              {structure.nom}
            </h2>
            
            {current.sous_titre && (
              <p className="text-xl mb-4 text-gray-200">
                {current.sous_titre}
              </p>
            )}
            
            <p className="text-gray-300 mb-2 line-clamp-2 text-lg">
              {structure.description}
            </p>

            <div className="flex items-center gap-4 mb-6 text-sm text-gray-300">
              {structure.categorie && (
                <span className="flex items-center gap-1">
                  {structure.categorie.icon} {structure.categorie.nom}
                </span>
              )}
              {structure.ville && (
                <span className="flex items-center gap-1">
                  📍 {structure.ville.nom}
                </span>
              )}
            </div>
            
            <Link
              href={`/structure/${structure.id}`}
              className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-white font-bold rounded-lg hover:bg-primary-dark transition shadow-lg"
            >
              Découvrir cette entreprise
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Navigation */}
        {featured.length > 1 && (
          <>
            <button
              onClick={() => setCurrentIndex(prev => (prev - 1 + featured.length) % featured.length)}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => setCurrentIndex(prev => (prev + 1) % featured.length)}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
            
            {/* Indicateurs */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
              {featured.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`transition-all ${
                    index === currentIndex 
                      ? 'w-8 h-3 bg-white rounded-full' 
                      : 'w-3 h-3 bg-white/50 rounded-full hover:bg-white/70'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}