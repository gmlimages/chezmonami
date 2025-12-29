// src/app/admin/annonces/page.js
'use client';
import { useState, useEffect } from 'react';
import AdminLayout from '@/app/admin/AdminLayout';
import FileUploader from '@/components/FileUploader';
import { annoncesAPI, paysAPI, villesAPI } from '@/lib/api';

export default function AdminAnnonces() {
  const [mode, setMode] = useState('liste');
  const [annonceEnCours, setAnnonceEnCours] = useState(null);
  const [annonces, setAnnonces] = useState([]);
  const [pays, setPays] = useState([]);
  const [villes, setVilles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recherche, setRecherche] = useState('');
  const [filtreType, setFiltreType] = useState('');
  
  const [formData, setFormData] = useState({
    titre: '',
    organisme: '',
    type: 'Financement',
    pays_id: '',
    ville: '',
    description: '',
    description_longue: '',
    date_debut: '',
    date_fin: '',
    contact: '',
    telephone: '',
    lien_externe: '',
    pieces_jointes: []
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
      const [annoncesData, paysData] = await Promise.all([
        annoncesAPI.getAll(),
        paysAPI.getAll()
      ]);
      setAnnonces(annoncesData);
      setPays(paysData);
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

  const ajouterAnnonce = () => {
    setAnnonceEnCours(null);
    setFormData({
      titre: '',
      organisme: '',
      type: 'Financement',
      pays_id: '',
      ville: 'National',
      description: '',
      description_longue: '',
      date_debut: '',
      date_fin: '',
      contact: '',
      telephone: '',
      lien_externe: '',
      pieces_jointes: []
    });
    setVilles([]);
    setMode('formulaire');
  };

  const modifierAnnonce = async (annonce) => {
    setAnnonceEnCours(annonce);
    
    if (annonce.pays?.id) {
      await chargerVilles(annonce.pays.id);
    }
    
    setFormData({
      titre: annonce.titre,
      organisme: annonce.organisme,
      type: annonce.type,
      pays_id: annonce.pays?.id || '',
      ville: annonce.ville,
      description: annonce.description,
      description_longue: annonce.description_longue,
      date_debut: annonce.date_debut || '',
      date_fin: annonce.date_fin,
      contact: annonce.contact,
      telephone: annonce.telephone,
      lien_externe: annonce.lien_externe || '',
      pieces_jointes: annonce.pieces_jointes || []
    });
    setMode('formulaire');
  };

  const supprimerAnnonce = async (id) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette annonce ?')) return;

    try {
      await annoncesAPI.delete(id);
      alert('✅ Annonce supprimée avec succès !');
      chargerDonnees();
    } catch (error) {
      console.error('Erreur suppression:', error);
      alert('❌ Erreur lors de la suppression');
    }
  };

  const sauvegarderAnnonce = async () => {
    if (!formData.titre || !formData.organisme || !formData.pays_id || !formData.date_fin) {
      alert('⚠️ Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      const dataToSave = {
        titre: formData.titre,
        organisme: formData.organisme,
        type: formData.type,
        pays_id: formData.pays_id,
        ville: formData.ville,
        description: formData.description,
        description_longue: formData.description_longue,
        date_debut: formData.date_debut || null,
        date_fin: formData.date_fin,
        contact: formData.contact,
        telephone: formData.telephone,
        lien_externe: formData.lien_externe,
        pieces_jointes: formData.pieces_jointes
      };

      if (annonceEnCours) {
        await annoncesAPI.update(annonceEnCours.id, dataToSave);
        alert('✅ Annonce modifiée avec succès !');
      } else {
        await annoncesAPI.create(dataToSave);
        alert('✅ Annonce publiée avec succès !');
      }
      
      setMode('liste');
      chargerDonnees();
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      alert('❌ Erreur: ' + error.message);
    }
  };

  const annoncesFiltrees = annonces.filter(a => {
    const matchRecherche = !recherche || 
      a.titre.toLowerCase().includes(recherche.toLowerCase()) ||
      a.organisme.toLowerCase().includes(recherche.toLowerCase()) ||
      a.description.toLowerCase().includes(recherche.toLowerCase());
    
    const matchType = !filtreType || a.type === filtreType;
    
    return matchRecherche && matchType;
  });

  if (loading) {
    return (
      <AdminLayout titre="Gestion des Annonces">
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
      <AdminLayout titre={annonceEnCours ? 'Modifier l\'annonce' : 'Publier une annonce'}>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Titre de l'annonce *</label>
                <input type="text" className="input-field" value={formData.titre} onChange={(e) => setFormData({...formData, titre: e.target.value})} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Organisme *</label>
                <input type="text" placeholder="Ex: UNICEF" className="input-field" value={formData.organisme} onChange={(e) => setFormData({...formData, organisme: e.target.value})} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type d'annonce *</label>
                <select className="input-field" value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})}>
                  <option value="Financement">Financement</option>
                  <option value="Appel d'offres">Appel d'offres</option>
                  <option value="Emploi">Emploi</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Pays *</label>
                <select className="input-field" value={formData.pays_id} onChange={(e) => setFormData({...formData, pays_id: e.target.value, ville: 'National'})}>
                  <option value="">Choisir un pays</option>
                  {pays.map(p => (
                    <option key={p.id} value={p.id}>{p.nom}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Portée</label>
                <select className="input-field" value={formData.ville} onChange={(e) => setFormData({...formData, ville: e.target.value})} disabled={!formData.pays_id}>
                  <option value="National">National</option>
                  <option value="Régional">Régional</option>
                  {villes.map(v => (
                    <option key={v.id} value={v.nom}>{v.nom}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date de début</label>
                <input type="date" className="input-field" value={formData.date_debut} onChange={(e) => setFormData({...formData, date_debut: e.target.value})} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date limite *</label>
                <input type="date" className="input-field" value={formData.date_fin} onChange={(e) => setFormData({...formData, date_fin: e.target.value})} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description courte *</label>
              <textarea rows="3" className="input-field" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description complète</label>
              <textarea rows="8" className="input-field" value={formData.description_longue} onChange={(e) => setFormData({...formData, description_longue: e.target.value})} />
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Informations de contact</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email de contact *</label>
                  <input type="email" className="input-field" value={formData.contact} onChange={(e) => setFormData({...formData, contact: e.target.value})} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
                  <input type="tel" className="input-field" value={formData.telephone} onChange={(e) => setFormData({...formData, telephone: e.target.value})} />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Lien externe (optionnel)</label>
                  <input type="url" placeholder="https://..." className="input-field" value={formData.lien_externe} onChange={(e) => setFormData({...formData, lien_externe: e.target.value})} />
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Pièces jointes (optionnel)</h3>
              <p className="text-sm text-gray-600 mb-4">
                Ajoutez des documents : cahier des charges, formulaires, recommandations, etc.
              </p>
              <FileUploader
                fichiers={formData.pieces_jointes}
                onChange={(nouveauxFichiers) => setFormData({...formData, pieces_jointes: nouveauxFichiers})}
              />
            </div>

            <div className="flex gap-4 pt-6">
              <button onClick={sauvegarderAnnonce} className="btn-primary flex-1">
                {annonceEnCours ? 'Modifier' : 'Publier'} l'annonce
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
    <AdminLayout titre="Gestion des Annonces" sousTitre={`${annonces.length} annonces publiées`}>
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <button onClick={ajouterAnnonce} className="btn-primary flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Publier une annonce
        </button>

        <div className="flex-1 flex gap-3">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-3 text-gray-400" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Rechercher une annonce..."
              className="input-field pl-10"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
            />
          </div>

          <select
            className="input-field"
            value={filtreType}
            onChange={(e) => setFiltreType(e.target.value)}
          >
            <option value="">Tous les types</option>
            <option value="Financement">Financement</option>
            <option value="Appel d'offres">Appel d'offres</option>
            <option value="Emploi">Emploi</option>
          </select>
        </div>
      </div>

      <div className="space-y-6">
        {annoncesFiltrees.map((annonce) => {
          const joursRestants = Math.ceil((new Date(annonce.date_fin) - new Date()) / (1000 * 60 * 60 * 24));
          const estExpire = joursRestants < 0;

          const typeConfig = {
            'Financement': { icon: '💰', color: 'bg-blue-500' },
            'Appel d\'offres': { icon: '📄', color: 'bg-green-500' },
            'Emploi': { icon: '💼', color: 'bg-purple-500' }
          };
          const config = typeConfig[annonce.type];

          return (
            <div key={annonce.id} className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className={`w-16 h-16 ${config.color} rounded-full flex items-center justify-center text-3xl`}>
                    {config.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-800">{annonce.titre}</h3>
                      {estExpire && (
                        <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">
                          Expiré
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-primary mb-2">{annonce.organisme}</p>
                    <p className="text-gray-600 mb-3">{annonce.description}</p>
                    
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                      <span className={`px-2 py-1 rounded text-xs font-bold text-white ${config.color}`}>
                        {annonce.type}
                      </span>
                      <span>📍 {annonce.ville}, {annonce.pays?.nom}</span>
                      <span>📅 Expire le {new Date(annonce.date_fin).toLocaleDateString('fr-FR')}</span>
                      <span className={`font-semibold ${
                        estExpire ? 'text-red-600' :
                        joursRestants <= 7 ? 'text-orange-600' : 'text-green-600'
                      }`}>
                        {estExpire ? 'Expiré' : `${joursRestants} jour${joursRestants > 1 ? 's' : ''} restant${joursRestants > 1 ? 's' : ''}`}
                      </span>
                      {annonce.pieces_jointes && annonce.pieces_jointes.length > 0 && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-bold">
                          📎 {annonce.pieces_jointes.length} fichier{annonce.pieces_jointes.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button onClick={() => modifierAnnonce(annonce)} className="p-2 text-blue-600 hover:bg-blue-50 rounded">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button onClick={() => supprimerAnnonce(annonce.id)} className="p-2 text-red-600 hover:bg-red-50 rounded">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {annoncesFiltrees.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl shadow">
          <div className="text-6xl mb-4">📢</div>
          <p className="text-xl text-gray-600 mb-2">Aucune annonce trouvée</p>
          <p className="text-gray-500">Essayez avec d'autres critères de recherche</p>
        </div>
      )}
    </AdminLayout>
  );
}