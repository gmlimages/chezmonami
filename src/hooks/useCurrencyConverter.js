// src/hooks/useCurrencyConverter.js - VERSION MAROC
// Devise fixe : MAD (Dirham Marocain) - pas de conversion nécessaire

export function useCurrencyConverter() {
  const userCurrency = 'MAD';

  // Pas de conversion nécessaire - tout est en MAD
  const convertPrice = (price) => {
    if (!price && price !== 0) return 0;
    return parseFloat(Number(price).toFixed(2));
  };

  const formatPrix = (price) => {
    if (!price && price !== 0) return '0 DH';
    return `${Number(price).toLocaleString('fr-MA')} DH`;
  };

  return { userCurrency, convertPrice, formatPrix };
}
