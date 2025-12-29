// src/components/CookieConsent.js
'use client';
import { useState, useEffect } from 'react';

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState({
    essential: true, // Toujours activé
    analytics: false,
    preferences: false
  });

  useEffect(() => {
    // Vérifier si l'utilisateur a déjà donné son consentement
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      // Attendre 1 seconde avant d'afficher le bandeau
      setTimeout(() => setShowBanner(true), 1000);
    } else {
      // Charger les préférences sauvegardées
      const savedPreferences = JSON.parse(consent);
      setPreferences(savedPreferences);
      
      // Activer Google Analytics si accepté
      if (savedPreferences.analytics) {
        enableGoogleAnalytics();
      }
    }
  }, []);

  const enableGoogleAnalytics = () => {
    // Activer Google Analytics ici
    // Exemple avec gtag.js (vous devrez ajouter le script dans le layout)
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('consent', 'update', {
        analytics_storage: 'granted'
      });
    }
  };

  const disableGoogleAnalytics = () => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('consent', 'update', {
        analytics_storage: 'denied'
      });
    }
  };

  const acceptAll = () => {
    const allPreferences = {
      essential: true,
      analytics: true,
      preferences: true
    };
    setPreferences(allPreferences);
    localStorage.setItem('cookieConsent', JSON.stringify(allPreferences));
    enableGoogleAnalytics();
    setShowBanner(false);
  };

  const rejectAll = () => {
    const minimalPreferences = {
      essential: true,
      analytics: false,
      preferences: false
    };
    setPreferences(minimalPreferences);
    localStorage.setItem('cookieConsent', JSON.stringify(minimalPreferences));
    disableGoogleAnalytics();
    setShowBanner(false);
  };

  const savePreferences = () => {
    localStorage.setItem('cookieConsent', JSON.stringify(preferences));
    if (preferences.analytics) {
      enableGoogleAnalytics();
    } else {
      disableGoogleAnalytics();
    }
    setShowBanner(false);
    setShowSettings(false);
  };

  const togglePreference = (key) => {
    if (key === 'essential') return; // Ne peut pas être désactivé
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  if (!showBanner) return null;

  return (
    <>
      {/* Overlay */}
      {showSettings && (
        <div 
          className="fixed inset-0 bg-black/50 z-[9998]"
          onClick={() => setShowSettings(false)}
        />
      )}

      {/* Bandeau principal */}
      {!showSettings && (
        <div className="fixed bottom-0 left-0 right-0 bg-white shadow-2xl border-t-4 border-primary z-[9999] animate-slide-up">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              {/* Texte */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🍪</span>
                  <h3 className="text-lg font-bold text-gray-800">
                    Nous utilisons des cookies
                  </h3>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Nous utilisons des cookies essentiels pour le fonctionnement du site et des cookies analytiques (Google Analytics) 
                  pour améliorer votre expérience. Vous pouvez accepter, refuser ou personnaliser vos choix.
                  {' '}
                  <a href="/confidentialite" className="text-primary hover:underline font-semibold">
                    En savoir plus
                  </a>
                </p>
              </div>

              {/* Boutons */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setShowSettings(true)}
                  className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                >
                  ⚙️ Personnaliser
                </button>
                <button
                  onClick={rejectAll}
                  className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                >
                  ❌ Refuser tout
                </button>
                <button
                  onClick={acceptAll}
                  className="px-6 py-2 text-sm font-semibold text-white bg-primary rounded-lg hover:bg-primary-dark transition shadow-lg"
                >
                  ✅ Accepter tout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Panneau des paramètres */}
      {showSettings && (
        <div className="fixed bottom-0 left-0 right-0 bg-white shadow-2xl border-t-4 border-primary z-[9999] max-h-[80vh] overflow-y-auto">
          <div className="max-w-4xl mx-auto px-4 py-6">
            {/* En-tête */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🍪</span>
                <h3 className="text-xl font-bold text-gray-800">
                  Paramètres des cookies
                </h3>
              </div>
              <button
                onClick={() => setShowSettings(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Description */}
            <p className="text-sm text-gray-600 mb-6">
              Nous utilisons différents types de cookies pour améliorer votre expérience sur Chez Mon Ami. 
              Vous pouvez activer ou désactiver chaque catégorie ci-dessous.
            </p>

            {/* Catégories de cookies */}
            <div className="space-y-4 mb-6">
              
              {/* Cookies essentiels */}
              <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-green-500">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-800 mb-1">
                      🔒 Cookies essentiels
                    </h4>
                    <p className="text-sm text-gray-600">
                      Nécessaires au fonctionnement du site. Ils permettent la navigation et l'utilisation des fonctionnalités de base. 
                      Ces cookies ne peuvent pas être désactivés.
                    </p>
                  </div>
                  <div className="ml-4">
                    <div className="w-12 h-6 bg-green-500 rounded-full flex items-center px-1 cursor-not-allowed opacity-60">
                      <div className="w-4 h-4 bg-white rounded-full ml-auto shadow-lg"></div>
                    </div>
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  Exemples : Session, consentement cookies, préférences de langue
                </div>
              </div>

              {/* Cookies analytiques */}
              <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-blue-500">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-800 mb-1">
                      📊 Cookies analytiques (Google Analytics)
                    </h4>
                    <p className="text-sm text-gray-600">
                      Nous aident à comprendre comment les visiteurs utilisent le site en collectant des informations anonymes 
                      (pages visitées, durée de visite, sources de trafic).
                    </p>
                  </div>
                  <div className="ml-4">
                    <button
                      onClick={() => togglePreference('analytics')}
                      className={`w-12 h-6 rounded-full flex items-center px-1 transition ${
                        preferences.analytics ? 'bg-primary' : 'bg-gray-300'
                      }`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full shadow-lg transition ${
                        preferences.analytics ? 'ml-auto' : 'mr-auto'
                      }`}></div>
                    </button>
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  Fournisseur : Google Analytics
                </div>
              </div>

              {/* Cookies de préférences */}
              <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-purple-500">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-800 mb-1">
                      ⭐ Cookies de préférences
                    </h4>
                    <p className="text-sm text-gray-600">
                      Permettent de mémoriser vos choix (langue préférée, région, préférences d'affichage) 
                      pour une expérience personnalisée.
                    </p>
                  </div>
                  <div className="ml-4">
                    <button
                      onClick={() => togglePreference('preferences')}
                      className={`w-12 h-6 rounded-full flex items-center px-1 transition ${
                        preferences.preferences ? 'bg-primary' : 'bg-gray-300'
                      }`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full shadow-lg transition ${
                        preferences.preferences ? 'ml-auto' : 'mr-auto'
                      }`}></div>
                    </button>
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  Améliore votre confort de navigation
                </div>
              </div>

            </div>

            {/* Boutons d'action */}
            <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t">
              <button
                onClick={rejectAll}
                className="px-5 py-2 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
              >
                Refuser tout
              </button>
              <button
                onClick={acceptAll}
                className="px-5 py-2 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
              >
                Accepter tout
              </button>
              <button
                onClick={savePreferences}
                className="px-6 py-2 text-sm font-semibold text-white bg-primary rounded-lg hover:bg-primary-dark transition shadow-lg"
              >
                Enregistrer mes choix
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}