// src/app/admin/pays-villes/page.js
'use client';
import { toast, confirmDialog } from '@/lib/toast';
import { useState, useEffect } from 'react';
import AdminLayout from '@/app/admin/AdminLayout';
import { paysAPI, villesAPI } from '@/lib/api';

export default function AdminPaysVilles() {
  const [ongletActif, setOngletActif] = useState('pays');
  const [pays, setPays] = useState([]);
  const [villes, setVilles] = useState([]);
  const [paysSelectionne, setPaysSelectionne] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Modes formulaire
  const [modeFormulairePays, setModeFormulairePays] = useState(false); // false, 'ajout', 'edition'
  const [paysEnCours, setPaysEnCours] = useState(null);
  const [modeFormulaireVille, setModeFormulaireVille] = useState(false);
  const [villeEnCours, setVilleEnCours] = useState(null);
  
  const [formDataPays, setFormDataPays] = useState({
    nom: '',
    devise: 'XOF'
  });
  
  const [formDataVille, setFormDataVille] = useState({
    nom: '',
    pays_id: ''
  });

  // Liste complète des devises africaines
  const devisesAfricaines = [
    { code: 'XOF', nom: 'Franc CFA BCEAO (Afrique de l\'Ouest)', pays: 'Bénin, Burkina Faso, Côte d\'Ivoire, Guinée-Bissau, Mali, Niger, Sénégal, Togo' },
    { code: 'XAF', nom: 'Franc CFA BEAC (Afrique Centrale)', pays: 'Cameroun, Congo, Gabon, Guinée équatoriale, RCA, Tchad' },
    { code: 'MAD', nom: 'Dirham marocain', pays: 'Maroc' },
    { code: 'DZD', nom: 'Dinar algérien', pays: 'Algérie' },
    { code: 'TND', nom: 'Dinar tunisien', pays: 'Tunisie' },
    { code: 'EGP', nom: 'Livre égyptienne', pays: 'Égypte' },
    { code: 'ZAR', nom: 'Rand sud-africain', pays: 'Afrique du Sud' },
    { code: 'NGN', nom: 'Naira nigérian', pays: 'Nigeria' },
    { code: 'GHS', nom: 'Cedi ghanéen', pays: 'Ghana' },
    { code: 'KES', nom: 'Shilling kényan', pays: 'Kenya' },
    { code: 'TZS', nom: 'Shilling tanzanien', pays: 'Tanzanie' },
    { code: 'UGX', nom: 'Shilling ougandais', pays: 'Ouganda' },
    { code: 'ETB', nom: 'Birr éthiopien', pays: 'Éthiopie' },
    { code: 'MUR', nom: 'Roupie mauricienne', pays: 'Maurice' },
    { code: 'SCR', nom: 'Roupie seychelloise', pays: 'Seychelles' },
    { code: 'MGA', nom: 'Ariary malgache', pays: 'Madagascar' },
    { code: 'ZMW', nom: 'Kwacha zambien', pays: 'Zambie' },
    { code: 'BWP', nom: 'Pula botswanais', pays: 'Botswana' },
    { code: 'NAD', nom: 'Dollar namibien', pays: 'Namibie' },
    { code: 'MZN', nom: 'Metical mozambicain', pays: 'Mozambique' },
    { code: 'AOA', nom: 'Kwanza angolais', pays: 'Angola' },
    { code: 'CDF', nom: 'Franc congolais', pays: 'RD Congo' },
    { code: 'RWF', nom: 'Franc rwandais', pays: 'Rwanda' },
    { code: 'BIF', nom: 'Franc burundais', pays: 'Burundi' },
    { code: 'GNF', nom: 'Franc guinéen', pays: 'Guinée' },
    { code: 'LRD', nom: 'Dollar libérien', pays: 'Libéria' },
    { code: 'SLL', nom: 'Leone sierra-léonais', pays: 'Sierra Leone' },
    { code: 'GMD', nom: 'Dalasi gambien', pays: 'Gambie' },
    { code: 'CVE', nom: 'Escudo cap-verdien', pays: 'Cap-Vert' },
    { code: 'MRU', nom: 'Ouguiya mauritanien', pays: 'Mauritanie' },
    { code: 'LYD', nom: 'Dinar libyen', pays: 'Libye' },
    { code: 'SDG', nom: 'Livre soudanaise', pays: 'Soudan' },
    { code: 'SSP', nom: 'Livre sud-soudanaise', pays: 'Soudan du Sud' },
    { code: 'ERN', nom: 'Nakfa érythréen', pays: 'Érythrée' },
    { code: 'DJF', nom: 'Franc djiboutien', pays: 'Djibouti' },
    { code: 'SOS', nom: 'Shilling somalien', pays: 'Somalie' },
    { code: 'KMF', nom: 'Franc comorien', pays: 'Comores' },
    { code: 'SZL', nom: 'Lilangeni swazi', pays: 'Eswatini' },
    { code: 'LSL', nom: 'Loti lesothan', pays: 'Lesotho' },
    { code: 'MWK', nom: 'Kwacha malawite', pays: 'Malawi' },
    { code: 'STN', nom: 'Dobra santoméen', pays: 'Sao Tomé-et-Principe' },
    { code: 'USD', nom: 'Dollar américain', pays: 'Zimbabwe (usage courant)' },
    { code: 'EUR', nom: 'Euro', pays: 'Mayotte, Réunion' }
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
      toast.error('Erreur lors du chargement des pays');
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

  // PAYS - Fonctions
  const ouvrirFormulaireAjoutPays = () => {
    setModeFormulairePays('ajout');
    setPaysEnCours(null);
    setFormDataPays({ nom: '', devise: 'XOF' });
  };

  const ouvrirFormulaireEditionPays = (p) => {
    setModeFormulairePays('edition');
    setPaysEnCours(p);
    setFormDataPays({ nom: p.nom, devise: p.devise });
  };

  const fermerFormulairePays = () => {
    setModeFormulairePays(false);
    setPaysEnCours(null);
    setFormDataPays({ nom: '', devise: 'XOF' });
  };

  const sauvegarderPays = async () => {
    if (!formDataPays.nom.trim()) {
      toast.warning('Veuillez entrer un nom de pays');
      return;
    }

    try {
      if (modeFormulairePays === 'edition') {
        await paysAPI.update(paysEnCours.id, formDataPays);
        toast.success('Pays modifié avec succès !');
      } else {
        await paysAPI.create(formDataPays);
        toast.success(`Pays "${formDataPays.nom}" ajouté avec succès !`);
      }
      
      fermerFormulairePays();
      chargerPays();
    } catch (error) {
      console.error('Erreur sauvegarde pays:', error);
      toast.error('Erreur: ' + error.message);
    }
  };

  const supprimerPays = async (id, nom) => {
    if (!(await confirmDialog({ message: `Êtes-vous sûr de vouloir supprimer "${nom}" ?\n\n⚠️ ATTENTION : Toutes les villes et structures de ce pays seront aussi supprimées !`, danger: true }))) return;

    try {
      await paysAPI.delete(id);
      toast.success(`Pays "${nom}" supprimé !`);
      chargerPays();
      if (paysSelectionne === id) {
        setPaysSelectionne('');
        setVilles([]);
      }
    } catch (error) {
      console.error('Erreur suppression pays:', error);
      toast.error('Erreur: Ce pays est peut-être utilisé par des structures');
    }
  };

  // VILLES - Fonctions
  const ouvrirFormulaireAjoutVille = () => {
    setModeFormulaireVille('ajout');
    setVilleEnCours(null);
    setFormDataVille({ nom: '', pays_id: paysSelectionne });
  };

  const ouvrirFormulaireEditionVille = (v) => {
    setModeFormulaireVille('edition');
    setVilleEnCours(v);
    setFormDataVille({ nom: v.nom, pays_id: v.pays_id });
  };

  const fermerFormulaireVille = () => {
    setModeFormulaireVille(false);
    setVilleEnCours(null);
    setFormDataVille({ nom: '', pays_id: paysSelectionne });
  };

  const sauvegarderVille = async () => {
    if (!formDataVille.nom.trim() || !paysSelectionne) {
      toast.warning('Veuillez entrer un nom de ville');
      return;
    }

    try {
      if (modeFormulaireVille === 'edition') {
        await villesAPI.update(villeEnCours.id, { nom: formDataVille.nom.trim() });
        toast.success('Ville modifiée avec succès !');
      } else {
        await villesAPI.create({
          nom: formDataVille.nom.trim(),
          pays_id: paysSelectionne
        });
        toast.success(`Ville "${formDataVille.nom}" ajoutée !`);
      }
      
      fermerFormulaireVille();
      chargerVilles(paysSelectionne);
    } catch (error) {
      console.error('Erreur sauvegarde ville:', error);
      toast.error('Erreur: ' + error.message);
    }
  };

  const supprimerVille = async (id, nom) => {
    if (!(await confirmDialog({ message: `Êtes-vous sûr de vouloir supprimer "${nom}" ?`, danger: true }))) return;

    try {
      await villesAPI.delete(id);
      toast.success(`Ville "${nom}" supprimée !`);
      chargerVilles(paysSelectionne);
    } catch (error) {
      console.error('Erreur suppression ville:', error);
      toast.error('Erreur: Cette ville est peut-être utilisée par des structures');
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
          {/* Bouton Ajouter */}
          <div>
            <button 
              onClick={() => modeFormulairePays ? fermerFormulairePays() : ouvrirFormulaireAjoutPays()}
              className="btn-primary"
            >
              {modeFormulairePays ? '❌ Annuler' : '➕ Ajouter un pays'}
            </button>
          </div>

          {/* Formulaire Pays */}
          {modeFormulairePays && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                {modeFormulairePays === 'edition' ? '✏️ Modifier le pays' : '➕ Ajouter un pays'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nom du pays *</label>
                  <input
                    type="text"
                    placeholder="Ex: Nigéria"
                    className="input-field"
                    value={formDataPays.nom}
                    onChange={(e) => setFormDataPays({...formDataPays, nom: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Devise *</label>
                  <select
                    className="input-field"
                    value={formDataPays.devise}
                    onChange={(e) => setFormDataPays({...formDataPays, devise: e.target.value})}
                  >
                    {devisesAfricaines.map(d => (
                      <option key={d.code} value={d.code}>
                        {d.code} - {d.nom}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button onClick={sauvegarderPays} className="btn-primary">
                  {modeFormulairePays === 'edition' ? '💾 Enregistrer' : '➕ Ajouter'}
                </button>
                <button onClick={fermerFormulairePays} className="px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50">
                  Annuler
                </button>
              </div>
            </div>
          )}

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
                  <div className="flex gap-2">
                    <button
                      onClick={() => ouvrirFormulaireEditionPays(p)}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm font-semibold"
                    >
                      ✏️ Modifier
                    </button>
                    <button
                      onClick={() => supprimerPays(p.id, p.nom)}
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
          {/* Sélection pays */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Gérer les villes d'un pays</h3>
            <select
              className="input-field"
              value={paysSelectionne}
              onChange={(e) => {
                setPaysSelectionne(e.target.value);
                setModeFormulaireVille(false);
              }}
            >
              <option value="">Sélectionner un pays</option>
              {pays.map(p => (
                <option key={p.id} value={p.id}>{p.nom}</option>
              ))}
            </select>
          </div>

          {paysSelectionne && (
            <>
              {/* Bouton Ajouter ville */}
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
                    placeholder="Ex: Lagos"
                    className="input-field"
                    value={formDataVille.nom}
                    onChange={(e) => setFormDataVille({...formDataVille, nom: e.target.value})}
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
                  <p className="text-gray-500">Ajoutez la première ville pour ce pays</p>
                </div>
              )}
            </>
          )}

          {!paysSelectionne && (
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
          <li className="flex items-start gap-2">
            <span>💱</span>
            <span>La liste inclut toutes les devises officielles des pays africains</span>
          </li>
        </ul>
      </div>
    </AdminLayout>
  );
}