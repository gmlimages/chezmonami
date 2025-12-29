// src/app/page.js
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  structuresAPI, 
  produitsAPI, 
  annoncesAPI, 
  categoriesAPI,
  paysAPI,
  villesAPI,
  bannieresAPI
} from '@/lib/api';
import StarRating from '@/components/ui/StarRating';

export default function Home() {
  // États pour les données
  const [structures, setStructures] = useState([]);
  const [structuresCombinees, setStructuresCombinees] = useState([]);
  const [produitsCombines, setProduitsCombines] = useState([]);
  const [annonces, setAnnonces] = useState([]);
  const [categories, setCategories] = useState([]);
  const [statsGlobales, setStatsGlobales] = useState({
    structures: 0,
    villes: 0,
    annonces: 0,
    pays: 0
  });
  const [bannieres, setBannieres] = useState([]);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  
  // État pour l'onglet actif
  const [ongletActif, setOngletActif] = useState('structures'); // 'structures' ou 'annonces'
  
  // États pour le carrousel d'images Hero
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Images d'Afrique (Unsplash - paysages africains)
  const imagesAfrique = [
    'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=1920&q=80', // Serengeti
    'https://images.unsplash.com/photo-1489392191049-fc10c97e64b6?w=1920&q=80', // Savane
    'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=1920&q=80', // Pyramides
    'https://images.unsplash.com/photo-1523805009345-7448845a9e53?w=1920&q=80', // Safari
    'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1920&q=80', // Marrakech
    'https://industries.ma/wp-content/uploads/2024/05/Maroc-82eme-classement-mondial-tourisme.jpg', // Plage africaine
  ];
  
  // États UI
  const [loading, setLoading] = useState(true);

  // Charger les données initiales
  useEffect(() => {
    chargerDonnees();
  }, []);

  // Rotation automatique des images du Hero toutes les 5s
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => 
        (prevIndex + 1) % imagesAfrique.length
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [imagesAfrique.length]);

  // Rotation automatique des bannières toutes les 5s
  useEffect(() => {
    if (bannieres.length > 1) {
      const interval = setInterval(() => {
        setCurrentBannerIndex((prevIndex) => 
          (prevIndex + 1) % bannieres.length
        );
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [bannieres.length]);

  const chargerDonnees = async () => {
    try {
      setLoading(true);
      
      const [
        paysList,
        villesList,
        categoriesList,
        structuresData,
        structuresRecentesData,
        structuresPopulairesData,
        produitsRecentsData,
        produitsPopulairesData,
        annoncesData,
        bannieresData
      ] = await Promise.all([
        paysAPI.getAll(),
        villesAPI.getAll(),
        categoriesAPI.getAll(),
        structuresAPI.getAll(),
        structuresAPI.getRecentes(6),
        structuresAPI.getPopulaires(6),
        produitsAPI.getRecents(8),
        produitsAPI.getPopulaires(8),
        annoncesAPI.getAll(),
        bannieresAPI.getActives()
      ]);

      // Stats globales
      setStatsGlobales({
        structures: structuresData.length,
        villes: villesList.length,
        annonces: annoncesData.length,
        pays: paysList.length
      });

      setCategories(categoriesList);
      setStructures(structuresData);
      setAnnonces(annoncesData);
      setBannieres(bannieresData);

      // Combiner structures récentes et populaires sans doublons
      const structuresMap = new Map();
      [...structuresRecentesData, ...structuresPopulairesData].forEach(structure => {
        if (!structuresMap.has(structure.id)) {
          structuresMap.set(structure.id, structure);
        }
      });
      setStructuresCombinees(Array.from(structuresMap.values()).slice(0, 8));

      // Combiner produits récents et populaires sans doublons
      const produitsMap = new Map();
      [...produitsRecentsData, ...produitsPopulairesData].forEach(produit => {
        if (!produitsMap.has(produit.id)) {
          produitsMap.set(produit.id, produit);
        }
      });
      setProduitsCombines(Array.from(produitsMap.values()).slice(0, 10));

    } catch (error) {
      console.error('Erreur chargement données:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section avec images défilantes */}
      <section className="relative overflow-hidden">
        {/* Images en arrière-plan avec transition */}
        <div className="absolute inset-0">
          {imagesAfrique.map((img, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                index === currentImageIndex ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <img
                src={img}
                alt={`Paysage africain ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
          {/* Overlay avec gradient pour visibilité du texte */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/60 via-primary-dark/85 to-primary-light/60"></div>
        </div>

        {/* Contenu du Hero */}
        <div className="relative max-w-7xl mx-auto px-4 py-16 md:py-24">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-6xl font-bold mb-4 text-white">
              Bienvenue chez Mon Ami 🏪
            </h1>
            <p className="text-xl md:text-2xl text-green-100 mb-2">
              Votre plateforme de proximité en Afrique
            </p>
            <p className="text-lg text-green-200">
              Découvrez les meilleurs restaurants, salons, boutiques, services et annonces
            </p>
          </div>

          {/* Statistiques globales */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center border border-white/20 hover:bg-white/20 transition">
              <div className="text-3xl font-bold text-white">{statsGlobales.structures}</div>
              <div className="text-sm text-green-100">Structures</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center border border-white/20 hover:bg-white/20 transition">
              <div className="text-3xl font-bold text-white">{statsGlobales.villes}</div>
              <div className="text-sm text-green-100">Villes</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center border border-white/20 hover:bg-white/20 transition">
              <div className="text-3xl font-bold text-white">{statsGlobales.annonces}</div>
              <div className="text-sm text-green-100">Annonces</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center border border-white/20 hover:bg-white/20 transition">
              <div className="text-3xl font-bold text-white">{statsGlobales.pays}</div>
              <div className="text-sm text-green-100">Pays</div>
            </div>
          </div>
        </div>
      </section>

      {/* Section principale avec onglets */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        
        {/* Onglets modernes Structures / Annonces */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-2 bg-white rounded-xl p-2 shadow-md max-w-md mx-auto">
            <button
              onClick={() => setOngletActif('structures')}
              className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                ongletActif === 'structures'
                  ? 'bg-primary text-white shadow-lg scale-105'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              🏪 Structures & Produits
            </button>
            <button
              onClick={() => setOngletActif('annonces')}
              className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                ongletActif === 'annonces'
                  ? 'bg-primary text-white shadow-lg scale-105'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              📢 Annonces
            </button>
          </div>
        </div>

        {/* SECTION STRUCTURES & PRODUITS */}
        {ongletActif === 'structures' && (
          <div>
            {/* Bloc Structures combinées */}
            <section className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold text-gray-800">
                  🏪 Nos Structures
                </h2>
              </div>

              {structuresCombinees.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl shadow">
                  <div className="text-6xl mb-4">🏪</div>
                  <p className="text-xl text-gray-600 mb-2">Aucune structure disponible</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {structuresCombinees.map(structure => (
                      <StructureCard key={structure.id} structure={structure} categories={categories} />
                    ))}
                  </div>

                  {/* Bouton Voir plus */}
                  <div className="text-center mt-8">
                    <Link href="/structures" className="inline-flex items-center gap-2 bg-primary text-white px-8 py-4 rounded-lg font-semibold hover:bg-primary-dark transition shadow-lg hover:shadow-xl">
                      <span>Voir plus de structures</span>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </Link>
                  </div>
                </>
              )}
            </section>

            {/* Bloc Produits combinés */}
            <section className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold text-gray-800">
                  🛍️ Nos Produits
                </h2>
              </div>

              {produitsCombines.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl shadow">
                  <div className="text-6xl mb-4">🛍️</div>
                  <p className="text-xl text-gray-600 mb-2">Aucun produit disponible</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                    {produitsCombines.map(produit => (
                      <ProduitCard key={produit.id} produit={produit} />
                    ))}
                  </div>

                  {/* Bouton Voir plus */}
                  <div className="text-center mt-8">
                    <Link href="/boutique" className="inline-flex items-center gap-2 bg-accent text-white px-8 py-4 rounded-lg font-semibold hover:bg-accent-dark transition shadow-lg hover:shadow-xl">
                      <span>Voir plus de produits</span>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </Link>
                  </div>
                </>
              )}
            </section>

            {/* Bannières - Format fixe 1920x500px */}
            {bannieres.length > 0 && (
              <section className="mb-12">
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <div className="relative w-full" style={{ height: '250px' }}>
                    {bannieres.map((banniere, index) => (
                      <div
                        key={banniere.id}
                        className={`absolute inset-0 transition-opacity duration-1000 ${
                          index === currentBannerIndex ? 'opacity-100' : 'opacity-0'
                        }`}
                      >
                        <img 
                          src={banniere.image_url} 
                          alt={banniere.titre || 'Bannière publicitaire'} 
                          className="w-full h-full object-cover object-center cursor-pointer hover:opacity-90 transition"
                          onClick={() => banniere.lien_externe && window.open(banniere.lien_externe, '_blank')}
                        />
                      </div>
                    ))}
                  </div>
                  
                  {/* Indicateurs de pagination */}
                  {bannieres.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                      {bannieres.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentBannerIndex(index)}
                          className={`w-2 h-2 rounded-full transition ${
                            index === currentBannerIndex ? 'bg-white w-8' : 'bg-white/50'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </section>
            )}
          </div>
        )}

        {/* SECTION ANNONCES */}
        {ongletActif === 'annonces' && (
          <div>
            <section className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold text-gray-800">
                  📢 {annonces.length} Annonce{annonces.length > 1 ? 's' : ''}
                </h2>
                <Link href="/annonces" className="text-primary font-semibold hover:underline">
                  Voir toutes les annonces →
                </Link>
              </div>

              {annonces.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl shadow">
                  <div className="text-6xl mb-4">📢</div>
                  <p className="text-xl text-gray-600 mb-2">Aucune annonce disponible</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {annonces.slice(0, 10).map(annonce => (
                    <AnnonceCard key={annonce.id} annonce={annonce} />
                  ))}
                </div>
              )}
            </section>

            {/* Bannières - Format fixe 1920x500px (aussi visible dans annonces) */}
            {bannieres.length > 0 && (
              <section className="mb-12">
                <div className="bg-white rounded-xl shadow-lg overflow-hidden relative">
                  <div className="relative w-full" style={{ height: '250px' }}>
                    {bannieres.map((banniere, index) => (
                      <div
                        key={banniere.id}
                        className={`absolute inset-0 transition-opacity duration-1000 ${
                          index === currentBannerIndex ? 'opacity-100' : 'opacity-0'
                        }`}
                      >
                        <img 
                          src={banniere.image_url} 
                          alt={banniere.titre || 'Bannière publicitaire'} 
                          className="w-full h-full object-cover object-center cursor-pointer hover:opacity-90 transition"
                          onClick={() => banniere.lien_externe && window.open(banniere.lien_externe, '_blank')}
                        />
                      </div>
                    ))}
                  </div>
                  
                  {/* Indicateurs de pagination */}
                  {bannieres.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                      {bannieres.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentBannerIndex(index)}
                          className={`w-2 h-2 rounded-full transition ${
                            index === currentBannerIndex ? 'bg-white w-8' : 'bg-white/50'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Composant carte de structure
function StructureCard({ structure, categories }) {
  const categorie = categories.find(c => c.id === structure.categorie_id);
  
  return (
    <Link 
      href={`/structure/${structure.id}`}
      className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-2xl transition-all hover:scale-105 cursor-pointer"
    >
      <div className="relative">
        <img
          src={structure.images?.[0] || '/placeholder-structure.jpg'}
          alt={structure.nom}
          className="w-full h-48 object-cover"
        />
        {categorie && (
          <span className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold text-white shadow-lg bg-primary">
            {categorie.nom}
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-lg font-bold mb-2 text-gray-800 line-clamp-1">{structure.nom}</h3>
        
        <div className="flex items-center justify-between mb-3">
          <StarRating note={structure.note_moyenne || 0} taille={16} />
          <span className="text-xs text-gray-500">({structure.nombre_avis || 0})</span>
        </div>
        
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {structure.description}
        </p>
        
        <div className="pt-3 border-t border-gray-100">
          <span className="text-primary font-semibold text-sm hover:text-primary-dark transition">
            Voir détails →
          </span>
        </div>
      </div>
    </Link>
  );
}

// Composant carte de produit
function ProduitCard({ produit }) {
  return (
    <Link 
      href={`/produit/${produit.id}`}
      className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-2xl transition-all hover:scale-105 cursor-pointer"
    >
      <div className="relative">
        <img
          src={produit.images?.[0] || '/placeholder-produit.jpg'}
          alt={produit.nom}
          className="w-full h-48 object-cover"
        />
        {produit.stock && produit.stock < 5 && (
          <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold bg-red-500 text-white shadow-lg">
            Stock faible
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-sm font-bold mb-2 text-gray-800 line-clamp-2">{produit.nom}</h3>
        <p className="text-lg font-bold text-primary">
          {produit.prix} {produit.pays?.devise || 'FCFA'}
        </p>
        
        <div className="mt-3 pt-3 border-t border-gray-100">
          <span className="text-accent font-semibold text-sm hover:text-accent-dark transition">
            Voir le produit →
          </span>
        </div>
      </div>
    </Link>
  );
}

// Composant carte d'annonce
function AnnonceCard({ annonce }) {
  return (
    <Link
      href={`/annonce/${annonce.id}`}
      className="bg-white rounded-xl p-6 shadow-md hover:shadow-2xl transition-all hover:scale-[1.02] cursor-pointer"
    >
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-shrink-0">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl ${
            annonce.type === 'Emploi' ? 'bg-blue-100' :
            annonce.type === 'Formation' ? 'bg-green-100' :
            annonce.type === 'Événement' ? 'bg-purple-100' :
            'bg-orange-100'
          }`}>
            {annonce.type === 'Emploi' ? '💼' :
             annonce.type === 'Formation' ? '📚' :
             annonce.type === 'Événement' ? '🎉' : '📢'}
          </div>
        </div>

        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-1">
                {annonce.titre}
              </h3>
              <p className="text-sm font-medium text-primary">
                {annonce.organisme}
              </p>
            </div>
          </div>

          <p className="text-gray-600 mb-3 line-clamp-2">
            {annonce.description}
          </p>

          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              📍 {annonce.pays?.nom || 'Non spécifié'}
            </span>
            {annonce.ville?.nom && (
              <span className="flex items-center gap-1">
                🏙️ {annonce.ville.nom}
              </span>
            )}
            {annonce.date_publication && (
              <span className="flex items-center gap-1">
                📅 {new Date(annonce.date_publication).toLocaleDateString('fr-FR')}
              </span>
            )}
          </div>

          <div className="mt-3 flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              annonce.type === 'Emploi' ? 'bg-blue-100 text-blue-700' :
              annonce.type === 'Formation' ? 'bg-green-100 text-green-700' :
              annonce.type === 'Événement' ? 'bg-purple-100 text-purple-700' :
              'bg-orange-100 text-orange-700'
            }`}>
              {annonce.type}
            </span>
            <span className="text-accent font-semibold text-sm">
              Voir les détails →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}