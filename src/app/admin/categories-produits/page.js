// src/app/admin/categories-produits/page.js
'use client';
import { useState, useEffect } from 'react';
import AdminLayout from '@/app/admin/AdminLayout';
import { categoriesProduitsAPI } from '@/lib/api';

export default function CategoriesProduitsAdmin() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFormulaire, setShowFormulaire] = useState(false);
  const [modeEdition, setModeEdition] = useState(false);
  const [categorieEnCours, setCategorieEnCours] = useState(null);
  const [formData, setFormData] = useState({
    nom: '',
    icon: '📦',
    color: '#FF6B35',
    description: '',
    actif: true
  });

  useEffect(() => {
    chargerCategories();
  }, []);

  const chargerCategories = async () => {
    try {
      setLoading(true);
      const data = await categoriesProduitsAPI.getAll();
      setCategories(data);
    } catch (error) {
      console.error('Erreur chargement catégories:', error);
      alert('Erreur lors du chargement des catégories');
    } finally {
      setLoading(false);
    }
  };

  const ouvrirFormulaire = (categorie = null) => {
    if (categorie) {
      setModeEdition(true);
      setCategorieEnCours(categorie);
      setFormData({
        nom: categorie.nom,
        icon: categorie.icon,
        color: categorie.color,
        description: categorie.description || '',
        actif: categorie.actif
      });
    } else {
      setModeEdition(false);
      setCategorieEnCours(null);
      setFormData({
        nom: '',
        icon: '📦',
        color: '#FF6B35',
        description: '',
        actif: true
      });
    }
    setShowFormulaire(true);
  };

  const fermerFormulaire = () => {
    setShowFormulaire(false);
    setModeEdition(false);
    setCategorieEnCours(null);
    setFormData({
      nom: '',
      icon: '📦',
      color: '#FF6B35',
      description: '',
      actif: true
    });
  };

  const sauvegarderCategorie = async (e) => {
    e.preventDefault();

    if (!formData.nom.trim()) {
      alert('Le nom est obligatoire');
      return;
    }

    try {
      if (modeEdition && categorieEnCours) {
        await categoriesProduitsAPI.update(categorieEnCours.id, formData);
        alert('✅ Catégorie modifiée avec succès !');
      } else {
        await categoriesProduitsAPI.create(formData);
        alert('✅ Catégorie créée avec succès !');
      }
      
      await chargerCategories();
      fermerFormulaire();
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      alert('❌ Erreur lors de la sauvegarde: ' + error.message);
    }
  };

  const supprimerCategorie = async (id, nom) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer la catégorie "${nom}" ?`)) {
      return;
    }

    try {
      await categoriesProduitsAPI.delete(id);
      alert('✅ Catégorie supprimée avec succès !');
      await chargerCategories();
    } catch (error) {
      console.error('Erreur suppression:', error);
      alert('❌ Erreur lors de la suppression: ' + error.message);
    }
  };

  const emojis = ['📦', '📱', '👕', '🍕', '🏠', '💄', '⚽', '📚', '💍', '👶', '🚗', '🌿', '🖊️', '🍾', '🎨', '🎮', '🎧', '📷', '🏋️', '🎪'];
  const colors = [
    { nom: 'Bleu', value: '#3B82F6' },
    { nom: 'Rose', value: '#EC4899' },
    { nom: 'Vert', value: '#10B981' },
    { nom: 'Orange', value: '#F59E0B' },
    { nom: 'Violet', value: '#8B5CF6' },
    { nom: 'Rouge', value: '#EF4444' },
    { nom: 'Indigo', value: '#6366F1' },
    { nom: 'Cyan', value: '#06B6D4' },
    { nom: 'Emeraude', value: '#10B981' },
    { nom: 'Gris', value: '#6B7280' }
  ];

  if (loading) {
    return (
      <AdminLayout titre="Catégories Produits">
        <div className="text-center py-12">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Chargement des catégories...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout titre="🏷️ Catégories Produits" sousTitre="Gérez les catégories de votre boutique">
      {/* Bouton nouvelle catégorie */}
      <div className="mb-6 flex justify-end">
        <button
          onClick={() => ouvrirFormulaire()}
          className="btn-primary"
        >
          ➕ Nouvelle catégorie
        </button>
      </div>

      {/* Liste des catégories */}
      {categories.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl shadow">
          <div className="text-6xl mb-4">📦</div>
          <p className="text-xl text-gray-600 mb-4">Aucune catégorie</p>
          <button onClick={() => ouvrirFormulaire()} className="btn-primary">
            Créer la première catégorie
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map(cat => (
            <div
              key={cat.id}
              className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition"
              style={{ borderLeft: `4px solid ${cat.color}` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{cat.icon}</span>
                  <div>
                    <h3 className="font-bold text-lg text-gray-800">{cat.nom}</h3>
                    {cat.description && (
                      <p className="text-sm text-gray-600 mt-1">{cat.description}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4">
                <button
                  onClick={() => ouvrirFormulaire(cat)}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm"
                >
                  ✏️ Modifier
                </button>
                <button
                  onClick={() => supprimerCategorie(cat.id, cat.nom)}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-sm"
                >
                  🗑️ Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Formulaire */}
      {showFormulaire && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-2xl font-bold">
                {modeEdition ? '✏️ Modifier la catégorie' : '➕ Nouvelle catégorie'}
              </h2>
              <button
                onClick={fermerFormulaire}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={sauvegarderCategorie} className="p-6 space-y-6">
              {/* Nom */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom de la catégorie *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Électronique"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                />
              </div>

              {/* Icône */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Icône (Emoji)
                </label>
                <div className="grid grid-cols-10 gap-2 mb-3">
                  {emojis.map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setFormData({ ...formData, icon: emoji })}
                      className={`text-2xl p-2 rounded-lg transition ${
                        formData.icon === emoji 
                          ? 'bg-primary/20 ring-2 ring-primary' 
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Ou entrez un emoji personnalisé"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                />
              </div>

              {/* Couleur */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Couleur
                </label>
                <div className="grid grid-cols-5 gap-2 mb-3">
                  {colors.map(color => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, color: color.value })}
                      className={`p-3 rounded-lg transition ${
                        formData.color === color.value 
                          ? 'ring-4 ring-offset-2 ring-gray-400' 
                          : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.nom}
                    >
                      {formData.color === color.value && (
                        <span className="text-white text-xl">✓</span>
                      )}
                    </button>
                  ))}
                </div>
                <input
                  type="color"
                  className="w-full h-12 rounded-lg cursor-pointer"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  rows="3"
                  placeholder="Ex: Téléphones, ordinateurs, accessoires tech..."
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              {/* Aperçu */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-2">Aperçu:</p>
                <div
                  className="bg-white p-4 rounded-lg"
                  style={{ borderLeft: `4px solid ${formData.color}` }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{formData.icon}</span>
                    <div>
                      <h3 className="font-bold text-lg">{formData.nom || 'Nom de la catégorie'}</h3>
                      {formData.description && (
                        <p className="text-sm text-gray-600">{formData.description}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Boutons */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={fermerFormulaire}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-primary"
                >
                  {modeEdition ? '💾 Enregistrer' : '➕ Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}