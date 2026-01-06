// src/app/boutique/page.js - VERSION AVEC PANIER PERSISTANT
'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { produitsAPI, categoriesProduitsAPI, paysAPI, villesAPI } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { usePanier } from '@/hooks/usePanier';
import PanierFlottant from '@/components/PanierFlottant';
import PageTracker from '@/components/PageTracker';
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';

const PRODUITS_PAR_PAGE = 20;
const CATEGORIES_VISIBLES = 5;

export default function BoutiquePage() {
  const { ajouterAuPanier } = usePanier(); // ✅ LE HOOK
  const { userCurrency, convertPrice } = useCurrencyConverter();    // ✅ LE HOOK
  
  const [produits, setProduits] = useState([]);
  const [produitsPromo, setProduitsPromo] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pays, setPays] = useState([]);
  const [villesDisponibles, setVillesDisponibles] = useState([]);
  
  const [paysFiltre, setPaysFiltre] = useState('');
  const [villeFiltre, setVilleFiltre] = useState('');
  const [categorieFiltre, setCategorieFiltre] = useState('toutes');
  const [recherche, setRecherche] = useState('');
  const [pageActuelle, setPageActuelle] = useState(1);
  const [showModalPays, setShowModalPays] = useState(false);
  const [loading, setLoading] = useState(true);

  const categoriesScrollRef = useRef(null);

  useEffect(() => {
    chargerDonnees();
  }, []);

  useEffect(() => {
    if (paysFiltre) {
      chargerVillesDuPays(paysFiltre);
    } else {
      setVillesDisponibles([]);
      setVilleFiltre('');
    }
  }, [paysFiltre]);

  const chargerProduitsPromo = async () => {
    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('promotions')
        .select(`
          *,
          produits (
            id, nom, images, prix,
            pays:pays(devise, nom),
            ville:villes(nom)
          )
        `)
        .eq('actif', true)
        .lte('date_debut', now)
        .gte('date_fin', now)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      const validPromos = (data || []).filter(p => p.produits);
      setProduitsPromo(validPromos);
    } catch (error) {
      console.error('Erreur promos:', error);
    }
  };

  const chargerDonnees = async () => {
    try {
      setLoading(true);
      
      const [produitsData, categoriesData, paysData] = await Promise.all([
        produitsAPI.getAll(),
        categoriesProduitsAPI.getAll(),
        paysAPI.getAll(),
        chargerProduitsPromo()
      ]);

      const produitsTriés = produitsData.sort((a, b) => {
        if (Math.abs((a.vues_total || 0) - (b.vues_total || 0)) > 10) {
          return (b.vues_total || 0) - (a.vues_total || 0);
        }
        return new Date(b.created_at) - new Date(a.created_at);
      });

      setProduits(produitsTriés);
      setCategories(categoriesData);
      setPays(paysData);
    } catch (error) {
      console.error('Erreur chargement données:', error);
    } finally {
      setLoading(false);
    }
  };

  const chargerVillesDuPays = async (paysId) => {
    try {
      const villesData = await villesAPI.getByPays(paysId);
      setVillesDisponibles(villesData);
    } catch (error) {
      console.error('Erreur chargement villes:', error);
    }
  };

  const choisirPays = (paysId) => {
    setPaysFiltre(paysId);
    setShowModalPays(false);
  };

  const choisirTousLesPays = () => {
    setPaysFiltre('');
    setShowModalPays(false);
  };

  const produitsFiltres = produits.filter(p => {
    const matchPays = !paysFiltre || paysFiltre === '' || p.pays_id === paysFiltre;
    const matchVille = !villeFiltre || p.ville_id === villeFiltre;
    const matchCategorie = categorieFiltre === 'toutes' || p.categorie === categorieFiltre;
    const matchRecherche = !recherche ||
      p.nom.toLowerCase().includes(recherche.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(recherche.toLowerCase()));
    
    return matchPays && matchVille && matchCategorie && matchRecherche;
  });

  const totalPages = Math.ceil(produitsFiltres.length / PRODUITS_PAR_PAGE);
  const indexDebut = (pageActuelle - 1) * PRODUITS_PAR_PAGE;
  const indexFin = indexDebut + PRODUITS_PAR_PAGE;
  const produitsPage = produitsFiltres.slice(indexDebut, indexFin);

  useEffect(() => {
    setPageActuelle(1);
  }, [categorieFiltre, paysFiltre, villeFiltre, recherche]);

  const scrollCategories = (direction) => {
    if (categoriesScrollRef.current) {
      const scrollAmount = 200;
      categoriesScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de la boutique...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ✅ TRACKING AVEC ID PRODUIT */}
      <PageTracker pageType="boutique" />
    <div className="min-h-screen bg-gray-50">
      {/* Modal sélection pays */}
      {showModalPays && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">🛍️</div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Bienvenue à la Boutique !</h2>
              <p className="text-gray-600 text-lg">Choisissez votre pays pour voir les produits disponibles</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pays.map(p => {
                const nbProduits = produits.filter(prod => prod.pays_id === p.id).length;
                return (
                  <button
                    key={p.id}
                    onClick={() => choisirPays(p.id)}
                    className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-xl hover:border-accent hover:bg-accent/5 transition group"
                  >
                    <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center text-2xl group-hover:bg-accent/20 transition">
                      🛒
                    </div>
                    <div className="text-left flex-1">
                      <p className="font-bold text-gray-800 text-lg">{p.nom}</p>
                      <p className="text-sm text-gray-500">{nbProduits} produit{nbProduits > 1 ? 's' : ''}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              onClick={choisirTousLesPays}
              className="mt-6 w-full py-3 text-gray-600 hover:text-gray-800 font-medium border-2 border-gray-200 rounded-lg hover:border-accent transition"
            >
              Voir tous les produits (tous les pays)
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-primary via-primary-dark to-primary-light text-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-3">🛍️ Boutique en Ligne</h1>
          <p className="text-xl text-orange-100">{produits.length} produits disponibles à travers l'Afrique</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        

        {/* Barre de filtres */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">🔍 Rechercher</label>
              <div className="relative">
                <svg className="absolute left-4 top-3.5 text-gray-400" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Rechercher un produit..."
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-accent focus:outline-none"
                  value={recherche}
                  onChange={(e) => setRecherche(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">🌍 Pays</label>
              <select
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-accent focus:outline-none font-medium"
                value={paysFiltre}
                onChange={(e) => setPaysFiltre(e.target.value)}
              >
                <option value="">Tous les pays</option>
                {pays.map(p => (
                  <option key={p.id} value={p.id}>{p.nom}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">📍 Ville</label>
              <select
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-accent focus:outline-none font-medium"
                value={villeFiltre}
                onChange={(e) => setVilleFiltre(e.target.value)}
                disabled={!paysFiltre}
              >
                <option value="">Toutes les villes</option>
                {villesDisponibles.map(v => (
                  <option key={v.id} value={v.id}>{v.nom}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <button
              onClick={() => setShowModalPays(true)}
              className="flex items-center gap-2 text-accent hover:text-orange-600 font-medium transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Changer de pays
            </button>
            <p className="text-sm text-gray-600">
              <span className="font-semibold text-accent">{produitsFiltres.length}</span> produit{produitsFiltres.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Catégories (simplifié pour la longueur) */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold mb-4 text-gray-800">Catégories</h2>
          <div className="relative">
            <div
              ref={categoriesScrollRef}
              className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth px-12"
            >
              <button
                onClick={() => setCategorieFiltre('toutes')}
                className={`flex-shrink-0 px-6 py-3 rounded-full font-semibold transition ${
                  categorieFiltre === 'toutes' ? 'bg-accent text-white shadow-lg' : 'bg-gray-100 text-gray-700'
                }`}
              >
                Toutes ({produits.length})
              </button>
              
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setCategorieFiltre(cat.id)}
                  className={`flex-shrink-0 px-6 py-3 rounded-full font-semibold transition ${
                    categorieFiltre === cat.id ? 'bg-accent text-white shadow-lg' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {cat.nom}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Section Promos */}
        {produitsPromo.length > 0 && (
          <section className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl animate-pulse">🔥</span>
              <h2 className="text-3xl font-bold text-gray-800">Promotions du moment</h2>
            </div>

            <div className="relative">
              <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
                {produitsPromo.map(promo => {
                  const produit = promo.produits;
                  const pourcentageReduc = Math.round((promo.economie / promo.prix_original) * 100);
                  
                  return (
                    <div key={promo.id} className="flex-shrink-0 w-72 snap-start group">
                      <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all hover:scale-105 h-full">
                        <div className="relative h-40">
                          <img
                            src={produit.images?.[0] || '/placeholder-produit.jpg'}
                            alt={produit.nom}
                            className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                          />
                          <div className="absolute top-3 right-3 z-10">
                            <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-sm font-bold rounded-lg shadow-lg">
                              -{pourcentageReduc}%
                            </span>
                          </div>
                        </div>

                        <div className="p-5">
                          <h3 className="text-base font-bold mb-2 text-gray-800 line-clamp-2 min-h-[3rem]">
                            {produit.nom}
                          </h3>

                          <div className="mb-3">
                            <div className="flex items-baseline gap-2 mb-1">
                              <span className="text-2xl font-bold text-red-600">
                                {convertPrice(Math.round(promo.prix_promo), produit.pays?.devise).toLocaleString()} {userCurrency}
                              </span>
                              <span className="text-sm text-gray-500 line-through">
                                {Math.round(promo.prix_original).toLocaleString()}
                              </span>
                            </div>
                            <span className="inline-block px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded">
                              Économisez {Math.round(promo.economie).toLocaleString()}
                            </span>
                          </div>

                          <div className="flex gap-2">
                            <Link
                              href={`/produit/${produit.id}`}
                              className="flex-1 py-2 text-center text-primary border-2 border-primary rounded-lg hover:bg-primary hover:text-white transition font-semibold text-sm"
                            >
                              Voir
                            </Link>
                            <button
                              onClick={() => ajouterAuPanier({...produit, prix: promo.prix_promo})}
                              className="flex-1 py-2 bg-accent text-white rounded-lg hover:bg-orange-600 transition font-semibold text-sm"
                            >
                              Panier
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="text-center mt-2 text-sm text-gray-500">
                ← Faites défiler pour voir plus →
              </div>
            </div>
          </section>
        )}


        {/* Grille produits */}
        {produitsFiltres.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-xl text-gray-600">Aucun produit trouvé</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-8">
              {produitsPage.map(produit => (
                <div key={produit.id} className="card overflow-hidden hover:shadow-xl transition-all hover:scale-105">
                  <Link href={`/produit/${produit.id}`} className="block">
                    <img
                      src={produit.images?.[0] || '/placeholder-produit.jpg'}
                      alt={produit.nom}
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-4">
                      <h3 className="font-bold text-gray-800 mb-2 line-clamp-2 min-h-[3rem]">{produit.nom}</h3>
                      <p className="text-2xl font-bold text-accent mb-3">
                        {convertPrice(produit.prix, produit.pays?.devise).toLocaleString()} {userCurrency}
                      </p>
                    </div>
                  </Link>
                  <div className="px-4 pb-4">
                    <button
                      onClick={() => ajouterAuPanier(produit)}
                      className="w-full btn-accent py-2 text-sm"
                    >
                      Ajouter au panier
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination simplifiée */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2">
                <button
                  onClick={() => setPageActuelle(prev => Math.max(1, prev - 1))}
                  disabled={pageActuelle === 1}
                  className="px-4 py-2 bg-white rounded-lg disabled:opacity-50"
                >
                  ← Précédent
                </button>
                <span className="px-4 py-2 bg-white rounded-lg font-semibold">
                  {pageActuelle} / {totalPages}
                </span>
                <button
                  onClick={() => setPageActuelle(prev => Math.min(totalPages, prev + 1))}
                  disabled={pageActuelle === totalPages}
                  className="px-4 py-2 bg-white rounded-lg disabled:opacity-50"
                >
                  Suivant →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ✅ PANIER FLOTTANT GLOBAL */}
      <PanierFlottant />
    </div>
    </>
  );
}