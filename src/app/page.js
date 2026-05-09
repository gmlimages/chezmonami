// src/app/page.js - VERSION AVEC AJOUTS SUBTILS
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
import { supabase } from '@/lib/supabase';

import PageTracker from '@/components/PageTracker';
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';
import NewsletterCompact from '@/components/NewsletterCompact';
import BanniereCarousel from '@/components/BanniereCarousel';
import BoutonFavori from '@/components/BoutonFavori';
import { useT } from '@/lib/i18n/LangProvider';


export default function Home() {
  const { t } = useT();
  const { userCurrency, convertPrice } = useCurrencyConverter();   // ✅ AJOUT
  // États pour les données
  const [structures, setStructures] = useState([]);
  const [structuresCombinees, setStructuresCombinees] = useState([]);
  const [structuresFeatured, setStructuresFeatured] = useState([]); // ✅ AJOUT
  const [produitsCombines, setProduitsCombines] = useState([]);
  const [produitsPromo, setProduitsPromo] = useState([]); // ✅ AJOUT
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
  const [ongletActif, setOngletActif] = useState('structures');
  
  // États pour le carrousel d'images Hero
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Images d'Afrique
  const imagesAfrique = [
    'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=1920&q=80',
    'https://images.unsplash.com/photo-1489392191049-fc10c97e64b6?w=1920&q=80',
    'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=1920&q=80',
    'https://images.unsplash.com/photo-1523805009345-7448845a9e53?w=1920&q=80',
    'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1920&q=80',
    'https://industries.ma/wp-content/uploads/2024/05/Maroc-82eme-classement-mondial-tourisme.jpg',
  ];
  
  // États UI
  const [loading, setLoading] = useState(true);

  // Charger les données initiales
  useEffect(() => {
    chargerDonnees();
  }, []);

  // Rotation automatique des images du Hero
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => 
        (prevIndex + 1) % imagesAfrique.length
      );
    }, 5000);
    return () => clearInterval(interval);
  }, [imagesAfrique.length]);

  // Rotation automatique des bannières
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

  // ✅ FONCTION POUR CHARGER STRUCTURES FEATURED
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
      .or('position.eq.accueil,position.eq.tous')
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

  // ✅ FONCTION POUR CHARGER PRODUITS EN PROMO
  const chargerProduitsPromo = async () => {
    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('promotions')
        .select(`
          *,
          produits (
            id, nom, images, prix,
            pays:pays(devise)
          )
        `)
        .eq('actif', true)
        .lte('date_debut', now)
        .gte('date_fin', now)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      const validPromos = (data || []).filter(p => p.produits).map(promo => ({
        ...promo.produits,
        promo: {
          prix_original: promo.prix_original,
          prix_promo: promo.prix_promo,
          economie: promo.economie,
          pourcentage: Math.round((promo.economie / promo.prix_original) * 100)
        }
      }));
      setProduitsPromo(validPromos);
    } catch (error) {
      console.error('Erreur promos:', error);
    }
  };

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
        structuresAPI.getRecentes(20),
        structuresAPI.getPopulaires(20),
        produitsAPI.getRecents(20),
        produitsAPI.getPopulaires(20),
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

      // Combiner : 9 max au total, en priorisant les plus récents puis en complétant
      // avec les plus visités (sans doublons). Si peu d'éléments, on remplit avec ce qu'on a.
      const TOTAL = 12;
      const combiner = (recents, populaires) => {
        const map = new Map();
        // 1) On insère d'abord les récents (priorité)
        recents.forEach(item => { if (!map.has(item.id)) map.set(item.id, item); });
        // 2) Puis on complète avec les populaires non déjà présents
        populaires.forEach(item => {
          if (map.size >= TOTAL) return;
          if (!map.has(item.id)) map.set(item.id, item);
        });
        return Array.from(map.values()).slice(0, TOTAL);
      };

      setStructuresCombinees(combiner(structuresRecentesData, structuresPopulairesData));
      setProduitsCombines(combiner(produitsRecentsData, produitsPopulairesData));

      // ✅ CHARGER FEATURED + PROMOS
      await Promise.all([
        chargerStructuresFeatured(),
        chargerProduitsPromo()
      ]);

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
          <p className="text-gray-600">{t('common.chargement')}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ✅ TRACKING AUTOMATIQUE */}
      <PageTracker pageType="accueil" />
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          {imagesAfrique.map((img, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                index === currentImageIndex ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <Image
                src={img}
                alt={`Paysage africain ${index + 1}`}
                fill
                priority={index === 0}
                sizes="100vw"
                className="object-cover"
              />
            </div>
          ))}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/60 via-primary-dark/85 to-primary-light/60"></div>
        </div>

        <div className="relative container mx-auto px-4 py-16 md:py-24"> {/* ✅ CHANGÉ max-w-7xl en container */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-6xl font-bold mb-4 text-white">
              {t('accueil.hero_titre')}
            </h1>
            <p className="text-xl md:text-2xl text-green-100 mb-2">
              {t('accueil.hero_marketplace')}
            </p>
            <p className="text-lg text-green-200">
              {t('accueil.hero_sous')}
            </p>
          </div>

          {/* Statistiques globales */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 max-w-4xl mx-auto">
            {/* Entreprises → /structures */}
            <Link 
              href="/structures"
              className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center border border-white/20 hover:bg-white/20 transition cursor-pointer"
            >
              <div className="text-3xl font-bold text-white">{statsGlobales.structures}</div>
              <div className="text-sm text-green-100">{t('accueil.entreprises_label')}</div>
            </Link>

            {/* Villes → /structures (avec filtre ville) */}
            <Link 
              href="/structures"
              className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center border border-white/20 hover:bg-white/20 transition cursor-pointer"
            >
              <div className="text-3xl font-bold text-white">{statsGlobales.villes}</div>
              <div className="text-sm text-green-100">{t('accueil.villes_label')}</div>
            </Link>

            {/* Annonces → /annonces */}
            <Link 
              href="/annonces"
              className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center border border-white/20 hover:bg-white/20 transition cursor-pointer"
            >
              <div className="text-3xl font-bold text-white">{statsGlobales.annonces}</div>
              <div className="text-sm text-green-100">{t('accueil.annonces_label')}</div>
            </Link>

            {/* Pays → /structures (avec filtre pays) */}
            <Link 
              href="/structures"
              className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center border border-white/20 hover:bg-white/20 transition cursor-pointer"
            >
              <div className="text-3xl font-bold text-white">{statsGlobales.pays}</div>
              <div className="text-sm text-green-100">{t('accueil.pays_label')}</div>
            </Link>
          </div>
          {/* Bouton Inscription Centré */}
          <div className="text-center my-8">
            <Link
              href="/entreprise/inscription"
              className="inline-block px-8 py-4 bg-white text-primary border-2 border-primary rounded-lg font-bold text-lg hover:bg-primary hover:text-white transition-all shadow-lg"
            >
              {t('accueil.inscrivez_btn')}
            </Link>
          </div>
        </div>
      </section>

      {/* Section principale */}
      <div className="container mx-auto px-4 py-12"> {/* ✅ CHANGÉ max-w-7xl en container */}
        
        {/* Onglets modernes */}
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
              {t('accueil.onglet_entreprises')}
            </button>
            <button
              onClick={() => setOngletActif('annonces')}
              className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                ongletActif === 'annonces'
                  ? 'bg-primary text-white shadow-lg scale-105'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {t('accueil.onglet_annonces')}
            </button>
          </div>
        </div>

        {/* SECTION STRUCTURES & PRODUITS */}
        {ongletActif === 'structures' && (
          <div>
            {/* ✅ STRUCTURES MISES EN AVANT */}
            {structuresFeatured.length > 0 && (
              <section className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-2xl">⭐</span>
                  <h2 className="text-2xl font-bold text-gray-800">{t('accueil.entreprises_a_la_une')}</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {structuresFeatured.map(structure => (
                    <StructureCard key={structure.id} structure={structure} categories={categories} featured={true} />
                  ))}
                </div>
              </section>
            )}

            {/* Bloc Structures combinées */}
            <section className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold text-gray-800">
                  {t('accueil.nos_entreprises')}
                </h2>
              </div>

              {structuresCombinees.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl shadow">
                  <div className="text-6xl mb-4">🏪</div>
                  <p className="text-xl text-gray-600 mb-2">{t('accueil.aucune_entreprise')}</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {structuresCombinees.map(structure => (
                      <StructureCard key={structure.id} structure={structure} categories={categories} />
                    ))}
                  </div>
                  <div className="text-center mt-8">
                    <Link href="/structures" className="inline-flex items-center gap-2 bg-primary text-white px-8 py-4 rounded-lg font-semibold hover:bg-primary-dark transition shadow-lg hover:shadow-xl">
                      <span>{t('accueil.voir_plus_structures')}</span>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </Link>
                  </div>
                </>
              )}
            </section>

            {/* ✅ PRODUITS EN PROMOTION */}
            {produitsPromo.length > 0 && (
              <section className="mb-12 bg-gradient-to-br from-red-50 to-orange-50 -mx-4 px-4 py-8 rounded-xl">
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-3xl animate-pulse">🔥</span>
                  <h2 className="text-2xl font-bold text-gray-800">{t('accueil.promotions_moment')}</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                  {produitsPromo.map(produit => (
                    <ProduitCard key={produit.id} produit={produit} promo={true} convertPrice={convertPrice} userCurrency={userCurrency} />
                  ))}
                </div>
              </section>
            )}

            {/* Bloc Produits combinés */}
            <section className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold text-gray-800">
                  {t('accueil.nos_produits')}
                </h2>
              </div>

              {produitsCombines.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl shadow">
                  <div className="text-6xl mb-4">🛍️</div>
                  <p className="text-xl text-gray-600 mb-2">{t('accueil.aucun_produit_dispo')}</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                    {produitsCombines.map(produit => (
                      <ProduitCard key={produit.id} produit={produit} convertPrice={convertPrice} userCurrency={userCurrency} />
                    ))}
                  </div>
                  <div className="text-center mt-8">
                    <Link href="/boutique" className="inline-flex items-center gap-2 bg-accent text-white px-8 py-4 rounded-lg font-semibold hover:bg-accent-dark transition shadow-lg hover:shadow-xl">
                      <span>{t('accueil.voir_plus_produits')}</span>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </Link>
                  </div>
                </>
              )}
            </section>

            {/* Bannières */}
            <BanniereCarousel bannieres={bannieres} />
          </div>
        )}

        {/* SECTION ANNONCES */}
        {ongletActif === 'annonces' && (
          <div>
            <section className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold text-gray-800">
                  📢 {annonces.length} {annonces.length > 1 ? t('accueil.annonces') : t('accueil.annonce')}
                </h2>
                <Link href="/annonces" className="text-primary font-semibold hover:underline">
                  {t('accueil.voir_toutes_annonces')}
                </Link>
              </div>

              {annonces.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl shadow">
                  <div className="text-6xl mb-4">📢</div>
                  <p className="text-xl text-gray-600 mb-2">{t('accueil.aucune_annonce')}</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {annonces.slice(0, 10).map(annonce => (
                    <AnnonceCard key={annonce.id} annonce={annonce} />
                  ))}
                </div>
              )}
            </section>

            {/* Bannières */}
            <BanniereCarousel bannieres={bannieres} />
          </div>
        )}

        {/* Bouton WhatsApp Flottant */}
        <a
          href="https://wa.me/212693908389?text=Bonjour%2C%20je%20souhaite%20inscrire%20mon%20entreprise%20sur%20Chez%20Mon%20Ami.%20Pouvez-vous%20m%27aider%20%3F"
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 w-16 h-16 bg-green-500 hover:bg-green-600 rounded-full shadow-2xl flex items-center justify-center text-white text-3xl z-50 hover:scale-110 transition-transform"
          title={t('accueil.whatsapp_titre')}
        >
          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
          </svg>
        </a>
      
      </div>

      {/* ✅ NEWSLETTER COMPACTE EN BAS */}
      <NewsletterCompact />
    </div>
    </>
  );
}


