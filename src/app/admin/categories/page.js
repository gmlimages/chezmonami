// src/app/admin/categories/page.js
'use client';
import { useState, useEffect } from 'react';
import AdminLayout from '@/app/admin/AdminLayout';
import { categoriesAPI } from '@/lib/api';

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modeAjout, setModeAjout] = useState(false);
  
  const [nouvelleCategorie, setNouvelleCategorie] = useState({
    id: '',
    nom: '',
    icon: '',
    color: 'bg-blue-500'
  });

  const couleursDisponibles = [
    { value: 'bg-red-500', label: 'Rouge' },
    { value: 'bg-pink-500', label: 'Rose' },
    { value: 'bg-purple-500', label: 'Violet' },
    { value: 'bg-blue-500', label: 'Bleu' },
    { value: 'bg-green-500', label: 'Vert' },
    { value: 'bg-yellow-500', label: 'Jaune' },
    { value: 'bg-orange-500', label: 'Orange' },
    { value: 'bg-teal-500', label: 'Turquoise' },
    { value: 'bg-indigo-500', label: 'Indigo' },
    { value: 'bg-gray-500', label: 'Gris' }
  ];

  useEffect(() => {
    chargerCategories();
  }, []);

  const chargerCategories = async () => {
    try {
      setLoading(true);
      const data = await categoriesAPI.getAll();
      setCategories(data);
    } catch (error) {
      console.error('Erreur chargement:', error);
      alert('❌ Erreur lors du chargement des catégories');
    } finally {
      setLoading(false);
    }
  };

  const ajouterCategorie = async () => {
    if (!nouvelleCategorie.id || !nouvelleCategorie.nom || !nouvelleCategorie.icon) {
      alert('⚠️ Veuillez remplir tous les champs');
      return;
    }

    try {
      await categoriesAPI.create(nouvelleCategorie);
      alert('✅ Catégorie ajoutée avec succès !');
      setNouvelleCategorie({ id: '', nom: '', icon: '', color: 'bg-blue-500' });
      setModeAjout(false);
      chargerCategories();
    } catch (error) {
      console.error('Erreur ajout:', error);
      alert('❌ Erreur: ' + error.message);
    }
  };

  const supprimerCategorie = async (id) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer cette catégorie ?\n\n⚠️ ATTENTION : Toutes les structures utilisant cette catégorie seront affectées !`)) return;

    try {
      await categoriesAPI.delete(id);
      alert('✅ Catégorie supprimée avec succès !');
      chargerCategories();
    } catch (error) {
      console.error('Erreur suppression:', error);
      alert('❌ Erreur: Cette catégorie est peut-être utilisée par des structures');
    }
  };

  if (loading) {
    return (
      <AdminLayout titre="Gestion des Catégories">
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
    <AdminLayout titre="Gestion des Catégories" sousTitre={`${categories.length} catégories configurées`}>
      <div className="mb-6">
        <button 
          onClick={() => setModeAjout(!modeAjout)} 
          className="btn-primary flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          {modeAjout ? 'Annuler' : 'Ajouter une catégorie'}
        </button>
      </div>

      {/* Formulaire d'ajout */}
      {modeAjout && (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Nouvelle catégorie</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ID de la catégorie *</label>
              <input 
                type="text" 
                placeholder="Ex: coiffure" 
                className="input-field"
                value={nouvelleCategorie.id}
                onChange={(e) => setNouvelleCategorie({...nouvelleCategorie, id: e.target.value.toLowerCase().replace(/\s+/g, '_')})}
              />
              <p className="text-xs text-gray-500 mt-1">Minuscules, sans espaces (utilisez _ pour séparer)</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nom affiché *</label>
              <input 
                type="text" 
                placeholder="Ex: Coiffure" 
                className="input-field"
                value={nouvelleCategorie.nom}
                onChange={(e) => setNouvelleCategorie({...nouvelleCategorie, nom: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Icône (emoji) *</label>
              <input 
                type="text" 
                placeholder="Ex: 💇" 
                className="input-field text-2xl"
                maxLength="2"
                value={nouvelleCategorie.icon}
                onChange={(e) => setNouvelleCategorie({...nouvelleCategorie, icon: e.target.value})}
              />
              <p className="text-xs text-gray-500 mt-1">Utilisez un emoji (Windows: Win + . / Mac: Cmd + Ctrl + Espace)</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Couleur *</label>
              <select 
                className="input-field"
                value={nouvelleCategorie.color}
                onChange={(e) => setNouvelleCategorie({...nouvelleCategorie, color: e.target.value})}
              >
                {couleursDisponibles.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Aperçu */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-700 mb-3">Aperçu :</p>
            <div className={`inline-block px-4 py-2 rounded-full text-white ${nouvelleCategorie.color}`}>
              <span className="text-xl mr-2">{nouvelleCategorie.icon || '❓'}</span>
              <span className="font-semibold">{nouvelleCategorie.nom || 'Nom de catégorie'}</span>
            </div>
          </div>

          <div className="flex gap-4 mt-6">
            <button onClick={ajouterCategorie} className="btn-primary flex-1">
              Ajouter la catégorie
            </button>
            <button 
              onClick={() => {
                setModeAjout(false);
                setNouvelleCategorie({ id: '', nom: '', icon: '', color: 'bg-blue-500' });
              }} 
              className="px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Liste des catégories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((categorie) => (
          <div key={categorie.id} className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div className={`px-4 py-2 rounded-full text-white ${categorie.color}`}>
                <span className="text-2xl mr-2">{categorie.icon}</span>
                <span className="font-bold">{categorie.nom}</span>
              </div>
              <button 
                onClick={() => supprimerCategorie(categorie.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>

            <div className="text-sm text-gray-600">
              <p><strong>ID :</strong> {categorie.id}</p>
              <p><strong>Classe CSS :</strong> {categorie.color}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Avertissement */}
      <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-xl p-6">
        <h3 className="text-lg font-bold text-yellow-900 mb-3">⚠️ Important</h3>
        <ul className="text-sm text-yellow-800 space-y-2">
          <li className="flex items-start gap-2">
            <span>•</span>
            <span>Les catégories sont utilisées par les structures. Supprimer une catégorie peut affecter les structures existantes.</span>
          </li>
          <li className="flex items-start gap-2">
            <span>•</span>
            <span>L'ID de catégorie ne peut pas être modifié après création (limitation de sécurité).</span>
          </li>
          <li className="flex items-start gap-2">
            <span>•</span>
            <span>Utilisez des emojis simples pour les icônes pour une meilleure compatibilité.</span>
          </li>
        </ul>
      </div>
    </AdminLayout>
  );
}