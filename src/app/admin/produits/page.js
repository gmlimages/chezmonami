// src/app/admin/produits/page.js - PARTIE 1/2
'use client';
import { useState, useEffect } from 'react';
import AdminLayout from '@/app/admin/AdminLayout';
import ImageUploader from '@/components/ImageUploader';
import { produitsAPI, structuresAPI, paysAPI, villesAPI, categoriesProduitsAPI } from '@/lib/api';

export default function AdminProduits() {
  const [mode, setMode] = useState('liste');
  const [produitEnCours, setProduitEnCours] = useState(null);
  const [produits, setProduits] = useState([]);
  const [structures, setStructures] = useState([]);
  const [categoriesProduits, setCategoriesProduits] = useState([]);
  const [pays, setPays] = useState([]);
  const [villes, setVilles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recherche, setRecherche] = useState('');
  
  const [formData, setFormData] = useState({
    nom: '',
    description: '',
    prix: '',
    categorie_id: '',
    stock: '',
    pays_id: '',
    ville_id: '',
    structure_id: null,
    livraison_autre_ville: true,
    livraison_autre_pays: false,
    images: [],
    variations: []
  });

  const [nouvelleVariation, setNouvelleVariation] = useState({
    type: 'taille',
    valeur: '',
    stock: ''
  });

  useEffect(() => {
    chargerDonnees();
  }, []);

  useEffect(() => {
    if (formData.pays_id) {
      chargerVilles(formData.pays_id);
    }
  }, [formData.pays_id]);

  const chargerDonnees = async () => {
    try {
      setLoading(true);
      const [produitsData, structuresData, paysData, categoriesData] = await Promise.all([
        produitsAPI.getAll(),
        structuresAPI.getAll(),
        paysAPI.getAll(),
        categoriesProduitsAPI.getAll()
      ]);
      setProduits(produitsData);
      setStructures(structuresData);
      setPays(paysData);
      setCategoriesProduits(categoriesData);
    } catch (error) {
      console.error('Erreur chargement:', error);
      alert('❌ Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const chargerVilles = async (paysId) => {
    try {
      const villesData = await villesAPI.getByPays(paysId);
      setVilles(villesData);
    } catch (error) {
      console.error('Erreur chargement villes:', error);
    }
  };

  const ajouterProduit = () => {
    setProduitEnCours(null);
    setFormData({
      nom: '',
      description: '',
      prix: '',
      categorie_id: '',
      stock: '',
      pays_id: '',
      ville_id: '',
      structure_id: null,
      livraison_autre_ville: true,
      livraison_autre_pays: false,
      images: [],
      variations: []
    });
    setVilles([]);
    setMode('formulaire');
  };

  const modifierProduit = async (produit) => {
    setProduitEnCours(produit);
    
    if (produit.pays?.id) {
      await chargerVilles(produit.pays.id);
    }
    
    setFormData({
      nom: produit.nom,
      description: produit.description,
      prix: produit.prix,
      categorie_id: produit.categorie?.id || '',
      stock: produit.stock,
      pays_id: produit.pays?.id || '',
      ville_id: produit.ville?.id || '',
      structure_id: produit.structure?.id || null,
      livraison_autre_ville: produit.livraison_autre_ville,
      livraison_autre_pays: produit.livraison_autre_pays,
      images: produit.images || [],
      variations: produit.variations || []
    });
    setMode('formulaire');
  };

  const supprimerProduit = async (id) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) return;

    try {
      await produitsAPI.delete(id);
      alert('✅ Produit supprimé avec succès !');
      chargerDonnees();
    } catch (error) {
      console.error('Erreur suppression:', error);
      alert('❌ Erreur lors de la suppression');
    }
  };

  const ajouterVariation = () => {
    if (!nouvelleVariation.valeur || !nouvelleVariation.stock) {
      alert('⚠️ Veuillez remplir tous les champs de la variation');
      return;
    }

    const variation = {
      [nouvelleVariation.type]: nouvelleVariation.valeur,
      stock: parseInt(nouvelleVariation.stock)
    };

    setFormData({
      ...formData,
      variations: [...formData.variations, variation]
    });

    setNouvelleVariation({
      type: 'taille',
      valeur: '',
      stock: ''
    });
  };

  const supprimerVariation = (index) => {
    setFormData({
      ...formData,
      variations: formData.variations.filter((_, i) => i !== index)
    });
  };

  const sauvegarderProduit = async () => {
    if (!formData.nom || !formData.prix || !formData.pays_id || !formData.ville_id) {
      alert('⚠️ Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      const dataToSave = {
        nom: formData.nom,
        description: formData.description,
        prix: parseInt(formData.prix),
        categorie: formData.categorie_id,
        stock: parseInt(formData.stock),
        pays_id: formData.pays_id,
        ville_id: formData.ville_id,
        structure_id: formData.structure_id || null,
        livraison_autre_ville: formData.livraison_autre_ville,
        livraison_autre_pays: formData.livraison_autre_pays,
        images: formData.images,
        variations: formData.variations
      };

      if (produitEnCours) {
        await produitsAPI.update(produitEnCours.id, dataToSave);
        alert('✅ Produit modifié avec succès !');
      } else {
        await produitsAPI.create(dataToSave);
        alert('✅ Produit ajouté avec succès !');
      }
      
      setMode('liste');
      chargerDonnees();
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      alert('❌ Erreur: ' + error.message);
    }
  };

  const produitsFiltres = produits.filter(p => {
    if (!recherche) return true;
    const searchLower = recherche.toLowerCase();
    return (
      p.nom.toLowerCase().includes(searchLower) ||
      p.categorie.toLowerCase().includes(searchLower) ||
      p.ville?.nom.toLowerCase().includes(searchLower) ||
      (p.structure?.nom || '').toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <AdminLayout titre="Gestion des Produits">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }
  if (mode === 'formulaire') {
    return (
      <AdminLayout titre={produitEnCours ? 'Modifier le produit' : 'Ajouter un produit'}>
        <div className="max-w-4xl">
          <button onClick={() => setMode('liste')} className="mb-6 flex items-center gap-2 text-primary hover:text-primary-dark">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Retour à la liste
          </button>

          <div className="bg-white rounded-xl shadow-lg p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Nom du produit *</label>
                <input type="text" className="input-field" value={formData.nom} onChange={(e) => setFormData({...formData, nom: e.target.value})} />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                <textarea rows="3" className="input-field" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie *</label>
                <select 
                  className="input-field" 
                  value={formData.categorie_id} 
                  onChange={(e) => setFormData({...formData, categorie_id: e.target.value})}
                >
                  <option value="">Choisir une catégorie</option>
                  {categoriesProduits.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.nom}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Prix *</label>
                <input type="number" className="input-field" value={formData.prix} onChange={(e) => setFormData({...formData, prix: e.target.value})} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Stock total *</label>
                <input type="number" className="input-field" value={formData.stock} onChange={(e) => setFormData({...formData, stock: e.target.value})} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Pays *</label>
                <select className="input-field" value={formData.pays_id} onChange={(e) => setFormData({...formData, pays_id: e.target.value, ville_id: ''})}>
                  <option value="">Choisir un pays</option>
                  {pays.map(p => (
                    <option key={p.id} value={p.id}>{p.nom}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ville *</label>
                <select className="input-field" value={formData.ville_id} onChange={(e) => setFormData({...formData, ville_id: e.target.value})} disabled={!formData.pays_id}>
                  <option value="">Choisir une ville</option>
                  {villes.map(v => (
                    <option key={v.id} value={v.id}>{v.nom}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Structure liée (optionnel)</label>
                <select className="input-field" value={formData.structure_id || ''} onChange={(e) => setFormData({...formData, structure_id: e.target.value || null})}>
                  <option value="">Aucune structure (produit indépendant)</option>
                  {structures.map(s => (
                    <option key={s.id} value={s.id}>{s.nom} - {s.ville?.nom}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Si ce produit est vendu par une boutique spécifique</p>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Options de livraison</h3>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-5 h-5 text-primary"
                    checked={formData.livraison_autre_ville}
                    onChange={(e) => setFormData({...formData, livraison_autre_ville: e.target.checked})}
                  />
                  <span className="text-gray-700">Livraison dans d'autres villes du pays</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-5 h-5 text-primary"
                    checked={formData.livraison_autre_pays}
                    onChange={(e) => setFormData({...formData, livraison_autre_pays: e.target.checked})}
                  />
                  <span className="text-gray-700">Livraison internationale</span>
                </label>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Images du produit</h3>
              <ImageUploader
                images={formData.images}
                onChange={(newImages) => setFormData({...formData, images: newImages})}
                maxImages={8}
              />
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Variations (Tailles, Couleurs)</h3>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <select
                    className="input-field"
                    value={nouvelleVariation.type}
                    onChange={(e) => setNouvelleVariation({...nouvelleVariation, type: e.target.value})}
                  >
                    <option value="taille">Taille</option>
                    <option value="couleur">Couleur</option>
                  </select>
                  <input
                    type="text"
                    placeholder={nouvelleVariation.type === 'taille' ? 'Ex: M' : 'Ex: Rouge'}
                    className="input-field"
                    value={nouvelleVariation.valeur}
                    onChange={(e) => setNouvelleVariation({...nouvelleVariation, valeur: e.target.value})}
                  />
                  <input
                    type="number"
                    placeholder="Stock"
                    className="input-field"
                    value={nouvelleVariation.stock}
                    onChange={(e) => setNouvelleVariation({...nouvelleVariation, stock: e.target.value})}
                  />
                  <button onClick={ajouterVariation} className="btn-primary">
                    Ajouter
                  </button>
                </div>
              </div>

              {formData.variations.length > 0 && (
                <div className="space-y-2">
                  {formData.variations.map((variation, index) => (
                    <div key={index} className="flex items-center justify-between bg-white p-3 rounded-lg border">
                      <span className="font-medium">
                        {variation.taille ? `Taille: ${variation.taille}` : `Couleur: ${variation.couleur}`} - Stock: {variation.stock}
                      </span>
                      <button onClick={() => supprimerVariation(index)} className="text-red-600 hover:text-red-800">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-4 pt-6">
              <button onClick={sauvegarderProduit} className="btn-primary flex-1">
                {produitEnCours ? 'Modifier' : 'Ajouter'} le produit
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

  return (
    <AdminLayout titre="Gestion des Produits" sousTitre={`${produits.length} produits enregistrés`}>
      <div className="mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
        <button onClick={ajouterProduit} className="btn-primary flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Ajouter un produit
        </button>

        <div className="relative flex-1 max-w-md">
          <svg className="absolute left-3 top-3 text-gray-400" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Rechercher un produit..."
            className="input-field pl-10"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {produitsFiltres.map((produit) => (
          <div key={produit.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
            {produit.images?.[0] && (
              <img src={produit.images[0]} alt={produit.nom} className="w-full h-48 object-cover" />
            )}
            <div className="p-4">
              <h3 className="font-bold text-lg mb-2 line-clamp-2">{produit.nom}</h3>
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{produit.description}</p>
              
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                <span>📍</span>
                <span>{produit.ville?.nom}, {produit.pays?.nom}</span>
              </div>

              {produit.structure && (
                <div className="text-xs text-primary mb-2">
                  🏪 {produit.structure.nom}
                </div>
              )}

              <div className="flex items-center justify-between mb-3">
                <p className="text-xl font-bold text-accent">{produit.prix?.toLocaleString()} {produit.pays?.devise}</p>
                <span className="text-sm text-gray-500">Stock: {produit.stock}</span>
              </div>

              <div className="flex gap-2">
                <button onClick={() => modifierProduit(produit)} className="flex-1 btn-primary py-2 text-sm">
                  Modifier
                </button>
                <button onClick={() => supprimerProduit(produit.id)} className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          
        ))}
      </div>

      {produitsFiltres.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl shadow">
          <div className="text-6xl mb-4">📦</div>
          <p className="text-xl text-gray-600 mb-2">Aucun produit trouvé</p>
          <p className="text-gray-500">Essayez avec d'autres termes de recherche</p>
        </div>
      )}
    </AdminLayout>
  );
}