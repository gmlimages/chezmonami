// src/hooks/useCurrencyConverter.js - VERSION FINALE
import { useState, useEffect } from 'react';

export function useCurrencyConverter() {
  const [userCurrency, setUserCurrency] = useState('MAD');
  const [rates, setRates] = useState({});

  useEffect(() => {
    const detectCurrency = async () => {
      // Vérifier cache (24h)
      const cachedCurrency = localStorage.getItem('user_currency');
      const cacheTime = localStorage.getItem('currency_cache_time');
      
      if (cachedCurrency && cacheTime && Date.now() - parseInt(cacheTime) < 86400000) {
        setUserCurrency(cachedCurrency);
        return;
      }

      try {
        let detectedCurrency = 'MAD';

        // MÉTHODE 1: Cloudflare (prioritaire)
        try {
          const cfResponse = await fetch('https://www.cloudflare.com/cdn-cgi/trace');
          const cfText = await cfResponse.text();
          const countryCode = cfText.match(/loc=([A-Z]{2})/)?.[1];
          
          if (countryCode) {
            detectedCurrency = getAfricanCurrency(countryCode);
          }
        } catch (cfError) {
          // MÉTHODE 2: IP-API (backup)
          const ipResponse = await fetch('http://ip-api.com/json/');
          const ipData = await ipResponse.json();
          
          if (ipData.countryCode) {
            detectedCurrency = getAfricanCurrency(ipData.countryCode);
          }
        }

        // Sauvegarder dans cache
        localStorage.setItem('user_currency', detectedCurrency);
        localStorage.setItem('currency_cache_time', Date.now().toString());
        setUserCurrency(detectedCurrency);

      } catch (error) {
        console.error('Erreur détection devise:', error);
        setUserCurrency('MAD');
      }
    };

    const fetchRates = async () => {
      try {
        const response = await fetch('https://open.er-api.com/v6/latest/XOF');
        const data = await response.json();
        
        if (data.result === 'success') {
          setRates(data.rates);
        }
      } catch (error) {
        console.error('Erreur taux:', error);
      }
    };

    detectCurrency();
    fetchRates();
  }, []);

  const convertPrice = (price, fromCurrency = 'XOF') => {
  if (!price || !rates || Object.keys(rates).length === 0) return parseFloat(price.toFixed(2));
  if (fromCurrency === userCurrency) return parseFloat(price.toFixed(2));
  
  // Conversion via XOF comme pivot
  let priceInXOF = price;
  if (fromCurrency !== 'XOF') {
    if (rates[fromCurrency]) {
      priceInXOF = price / rates[fromCurrency];
    }
  }
  
  // XOF → userCurrency
  if (userCurrency !== 'XOF' && rates[userCurrency]) {
    return parseFloat((priceInXOF * rates[userCurrency]).toFixed(2)); // ← 2 décimales
  }
  
  return parseFloat(priceInXOF.toFixed(2));
};

  return { userCurrency, convertPrice };
}

// Mapping Code Pays → Devise (TOUS LES PAYS D'AFRIQUE)
function getAfricanCurrency(countryCode) {
  const africanCurrencies = {
    // Afrique du Nord
    'MA': 'MAD',  // Maroc
    'DZ': 'DZD',  // Algérie
    'TN': 'TND',  // Tunisie
    'LY': 'LYD',  // Libye
    'EG': 'EGP',  // Égypte
    
    // Afrique de l'Ouest (FCFA - XOF)
    'SN': 'XOF',  // Sénégal
    'CI': 'XOF',  // Côte d'Ivoire
    'ML': 'XOF',  // Mali
    'BF': 'XOF',  // Burkina Faso
    'BJ': 'XOF',  // Bénin
    'TG': 'XOF',  // Togo
    'NE': 'XOF',  // Niger
    'GW': 'XOF',  // Guinée-Bissau
    
    // Afrique Centrale (FCFA - XAF)
    'CG': 'XAF',  // Congo-Brazzaville
    'GA': 'XAF',  // Gabon
    'CM': 'XAF',  // Cameroun
    'TD': 'XAF',  // Tchad
    'CF': 'XAF',  // Centrafrique
    'GQ': 'XAF',  // Guinée Équatoriale
    
    // Afrique Centrale & Est (USD/autres)
    'CD': 'USD',  // RDC (Congo-Kinshasa)
    'AO': 'AOA',  // Angola
    
    // Afrique de l'Est
    'KE': 'KES',  // Kenya
    'TZ': 'TZS',  // Tanzanie
    'UG': 'UGX',  // Ouganda
    'RW': 'RWF',  // Rwanda
    'BI': 'BIF',  // Burundi
    'ET': 'ETB',  // Éthiopie
    'SO': 'SOS',  // Somalie
    'DJ': 'DJF',  // Djibouti
    
    // Afrique Australe
    'ZA': 'ZAR',  // Afrique du Sud
    'NA': 'NAD',  // Namibie
    'BW': 'BWP',  // Botswana
    'ZW': 'USD',  // Zimbabwe
    'ZM': 'ZMW',  // Zambie
    'MW': 'MWK',  // Malawi
    'MZ': 'MZN',  // Mozambique
    
    // Afrique de l'Ouest (autres)
    'GH': 'GHS',  // Ghana
    'NG': 'NGN',  // Nigeria
    'GN': 'GNF',  // Guinée
    'SL': 'SLL',  // Sierra Leone
    'LR': 'LRD',  // Libéria
    'MR': 'MRU',  // Mauritanie
    'GM': 'GMD',  // Gambie
    'CV': 'CVE',  // Cap-Vert
    
    // Océan Indien
    'MG': 'MGA',  // Madagascar
    'MU': 'MUR',  // Maurice
    'SC': 'SCR',  // Seychelles
    'KM': 'KMF',  // Comores
    
    // Europe (backup)
    'FR': 'EUR',
    'BE': 'EUR',
    'ES': 'EUR',
    'IT': 'EUR',
    'DE': 'EUR',
    'PT': 'EUR',
    
    // Amérique
    'US': 'USD',
    'CA': 'CAD',
  };

  return africanCurrencies[countryCode] || 'MAD'; // Défaut MAD (Maroc)
}