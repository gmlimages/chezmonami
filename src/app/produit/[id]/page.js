// src/app/produit/[id]/page.js - VERSION COMPLÈTE AVEC PANIER
'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { produitsAPI } from '@/lib/api';
import { usePanier } from '@/hooks/usePanier'; // ✅ IMPORT HOOK
import PanierFlottant from '@/components/PanierFlottant'; // ✅ IMPORT COMPOSANT
import { supabase } from '@/lib/supabase'; // ✅ POUR ENREGISTRER COMMANDES
import PageTracker from '@/components/PageTracker';
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';

export default function ProduitDetail() {
  const params = useParams();
  const { userCurrency, convertPrice } = useCurrencyConverter();   // ✅ HOOK
  const router = useRouter();
  const { ajouterAuPanier } = usePanier(); // ✅ HOOK
  
  const [produit, setProduit] = useState(null);
  const [imageActive, setImageActive] = useState(0);
  const [quantite, setQuantite] = useState(1);
  const [selectionsVariations, setSelectionsVariations] = useState({});
  const [loading, setLoading] = useState(true);
  const [showCommande, setShowCommande] = useState(false);
  const [produitsSimilaires, setProduitsSimilaires] = useState([]);
  const [formulaireCommande, setFormulaireCommande] = useState({
    nom: '',
    telephone: '',
    email: '',
    adresseLivraison: '',
    message: ''
  });

  useEffect(() => {
    chargerProduit();
  }, [params.id]);

  const chargerProduit = async () => {
    try {
      setLoading(true);
      const produitData = await produitsAPI.getById(params.id);
      
      if (produitData) {
        setProduit(produitData);
        
        let variations = produitData.variations;
        if (typeof variations === 'string') {
          try {
            variations = JSON.parse(variations);
          } catch (e) {
            variations = [];
          }
        }
        
        if (Array.isArray(variations) && variations.length > 0) {
          const variationsNormalisees = normaliserVariations(variations);
          const selections = {};
          
          const variationsParType = {};
          variationsNormalisees.forEach(v => {
            if (!variationsParType[v.type]) {
              variationsParType[v.type] = [];
            }
            variationsParType[v.type].push(v);
          });
          
          Object.keys(variationsParType).forEach(type => {
            const premiereDisponible = variationsParType[type].find(v => v.stock > 0);
            if (premiereDisponible) {
              selections[type] = premiereDisponible;
            } else {
              selections[type] = variationsParType[type][0];
            }
          });
          
          setSelectionsVariations(selections);
        }
        
        chargerProduitsSimilaires(produitData);
      }
    } catch (error) {
      console.error('❌ Erreur chargement produit:', error);
    } finally {
      setLoading(false);
    }
  };

  const chargerProduitsSimilaires = async (produitActuel) => {
    try {
      const tousProduits = await produitsAPI.getAll();
      const similaires = tousProduits.filter(p => 
        p.id !== produitActuel.id && 
        p.categorie === produitActuel.categorie
      ).slice(0, 6);
      setProduitsSimilaires(similaires);
    } catch (error) {
      console.error('Erreur chargement produits similaires:', error);
    }
  };

  const normaliserVariations = (variations) => {
    if (!Array.isArray(variations)) return [];
    const variationsNormalisees = [];
    variations.forEach(v => {
      if (v.type && v.valeur) {
        variationsNormalisees.push(v);
      } else {
        Object.keys(v).forEach(key => {
          if (key !== 'stock' && key !== 'type' && key !== 'valeur') {
            variationsNormalisees.push({
              type: key,
              valeur: v[key],
              stock: v.stock || 0
            });
          }
        });
      }
    });
    return variationsNormalisees;
  };

  const selectionnerVariation = (type, variation) => {
    setSelectionsVariations({
      ...selectionsVariations,
      [type]: variation
    });
  };

  const getStockDisponible = () => {
    const selections = Object.values(selectionsVariations);
    if (selections.length === 0) {
      return produit.stock || 0;
    }
    const stocks = selections.map(s => s.stock || 0);
    return Math.min(...stocks, produit.stock || 999);
  };

  // ✅ AJOUTER AU PANIER
  const handleAjouterPanier = () => {
    const produitPanier = {
      ...produit,
      quantite: quantite,
      variations: selectionsVariations
    };
    ajouterAuPanier(produitPanier);
  };

  // ✅ ENREGISTRER COMMANDE DANS BDD
  const enregistrerCommande = async (methode) => {
    try {
      const produitsData = [{
        id: produit.id,
        nom: produit.nom,
        prix: produit.prix,
        quantite: quantite,
        image: produit.images?.[0] || null,
        variations: selectionsVariations
      }];

      const { data, error } = await supabase
        .from('commandes')
        .insert({
          client_nom: formulaireCommande.nom || 'Client Direct',
          client_telephone: formulaireCommande.telephone || 'Non fourni',
          client_email: formulaireCommande.email || 'Non fourni',
          client_adresse: formulaireCommande.adresseLivraison || 'Non fournie',
          client_message: formulaireCommande.message || null,
          produits: produitsData,
          montant_total: produit.prix * quantite,
          methode: methode,
          statut: 'nouvelle'
        })
        .select()
        .single();

      if (error) throw error;
      console.log('✅ Commande enregistrée:', data.numero_commande);
    } catch (error) {
      console.error('❌ Erreur enregistrement commande:', error);
    }
  };

  const commanderWhatsApp = async () => {
    const telephone = '+212673623053';
    
    let message = `🛍️ *NOUVELLE COMMANDE*\n\n`;
    message += `📦 *Produit:* ${produit.nom}\n`;
    
    Object.entries(selectionsVariations).forEach(([type, variation]) => {
      const typeAffichage = type === 'taille' ? 'Taille' : 
                            type === 'couleur' ? 'Couleur' : type;
      message += `📏 *${typeAffichage}:* ${variation.valeur}\n`;
    });
    
    message += `💰 *Prix unitaire:* ${produit.prix} ${produit.pays?.devise || 'FCFA'}\n`;
    message += `📊 *Quantité:* ${quantite}\n`;
    message += `💵 *Total:* ${produit.prix * quantite} ${produit.pays?.devise || 'FCFA'}\n\n`;
    message += `📍 Depuis: Chez Mon Ami - Boutique en ligne`;
    
    // ✅ ENREGISTRER DANS BDD
    await enregistrerCommande('whatsapp');
    
    const whatsappUrl = `https://wa.me/${telephone.replace(/[\s-]/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const envoyerCommandeEmail = async () => {
    if (!formulaireCommande.nom || !formulaireCommande.telephone || !formulaireCommande.email || !formulaireCommande.adresseLivraison) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    const sujet = `Nouvelle commande - ${formulaireCommande.nom}`;
    
    let variationsTexte = '';
    Object.entries(selectionsVariations).forEach(([type, variation]) => {
      const typeAffichage = type === 'taille' ? 'Taille' : 
                            type === 'couleur' ? 'Couleur' : type;
      variationsTexte += `${typeAffichage}: ${variation.valeur}\n`;
    });

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

PRODUIT COMMANDÉ:
-----------------
Produit: ${produit.nom}
${variationsTexte}Prix unitaire: ${produit.prix} ${produit.pays?.devise || 'FCFA'}
Quantité: ${quantite}

================================
TOTAL: ${produit.prix * quantite} ${produit.pays?.devise || 'FCFA'}
================================
`;

    if (formulaireCommande.message) {
      corpsEmail += `\n\nMESSAGE DU CLIENT:\n${formulaireCommande.message}`;
    }

    // ✅ ENREGISTRER DANS BDD
    await enregistrerCommande('email');

    const emailDestination = 'contact@chezmonami.com';
    const mailtoLink = `mailto:${emailDestination}?subject=${encodeURIComponent(sujet)}&body=${encodeURIComponent(corpsEmail)}`;
    
    window.location.href = mailtoLink;
    
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du produit...</p>
        </div>
      </div>
    );
  }

  if (!produit) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600">Produit introuvable</p>
          <Link href="/boutique" className="btn-accent mt-4">
            Retour à la boutique
          </Link>
        </div>
      </div>
    );
  }

  let variations = produit.variations;
  if (typeof variations === 'string') {
    try {
      variations = JSON.parse(variations);
    } catch (e) {
      variations = [];
    }
  }
  
  const variationsNormalisees = normaliserVariations(variations);
  const variationsParType = {};
  variationsNormalisees.forEach(v => {
    if (!variationsParType[v.type]) {
      variationsParType[v.type] = [];
    }
    variationsParType[v.type].push(v);
  });

  const stockDisponible = getStockDisponible();
  const totalCommande = produit.prix * quantite;

  return (
    <>
      {/* ✅ TRACKING AVEC ID PRODUIT */}
      {produit && (
        <PageTracker 
          pageType="produit_detail" 
          elementId={produit.id}
          elementType="produit"
        />
      )}
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center gap-2 text-sm text-gray-600">
          <Link href="/" className="hover:text-accent">Accueil</Link>
          <span>/</span>
          <Link href="/boutique" className="hover:text-accent">Boutique</Link>
          <span>/</span>
          <span className="text-gray-800 font-medium">{produit.nom}</span>
        </div>

        {/* Détail produit */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="grid md:grid-cols-2 gap-8 p-6 md:p-8">
            {/* Galerie images */}
            <div>
              <div className="aspect-square rounded-xl overflow-hidden mb-4 bg-gray-100">
                <img
                  src={produit.images?.[imageActive] || '/placeholder-produit.jpg'}
                  alt={produit.nom}
                  className="w-full h-full object-cover"
                />
              </div>
              {produit.images && produit.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto">
                  {produit.images.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setImageActive(index)}
                      className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition ${
                        imageActive === index ? 'border-accent' : 'border-gray-200'
                      }`}
                    >
                      <img src={img} alt={`${produit.nom} ${index + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Infos produit */}
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-4">{produit.nom}</h1>
              
              <div className="flex items-baseline gap-3 mb-6">
                <span className="text-4xl font-bold text-accent">
                  {convertPrice(produit.prix, produit.pays?.devise).toLocaleString()} {userCurrency}
                </span>
              </div>

              {produit.description && (
                <div className="mb-6">
                  <h3 className="font-bold text-gray-800 mb-2">📝 Description</h3>
                  <p className="text-gray-600 whitespace-pre-line">{produit.description}</p>
                </div>
              )}

              {/* Variations */}
              {Object.entries(variationsParType).map(([type, variations]) => (
                <div key={type} className="mb-6">
                  <h3 className="font-bold text-gray-800 mb-3 capitalize">
                    {type === 'taille' ? '📏 Taille' : type === 'couleur' ? '🎨 Couleur' : type}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {variations.map((variation, index) => (
                      <button
                        key={index}
                        onClick={() => selectionnerVariation(type, variation)}
                        disabled={variation.stock === 0}
                        className={`px-4 py-2 rounded-lg border-2 transition font-semibold ${
                          selectionsVariations[type]?.valeur === variation.valeur
                            ? 'border-accent bg-accent text-white'
                            : variation.stock === 0
                            ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'border-gray-300 hover:border-accent'
                        }`}
                      >
                        {variation.valeur}
                        {variation.stock === 0 && ' (Épuisé)'}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {/* Quantité */}
              <div className="mb-6">
                <h3 className="font-bold text-gray-800 mb-3">📊 Quantité</h3>
                <div className="flex items-center gap-4">
                  <div className="flex items-center border-2 border-gray-300 rounded-lg">
                    <button
                      onClick={() => setQuantite(Math.max(1, quantite - 1))}
                      className="px-4 py-2 hover:bg-gray-100 transition"
                    >
                      -
                    </button>
                    <span className="px-6 py-2 font-bold">{quantite}</span>
                    <button
                      onClick={() => setQuantite(Math.min(stockDisponible, quantite + 1))}
                      className="px-4 py-2 hover:bg-gray-100 transition"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-sm text-gray-600">
                    {stockDisponible} disponible{stockDisponible > 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              {/* Boutons d'action */}
              {stockDisponible > 0 ? (
                <div className="space-y-3">
                  {/* ✅ BOUTON AJOUTER AU PANIER */}
                  <button
                    onClick={handleAjouterPanier}
                    className="w-full flex items-center justify-center gap-3 p-4 bg-primary text-white rounded-lg hover:bg-primary-dark transition font-semibold text-lg"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Ajouter au panier
                  </button>

                  <button
                    onClick={commanderWhatsApp}
                    className="w-full flex items-center justify-center gap-3 p-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold text-lg"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    Commander via WhatsApp
                  </button>

                  <button
                    onClick={() => setShowCommande(true)}
                    className="w-full flex items-center justify-center gap-3 p-4 bg-gradient-to-r from-accent to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-accent transition font-semibold text-lg"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Commander par Email
                  </button>
                </div>
              ) : (
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <p className="text-red-600 font-semibold">Produit actuellement en rupture de stock</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Produits similaires */}
        {produitsSimilaires.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">
              📦 Produits similaires ({produitsSimilaires.length})
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {produitsSimilaires.map(p => (
                <Link
                  key={p.id}
                  href={`/produit/${p.id}`}
                  className="bg-white rounded-lg shadow-md hover:shadow-xl transition overflow-hidden group"
                >
                  <div className="aspect-square overflow-hidden">
                    <img
                      src={p.images?.[0] || '/placeholder-produit.jpg'}
                      alt={p.nom}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold text-sm line-clamp-2 mb-2 text-gray-800">
                      {p.nom}
                    </h3>
                    <p className="text-accent font-bold text-lg">
                      {convertPrice(p.prix, p.pays?.devise).toLocaleString()} {userCurrency}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {produit.structure && (
          <div className="mt-8">
            <Link
              href={`/structure/${produit.structure.id}`}
              className="btn-accent inline-flex items-center gap-2"
            >
              🏪 Voir tous les produits de {produit.structure.nom}
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        )}
      </div>

      {/* Modal Email */}
      {showCommande && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-2xl font-bold">📧 Finaliser la commande</h2>
              <button onClick={() => setShowCommande(false)} className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-bold mb-3">📦 Votre commande</h3>
                <div className="text-sm mb-2">
                  <p className="font-semibold">{produit.nom}</p>
                  {Object.entries(selectionsVariations).map(([type, variation]) => (
                    <p key={type} className="text-gray-600 capitalize">
                      {type === 'taille' ? 'Taille' : type === 'couleur' ? 'Couleur' : type}: {variation.valeur}
                    </p>
                  ))}
                  <p className="text-gray-600">Quantité: {quantite}</p>
                </div>
                <div className="border-t mt-2 pt-2 flex justify-between font-bold text-accent">
                  <span>TOTAL</span>
                  <span>{totalCommande} {produit.pays?.devise || 'FCFA'}</span>
                </div>
              </div>

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
                    placeholder="Ex: Quartier Bonanjo, Rue de la liberté"
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

                <button onClick={envoyerCommandeEmail} className="w-full btn-accent py-4 text-lg">
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

      {/* ✅ PANIER FLOTTANT GLOBAL */}
      <PanierFlottant />
    </div>
    </>
  );
}