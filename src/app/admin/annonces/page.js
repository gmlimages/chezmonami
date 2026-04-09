// src/app/admin/annonces/page.js
'use client';
import { useState, useEffect } from 'react';
import AdminLayout from '@/app/admin/AdminLayout';
import FileUploader from '@/components/FileUploader';
import { annoncesAPI, paysAPI, villesAPI } from '@/lib/api';

const PAR_PAGE = 20;

export default function AdminAnnonces() {
  const [mode, setMode] = useState('liste');
  const [annonceEnCours, setAnnonceEnCours] = useState(null);
  const [annonces, setAnnonces] = useState([]);
  const [pays, setPays] = useState([]);
  const [villes, setVilles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [villesFiltrees, setVillesFiltrees] = useState([]);
  const [recherche, setRecherche] = useState('');
  const [filtreType, setFiltreType] = useState('');
  const [pageCourante, setPageCourante] = useState(1);
  
  const [formData, setFormData] = useState({
    titre: '',
    organisme: '',
    type: 'Financement',
    sous_type: '', // ← NOUVEAU
    pays_id: '',
    ville_id: '',
    description: '',
    description_longue: '',
    date_debut: '',
    date_fin: '',
    contact: '',
    telephone: '',
    lien_externe: '',
    pieces_jointes: []
  });

  // ← NOUVEAU : Types de contrats pour Emploi
  const typesContrat = [
    'CDI',
    'CDD',
    'Temps partiel',
    'Stage',
    'Alternance',
    'Freelance/Consultance',
    'Bénévolat'
  ];

  useEffect(() => {
    chargerDonnees();
  }, []);

  useEffect(() => {
    if (formData.pays_id) {
      chargerVilles(formData.pays_id);
    } else {
      setVillesFiltrees([]); // NOUVEAU : Vider si pas de pays
    }
  }, [formData.pays_id, villes]);

  // ← NOUVEAU : Réinitialiser sous_type si le type change
  useEffect(() => {
    if (formData.type !== 'Emploi') {
      setFormData(prev => ({ ...prev, sous_type: '' }));
    }
  }, [formData.type]);

  const chargerDonnees = async () => {
    try {
      setLoading(true);
      const [annoncesData, paysData, villesData] = await Promise.all([
        annoncesAPI.getAll(),
        paysAPI.getAll(),
        villesAPI.getAll() 
      ]);
      setAnnonces(annoncesData);
      setPays(paysData);
      setVilles(villesData); 
    } catch (error) {
      console.error('Erreur chargement:', error);
      alert('❌ Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const chargerVilles = async (paysId) => {
    try {
        const villesDuPays = villes.filter(v => v.pays_id === paysId);
      setVillesFiltrees(villesDuPays);
    } catch (error) {
      console.error('Erreur chargement villes:', error);
      setVillesFiltrees([]);
    }
  };

  const ajouterAnnonce = () => {
    setAnnonceEnCours(null);
    setFormData({
      titre: '',
      organisme: '',
      type: 'Financement',
      sous_type: '', // ← NOUVEAU
      pays_id: '',
      ville_id: '',
      description: '',
      description_longue: '',
      date_debut: '',
      date_fin: '',
      contact: '',
      telephone: '',
      lien_externe: '',
      pieces_jointes: []
    });
    setVillesFiltrees([]);
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
      sous_type: annonce.sous_type || '', // ← NOUVEAU
      pays_id: annonce.pays?.id || '',
      ville_id: annonce.ville?.id || '',
      description: annonce.description,
      description_longue: annonce.description_longue || '',
      date_debut: annonce.date_debut || '',
      date_fin: annonce.date_fin,
      contact: annonce.contact,
      telephone: annonce.telephone || '',
      lien_externe: annonce.lien_externe || '',
      pieces_jointes: annonce.pieces_jointes || []
    });
    setMode('formulaire');
  };

  const sauvegarderAnnonce = async () => {
    if (!formData.titre || !formData.organisme || !formData.type || !formData.pays_id || 
        !formData.description || !formData.date_fin || !formData.contact) {
      alert('⚠️ Veuillez remplir tous les champs obligatoires');
      return;
    }

    // ← NOUVEAU : Vérifier que le sous_type est rempli si type = Emploi
    if (formData.type === 'Emploi' && !formData.sous_type) {
      alert('⚠️ Veuillez sélectionner un type de contrat pour les offres d\'emploi');
      return;
    }

    try {
      const dataToSend = {
        ...formData,
        sous_type: formData.type === 'Emploi' ? formData.sous_type : null // ← NOUVEAU
      };

      if (annonceEnCours) {
        await annoncesAPI.update(annonceEnCours.id, dataToSend);
        alert('✅ Annonce modifiée avec succès !');
      } else {
        await annoncesAPI.create(dataToSend);
        alert('✅ Annonce publiée avec succès !');
      }
      
      await chargerDonnees();
      setMode('liste');
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      alert('❌ Erreur lors de la sauvegarde : ' + error.message);
    }
  };

  const supprimerAnnonce = async (id) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette annonce ?')) {
      return;
    }

    try {
      await annoncesAPI.delete(id);
      alert('✅ Annonce supprimée !');
      await chargerDonnees();
    } catch (error) {
      console.error('Erreur suppression:', error);
      alert('❌ Erreur lors de la suppression');
    }
  };

  const annoncesFiltrees = annonces.filter(a => {
    const matchRecherche = !recherche ||
      a.titre.toLowerCase().includes(recherche.toLowerCase()) ||
      a.organisme.toLowerCase().includes(recherche.toLowerCase());
    const matchType = !filtreType || a.type === filtreType;
    return matchRecherche && matchType;
  });

  const nbPages = Math.ceil(annoncesFiltrees.length / PAR_PAGE);
  const annoncesPaginees = annoncesFiltrees.slice((pageCourante - 1) * PAR_PAGE, pageCourante * PAR_PAGE);

  if (loading) {
    return (
      <AdminLayout titre="Gestion des Annonces">
        <div className="text-center py-12">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Chargement...</p>
        </div>
      </AdminLayout>
    );
  }

  if (mode === 'formulaire') {
    return (
      <AdminLayout titre={annonceEnCours ? "Modifier l'annonce" : "Nouvelle annonce"}>
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => setMode('liste')}
            className="mb-6 flex items-center gap-2 text-primary hover:text-primary-dark"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
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

              {/* ← MODIFIÉ : Nouveaux types */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type d'annonce *</label>
                <select className="input-field" value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})}>
                  <option value="Financement">💰 Financement</option>
                  <option value="Appel d'offres">📋 Appel d'offres</option>
                  <option value="Emploi">💼 Emploi</option>
                  <option value="Salon BtoB">🏢 Salon BtoB</option>
                  <option value="Voyage d'affaires">✈️ Voyage d'affaires</option>
                  <option value="Partenariat">🤝 Partenariat</option>
                </select>
              </div>

              {/* ← NOUVEAU : Type de contrat (conditionnel si Emploi) */}
              {formData.type === 'Emploi' && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type de contrat *</label>
                  <select 
                    className="input-field" 
                    value={formData.sous_type} 
                    onChange={(e) => setFormData({...formData, sous_type: e.target.value})}
                  >
                    <option value="">Sélectionner un type de contrat</option>
                    {typesContrat.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Obligatoire pour les offres d'emploi
                  </p>
                </div>
              )}

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
                <label className="block text-sm font-medium text-gray-700 mb-2">Ville</label>
                <select 
                  className="input-field" 
                  value={formData.ville_id || ''} 
                  onChange={(e) => setFormData({...formData, ville_id: e.target.value})} 
                  disabled={!formData.pays_id}
                >
                  <option value="">Sélectionner une ville (optionnel)</option>
                  {villesFiltrees.map(v => (
                    <option key={v.id} value={v.id}>{v.nom}</option>
                  ))}
                </select>
                {!formData.pays_id && (
                  <p className="text-xs text-gray-500 mt-1">
                    Sélectionnez d'abord un pays
                  </p>
                )}
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
    <AdminLayout titre="📢 Gestion des Annonces" sousTitre={`${annonces.length} annonces au total`}>
      <div className="mb-6 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <button onClick={ajouterAnnonce} className="btn-primary whitespace-nowrap flex items-center justify-center gap-2">
          <span>➕</span> Nouvelle annonce
        </button>
        <div className="flex flex-col sm:flex-row gap-3 flex-1 sm:max-w-2xl">
          <input
            type="text"
            placeholder="Rechercher..."
            className="input-field flex-1"
            value={recherche}
            onChange={(e) => { setRecherche(e.target.value); setPageCourante(1); }}
          />
          <select
            className="input-field sm:w-52"
            value={filtreType}
            onChange={(e) => { setFiltreType(e.target.value); setPageCourante(1); }}
          >
            <option value="">Tous les types</option>
            <option value="Financement">💰 Financement</option>
            <option value="Appel d'offres">📋 Appel d&apos;offres</option>
            <option value="Emploi">💼 Emploi</option>
            <option value="Salon BtoB">🏢 Salon BtoB</option>
            <option value="Voyage d'affaires">✈️ Voyage d&apos;affaires</option>
            <option value="Partenariat">🤝 Partenariat</option>
          </select>
        </div>
      </div>

      {annoncesFiltrees.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl shadow">
          <div className="text-6xl mb-4">📢</div>
          <p className="text-xl text-gray-600 mb-4">Aucune annonce trouvée</p>
          <button onClick={ajouterAnnonce} className="btn-primary">
            Publier la première annonce
          </button>
        </div>
      ) : (
        <>
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-gray-700">Annonce</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-gray-700 hidden sm:table-cell">Type</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-gray-700 hidden md:table-cell">Localisation</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-gray-700 hidden lg:table-cell">Date limite</th>
                  <th className="px-4 py-4 text-center text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {annoncesPaginees.map(annonce => (
                  <tr key={annonce.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <p className="font-semibold text-gray-800 leading-tight">{annonce.titre}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{annonce.organisme}</p>
                    </td>
                    <td className="px-4 py-4 hidden sm:table-cell">
                      <span className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs font-semibold whitespace-nowrap">
                        {annonce.type}
                      </span>
                      {annonce.type === 'Emploi' && annonce.sous_type && (
                        <span className="ml-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold whitespace-nowrap">
                          {annonce.sous_type}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell">
                      <p className="text-sm text-gray-800">{annonce.pays?.nom}</p>
                      {annonce.ville && <p className="text-xs text-gray-500">{annonce.ville.nom}</p>}
                    </td>
                    <td className="px-4 py-4 hidden lg:table-cell">
                      <p className="text-sm text-gray-700">
                        {annonce.date_fin ? new Date(annonce.date_fin).toLocaleDateString('fr-FR') : '—'}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <button onClick={() => modifierAnnonce(annonce)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title="Modifier">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button onClick={() => supprimerAnnonce(annonce.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg" title="Supprimer">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {nbPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {((pageCourante - 1) * PAR_PAGE) + 1}–{Math.min(pageCourante * PAR_PAGE, annoncesFiltrees.length)} sur {annoncesFiltrees.length} annonces
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setPageCourante(p => Math.max(1, p - 1))}
                disabled={pageCourante === 1}
                className="px-3 py-2 rounded-lg border border-gray-200 text-sm hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ‹
              </button>
              {Array.from({ length: nbPages }, (_, i) => i + 1).filter(p => p === 1 || p === nbPages || Math.abs(p - pageCourante) <= 2).map((p, idx, arr) => (
                <span key={p}>
                  {idx > 0 && arr[idx - 1] !== p - 1 && <span className="px-2 py-2 text-gray-400 text-sm">…</span>}
                  <button
                    onClick={() => setPageCourante(p)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition ${pageCourante === p ? 'bg-primary text-white' : 'border border-gray-200 hover:bg-gray-50'}`}
                  >
                    {p}
                  </button>
                </span>
              ))}
              <button
                onClick={() => setPageCourante(p => Math.min(nbPages, p + 1))}
                disabled={pageCourante === nbPages}
                className="px-3 py-2 rounded-lg border border-gray-200 text-sm hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ›
              </button>
            </div>
          </div>
        )}
        </>
      )}
    </AdminLayout>
  );
}