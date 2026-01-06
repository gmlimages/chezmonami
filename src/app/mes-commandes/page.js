// src/app/mes-commandes/page.js - SUIVI CLIENT CORRIGÉ
'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import PageTracker from '@/components/PageTracker';

export default function MesCommandesPage() {
  const [commandes, setCommandes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [numeroCommande, setNumeroCommande] = useState('');
  const [email, setEmail] = useState('');
  const [recherche, setRecherche] = useState(false);
  const [commandeSelectionnee, setCommandeSelectionnee] = useState(null);
  const [historique, setHistorique] = useState([]);

  const statutsConfig = {
    'nouvelle': { 
      label: 'Nouvelle', 
      couleur: 'bg-blue-100 text-blue-800',
      icon: '🆕'
    },
    'confirmee': { 
      label: 'Confirmée', 
      couleur: 'bg-green-100 text-green-800',
      icon: '✅'
    },
    'en_preparation': { 
      label: 'En préparation', 
      couleur: 'bg-yellow-100 text-yellow-800',
      icon: '📦'
    },
    'expediee': { 
      label: 'Expédiée', 
      couleur: 'bg-purple-100 text-purple-800',
      icon: '🚚'
    },
    'livree': { 
      label: 'Livrée', 
      couleur: 'bg-green-100 text-green-800',
      icon: '✨'
    },
    'annulee': { 
      label: 'Annulée', 
      couleur: 'bg-red-100 text-red-800',
      icon: '❌'
    }
  };

  const rechercherCommandes = async () => {
    // Validation
    if (!numeroCommande && !email) {
      alert('⚠️ Veuillez entrer votre numéro de commande ou email');
      return;
    }

    try {
      setLoading(true);
      setRecherche(true);

      let query = supabase
        .from('commandes')
        .select('*')
        .order('created_at', { ascending: false });

      // Recherche par numéro de commande (prioritaire)
      if (numeroCommande) {
        query = query.eq('numero_commande', numeroCommande.toUpperCase().trim());
      }
      // OU par email
      else if (email) {
        query = query.eq('client_email', email.toLowerCase().trim());
      }

      const { data, error } = await query;

      if (error) throw error;

      setCommandes(data || []);
      
      if (!data || data.length === 0) {
        alert('❌ Aucune commande trouvée avec ces informations');
      }
    } catch (error) {
      console.error('❌ Erreur recherche:', error);
      alert('❌ Erreur lors de la recherche des commandes');
    } finally {
      setLoading(false);
    }
  };

  const chargerHistorique = async (commandeId) => {
    try {
      const { data, error } = await supabase
        .from('commandes_historique')
        .select('*')
        .eq('commande_id', commandeId)
        .order('date_modification', { ascending: true });

      if (error) throw error;
      setHistorique(data || []);
    } catch (error) {
      console.error('Erreur historique:', error);
    }
  };

  const ouvrirDetailsCommande = (commande) => {
    setCommandeSelectionnee(commande);
    chargerHistorique(commande.id);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEtapeActuelle = (statut) => {
    const etapes = ['nouvelle', 'confirmee', 'en_preparation', 'expediee', 'livree'];
    return etapes.indexOf(statut);
  };

  const nouvelleRecherche = () => {
    setRecherche(false);
    setCommandes([]);
    setNumeroCommande('');
    setEmail('');
    setCommandeSelectionnee(null);
  };

  return (
    <>
      {/* ✅ TRACKING AUTOMATIQUE */}
      <PageTracker pageType="mes_commandes" />
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">📦 Suivi de mes commandes</h1>
          <p className="text-gray-600">Suivez l'état de vos commandes en temps réel</p>
        </div>

        {/* Formulaire de recherche */}
        {!recherche && (
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl mx-auto">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">🔍</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Retrouvez votre commande
              </h2>
              <p className="text-gray-600">
                Entrez votre numéro de commande ou email
              </p>
            </div>

            <div className="space-y-4">
              {/* Numéro de commande (PRINCIPAL) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🎫 Numéro de commande
                </label>
                <input
                  type="text"
                  placeholder="CMD-20260105-XXXX"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none uppercase"
                  value={numeroCommande}
                  onChange={(e) => setNumeroCommande(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && rechercherCommandes()}
                />
                <p className="text-xs text-gray-500 mt-1">
                  📧 Le numéro de commande vous a été envoyé par email
                </p>
              </div>

              <div className="text-center text-gray-500 font-semibold">OU</div>

              {/* Email (SECONDAIRE) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📧 Email
                </label>
                <input
                  type="email"
                  placeholder="votre@email.com"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && rechercherCommandes()}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Email utilisé lors de la commande
                </p>
              </div>

              <button
                onClick={rechercherCommandes}
                disabled={loading}
                className="w-full btn-primary py-4 text-lg disabled:opacity-50"
              >
                {loading ? '🔄 Recherche en cours...' : '🔍 Rechercher ma commande'}
              </button>
            </div>

            <div className="mt-6 text-center">
              <Link href="/" className="text-primary hover:underline text-sm">
                ← Retour à l'accueil
              </Link>
            </div>
          </div>
        )}

        {/* Liste des commandes */}
        {recherche && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">
                {commandes.length} commande{commandes.length > 1 ? 's' : ''} trouvée{commandes.length > 1 ? 's' : ''}
              </h2>
              <button
                onClick={nouvelleRecherche}
                className="px-4 py-2 text-primary hover:bg-primary/10 rounded-lg transition"
              >
                🔍 Nouvelle recherche
              </button>
            </div>

            {commandes.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <div className="text-6xl mb-4">🔍</div>
                <p className="text-xl text-gray-600 mb-2">Aucune commande trouvée</p>
                <p className="text-gray-500 mb-6">
                  Vérifiez votre numéro de commande ou email
                </p>
                <button
                  onClick={nouvelleRecherche}
                  className="btn-primary"
                >
                  Réessayer
                </button>
              </div>
            ) : (
              <div className="grid gap-6">
                {commandes.map((commande) => {
                  const config = statutsConfig[commande.statut];
                  
                  return (
                    <div
                      key={commande.id}
                      onClick={() => ouvrirDetailsCommande(commande)}
                      className="bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Numéro de commande</p>
                          <p className="text-xl font-bold text-gray-800 mb-2">
                            {commande.numero_commande}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className={`px-3 py-1 rounded-full text-sm font-bold ${config.couleur}`}>
                              {config.icon} {config.label}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-2">
                            Commandé le {formatDate(commande.date_commande)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-accent">
                            {commande.montant_total.toLocaleString()} {commande.devise}
                          </p>
                          <p className="text-sm text-gray-600">
                            {commande.produits?.length || 0} article{commande.produits?.length > 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>

                      {/* Barre de progression */}
                      {commande.statut !== 'annulee' && (
                        <div className="mt-4">
                          <div className="flex items-center justify-between mb-2">
                            {['nouvelle', 'confirmee', 'en_preparation', 'expediee', 'livree'].map((etape, index) => {
                              const etapeActuelle = getEtapeActuelle(commande.statut);
                              const estComplete = index <= etapeActuelle;
                              
                              return (
                                <div key={etape} className="flex-1 flex items-center">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                    estComplete ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
                                  }`}>
                                    {estComplete ? '✓' : index + 1}
                                  </div>
                                  {index < 4 && (
                                    <div className={`flex-1 h-1 mx-2 ${
                                      estComplete ? 'bg-green-500' : 'bg-gray-200'
                                    }`} />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                          <div className="flex items-center justify-between text-xs text-gray-600">
                            <span>Nouvelle</span>
                            <span>Confirmée</span>
                            <span>Préparation</span>
                            <span>Expédiée</span>
                            <span>Livrée</span>
                          </div>
                        </div>
                      )}

                      {/* Tracking number si disponible */}
                      {commande.tracking_number && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                          <p className="text-xs text-blue-600 mb-1">Numéro de suivi transporteur</p>
                          <p className="text-sm font-bold text-blue-800">{commande.tracking_number}</p>
                        </div>
                      )}

                      <div className="mt-4 text-right">
                        <span className="text-primary text-sm font-semibold hover:underline">
                          Voir les détails →
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal détails commande */}
      {commandeSelectionnee && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setCommandeSelectionnee(null)}>
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-2xl font-bold">
                Commande {commandeSelectionnee.numero_commande}
              </h2>
              <button
                onClick={() => setCommandeSelectionnee(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              {/* Statut actuel */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Statut actuel</p>
                    <div className="flex items-center gap-2">
                      <span className={`px-4 py-2 rounded-lg text-lg font-bold ${statutsConfig[commandeSelectionnee.statut].couleur}`}>
                        {statutsConfig[commandeSelectionnee.statut].icon} {statutsConfig[commandeSelectionnee.statut].label}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Total</p>
                    <p className="text-3xl font-bold text-accent">
                      {commandeSelectionnee.montant_total.toLocaleString()} {commandeSelectionnee.devise}
                    </p>
                  </div>
                </div>
              </div>

              {/* Produits */}
              <div className="mb-6">
                <h3 className="font-bold text-gray-800 mb-3">📦 Produits commandés</h3>
                <div className="space-y-3">
                  {commandeSelectionnee.produits?.map((produit, index) => (
                    <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                      {produit.image && (
                        <img
                          src={produit.image}
                          alt={produit.nom}
                          className="w-16 h-16 object-cover rounded"
                        />
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
                </div>
              </div>

              {/* Informations client */}
              <div className="mb-6 grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-bold text-gray-800 mb-3">👤 Informations client</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-semibold">Nom:</span> {commandeSelectionnee.client_nom}</p>
                    <p><span className="font-semibold">Téléphone:</span> {commandeSelectionnee.client_telephone}</p>
                    <p><span className="font-semibold">Email:</span> {commandeSelectionnee.client_email}</p>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-bold text-gray-800 mb-3">📍 Adresse de livraison</h3>
                  <p className="text-sm whitespace-pre-line">{commandeSelectionnee.client_adresse || 'Non renseignée'}</p>
                </div>
              </div>

              {/* Historique */}
              {historique.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-bold text-gray-800 mb-3">📜 Historique de la commande</h3>
                  <div className="space-y-3">
                    {historique.map((event, index) => (
                      <div key={event.id} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="w-3 h-3 rounded-full bg-primary"></div>
                          {index < historique.length - 1 && (
                            <div className="w-0.5 h-full bg-gray-200 my-1"></div>
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <p className="font-semibold text-gray-800">
                            {statutsConfig[event.nouveau_statut]?.label || event.nouveau_statut}
                          </p>
                          <p className="text-sm text-gray-600">
                            {formatDate(event.date_modification)}
                          </p>
                          {event.commentaire && (
                            <p className="text-sm text-gray-600 mt-1">{event.commentaire}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tracking */}
              {commandeSelectionnee.tracking_number && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Numéro de suivi transporteur</p>
                  <p className="text-xl font-bold text-blue-800">
                    {commandeSelectionnee.tracking_number}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}