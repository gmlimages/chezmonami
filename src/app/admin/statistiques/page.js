// src/app/admin/statistiques/page.js - PARTIE 1/2
'use client';
import { useState, useEffect } from 'react';
import AdminLayout from '@/app/admin/AdminLayout';
import { statistiquesAPI } from '@/lib/api';

export default function AdminStatistiques() {
  const [loading, setLoading] = useState(true);
  const [periode, setPeriode] = useState('30'); // 7, 30, 90 jours
  const [onglet, setOnglet] = useState('apercu'); // apercu, pages, elements
  
  const [statsGlobales, setStatsGlobales] = useState({
    aujourd_hui: { visiteurs_uniques: 0, total_visites: 0 },
    hier: { visiteurs_uniques: 0, total_visites: 0 },
    total_visites_historique: 0
  });
  
  const [statsQuotidiennes, setStatsQuotidiennes] = useState([]);
  const [pagesPopulaires, setPagesPopulaires] = useState([]);
  const [structuresPopulaires, setStructuresPopulaires] = useState([]);
  const [produitsPopulaires, setProduitsPopulaires] = useState([]);

  useEffect(() => {
    chargerStatistiques();
  }, [periode]);

  const chargerStatistiques = async () => {
    try {
      setLoading(true);
      
      // Mettre à jour les stats d'abord
      await statistiquesAPI.majStatsQuotidiennes();

      const [globales, quotidiennes, pages, structures, produits] = await Promise.all([
        statistiquesAPI.getStatsGlobales(),
        statistiquesAPI.getStatsQuotidiennes(parseInt(periode)),
        statistiquesAPI.getPagesPopulaires(parseInt(periode)),
        statistiquesAPI.getElementsPopulaires('structure', 10, 'total'),
        statistiquesAPI.getElementsPopulaires('produit', 10, 'total')
      ]);

      setStatsGlobales(globales);
      setStatsQuotidiennes(quotidiennes);
      setPagesPopulaires(pages);
      setStructuresPopulaires(structures);
      setProduitsPopulaires(produits);
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const exporterStatistiques = () => {
    // Préparer les données pour l'export
    const data = {
      periode: `Statistiques des ${periode} derniers jours`,
      date_export: new Date().toLocaleDateString('fr-FR'),
      stats_globales: statsGlobales,
      stats_quotidiennes: statsQuotidiennes,
      pages_populaires: pagesPopulaires,
      structures_populaires: structuresPopulaires,
      produits_populaires: produitsPopulaires
    };

    // Créer le contenu CSV
    let csv = 'STATISTIQUES CHEZ MON AMI\n';
    csv += `Date d'export: ${data.date_export}\n`;
    csv += `Période: ${data.periode}\n\n`;

    // Stats globales
    csv += 'STATISTIQUES GLOBALES\n';
    csv += 'Métrique,Aujourd\'hui,Hier,Total\n';
    csv += `Visiteurs uniques,${statsGlobales.aujourd_hui.visiteurs_uniques},${statsGlobales.hier.visiteurs_uniques},-\n`;
    csv += `Total visites,${statsGlobales.aujourd_hui.total_visites},${statsGlobales.hier.total_visites},${statsGlobales.total_visites_historique}\n\n`;

    // Stats quotidiennes
    csv += 'STATISTIQUES QUOTIDIENNES\n';
    csv += 'Date,Visiteurs Uniques,Total Visites\n';
    statsQuotidiennes.forEach(stat => {
      csv += `${new Date(stat.date).toLocaleDateString('fr-FR')},${stat.visiteurs_uniques},${stat.total_visites}\n`;
    });
    csv += '\n';

    // Pages populaires
    csv += 'PAGES LES PLUS VISITÉES\n';
    csv += 'Position,Page,URL,Vues\n';
    pagesPopulaires.forEach((page, index) => {
      csv += `${index + 1},"${page.page_titre || page.page_url}",${page.page_url},${page.total_vues}\n`;
    });
    csv += '\n';

    // Structures populaires
    csv += 'STRUCTURES LES PLUS CONSULTÉES\n';
    csv += 'Position,Nom,Vues Total,Vues Semaine,Vues Mois\n';
    structuresPopulaires.forEach((structure, index) => {
      csv += `${index + 1},"${structure.element_nom}",${structure.vues_total},${structure.vues_semaine},${structure.vues_mois}\n`;
    });
    csv += '\n';

    // Produits populaires
    csv += 'PRODUITS LES PLUS CONSULTÉS\n';
    csv += 'Position,Nom,Vues Total,Vues Semaine,Vues Mois\n';
    produitsPopulaires.forEach((produit, index) => {
      csv += `${index + 1},"${produit.element_nom}",${produit.vues_total},${produit.vues_semaine},${produit.vues_mois}\n`;
    });

    // Télécharger le fichier
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `statistiques_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const calculerEvolution = (valeurAujourdhui, valeurHier) => {
    if (valeurHier === 0) return valeurAujourdhui > 0 ? 100 : 0;
    return Math.round(((valeurAujourdhui - valeurHier) / valeurHier) * 100);
  };

  const evolutionVisiteurs = calculerEvolution(
    statsGlobales.aujourd_hui.visiteurs_uniques,
    statsGlobales.hier.visiteurs_uniques
  );

  const evolutionVisites = calculerEvolution(
    statsGlobales.aujourd_hui.total_visites,
    statsGlobales.hier.total_visites
  );

  if (loading) {
    return (
      <AdminLayout titre="Statistiques des Visiteurs">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement des statistiques...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }
  return (
    <AdminLayout titre="Statistiques des Visiteurs" sousTitre="Analysez le trafic de votre plateforme">
      {/* Filtres */}
      <div className="mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setOnglet('apercu')}
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              onglet === 'apercu' ? 'bg-primary text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            📊 Aperçu
          </button>
          <button
            onClick={() => setOnglet('pages')}
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              onglet === 'pages' ? 'bg-primary text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            📄 Pages
          </button>
          <button
            onClick={() => setOnglet('elements')}
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              onglet === 'elements' ? 'bg-primary text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            🏆 Populaires
          </button>
        </div>

        <div className="flex gap-3">
          <select
            className="input-field"
            value={periode}
            onChange={(e) => setPeriode(e.target.value)}
          >
            <option value="7">7 derniers jours</option>
            <option value="30">30 derniers jours</option>
            <option value="90">90 derniers jours</option>
          </select>

          <button
            onClick={exporterStatistiques}
            className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-semibold flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Exporter CSV
          </button>
        </div>
      </div>

      {/* ONGLET APERÇU */}
      {onglet === 'apercu' && (
        <div className="space-y-6">
          {/* Stats en temps réel */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl">
                  👥
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  evolutionVisiteurs >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {evolutionVisiteurs >= 0 ? '+' : ''}{evolutionVisiteurs}%
                </span>
              </div>
              <h3 className="text-3xl font-bold text-gray-800 mb-1">
                {statsGlobales.aujourd_hui.visiteurs_uniques}
              </h3>
              <p className="text-gray-600">Visiteurs aujourd'hui</p>
              <p className="text-xs text-gray-500 mt-2">
                Hier : {statsGlobales.hier.visiteurs_uniques}
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-2xl">
                  👁️
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  evolutionVisites >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {evolutionVisites >= 0 ? '+' : ''}{evolutionVisites}%
                </span>
              </div>
              <h3 className="text-3xl font-bold text-gray-800 mb-1">
                {statsGlobales.aujourd_hui.total_visites}
              </h3>
              <p className="text-gray-600">Visites aujourd'hui</p>
              <p className="text-xs text-gray-500 mt-2">
                Hier : {statsGlobales.hier.total_visites}
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-2xl">
                  📈
                </div>
              </div>
              <h3 className="text-3xl font-bold text-gray-800 mb-1">
                {statsGlobales.total_visites_historique?.toLocaleString() || 0}
              </h3>
              <p className="text-gray-600">Total visites (tout temps)</p>
              <p className="text-xs text-gray-500 mt-2">
                Depuis le début
              </p>
            </div>
          </div>

          {/* Graphique des visites */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-6">
              Évolution des visites ({periode} derniers jours)
            </h3>
            <div className="space-y-2">
              {statsQuotidiennes.slice(0, 15).reverse().map((stat, index) => {
                const maxVisites = Math.max(...statsQuotidiennes.map(s => s.total_visites));
                const pourcentage = (stat.total_visites / maxVisites) * 100;
                
                return (
                  <div key={index} className="flex items-center gap-4">
                    <div className="w-24 text-sm text-gray-600">
                      {new Date(stat.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                    </div>
                    <div className="flex-1 bg-gray-100 rounded-full h-8 relative">
                      <div 
                        className="bg-gradient-to-r from-primary to-primary-dark h-8 rounded-full flex items-center justify-end px-3"
                        style={{ width: `${pourcentage}%` }}
                      >
                        <span className="text-white text-xs font-bold">
                          {stat.total_visites}
                        </span>
                      </div>
                    </div>
                    <div className="w-20 text-sm text-gray-600 text-right">
                      {stat.visiteurs_uniques} uniques
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ONGLET PAGES */}
      {onglet === 'pages' && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b">
            <h3 className="text-lg font-bold text-gray-800">Pages les plus visitées</h3>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">#</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Page</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Vues</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {pagesPopulaires.map((page, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-600">{index + 1}</td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-gray-800">{page.page_titre || page.page_url}</p>
                    <p className="text-xs text-gray-500">{page.page_url}</p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="px-3 py-1 bg-primary/10 text-primary rounded-full font-bold">
                      {page.total_vues}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {pagesPopulaires.length === 0 && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📊</div>
              <p className="text-gray-600">Aucune donnée pour le moment</p>
            </div>
          )}
        </div>
      )}

      {/* ONGLET ÉLÉMENTS POPULAIRES */}
      {onglet === 'elements' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Structures populaires */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 bg-blue-50 border-b">
              <h3 className="text-lg font-bold text-blue-900">🏪 Structures les plus consultées</h3>
            </div>
            <div className="p-4 space-y-3">
              {structuresPopulaires.map((structure, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{structure.element_nom}</p>
                      <p className="text-xs text-gray-500">
                        Semaine: {structure.vues_semaine} | Mois: {structure.vues_mois}
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-bold text-sm">
                    {structure.vues_total}
                  </span>
                </div>
              ))}

              {structuresPopulaires.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Aucune donnée
                </div>
              )}
            </div>
          </div>

          {/* Produits populaires */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 bg-purple-50 border-b">
              <h3 className="text-lg font-bold text-purple-900">📦 Produits les plus consultés</h3>
            </div>
            <div className="p-4 space-y-3">
              {produitsPopulaires.map((produit, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{produit.element_nom}</p>
                      <p className="text-xs text-gray-500">
                        Semaine: {produit.vues_semaine} | Mois: {produit.vues_mois}
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full font-bold text-sm">
                    {produit.vues_total}
                  </span>
                </div>
              ))}

              {produitsPopulaires.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Aucune donnée
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-bold text-blue-900 mb-3">ℹ️ À propos des statistiques</h3>
        <ul className="text-sm text-blue-800 space-y-2">
          <li>• Les statistiques sont mises à jour en temps réel</li>
          <li>• Les visiteurs uniques sont comptés par session (8h)</li>
          <li>• Les stats hebdomadaires se réinitialisent chaque lundi</li>
          <li>• Les stats mensuelles se réinitialisent le 1er de chaque mois</li>
        </ul>
      </div>
    </AdminLayout>
  );
}