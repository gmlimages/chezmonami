// src/app/admin/chambres/page.js - VERSION SIMPLIFIÉE (comme produits)
'use client';
import { useState, useEffect } from 'react';
import AdminLayout from '@/app/admin/AdminLayout';
import ImageUploader from '@/components/ImageUploader';
import { chambresAPI, structuresAPI } from '@/lib/api';

// Types de chambres disponibles
const TYPES_CHAMBRES = [
  { value: 'simple', label: 'Chambre Simple', icon: '🛏️' },
  { value: 'double', label: 'Chambre Double', icon: '🛏️🛏️' },
  { value: 'twin', label: 'Chambre Twin', icon: '🛏️🛏️' },
  { value: 'familiale', label: 'Chambre Familiale', icon: '👨‍👩‍👧‍👦' },
  { value: 'suite', label: 'Suite', icon: '🏰' },
  { value: 'vip', label: 'Suite VIP', icon: '👑' },
];

// Équipements disponibles
const EQUIPEMENTS = [
  { value: 'wifi', label: 'WiFi', icon: '📶' },
  { value: 'climatisation', label: 'Climatisation', icon: '❄️' },
  { value: 'tv', label: 'TV', icon: '📺' },
  { value: 'balcon', label: 'Balcon', icon: '🌅' },
  { value: 'vue_mer', label: 'Vue mer', icon: '🌊' },
  { value: 'vue_fleuve', label: 'Vue fleuve', icon: '🌊' },
  { value: 'minibar', label: 'Minibar', icon: '🍷' },
  { value: 'coffre_fort', label: 'Coffre-fort', icon: '🔒' },
  { value: 'bureau', label: 'Bureau', icon: '🖊️' },
  { value: 'jacuzzi', label: 'Jacuzzi', icon: '🛁' },
  { value: 'douche', label: 'Douche', icon: '🚿' },
];

