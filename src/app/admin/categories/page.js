// src/app/admin/categories/page.js
'use client';
import { useState, useEffect } from 'react';
import AdminLayout from '@/app/admin/AdminLayout';
import { categoriesAPI } from '@/lib/api';

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modeFormulaire, setModeFormulaire] = useState(false); // false, 'ajout', 'edition'
  const [categorieEnCours, setCategorieEnCours] = useState(null);
  
  const [formData, setFormData] = useState({
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

  const ouvrirFormulaireAjout = () => {
    setModeFormulaire('ajout');
    setCategorieEnCours(null);
    setFormData({ id: '', nom: '', icon: '', color: 'bg-blue-500' });
  };

  const ouvrirFormulaireEdition = (categorie) => {
    setModeFormulaire('edition');
    setCategorieEnCours(categorie);
    setFormData({
      id: categorie.id,
      nom: categorie.nom,
      icon: categorie.icon,
      color: categorie.color
    });
  };

  const fermerFormulaire = () => {
    setModeFormulaire(false);
    setCategorieEnCours(null);
    setFormData({ id: '', nom: '', icon: '', color: 'bg-blue-500' });
  };

  const sauvegarderCategorie = async () => {
    if (!formData.id || !formData.nom || !formData.icon) {
      alert('⚠️ Veuillez remplir tous les champs');
      return;
    }

    try {
      if (modeFormulaire === 'edition') {
        // Modification
        await categoriesAPI.update(categorieEnCours.id, {
          nom: formData.nom,
          icon: formData.icon,
          color: formData.color
        });
        alert('✅ Catégorie modifiée avec succès !');
      } else {
        // Ajout
        await categoriesAPI.create(formData);
        alert('✅ Catégorie ajoutée avec succès !');
      }
      
      fermerFormulaire();
      chargerCategories();
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
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
          onClick={() => modeFormulaire ? fermerFormulaire() : ouvrirFormulaireAjout()} 
          className="btn-primary flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={modeFormulaire ? "M6 18L18 6M6 6l12 12" : "M12 4v16m8-8H4"} />
          </svg>
          {modeFormulaire ? 'Annuler' : 'Ajouter une catégorie'}
        </button>
      </div>

      {/* Formulaire (Ajout ou Édition) */}
      {modeFormulaire && (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            {modeFormulaire === 'edition' ? '✏️ Modifier la catégorie' : '➕ Nouvelle catégorie'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ID de la catégorie *</label>
              <input 
                type="text" 
                placeholder="Ex: coiffure" 
                className="input-field"
                value={formData.id}
                onChange={(e) => setFormData({...formData, id: e.target.value.toLowerCase().replace(/\s+/g, '_')})}
                disabled={modeFormulaire === 'edition'}
              />
              <p className="text-xs text-gray-500 mt-1">
                {modeFormulaire === 'edition' 
                  ? "L'ID ne peut pas être modifié" 
                  : "Minuscules, sans espaces (utilisez _ pour séparer)"}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nom affiché *</label>
              <input 
                type="text" 
                placeholder="Ex: Coiffure" 
                className="input-field"
                value={formData.nom}
                onChange={(e) => setFormData({...formData, nom: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Icône (emoji) *</label>
              <input 
                type="text" 
                placeholder="Ex: 💇" 
                className="input-field text-2xl"
                maxLength="2"
                value={formData.icon}
                onChange={(e) => setFormData({...formData, icon: e.target.value})}
              />
              <p className="text-xs text-gray-500 mt-1">Utilisez un emoji (Windows: Win + . / Mac: Cmd + Ctrl + Espace)</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Couleur *</label>
              <select 
                className="input-field"
                value={formData.color}
                onChange={(e) => setFormData({...formData, color: e.target.value})}
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
            <div className={`inline-block px-4 py-2 rounded-full text-white ${formData.color}`}>
              <span className="text-xl mr-2">{formData.icon || '❓'}</span>
              <span className="font-semibold">{formData.nom || 'Nom de catégorie'}</span>
            </div>
          </div>

          <div className="flex gap-4 mt-6">
            <button onClick={sauvegarderCategorie} className="btn-primary flex-1">
              {modeFormulaire === 'edition' ? '💾 Enregistrer' : '➕ Ajouter'}
            </button>
            <button 
              onClick={fermerFormulaire} 
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
            </div>

            <div className="text-sm text-gray-600 mb-4">
              <p><strong>ID :</strong> {categorie.id}</p>
              <p><strong>Classe CSS :</strong> {categorie.color}</p>
            </div>

            {/* Boutons d'action */}
            <div className="flex gap-2">
              <button 
                onClick={() => ouvrirFormulaireEdition(categorie)}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm font-semibold flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Modifier
              </button>
              <button 
                onClick={() => supprimerCategorie(categorie.id)}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-sm font-semibold"
              >
                🗑️
              </button>
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
            <span>Vous pouvez modifier le nom, l'icône et la couleur à tout moment.</span>
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