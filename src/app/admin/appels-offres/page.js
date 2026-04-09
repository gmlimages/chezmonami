// src/app/admin/appels-offres/page.js
'use client';
import { useState, useEffect } from 'react';
import AdminLayout from '@/app/admin/AdminLayout';
import { supabase } from '@/lib/supabase';

const TYPES_APPEL = [
  { value: 'appel_offres', label: "Appel d'offres" },
  { value: 'offre_internationale', label: 'Offre internationale' },
  { value: 'partenariat', label: 'Partenariat' },
  { value: 'autre', label: 'Autre' },
];

const STATUTS_APPEL = [
  { value: 'brouillon', label: 'Brouillon', color: 'bg-gray-100 text-gray-700' },
  { value: 'actif', label: 'Actif', color: 'bg-green-100 text-green-800' },
  { value: 'ferme', label: 'Fermé', color: 'bg-orange-100 text-orange-800' },
  { value: 'archive', label: 'Archivé', color: 'bg-blue-100 text-blue-800' },
];

const STATUTS_REPONSE = [
  { value: 'soumise', label: 'Soumise', color: 'bg-gray-100 text-gray-700' },
  { value: 'vue', label: 'Vue', color: 'bg-blue-100 text-blue-800' },
  { value: 'retenue', label: 'Retenue', color: 'bg-green-100 text-green-800' },
  { value: 'refusee', label: 'Refusée', color: 'bg-red-100 text-red-800' },
];

const statutAppelColor = (statut) => {
  return STATUTS_APPEL.find((s) => s.value === statut)?.color || 'bg-gray-100 text-gray-700';
};
const statutReponseColor = (statut) => {
  return STATUTS_REPONSE.find((s) => s.value === statut)?.color || 'bg-gray-100 text-gray-700';
};

const FORM_INITIAL = {
  titre: '',
  description: '',
  description_longue: '',
  type: 'appel_offres',
  categorie_id: '',
  pays_id: '',
  ville_id: '',
  international: false,
  date_limite: '',
  statut: 'actif',
};

