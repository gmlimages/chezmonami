// src/app/admin/comptes-entreprises/page.js
'use client';
import { useState, useEffect } from 'react';
import AdminLayout from '@/app/admin/AdminLayout';
import { supabase } from '@/lib/supabase';

const TYPES_DOCUMENTS = [
  { value: 'registre_commerce', label: 'Registre de commerce', icon: '📋' },
  { value: 'statuts_societe', label: 'Statuts de la société', icon: '📄' },
  { value: 'identite_dirigeant', label: "Pièce d'identité du dirigeant", icon: '🪪' },
  { value: 'justificatif_adresse', label: "Justificatif d'adresse", icon: '🏢' },
  { value: 'autre', label: 'Autre document', icon: '📎' },
];

const docStatutColors = {
  en_attente: 'bg-yellow-100 text-yellow-800',
  valide: 'bg-green-100 text-green-800',
  refuse: 'bg-red-100 text-red-800',
};

const TYPES_ABONNEMENT = [
  { value: 'gratuit',      label: 'Gratuit',      duree: null },
  { value: 'mensuel',      label: 'Mensuel',       duree: 1   },
  { value: 'trimestriel',  label: 'Trimestriel',   duree: 3   },
  { value: 'semestriel',   label: 'Semestriel',    duree: 6   },
  { value: 'annuel',       label: 'Annuel',        duree: 12  },
];

const calcDateFin = (datePaiement, typeAbonnement) => {
  const info = TYPES_ABONNEMENT.find(t => t.value === typeAbonnement);
  if (!info?.duree) return null;
  const d = new Date(datePaiement);
  d.setMonth(d.getMonth() + info.duree);
  return d.toISOString().split('T')[0];
};

const STATUTS = [
  { value: 'tous', label: 'Tous' },
  { value: 'en_attente', label: 'En attente' },
  { value: 'actif', label: 'Actif' },
  { value: 'suspendu', label: 'Suspendu' },
];

const statutColors = {
  en_attente: 'bg-yellow-100 text-yellow-800',
  actif: 'bg-green-100 text-green-800',
  suspendu: 'bg-red-100 text-red-800',
};

