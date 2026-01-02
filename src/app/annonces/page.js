// src/app/annonces/page.js
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { annoncesAPI, paysAPI } from '@/lib/api';

export default function AnnoncesPage() {
  const [annonces, setAnnonces] = useState([]);
  const [pays, setPays] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filtres
  const [typeFiltre, setTypeFiltre] = useState('tous');
  const [paysFiltre, setPaysFiltre] = useState('');
  const [recherche, setRecherche] = useState('');

  useEffect(() => {
    chargerDonnees();
  }, []);

  const chargerDonnees = async () => {
    try {
      setLoading(true);
      const [annoncesData, paysData] = await Promise.all([
        annoncesAPI.getAll(),
        paysAPI.getAll()
      ]);
      
      setAnnonces(annoncesData);
      setPays(paysData);
    } catch (error) {
      console.error('Erreur chargement annonces:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrage
  const annoncesFiltrees = annonces.filter(a => {
    const matchType = typeFiltre === 'tous' || a.type === typeFiltre;
    const matchPays = !paysFiltre || a.pays_id === paysFiltre;
    const matchRecherche = !recherche ||
      a.titre.toLowerCase().includes(recherche.toLowerCase()) ||
      a.organisme.toLowerCase().includes(recherche.toLowerCase()) ||
      (a.description && a.description.toLowerCase().includes(recherche.toLowerCase()));
    return matchType && matchPays && matchRecherche;
  });

  // Tri par date
  const annoncesTri = [...annoncesFiltrees].sort((a, b) => 
    new Date(b.date_publication) - new Date(a.date_publication)
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des annonces...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-accent via-accent-dark to-accent-light text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-3">📢 Toutes les Annonces</h1>
          <p className="text-xl text-orange-100">
            Découvrez {annonces.length} opportunités : financements, appels d'offres, emplois et plus
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Barre de filtres */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Recherche */}
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🔍 Rechercher
              </label>
              <div className="relative">
                <svg className="absolute left-4 top-3.5 text-gray-400" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Titre, organisme..."
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-accent focus:outline-none"
                  value={recherche}
                  onChange={(e) => setRecherche(e.target.value)}
                />
              </div>
            </div>

            {/* Type - MODIFIÉ avec nouveaux types */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📋 Type
              </label>
              <select
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-accent focus:outline-none font-medium"
                value={typeFiltre}
                onChange={(e) => setTypeFiltre(e.target.value)}
              >
                <option value="tous">Tous les types</option>
                <option value="Financement">💰 Financement</option>
                <option value="Appel d'offres">📄 Appel d'offres</option>
                <option value="Emploi">💼 Emploi</option>
                <option value="Salon BtoB">🏢 Salon BtoB</option>
                <option value="Voyage d'affaires">✈️ Voyage d'affaires</option>
                <option value="Partenariat">🤝 Partenariat</option>
              </select>
            </div>

            {/* Pays */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🌍 Pays
              </label>
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
          </div>

          {/* Badges types - MODIFIÉ avec nouveaux types */}
          <div className="flex flex-wrap gap-2 mt-4">
            <button
              onClick={() => setTypeFiltre('tous')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                typeFiltre === 'tous'
                  ? 'bg-gray-800 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Tous ({annonces.length})
            </button>
            <button
              onClick={() => setTypeFiltre('Financement')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                typeFiltre === 'Financement'
                  ? 'bg-blue-500 text-white'
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              }`}
            >
              💰 Financement ({annonces.filter(a => a.type === 'Financement').length})
            </button>
            <button
              onClick={() => setTypeFiltre('Appel d\'offres')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                typeFiltre === 'Appel d\'offres'
                  ? 'bg-green-500 text-white'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              📄 Appels d'offres ({annonces.filter(a => a.type === 'Appel d\'offres').length})
            </button>
            <button
              onClick={() => setTypeFiltre('Emploi')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                typeFiltre === 'Emploi'
                  ? 'bg-purple-500 text-white'
                  : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
              }`}
            >
              💼 Emploi ({annonces.filter(a => a.type === 'Emploi').length})
            </button>
            {/* NOUVEAUX badges */}
            <button
              onClick={() => setTypeFiltre('Salon BtoB')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                typeFiltre === 'Salon BtoB'
                  ? 'bg-indigo-500 text-white'
                  : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
              }`}
            >
              🏢 Salons BtoB ({annonces.filter(a => a.type === 'Salon BtoB').length})
            </button>
            <button
              onClick={() => setTypeFiltre('Voyage d\'affaires')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                typeFiltre === 'Voyage d\'affaires'
                  ? 'bg-cyan-500 text-white'
                  : 'bg-cyan-100 text-cyan-700 hover:bg-cyan-200'
              }`}
            >
              ✈️ Voyages ({annonces.filter(a => a.type === 'Voyage d\'affaires').length})
            </button>
            <button
              onClick={() => setTypeFiltre('Partenariat')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                typeFiltre === 'Partenariat'
                  ? 'bg-pink-500 text-white'
                  : 'bg-pink-100 text-pink-700 hover:bg-pink-200'
              }`}
            >
              🤝 Partenariats ({annonces.filter(a => a.type === 'Partenariat').length})
            </button>
          </div>
        </div>

        {/* Liste des annonces */}
        {annoncesTri.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow">
            <div className="text-6xl mb-4">📢</div>
            <p className="text-xl text-gray-600 mb-2">Aucune annonce trouvée</p>
            <p className="text-gray-500 mb-6">Essayez de modifier vos critères de recherche</p>
            <button
              onClick={() => {
                setTypeFiltre('tous');
                setPaysFiltre('');
                setRecherche('');
              }}
              className="btn-accent"
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <p className="text-gray-600">
                <span className="font-semibold text-gray-800">{annoncesTri.length}</span> annonce{annoncesTri.length > 1 ? 's' : ''} trouvée{annoncesTri.length > 1 ? 's' : ''}
              </p>
            </div>

            <div className="space-y-6">
              {annoncesTri.map(annonce => {
                const joursRestants = Math.ceil(
                  (new Date(annonce.date_fin) - new Date()) / (1000 * 60 * 60 * 24)
                );
                const estUrgent = joursRestants <= 7;
                const estExpire = joursRestants < 0;

                // MODIFIÉ : Gestion des couleurs pour tous les types
                const getTypeConfig = (type) => {
                  switch(type) {
                    case 'Financement':
                      return { icon: '💰', bg: 'bg-blue-100', badge: 'bg-blue-100 text-blue-700' };
                    case 'Appel d\'offres':
                      return { icon: '📄', bg: 'bg-green-100', badge: 'bg-green-100 text-green-700' };
                    case 'Emploi':
                      return { icon: '💼', bg: 'bg-purple-100', badge: 'bg-purple-100 text-purple-700' };
                    case 'Salon BtoB':
                      return { icon: '🏢', bg: 'bg-indigo-100', badge: 'bg-indigo-100 text-indigo-700' };
                    case 'Voyage d\'affaires':
                      return { icon: '✈️', bg: 'bg-cyan-100', badge: 'bg-cyan-100 text-cyan-700' };
                    case 'Partenariat':
                      return { icon: '🤝', bg: 'bg-pink-100', badge: 'bg-pink-100 text-pink-700' };
                    default:
                      return { icon: '📢', bg: 'bg-gray-100', badge: 'bg-gray-100 text-gray-700' };
                  }
                };

                const typeConfig = getTypeConfig(annonce.type);

                return (
                  <Link
                    key={annonce.id}
                    href={`/annonce/${annonce.id}`}
                    className="card p-6 hover:shadow-2xl transition-all hover:scale-102 cursor-pointer"
                  >
                    <div className="flex flex-col md:flex-row gap-4">
                      {/* Badge type */}
                      <div className="flex-shrink-0">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl ${typeConfig.bg}`}>
                          {typeConfig.icon}
                        </div>
                      </div>

                      {/* Contenu */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-gray-800 mb-1">
                              {annonce.titre}
                            </h3>
                            <p className="text-sm font-medium text-accent">
                              {annonce.organisme}
                            </p>
                          </div>
                          <div className="flex gap-2 ml-4">
                            {estExpire ? (
                              <span className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-xs font-bold">
                                ⏰ Expiré
                              </span>
                            ) : estUrgent ? (
                              <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold animate-pulse">
                                🔥 Urgent
                              </span>
                            ) : null}
                          </div>
                        </div>

                        <p className="text-gray-600 mb-3 line-clamp-2">
                          {annonce.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            📍 {annonce.pays?.nom || 'Non spécifié'}
                          </span>
                          <span className="flex items-center gap-1">
                            📅 Date limite: {new Date(annonce.date_fin).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </span>
                          {!estExpire && (
                            <span className={`font-semibold ${
                              joursRestants <= 3 ? 'text-red-600' :
                              joursRestants <= 7 ? 'text-orange-600' :
                              'text-green-600'
                            }`}>
                              {joursRestants} jour{joursRestants > 1 ? 's' : ''} restant{joursRestants > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>

                        {/* MODIFIÉ : Affichage du type et sous-type */}
                        <div className="mt-3 flex items-center gap-2 flex-wrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${typeConfig.badge}`}>
                            {annonce.type}
                          </span>
                          {/* NOUVEAU : Badge sous-type pour Emploi */}
                          {annonce.type === 'Emploi' && annonce.sous_type && (
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                              {annonce.sous_type}
                            </span>
                          )}
                          <span className="text-accent font-semibold text-sm">
                            Voir les détails →
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}