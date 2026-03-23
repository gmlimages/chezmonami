// src/app/admin/pays-villes/page.js - VERSION MAROC (Régions & Villes)
'use client';
import { useState, useEffect } from 'react';
import AdminLayout from '@/app/admin/AdminLayout';
import { paysAPI, villesAPI } from '@/lib/api';

export default function AdminRegionsVilles() {
  const [ongletActif, setOngletActif] = useState('regions');
  const [regions, setRegions] = useState([]);
  const [villes, setVilles] = useState([]);
  const [regionSelectionnee, setRegionSelectionnee] = useState('');
  const [loading, setLoading] = useState(true);

  // Modes formulaire
  const [modeFormulaireRegion, setModeFormulaireRegion] = useState(false);
  const [regionEnCours, setRegionEnCours] = useState(null);
  const [modeFormulaireVille, setModeFormulaireVille] = useState(false);
  const [villeEnCours, setVilleEnCours] = useState(null);

  const [formDataRegion, setFormDataRegion] = useState({ nom: '' });
  const [formDataVille, setFormDataVille] = useState({ nom: '', pays_id: '' });

  useEffect(() => {
    chargerRegions();
  }, []);

  useEffect(() => {
    if (regionSelectionnee) {
      chargerVilles(regionSelectionnee);
    }
  }, [regionSelectionnee]);

  const chargerRegions = async () => {
    try {
      setLoading(true);
      const data = await paysAPI.getAll();
      setRegions(data);
    } catch (error) {
      console.error('Erreur chargement régions:', error);
      alert('❌ Erreur lors du chargement des régions');
    } finally {
      setLoading(false);
    }
  };

  const chargerVilles = async (regionId) => {
    try {
      const data = await villesAPI.getByPays(regionId);
      setVilles(data);
    } catch (error) {
      console.error('Erreur chargement villes:', error);
    }
  };

  // RÉGIONS - Fonctions
  const ouvrirFormulaireAjoutRegion = () => {
    setModeFormulaireRegion('ajout');
    setRegionEnCours(null);
    setFormDataRegion({ nom: '' });
  };

  const ouvrirFormulaireEditionRegion = (r) => {
    setModeFormulaireRegion('edition');
    setRegionEnCours(r);
    setFormDataRegion({ nom: r.nom });
  };

  const fermerFormulaireRegion = () => {
    setModeFormulaireRegion(false);
    setRegionEnCours(null);
    setFormDataRegion({ nom: '' });
  };

  const sauvegarderRegion = async () => {
    if (!formDataRegion.nom.trim()) {
      alert('⚠️ Veuillez entrer un nom de région');
      return;
    }

    try {
      if (modeFormulaireRegion === 'edition') {
        await paysAPI.update(regionEnCours.id, { nom: formDataRegion.nom.trim(), devise: 'MAD' });
        alert('✅ Région modifiée avec succès !');
      } else {
        await paysAPI.create({ nom: formDataRegion.nom.trim(), devise: 'MAD' });
        alert(`✅ Région "${formDataRegion.nom}" ajoutée avec succès !`);
      }

      fermerFormulaireRegion();
      chargerRegions();
    } catch (error) {
      console.error('Erreur sauvegarde région:', error);
      alert('❌ Erreur: ' + error.message);
    }
  };

  const supprimerRegion = async (id, nom) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer la région "${nom}" ?\n\n⚠️ ATTENTION : Toutes les villes et structures de cette région seront aussi supprimées !`)) return;

    try {
      await paysAPI.delete(id);
      alert(`✅ Région "${nom}" supprimée !`);
      chargerRegions();
      if (regionSelectionnee === id) {
        setRegionSelectionnee('');
        setVilles([]);
      }
    } catch (error) {
      console.error('Erreur suppression région:', error);
      alert('❌ Erreur: Cette région est peut-être utilisée par des structures');
    }
  };

  // VILLES - Fonctions
  const ouvrirFormulaireAjoutVille = () => {
    setModeFormulaireVille('ajout');
    setVilleEnCours(null);
    setFormDataVille({ nom: '', pays_id: regionSelectionnee });
  };

  const ouvrirFormulaireEditionVille = (v) => {
    setModeFormulaireVille('edition');
    setVilleEnCours(v);
    setFormDataVille({ nom: v.nom, pays_id: v.pays_id });
  };

  const fermerFormulaireVille = () => {
    setModeFormulaireVille(false);
    setVilleEnCours(null);
    setFormDataVille({ nom: '', pays_id: regionSelectionnee });
  };

  const sauvegarderVille = async () => {
    if (!formDataVille.nom.trim() || !regionSelectionnee) {
      alert('⚠️ Veuillez entrer un nom de ville');
      return;
    }

    try {
      if (modeFormulaireVille === 'edition') {
        await villesAPI.update(villeEnCours.id, { nom: formDataVille.nom.trim() });
        alert('✅ Ville modifiée avec succès !');
      } else {
        await villesAPI.create({
          nom: formDataVille.nom.trim(),
          pays_id: regionSelectionnee
        });
        alert(`✅ Ville "${formDataVille.nom}" ajoutée !`);
      }

      fermerFormulaireVille();
      chargerVilles(regionSelectionnee);
    } catch (error) {
      console.error('Erreur sauvegarde ville:', error);
      alert('❌ Erreur: ' + error.message);
    }
  };

  const supprimerVille = async (id, nom) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer "${nom}" ?`)) return;

    try {
      await villesAPI.delete(id);
      alert(`✅ Ville "${nom}" supprimée !`);
      chargerVilles(regionSelectionnee);
    } catch (error) {
      console.error('Erreur suppression ville:', error);
      alert('❌ Erreur: Cette ville est peut-être utilisée par des structures');
    }
  };

  if (loading) {
    return (
      <AdminLayout titre="Régions & Villes du Maroc">
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
    <AdminLayout titre="Régions & Villes du Maroc" sousTitre="Configurer les régions et villes disponibles">
      {/* Onglets */}
      <div className="flex gap-2 mb-8 border-b-2 border-gray-200">
        <button
          onClick={() => setOngletActif('regions')}
          className={`px-6 py-3 font-semibold transition border-b-4 ${
            ongletActif === 'regions'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          🗺️ Régions ({regions.length})
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

      {/* ONGLET RÉGIONS */}
      {ongletActif === 'regions' && (
        <div className="space-y-6">
          <div>
            <button
              onClick={() => modeFormulaireRegion ? fermerFormulaireRegion() : ouvrirFormulaireAjoutRegion()}
              className="btn-primary"
            >
              {modeFormulaireRegion ? '❌ Annuler' : '➕ Ajouter une région'}
            </button>
          </div>

          {/* Formulaire Région */}
          {modeFormulaireRegion && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                {modeFormulaireRegion === 'edition' ? '✏️ Modifier la région' : '➕ Ajouter une région'}
              </h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nom de la région *</label>
                <input
                  type="text"
                  placeholder="Ex: Casablanca-Settat"
                  className="input-field"
                  value={formDataRegion.nom}
                  onChange={(e) => setFormDataRegion({ nom: e.target.value })}
                />
                <p className="text-xs text-gray-500 mt-1">La devise est automatiquement définie sur MAD (Dirham marocain)</p>
              </div>
              <div className="flex gap-3 mt-4">
                <button onClick={sauvegarderRegion} className="btn-primary">
                  {modeFormulaireRegion === 'edition' ? '💾 Enregistrer' : '➕ Ajouter'}
                </button>
                <button onClick={fermerFormulaireRegion} className="px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50">
                  Annuler
                </button>
              </div>
            </div>
          )}

          {/* Liste des régions */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b">
              <h3 className="text-lg font-bold text-gray-800">12 régions administratives du Maroc</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {regions.map((r) => (
                <div key={r.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-2xl">
                      🗺️
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{r.nom}</p>
                      <p className="text-sm text-gray-500">Devise: {r.devise || 'MAD'}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => ouvrirFormulaireEditionRegion(r)}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm font-semibold"
                    >
                      ✏️ Modifier
                    </button>
                    <button
                      onClick={() => supprimerRegion(r.id, r.nom)}
                      className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition font-medium"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ONGLET VILLES */}
      {ongletActif === 'villes' && (
        <div className="space-y-6">
          {/* Sélection région */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Gérer les villes d'une région</h3>
            <select
              className="input-field"
              value={regionSelectionnee}
              onChange={(e) => {
                setRegionSelectionnee(e.target.value);
                setModeFormulaireVille(false);
              }}
            >
              <option value="">Sélectionner une région</option>
              {regions.map(r => (
                <option key={r.id} value={r.id}>{r.nom}</option>
              ))}
            </select>
          </div>

          {regionSelectionnee && (
            <>
              <div>
                <button
                  onClick={() => modeFormulaireVille ? fermerFormulaireVille() : ouvrirFormulaireAjoutVille()}
                  className="btn-primary"
                >
                  {modeFormulaireVille ? '❌ Annuler' : '➕ Ajouter une ville'}
                </button>
              </div>

              {/* Formulaire Ville */}
              {modeFormulaireVille && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">
                    {modeFormulaireVille === 'edition' ? '✏️ Modifier la ville' : '➕ Ajouter une ville'}
                  </h3>
                  <input
                    type="text"
                    placeholder="Ex: Casablanca"
                    className="input-field"
                    value={formDataVille.nom}
                    onChange={(e) => setFormDataVille({ ...formDataVille, nom: e.target.value })}
                  />
                  <div className="flex gap-3 mt-4">
                    <button onClick={sauvegarderVille} className="btn-primary">
                      {modeFormulaireVille === 'edition' ? '💾 Enregistrer' : '➕ Ajouter'}
                    </button>
                    <button onClick={fermerFormulaireVille} className="px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50">
                      Annuler
                    </button>
                  </div>
                </div>
              )}

              {/* Liste des villes */}
              {villes.length > 0 ? (
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <div className="px-6 py-4 bg-gray-50 border-b">
                    <h3 className="text-lg font-bold text-gray-800">
                      Villes de {regions.find(r => r.id === regionSelectionnee)?.nom} ({villes.length})
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                    {villes.map((ville) => (
                      <div key={ville.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🏙️</span>
                          <span className="font-medium text-gray-800">{ville.nom}</span>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => ouvrirFormulaireEditionVille(ville)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            title="Modifier"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => supprimerVille(ville.id, ville.nom)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                            title="Supprimer"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 bg-white rounded-xl shadow">
                  <div className="text-6xl mb-4">🏙️</div>
                  <p className="text-xl text-gray-600 mb-2">Aucune ville</p>
                  <p className="text-gray-500">Ajoutez la première ville pour cette région</p>
                </div>
              )}
            </>
          )}

          {!regionSelectionnee && (
            <div className="text-center py-16 bg-white rounded-xl shadow">
              <div className="text-6xl mb-4">🗺️</div>
              <p className="text-xl text-gray-600 mb-2">Sélectionnez une région</p>
              <p className="text-gray-500">Pour gérer ses villes</p>
            </div>
          )}
        </div>
      )}

      {/* Info */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-bold text-blue-900 mb-3">ℹ️ Informations</h3>
        <ul className="text-sm text-blue-800 space-y-2">
          <li className="flex items-start gap-2">
            <span>💾</span>
            <span>Les modifications sont sauvegardées immédiatement dans la base de données</span>
          </li>
          <li className="flex items-start gap-2">
            <span>⚠️</span>
            <span>Supprimer une région supprime aussi toutes ses villes et structures associées</span>
          </li>
          <li className="flex items-start gap-2">
            <span>🇲🇦</span>
            <span>Le Maroc est divisé en 12 régions administratives — toutes pré-configurées</span>
          </li>
          <li className="flex items-start gap-2">
            <span>💱</span>
            <span>La devise est fixée en MAD (Dirham Marocain) pour toutes les régions</span>
          </li>
        </ul>
      </div>
    </AdminLayout>
  );
}
