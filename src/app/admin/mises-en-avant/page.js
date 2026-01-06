// src/app/admin/mises-en-avant/page.js - VERSION CORRIGÉE RELATION
'use client';
import { useState, useEffect } from 'react';
import AdminLayout from '@/app/admin/AdminLayout';
import { supabase } from '@/lib/supabase';
import { structuresAPI } from '@/lib/api';

const POSITIONS = [
  { value: 'accueil', label: 'Page d\'accueil', icon: '🏠' },
  { value: 'listing', label: 'Page listing', icon: '📋' },
  { value: 'tous', label: 'Partout', icon: '🌟' }
];

export default function AdminMisesEnAvant() {
  const [mode, setMode] = useState('liste');
  const [misesEnAvant, setMisesEnAvant] = useState([]);
  const [structures, setStructures] = useState([]);
  const [miseEnCours, setMiseEnCours] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recherche, setRecherche] = useState('');
  const [filtrePosition, setFiltrePosition] = useState('tous');
  
  const [formData, setFormData] = useState({
    element_type: 'structure',
    element_id: '',
    position: 'accueil',
    ordre: 1,
    titre: '',
    date_debut: '',
    date_fin: '',
    actif: true
  });

  useEffect(() => {
    chargerDonnees();
  }, []);

  const chargerDonnees = async () => {
    try {
      setLoading(true);
      
      console.log('🔄 Chargement mises en avant...');
      
      // Charger SANS relation d'abord
      const { data: misesData, error: misesError } = await supabase
        .from('mises_en_avant')
        .select('*')
        .order('ordre', { ascending: true });

      if (misesError) {
        console.error('❌ Erreur:', misesError);
        throw misesError;
      }

      console.log('✅ Mises en avant:', misesData?.length);

      // Charger structures séparément
      const structuresData = await structuresAPI.getAll();
      console.log('✅ Structures:', structuresData.length);
      
      // Enrichir les mises en avant avec les structures
      const misesEnrichies = misesData.map(mise => {
        const structure = structuresData.find(s => s.id === mise.element_id);
        return {
          ...mise,
          structure: structure || null
        };
      });
      
      setMisesEnAvant(misesEnrichies);
      setStructures(structuresData);
    } catch (error) {
      console.error('❌ Erreur:', error);
      alert(`❌ Erreur: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const ajouterMise = () => {
    setMiseEnCours(null);
    const today = new Date().toISOString().split('T')[0];
    setFormData({
      element_type: 'structure',
      element_id: structures[0]?.id || '',
      position: 'accueil',
      ordre: misesEnAvant.length + 1,
      titre: '',
      date_debut: today,
      date_fin: '',
      actif: true
    });
    setMode('formulaire');
  };

  const modifierMise = (mise) => {
    setMiseEnCours(mise);
    setFormData({
      element_type: mise.element_type,
      element_id: mise.element_id,
      position: mise.position,
      ordre: mise.ordre,
      titre: mise.titre || '',
      date_debut: mise.date_debut?.split('T')[0] || '',
      date_fin: mise.date_fin?.split('T')[0] || '',
      actif: mise.actif
    });
    setMode('formulaire');
  };

  const supprimerMise = async (id) => {
    if (!confirm('Supprimer cette mise en avant ?')) return;

    try {
      const { error } = await supabase
        .from('mises_en_avant')
        .delete()
        .eq('id', id);

      if (error) throw error;
      alert('✅ Supprimée !');
      chargerDonnees();
    } catch (error) {
      console.error('❌ Erreur:', error);
      alert(`❌ Erreur: ${error.message}`);
    }
  };

  const toggleActif = async (id, actif) => {
    try {
      const { error } = await supabase
        .from('mises_en_avant')
        .update({ actif: !actif })
        .eq('id', id);

      if (error) throw error;
      chargerDonnees();
    } catch (error) {
      console.error('❌ Erreur:', error);
    }
  };

  const sauvegarder = async () => {
    if (!formData.element_id || !formData.position) {
      alert('⚠️ Remplissez tous les champs obligatoires');
      return;
    }

    try {
      const dataToSave = {
        element_type: formData.element_type,
        element_id: formData.element_id,
        position: formData.position,
        ordre: parseInt(formData.ordre),
        titre: formData.titre || null,
        date_debut: formData.date_debut || new Date().toISOString(),
        date_fin: formData.date_fin || null,
        actif: formData.actif
      };

      let result;
      if (miseEnCours) {
        result = await supabase
          .from('mises_en_avant')
          .update(dataToSave)
          .eq('id', miseEnCours.id)
          .select();
      } else {
        result = await supabase
          .from('mises_en_avant')
          .insert(dataToSave)
          .select();
      }

      if (result.error) throw result.error;

      alert(`✅ ${miseEnCours ? 'Modifiée' : 'Ajoutée'} !`);
      setMode('liste');
      chargerDonnees();
    } catch (error) {
      console.error('❌ Erreur:', error);
      alert(`❌ Erreur: ${error.message}`);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'Permanent';
    return new Date(date).toLocaleDateString('fr-FR');
  };

  const misesFiltrees = misesEnAvant.filter(m => {
    const matchRecherche = !recherche || 
      m.structure?.nom.toLowerCase().includes(recherche.toLowerCase());
    const matchPosition = filtrePosition === 'tous' || m.position === filtrePosition;
    return matchRecherche && matchPosition;
  });

  const stats = {
    total: misesEnAvant.length,
    actives: misesEnAvant.filter(m => m.actif).length,
    accueil: misesEnAvant.filter(m => m.position === 'accueil').length,
    listing: misesEnAvant.filter(m => m.position === 'listing').length
  };

  if (loading) {
    return (
      <AdminLayout titre="Mises en Avant">
        <div className="text-center py-12">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Chargement...</p>
        </div>
      </AdminLayout>
    );
  }

  // Mode formulaire
  if (mode === 'formulaire') {
    const structureSelectionnee = structures.find(s => s.id === formData.element_id);

    return (
      <AdminLayout titre={miseEnCours ? 'Modifier' : 'Nouvelle mise en avant'}>
        <div className="max-w-4xl mx-auto">
          <button onClick={() => setMode('liste')} className="mb-6 flex items-center gap-2 text-primary hover:underline">
            ← Retour
          </button>

          <div className="card">
            <div className="space-y-6">
              {/* Structure */}
              <div>
                <label className="block text-sm font-medium mb-2">Structure *</label>
                <select
                  className="input-field"
                  value={formData.element_id}
                  onChange={(e) => setFormData({...formData, element_id: e.target.value})}
                >
                  <option value="">-- Sélectionner --</option>
                  {structures.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.nom} - {s.ville?.nom}
                    </option>
                  ))}
                </select>

                {structureSelectionnee && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg flex items-center gap-4">
                    {structureSelectionnee.images?.[0] && (
                      <img
                        src={structureSelectionnee.images[0]}
                        alt={structureSelectionnee.nom}
                        className="w-20 h-20 rounded object-cover"
                      />
                    )}
                    <div>
                      <p className="font-bold">{structureSelectionnee.nom}</p>
                      <p className="text-sm text-gray-600">
                        {structureSelectionnee.ville?.nom}, {structureSelectionnee.pays?.nom}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Position */}
              <div>
                <label className="block text-sm font-medium mb-2">Position *</label>
                <div className="grid grid-cols-3 gap-4">
                  {POSITIONS.map(pos => (
                    <button
                      key={pos.value}
                      type="button"
                      onClick={() => setFormData({...formData, position: pos.value})}
                      className={`p-4 border-2 rounded-lg text-center transition ${
                        formData.position === pos.value
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200 hover:border-primary'
                      }`}
                    >
                      <div className="text-3xl mb-2">{pos.icon}</div>
                      <div className="text-sm font-semibold">{pos.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Ordre */}
              <div>
                <label className="block text-sm font-medium mb-2">Ordre *</label>
                <input
                  type="number"
                  min="1"
                  className="input-field"
                  value={formData.ordre}
                  onChange={(e) => setFormData({...formData, ordre: e.target.value})}
                />
              </div>

              {/* Titre */}
              <div>
                <label className="block text-sm font-medium mb-2">Titre (optionnel)</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Laissez vide pour utiliser le nom"
                  value={formData.titre}
                  onChange={(e) => setFormData({...formData, titre: e.target.value})}
                />
              </div>

              {/* Dates */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Date début *</label>
                  <input
                    type="date"
                    className="input-field"
                    value={formData.date_debut}
                    onChange={(e) => setFormData({...formData, date_debut: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Date fin (optionnel)</label>
                  <input
                    type="date"
                    className="input-field"
                    value={formData.date_fin}
                    onChange={(e) => setFormData({...formData, date_fin: e.target.value})}
                  />
                </div>
              </div>

              {/* Actif */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="actif"
                  className="w-5 h-5"
                  checked={formData.actif}
                  onChange={(e) => setFormData({...formData, actif: e.target.checked})}
                />
                <label htmlFor="actif" className="font-medium">Activer</label>
              </div>
            </div>

            <div className="flex gap-4 pt-6 border-t mt-6">
              <button onClick={sauvegarder} className="btn-primary flex-1">
                {miseEnCours ? 'Modifier' : 'Ajouter'}
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

  // Mode liste
  return (
    <AdminLayout titre="Mises en Avant" sousTitre={`${misesEnAvant.length} mises en avant`}>
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card bg-blue-50">
          <p className="text-sm text-gray-600 mb-1">Total</p>
          <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
        </div>
        <div className="card bg-green-50">
          <p className="text-sm text-gray-600 mb-1">Actives</p>
          <p className="text-2xl font-bold text-green-600">{stats.actives}</p>
        </div>
        <div className="card bg-purple-50">
          <p className="text-sm text-gray-600 mb-1">Accueil</p>
          <p className="text-2xl font-bold text-purple-600">{stats.accueil}</p>
        </div>
        <div className="card bg-orange-50">
          <p className="text-sm text-gray-600 mb-1">Listing</p>
          <p className="text-2xl font-bold text-orange-600">{stats.listing}</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="mb-6 flex gap-4">
        <button onClick={ajouterMise} className="btn-primary">+ Ajouter</button>
        <select className="input-field" value={filtrePosition} onChange={(e) => setFiltrePosition(e.target.value)}>
          <option value="tous">Toutes positions</option>
          {POSITIONS.map(pos => (
            <option key={pos.value} value={pos.value}>{pos.icon} {pos.label}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Rechercher..."
          className="input-field flex-1"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
        />
      </div>

      {/* Liste */}
      {misesFiltrees.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl shadow">
          <div className="text-6xl mb-4">⭐</div>
          <p className="text-xl text-gray-600">Aucune mise en avant</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {misesFiltrees.map((mise) => {
            const structure = mise.structure;
            const position = POSITIONS.find(p => p.value === mise.position);

            return (
              <div key={mise.id} className="bg-white rounded-xl shadow p-6 flex items-center gap-6">
                <div className="font-bold text-3xl text-gray-400">#{mise.ordre}</div>
                
                {structure && structure.images?.[0] && (
                  <img src={structure.images[0]} alt={structure.nom} className="w-24 h-24 rounded object-cover" />
                )}
                
                <div className="flex-1">
                  <h3 className="font-bold text-lg">{structure?.nom || 'Structure supprimée'}</h3>
                  {structure && (
                    <p className="text-sm text-gray-600">{structure.ville?.nom}, {structure.pays?.nom}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    <span className="px-3 py-1 bg-gray-100 rounded-full text-sm font-semibold">
                      {position?.icon} {position?.label}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${mise.actif ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {mise.actif ? '✓ Active' : '○ Inactive'}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => toggleActif(mise.id, mise.actif)} className="p-2 text-blue-600 hover:bg-blue-50 rounded">
                    {mise.actif ? '⏸️' : '▶️'}
                  </button>
                  <button onClick={() => modifierMise(mise)} className="p-2 text-blue-600 hover:bg-blue-50 rounded">
                    ✏️
                  </button>
                  <button onClick={() => supprimerMise(mise.id)} className="p-2 text-red-600 hover:bg-red-50 rounded">
                    🗑️
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AdminLayout>
  );
}