export default function AdminComptesEntreprises() {
  const [comptes, setComptes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtreStatut, setFiltreStatut] = useState('tous');
  const [recherche, setRecherche] = useState('');
  const [compteSelectionne, setCompteSelectionne] = useState(null);
  const [modalOuvert, setModalOuvert] = useState(false);
  const [message, setMessage] = useState(null);
  const [actionEnCours, setActionEnCours] = useState(null);
  const [ongletModal, setOngletModal] = useState('infos'); // 'infos' | 'abonnement' | 'documents' | 'reclamations'
  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [commentaireDoc, setCommentaireDoc] = useState({});
  const [reclamations, setReclamations] = useState([]);
  const [nbReclamationsEnAttente, setNbReclamationsEnAttente] = useState(0);
  const [messageReclamAdmin, setMessageReclamAdmin] = useState({}); // { [reclamId]: '' }

  // Formulaire abonnement
  const [abonnementForm, setAbonnementForm] = useState({
    abonnement: 'gratuit',
    montant_paiement: '',
    date_paiement: new Date().toISOString().split('T')[0],
    date_fin_abonnement: '',
    notes_abonnement: '',
  });
  const [savingAbonnement, setSavingAbonnement] = useState(false);

  // Formulaire d'édition dans le modal
  const [editForm, setEditForm] = useState({
    nom_contact: '',
    email_contact: '',
    telephone_contact: '',
  });

  useEffect(() => {
    const adminAuth = localStorage.getItem('adminAuth');
    if (!adminAuth) return;
    chargerComptes();
    chargerNbReclamations();
  }, []);

  const chargerNbReclamations = async () => {
    try {
      const res = await fetch('/api/admin/reclamations?statut=en_attente');
      if (res.ok) {
        const { reclamations: data } = await res.json();
        setNbReclamationsEnAttente(data?.length || 0);
      }
    } catch {}
  };

  const chargerComptes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('comptes_structures')
        .select(`
          id,
          nom_contact,
          email,
          email_contact,
          telephone_contact,
          telephone,
          photo_profil,
          statut,
          abonnement,
          badge_verifie,
          date_inscription,
          structure_id,
          demande_suppression,
          date_demande_suppression,
          motif_suppression,
          date_paiement,
          date_fin_abonnement,
          montant_paiement,
          notes_abonnement,
          structures (
            id,
            nom
          )
        `)
        .order('date_inscription', { ascending: false });

      if (error) throw error;
      setComptes(data || []);
    } catch (err) {
      afficherMessage('Erreur lors du chargement des comptes : ' + err.message, 'erreur');
    } finally {
      setLoading(false);
    }
  };

  const afficherMessage = (texte, type = 'succes') => {
    setMessage({ texte, type });
    setTimeout(() => setMessage(null), 4000);
  };

  const validerCompte = async (id) => {
    setActionEnCours(id + '_valider');
    try {
      const res = await fetch(`/api/admin/valider-compte/${id}`, { method: 'POST' });
      if (!res.ok) throw new Error('Erreur lors de la validation');
      afficherMessage('Compte validé avec succès. Email de confirmation envoyé.');
      await chargerComptes();
    } catch (err) {
      afficherMessage('Erreur : ' + err.message, 'erreur');
    } finally {
      setActionEnCours(null);
    }
  };

  const suspendreCompte = async (id) => {
    if (!confirm('Voulez-vous vraiment suspendre ce compte ?')) return;
    setActionEnCours(id + '_suspendre');
    try {
      const { error } = await supabase
        .from('comptes_structures')
        .update({ statut: 'suspendu' })
        .eq('id', id);
      if (error) throw error;
      afficherMessage('Compte suspendu.');
      await chargerComptes();
    } catch (err) {
      afficherMessage('Erreur : ' + err.message, 'erreur');
    } finally {
      setActionEnCours(null);
    }
  };

  const toggleBadge = async (id, valeurActuelle) => {
    setActionEnCours(id + '_badge');
    try {
      const res = await fetch(`/api/admin/badge-verifie/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ badge_verifie: !valeurActuelle }),
      });
      if (!res.ok) throw new Error('Erreur');
      afficherMessage(!valeurActuelle ? 'Badge vérifié accordé. Email envoyé.' : 'Badge vérifié retiré.');
      await chargerComptes();
      if (compteSelectionne?.id === id) {
        setCompteSelectionne(prev => ({ ...prev, badge_verifie: !valeurActuelle }));
      }
    } catch (err) {
      afficherMessage('Erreur : ' + err.message, 'erreur');
    } finally {
      setActionEnCours(null);
    }
  };

  const sauvegarderAbonnement = async () => {
    if (!compteSelectionne) return;
    setSavingAbonnement(true);
    try {
      const res = await fetch(`/api/admin/abonnement/${compteSelectionne.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          abonnement: abonnementForm.abonnement,
          montant_paiement: abonnementForm.montant_paiement ? parseFloat(abonnementForm.montant_paiement) : null,
          date_paiement: abonnementForm.date_paiement || null,
          date_fin_abonnement: abonnementForm.date_fin_abonnement || null,
          notes_abonnement: abonnementForm.notes_abonnement || null,
        }),
      });
      if (!res.ok) throw new Error();
      afficherMessage('Abonnement mis à jour avec succès.');
      chargerComptes();
      // Mettre à jour compteSelectionne local
      const { compte: updated } = await res.json();
      setCompteSelectionne(prev => ({ ...prev, ...updated }));
    } catch {
      afficherMessage('Erreur lors de la mise à jour.', 'erreur');
    } finally {
      setSavingAbonnement(false);
    }
  };

  const ouvrirModal = async (compte) => {
    setCompteSelectionne(compte);
    setEditForm({
      nom_contact: compte.nom_contact || '',
      email_contact: compte.email_contact || '',
      telephone_contact: compte.telephone_contact || '',
    });
    setAbonnementForm({
      abonnement: compte.abonnement || 'gratuit',
      montant_paiement: compte.montant_paiement ? String(compte.montant_paiement) : '',
      date_paiement: compte.date_paiement
        ? new Date(compte.date_paiement).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      date_fin_abonnement: compte.date_fin_abonnement
        ? new Date(compte.date_fin_abonnement).toISOString().split('T')[0]
        : '',
      notes_abonnement: compte.notes_abonnement || '',
    });
    setOngletModal('infos');
    setDocuments([]);
    setCommentaireDoc({});
    setModalOuvert(true);
    // Charger les documents + réclamations
    chargerDocumentsCompte(compte.id);
    chargerReclamations(compte.id);
  };

  const chargerDocumentsCompte = async (compteId) => {
    setLoadingDocs(true);
    try {
      const { data } = await supabase
        .from('documents_entreprises')
        .select('*')
        .eq('compte_id', compteId)
        .order('created_at', { ascending: false });
      setDocuments(data || []);
    } finally {
      setLoadingDocs(false);
    }
  };

  const chargerReclamations = async (compteId) => {
    try {
      const res = await fetch(`/api/admin/reclamations?compte_id=${compteId}`);
      if (res.ok) {
        const { reclamations: data } = await res.json();
        setReclamations(data || []);
      }
    } catch {}
  };

  const validerDocument = async (docId, statut) => {
    setActionEnCours('doc_' + docId);
    try {
      let nomAdmin = 'Administration';
      try { nomAdmin = JSON.parse(localStorage.getItem('adminAuth') || '{}').nom || 'Administration'; } catch {}
      const res = await fetch(`/api/admin/documents/${docId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut, commentaire_admin: commentaireDoc[docId] || null, nom_admin: nomAdmin }),
      });
      if (!res.ok) throw new Error('Erreur');
      afficherMessage(statut === 'valide' ? 'Document validé.' : 'Document refusé.');
      chargerDocumentsCompte(compteSelectionne.id);
      chargerComptes(); // recharger pour mise à jour du badge
    } catch {
      afficherMessage('Erreur lors de la mise à jour du document.', 'erreur');
    } finally {
      setActionEnCours(null);
    }
  };

  const validerReclamation = async (reclamId, statut) => {
    setActionEnCours('reclam_' + reclamId);
    const msg = messageReclamAdmin[reclamId] || null;
    try {
      const res = await fetch(`/api/admin/reclamations/${reclamId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut, message_admin: msg }),
      });
      if (!res.ok) throw new Error('Erreur');
      afficherMessage(statut === 'approuvee' ? 'Réclamation approuvée. Structure liée au compte.' : 'Réclamation refusée.');
      chargerReclamations(compteSelectionne.id);
      chargerComptes();
      chargerNbReclamations();
    } catch {
      afficherMessage('Erreur lors du traitement de la réclamation.', 'erreur');
    } finally {
      setActionEnCours(null);
    }
  };

  const supprimerReclamation = async (reclamId) => {
    if (!confirm('Supprimer cette réclamation ?')) return;
    setActionEnCours('reclam_del_' + reclamId);
    try {
      const res = await fetch(`/api/admin/reclamations/${reclamId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erreur');
      afficherMessage('Réclamation supprimée.');
      chargerReclamations(compteSelectionne.id);
      chargerNbReclamations();
    } catch {
      afficherMessage('Erreur lors de la suppression.', 'erreur');
    } finally {
      setActionEnCours(null);
    }
  };

  const fermerModal = () => {
    setModalOuvert(false);
    setCompteSelectionne(null);
    setDocuments([]);
    setReclamations([]);
  };

  const sauvegarderModifications = async () => {
    if (!compteSelectionne) return;
    setActionEnCours('sauvegarde');
    try {
      const { error } = await supabase
        .from('comptes_structures')
        .update({
          nom_contact: editForm.nom_contact,
          email_contact: editForm.email_contact,
          telephone_contact: editForm.telephone_contact,
        })
        .eq('id', compteSelectionne.id);
      if (error) throw error;
      afficherMessage('Modifications sauvegardées.');
      fermerModal();
      await chargerComptes();
    } catch (err) {
      afficherMessage('Erreur : ' + err.message, 'erreur');
    } finally {
      setActionEnCours(null);
    }
  };

  const supprimerCompte = async (id) => {
    if (!confirm('Supprimer définitivement ce compte ? Cette action est irréversible.')) return;
    setActionEnCours('suppr_' + id);
    try {
      const res = await fetch(`/api/admin/suppressions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'supprimer' }),
      });
      if (!res.ok) throw new Error();
      afficherMessage('Compte supprimé définitivement.');
      fermerModal();
      chargerComptes();
    } catch {
      afficherMessage('Erreur lors de la suppression.', 'erreur');
    } finally {
      setActionEnCours(null);
    }
  };

  const rejeterSuppression = async (id) => {
    setActionEnCours('rejeter_' + id);
    try {
      const res = await fetch(`/api/admin/suppressions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'rejeter' }),
      });
      if (!res.ok) throw new Error();
      afficherMessage('Demande de suppression rejetée.');
      chargerComptes();
      if (compteSelectionne?.id === id) fermerModal();
    } catch {
      afficherMessage('Erreur.', 'erreur');
    } finally {
      setActionEnCours(null);
    }
  };

  const comptesFiltres = comptes.filter((c) => {
    const matchStatut = filtreStatut === 'tous' || c.statut === filtreStatut;
    const matchRecherche =
      recherche === '' ||
      (c.nom_contact || '').toLowerCase().includes(recherche.toLowerCase()) ||
      (c.email || '').toLowerCase().includes(recherche.toLowerCase()) ||
      (c.structures?.nom || '').toLowerCase().includes(recherche.toLowerCase());
    return matchStatut && matchRecherche;
  });

  const nbEnAttente = comptes.filter((c) => c.statut === 'en_attente').length;
  const nbSuppression = comptes.filter((c) => c.demande_suppression).length;

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <AdminLayout titre="Comptes Entreprises" sousTitre="Gestion des comptes entreprises">
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

      {/* Bandeau demandes de suppression */}
      {nbSuppression > 0 && (
        <div className="mb-4 flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-5 py-4">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-500 text-white font-bold text-sm flex-shrink-0">
            {nbSuppression}
          </span>
          <span className="text-red-800 font-medium text-sm">
            {nbSuppression === 1
              ? '1 demande de suppression de compte en attente'
              : `${nbSuppression} demandes de suppression de compte en attente`}
          </span>
        </div>
      )}

      {/* Bandeau réclamations en attente */}
      {nbReclamationsEnAttente > 0 && (
        <div className="mb-4 flex items-center gap-3 bg-orange-50 border border-orange-200 rounded-xl px-5 py-4">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-orange-500 text-white font-bold text-sm flex-shrink-0">
            {nbReclamationsEnAttente}
          </span>
          <span className="text-orange-800 font-medium text-sm">
            {nbReclamationsEnAttente === 1
              ? '1 réclamation de fiche en attente de traitement'
              : `${nbReclamationsEnAttente} réclamations de fiche en attente de traitement`}
          </span>
        </div>
      )}

      {/* Badge comptes en attente */}
      {nbEnAttente > 0 && (
        <div className="mb-6 flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-xl px-5 py-4">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-500 text-white font-bold text-sm">
            {nbEnAttente}
          </span>
          <span className="text-yellow-800 font-medium">
            {nbEnAttente === 1
              ? '1 compte en attente de validation'
              : `${nbEnAttente} comptes en attente de validation`}
          </span>
          <button
            onClick={() => setFiltreStatut('en_attente')}
            className="ml-auto text-sm text-primary underline hover:no-underline"
          >
            Voir
          </button>
        </div>
      )}

      {/* Filtres & Recherche */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          placeholder="Rechercher par nom, email, structure..."
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <div className="flex gap-2 flex-wrap">
          {STATUTS.map((s) => (
            <button
              key={s.value}
              onClick={() => setFiltreStatut(s.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filtreStatut === s.value
                  ? 'bg-primary text-white shadow'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {s.label}
              {s.value === 'en_attente' && nbEnAttente > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                  {nbEnAttente}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Contenu */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : comptesFiltres.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <div className="text-5xl mb-4">🏢</div>
          <p className="text-lg font-medium">Aucun compte trouvé</p>
        </div>
      ) : (
        <>
          {/* Cards Mobile */}
          <div className="grid gap-4 sm:hidden">
            {comptesFiltres.map((compte) => (
              <div key={compte.id} className={`bg-white rounded-xl shadow-sm border p-4 ${compte.demande_suppression ? 'border-red-300' : 'border-gray-100'}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex-shrink-0 mt-0.5">
                      {compte.photo_profil ? (
                        <img src={compte.photo_profil} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-lg">🏢</div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-gray-800">{compte.nom_contact || '-'}</p>
                        {compte.demande_suppression && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">🗑️ Suppression demandée</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{compte.email || '-'}</p>
                      {compte.structures?.nom && (
                        <p className="text-xs text-primary mt-1">🏢 {compte.structures.nom}</p>
                      )}
                    </div>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      statutColors[compte.statut] || 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {compte.statut}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-gray-600 mb-3">
                  <span>Abonnement: <strong>{compte.abonnement || '-'}</strong></span>
                  <span>Inscrit: <strong>{formatDate(compte.date_inscription)}</strong></span>
                  <span>
                    Badge:{' '}
                    <strong className={compte.badge_verifie ? 'text-green-600' : 'text-gray-400'}>
                      {compte.badge_verifie ? 'Vérifié ✓' : 'Non vérifié'}
                    </strong>
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => ouvrirModal(compte)}
                    className="px-3 py-1.5 text-xs bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition"
                  >
                    Détails
                  </button>
                  {compte.statut !== 'actif' && (
                    <button
                      onClick={() => validerCompte(compte.id)}
                      disabled={actionEnCours === compte.id + '_valider'}
                      className="px-3 py-1.5 text-xs bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition disabled:opacity-50"
                    >
                      Valider
                    </button>
                  )}
                  {compte.statut !== 'suspendu' && (
                    <button
                      onClick={() => suspendreCompte(compte.id)}
                      disabled={actionEnCours === compte.id + '_suspendre'}
                      className="px-3 py-1.5 text-xs bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition disabled:opacity-50"
                    >
                      Suspendre
                    </button>
                  )}
                  <button
                    onClick={() => toggleBadge(compte.id, compte.badge_verifie)}
                    disabled={actionEnCours === compte.id + '_badge'}
                    className={`px-3 py-1.5 text-xs rounded-lg transition disabled:opacity-50 ${
                      compte.badge_verifie
                        ? 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
                        : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                    }`}
                  >
                    {compte.badge_verifie ? 'Retirer badge' : 'Certifier'}
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
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Contact</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Email</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Statut</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Abonnement</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Badge</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Inscription</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Structure</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {comptesFiltres.map((compte) => (
                  <tr
                    key={compte.id}
                    className="border-b border-gray-50 hover:bg-gray-50 transition"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                          {compte.photo_profil ? (
                            <img src={compte.photo_profil} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-sm">🏢</div>
                          )}
                        </div>
                        <span className="font-medium text-gray-800">{compte.nom_contact || '-'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{compte.email || '-'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          statutColors[compte.statut] || 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {compte.statut}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{compte.abonnement || '-'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs font-semibold ${
                          compte.badge_verifie ? 'text-green-600' : 'text-gray-400'
                        }`}
                      >
                        {compte.badge_verifie ? '✓ Vérifié' : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(compte.date_inscription)}</td>
                    <td className="px-4 py-3 text-primary">{compte.structures?.nom || '-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        <button
                          onClick={() => ouvrirModal(compte)}
                          className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition"
                        >
                          Détails
                        </button>
                        {compte.statut !== 'actif' && (
                          <button
                            onClick={() => validerCompte(compte.id)}
                            disabled={actionEnCours === compte.id + '_valider'}
                            className="px-2 py-1 text-xs bg-green-50 text-green-700 rounded hover:bg-green-100 transition disabled:opacity-50"
                          >
                            Valider
                          </button>
                        )}
                        {compte.statut !== 'suspendu' && (
                          <button
                            onClick={() => suspendreCompte(compte.id)}
                            disabled={actionEnCours === compte.id + '_suspendre'}
                            className="px-2 py-1 text-xs bg-red-50 text-red-700 rounded hover:bg-red-100 transition disabled:opacity-50"
                          >
                            Suspendre
                          </button>
                        )}
                        <button
                          onClick={() => toggleBadge(compte.id, compte.badge_verifie)}
                          disabled={actionEnCours === compte.id + '_badge'}
                          className={`px-2 py-1 text-xs rounded transition disabled:opacity-50 ${
                            compte.badge_verifie
                              ? 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
                              : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                          }`}
                        >
                          {compte.badge_verifie ? 'Retirer badge' : 'Certifier'}
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

      {/* Modal Détails / Modification */}
      {modalOuvert && compteSelectionne && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            {/* Header modal */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 flex-shrink-0 border-2 border-gray-200">
                  {compteSelectionne.photo_profil ? (
                    <img src={compteSelectionne.photo_profil} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">🏢</div>
                  )}
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-gray-800 truncate">
                    {compteSelectionne.nom_contact || compteSelectionne.email}
                  </h2>
                  <p className="text-sm text-gray-500 truncate">{compteSelectionne.email}</p>
                </div>
              </div>
              <button
                onClick={fermerModal}
                className="text-gray-400 hover:text-gray-700 text-2xl leading-none ml-4 flex-shrink-0"
              >
                &times;
              </button>
            </div>

            {/* Onglets */}
            <div className="flex border-b border-gray-100 flex-shrink-0 px-5 overflow-x-auto">
              {[
                { key: 'infos', label: 'Informations' },
                { key: 'abonnement', label: '💳 Abonnement' },
                { key: 'documents', label: `Documents ${documents.filter(d => d.statut === 'en_attente').length > 0 ? `(${documents.filter(d => d.statut === 'en_attente').length})` : ''}` },
                { key: 'reclamations', label: `Réclamations ${reclamations.filter(r => r.statut === 'en_attente').length > 0 ? `(${reclamations.filter(r => r.statut === 'en_attente').length})` : ''}` },
              ].map((o) => (
                <button
                  key={o.key}
                  onClick={() => setOngletModal(o.key)}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition -mb-px ${
                    ongletModal === o.key
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>

            {/* Corps modal (scrollable) */}
            <div className="flex-1 overflow-y-auto p-5">

              {/* ——— ONGLET INFOS ——— */}
              {ongletModal === 'infos' && (
                <div className="space-y-5">
                  {/* Info lecture seule */}
                  <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                    <p>
                      <span className="text-gray-500">Structure liée :</span>{' '}
                      <strong className="text-primary">
                        {compteSelectionne.structures?.nom || 'Aucune'}
                      </strong>
                    </p>
                    <p>
                      <span className="text-gray-500">Statut :</span>{' '}
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          statutColors[compteSelectionne.statut] || 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {compteSelectionne.statut}
                      </span>
                    </p>
                    <p>
                      <span className="text-gray-500">Abonnement :</span>{' '}
                      <strong>{compteSelectionne.abonnement || '-'}</strong>
                    </p>
                    <p>
                      <span className="text-gray-500">Badge vérifié :</span>{' '}
                      <strong className={compteSelectionne.badge_verifie ? 'text-green-600' : 'text-gray-400'}>
                        {compteSelectionne.badge_verifie ? 'Oui ✓' : 'Non'}
                      </strong>
                    </p>
                    <p>
                      <span className="text-gray-500">Inscription :</span>{' '}
                      <strong>{formatDate(compteSelectionne.date_inscription)}</strong>
                    </p>
                    {compteSelectionne.telephone && (
                      <p>
                        <span className="text-gray-500">📞 Tél. responsable :</span>{' '}
                        <strong className="text-gray-800">{compteSelectionne.telephone}</strong>
                      </p>
                    )}
                  </div>

                  {/* Champs modifiables */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">
                      Modifier les coordonnées
                    </h3>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Nom du contact</label>
                      <input
                        type="text"
                        value={editForm.nom_contact}
                        onChange={(e) => setEditForm({ ...editForm, nom_contact: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Email de contact</label>
                      <input
                        type="email"
                        value={editForm.email_contact}
                        onChange={(e) => setEditForm({ ...editForm, email_contact: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Téléphone de contact</label>
                      <input
                        type="tel"
                        value={editForm.telephone_contact}
                        onChange={(e) =>
                          setEditForm({ ...editForm, telephone_contact: e.target.value })
                        }
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>

                  {/* Actions rapides */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    {compteSelectionne.statut !== 'actif' && (
                      <button
                        onClick={() => { validerCompte(compteSelectionne.id); fermerModal(); }}
                        className="px-4 py-2 text-sm bg-green-50 text-green-700 rounded-lg hover:bg-green-100 font-medium"
                      >
                        ✓ Valider le compte
                      </button>
                    )}
                    {compteSelectionne.statut !== 'suspendu' && (
                      <button
                        onClick={() => { suspendreCompte(compteSelectionne.id); fermerModal(); }}
                        className="px-4 py-2 text-sm bg-red-50 text-red-700 rounded-lg hover:bg-red-100 font-medium"
                      >
                        Suspendre
                      </button>
                    )}
                    <button
                      onClick={() => toggleBadge(compteSelectionne.id, compteSelectionne.badge_verifie)}
                      disabled={actionEnCours === compteSelectionne.id + '_badge'}
                      className={`px-4 py-2 text-sm rounded-lg font-medium disabled:opacity-50 ${
                        compteSelectionne.badge_verifie
                          ? 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
                          : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                      }`}
                    >
                      {compteSelectionne.badge_verifie ? '🏅 Retirer badge' : '🏅 Attribuer badge'}
                    </button>
                  </div>

                  {/* Demande de suppression */}
                  {compteSelectionne.demande_suppression && (
                    <div className="mt-4 border border-red-200 rounded-xl p-4 bg-red-50/40 space-y-3">
                      <div>
                        <p className="text-sm font-bold text-red-700">🗑️ Demande de suppression de compte</p>
                        {compteSelectionne.date_demande_suppression && (
                          <p className="text-xs text-red-500 mt-0.5">
                            Demandée le {formatDate(compteSelectionne.date_demande_suppression)}
                          </p>
                        )}
                        {compteSelectionne.motif_suppression && (
                          <p className="text-xs text-gray-600 mt-1 bg-white rounded px-2 py-1">
                            Motif : "{compteSelectionne.motif_suppression}"
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => supprimerCompte(compteSelectionne.id)}
                          disabled={!!actionEnCours}
                          className="flex-1 px-3 py-2 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold disabled:opacity-50"
                        >
                          🗑️ Confirmer la suppression
                        </button>
                        <button
                          onClick={() => rejeterSuppression(compteSelectionne.id)}
                          disabled={!!actionEnCours}
                          className="flex-1 px-3 py-2 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-semibold disabled:opacity-50"
                        >
                          ✗ Rejeter la demande
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ——— ONGLET ABONNEMENT ——— */}
              {ongletModal === 'abonnement' && (() => {
                const typePayant = ['mensuel', 'trimestriel', 'semestriel', 'annuel'];
                const estPayantActuel = typePayant.includes(compteSelectionne.abonnement);
                const dateFin = compteSelectionne.date_fin_abonnement ? new Date(compteSelectionne.date_fin_abonnement) : null;
                const estValide = estPayantActuel && (!dateFin || dateFin > new Date());
                const estExpire = estPayantActuel && dateFin && dateFin <= new Date();

                return (
                  <div className="space-y-5">
                    {/* Statut actuel */}
                    <div className={`rounded-xl p-4 border text-sm ${
                      estValide ? 'bg-green-50 border-green-200' :
                      estExpire ? 'bg-red-50 border-red-200' :
                      'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-700">Statut actuel :</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                          estValide ? 'bg-green-100 text-green-800' :
                          estExpire ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {estValide ? '✅ Actif' : estExpire ? '❌ Expiré' : '🔒 Gratuit'}
                        </span>
                        <span className="text-gray-500 capitalize">{compteSelectionne.abonnement || 'gratuit'}</span>
                      </div>
                      {dateFin && (
                        <p className="text-xs text-gray-500 mt-1">
                          {estExpire ? 'Expiré le' : 'Expire le'} {dateFin.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                          {estValide && ` — ${Math.ceil((dateFin - new Date()) / 86400000)} jours restants`}
                        </p>
                      )}
                    </div>

                    {/* Formulaire */}
                    <div className="space-y-4">
                      {/* Type */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Type d&apos;abonnement</label>
                        <select
                          value={abonnementForm.abonnement}
                          onChange={(e) => {
                            const type = e.target.value;
                            const fin = type !== 'gratuit' && abonnementForm.date_paiement
                              ? calcDateFin(abonnementForm.date_paiement, type)
                              : '';
                            setAbonnementForm(f => ({ ...f, abonnement: type, date_fin_abonnement: fin || f.date_fin_abonnement }));
                          }}
                          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          {TYPES_ABONNEMENT.map(t => (
                            <option key={t.value} value={t.value}>
                              {t.label}{t.duree ? ` (${t.duree} mois)` : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      {abonnementForm.abonnement !== 'gratuit' && (
                        <>
                          {/* Montant */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Montant payé (€)</label>
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={abonnementForm.montant_paiement}
                              onChange={(e) => setAbonnementForm(f => ({ ...f, montant_paiement: e.target.value }))}
                              placeholder="Ex: 29"
                              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                          </div>

                          {/* Date paiement */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date de paiement</label>
                            <input
                              type="date"
                              value={abonnementForm.date_paiement}
                              onChange={(e) => {
                                const dp = e.target.value;
                                const fin = dp && abonnementForm.abonnement !== 'gratuit'
                                  ? calcDateFin(dp, abonnementForm.abonnement)
                                  : abonnementForm.date_fin_abonnement;
                                setAbonnementForm(f => ({ ...f, date_paiement: dp, date_fin_abonnement: fin || f.date_fin_abonnement }));
                              }}
                              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                          </div>

                          {/* Date fin */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Date de fin
                              <span className="text-xs text-gray-400 ml-1">(calculée automatiquement, modifiable)</span>
                            </label>
                            <input
                              type="date"
                              value={abonnementForm.date_fin_abonnement}
                              onChange={(e) => setAbonnementForm(f => ({ ...f, date_fin_abonnement: e.target.value }))}
                              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                          </div>
                        </>
                      )}

                      {/* Notes */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Notes internes</label>
                        <textarea
                          rows={2}
                          value={abonnementForm.notes_abonnement}
                          onChange={(e) => setAbonnementForm(f => ({ ...f, notes_abonnement: e.target.value }))}
                          placeholder="Référence de paiement, mode de règlement..."
                          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                        />
                      </div>
                    </div>

                    <button
                      onClick={sauvegarderAbonnement}
                      disabled={savingAbonnement}
                      className="w-full py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:opacity-90 transition disabled:opacity-50"
                    >
                      {savingAbonnement ? 'Enregistrement...' : '💾 Enregistrer l\'abonnement'}
                    </button>
                  </div>
                );
              })()}

              {/* ——— ONGLET DOCUMENTS ——— */}
              {ongletModal === 'documents' && (
                <div className="space-y-4">
                  {loadingDocs ? (
                    <div className="flex justify-center py-10">
                      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : documents.length === 0 ? (
                    <div className="text-center py-10 text-gray-400">
                      <div className="text-4xl mb-2">📭</div>
                      <p>Aucun document soumis</p>
                    </div>
                  ) : (
                    documents.map((doc) => {
                      const typeInfo = TYPES_DOCUMENTS.find((t) => t.value === doc.type_document);
                      return (
                        <div
                          key={doc.id}
                          className={`border rounded-xl p-4 space-y-3 ${
                            doc.statut === 'valide'
                              ? 'border-green-200 bg-green-50/30'
                              : doc.statut === 'refuse'
                              ? 'border-red-200 bg-red-50/30'
                              : 'border-yellow-200 bg-yellow-50/30'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span>{typeInfo?.icon || '📎'}</span>
                                <span className="font-medium text-gray-800 text-sm">
                                  {typeInfo?.label || doc.type_document}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                    docStatutColors[doc.statut]
                                  }`}
                                >
                                  {doc.statut === 'en_attente' ? '⏳ En attente' : doc.statut === 'valide' ? '✅ Validé' : '❌ Refusé'}
                                </span>
                              </div>
                              <a
                                href={`/api/admin/documents/${doc.id}/download`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-primary hover:underline mt-1 inline-flex items-center gap-1"
                              >
                                📎 {doc.nom_fichier || 'Voir le fichier'}
                              </a>
                              <p className="text-xs text-gray-400 mt-0.5">
                                Soumis le {formatDate(doc.created_at)}
                              </p>
                            </div>
                          </div>

                          {/* Commentaire admin */}
                          <div>
                            <textarea
                              rows={2}
                              placeholder="Commentaire pour la société (visible en cas de refus)..."
                              value={commentaireDoc[doc.id] ?? doc.commentaire_admin ?? ''}
                              onChange={(e) =>
                                setCommentaireDoc({ ...commentaireDoc, [doc.id]: e.target.value })
                              }
                              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                            />
                          </div>

                          {/* Boutons validation */}
                          {doc.statut !== 'valide' && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => validerDocument(doc.id, 'valide')}
                                disabled={actionEnCours === 'doc_' + doc.id}
                                className="flex-1 px-3 py-2 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50"
                              >
                                ✓ Valider
                              </button>
                              <button
                                onClick={() => validerDocument(doc.id, 'refuse')}
                                disabled={actionEnCours === 'doc_' + doc.id}
                                className="flex-1 px-3 py-2 text-xs bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium disabled:opacity-50"
                              >
                                ✗ Refuser
                              </button>
                            </div>
                          )}
                          {doc.statut === 'valide' && (
                            <button
                              onClick={() => validerDocument(doc.id, 'refuse')}
                              disabled={actionEnCours === 'doc_' + doc.id}
                              className="w-full px-3 py-2 text-xs bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 font-medium disabled:opacity-50"
                            >
                              Annuler la validation
                            </button>
                          )}
                        </div>
                      );
                    })
                  )}

                  {/* Badge rapide */}
                  {documents.length > 0 && (
                    <div className="pt-2 border-t border-gray-100">
                      <button
                        onClick={() => toggleBadge(compteSelectionne.id, compteSelectionne.badge_verifie)}
                        disabled={actionEnCours === compteSelectionne.id + '_badge'}
                        className={`w-full px-4 py-2.5 text-sm rounded-xl font-semibold transition disabled:opacity-50 ${
                          compteSelectionne.badge_verifie
                            ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                            : 'bg-purple-600 text-white hover:bg-purple-700'
                        }`}
                      >
                        {compteSelectionne.badge_verifie
                          ? '🏅 Retirer le badge vérifié'
                          : '🏅 Attribuer le badge vérifié'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ——— ONGLET RÉCLAMATIONS ——— */}
              {ongletModal === 'reclamations' && (
                <div className="space-y-4">
                  {reclamations.length === 0 ? (
                    <div className="text-center py-10 text-gray-400">
                      <div className="text-4xl mb-2">📭</div>
                      <p>Aucune réclamation</p>
                    </div>
                  ) : (
                    reclamations.map((r) => (
                      <div
                        key={r.id}
                        className={`border rounded-xl p-4 space-y-3 ${
                          r.statut === 'approuvee'
                            ? 'border-green-200 bg-green-50/30'
                            : r.statut === 'refusee'
                            ? 'border-red-200 bg-red-50/30'
                            : 'border-yellow-200 bg-yellow-50/30'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-gray-800 text-sm">
                                🏢 {r.structures?.nom || 'Structure inconnue'}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                  r.statut === 'approuvee'
                                    ? 'bg-green-100 text-green-800'
                                    : r.statut === 'refusee'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}
                              >
                                {r.statut === 'en_attente' ? '⏳ En attente' : r.statut === 'approuvee' ? '✅ Approuvée' : '❌ Refusée'}
                              </span>
                            </div>
                            {r.message && (
                              <p className="text-xs text-gray-600 mt-1 bg-white rounded px-2 py-1">
                                💬 "{r.message}"
                              </p>
                            )}
                            <p className="text-xs text-gray-400 mt-1">
                              {formatDate(r.created_at)}
                            </p>
                          </div>
                        </div>

                        {r.statut === 'en_attente' && (
                          <div className="space-y-2">
                            <textarea
                              rows={2}
                              placeholder="Commentaire / motif (optionnel)..."
                              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                              value={messageReclamAdmin[r.id] || ''}
                              onChange={e => setMessageReclamAdmin(prev => ({ ...prev, [r.id]: e.target.value }))}
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => validerReclamation(r.id, 'approuvee')}
                                disabled={actionEnCours === 'reclam_' + r.id}
                                className="flex-1 px-3 py-2 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50"
                              >
                                ✓ Approuver
                              </button>
                              <button
                                onClick={() => validerReclamation(r.id, 'refusee')}
                                disabled={actionEnCours === 'reclam_' + r.id}
                                className="flex-1 px-3 py-2 text-xs bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium disabled:opacity-50"
                              >
                                ✗ Refuser
                              </button>
                            </div>
                          </div>
                        )}
                        {r.message_admin && (
                          <p className="text-xs text-gray-500 bg-gray-50 rounded px-2 py-1">
                            💬 Admin : {r.message_admin}
                          </p>
                        )}
                        <div className="flex justify-end">
                          <button
                            onClick={() => supprimerReclamation(r.id)}
                            disabled={actionEnCours === 'reclam_del_' + r.id}
                            className="text-xs text-red-400 hover:text-red-600 disabled:opacity-50 transition"
                          >
                            🗑️ Supprimer
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Footer modal */}
            {ongletModal === 'infos' && (
              <div className="flex gap-3 p-5 border-t border-gray-100 flex-shrink-0">
                <button
                  onClick={fermerModal}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-gray-600 text-sm hover:bg-gray-50 transition"
                >
                  Annuler
                </button>
                <button
                  onClick={sauvegarderModifications}
                  disabled={actionEnCours === 'sauvegarde'}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:opacity-90 transition disabled:opacity-50"
                >
                  {actionEnCours === 'sauvegarde' ? 'Sauvegarde...' : 'Sauvegarder'}
                </button>
              </div>
            )}
            {(ongletModal === 'documents' || ongletModal === 'reclamations') && (
              <div className="p-5 border-t border-gray-100 flex-shrink-0">
                <button
                  onClick={fermerModal}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-gray-600 text-sm hover:bg-gray-50 transition"
                >
                  Fermer
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