// Composant Structure Card (avec badge featured)
function StructureCard({ structure, categories, featured = false }) {
  const { t } = useT();
  const categorie = categories.find(c => c.id === structure.categorie_id);
  
  return (
    <Link
      href={`/structure/${structure.slug || structure.id}`}
      className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-2xl transition-all hover:scale-105 cursor-pointer relative"
    >
      <BoutonFavori type="structures" id={structure.id} variant="card" className="!top-2 !right-2" />
      {/* ✅ Badge Featured */}
      {featured && (
        <div className="absolute top-2 left-2 z-10">
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold rounded-full shadow-lg">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            {t('accueil.vedette')}
          </span>
        </div>
      )}

      <div className="relative w-full h-48">
        <Image
          src={structure.images?.[0] || '/placeholder-structure.jpg'}
          alt={structure.nom}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover"
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
          <StarRating note={structure.note_moyenne || structure.note || 0} taille={16} />
          <span className="text-xs text-gray-500">({structure.nombre_avis || 0})</span>
        </div>
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {structure.description}
        </p>
        <div className="pt-3 border-t border-gray-100">
          <span className="text-primary font-semibold text-sm hover:text-primary-dark transition">
            {t('accueil.voir_details')}
          </span>
        </div>
      </div>
    </Link>
  );
}