export default function AdminAppelsOffres() {
  // Vues : 'liste' | 'detail'
  const [vue, setVue] = useState('liste');
  const [appelSelectionne, setAppelSelectionne] = useState(null);

  const [appels, setAppels] = useState([]);
  const [reponses, setReponses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pays, setPays] = useState([]);
  const [villes, setVilles] = useState([]);
  const [villesFiltrees, setVillesFiltrees] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadingReponses, setLoadingReponses] = useState(false);
  const [formulaireOuvert, setFormulaireOuvert] = useState(false);
  const [formData, setFormData] = useState(FORM_INITIAL);
  const [formLoading, setFormLoading] = useState(false);

  const [message, setMessage] = useState(null);
  const [actionEnCours, setActionEnCours] = useState(null);
  const [adminId, setAdminId] = useState(null);
  const [formFichiers, setFormFichiers] = useState([]); // fichiers sélectionnés pour le formulaire

  useEffect(() => {
    const adminAuth = localStorage.getItem('adminAuth');
    if (!adminAuth) return;
    const admin = JSON.parse(adminAuth);
    setAdminId(admin.id || null);
    chargerDonnees();
  }, []);

  // Filtrer les villes quand pays_id change
  useEffect(() => {
    if (formData.pays_id) {
      setVillesFiltrees(villes.filter((v) => String(v.pays_id) === String(formData.pays_id)));
    } else {
      setVillesFiltrees([]);
    }
    // Réinitialiser ville_id si on change de pays
    setFormData((prev) => ({ ...prev, ville_id: '' }));
  }, [formData.pays_id, villes]);

  const chargerDonnees = async () => {
    setLoading(true);
    try {
      const [appelsRes, catsRes, paysRes, villesRes] = await Promise.all([
        supabase
          .from('appels_offres')
          .select(`
            id,
            titre,
            type,
            statut,
            date_limite,
            international,
            fichiers,
            created_at,
            categories ( id, nom ),
            pays ( id, nom ),
            villes ( id, nom )
          `)
          .order('created_at', { ascending: false }),
        supabase.from('categories').select('id, nom').order('nom'),
        supabase.from('pays').select('id, nom').order('nom'),
        supabase.from('villes').select('id, nom, pays_id').order('nom'),
      ]);

      if (appelsRes.error) throw appelsRes.error;
      setAppels(appelsRes.data || []);
      setCategories(catsRes.data || []);
      setPays(paysRes.data || []);
      setVilles(villesRes.data || []);
    } catch (err) {
      afficherMessage('Erreur chargement : ' + err.message, 'erreur');
    } finally {
      setLoading(false);
    }
  };

  const chargerReponses = async (appelId) => {
    setLoadingReponses(true);
    try {
      const { data, error } = await supabase
        .from('reponses_appels_offres')
        .select(`
          id,
          statut,
          contenu,
          fichiers,
          created_at,
          comptes_structures (
            id,
            nom_contact,
            email
          )
        `)
        .eq('appel_offre_id', appelId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReponses(data || []);
    } catch (err) {
      afficherMessage('Erreur chargement réponses : ' + err.message, 'erreur');
    } finally {
      setLoadingReponses(false);
    }
  };

  const afficherMessage = (texte, type = 'succes') => {
    setMessage({ texte, type });
    setTimeout(() => setMessage(null), 4000);
  };

  const ouvrirDetail = async (appel) => {
    setAppelSelectionne(appel);
    setVue('detail');
    await chargerReponses(appel.id);
  };

  const retourListe = () => {
    setVue('liste');
    setAppelSelectionne(null);
    setReponses([]);
  };

  const changerStatutAppel = async (appelId, nouveauStatut) => {
    if (nouveauStatut === 'supprimer') {
      if (!confirm('Supprimer définitivement cet appel d\'offres ?')) return;
    }
    setActionEnCours(appelId + '_statut');
    try {
      if (nouveauStatut === 'supprimer') {
        const { error } = await supabase.from('appels_offres').delete().eq('id', appelId);
        if (error) throw error;
        afficherMessage('Appel d\'offres supprimé.');
        if (appelSelectionne?.id === appelId) retourListe();
      } else {
        const { error } = await supabase
          .from('appels_offres')
          .update({ statut: nouveauStatut })
          .eq('id', appelId);
        if (error) throw error;
        afficherMessage('Statut mis à jour.');
        if (appelSelectionne?.id === appelId) {
          setAppelSelectionne((prev) => ({ ...prev, statut: nouveauStatut }));
        }
      }
      await chargerDonnees();
    } catch (err) {
      afficherMessage('Erreur : ' + err.message, 'erreur');
    } finally {
      setActionEnCours(null);
    }
  };

  const changerStatutReponse = async (reponseId, nouveauStatut) => {
    setActionEnCours(reponseId + '_reponse');
    try {
      const { error } = await supabase
        .from('reponses_appels_offres')
        .update({ statut: nouveauStatut })
        .eq('id', reponseId);
      if (error) throw error;
      afficherMessage('Statut de la réponse mis à jour.');
      setReponses((prev) =>
        prev.map((r) => (r.id === reponseId ? { ...r, statut: nouveauStatut } : r))
      );
    } catch (err) {
      afficherMessage('Erreur : ' + err.message, 'erreur');
    } finally {
      setActionEnCours(null);
    }
  };

  const soumettreFormulaire = async (e) => {
    e.preventDefault();
    if (!formData.titre.trim() || !formData.description.trim() || !formData.date_limite) {
      afficherMessage('Titre, description et date limite sont obligatoires.', 'erreur');
      return;
    }
    setFormLoading(true);
    try {
      const adminAuth = localStorage.getItem('adminAuth');
      const adminToken = adminAuth ? JSON.parse(adminAuth).token || '' : '';

      const fd = new FormData();
      fd.append('titre', formData.titre.trim());
      fd.append('description', formData.description.trim());
      fd.append('description_longue', formData.description_longue.trim() || '');
      fd.append('type', formData.type);
      fd.append('categorie_id', formData.categorie_id || '');
      fd.append('pays_id', formData.pays_id || '');
      fd.append('ville_id', formData.ville_id || '');
      fd.append('international', String(formData.international));
      fd.append('date_limite', formData.date_limite);
      fd.append('statut', formData.statut);
      fd.append('cree_par', adminId || '');
      formFichiers.forEach(f => fd.append('fichiers', f));

      const res = await fetch('/api/admin/appels-offres', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur création');

      afficherMessage('Appel d\'offres créé avec succès.');
      setFormData(FORM_INITIAL);
      setFormFichiers([]);
      setFormulaireOuvert(false);
      await chargerDonnees();
    } catch (err) {
      afficherMessage('Erreur création : ' + err.message, 'erreur');
    } finally {
      setFormLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatDateHeure = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const nbReponsesParAppel = (appelId) => {
    // Calculé depuis la liste des réponses chargées si on est dans le détail
    return null;
  };

  return (
    <AdminLayout titre="Appels d'offres" sousTitre="Création et suivi des appels d'offres">
      {/* Notification message */}
      {message && (
        <div
          className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-lg shadow-lg text-white font-medium transition-all ${
            message.type === 'erreur' ? 'bg-red-500' : 'bg-green-500'
          }`}
        >
          {message.texte}
        </div>
      )}

      {/* ======================== VUE LISTE ======================== */}
      {vue === 'liste' && (
        <>
          {/* Bouton Créer */}
          <div className="flex justify-end mb-6">
            <button
              onClick={() => setFormulaireOuvert(true)}
              className="px-5 py-2.5 bg-primary text-white rounded-xl font-semibold text-sm hover:opacity-90 transition shadow"
            >
              + Créer un appel d'offres
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : appels.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <div className="text-5xl mb-4">📋</div>
              <p className="text-lg font-medium">Aucun appel d'offres</p>
              <p className="text-sm mt-2">Cliquez sur "Créer" pour commencer.</p>
            </div>
          ) : (
            <>
              {/* Cards Mobile */}
              <div className="grid gap-4 sm:hidden">
                {appels.map((appel) => (
                  <div
                    key={appel.id}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 p-4"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <p className="font-semibold text-gray-800 flex-1 mr-2">{appel.titre}</p>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${statutAppelColor(
                          appel.statut
                        )}`}
                      >
                        {appel.statut}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 mb-3">
                      <span>
                        Type: <strong>{TYPES_APPEL.find((t) => t.value === appel.type)?.label || appel.type}</strong>
                      </span>
                      {appel.categories?.nom && (
                        <span>Catégorie: <strong>{appel.categories.nom}</strong></span>
                      )}
                      {appel.pays?.nom && (
                        <span>Pays: <strong>{appel.pays.nom}</strong></span>
                      )}
                      <span>Limite: <strong>{formatDate(appel.date_limite)}</strong></span>
                      {appel.international && (
                        <span className="text-blue-600 font-semibold">International</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => ouvrirDetail(appel)}
                        className="px-3 py-1.5 text-xs bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition"
                      >
                        Voir réponses
                      </button>
                      {appel.statut === 'actif' && (
                        <button
                          onClick={() => changerStatutAppel(appel.id, 'ferme')}
                          disabled={actionEnCours === appel.id + '_statut'}
                          className="px-3 py-1.5 text-xs bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition disabled:opacity-50"
                        >
                          Fermer
                        </button>
                      )}
                      {appel.statut !== 'archive' && (
                        <button
                          onClick={() => changerStatutAppel(appel.id, 'archive')}
                          disabled={actionEnCours === appel.id + '_statut'}
                          className="px-3 py-1.5 text-xs bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition disabled:opacity-50"
                        >
                          Archiver
                        </button>
                      )}
                      <button
                        onClick={() => changerStatutAppel(appel.id, 'supprimer')}
                        disabled={actionEnCours === appel.id + '_statut'}
                        className="px-3 py-1.5 text-xs bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition disabled:opacity-50"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tableau Desktop */}
              <div className="hidden sm:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="px-4 py-3 text-left font-semibold text-gray-600">Titre</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600">Type</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600">Catégorie</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600">Pays</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600">Date limite</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600">Statut</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appels.map((appel) => (
                      <tr
                        key={appel.id}
                        className="border-b border-gray-50 hover:bg-gray-50 transition"
                      >
                        <td className="px-4 py-3 font-medium text-gray-800 max-w-xs">
                          <span className="line-clamp-1">{appel.titre}</span>
                          {appel.international && (
                            <span className="ml-2 text-xs text-blue-600 font-semibold">
                              Intl.
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                          {TYPES_APPEL.find((t) => t.value === appel.type)?.label || appel.type}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {appel.categories?.nom || <span className="text-gray-400">Tous</span>}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {appel.pays?.nom || <span className="text-gray-400">Tous</span>}
                        </td>
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                          {formatDate(appel.date_limite)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold ${statutAppelColor(
                              appel.statut
                            )}`}
                          >
                            {appel.statut}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            <button
                              onClick={() => ouvrirDetail(appel)}
                              className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition whitespace-nowrap"
                            >
                              Réponses
                            </button>
                            {appel.statut === 'actif' && (
                              <button
                                onClick={() => changerStatutAppel(appel.id, 'ferme')}
                                disabled={actionEnCours === appel.id + '_statut'}
                                className="px-2 py-1 text-xs bg-orange-50 text-orange-700 rounded hover:bg-orange-100 transition disabled:opacity-50"
                              >
                                Fermer
                              </button>
                            )}
                            {appel.statut !== 'archive' && (
                              <button
                                onClick={() => changerStatutAppel(appel.id, 'archive')}
                                disabled={actionEnCours === appel.id + '_statut'}
                                className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition disabled:opacity-50"
                              >
                                Archiver
                              </button>
                            )}
                            <button
                              onClick={() => changerStatutAppel(appel.id, 'supprimer')}
                              disabled={actionEnCours === appel.id + '_statut'}
                              className="px-2 py-1 text-xs bg-red-50 text-red-700 rounded hover:bg-red-100 transition disabled:opacity-50"
                            >
                              Suppr.
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}

      {/* ======================== VUE DETAIL ======================== */}
      {vue === 'detail' && appelSelectionne && (
        <div>
          {/* Retour */}
          <button
            onClick={retourListe}
            className="flex items-center gap-2 text-primary hover:text-primary-dark mb-5 text-sm font-medium"
          >
            <span>&larr;</span> Retour à la liste
          </button>

          {/* Carte récap appel */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-800 mb-1">{appelSelectionne.titre}</h2>
                <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                  <span>
                    Type:{' '}
                    <strong>
                      {TYPES_APPEL.find((t) => t.value === appelSelectionne.type)?.label ||
                        appelSelectionne.type}
                    </strong>
                  </span>
                  {appelSelectionne.categories?.nom && (
                    <span>
                      Catégorie: <strong>{appelSelectionne.categories.nom}</strong>
                    </span>
                  )}
                  {appelSelectionne.pays?.nom && (
                    <span>
                      Pays: <strong>{appelSelectionne.pays.nom}</strong>
                    </span>
                  )}
                  <span>
                    Date limite: <strong>{formatDate(appelSelectionne.date_limite)}</strong>
                  </span>
                  {appelSelectionne.international && (
                    <span className="text-blue-600 font-semibold">International</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${statutAppelColor(
                    appelSelectionne.statut
                  )}`}
                >
                  {appelSelectionne.statut}
                </span>
                {appelSelectionne.statut === 'actif' && (
                  <button
                    onClick={() => changerStatutAppel(appelSelectionne.id, 'ferme')}
                    disabled={actionEnCours === appelSelectionne.id + '_statut'}
                    className="px-3 py-1.5 text-xs bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition disabled:opacity-50"
                  >
                    Fermer
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Fichiers joints à l'appel */}
          {appelSelectionne.fichiers?.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
              <h3 className="font-semibold text-gray-700 text-sm mb-3">📎 Documents joints à l&apos;appel</h3>
              <div className="space-y-2">
                {appelSelectionne.fichiers.map((f, i) => (
                  <a
                    key={i}
                    href={`/api/admin/appels-offres/fichiers?path=${encodeURIComponent(f.path)}&nom=${encodeURIComponent(f.nom)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-lg hover:bg-blue-50 transition text-sm"
                  >
                    <span>📄</span>
                    <span className="flex-1 truncate text-gray-700">{f.nom}</span>
                    <span className="text-gray-400 text-xs flex-shrink-0">{(f.taille / 1024).toFixed(0)} Ko</span>
                    <span className="text-primary text-xs flex-shrink-0">Ouvrir</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Réponses */}
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            Réponses reçues
            {!loadingReponses && (
              <span className="ml-2 text-sm text-gray-500 font-normal">
                ({reponses.length})
              </span>
            )}
          </h3>

          {loadingReponses ? (
            <div className="flex justify-center items-center py-12">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : reponses.length === 0 ? (
            <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-gray-100">
              <div className="text-4xl mb-3">📭</div>
              <p className="font-medium">Aucune réponse pour cet appel d'offres</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reponses.map((reponse) => (
                <div
                  key={reponse.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 p-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                    <div>
                      <p className="font-semibold text-gray-800">
                        {reponse.comptes_structures?.nom_contact || 'Entreprise inconnue'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {reponse.comptes_structures?.email || ''}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Soumise le {formatDateHeure(reponse.created_at)}
                      </p>
                    </div>
                    <span
                      className={`self-start px-3 py-1 rounded-full text-xs font-semibold ${statutReponseColor(
                        reponse.statut
                      )}`}
                    >
                      {reponse.statut}
                    </span>
                  </div>

                  {/* Contenu de la réponse */}
                  {reponse.contenu && (
                    <div className="bg-gray-50 rounded-lg p-3 mb-3 text-sm text-gray-700 whitespace-pre-line">
                      {reponse.contenu}
                    </div>
                  )}

                  {/* Fichiers joints à la réponse */}
                  {reponse.fichiers?.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-semibold text-gray-500 mb-1.5">📎 Pièces jointes ({reponse.fichiers.length})</p>
                      <div className="space-y-1">
                        {reponse.fichiers.map((f, i) => (
                          <a
                            key={i}
                            href={`/api/admin/appels-offres/fichiers?path=${encodeURIComponent(f.path)}&nom=${encodeURIComponent(f.nom)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded text-xs hover:bg-blue-100 transition"
                          >
                            <span>📄</span>
                            <span className="flex-1 truncate text-gray-700">{f.nom}</span>
                            <span className="text-gray-400 flex-shrink-0">{(f.taille / 1024).toFixed(0)} Ko</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Boutons de changement de statut */}
                  <div className="flex flex-wrap gap-2">
                    {STATUTS_REPONSE.filter((s) => s.value !== reponse.statut).map((s) => (
                      <button
                        key={s.value}
                        onClick={() => changerStatutReponse(reponse.id, s.value)}
                        disabled={actionEnCours === reponse.id + '_reponse'}
                        className={`px-3 py-1.5 text-xs rounded-lg transition disabled:opacity-50 ${s.color} hover:opacity-80`}
                      >
                        Marquer {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ======================== MODAL CREATION ======================== */}
      {formulaireOuvert && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">Créer un appel d'offres</h2>
              <button
                onClick={() => {
                  setFormulaireOuvert(false);
                  setFormData(FORM_INITIAL);
                }}
                className="text-gray-400 hover:text-gray-700 text-2xl leading-none"
              >
                &times;
              </button>
            </div>

            {/* Formulaire */}
            <form onSubmit={soumettreFormulaire} className="p-5 space-y-4">
              {/* Titre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Titre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.titre}
                  onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
                  placeholder="Titre de l'appel d'offres"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description courte <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Résumé de l'appel d'offres"
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  required
                />
              </div>

              {/* Description longue */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description complète <span className="text-gray-400">(optionnel)</span>
                </label>
                <textarea
                  value={formData.description_longue}
                  onChange={(e) =>
                    setFormData({ ...formData, description_longue: e.target.value })
                  }
                  placeholder="Description détaillée, cahier des charges..."
                  rows={5}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>

              {/* Type + Statut */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {TYPES_APPEL.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Statut initial
                  </label>
                  <select
                    value={formData.statut}
                    onChange={(e) => setFormData({ ...formData, statut: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="actif">Actif</option>
                    <option value="brouillon">Brouillon</option>
                  </select>
                </div>
              </div>

              {/* Catégorie */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Catégorie{' '}
                  <span className="text-gray-400 font-normal">(laisser vide = tous secteurs)</span>
                </label>
                <select
                  value={formData.categorie_id}
                  onChange={(e) => setFormData({ ...formData, categorie_id: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Tous les secteurs</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nom}
                    </option>
                  ))}
                </select>
              </div>

              {/* International */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="international"
                  checked={formData.international}
                  onChange={(e) =>
                    setFormData({ ...formData, international: e.target.checked })
                  }
                  className="w-4 h-4 accent-primary"
                />
                <label htmlFor="international" className="text-sm font-medium text-gray-700">
                  Appel d'offres international (pays/ville optionnels)
                </label>
              </div>

              {/* Pays + Ville */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pays{' '}
                    <span className="text-gray-400 font-normal">(vide = tous pays)</span>
                  </label>
                  <select
                    value={formData.pays_id}
                    onChange={(e) => setFormData({ ...formData, pays_id: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Tous les pays</option>
                    {pays.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nom}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ville{' '}
                    <span className="text-gray-400 font-normal">(optionnel)</span>
                  </label>
                  <select
                    value={formData.ville_id}
                    onChange={(e) => setFormData({ ...formData, ville_id: e.target.value })}
                    disabled={!formData.pays_id}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-50 disabled:text-gray-400"
                  >
                    <option value="">
                      {formData.pays_id ? 'Toutes les villes' : 'Sélectionnez un pays'}
                    </option>
                    {villesFiltrees.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.nom}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Date limite */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date limite <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={formData.date_limite}
                  onChange={(e) => setFormData({ ...formData, date_limite: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>

              {/* Fichiers joints */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fichiers joints <span className="text-gray-400 font-normal">(max 5 fichiers · 5 Mo chacun)</span>
                </label>
                <label className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary transition text-sm text-gray-500">
                  <span>📎</span>
                  <span>Ajouter des fichiers (PDF, images...)</span>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx"
                    className="hidden"
                    onChange={(e) => {
                      const nouveaux = Array.from(e.target.files || []);
                      const total = formFichiers.length + nouveaux.length;
                      if (total > 5) { afficherMessage('Maximum 5 fichiers autorisés.', 'erreur'); return; }
                      const tropLourds = nouveaux.filter(f => f.size > 5 * 1024 * 1024);
                      if (tropLourds.length > 0) { afficherMessage(`Fichier trop lourd (max 5 Mo) : ${tropLourds[0].name}`, 'erreur'); return; }
                      setFormFichiers(prev => [...prev, ...nouveaux]);
                      e.target.value = '';
                    }}
                  />
                </label>
                {formFichiers.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {formFichiers.map((f, i) => (
                      <li key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-1.5 text-sm">
                        <span className="truncate flex-1 text-gray-700">📄 {f.name}</span>
                        <span className="text-gray-400 text-xs ml-2 flex-shrink-0">{(f.size / 1024).toFixed(0)} Ko</span>
                        <button type="button" onClick={() => setFormFichiers(prev => prev.filter((_, j) => j !== i))} className="ml-2 text-red-400 hover:text-red-600 flex-shrink-0">✕</button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Boutons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setFormulaireOuvert(false);
                    setFormData(FORM_INITIAL);
                    setFormFichiers([]);
                  }}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-gray-600 text-sm hover:bg-gray-50 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-semibold hover:opacity-90 transition disabled:opacity-50"
                >
                  {formLoading ? 'Création...' : "Créer l'appel d'offres"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
