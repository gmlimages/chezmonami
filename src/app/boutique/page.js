// src/app/boutique/page.js 
'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { produitsAPI, categoriesProduitsAPI, paysAPI, villesAPI } from '@/lib/api';

const PRODUITS_PAR_PAGE = 20;
const CATEGORIES_VISIBLES = 5;

export default function BoutiquePage() {
  // États pour les données
  const [produits, setProduits] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pays, setPays] = useState([]);
  const [villesDisponibles, setVillesDisponibles] = useState([]);
  
  // États pour les filtres
  const [paysFiltre, setPaysFiltre] = useState('');
  const [villeFiltre, setVilleFiltre] = useState('');
  const [categorieFiltre, setCategorieFiltre] = useState('toutes');
  const [recherche, setRecherche] = useState('');
  const [pageActuelle, setPageActuelle] = useState(1);
  
  // États UI
  const [showModalPays, setShowModalPays] = useState(false);
  const [panier, setPanier] = useState([]);
  const [showPanier, setShowPanier] = useState(false);
  const [showCommande, setShowCommande] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formulaireCommande, setFormulaireCommande] = useState({
    nom: '',
    telephone: '',
    email: '',
    adresseLivraison: '',
    message: ''
  });

  const categoriesScrollRef = useRef(null);

  // Charger les données
  useEffect(() => {
    chargerDonnees();
  }, []);

  // Mettre à jour les villes quand le pays change
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
      
      console.log('🛍️ Chargement des données boutique...');
      
      const [produitsData, categoriesData, paysData] = await Promise.all([
        produitsAPI.getAll(),
        categoriesProduitsAPI.getAll(), // Catégories produits
        paysAPI.getAll()
      ]);

      console.log('✅ Produits chargés:', produitsData.length, produitsData);
      console.log('✅ Catégories chargées:', categoriesData.length, categoriesData);
      console.log('✅ Pays chargés:', paysData.length, paysData);

      // Trier les produits : d'abord les plus populaires, puis les plus récents
      const produitsTriés = produitsData.sort((a, b) => {
        // Si les vues sont très différentes, trier par popularité
        if (Math.abs((a.vues_total || 0) - (b.vues_total || 0)) > 10) {
          return (b.vues_total || 0) - (a.vues_total || 0);
        }
        // Sinon, trier par date (plus récent en premier)
        return new Date(b.created_at) - new Date(a.created_at);
      });

      setProduits(produitsTriés);
      setCategories(categoriesData);
      setPays(paysData);
    } catch (error) {
      console.error('❌ Erreur chargement données:', error);
      console.error('Détails:', error.message);
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

  // Filtrage des produits
  const produitsFiltres = produits.filter(p => {
    const matchPays = !paysFiltre || paysFiltre === '' || p.pays_id === paysFiltre;
    const matchVille = !villeFiltre || p.ville_id === villeFiltre;
    const matchCategorie = categorieFiltre === 'toutes' || p.categorie === categorieFiltre;
    const matchRecherche = !recherche ||
      p.nom.toLowerCase().includes(recherche.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(recherche.toLowerCase()));
    
    return matchPays && matchVille && matchCategorie && matchRecherche;
  });

  console.log('🔍 Filtrage:', {
    totalProduits: produits.length,
    paysFiltre,
    villeFiltre,
    categorieFiltre,
    recherche,
    produitsFiltres: produitsFiltres.length
  });

  // Pagination
  const totalPages = Math.ceil(produitsFiltres.length / PRODUITS_PAR_PAGE);
  const indexDebut = (pageActuelle - 1) * PRODUITS_PAR_PAGE;
  const indexFin = indexDebut + PRODUITS_PAR_PAGE;
  const produitsPage = produitsFiltres.slice(indexDebut, indexFin);

  // Réinitialiser la page quand les filtres changent
  useEffect(() => {
    setPageActuelle(1);
  }, [categorieFiltre, paysFiltre, villeFiltre, recherche]);

  const ajouterAuPanier = (produit) => {
    setPanier([...panier, { ...produit, quantite: 1 }]);
  };

  const retirerDuPanier = (index) => {
    setPanier(panier.filter((_, i) => i !== index));
  };

  const totalPanier = panier.reduce((sum, item) => sum + item.prix * item.quantite, 0);

  const commanderWhatsApp = () => {
    if (panier.length === 0) {
      alert('Votre panier est vide');
      return;
    }

    const telephone = '+212673623053'; // Numéro WhatsApp fixe
    
    // Construire le message
    let message = `🛍️ *NOUVELLE COMMANDE*\n\n`;
    message += `📦 *Produits commandés:*\n`;
    
    panier.forEach((item, index) => {
      message += `${index + 1}. ${item.nom}\n`;
      message += `   Prix: ${item.prix} ${item.pays?.devise || 'FCFA'}\n`;
      message += `   Quantité: ${item.quantite || 1}\n\n`;
    });
    
    message += `💰 *TOTAL: ${totalPanier} FCFA*\n\n`;
    message += `📍 Depuis: Chez Mon Ami - Boutique en ligne`;
    
    const whatsappUrl = `https://wa.me/${telephone.replace(/[\s-]/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const envoyerCommandeEmail = () => {
    if (!formulaireCommande.nom || !formulaireCommande.telephone || !formulaireCommande.email || !formulaireCommande.adresseLivraison) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (panier.length === 0) {
      alert('Votre panier est vide');
      return;
    }

    // Construire l'email
    const sujet = `Nouvelle commande - ${formulaireCommande.nom}`;
    
    let corpsEmail = `
NOUVELLE COMMANDE - CHEZ MON AMI
================================

CLIENT:
-------
Nom: ${formulaireCommande.nom}
Téléphone: ${formulaireCommande.telephone}
Email: ${formulaireCommande.email}

LIVRAISON:
----------
${formulaireCommande.adresseLivraison}

PRODUITS COMMANDÉS:
-------------------
`;

    panier.forEach((item, index) => {
      corpsEmail += `\n${index + 1}. ${item.nom}`;
      corpsEmail += `\n   Prix unitaire: ${item.prix} ${item.pays?.devise || 'FCFA'}`;
      corpsEmail += `\n   Quantité: ${item.quantite || 1}`;
      corpsEmail += `\n   Sous-total: ${item.prix * (item.quantite || 1)} ${item.pays?.devise || 'FCFA'}`;
      corpsEmail += `\n`;
    });

    corpsEmail += `\n================================`;
    corpsEmail += `\nTOTAL: ${totalPanier} FCFA`;
    corpsEmail += `\n================================`;

    if (formulaireCommande.message) {
      corpsEmail += `\n\nMESSAGE DU CLIENT:\n${formulaireCommande.message}`;
    }

    // Créer le lien mailto
    const emailDestination = 'contact@chezmonami.com';
    const mailtoLink = `mailto:${emailDestination}?subject=${encodeURIComponent(sujet)}&body=${encodeURIComponent(corpsEmail)}`;
    
    window.location.href = mailtoLink;
    
    // Réinitialiser le formulaire
    setFormulaireCommande({
      nom: '',
      telephone: '',
      email: '',
      adresseLivraison: '',
      message: ''
    });
    setShowCommande(false);
    alert('✅ Votre commande a été préparée ! Veuillez valider l\'envoi dans votre application email.');
  };

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
                    <svg className="w-6 h-6 text-accent opacity-0 group-hover:opacity-100 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
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
      <div className="bg-gradient-to-r from-accent via-orange-600 to-accent text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-3">🛍️ Boutique en Ligne</h1>
          <p className="text-xl text-orange-100">{produits.length} produits disponibles à travers l'Afrique</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
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

        {/* Catégories avec défilement horizontal */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold mb-4 text-gray-800">Catégories</h2>
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
              className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth px-12"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              <button
                onClick={() => setCategorieFiltre('toutes')}
                className={`flex-shrink-0 px-6 py-3 rounded-full font-semibold transition ${
                  categorieFiltre === 'toutes' 
                    ? 'bg-accent text-white shadow-lg' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Toutes
                <span className="ml-2 text-sm opacity-75">
                  ({produits.length})
                </span>
              </button>
              
              {categories.map(cat => {
                const nbProduits = produits.filter(p => p.categorie === cat.id).length;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setCategorieFiltre(cat.id)}
                    className={`flex-shrink-0 px-6 py-3 rounded-full font-semibold transition ${
                      categorieFiltre === cat.id 
                        ? 'bg-accent text-white shadow-lg' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {cat.nom}
                    <span className="ml-2 text-sm opacity-75">
                      ({nbProduits})
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

        {/* Bouton panier flottant */}
        {panier.length > 0 && (
          <button
            onClick={() => setShowPanier(true)}
            className="fixed bottom-6 right-6 bg-accent text-white px-6 py-4 rounded-full shadow-2xl hover:bg-orange-600 transition flex items-center gap-3 z-40"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="font-bold text-lg">{panier.length}</span>
          </button>
        )}

        {/* Grille de produits */}
        {produitsFiltres.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-xl text-gray-600 mb-2">Aucun produit trouvé</p>
            <p className="text-gray-500 mb-6">Essayez de modifier vos critères</p>
            <button
              onClick={() => {
                setCategorieFiltre('toutes');
                setPaysFiltre('');
                setVilleFiltre('');
                setRecherche('');
              }}
              className="btn-accent"
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-8">
              {produitsPage.map(produit => (
                <div key={produit.id} className="card overflow-hidden hover:shadow-xl transition-all hover:scale-105">
                  <Link href={`/produit/${produit.id}`} className="block">
                    <div className="relative">
                      <img
                        src={produit.images?.[0] || '/placeholder-produit.jpg'}
                        alt={produit.nom}
                        className="w-full h-48 object-cover"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-gray-800 mb-2 line-clamp-2 min-h-[3rem]">{produit.nom}</h3>
                      <p className="text-2xl font-bold text-accent mb-3">
                        {produit.prix} {produit.pays?.devise || 'FCFA'}
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => setPageActuelle(Math.max(1, pageActuelle - 1))}
                  disabled={pageActuelle === 1}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    pageActuelle === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-accent hover:bg-accent hover:text-white shadow-md'
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
                              ? 'bg-accent text-white shadow-md'
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
                      : 'bg-white text-accent hover:bg-accent hover:text-white shadow-md'
                  }`}
                >
                  Suivant →
                </button>
              </div>
            )}

            <p className="text-center text-sm text-gray-600 mt-6">
              Affichage de {indexDebut + 1} à {Math.min(indexFin, produitsFiltres.length)} sur {produitsFiltres.length} produits
            </p>
          </>
        )}
      </div>

      {/* Modal Panier */}
      {showPanier && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-2xl font-bold">🛍️ Votre panier</h2>
              <button
                onClick={() => setShowPanier(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              {panier.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🛒</div>
                  <p className="text-xl text-gray-600">Votre panier est vide</p>
                </div>
              ) : (
                <>
                  <div className="space-y-4 mb-6">
                    {panier.map((item, index) => (
                      <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                        <img
                          src={item.images?.[0] || '/placeholder-produit.jpg'}
                          alt={item.nom}
                          className="w-20 h-20 object-cover rounded"
                        />
                        <div className="flex-1">
                          <h4 className="font-bold">{item.nom}</h4>
                          <p className="text-accent font-bold">{item.prix} {item.pays?.devise || 'FCFA'}</p>
                        </div>
                        <button
                          onClick={() => retirerDuPanier(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between text-xl font-bold mb-4">
                      <span>Total</span>
                      <span className="text-accent">{totalPanier} FCFA</span>
                    </div>
                    
                    <div className="space-y-3">
                      <button 
                        onClick={commanderWhatsApp}
                        className="w-full flex items-center justify-center gap-3 p-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition font-semibold"
                      >
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                        Commander via WhatsApp
                      </button>

                      <button 
                        onClick={() => {
                          setShowPanier(false);
                          setShowCommande(true);
                        }}
                        className="w-full flex items-center justify-center gap-3 p-4 bg-gradient-to-r from-accent to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-accent transition font-semibold"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Commander par Email
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Formulaire Commande Email */}
      {showCommande && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-2xl font-bold">📧 Finaliser la commande</h2>
              <button
                onClick={() => setShowCommande(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              {/* Résumé panier */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-bold mb-3">📦 Votre commande</h3>
                {panier.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm mb-2">
                    <span>{item.nom} x{item.quantite || 1}</span>
                    <span className="font-semibold">{item.prix * (item.quantite || 1)} FCFA</span>
                  </div>
                ))}
                <div className="border-t mt-2 pt-2 flex justify-between font-bold text-accent">
                  <span>TOTAL</span>
                  <span>{totalPanier} FCFA</span>
                </div>
              </div>

              {/* Formulaire */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nom complet *</label>
                  <input
                    type="text"
                    placeholder="Ex: Jean Dupont"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-accent focus:outline-none"
                    value={formulaireCommande.nom}
                    onChange={(e) => setFormulaireCommande({ ...formulaireCommande, nom: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone *</label>
                  <input
                    type="tel"
                    placeholder="Ex: +212 6 12 34 56 78"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-accent focus:outline-none"
                    value={formulaireCommande.telephone}
                    onChange={(e) => setFormulaireCommande({ ...formulaireCommande, telephone: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                  <input
                    type="email"
                    placeholder="Ex: jean@email.com"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-accent focus:outline-none"
                    value={formulaireCommande.email}
                    onChange={(e) => setFormulaireCommande({ ...formulaireCommande, email: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Adresse de livraison *</label>
                  <textarea
                    rows="3"
                    placeholder="Ex: Quartier Bonanjo, Rue de la liberté, Immeuble X, Appt 12"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-accent focus:outline-none"
                    value={formulaireCommande.adresseLivraison}
                    onChange={(e) => setFormulaireCommande({ ...formulaireCommande, adresseLivraison: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Message (optionnel)</label>
                  <textarea
                    rows="3"
                    placeholder="Informations supplémentaires..."
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-accent focus:outline-none"
                    value={formulaireCommande.message}
                    onChange={(e) => setFormulaireCommande({ ...formulaireCommande, message: e.target.value })}
                  />
                </div>

                <button
                  onClick={envoyerCommandeEmail}
                  className="w-full btn-accent py-4 text-lg"
                >
                  📧 Envoyer la commande par email
                </button>

                <p className="text-xs text-gray-500 text-center">
                  La commande sera envoyée à contact@chezmonami.com
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}