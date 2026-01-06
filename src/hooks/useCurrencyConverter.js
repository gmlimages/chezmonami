// src/hooks/useCurrencyConverter.js - AVEC EXCHANGERATE-API
import { useState, useEffect } from 'react';

export function useCurrencyConverter() {
  const [userCurrency, setUserCurrency] = useState('XOF');
  const [rates, setRates] = useState({});

  useEffect(() => {
    const detectCurrency = async () => {
      try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        
        const currencyMap = {
          'Morocco': 'MAD',
          'France': 'EUR',
          'United States': 'USD',
          'Senegal': 'XOF',
          'Ivory Coast': 'XOF',
          'Cote D\'Ivoire': 'XOF',
          'Mali': 'XOF',
          'Burkina Faso': 'XOF',
          'Benin': 'XOF',
          'Togo': 'XOF',
          'Niger': 'XOF',
          'Guinea-Bissau': 'XOF',
          'Congo': 'XAF',              // ← AJOUT Congo-Brazzaville (F CFA Central)
          'Republic of the Congo': 'XAF',
          'Gabon': 'XAF',
          'Cameroon': 'XAF',
          'Chad': 'XAF',
          'Central African Republic': 'XAF',
          'Equatorial Guinea': 'XAF',
          'Democratic Republic of the Congo': 'USD',  // ← AJOUT RDC (Dollar)
          'Congo, The Democratic Republic of the': 'USD'
        };
        
        setUserCurrency(currencyMap[data.country_name] || 'MAD');
      } catch (error) {
        setUserCurrency('MAD');
      }
    };

    const fetchRates = async () => {
      try {
        // API GRATUITE - 1500 requêtes/mois
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
    if (!price) return 0;
    if (fromCurrency === userCurrency) return Math.round(price);
    
    // Conversion via XOF comme devise pivot
    // Étape 1: Convertir fromCurrency → XOF
    let priceInXOF = price;
    if (fromCurrency !== 'XOF' && rates[fromCurrency]) {
      priceInXOF = price / rates[fromCurrency];
    }
    
    // Étape 2: Convertir XOF → userCurrency
    if (rates[userCurrency]) {
      return Math.round(priceInXOF * rates[userCurrency]);
    }
    
    return Math.round(price);
  };

  return { userCurrency, convertPrice };
}