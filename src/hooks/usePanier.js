// hooks/usePanier.js - VERSION CORRIGÉE AVEC RÉACTIVITÉ
'use client';
import { useState, useEffect, useCallback } from 'react';
import { useCurrencyConverter } from './useCurrencyConverter';

const PANIER_STORAGE_KEY = 'chezmonami_panier';

// Event pour synchroniser entre composants
const PANIER_CHANGED_EVENT = 'panier-changed';

export function usePanier() {
  const { userCurrency, convertPrice } = useCurrencyConverter();
  const [panier, setPanier] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Charger le panier depuis localStorage au montage
  const chargerPanier = useCallback(() => {
    try {
      const panierSauvegarde = localStorage.getItem(PANIER_STORAGE_KEY);
      if (panierSauvegarde) {
        const panierParse = JSON.parse(panierSauvegarde);
        setPanier(panierParse);
        console.log('📦 Panier chargé:', panierParse.length, 'articles');
      } else {
        setPanier([]);
      }
    } catch (error) {
      console.error('❌ Erreur chargement panier:', error);
      setPanier([]);
    }
  }, []);

  useEffect(() => {
    chargerPanier();
    setIsLoaded(true);
  }, [chargerPanier]);

  // Écouter les changements du panier depuis d'autres composants
  useEffect(() => {
    const handlePanierChanged = () => {
      console.log('🔄 Panier changé - rechargement...');
      chargerPanier();
    };

    window.addEventListener(PANIER_CHANGED_EVENT, handlePanierChanged);
    
    // Écouter aussi les changements de storage (pour sync entre onglets)
    window.addEventListener('storage', (e) => {
      if (e.key === PANIER_STORAGE_KEY) {
        chargerPanier();
      }
    });

    return () => {
      window.removeEventListener(PANIER_CHANGED_EVENT, handlePanierChanged);
    };
  }, [chargerPanier]);

  // Sauvegarder dans localStorage et notifier les autres composants
  const sauvegarderPanier = useCallback((nouveauPanier) => {
    try {
      localStorage.setItem(PANIER_STORAGE_KEY, JSON.stringify(nouveauPanier));
      setPanier(nouveauPanier);
      
      // Notifier tous les composants du changement
      window.dispatchEvent(new Event(PANIER_CHANGED_EVENT));
      
      console.log('💾 Panier sauvegardé:', nouveauPanier.length, 'articles');
    } catch (error) {
      console.error('❌ Erreur sauvegarde panier:', error);
    }
  }, []);

  const ajouterAuPanier = useCallback((produit) => {
    const panierActuel = JSON.parse(localStorage.getItem(PANIER_STORAGE_KEY) || '[]');
    
    // Vérifier si le produit existe déjà
    const index = panierActuel.findIndex(item => item.id === produit.id);
    
    let nouveauPanier;
    if (index !== -1) {
      // Produit existe, augmenter quantité
      nouveauPanier = [...panierActuel];
      nouveauPanier[index] = {
        ...nouveauPanier[index],
        quantite: (nouveauPanier[index].quantite || 1) + (produit.quantite || 1)
      };
    } else {
      // Nouveau produit
      nouveauPanier = [...panierActuel, { ...produit, quantite: produit.quantite || 1 }];
    }
    
    sauvegarderPanier(nouveauPanier);
    
    // Déclencher notification
    window.dispatchEvent(new CustomEvent('produit-ajoute-panier', {
      detail: { produit: produit.nom }
    }));
    
    console.log('✅ Produit ajouté:', produit.nom);
  }, [sauvegarderPanier]);

  const retirerDuPanier = useCallback((index) => {
    const panierActuel = JSON.parse(localStorage.getItem(PANIER_STORAGE_KEY) || '[]');
    const nouveauPanier = panierActuel.filter((_, i) => i !== index);
    sauvegarderPanier(nouveauPanier);
    console.log('🗑️ Produit retiré, index:', index);
  }, [sauvegarderPanier]);

  const modifierQuantite = useCallback((index, nouvelleQuantite) => {
    if (nouvelleQuantite <= 0) {
      retirerDuPanier(index);
      return;
    }

    const panierActuel = JSON.parse(localStorage.getItem(PANIER_STORAGE_KEY) || '[]');
    const nouveauPanier = [...panierActuel];
    
    if (nouveauPanier[index]) {
      nouveauPanier[index] = {
        ...nouveauPanier[index],
        quantite: nouvelleQuantite
      };
      sauvegarderPanier(nouveauPanier);
      console.log('🔄 Quantité modifiée, index:', index, 'nouvelle quantité:', nouvelleQuantite);
    }
  }, [retirerDuPanier, sauvegarderPanier]);

  const viderPanier = useCallback(() => {
    sauvegarderPanier([]);
    console.log('🗑️ Panier vidé');
  }, [sauvegarderPanier]);

  const totalPanier = panier.reduce((sum, item) => {
    const prixConverti = convertPrice(item.prix, item.pays?.devise || 'XOF');
    return sum + (prixConverti * (item.quantite || 1));
  }, 0);

  const nombreArticles = panier.reduce(
    (sum, item) => sum + (item.quantite || 1), 
    0
  );

  return {
    panier,
    isLoaded,
    ajouterAuPanier,
    retirerDuPanier,
    modifierQuantite,
    viderPanier,
    totalPanier: totalPanier.toFixed(2), // ← Format 2 décimales
    nombreArticles,
    userCurrency, // ← Export aussi la devise
    convertPrice  // ← Export pour usage externe
  };
}