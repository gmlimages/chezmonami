// src/app/structures/page.js 
'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { structuresAPI, categoriesAPI, paysAPI, villesAPI } from '@/lib/api';
import StarRating from '@/components/ui/StarRating';

const STRUCTURES_PAR_PAGE = 12;
const CATEGORIES_VISIBLES = 5;

export default function StructuresPage() {
  const [structures, setStructures] = useState([]);
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

  // Référence pour le conteneur de catégories avec défilement
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
        paysAPI.getAll()
      ]);

      setStructures(structuresData);
      setCategories(categoriesData);
      setPays(paysData);

      // PAS de filtre automatique
      // L'utilisateur verra TOUTES les structures par défaut
      // Le filtre s'applique uniquement quand il sélectionne un pays

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
    localStorage.setItem('paysPreference', paysId);
    setShowModalPays(false);
  };

  // Filtrage des structures
  const structuresFiltrees = structures.filter(s => {
    const matchCategorie = categorieFiltre === 'tous' || s.categorie_id === categorieFiltre;
    const matchPays = !paysFiltre || paysFiltre === '' || s.pays_id === paysFiltre;
    const matchVille = !villeFiltre || s.ville_id === villeFiltre;
    const matchRecherche = !recherche ||
      s.nom.toLowerCase().includes(recherche.toLowerCase()) ||
      (s.description && s.description.toLowerCase().includes(recherche.toLowerCase())) ||
      (s.ville?.nom && s.ville.nom.toLowerCase().includes(recherche.toLowerCase()));
    return matchCategorie && matchPays && matchVille && matchRecherche;
  });

  // Pagination
  const totalPages = Math.ceil(structuresFiltrees.length / STRUCTURES_PAR_PAGE);
  const indexDebut = (pageActuelle - 1) * STRUCTURES_PAR_PAGE;
  const indexFin = indexDebut + STRUCTURES_PAR_PAGE;
  const structuresPage = structuresFiltrees.slice(indexDebut, indexFin);

  // Réinitialiser la page quand les filtres changent
  useEffect(() => {
    setPageActuelle(1);
  }, [categorieFiltre, paysFiltre, villeFiltre, recherche]);

  // Fonction de défilement des catégories
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
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des structures...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modal sélection pays première visite */}
      {showModalPays && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">🌍</div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">
                Bienvenue sur Chez Mon Ami !
              </h2>
              <p className="text-gray-600 text-lg">
                Choisissez votre pays pour voir les structures près de chez vous
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pays.map(p => {
                const nbStructures = structures.filter(s => s.pays_id === p.id).length;
                return (
                  <button
                    key={p.id}
                    onClick={() => choisirPays(p.id)}
                    className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-xl hover:border-primary hover:bg-primary/5 transition group"
                  >
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-2xl group-hover:bg-primary/20 transition">
                      🌍
                    </div>
                    <div className="text-left flex-1">
                      <p className="font-bold text-gray-800 text-lg">{p.nom}</p>
                      <p className="text-sm text-gray-500">
                        {nbStructures} structure{nbStructures > 1 ? 's' : ''}
                      </p>
                    </div>
                    <svg className="w-6 h-6 text-primary opacity-0 group-hover:opacity-100 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => {
                setPaysFiltre('');
                setShowModalPays(false);
              }}
              className="mt-6 w-full py-3 text-gray-600 hover:text-gray-800 font-medium"
            >
              Voir toutes les entreprises (tous les pays)
            </button>
          </div>
        </div>
      )}

      {/* Header de la page */}
      <div className="bg-gradient-to-r from-primary via-primary-dark to-primary-light text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-3">🏪 Toutes les Entreprises</h1>
          <p className="text-xl text-green-100">
            Découvrez {structures.length} entreprises à travers l'Afrique
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Barre de filtres */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Recherche */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🔍 Rechercher
              </label>
              <div className="relative">
                <svg className="absolute left-4 top-3.5 text-gray-400" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Nom, ville, description..."
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
                  value={recherche}
                  onChange={(e) => setRecherche(e.target.value)}
                />
              </div>
            </div>

            {/* Pays */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🌍 Pays
              </label>
              <select
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none font-medium"
                value={paysFiltre}
                onChange={(e) => setPaysFiltre(e.target.value)}
              >
                <option value="">Tous les pays</option>
                {pays.map(p => (
                  <option key={p.id} value={p.id}>{p.nom}</option>
                ))}
              </select>
            </div>

            {/* Ville */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📍 Ville
              </label>
              <select
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none font-medium"
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
        </div>

        {/* Catégories avec défilement horizontal */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h3 className="text-lg font-bold mb-4 text-gray-800">Filtrer par entreprise</h3>
          <div className="relative">
            {/* Bouton scroll gauche */}
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

            {/* Conteneur de catégories avec scroll */}
            <div
              ref={categoriesScrollRef}
              className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth px-12"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              <button
                onClick={() => setCategorieFiltre('tous')}
                className={`flex-shrink-0 card p-6 text-center font-semibold transition-all min-w-[140px] ${
                  categorieFiltre === 'tous' 
                    ? 'bg-primary text-white shadow-xl scale-105' 
                    : 'hover:bg-gray-50 hover:scale-105'
                }`}
              >
                <span className="text-4xl mb-2 block">📋</span>
                <span className="text-sm">Tous</span>
                <span className="block text-xs mt-1 opacity-75">
                  ({structures.length})
                </span>
              </button>
              {categories.map(cat => {
                const nbStructures = structures.filter(s => s.categorie_id === cat.id).length;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setCategorieFiltre(cat.id)}
                    className={`flex-shrink-0 card p-6 text-center font-semibold transition-all min-w-[140px] ${
                      categorieFiltre === cat.id 
                        ? `bg-primary text-white shadow-xl scale-105` 
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

            {/* Bouton scroll droite */}
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

        {/* Liste des structures */}
        {structuresFiltrees.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-xl text-gray-600 mb-2">Aucune structure trouvée</p>
            <p className="text-gray-500 mb-6">Essayez de modifier vos critères de recherche</p>
            <button
              onClick={() => {
                setCategorieFiltre('tous');
                setPaysFiltre('');
                setVilleFiltre('');
                setRecherche('');
              }}
              className="btn-primary"
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          <>
            {/* Grille de structures */}
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
                        <span className="font-medium">{structure.ville?.nom}, {structure.pays?.nom}</span>
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
              <div className="flex items-center justify-center gap-2">
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
  );
}