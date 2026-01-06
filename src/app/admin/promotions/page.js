// src/app/admin/promotions/page.js - VERSION FINALE COMPLÈTE
'use client';
import { useState, useEffect } from 'react';
import AdminLayout from '@/app/admin/AdminLayout';
import { supabase } from '@/lib/supabase';
import { produitsAPI } from '@/lib/api';

const TYPES_REDUCTION = [
  { value: 'pourcentage', label: 'Pourcentage (%)', icon: '📊' },
  { value: 'montant', label: 'Montant fixe', icon: '💰' }
];

export default function AdminPromotions() {
  const [mode, setMode] = useState('liste');
  const [promotions, setPromotions] = useState([]);
  const [produits, setProduits] = useState([]);
  const [promoEnCours, setPromoEnCours] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recherche, setRecherche] = useState('');
  const [filtreStatut, setFiltreStatut] = useState('tous');
  
  const [formData, setFormData] = useState({
    produit_id: '',
    type_reduction: 'pourcentage',
    valeur_reduction: 0,
    prix_original: 0,
    prix_promo: 0,
    economie: 0,
    date_debut: '',
    date_fin: '',
    stock_limite: '',
    titre: '',
    description: '',
    actif: true
  });

  useEffect(() => {
    chargerDonnees();
  }, []);

  useEffect(() => {
    // Calculer automatiquement prix_promo et économie
    if (formData.prix_original && formData.valeur_reduction) {
      let prixPromo = 0;
      
      if (formData.type_reduction === 'pourcentage') {
        prixPromo = formData.prix_original * (1 - formData.valeur_reduction / 100);
      } else {
        prixPromo = formData.prix_original - formData.valeur_reduction;
      }
      
      prixPromo = Math.max(0, prixPromo);
      const economie = formData.prix_original - prixPromo;
      
      setFormData(prev => ({
        ...prev,
        prix_promo: parseFloat(prixPromo.toFixed(2)),
        economie: parseFloat(economie.toFixed(2))
      }));
    }
  }, [formData.prix_original, formData.valeur_reduction, formData.type_reduction]);

  const chargerDonnees = async () => {
    try {
      setLoading(true);
      
      // Charger promotions avec produits et devise
      const { data: promosData, error: promosError } = await supabase
        .from('promotions')
        .select(`
          *,
          produits (
            id,
            nom,
            prix,
            images,
            ville:villes(nom),
            pays:pays(nom, devise)
          )
        `)
        .order('created_at', { ascending: false });

      if (promosError) throw promosError;

      // Charger tous les produits
      const produitsData = await produitsAPI.getAll();
      
      setPromotions(promosData || []);
      setProduits(produitsData);
    } catch (error) {
      console.error('❌ Erreur chargement:', error);
      alert(`❌ Erreur: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const ajouterPromo = () => {
    setPromoEnCours(null);
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    setFormData({
      produit_id: produits[0]?.id || '',
      type_reduction: 'pourcentage',
      valeur_reduction: 0,
      prix_original: produits[0]?.prix || 0,
      prix_promo: 0,
      economie: 0,
      date_debut: today,
      date_fin: nextWeek,
      stock_limite: '',
      titre: '',
      description: '',
      actif: true
    });
    setMode('formulaire');
  };

  const modifierPromo = (promo) => {
    setPromoEnCours(promo);
    setFormData({
      produit_id: promo.produit_id,
      type_reduction: promo.type_reduction,
      valeur_reduction: promo.valeur_reduction,
      prix_original: promo.prix_original,
      prix_promo: promo.prix_promo,
      economie: promo.economie,
      date_debut: promo.date_debut?.split('T')[0] || '',
      date_fin: promo.date_fin?.split('T')[0] || '',
      stock_limite: promo.stock_limite || '',
      titre: promo.titre || '',
      description: promo.description || '',
      actif: promo.actif
    });
    setMode('formulaire');
  };

  const supprimerPromo = async (id) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette promotion ?')) return;

    try {
      const { error } = await supabase
        .from('promotions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      alert('✅ Promotion supprimée !');
      chargerDonnees();
    } catch (error) {
      console.error('❌ Erreur:', error);
      alert(`❌ Erreur: ${error.message}`);
    }
  };

  const toggleActif = async (id, actif) => {
    try {
      const { error } = await supabase
        .from('promotions')
        .update({ actif: !actif })
        .eq('id', id);

      if (error) throw error;
      chargerDonnees();
    } catch (error) {
      console.error('❌ Erreur:', error);
    }
  };

  const changerProduit = (produitId) => {
    const produit = produits.find(p => p.id === produitId);
    if (produit) {
      setFormData({
        ...formData,
        produit_id: produitId,
        prix_original: produit.prix,
        prix_promo: 0,
        economie: 0
      });
    }
  };

  const sauvegarder = async () => {
    // Validations
    if (!formData.produit_id) {
      alert('⚠️ Sélectionnez un produit');
      return;
    }

    if (!formData.valeur_reduction || formData.valeur_reduction <= 0) {
      alert('⚠️ Entrez une réduction valide');
      return;
    }

    if (!formData.date_debut || !formData.date_fin) {
      alert('⚠️ Entrez les dates');
      return;
    }

    if (formData.prix_promo >= formData.prix_original) {
      alert('⚠️ Le prix promo doit être inférieur au prix original');
      return;
    }

    try {
      const dataToSave = {
        produit_id: formData.produit_id,
        type_reduction: formData.type_reduction,
        valeur_reduction: parseFloat(formData.valeur_reduction),
        prix_original: parseFloat(formData.prix_original),
        prix_promo: parseFloat(formData.prix_promo),
        economie: parseFloat(formData.economie),
        date_debut: formData.date_debut,
        date_fin: formData.date_fin,
        titre: formData.titre || null,
        description: formData.description || null,
        actif: formData.actif
      };

      // Ajouter stock_limite seulement si rempli
      if (formData.stock_limite && formData.stock_limite !== '') {
        dataToSave.stock_limite = parseInt(formData.stock_limite);
      }

      let result;
      if (promoEnCours) {
        result = await supabase
          .from('promotions')
          .update(dataToSave)
          .eq('id', promoEnCours.id)
          .select();
      } else {
        result = await supabase
          .from('promotions')
          .insert(dataToSave)
          .select();
      }

      if (result.error) throw result.error;

      alert(`✅ Promotion ${promoEnCours ? 'modifiée' : 'ajoutée'} !`);
      setMode('liste');
      chargerDonnees();
    } catch (error) {
      console.error('❌ Erreur:', error);
      alert(`❌ Erreur: ${error.message}`);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fr-FR');
  };

  const estActive = (promo) => {
    if (!promo.actif) return false;
    const now = new Date();
    const debut = new Date(promo.date_debut);
    const fin = new Date(promo.date_fin);
    return now >= debut && now <= fin;
  };

  const promosFiltrees = promotions.filter(p => {
    const matchRecherche = !recherche || 
      p.produits?.nom.toLowerCase().includes(recherche.toLowerCase());
    
    let matchStatut = true;
    if (filtreStatut === 'actives') matchStatut = estActive(p);
    else if (filtreStatut === 'inactives') matchStatut = !estActive(p);
    
    return matchRecherche && matchStatut;
  });

  const stats = {
    total: promotions.length,
    actives: promotions.filter(p => estActive(p)).length,
    enAttente: promotions.filter(p => new Date(p.date_debut) > new Date()).length,
    expirees: promotions.filter(p => new Date(p.date_fin) < new Date()).length,
    economieTotal: promotions.reduce((sum, p) => sum + (p.economie || 0), 0)
  };

  if (loading) {
    return (
      <AdminLayout titre="Gestion des Promotions">
        <div className="text-center py-12">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Chargement...</p>
        </div>
      </AdminLayout>
    );
  }

  // Mode formulaire
  if (mode === 'formulaire') {
    const produitSelectionne = produits.find(p => p.id === formData.produit_id);
    const devise = produitSelectionne?.pays?.devise || 'FCFA';

    return (
      <AdminLayout titre={promoEnCours ? 'Modifier la promotion' : 'Nouvelle promotion'}>
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => setMode('liste')}
            className="mb-6 flex items-center gap-2 text-primary hover:underline"
          >
            ← Retour
          </button>

          <div className="card">
            <div className="space-y-6">
              {/* Produit */}
              <div>
                <label className="block text-sm font-medium mb-2">Produit *</label>
                <select
                  className="input-field"
                  value={formData.produit_id}
                  onChange={(e) => changerProduit(e.target.value)}
                >
                  <option value="">-- Sélectionner --</option>
                  {produits.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.nom} - {p.prix} {p.pays?.devise || 'FCFA'}
                    </option>
                  ))}
                </select>

                {produitSelectionne && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg flex items-center gap-4">
                    {produitSelectionne.images?.[0] && (
                      <img
                        src={produitSelectionne.images[0]}
                        alt={produitSelectionne.nom}
                        className="w-20 h-20 rounded object-cover"
                      />
                    )}
                    <div>
                      <p className="font-bold">{produitSelectionne.nom}</p>
                      <p className="text-lg font-bold text-accent">
                        Prix: {produitSelectionne.prix} {devise}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Type de réduction */}
              <div>
                <label className="block text-sm font-medium mb-2">Type de réduction *</label>
                <div className="grid grid-cols-2 gap-4">
                  {TYPES_REDUCTION.map(type => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFormData({...formData, type_reduction: type.value})}
                      className={`p-4 border-2 rounded-lg text-center transition ${
                        formData.type_reduction === type.value
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200 hover:border-primary'
                      }`}
                    >
                      <div className="text-2xl mb-2">{type.icon}</div>
                      <div className="text-sm font-semibold">{type.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Valeur réduction */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Valeur de la réduction * {formData.type_reduction === 'pourcentage' ? '(%)' : `(${devise})`}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={formData.type_reduction === 'pourcentage' ? '100' : undefined}
                  className="input-field"
                  value={formData.valeur_reduction}
                  onChange={(e) => setFormData({...formData, valeur_reduction: parseFloat(e.target.value) || 0})}
                />
              </div>

              {/* Prix original */}
              <div>
                <label className="block text-sm font-medium mb-2">Prix original ({devise})</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="input-field"
                  value={formData.prix_original}
                  onChange={(e) => setFormData({...formData, prix_original: parseFloat(e.target.value) || 0})}
                />
              </div>

              {/* Calculs automatiques */}
              {formData.economie > 0 && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="grid md:grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Prix promo</p>
                      <p className="text-2xl font-bold text-red-600">
                        {formData.prix_promo.toLocaleString()} {devise}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Économie</p>
                      <p className="text-2xl font-bold text-green-600">
                        {formData.economie.toLocaleString()} {devise}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Réduction</p>
                      <p className="text-2xl font-bold text-orange-600">
                        -{Math.round((formData.economie / formData.prix_original) * 100)}%
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Dates */}
              <div className="grid md:grid-cols-2 gap-6">
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
                  <label className="block text-sm font-medium mb-2">Date fin *</label>
                  <input
                    type="date"
                    className="input-field"
                    value={formData.date_fin}
                    onChange={(e) => setFormData({...formData, date_fin: e.target.value})}
                  />
                </div>
              </div>

              {/* Titre et description */}
              <div>
                <label className="block text-sm font-medium mb-2">Titre (optionnel)</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Ex: Offre spéciale été"
                  value={formData.titre}
                  onChange={(e) => setFormData({...formData, titre: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description (optionnel)</label>
                <textarea
                  rows="3"
                  className="input-field"
                  placeholder="Détails de la promotion..."
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>

              {/* Stock */}
              <div>
                <label className="block text-sm font-medium mb-2">Stock limité (optionnel)</label>
                <input
                  type="number"
                  min="0"
                  className="input-field"
                  placeholder="Laissez vide pour illimité"
                  value={formData.stock_limite}
                  onChange={(e) => setFormData({...formData, stock_limite: e.target.value})}
                />
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
                <label htmlFor="actif" className="font-medium">Activer immédiatement</label>
              </div>
            </div>

            <div className="flex gap-4 pt-6 border-t mt-6">
              <button onClick={sauvegarder} className="btn-primary flex-1">
                {promoEnCours ? 'Modifier' : 'Ajouter'}
              </button>
              <button
                onClick={() => setMode('liste')}
                className="px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50"
              >
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
    <AdminLayout titre="Gestion des Promotions" sousTitre={`${promotions.length} promotions`}>
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="card bg-blue-50">
          <p className="text-sm text-gray-600 mb-1">Total</p>
          <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
        </div>
        <div className="card bg-green-50">
          <p className="text-sm text-gray-600 mb-1">Actives</p>
          <p className="text-2xl font-bold text-green-600">{stats.actives}</p>
        </div>
        <div className="card bg-yellow-50">
          <p className="text-sm text-gray-600 mb-1">En attente</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.enAttente}</p>
        </div>
        <div className="card bg-gray-50">
          <p className="text-sm text-gray-600 mb-1">Expirées</p>
          <p className="text-2xl font-bold text-gray-600">{stats.expirees}</p>
        </div>
        <div className="card bg-red-50">
          <p className="text-sm text-gray-600 mb-1">Économie totale</p>
          <p className="text-xl font-bold text-red-600">{stats.economieTotal.toLocaleString()} F</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="mb-6 flex gap-4">
        <button onClick={ajouterPromo} className="btn-primary">+ Ajouter</button>
        <select className="input-field" value={filtreStatut} onChange={(e) => setFiltreStatut(e.target.value)}>
          <option value="tous">Toutes</option>
          <option value="actives">Actives</option>
          <option value="inactives">Inactives</option>
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
      {promosFiltrees.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl shadow">
          <div className="text-6xl mb-4">🔥</div>
          <p className="text-xl text-gray-600">Aucune promotion</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {promosFiltrees.map((promo) => {
            const produit = promo.produits;
            const devise = produit?.pays?.devise || 'FCFA';
            const pourcentage = Math.round((promo.economie / promo.prix_original) * 100);
            const active = estActive(promo);

            return (
              <div key={promo.id} className="bg-white rounded-xl shadow p-6 flex items-center gap-6">
                {produit?.images?.[0] && (
                  <img src={produit.images[0]} alt={produit.nom} className="w-24 h-24 rounded object-cover" />
                )}
                
                <div className="flex-1">
                  <h3 className="font-bold text-lg">{produit?.nom || 'Produit supprimé'}</h3>
                  {promo.titre && <p className="text-sm text-gray-600">{promo.titre}</p>}
                  <div className="flex items-center gap-4 mt-2">
                    <div>
                      <p className="text-sm line-through text-gray-500">{promo.prix_original} {devise}</p>
                      <p className="text-xl font-bold text-red-600">{promo.prix_promo} {devise}</p>
                    </div>
                    <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-bold">
                      -{pourcentage}%
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {active ? '✓ Active' : '○ Inactive'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {formatDate(promo.date_debut)} → {formatDate(promo.date_fin)}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => toggleActif(promo.id, promo.actif)} className="p-2 text-blue-600 hover:bg-blue-50 rounded">
                    {promo.actif ? '⏸️' : '▶️'}
                  </button>
                  <button onClick={() => modifierPromo(promo)} className="p-2 text-blue-600 hover:bg-blue-50 rounded">
                    ✏️
                  </button>
                  <button onClick={() => supprimerPromo(promo.id)} className="p-2 text-red-600 hover:bg-red-50 rounded">
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