// Composant Produit Card (avec promo)
function ProduitCard({ produit, promo = false, convertPrice, userCurrency }) {
  const { t } = useT();
  return (
    <Link
      href={`/produit/${produit.id}`}
      className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-2xl transition-all hover:scale-105 cursor-pointer relative"
    >
      <BoutonFavori type="produits" id={produit.id} variant="card" className="!top-2 !left-2 !right-auto" />
      {promo && produit.promo && (
        <div className="absolute top-2 right-2 z-10">
          <span className="px-2 py-1 bg-red-600 text-white text-xs font-bold rounded-lg shadow-lg">
            -{produit.promo.pourcentage}%
          </span>
        </div>
      )}

      <div className="relative w-full h-48">
        <Image
          src={produit.images?.[0] || '/placeholder-produit.jpg'}
          alt={produit.nom}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          className="object-cover"
        />
        {!promo && produit.stock && produit.stock < 5 && (
          <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold bg-red-500 text-white shadow-lg">
            {t('accueil.stock_faible')}
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-sm font-bold mb-2 text-gray-800 line-clamp-2">{produit.nom}</h3>
        
        {promo && produit.promo ? (
          <div>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-lg font-bold text-red-600">
                {convertPrice(Math.round(produit.promo.prix_promo), produit.pays?.devise).toLocaleString()} {userCurrency}
              </span>
              <span className="text-xs text-gray-500 line-through">
                {convertPrice(Math.round(produit.promo.prix_original), produit.pays?.devise).toLocaleString()}
              </span>
            </div>
            <span className="inline-block px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded">
              {t('accueil.economisez')} {convertPrice(Math.round(produit.promo.economie), produit.pays?.devise).toLocaleString()}
            </span>
          </div>
        ) : (
          <p className="text-lg font-bold text-primary">
            {convertPrice(produit.prix, produit.pays?.devise).toLocaleString()} {userCurrency}
          </p>
        )}
        
        <div className="mt-3 pt-3 border-t border-gray-100">
          <span className="text-accent font-semibold text-sm hover:text-accent-dark transition">
            {t('accueil.voir_produit')}
          </span>
        </div>
      </div>
    </Link>
  );
}

// Composant Annonce Card (inchangé)
function AnnonceCard({ annonce }) {
  const { t } = useT();
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
              📍 {annonce.pays?.nom || t('accueil.non_specifie')}
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
              {t('accueil.voir_les_details')}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}