export default function AdminChambres() {
  const [mode, setMode] = useState('liste');
  const [chambreEnCours, setChambreEnCours] = useState(null);
  const [chambres, setChambres] = useState([]);
  const [structures, setStructures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recherche, setRecherche] = useState('');
  
  const [formData, setFormData] = useState({
    nom_affiche: '',
    description: '',
    type_chambre: 'simple',
    structure_id: '',
    disponible: true,
    prix_standard: '',
    prix_min: '',
    prix_max: '',
    equipements: [],
    images: []
  });

  useEffect(() => {
    chargerDonnees();
  }, []);

  const chargerDonnees = async () => {
    try {
      setLoading(true);
      const [chambresData, structuresData] = await Promise.all([
        chambresAPI.getAll(),
        structuresAPI.getAll()
      ]);
      setChambres(chambresData);
      // Filtrer uniquement les hôtels/appartements
      // Option 1 : Afficher TOUTES les structures (temporaire pour debug)
      setStructures(structuresData);

      // OU Option 2 : Vérifier aussi par ID de catégorie
      const hotelsApparts = structuresData.filter(s => {
        const nomCategorie = s.categorie?.nom?.toLowerCase() || '';
        const idCategorie = s.categorie_id?.toLowerCase() || '';
        return nomCategorie.includes('hotel') || 
              nomCategorie.includes('appartement') ||
              idCategorie.includes('hotel') ||
              idCategorie.includes('appartement');
      });
      setStructures(hotelsApparts);
    } catch (error) {
      console.error('Erreur chargement:', error);
      alert('❌ Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const ajouterChambre = () => {
    setChambreEnCours(null);
    setFormData({
      nom_affiche: '',
      description: '',
      type_chambre: 'simple',
      structure_id: '',
      disponible: true,
      prix_standard: '',
      prix_min: '',
      prix_max: '',
      equipements: [],
      images: []
    });
    setMode('formulaire');
  };

  const modifierChambre = (chambre) => {
    setChambreEnCours(chambre);
    setFormData({
      nom_affiche: chambre.nom_affiche,
      description: chambre.description || '',
      type_chambre: chambre.type_chambre,
      structure_id: chambre.structure_id,
      disponible: chambre.disponible,
      prix_standard: chambre.prix_standard,
      prix_min: chambre.prix_min || '',
      prix_max: chambre.prix_max || '',
      equipements: chambre.equipements || [],
      images: chambre.images || []
    });
    setMode('formulaire');
  };

  const supprimerChambre = async (id) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette chambre ?')) return;

    try {
      await chambresAPI.delete(id);
      alert('✅ Chambre supprimée avec succès !');
      chargerDonnees();
    } catch (error) {
      console.error('Erreur suppression:', error);
      alert('❌ Erreur lors de la suppression');
    }
  };

  const sauvegarderChambre = async () => {
  if (!formData.nom_affiche || !formData.structure_id || !formData.prix_standard) {
    alert('⚠️ Veuillez remplir tous les champs obligatoires');
    return;
  }

  try {
    // Récupérer la structure pour avoir la devise
    const structureSelectionnee = structures.find(s => s.id === formData.structure_id);
    
    const chambreData = {
      nom_affiche: formData.nom_affiche,
      description: formData.description,
      type_chambre: formData.type_chambre,
      structure_id: formData.structure_id,
      disponible: formData.disponible,
      prix_standard: parseFloat(formData.prix_standard),
      prix_min: formData.prix_min ? parseFloat(formData.prix_min) : null,
      prix_max: formData.prix_max ? parseFloat(formData.prix_max) : null,
      devise: structureSelectionnee?.pays?.devise || 'MAD', // ← AJOUT
      equipements: formData.equipements,
      
      images: formData.images
    };

          if (chambreEnCours) {
      await chambresAPI.update(chambreEnCours.id, chambreData);
      alert('✅ Chambre modifiée avec succès !');
    } else {
      await chambresAPI.create(chambreData);
      alert('✅ Chambre ajoutée avec succès !');
    }
      
      chargerDonnees();
      setMode('liste');
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      alert('❌ Erreur: ' + error.message);
    }
  };

  const chambresFiltrees = chambres.filter(c => {
    if (!recherche) return true;
    const searchLower = recherche.toLowerCase();
    return (
      c.nom_affiche.toLowerCase().includes(searchLower) ||
      c.type_chambre.toLowerCase().includes(searchLower) ||
      (c.structure?.nom || '').toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <AdminLayout titre="Gestion des Chambres">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // MODE FORMULAIRE
  if (mode === 'formulaire') {
    const typeInfo = TYPES_CHAMBRES.find(t => t.value === formData.type_chambre);
    
    return (
      <AdminLayout titre={chambreEnCours ? 'Modifier la chambre' : 'Ajouter une chambre'}>
        <div className="max-w-4xl">
          <button onClick={() => setMode('liste')} className="mb-6 flex items-center gap-2 text-primary hover:text-primary-dark">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Retour à la liste
          </button>

          <div className="bg-white rounded-xl shadow-lg p-8 space-y-6">
            {/* Hôtel */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Hôtel / Appartement *</label>
              <select 
                className="input-field" 
                value={formData.structure_id} 
                onChange={(e) => setFormData({...formData, structure_id: e.target.value})}
              >
                <option value="">Choisir un établissement</option>
                {structures.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.nom} - {s.ville?.nom}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type de chambre *</label>
                <select
                  className="input-field"
                  value={formData.type_chambre}
                  onChange={(e) => setFormData({...formData, type_chambre: e.target.value})}
                >
                  {TYPES_CHAMBRES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.icon} {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Statut */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Statut *</label>
                <select
                  className="input-field"
                  value={formData.disponible}
                  onChange={(e) => setFormData({...formData, disponible: e.target.value === 'true'})}
                >
                  <option value="true">✅ Disponible</option>
                  <option value="false">❌ Occupé / Complet</option>
                </select>
              </div>

              {/* Nom */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Nom commercial *</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={formData.nom_affiche} 
                  onChange={(e) => setFormData({...formData, nom_affiche: e.target.value})}
                  placeholder={`Ex: ${typeInfo.label} Confort avec vue mer`}
                />
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea 
                  rows="3" 
                  className="input-field" 
                  value={formData.description} 
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Décrivez les spécificités de cette chambre..."
                />
              </div>
            </div>

            {/* PRIX */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                💰 Tarification ({structures.find(s => s.id === formData.structure_id)?.pays?.devise || 'MAD'} / nuit)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Prix standard *</label>
                  <input 
                    type="number" 
                    step="0.01"
                    className="input-field" 
                    value={formData.prix_standard} 
                    onChange={(e) => setFormData({...formData, prix_standard: e.target.value})}
                    placeholder="500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Prix affiché principal</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Prix minimum</label>
                  <input 
                    type="number" 
                    step="0.01"
                    className="input-field" 
                    value={formData.prix_min} 
                    onChange={(e) => setFormData({...formData, prix_min: e.target.value})}
                    placeholder="400"
                  />
                  <p className="text-xs text-gray-500 mt-1">Basse saison (optionnel)</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Prix maximum</label>
                  <input 
                    type="number" 
                    step="0.01"
                    className="input-field" 
                    value={formData.prix_max} 
                    onChange={(e) => setFormData({...formData, prix_max: e.target.value})}
                    placeholder="600"
                  />
                  <p className="text-xs text-gray-500 mt-1">Haute saison (optionnel)</p>
                </div>
              </div>
              
              {/* Aperçu fourchette */}
            {formData.prix_min && formData.prix_max && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
                <strong>Affichage client :</strong> De {formData.prix_min} à {formData.prix_max} {structures.find(s => s.id === formData.structure_id)?.pays?.devise || 'MAD'} / nuit
              </div>
            )}
            </div>

            {/* ÉQUIPEMENTS */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">🛋️ Équipements</h3>
              <div className="grid md:grid-cols-3 gap-3">
                {EQUIPEMENTS.map(equip => (
                  <label
                    key={equip.value}
                    className="flex items-center gap-2 p-3 border-2 border-gray-200 rounded-lg hover:border-primary cursor-pointer transition"
                  >
                    <input
                      type="checkbox"
                      checked={formData.equipements.includes(equip.value)}
                      onChange={(e) => {
                        const newEquipements = e.target.checked
                          ? [...formData.equipements, equip.value]
                          : formData.equipements.filter(eq => eq !== equip.value);
                        setFormData({...formData, equipements: newEquipements});
                      }}
                      className="w-4 h-4 text-primary"
                    />
                    <span className="text-lg">{equip.icon}</span>
                    <span className="text-sm text-gray-700">{equip.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* IMAGES */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">📸 Photos de la chambre</h3>
              <ImageUploader
                images={formData.images}
                onChange={(newImages) => setFormData({...formData, images: newImages})}
                maxImages={10}
              />
            </div>

            {/* BOUTONS */}
            <div className="flex gap-4 pt-6">
              <button onClick={sauvegarderChambre} className="flex-1 btn-primary">
                {chambreEnCours ? 'Modifier' : 'Ajouter'} la chambre
              </button>
              <button onClick={() => setMode('liste')} className="px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50">
                Annuler
              </button>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // MODE LISTE - À ajouter après "return null;" dans le fichier PART1

  // MODE LISTE
  return (
    <AdminLayout titre="Gestion des Chambres" sousTitre={`${chambres.length} chambres enregistrées`}>
      <div className="mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
        <button onClick={ajouterChambre} className="btn-primary flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Ajouter une chambre
        </button>

        <div className="relative flex-1 max-w-md">
          <svg className="absolute left-3 top-3 text-gray-400" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Rechercher une chambre..."
            className="input-field pl-10"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Chambre</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Type</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Hôtel</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Prix</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Statut</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Équipements</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {chambresFiltrees.map((chambre) => {
                const typeInfo = TYPES_CHAMBRES.find(t => t.value === chambre.type_chambre) || TYPES_CHAMBRES[0];
                const statutClass = chambre.disponible 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800';
                
                return (
                  <tr key={chambre.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {chambre.images?.[0] ? (
                          <img src={chambre.images[0]} alt={chambre.nom_affiche} className="w-16 h-16 rounded object-cover" />
                        ) : (
                          <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center text-3xl">
                            {typeInfo.icon}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-gray-800">{chambre.nom_affiche}</p>
                          {chambre.description && (
                            <p className="text-xs text-gray-500 line-clamp-1">{chambre.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">
                        {typeInfo.icon} {typeInfo.label}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-800">{chambre.structure?.nom}</p>
                      <p className="text-xs text-gray-500">{chambre.structure?.ville?.nom}</p>
                    </td>
                    
                    <td className="px-6 py-4">
                      {chambre.prix_min && chambre.prix_max ? (
                        <div>
                          <p className="text-sm font-semibold text-gray-800">
                            {chambre.prix_min} - {chambre.prix_max} MAD
                          </p>
                          <p className="text-xs text-gray-500">Standard: {chambre.prix_standard} MAD</p>
                        </div>
                      ) : (
                        <p className="text-sm font-semibold text-gray-800">{chambre.prix_standard} MAD / nuit</p>
                      )}
                    </td>
                    
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${statutClass}`}>
                        {chambre.disponible ? '✅ Disponible' : '❌ Occupé'}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4">
                      {chambre.equipements && chambre.equipements.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {chambre.equipements.slice(0, 4).map(eq => {
                            const equipInfo = EQUIPEMENTS.find(e => e.value === eq);
                            return equipInfo ? (
                              <span key={eq} className="text-lg" title={equipInfo.label}>
                                {equipInfo.icon}
                              </span>
                            ) : null;
                          })}
                          {chambre.equipements.length > 4 && (
                            <span className="text-xs text-gray-500">+{chambre.equipements.length - 4}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">Aucun</span>
                      )}
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => modifierChambre(chambre)} 
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                          title="Modifier"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button 
                          onClick={() => supprimerChambre(chambre.id)} 
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                          title="Supprimer"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {chambresFiltrees.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl shadow mt-6">
          <div className="text-6xl mb-4">🏨</div>
          <p className="text-xl text-gray-600 mb-2">Aucune chambre trouvée</p>
          {recherche ? (
            <p className="text-gray-500">Essayez avec d'autres termes de recherche</p>
          ) : (
            <button onClick={ajouterChambre} className="mt-4 btn-primary">
              Ajouter votre première chambre
            </button>
          )}
        </div>
      )}
    </AdminLayout>
  );
}