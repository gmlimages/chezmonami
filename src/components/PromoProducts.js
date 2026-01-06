// components/PromoProducts.js
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function PromoProducts() {
  const [produits, setProduits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPromos();
  }, []);

  const loadPromos = async () => {
    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('promotions')
        .select(`
          *,
          produits (
            id, nom, images,
            structure:structures(nom),
            pays:pays(devise)
          )
        `)
        .eq('actif', true)
        .lte('date_debut', now)
        .gte('date_fin', now)
        .order('created_at', { ascending: false })
        .limit(8);

      if (error) throw error;
      
      const validPromos = (data || []).filter(p => p.produits);
      setProduits(validPromos);
    } catch (error) {
      console.error('Erreur chargement promos:', error);
    } finally {
      setLoading(false);
    }
  };

  const getJoursRestants = (dateFin) => {
    const maintenant = new Date();
    const fin = new Date(dateFin);
    const diff = fin - maintenant;
    const jours = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return jours;
  };

  if (loading) {
    return (
      <section className="py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-200 animate-pulse h-96 rounded-xl" />
          ))}
        </div>
      </section>
    );
  }

  if (produits.length === 0) return null;

  return (
    <section className="py-12 bg-gradient-to-br from-red-50 to-orange-50">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 flex items-center gap-3">
              <span className="text-5xl animate-pulse">🔥</span>
              Promotions du moment
            </h2>
            <p className="text-gray-600 mt-2">
              Profitez de nos meilleures offres avant qu'il ne soit trop tard !
            </p>
          </div>
          {produits.length > 8 && (
            <Link
              href="/promotions"
              className="hidden md:flex items-center gap-2 text-primary hover:text-primary-dark font-bold transition"
            >
              Voir toutes les promos
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          )}
        </div>

        {/* Grid produits */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {produits.map(promo => {
            const produit = promo.produits;
            const pourcentageReduc = Math.round((promo.economie / promo.prix_original) * 100);
            const joursRestants = getJoursRestants(promo.date_fin);

            return (
              <Link
                key={promo.id}
                href={`/produit/${produit.id}`}
                className="group bg-white rounded-xl shadow-md overflow-hidden hover:shadow-2xl transition-all hover:scale-105"
              >
                {/* Image + Badge */}
                <div className="relative aspect-square">
                  <img
                    src={produit.images?.[0] || '/placeholder-produit.jpg'}
                    alt={produit.nom}
                    className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                  />
                  
                  {/* Badge promo */}
                  <div className="absolute top-3 right-3 z-10">
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-sm font-bold rounded-lg shadow-lg">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                      </svg>
                      -{pourcentageReduc}%
                    </span>
                  </div>

                  {/* Compte à rebours */}
                  {joursRestants <= 3 && (
                    <div className="absolute top-3 left-3 z-10">
                      <span className="px-2 py-1 bg-black/70 text-white text-xs font-bold rounded backdrop-blur-sm">
                        {joursRestants}j restants
                      </span>
                    </div>
                  )}
                </div>

                {/* Contenu */}
                <div className="p-4">
                  {/* Nom produit */}
                  <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-primary transition min-h-[48px]">
                    {produit.nom}
                  </h3>

                  {/* Vendeur */}
                  {produit.structure && (
                    <p className="text-xs text-gray-500 mb-3">
                      Par {produit.structure.nom}
                    </p>
                  )}

                  {/* Prix */}
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-2xl font-bold text-red-600">
                      {Math.round(promo.prix_promo).toLocaleString()} {produit.pays?.devise || 'FCFA'}
                    </span>
                    <span className="text-sm text-gray-500 line-through">
                      {Math.round(promo.prix_original).toLocaleString()}
                    </span>
                  </div>

                  {/* Économie */}
                  <div className="mb-3">
                    <span className="inline-block px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                      Économisez {Math.round(promo.economie).toLocaleString()} {produit.pays?.devise || 'FCFA'}
                    </span>
                  </div>

                  {/* Date fin */}
                  <div className="text-xs text-gray-500 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Jusqu'au {new Date(promo.date_fin).toLocaleDateString('fr-FR', { 
                      day: 'numeric', 
                      month: 'long' 
                    })}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Bouton mobile */}
        {produits.length > 8 && (
          <div className="mt-8 text-center md:hidden">
            <Link
              href="/promotions"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary-dark transition"
            >
              Voir toutes les promos
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}