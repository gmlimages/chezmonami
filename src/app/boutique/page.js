// src/app/boutique/page.js - VERSION AVEC PANIER PERSISTANT
'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { produitsAPI, categoriesProduitsAPI, paysAPI, villesAPI } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { usePanier } from '@/hooks/usePanier';
import PanierFlottant from '@/components/PanierFlottant';
import PageTracker from '@/components/PageTracker';
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';
import CategoriesSidebar from '@/components/CategoriesSidebar';
import BoutonFavori from '@/components/BoutonFavori';
import { useT } from '@/lib/i18n/LangProvider';

const PRODUITS_PAR_PAGE = 24;
const CATEGORIES_VISIBLES = 5;

export default function BoutiquePage() {
  const { t } = useT();
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
  const [tri, setTri] = useState('populaires');
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

      setProduits(produitsData);
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

  const produitsTriés = [...produitsFiltres].sort((a, b) => {
    if (tri === 'populaires') {
      if (Math.abs((a.vues_total || 0) - (b.vues_total || 0)) > 10) {
        return (b.vues_total || 0) - (a.vues_total || 0);
      }
    }
    return new Date(b.created_at) - new Date(a.created_at);
  });

  const totalPages = Math.ceil(produitsTriés.length / PRODUITS_PAR_PAGE);
  const indexDebut = (pageActuelle - 1) * PRODUITS_PAR_PAGE;
  const indexFin = indexDebut + PRODUITS_PAR_PAGE;
  const produitsPage = produitsTriés.slice(indexDebut, indexFin);

  useEffect(() => {
    setPageActuelle(1);
  }, [categorieFiltre, paysFiltre, villeFiltre, recherche, tri]);

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
          <p className="text-gray-600">{t('boutique.chargement')}</p>
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
              <h2 className="text-3xl font-bold text-gray-800 mb-2">{t('boutique.bienvenue_modal')}</h2>
              <p className="text-gray-600 text-lg">{t('boutique.choisissez_pays')}</p>
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
                      <p className="text-sm text-gray-500">{nbProduits} {nbProduits > 1 ? t('boutique.produit_pluriel') : t('boutique.produit_singulier')}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              onClick={choisirTousLesPays}
              className="mt-6 w-full py-3 text-gray-600 hover:text-gray-800 font-medium border-2 border-gray-200 rounded-lg hover:border-accent transition"
            >
              {t('boutique.voir_tous_pays')}
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-primary via-primary-dark to-primary-light text-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-3">{t('boutique.titre')}</h1>
          <p className="text-xl text-orange-100">{produits.length} {t('boutique.produits_dispo')}</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        

        {/* Barre de filtres */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('boutique.rechercher')}</label>
              <div className="relative">
                <svg className="absolute left-4 top-3.5 text-gray-400" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder={t('boutique.recherche_placeholder')}
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-accent focus:outline-none"
                  value={recherche}
                  onChange={(e) => setRecherche(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('boutique.pays')}</label>
              <select
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-accent focus:outline-none font-medium"
                value={paysFiltre}
                onChange={(e) => setPaysFiltre(e.target.value)}
              >
                <option value="">{t('boutique.tous_pays')}</option>
                {pays.map(p => (
                  <option key={p.id} value={p.id}>{p.nom}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('boutique.ville')}</label>
              <select
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-accent focus:outline-none font-medium"
                value={villeFiltre}
                onChange={(e) => setVilleFiltre(e.target.value)}
                disabled={!paysFiltre}
              >
                <option value="">{t('boutique.toutes_villes')}</option>
                {villesDisponibles.map(v => (
                  <option key={v.id} value={v.id}>{v.nom}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={() => setShowModalPays(true)}
              className="flex items-center gap-2 text-accent hover:text-orange-600 font-medium transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {t('boutique.changer_pays')}
            </button>
            <div className="flex items-center gap-3">
              <p className="text-sm text-gray-600">
                <span className="font-semibold text-accent">{produitsFiltres.length}</span> {produitsFiltres.length > 1 ? t('boutique.produit_pluriel') : t('boutique.produit_singulier')}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setTri('recentes')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${tri === 'recentes' ? 'bg-accent text-white shadow' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  {t('boutique.tri_recents')}
                </button>
                <button
                  onClick={() => setTri('populaires')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${tri === 'populaires' ? 'bg-accent text-white shadow' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  {t('boutique.tri_populaires')}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Catégories (simplifié pour la longueur) */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold mb-4 text-gray-800">{t('boutique.categories_titre')}</h2>
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
                {t('boutique.toutes')} ({produits.length})
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
              <h2 className="text-3xl font-bold text-gray-800">{t('boutique.promotions_moment')}</h2>
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
                          <Image
                            src={produit.images?.[0] || '/placeholder-produit.jpg'}
                            alt={produit.nom}
                            fill
                            sizes="288px"
                            className="object-cover group-hover:scale-110 transition duration-300"
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
                              {t('boutique.economisez')} {Math.round(promo.economie).toLocaleString()}
                            </span>
                          </div>

                          <div className="flex gap-2">
                            <Link
                              href={`/produit/${produit.id}`}
                              className="flex-1 py-2 text-center text-primary border-2 border-primary rounded-lg hover:bg-primary hover:text-white transition font-semibold text-sm"
                            >
                              {t('boutique.voir')}
                            </Link>
                            <button
                              onClick={() => ajouterAuPanier({...produit, prix: promo.prix_promo})}
                              className="flex-1 py-2 bg-accent text-white rounded-lg hover:bg-orange-600 transition font-semibold text-sm"
                            >
                              {t('boutique.panier')}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="text-center mt-2 text-sm text-gray-500">
                {t('boutique.faites_defiler')}
              </div>
            </div>
          </section>
        )}


        {/* Vue avec sidebar catégories (desktop) */}
        <div className="flex gap-6">
          <aside className="hidden lg:block w-60 flex-shrink-0">
            <CategoriesSidebar
              categories={categories}
              valeur={categorieFiltre}
              valeurTous="toutes"
              onChange={setCategorieFiltre}
              compteurs={categories.reduce((acc, c) => {
                acc[c.id] = produits.filter(p => p.categorie === c.id).length;
                return acc;
              }, {})}
              titre={t('boutique.categorie_label')}
            />
          </aside>

          <div className="flex-1 min-w-0">
        {/* Grille produits */}
        {produitsFiltres.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-xl text-gray-600">{t('boutique.aucun_produit')}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
              {produitsPage.map(produit => (
                <div key={produit.id} className="card overflow-hidden hover:shadow-xl transition-all hover:scale-105 relative">
                  <BoutonFavori type="produits" id={produit.id} variant="card" />
                  <Link href={`/produit/${produit.id}`} className="block">
                    <div className="relative w-full h-48">
                      <Image
                        src={produit.images?.[0] || '/placeholder-produit.jpg'}
                        alt={produit.nom}
                        fill
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
                        className="object-cover"
                      />
                    </div>
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
                      {t('boutique.ajouter_panier')}
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
                  {t('boutique.precedent')}
                </button>
                <span className="px-4 py-2 bg-white rounded-lg font-semibold">
                  {pageActuelle} / {totalPages}
                </span>
                <button
                  onClick={() => setPageActuelle(prev => Math.min(totalPages, prev + 1))}
                  disabled={pageActuelle === totalPages}
                  className="px-4 py-2 bg-white rounded-lg disabled:opacity-50"
                >
                  {t('boutique.suivant')}
                </button>
              </div>
            )}
          </>
        )}
          </div>
        </div>
      </div>

      {/* ✅ PANIER FLOTTANT GLOBAL */}
      <PanierFlottant />
    </div>
    </>
  );
}