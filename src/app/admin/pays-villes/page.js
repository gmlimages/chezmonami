// src/app/admin/pays-villes/page.js
'use client';
import { useState, useEffect } from 'react';
import AdminLayout from '@/app/admin/AdminLayout';
import { paysAPI, villesAPI } from '@/lib/api';

export default function AdminPaysVilles() {
  const [ongletActif, setOngletActif] = useState('pays');
  const [pays, setPays] = useState([]);
  const [villes, setVilles] = useState([]);
  const [paysSelectionne, setPaysSelectionne] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [nouveauPays, setNouveauPays] = useState({
    nom: '',
    devise: 'FCFA'
  });
  
  const [nouvelleVille, setNouvelleVille] = useState({
    nom: '',
    pays_id: ''
  });

  const devises = [
    'FCFA', 'MAD', 'USD', 'EUR', 'GNF', 'XOF', 'XAF'
  ];

  useEffect(() => {
    chargerPays();
  }, []);

  useEffect(() => {
    if (paysSelectionne) {
      chargerVilles(paysSelectionne);
    }
  }, [paysSelectionne]);

  const chargerPays = async () => {
    try {
      setLoading(true);
      const data = await paysAPI.getAll();
      setPays(data);
    } catch (error) {
      console.error('Erreur chargement pays:', error);
      alert('❌ Erreur lors du chargement des pays');
    } finally {
      setLoading(false);
    }
  };

  const chargerVilles = async (paysId) => {
    try {
      const data = await villesAPI.getByPays(paysId);
      setVilles(data);
    } catch (error) {
      console.error('Erreur chargement villes:', error);
    }
  };

  const ajouterPays = async () => {
    if (!nouveauPays.nom.trim()) {
      alert('⚠️ Veuillez entrer un nom de pays');
      return;
    }

    try {
      await paysAPI.create(nouveauPays);
      alert(`✅ Pays "${nouveauPays.nom}" ajouté avec succès !`);
      setNouveauPays({ nom: '', devise: 'FCFA' });
      chargerPays();
    } catch (error) {
      console.error('Erreur ajout pays:', error);
      alert('❌ Erreur: ' + error.message);
    }
  };

  const supprimerPays = async (id, nom) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer "${nom}" ?\n\n⚠️ ATTENTION : Toutes les villes et structures de ce pays seront aussi supprimées !`)) return;

    try {
      await paysAPI.delete(id);
      alert(`✅ Pays "${nom}" supprimé !`);
      chargerPays();
      if (paysSelectionne === id) {
        setPaysSelectionne('');
        setVilles([]);
      }
    } catch (error) {
      console.error('Erreur suppression pays:', error);
      alert('❌ Erreur: Ce pays est peut-être utilisé par des structures');
    }
  };

  const ajouterVille = async () => {
    if (!nouvelleVille.nom.trim() || !paysSelectionne) {
      alert('⚠️ Veuillez sélectionner un pays et entrer un nom de ville');
      return;
    }

    try {
      await villesAPI.create({
        nom: nouvelleVille.nom.trim(),
        pays_id: paysSelectionne
      });
      alert(`✅ Ville "${nouvelleVille.nom}" ajoutée !`);
      setNouvelleVille({ nom: '', pays_id: '' });
      chargerVilles(paysSelectionne);
    } catch (error) {
      console.error('Erreur ajout ville:', error);
      alert('❌ Erreur: ' + error.message);
    }
  };

  const supprimerVille = async (id, nom) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer "${nom}" ?`)) return;

    try {
      await villesAPI.delete(id);
      alert(`✅ Ville "${nom}" supprimée !`);
      chargerVilles(paysSelectionne);
    } catch (error) {
      console.error('Erreur suppression ville:', error);
      alert('❌ Erreur: Cette ville est peut-être utilisée par des structures');
    }
  };

  if (loading) {
    return (
      <AdminLayout titre="Gestion des Pays et Villes">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout titre="Gestion des Pays et Villes" sousTitre="Configurer les localisations disponibles">
      {/* Onglets */}
      <div className="flex gap-2 mb-8 border-b-2 border-gray-200">
        <button
          onClick={() => setOngletActif('pays')}
          className={`px-6 py-3 font-semibold transition border-b-4 ${
            ongletActif === 'pays'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          🌍 Pays ({pays.length})
        </button>
        <button
          onClick={() => setOngletActif('villes')}
          className={`px-6 py-3 font-semibold transition border-b-4 ${
            ongletActif === 'villes'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          🏙️ Villes
        </button>
      </div>

      {/* ONGLET PAYS */}
      {ongletActif === 'pays' && (
        <div className="space-y-6">
          {/* Formulaire ajout pays */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Ajouter un pays</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <input
                  type="text"
                  placeholder="Ex: Nigéria"
                  className="input-field"
                  value={nouveauPays.nom}
                  onChange={(e) => setNouveauPays({...nouveauPays, nom: e.target.value})}
                  onKeyPress={(e) => e.key === 'Enter' && ajouterPays()}
                />
              </div>
              <select
                className="input-field"
                value={nouveauPays.devise}
                onChange={(e) => setNouveauPays({...nouveauPays, devise: e.target.value})}
              >
                {devises.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <button onClick={ajouterPays} className="btn-primary mt-4">
              Ajouter le pays
            </button>
          </div>

          {/* Liste des pays */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b">
              <h3 className="text-lg font-bold text-gray-800">Liste des pays</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {pays.map((p) => (
                <div key={p.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-2xl">
                      🌍
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{p.nom}</p>
                      <p className="text-sm text-gray-500">Devise: {p.devise}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => supprimerPays(p.id, p.nom)}
                    className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition font-medium"
                  >
                    Supprimer
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ONGLET VILLES */}
      {ongletActif === 'villes' && (
        <div className="space-y-6">
          {/* Sélection pays */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Gérer les villes d'un pays</h3>
            <select
              className="input-field mb-4"
              value={paysSelectionne}
              onChange={(e) => setPaysSelectionne(e.target.value)}
            >
              <option value="">Sélectionner un pays</option>
              {pays.map(p => (
                <option key={p.id} value={p.id}>{p.nom}</option>
              ))}
            </select>

            {paysSelectionne && (
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Ex: Lagos"
                  className="input-field flex-1"
                  value={nouvelleVille.nom}
                  onChange={(e) => setNouvelleVille({...nouvelleVille, nom: e.target.value})}
                  onKeyPress={(e) => e.key === 'Enter' && ajouterVille()}
                />
                <button onClick={ajouterVille} className="btn-primary">
                  Ajouter la ville
                </button>
              </div>
            )}
          </div>

          {/* Liste des villes */}
          {paysSelectionne && villes.length > 0 ? (
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b">
                <h3 className="text-lg font-bold text-gray-800">
                  Villes de {pays.find(p => p.id === paysSelectionne)?.nom} ({villes.length})
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                {villes.map((ville) => (
                  <div key={ville.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🏙️</span>
                      <span className="font-medium text-gray-800">{ville.nom}</span>
                    </div>
                    <button
                      onClick={() => supprimerVille(ville.id, ville.nom)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : paysSelectionne && villes.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl shadow">
              <div className="text-6xl mb-4">🏙️</div>
              <p className="text-xl text-gray-600 mb-2">Aucune ville</p>
              <p className="text-gray-500">Ajoutez la première ville pour ce pays</p>
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-xl shadow">
              <div className="text-6xl mb-4">🗺️</div>
              <p className="text-xl text-gray-600 mb-2">Sélectionnez un pays</p>
              <p className="text-gray-500">Pour gérer ses villes</p>
            </div>
          )}
        </div>
      )}

      {/* Info importante */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-bold text-blue-900 mb-3">ℹ️ Informations importantes</h3>
        <ul className="text-sm text-blue-800 space-y-2">
          <li className="flex items-start gap-2">
            <span>💾</span>
            <span>Les modifications sont sauvegardées immédiatement dans la base de données</span>
          </li>
          <li className="flex items-start gap-2">
            <span>⚠️</span>
            <span>Supprimer un pays supprime aussi toutes ses villes et structures associées</span>
          </li>
          <li className="flex items-start gap-2">
            <span>🔄</span>
            <span>Les changements sont visibles immédiatement sur le site public</span>
          </li>
        </ul>
      </div>
    </AdminLayout>
  );
}