// components/PanierFlottant.js - VERSION AMÉLIORÉE
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePanier } from '@/hooks/usePanier';
import { supabase } from '@/lib/supabase';
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';

export default function PanierFlottant() {
  const { 
    panier, 
    retirerDuPanier, 
    modifierQuantite, 
    totalPanier, 
    nombreArticles,
    viderPanier,
    userCurrency,    // ← AJOUT
    convertPrice
  } = usePanier();

  const [showPanier, setShowPanier] = useState(false);
  const [showCommande, setShowCommande] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [formulaireCommande, setFormulaireCommande] = useState({
    nom: '',
    telephone: '',
    email: '',
    adresse: '',
    message: ''
  });

  // ✅ Écouter les ajouts au panier pour afficher notification
  useEffect(() => {
    const handlePanierUpdate = (e) => {
      setToastMessage(`✅ ${e.detail.produit} ajouté au panier !`);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    };

    window.addEventListener('produit-ajoute-panier', handlePanierUpdate);
    return () => window.removeEventListener('produit-ajoute-panier', handlePanierUpdate);
  }, []);

  const commanderWhatsApp = () => {
    if (panier.length === 0) {
      alert('Votre panier est vide');
      return;
    }

    const telephone = '+212673623053';
    let message = `🛍️ *NOUVELLE COMMANDE*\n\n📦 *Produits commandés:*\n`;
    
    panier.forEach((item, index) => {
      message += `${index + 1}. ${item.nom}\n`;
      message += `   Prix: ${convertPrice(item.prix, item.devise_origine).toLocaleString()} ${userCurrency}\n`;
      message += `   Quantité: ${item.quantite || 1}\n\n`;
    });
    
    message += `💰 *TOTAL: ${totalPanier} ${userCurrency}*\n\n`;
    message += `📍 Depuis: Chez Mon Ami - Boutique en ligne`;
    
    const whatsappUrl = `https://wa.me/${telephone.replace(/[\s-]/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');

    // Enregistrer la commande dans la BDD
    enregistrerCommande('whatsapp');
  };

  const envoyerCommandeEmail = async () => {
    if (!formulaireCommande.nom || !formulaireCommande.telephone || !formulaireCommande.email || !formulaireCommande.adresse) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (panier.length === 0) {
      alert('Votre panier est vide');
      return;
    }

    const sujet = `Nouvelle commande - ${formulaireCommande.nom}`;
    let corpsEmail = `NOUVELLE COMMANDE - CHEZ MON AMI\n================================\n\nCLIENT:\n-------\nNom: ${formulaireCommande.nom}\nTéléphone: ${formulaireCommande.telephone}\nEmail: ${formulaireCommande.email}\n\nLIVRAISON:\n----------\n${formulaireCommande.adresse}\n\nPRODUITS COMMANDÉS:\n-------------------\n`;

    panier.forEach((item, index) => {
      corpsEmail += `\n${index + 1}. ${item.nom}\n   Prix unitaire: ${convertPrice(item.prix, item.devise_origine).toLocaleString()} ${userCurrency}\n   Quantité: ${item.quantite || 1}\n   Sous-total: ${(convertPrice(item.prix, item.devise_origine) * (item.quantite || 1)).toLocaleString()} ${userCurrency}\n`;
    });

    corpsEmail += `\n================================\nTOTAL: ${totalPanier} ${userCurrency}\n================================`;

    if (formulaireCommande.message) {
      corpsEmail += `\n\nMESSAGE DU CLIENT:\n${formulaireCommande.message}`;
    }

    const emailDestination = 'contact@chezmonami.com';
    const mailtoLink = `mailto:${emailDestination}?subject=${encodeURIComponent(sujet)}&body=${encodeURIComponent(corpsEmail)}`;
    
    // Enregistrer dans la BDD avant d'ouvrir l'email
    await enregistrerCommande('email');

    window.location.href = mailtoLink;
    
    setFormulaireCommande({
      nom: '',
      telephone: '',
      email: '',
      adresse: '',
      message: ''
    });
    setShowCommande(false);
    alert('✅ Votre commande a été préparée ! Veuillez valider l\'envoi dans votre application email.');
  };

  const enregistrerCommande = async (methode) => {
    try {
      setLoading(true);

      // Préparer les données produits
      const produitsData = panier.map(item => ({
        id: item.id,
        nom: item.nom,
        prix: item.prix,
        quantite: item.quantite || 1,
        image: item.images?.[0] || null
      }));

      // Insérer la commande
      const { data, error } = await supabase
        .from('commandes')
        .insert({
          client_nom: formulaireCommande.nom || 'Client WhatsApp',
          client_telephone: formulaireCommande.telephone || 'Non fourni',
          client_email: formulaireCommande.email || 'Non fourni',
          client_adresse: formulaireCommande.adresse || 'Non fournie',
          client_message: formulaireCommande.message || null,
          produits: produitsData,
          montant_total: totalPanier,
          methode: methode,
          statut: 'nouvelle'
        })
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Commande enregistrée:', data.numero_commande);

      // Vider le panier après commande réussie
      viderPanier();
      setShowPanier(false);

    } catch (error) {
      console.error('❌ Erreur enregistrement commande:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* ✅ Toast notification */}
      {showToast && (
        <div className="fixed top-20 right-6 bg-green-500 text-white px-6 py-4 rounded-lg shadow-2xl z-50 animate-slide-in-right">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-semibold">{toastMessage}</span>
          </div>
        </div>
      )}

      {/* ✅ Bouton flottant - TOUJOURS VISIBLE */}
      <button
        onClick={() => setShowPanier(true)}
        className={`fixed bottom-6 right-6 bg-accent text-white px-6 py-4 rounded-full shadow-2xl hover:bg-orange-600 transition flex items-center gap-3 z-40 ${
          nombreArticles > 0 ? 'animate-pulse' : ''
        }`}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <span className="font-bold text-lg">{nombreArticles}</span>
      </button>

      {/* Modal Panier */}
      {showPanier && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-2xl font-bold">🛍️ Votre panier ({nombreArticles})</h2>
              <button
                onClick={() => setShowPanier(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              {panier.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🛒</div>
                  <p className="text-xl text-gray-600 mb-2">Votre panier est vide</p>
                  <p className="text-gray-500 mb-6">Ajoutez des produits pour commencer !</p>
                  <Link 
                    href="/boutique"
                    onClick={() => setShowPanier(false)}
                    className="inline-block px-6 py-3 bg-accent text-white rounded-lg hover:bg-orange-600 transition"
                  >
                    Découvrir nos produits
                  </Link>
                </div>
              ) : (
                <>
                  {panier.map((item, index) => (
                    <div key={index} className="flex items-center gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                      <img 
                        src={item.images?.[0] || '/placeholder-produit.jpg'} 
                        alt={item.nom} 
                        className="w-20 h-20 object-cover rounded" 
                      />
                      <div className="flex-1">
                        <h3 className="font-bold">{item.nom}</h3>
                        <p className="text-accent font-bold">
                          {convertPrice(item.prix, item.devise_origine).toLocaleString()} {userCurrency}
                        </p>
                        
                        {/* Contrôles quantité */}
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() => modifierQuantite(index, (item.quantite || 1) - 1)}
                            className="w-8 h-8 bg-gray-200 rounded hover:bg-gray-300 transition font-bold"
                          >
                            -
                          </button>
                          <span className="font-bold px-3">{item.quantite || 1}</span>
                          <button
                            onClick={() => modifierQuantite(index, (item.quantite || 1) + 1)}
                            className="w-8 h-8 bg-gray-200 rounded hover:bg-gray-300 transition font-bold"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <button 
                        onClick={() => retirerDuPanier(index)} 
                        className="text-red-500 hover:text-red-700"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}

                  <div className="border-t pt-4 mt-4">
                    <div className="flex justify-between text-xl font-bold mb-4">
                      <span>Total:</span>
                      <span className="text-accent">{parseFloat(totalPanier).toLocaleString()} {userCurrency}</span>
                    </div>
                    
                    <button 
                      onClick={commanderWhatsApp} 
                      className="w-full btn-accent mb-2 flex items-center justify-center gap-2"
                      disabled={loading}
                    >
                      {loading ? 'Enregistrement...' : (
                        <>
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                          </svg>
                          Commander via WhatsApp
                        </>
                      )}
                    </button>
                    
                    <button 
                      onClick={() => { 
                        setShowPanier(false); 
                        setShowCommande(true); 
                      }} 
                      className="w-full btn-primary flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Commander par Email
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Commande Email */}
      {showCommande && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-2xl font-bold mb-4">📧 Commande par Email</h2>
            
            <input
              type="text"
              placeholder="Nom complet *"
              className="w-full mb-3 px-4 py-3 border-2 rounded-lg focus:border-accent focus:outline-none"
              value={formulaireCommande.nom}
              onChange={(e) => setFormulaireCommande({...formulaireCommande, nom: e.target.value})}
            />
            
            <input
              type="tel"
              placeholder="Téléphone *"
              className="w-full mb-3 px-4 py-3 border-2 rounded-lg focus:border-accent focus:outline-none"
              value={formulaireCommande.telephone}
              onChange={(e) => setFormulaireCommande({...formulaireCommande, telephone: e.target.value})}
            />
            
            <input
              type="email"
              placeholder="Email *"
              className="w-full mb-3 px-4 py-3 border-2 rounded-lg focus:border-accent focus:outline-none"
              value={formulaireCommande.email}
              onChange={(e) => setFormulaireCommande({...formulaireCommande, email: e.target.value})}
            />
            
            <textarea
              placeholder="Adresse de livraison *"
              className="w-full mb-3 px-4 py-3 border-2 rounded-lg focus:border-accent focus:outline-none"
              rows="3"
              value={formulaireCommande.adresse}
              onChange={(e) => setFormulaireCommande({...formulaireCommande, adresse: e.target.value})}
            />
            
            <textarea
              placeholder="Message (optionnel)"
              className="w-full mb-4 px-4 py-3 border-2 rounded-lg focus:border-accent focus:outline-none"
              rows="2"
              value={formulaireCommande.message}
              onChange={(e) => setFormulaireCommande({...formulaireCommande, message: e.target.value})}
            />
            
            <div className="flex gap-2">
              <button 
                onClick={() => setShowCommande(false)} 
                className="flex-1 btn-secondary"
              >
                Annuler
              </button>
              <button 
                onClick={envoyerCommandeEmail} 
                className="flex-1 btn-accent"
                disabled={loading}
              >
                {loading ? 'Enregistrement...' : 'Envoyer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ CSS pour animation toast */}
      <style jsx>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>
    </>
  );
}