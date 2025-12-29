// src/app/admin/bannieres/page.js
'use client';
import { useState, useEffect } from 'react';
import AdminLayout from '@/app/admin/AdminLayout';
import ImageUploader from '@/components/ImageUploader';
import { bannieresAPI, structuresAPI } from '@/lib/api';

export default function AdminBannieres() {
  const [mode, setMode] = useState('liste');
  const [banniereEnCours, setBanniereEnCours] = useState(null);
  const [bannieres, setBannieres] = useState([]);
  const [structures, setStructures] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    titre: '',
    sous_titre: '',
    image_url: '',
    lien_externe: '',
    structure_id: null,
    ordre: 0,
    actif: true
  });

  useEffect(() => {
    chargerDonnees();
  }, []);

  const chargerDonnees = async () => {
    try {
      setLoading(true);
      const [bannieresData, structuresData] = await Promise.all([
        bannieresAPI.getAll(),
        structuresAPI.getAll()
      ]);
      setBannieres(bannieresData);
      setStructures(structuresData);
    } catch (error) {
      console.error('Erreur chargement:', error);
      alert('❌ Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const ajouterBanniere = () => {
    setBanniereEnCours(null);
    setFormData({
      titre: '',
      sous_titre: '',
      image_url: '',
      lien_externe: '',
      structure_id: null,
      ordre: bannieres.length,
      actif: true
    });
    setMode('formulaire');
  };

  const modifierBanniere = (banniere) => {
    setBanniereEnCours(banniere);
    setFormData({
      titre: banniere.titre,
      sous_titre: banniere.sous_titre || '',
      image_url: banniere.image_url,
      lien_externe: banniere.lien_externe || '',
      structure_id: banniere.structure_id || null,
      ordre: banniere.ordre,
      actif: banniere.actif
    });
    setMode('formulaire');
  };

  const supprimerBanniere = async (id) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette bannière ?')) return;

    try {
      await bannieresAPI.delete(id);
      alert('✅ Bannière supprimée avec succès !');
      chargerDonnees();
    } catch (error) {
      console.error('Erreur suppression:', error);
      alert('❌ Erreur lors de la suppression');
    }
  };

  const sauvegarderBanniere = async () => {
    if (!formData.titre || !formData.image_url) {
      alert('⚠️ Veuillez remplir au moins le titre et l\'image');
      return;
    }

    try {
      const dataToSave = {
        titre: formData.titre,
        sous_titre: formData.sous_titre,
        image_url: formData.image_url,
        lien_externe: formData.lien_externe,
        structure_id: formData.structure_id || null,
        ordre: parseInt(formData.ordre),
        actif: formData.actif
      };

      if (banniereEnCours) {
        await bannieresAPI.update(banniereEnCours.id, dataToSave);
        alert('✅ Bannière modifiée avec succès !');
      } else {
        await bannieresAPI.create(dataToSave);
        alert('✅ Bannière ajoutée avec succès !');
      }
      
      setMode('liste');
      chargerDonnees();
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      alert('❌ Erreur: ' + error.message);
    }
  };

  const toggleActif = async (banniere) => {
    try {
      await bannieresAPI.update(banniere.id, { actif: !banniere.actif });
      chargerDonnees();
    } catch (error) {
      console.error('Erreur toggle:', error);
      alert('❌ Erreur lors de la modification');
    }
  };

  if (loading) {
    return (
      <AdminLayout titre="Gestion des Bannières">
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
      <AdminLayout titre={banniereEnCours ? 'Modifier la bannière' : 'Ajouter une bannière'}>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Titre *</label>
                <input type="text" className="input-field" value={formData.titre} onChange={(e) => setFormData({...formData, titre: e.target.value})} />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Sous-titre</label>
                <input type="text" className="input-field" value={formData.sous_titre} onChange={(e) => setFormData({...formData, sous_titre: e.target.value})} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ordre d'affichage</label>
                <input type="number" className="input-field" value={formData.ordre} onChange={(e) => setFormData({...formData, ordre: e.target.value})} />
                <p className="text-xs text-gray-500 mt-1">Les bannières sont affichées par ordre croissant</p>
              </div>

              <div>
                <label className="flex items-center gap-3 cursor-pointer mt-8">
                  <input
                    type="checkbox"
                    className="w-5 h-5 text-primary"
                    checked={formData.actif}
                    onChange={(e) => setFormData({...formData, actif: e.target.checked})}
                  />
                  <span className="text-gray-700 font-medium">Bannière active (visible sur le site)</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Image de la bannière *</label>
              <ImageUploader
                images={formData.image_url ? [formData.image_url] : []}
                onChange={(newImages) => setFormData({...formData, image_url: newImages[0] || ''})}
                maxImages={1}
              />
              <p className="text-xs text-gray-500 mt-2">Format recommandé: 1920x500px (paysage)</p>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Lien de destination</h3>
              <p className="text-sm text-gray-600 mb-4">Choisissez où renvoyer l'utilisateur quand il clique sur la bannière</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Structure liée (optionnel)</label>
                  <select 
                    className="input-field" 
                    value={formData.structure_id || ''} 
                    onChange={(e) => setFormData({...formData, structure_id: e.target.value || null, lien_externe: ''})}
                  >
                    <option value="">Aucune structure</option>
                    {structures.map(s => (
                      <option key={s.id} value={s.id}>{s.nom} - {s.ville?.nom}</option>
                    ))}
                  </select>
                </div>

                <div className="text-center text-sm text-gray-500">OU</div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Lien externe (optionnel)</label>
                  <input 
                    type="url" 
                    placeholder="https://..." 
                    className="input-field" 
                    value={formData.lien_externe} 
                    onChange={(e) => setFormData({...formData, lien_externe: e.target.value, structure_id: null})}
                    disabled={formData.structure_id}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-6">
              <button onClick={sauvegarderBanniere} className="btn-primary flex-1">
                {banniereEnCours ? 'Modifier' : 'Ajouter'} la bannière
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
    <AdminLayout titre="Gestion des Bannières Publicitaires" sousTitre={`${bannieres.length} bannières configurées`}>
      <div className="mb-6">
        <button onClick={ajouterBanniere} className="btn-primary flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Ajouter une bannière
        </button>
      </div>

      <div className="space-y-6">
        {bannieres.map((banniere) => (
          <div key={banniere.id} className={`bg-white rounded-xl shadow-lg overflow-hidden ${!banniere.actif ? 'opacity-60' : ''}`}>
            <div className="relative h-48">
              <img src={banniere.image_url} alt={banniere.titre} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <div className="absolute bottom-4 left-4 text-white">
                <h3 className="text-2xl font-bold">{banniere.titre}</h3>
                {banniere.sous_titre && <p className="text-sm">{banniere.sous_titre}</p>}
              </div>
              {!banniere.actif && (
                <div className="absolute top-4 right-4 px-3 py-1 bg-red-500 text-white rounded-full text-sm font-bold">
                  Désactivée
                </div>
              )}
            </div>
            <div className="p-4 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                <p><strong>Ordre:</strong> {banniere.ordre}</p>
                {banniere.structure && <p><strong>Lien:</strong> Structure - {banniere.structure.nom}</p>}
                {banniere.lien_externe && <p><strong>Lien:</strong> {banniere.lien_externe}</p>}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => toggleActif(banniere)}
                  className={`px-4 py-2 rounded-lg font-medium ${
                    banniere.actif 
                      ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {banniere.actif ? '✓ Active' : '✗ Inactive'}
                </button>
                <button onClick={() => modifierBanniere(banniere)} className="p-2 text-blue-600 hover:bg-blue-50 rounded">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button onClick={() => supprimerBanniere(banniere.id)} className="p-2 text-red-600 hover:bg-red-50 rounded">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {bannieres.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl shadow">
          <div className="text-6xl mb-4">🎯</div>
          <p className="text-xl text-gray-600 mb-2">Aucune bannière publicitaire</p>
          <p className="text-gray-500 mb-6">Commencez par ajouter votre première bannière</p>
          <button onClick={ajouterBanniere} className="btn-primary">
            Ajouter une bannière
          </button>
        </div>
      )}
    </AdminLayout>
  );
}