// src/app/annonces/page.js
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { annoncesAPI, paysAPI, villesAPI } from '@/lib/api';
import PageTracker from '@/components/PageTracker';
import { useT } from '@/lib/i18n/LangProvider';

export default function AnnoncesPage() {
  const { t, lang } = useT();
  const [annonces, setAnnonces] = useState([]);
  const [pays, setPays] = useState([]);
  const [villes, setVilles] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filtres
  const [typeFiltre, setTypeFiltre] = useState('tous');
  const [paysFiltre, setPaysFiltre] = useState('');
  const [villeFiltre, setVilleFiltre] = useState('');
  const [villesFiltrees, setVillesFiltrees] = useState([]);
  const [recherche, setRecherche] = useState('');

  useEffect(() => {
    chargerDonnees();
  }, []);

  const chargerDonnees = async () => {
    try {
      setLoading(true);
      const [annoncesData, paysData, villesData] = await Promise.all([
        annoncesAPI.getAll(),
        paysAPI.getAll(),
        villesAPI.getAll()
      ]);
      
      setAnnonces(annoncesData);
      setPays(paysData);
      setVilles(villesData);
    } catch (error) {
      console.error('Erreur chargement annonces:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour gerer le changement de pays
  const handlePaysChange = (nouveauPays) => {
    setPaysFiltre(nouveauPays);
    setVilleFiltre('');
    
    if (nouveauPays) {
      const villesDuPays = villes.filter(v => v.pays_id === nouveauPays);
      setVillesFiltrees(villesDuPays);
    } else {
      setVillesFiltrees([]);
    }
  };

  // Filtrage
  const annoncesFiltrees = annonces.filter(a => {
    const matchType = typeFiltre === 'tous' || a.type === typeFiltre;
    const matchPays = !paysFiltre || a.pays_id === paysFiltre;
    const matchVille = !villeFiltre || a.ville_id === villeFiltre;
    const matchRecherche = !recherche ||
      a.titre.toLowerCase().includes(recherche.toLowerCase()) ||
      a.organisme.toLowerCase().includes(recherche.toLowerCase()) ||
      (a.description && a.description.toLowerCase().includes(recherche.toLowerCase()));
    return matchType && matchPays && matchVille && matchRecherche;
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
          <p className="text-gray-600">{t('annonces_page.chargement')}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageTracker pageType="annonces" />
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary via-primary-dark to-primary-light text-white py-12">
          <div className="max-w-7xl mx-auto px-4">
            <h1 className="text-4xl md:text-5xl font-bold mb-3">{t('annonces_page.titre')}</h1>
            <p className="text-xl text-orange-100">
              {t('annonces_page.decouvrez')} {annonces.length} {t('annonces_page.sous_titre')}
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
                  {t('annonces_page.rechercher')}
                </label>
                <div className="relative">
                  <svg className="absolute left-4 top-3.5 text-gray-400" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder={t('annonces_page.placeholder_recherche')}
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-accent focus:outline-none"
                    value={recherche}
                    onChange={(e) => setRecherche(e.target.value)}
                  />
                </div>
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('annonces_page.type')}
                </label>
                <select
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-accent focus:outline-none font-medium"
                  value={typeFiltre}
                  onChange={(e) => setTypeFiltre(e.target.value)}
                >
                  <option value="tous">{t('annonces_page.tous_types')}</option>
                  <option value="Financement">💰 {t('annonces_page.financement')}</option>
                  <option value="Appel d'offres">📄 {t('annonces_page.appel_offres')}</option>
                  <option value="Emploi">💼 {t('annonces_page.emploi')}</option>
                  <option value="Salon BtoB">🏢 {t('annonces_page.salon')}</option>
                  <option value="Voyage d'affaires">✈️ {t('annonces_page.voyage')}</option>
                  <option value="Partenariat">🤝 {t('annonces_page.partenariat')}</option>
                </select>
              </div>

              {/* Pays */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('annonces_page.pays')}
                </label>
                <select
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-accent focus:outline-none font-medium"
                  value={paysFiltre}
                  onChange={(e) => handlePaysChange(e.target.value)}
                >
                  <option value="">{t('annonces_page.tous_pays')}</option>
                  {pays.map(p => (
                    <option key={p.id} value={p.id}>{p.nom}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Ville */}
            {paysFiltre && villesFiltrees.length > 0 && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('annonces_page.ville')}
                </label>
                <select
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-accent focus:outline-none font-medium"
                  value={villeFiltre}
                  onChange={(e) => setVilleFiltre(e.target.value)}
                >
                  <option value="">{t('annonces_page.toutes_villes')}</option>
                  {villesFiltrees.map(v => (
                    <option key={v.id} value={v.id}>{v.nom}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Badges types */}
            <div className="flex flex-wrap gap-2 mt-4">
              <button
                onClick={() => setTypeFiltre('tous')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                  typeFiltre === 'tous'
                    ? 'bg-gray-800 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {t('annonces_page.tous_btn')} ({annonces.length})
              </button>
              <button
                onClick={() => setTypeFiltre('Financement')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                  typeFiltre === 'Financement'
                    ? 'bg-blue-500 text-white'
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                }`}
              >
                💰 {t('annonces_page.financement')} ({annonces.filter(a => a.type === 'Financement').length})
              </button>
              <button
                onClick={() => setTypeFiltre('Appel d\'offres')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                  typeFiltre === 'Appel d\'offres'
                    ? 'bg-green-500 text-white'
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                📄 {t('annonces_page.appels_offres')} ({annonces.filter(a => a.type === 'Appel d\'offres').length})
              </button>
              <button
                onClick={() => setTypeFiltre('Emploi')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                  typeFiltre === 'Emploi'
                    ? 'bg-purple-500 text-white'
                    : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                }`}
              >
                💼 {t('annonces_page.emploi')} ({annonces.filter(a => a.type === 'Emploi').length})
              </button>
              <button
                onClick={() => setTypeFiltre('Salon BtoB')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                  typeFiltre === 'Salon BtoB'
                    ? 'bg-indigo-500 text-white'
                    : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                }`}
              >
                🏢 {t('annonces_page.salons')} ({annonces.filter(a => a.type === 'Salon BtoB').length})
              </button>
              <button
                onClick={() => setTypeFiltre('Voyage d\'affaires')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                  typeFiltre === 'Voyage d\'affaires'
                    ? 'bg-cyan-500 text-white'
                    : 'bg-cyan-100 text-cyan-700 hover:bg-cyan-200'
                }`}
              >
                ✈️ {t('annonces_page.voyages')} ({annonces.filter(a => a.type === 'Voyage d\'affaires').length})
              </button>
              <button
                onClick={() => setTypeFiltre('Partenariat')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                  typeFiltre === 'Partenariat'
                    ? 'bg-pink-500 text-white'
                    : 'bg-pink-100 text-pink-700 hover:bg-pink-200'
                }`}
              >
                🤝 {t('annonces_page.partenariats')} ({annonces.filter(a => a.type === 'Partenariat').length})
              </button>
            </div>
          </div>

          {/* Liste des annonces */}
          {annoncesTri.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl shadow">
              <div className="text-6xl mb-4">📢</div>
              <p className="text-xl text-gray-600 mb-2">{t('annonces_page.aucune')}</p>
              <p className="text-gray-500 mb-6">{t('annonces_page.essayez')}</p>
              <button
                onClick={() => {
                  setTypeFiltre('tous');
                  setPaysFiltre('');
                  setVilleFiltre('');
                  setRecherche('');
                }}
                className="btn-accent"
              >
                {t('annonces_page.reinitialiser')}
              </button>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <p className="text-gray-600">
                  <span className="font-semibold text-gray-800">{annoncesTri.length}</span> {annoncesTri.length > 1 ? t('annonces_page.annonce_pluriel') : t('annonces_page.annonce_singulier')} {annoncesTri.length > 1 ? t('annonces_page.trouvee_pluriel') : t('annonces_page.trouvee_singulier')}
                </p>
              </div>

              <div className="space-y-6">
                {annoncesTri.map(annonce => {
                  const joursRestants = Math.ceil(
                    (new Date(annonce.date_fin) - new Date()) / (1000 * 60 * 60 * 24)
                  );
                  const estUrgent = joursRestants <= 7;
                  const estExpire = joursRestants < 0;

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
                                  {t('annonces_page.expire')}
                                </span>
                              ) : estUrgent ? (
                                <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold animate-pulse">
                                  {t('annonces_page.urgent')}
                                </span>
                              ) : null}
                            </div>
                          </div>

                          <p className="text-gray-600 mb-3 line-clamp-2">
                            {annonce.description}
                          </p>

                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              📍 {annonce.pays?.nom || t('annonces_page.non_specifie')}
                            </span>
                            {annonce.ville && (
                              <span className="flex items-center gap-1">
                                🏙️ {annonce.ville.nom}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              📅 {t('annonces_page.date_limite')}: {new Date(annonce.date_fin).toLocaleDateString(lang === 'ar' ? 'ar' : lang === 'en' ? 'en-GB' : 'fr-FR', {
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
                                {joursRestants} {joursRestants > 1 ? t('annonces_page.jour_pluriel') : t('annonces_page.jour_singulier')} {joursRestants > 1 ? t('annonces_page.restant_pluriel') : t('annonces_page.restant_singulier')}
                              </span>
                            )}
                          </div>

                          <div className="mt-3 flex items-center gap-2 flex-wrap">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${typeConfig.badge}`}>
                              {annonce.type}
                            </span>
                            {annonce.type === 'Emploi' && annonce.sous_type && (
                              <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                                {annonce.sous_type}
                              </span>
                            )}
                            <span className="text-accent font-semibold text-sm">
                              {t('annonces_page.voir_les_details')}
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
          {/* Bouton WhatsApp Flottant */}
          <a
            href="https://wa.me/212673623053?text=Bonjour%2C%20je%20souhaite%20inscrire%20mon%20entreprise%20sur%20Chez%20Mon%20Ami.%20Pouvez-vous%20m%27aider%20%3F"
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-6 right-6 w-16 h-16 bg-green-500 hover:bg-green-600 rounded-full shadow-2xl flex items-center justify-center text-white text-3xl z-50 hover:scale-110 transition-transform"
            title={t('annonces_page.whatsapp_titre')}
          >
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
          </a>
        </div>
      </div>
    </>
  );
}