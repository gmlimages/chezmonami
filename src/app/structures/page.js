// src/app/structures/page.js - VERSION FINALE
'use client';
import { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { structuresAPI, categoriesAPI, paysAPI, villesAPI } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import StarRating from '@/components/ui/StarRating';

import PageTracker from '@/components/PageTracker';

const STRUCTURES_PAR_PAGE = 12;
const CATEGORIES_VISIBLES = 5;

function StructuresContent() {
  const searchParams = useSearchParams();
  const [structures, setStructures] = useState([]);
  const [structuresFeatured, setStructuresFeatured] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pays, setPays] = useState([]);
  const [villes, setVilles] = useState([]);
  
  const [categorieFiltre, setCategorieFiltre] = useState('tous');
  const [paysFiltre, setPaysFiltre] = useState('');
  const [villeFiltre, setVilleFiltre] = useState('');
  const [recherche, setRecherche] = useState('');
  const [pageActuelle, setPageActuelle] = useState(1);
  const [showModalPays, setShowModalPays] = useState(false);
  const [villesDisponibles, setVillesDisponibles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [groupeActif, setGroupeActif] = useState(null);

  const categoriesScrollRef = useRef(null);

  const groupesCategories = {
    'production': {
      titre: "Production & Industries",
      icon: "🏭",
      categories: ['producteurs', 'usines', 'laboratoires', 'agriculture', 'mines', 'artisanat', 'bois', 'textile', 'conserves', 'miel', 'terroir']
    },
    'commerce': {
      titre: "Commerce & Distribution",
      icon: "🛒",
      categories: ['importateurs', 'exportateurs', 'distribution', 'grossistes', 'commercants', 'franchises', 'commercial', 'apporteurs']
    },
    'batiment': {
      titre: "Bâtiment & Environnement",
      icon: "🏗️",
      categories: ['gros_oeuvre', 'batiment', 'immobilier', 'energies_renouvelables', 'eau', 'jardinage']
    },
    'services': {
      titre: "Services aux Entreprises",
      icon: "💼",
      categories: ['prestataires', 'comptable', 'conseil', 'archivage', 'digitalisation', 'conciergerie', 'securite', 'transporteurs', 'main_oeuvre']
    },
    'sante': {
      titre: "Santé & Éducation",
      icon: "🎓",
      categories: ['clinique', 'paramedical', 'laboratoire_medical', 'ecole', 'lycee', 'formation']
    },
    'finance': {
      titre: "Finance & Tourisme",
      icon: "🏦",
      categories: ['banques', 'assurances', 'location_voiture', 'hotel', 'restaurant']
    }
  };

  useEffect(() => {
    chargerDonnees();
  }, []);

  useEffect(() => {
    const groupe = searchParams.get('groupe');
    if (groupe) {
      const categoriesGroupe = groupe.split(',');
      setGroupeActif(categoriesGroupe);
    }
  }, [searchParams]);

  useEffect(() => {
    if (paysFiltre) {
      chargerVillesDuPays(paysFiltre);
    } else {
      setVillesDisponibles([]);
      setVilleFiltre('');
    }
  }, [paysFiltre]);

  const chargerStructuresFeatured = async () => {
  try {
    const now = new Date().toISOString();
    
    // Charger mises en avant SANS relation
    const { data: misesData, error: misesError } = await supabase
      .from('mises_en_avant')
      .select('*')
      .eq('element_type', 'structure')
      .eq('actif', true)
      .lte('date_debut', now)
      .or(`date_fin.is.null,date_fin.gte.${now}`)
      .or('position.eq.listing,position.eq.tous')
      .order('ordre', { ascending: true })
      .limit(6);

    if (misesError) throw misesError;

    // Charger toutes les structures séparément
    const structures = await structuresAPI.getAll();

    // Enrichir avec les structures
    const validFeatured = (misesData || [])
      .map(mise => {
        const structure = structures.find(s => s.id === mise.element_id);
        return structure ? {
          ...structure,
          featured: true,
          featured_ordre: mise.ordre,
          featured_titre: mise.titre
        } : null;
      })
      .filter(Boolean);

    setStructuresFeatured(validFeatured);
  } catch (error) {
    console.error('❌ Erreur featured:', error);
    setStructuresFeatured([]);
  }
};

  const chargerDonnees = async () => {
    try {
      setLoading(true);
      
      const [
        structuresData,
        categoriesData,
        paysData
      ] = await Promise.all([
        structuresAPI.getAll(),
        categoriesAPI.getAll(),
        paysAPI.getAll(),
        chargerStructuresFeatured()
      ]);

      setStructures(structuresData);
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
    if (typeof window !== 'undefined') {
      localStorage.setItem('paysPreference', paysId);
    }
    setShowModalPays(false);
  };

  const structuresFiltrees = structures.filter(s => {
    const matchCategorie = categorieFiltre === 'tous' || s.categorie_id === categorieFiltre;
    const matchGroupe = !groupeActif || groupeActif.includes(s.categorie_id);
    const matchPays = !paysFiltre || paysFiltre === '' || s.pays_id === paysFiltre;
    const matchVille = !villeFiltre || s.ville_id === villeFiltre;
    const matchRecherche = !recherche ||
      s.nom.toLowerCase().includes(recherche.toLowerCase()) ||
      (s.description && s.description.toLowerCase().includes(recherche.toLowerCase())) ||
      (s.ville?.nom && s.ville.nom.toLowerCase().includes(recherche.toLowerCase()));
    return matchCategorie && matchGroupe && matchPays && matchVille && matchRecherche;
  });

  const totalPages = Math.ceil(structuresFiltrees.length / STRUCTURES_PAR_PAGE);
  const indexDebut = (pageActuelle - 1) * STRUCTURES_PAR_PAGE;
  const indexFin = indexDebut + STRUCTURES_PAR_PAGE;
  const structuresPage = structuresFiltrees.slice(indexDebut, indexFin);

  useEffect(() => {
    setPageActuelle(1);
  }, [categorieFiltre, paysFiltre, villeFiltre, recherche, groupeActif]);

  const scrollCategories = (direction) => {
    if (categoriesScrollRef.current) {
      const scrollAmount = 200;
      categoriesScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const reinitialiserFiltres = () => {
    setCategorieFiltre('tous');
    setPaysFiltre('');
    setVilleFiltre('');
    setRecherche('');
    setGroupeActif(null);
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/structures');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des entreprises...</p>
        </div>
      </div>
    );
  }

  const groupeInfo = groupeActif ? Object.values(groupesCategories).find(g => 
    g.categories.some(cat => groupeActif.includes(cat))
  ) : null;

  return (
    <>
      {/* ✅ TRACKING AUTOMATIQUE */}
      <PageTracker pageType="listing_structures" />
    <div className="min-h-screen bg-gray-50">
      {/* Modal choix pays */}
      {showModalPays && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">🌍</div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">
                Bienvenue sur Chez Mon Ami !
              </h2>
              <p className="text-gray-600 text-lg">
                Choisissez votre pays pour voir les entreprises près de chez vous
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {pays.map(p => {
                const nbStructures = structures.filter(s => s.pays_id === p.id).length;
                return (
                  <button
                    key={p.id}
                    onClick={() => choisirPays(p.id)}
                    className="flex items-center gap-4 p-4 rounded-xl border-2 border-gray-200 hover:border-primary hover:bg-primary/5 transition-all"
                  >
                    <span className="text-4xl">{p.drapeau || '🏳️'}</span>
                    <div className="text-left flex-1">
                      <p className="font-bold text-gray-800">{p.nom}</p>
                      <p className="text-sm text-gray-500">{nbStructures} structure{nbStructures > 1 ? 's' : ''}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setShowModalPays(false)}
              className="w-full py-3 text-gray-600 hover:text-gray-800 font-medium"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* Header avec couleur */}
      <div className="bg-gradient-to-r from-primary via-primary-dark to-primary-light text-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-3">
            {groupeInfo ? `${groupeInfo.icon} ${groupeInfo.titre}` : '🏪 Nos Entreprises'}
          </h1>
          <p className="text-xl text-green-100">
            {structuresFiltrees.length} structure{structuresFiltrees.length > 1 ? 's' : ''} disponible{structuresFiltrees.length > 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
          {/* Barre de recherche et filtres */}
        <div className="card p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Rechercher une entreprise..."
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                className="input-field pl-10"
              />
              <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            <select
              value={paysFiltre}
              onChange={(e) => setPaysFiltre(e.target.value)}
              className="input-field"
            >
              <option value="">Tous les pays</option>
              {pays.map(p => (
                <option key={p.id} value={p.id}>
                  {p.drapeau} {p.nom}
                </option>
              ))}
            </select>

            <select
              value={villeFiltre}
              onChange={(e) => setVilleFiltre(e.target.value)}
              className="input-field"
              disabled={!paysFiltre}
            >
              <option value="">Toutes les villes</option>
              {villesDisponibles.map(v => (
                <option key={v.id} value={v.id}>
                  {v.nom}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <button
              onClick={() => setShowModalPays(true)}
              className="flex items-center gap-2 text-primary hover:text-primary-dark font-medium transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Changer de pays
            </button>
            {(categorieFiltre !== 'tous' || paysFiltre || villeFiltre || recherche || groupeActif) && (
              <button
                onClick={reinitialiserFiltres}
                className="btn-secondary text-sm"
              >
                Réinitialiser les filtres
              </button>
            )}
          </div>
        </div>

        {/* Carrousel de catégories */}
        <div className="mb-8">
          <div className="relative">
            {categories.length > CATEGORIES_VISIBLES && (
              <button
                onClick={() => scrollCategories('left')}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white shadow-lg rounded-full flex items-center justify-center hover:bg-gray-50 transition"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}

            <div
              ref={categoriesScrollRef}
              className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide px-12"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              <button
                onClick={() => {
                  setCategorieFiltre('tous');
                  setGroupeActif(null);
                }}
                className={`flex-shrink-0 card p-6 text-center font-semibold transition-all min-w-[140px] ${
                  categorieFiltre === 'tous' && !groupeActif
                    ? 'bg-primary text-white shadow-xl scale-105'
                    : 'hover:bg-gray-50 hover:scale-105'
                }`}
              >
                <span className="text-4xl mb-2 block">🏪</span>
                <span className="text-sm">Tous</span>
                <span className="block text-xs mt-1 opacity-75">
                  ({structures.length})
                </span>
              </button>
              {categories.map(cat => {
                const nbStructures = structures.filter(s => s.categorie_id === cat.id).length;
                const estDansGroupe = groupeActif && groupeActif.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setCategorieFiltre(cat.id);
                      setGroupeActif(null);
                    }}
                    className={`flex-shrink-0 card p-6 text-center font-semibold transition-all min-w-[140px] ${
                      categorieFiltre === cat.id 
                        ? `bg-primary text-white shadow-xl scale-105` 
                        : estDansGroupe
                        ? 'bg-primary/20 border-2 border-primary hover:scale-105'
                        : 'hover:bg-gray-50 hover:scale-105'
                    }`}
                  >
                    <span className="text-4xl mb-2 block">{cat.icon}</span>
                    <span className="text-sm">{cat.nom}</span>
                    <span className="block text-xs mt-1 opacity-75">
                      ({nbStructures})
                    </span>
                  </button>
                );
              })}
            </div>

            {categories.length > CATEGORIES_VISIBLES && (
              <button
                onClick={() => scrollCategories('right')}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white shadow-lg rounded-full flex items-center justify-center hover:bg-gray-50 transition"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Structures mises en avant */}
        {structuresFeatured.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl">⭐</span>
              <h2 className="text-3xl font-bold text-gray-800">Entreprises à la une</h2>
            </div>

            <div className="relative">
              <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
                {structuresFeatured.map(structure => (
                  <Link
                    key={structure.id}
                    href={`/structure/${structure.id}`}
                    className="flex-shrink-0 w-60 snap-start group"
                  >
                    <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all hover:scale-105 h-full">
                      <div className="relative h-40">
                        <img
                          src={structure.images?.[0] || '/placeholder-structure.jpg'}
                          alt={structure.nom}
                          className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                        />
                        
                        {/* Badge Vedette */}
                        <div className="absolute top-3 left-3 z-10">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold rounded-full shadow-lg">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            Vedette
                          </span>
                        </div>

                        {/* Badge Catégorie */}
                        {structure.categorie && (
                          <span className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold text-white shadow-lg bg-primary">
                            {structure.categorie.icon} {structure.categorie.nom}
                          </span>
                        )}
                      </div>

                      <div className="p-5">
                        {/* Titre personnalisé si présent */}
                        {structure.featured_titre && (
                          <p className="text-xs font-bold text-primary uppercase mb-1">
                            {structure.featured_titre}
                          </p>
                        )}
                        
                        <h3 className="text-lg font-bold mb-2 text-gray-800 group-hover:text-primary transition">
                          {structure.nom}
                        </h3>

                        <div className="flex items-center justify-between mb-3">
                          <StarRating note={structure.note || 0} taille={16} />
                          <span className="text-xs text-gray-500">({structure.nombre_avis || 0})</span>
                        </div>

                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {structure.description}
                        </p>

                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                          <span>📍</span>
                          <span>{structure.ville?.nom}, {structure.pays?.nom}</span>
                        </div>

                        <div className="pt-3 border-t border-gray-100">
                          <span className="text-primary font-semibold text-sm group-hover:underline">
                            Voir les détails →
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              <div className="text-center mt-2 text-sm text-gray-500">
                ← Faites défiler pour voir plus →
              </div>
            </div>
          </section>
        )}

        {/* Liste des structures */}
        {structuresFiltrees.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-xl text-gray-600 mb-2">Aucune entreprise trouvée</p>
            <p className="text-gray-500 mb-6">Essayez de modifier vos critères de recherche</p>
            <button
              onClick={reinitialiserFiltres}
              className="btn-primary"
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {structuresPage.map(structure => {
                const categorie = categories.find(c => c.id === structure.categorie_id);
                return (
                  <Link 
                    key={structure.id} 
                    href={`/structure/${structure.id}`}
                    className="card overflow-hidden hover:shadow-2xl transition-all hover:scale-105 cursor-pointer"
                  >
                    <div className="relative">
                      <img
                        src={structure.images?.[0] || '/placeholder-structure.jpg'}
                        alt={structure.nom}
                        className="w-full h-40 object-cover"
                      />
                      {categorie && (
                        <span className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold text-white shadow-lg bg-primary">
                          {categorie.nom}
                        </span>
                      )}
                    </div>
                    <div className="p-5">
                      <h3 className="text-sm font-bold mb-2 text-gray-800">{structure.nom}</h3>
                      
                      <div className="flex items-center justify-between mb-3">
                        <StarRating note={structure.note || 0} taille={18} />
                        <span className="text-sm text-gray-500">({structure.nombre_avis || 0})</span>
                      </div>
                      
                      <p className="text-gray-600 flex items-center gap-2 mb-3">
                        <span>📍</span>
                        <span className="font-medium text-xs">{structure.ville?.nom}, {structure.pays?.nom}</span>
                      </p>
                      
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {structure.description}
                      </p>
                      
                      <div className="flex items-center justify-between pt-3 border-t">
                        <span className="text-sm text-gray-500">{structure.horaires || 'Voir horaires'}</span>
                        <span className="text-primary font-semibold text-sm">Voir détails →</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => setPageActuelle(Math.max(1, pageActuelle - 1))}
                  disabled={pageActuelle === 1}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    pageActuelle === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-primary hover:bg-primary hover:text-white shadow-md'
                  }`}
                >
                  ← Précédent
                </button>

                <div className="hidden md:flex items-center gap-2">
                  {[...Array(totalPages)].map((_, index) => {
                    const numPage = index + 1;
                    if (
                      numPage === 1 ||
                      numPage === totalPages ||
                      (numPage >= pageActuelle - 1 && numPage <= pageActuelle + 1)
                    ) {
                      return (
                        <button
                          key={numPage}
                          onClick={() => setPageActuelle(numPage)}
                          className={`w-10 h-10 rounded-lg font-semibold transition ${
                            pageActuelle === numPage
                              ? 'bg-primary text-white shadow-md'
                              : 'bg-white text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {numPage}
                        </button>
                      );
                    } else if (
                      numPage === pageActuelle - 2 ||
                      numPage === pageActuelle + 2
                    ) {
                      return <span key={numPage} className="px-2 text-gray-400">...</span>;
                    }
                    return null;
                  })}
                </div>

                <div className="md:hidden bg-white px-4 py-2 rounded-lg shadow-md">
                  <span className="font-semibold text-gray-700">
                    Page {pageActuelle} / {totalPages}
                  </span>
                </div>

                <button
                  onClick={() => setPageActuelle(Math.min(totalPages, pageActuelle + 1))}
                  disabled={pageActuelle === totalPages}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    pageActuelle === totalPages
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-primary hover:bg-primary hover:text-white shadow-md'
                  }`}
                >
                  Suivant →
                </button>
              </div>
            )}

            <p className="text-center text-sm text-gray-600 mt-6">
              Affichage de {indexDebut + 1} à {Math.min(indexFin, structuresFiltrees.length)} sur {structuresFiltrees.length} structures
            </p>
          </>
        )}
      </div>
    </div>
    </>
  );
}

export default function StructuresPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des structures...</p>
        </div>
      </div>
    }>
      <StructuresContent />
    </Suspense>
  );
}