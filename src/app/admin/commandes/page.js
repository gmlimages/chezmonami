// src/app/admin/commandes/page.js - ADMIN AVEC COMPLETION INFOS
'use client';
import { useState, useEffect } from 'react';
import AdminLayout from '@/app/admin/AdminLayout';
import { adminFetch } from '@/lib/adminFetch';

const STATUTS = {
  'nouvelle': { label: 'Nouvelle', couleur: 'bg-blue-500', icon: '🆕' },
  'confirmee': { label: 'Confirmée', couleur: 'bg-green-500', icon: '✅' },
  'en_preparation': { label: 'En préparation', couleur: 'bg-yellow-500', icon: '📦' },
  'expediee': { label: 'Expédiée', couleur: 'bg-purple-500', icon: '🚚' },
  'livree': { label: 'Livrée', couleur: 'bg-green-600', icon: '✨' },
  'annulee': { label: 'Annulée', couleur: 'bg-red-500', icon: '❌' }
};

export default function AdminCommandes() {
  const [mode, setMode] = useState('liste');
  const [commandes, setCommandes] = useState([]);
  const [commandeSelectionnee, setCommandeSelectionnee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recherche, setRecherche] = useState('');
  const [filtreStatut, setFiltreStatut] = useState('tous');
  const [historique, setHistorique] = useState([]);
  
  const [formStatut, setFormStatut] = useState({
    statut: '',
    commentaire: '',
    tracking_number: ''
  });

  const [formInfosClient, setFormInfosClient] = useState({
    client_nom: '',
    client_telephone: '',
    client_email: '',
    client_adresse: '',
    client_message: ''
  });

  useEffect(() => {
    chargerCommandes();
  }, []);

  const chargerCommandes = async () => {
    try {
      setLoading(true);
      const params = filtreStatut !== 'tous' ? `?statut=${filtreStatut}` : '';
      const res = await adminFetch(`/api/admin/commandes${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCommandes(data.commandes || []);
    } catch (error) {
      console.error('Erreur chargement commandes:', error);
      alert('❌ Erreur lors du chargement des commandes');
    } finally {
      setLoading(false);
    }
  };

  const chargerHistorique = async (commandeId) => {
    try {
      const res = await adminFetch(`/api/admin/commandes/${commandeId}`);
      const data = await res.json();
      setHistorique(data.historique || []);
    } catch (error) {
      console.error('Erreur chargement historique:', error);
    }
  };

  const ouvrirDetails = async (commande) => {
    setCommandeSelectionnee(commande);
    setFormStatut({
      statut: commande.statut,
      commentaire: '',
      tracking_number: commande.tracking_number || ''
    });
    // Initialiser le formulaire infos client
    setFormInfosClient({
      client_nom: commande.client_nom || '',
      client_telephone: commande.client_telephone || '',
      client_email: commande.client_email || '',
      client_adresse: commande.client_adresse || '',
      client_message: commande.client_message || ''
    });
    await chargerHistorique(commande.id);
    setMode('details');
  };

  const completerInfosClient = async () => {
    // Validation
    if (!formInfosClient.client_nom || !formInfosClient.client_telephone) {
      alert('⚠️ Le nom et le téléphone sont obligatoires');
      return;
    }

    try {
      const res = await adminFetch(`/api/admin/commandes/${commandeSelectionnee.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_nom: formInfosClient.client_nom,
          client_telephone: formInfosClient.client_telephone,
          client_email: formInfosClient.client_email || null,
          client_adresse: formInfosClient.client_adresse || null,
          client_message: formInfosClient.client_message || null,
        }),
      });
      if (!res.ok) throw new Error('Mise à jour échouée');
      const { commande } = await res.json();
      alert('✅ Informations client mises à jour avec succès !');
      chargerCommandes();
      if (commande) setCommandeSelectionnee(commande);
    } catch (error) {
      console.error('❌ Erreur mise à jour:', error);
      alert('❌ Erreur lors de la mise à jour');
    }
  };

  const mettreAJourStatut = async () => {
    if (!formStatut.statut) {
      alert('⚠️ Veuillez sélectionner un statut');
      return;
    }

    try {
      const body = {
        statut: formStatut.statut,
        tracking_number: formStatut.tracking_number || null,
        notes_admin: formStatut.commentaire || null,
      };
      if (formStatut.commentaire) {
        body.historique = {
          ancien_statut: commandeSelectionnee.statut,
          nouveau_statut: formStatut.statut,
          commentaire: formStatut.commentaire,
        };
      }
      const res = await adminFetch(`/api/admin/commandes/${commandeSelectionnee.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Mise à jour échouée');

      alert('✅ Statut mis à jour avec succès !');
      setMode('liste');
      chargerCommandes();
    } catch (error) {
      console.error('Erreur mise à jour:', error);
      alert('❌ Erreur lors de la mise à jour');
    }
  };

  const supprimerCommande = async (id) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette commande ?')) return;

    try {
      const res = await adminFetch(`/api/admin/commandes/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Suppression échouée');
      alert('✅ Commande supprimée avec succès !');
      chargerCommandes();
    } catch (error) {
      console.error('Erreur suppression:', error);
      alert('❌ Erreur lors de la suppression');
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const commandesFiltrees = commandes.filter(c => {
    const matchRecherche = !recherche || 
      c.numero_commande.toLowerCase().includes(recherche.toLowerCase()) ||
      c.client_nom.toLowerCase().includes(recherche.toLowerCase()) ||
      (c.client_email && c.client_email.toLowerCase().includes(recherche.toLowerCase()));
    return matchRecherche;
  });

  // Stats
  const stats = {
    total: commandes.length,
    nouvelles: commandes.filter(c => c.statut === 'nouvelle').length,
    enCours: commandes.filter(c => ['confirmee', 'en_preparation', 'expediee'].includes(c.statut)).length,
    livrees: commandes.filter(c => c.statut === 'livree').length,
    montantTotal: commandes.reduce((sum, c) => sum + c.montant_total, 0)
  };

  // Vérifier si infos incomplètes (commande WhatsApp)
  const infosIncompletes = (commande) => {
    return !commande.client_email || !commande.client_adresse;
  };

  if (loading) {
    return (
      <AdminLayout titre="Gestion des Commandes">
        <div className="text-center py-12">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Chargement...</p>
        </div>
      </AdminLayout>
    );
  }

  // Mode détails (identique à avant, lignes 180-338 de l'original)
  if (mode === 'details' && commandeSelectionnee) {
    return (
      <AdminLayout titre={`Commande ${commandeSelectionnee.numero_commande}`}>
        <div className="max-w-5xl mx-auto">
          <button
            onClick={() => setMode('liste')}
            className="mb-6 flex items-center gap-2 text-primary hover:underline"
          >
            ← Retour à la liste
          </button>

          <div className="grid gap-6">
            {/* Carte statut actuel */}
            <div className="card">
              <h3 className="text-xl font-bold mb-4">📊 Statut de la commande</h3>
              
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Statut actuel</label>
                  <select
                    className="input-field"
                    value={formStatut.statut}
                    onChange={(e) => setFormStatut({...formStatut, statut: e.target.value})}
                  >
                    {Object.entries(STATUTS).map(([key, val]) => (
                      <option key={key} value={key}>{val.icon} {val.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Numéro de suivi (optionnel)</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="TR123456789"
                    value={formStatut.tracking_number}
                    onChange={(e) => setFormStatut({...formStatut, tracking_number: e.target.value})}
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Commentaire (optionnel)</label>
                <textarea
                  className="input-field"
                  rows="3"
                  placeholder="Ajouter un commentaire..."
                  value={formStatut.commentaire}
                  onChange={(e) => setFormStatut({...formStatut, commentaire: e.target.value})}
                />
              </div>

              <button
                onClick={mettreAJourStatut}
                className="btn-primary w-full"
              >
                Mettre à jour le statut
              </button>
            </div>

            {/* Produits */}
            <div className="card">
              <h3 className="text-xl font-bold mb-4">📦 Produits commandés</h3>
              <div className="space-y-3">
                {commandeSelectionnee.produits?.map((produit, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    {produit.image && (
                      <img src={produit.image} alt={produit.nom} className="w-16 h-16 object-cover rounded" />
                    )}
                    <div className="flex-1">
                      <p className="font-semibold">{produit.nom}</p>
                      <p className="text-sm text-gray-600">
                        Quantité: {produit.quantite} × {produit.prix} {commandeSelectionnee.devise}
                      </p>
                    </div>
                    <p className="font-bold text-accent">
                      {(produit.prix * produit.quantite).toLocaleString()} {commandeSelectionnee.devise}
                    </p>
                  </div>
                ))}
                <div className="pt-3 border-t">
                  <div className="flex items-center justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-accent">
                      {commandeSelectionnee.montant_total.toLocaleString()} {commandeSelectionnee.devise}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Client - Formulaire éditable */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">👤 Informations client</h3>
                {infosIncompletes(commandeSelectionnee) && (
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-bold rounded">
                    ⚠️ Incomplet
                  </span>
                )}
              </div>
              
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium mb-2">👤 Nom complet *</label>
                  <input
                    type="text"
                    className="input-field"
                    value={formInfosClient.client_nom}
                    onChange={(e) => setFormInfosClient({...formInfosClient, client_nom: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">📱 Téléphone *</label>
                  <input
                    type="tel"
                    className="input-field"
                    value={formInfosClient.client_telephone}
                    onChange={(e) => setFormInfosClient({...formInfosClient, client_telephone: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">📧 Email</label>
                  <input
                    type="email"
                    className="input-field"
                    placeholder="email@example.com"
                    value={formInfosClient.client_email}
                    onChange={(e) => setFormInfosClient({...formInfosClient, client_email: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Méthode de commande</label>
                  <input
                    type="text"
                    className="input-field bg-gray-50"
                    value={commandeSelectionnee.methode}
                    disabled
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">📍 Adresse de livraison</label>
                  <textarea
                    className="input-field"
                    rows="3"
                    placeholder="Adresse complète de livraison"
                    value={formInfosClient.client_adresse}
                    onChange={(e) => setFormInfosClient({...formInfosClient, client_adresse: e.target.value})}
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">💬 Message</label>
                  <textarea
                    className="input-field"
                    rows="2"
                    placeholder="Message du client..."
                    value={formInfosClient.client_message}
                    onChange={(e) => setFormInfosClient({...formInfosClient, client_message: e.target.value})}
                  />
                </div>
              </div>

              <button
                onClick={completerInfosClient}
                className="btn-primary w-full"
              >
                💾 Enregistrer les informations
              </button>
            </div>

            {/* Historique */}
            {historique.length > 0 && (
              <div className="card">
                <h3 className="text-xl font-bold mb-4">📜 Historique</h3>
                <div className="space-y-3">
                  {historique.map((event) => (
                    <div key={event.id} className="flex gap-3 border-l-4 border-primary pl-4 py-2">
                      <div className="flex-1">
                        <p className="font-semibold">
                          {STATUTS[event.nouveau_statut]?.icon} {STATUTS[event.nouveau_statut]?.label}
                        </p>
                        <p className="text-sm text-gray-600">{formatDate(event.date_modification)}</p>
                        {event.commentaire && (
                          <p className="text-sm text-gray-700 mt-1">{event.commentaire}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </AdminLayout>
    );
  }

  // Mode liste
  return (
    <AdminLayout titre="Gestion des Commandes" sousTitre={`${commandes.length} commandes`}>
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="card bg-blue-50">
          <p className="text-sm text-gray-600 mb-1">Total</p>
          <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
        </div>
        <div className="card bg-yellow-50">
          <p className="text-sm text-gray-600 mb-1">Nouvelles</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.nouvelles}</p>
        </div>
        <div className="card bg-purple-50">
          <p className="text-sm text-gray-600 mb-1">En cours</p>
          <p className="text-2xl font-bold text-purple-600">{stats.enCours}</p>
        </div>
        <div className="card bg-green-50">
          <p className="text-sm text-gray-600 mb-1">Livrées</p>
          <p className="text-2xl font-bold text-green-600">{stats.livrees}</p>
        </div>
        <div className="card bg-accent/10">
          <p className="text-sm text-gray-600 mb-1">CA Total</p>
          <p className="text-xl font-bold text-accent">{stats.montantTotal.toLocaleString()} F</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <select
          className="input-field"
          value={filtreStatut}
          onChange={(e) => {
            setFiltreStatut(e.target.value);
            chargerCommandes();
          }}
        >
          <option value="tous">Tous les statuts</option>
          {Object.entries(STATUTS).map(([key, val]) => (
            <option key={key} value={key}>{val.icon} {val.label}</option>
          ))}
        </select>

        <div className="relative flex-1">
          <svg className="absolute left-3 top-3 text-gray-400" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Rechercher une commande..."
            className="input-field pl-10"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold">Numéro</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Client</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Produits</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Montant</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Statut</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Date</th>
                <th className="px-6 py-4 text-center text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {commandesFiltrees.map((commande) => (
                <tr key={commande.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-gray-800">{commande.numero_commande}</p>
                    <p className="text-xs text-gray-500 capitalize">{commande.methode}</p>
                    {infosIncompletes(commande) && (
                      <span className="inline-block mt-1 px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-bold rounded">
                        ⚠️ Incomplet
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-semibold">{commande.client_nom}</p>
                    <p className="text-xs text-gray-500">{commande.client_telephone}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm">{commande.produits?.length || 0} article{commande.produits?.length > 1 ? 's' : ''}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-accent">{commande.montant_total.toLocaleString()} {commande.devise}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${STATUTS[commande.statut].couleur}`}>
                      {STATUTS[commande.statut].icon} {STATUTS[commande.statut].label}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-600">{formatDate(commande.date_commande)}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => ouvrirDetails(commande)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                        title="Voir détails"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => supprimerCommande(commande.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                        title="Supprimer"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

      {commandesFiltrees.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl shadow mt-6">
          <div className="text-6xl mb-4">📦</div>
          <p className="text-xl text-gray-600">Aucune commande trouvée</p>
        </div>
      )}
    </AdminLayout>
  );
}