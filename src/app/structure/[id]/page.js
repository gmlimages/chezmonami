// src/app/structure/[id]/page.js 
'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { structuresAPI, produitsAPI, statistiquesAPI } from '@/lib/api';
import StarRating from '@/components/ui/StarRating';
import CommentaireForm from '@/components/CommentaireForm';
import CommentairesList from '@/components/CommentairesList';

export default function StructureDetail() {
  const params = useParams();
  const router = useRouter();
  const [structure, setStructure] = useState(null);
  const [produits, setProduits] = useState([]);
  const [imageActive, setImageActive] = useState(0);
  const [ongletActif, setOngletActif] = useState('apropos'); // apropos, avis, produits
  const [panier, setPanier] = useState([]);
  const [showPanier, setShowPanier] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshCommentaires, setRefreshCommentaires] = useState(0);       // ajouter
  const [nouveauCommentaire, setNouveauCommentaire] = useState({
    nom: '',
    note: 5,
    commentaire: ''
  });
  const [commentairesLocaux, setCommentairesLocaux] = useState([]);
  const [showFormulaireAction, setShowFormulaireAction] = useState(false);
  const [formulaireAction, setFormulaireAction] = useState({
    nom: '',
    telephone: '',
    email: '',
    message: '',
    // Pour restaurant
    plats: '',
    adresseLivraison: '',
    // Pour salon/boutique
    datePreferee: '',
    heurePreferee: '',
    // Pour service
    typeService: '',
    budget: ''
  });

  useEffect(() => {
    chargerStructure();
  }, [params.id]);



  const handleCommentaireAdded = () => {
  // Rafraîchir la liste des commentaires
  setRefreshCommentaires(prev => prev + 1);
  // Recharger la structure pour mettre à jour la note
  loadStructure(); // Votre fonction existante qui charge la structure
};

  const chargerStructure = async () => {
    try {
      setLoading(true);
      
      console.log('Chargement structure avec ID:', params.id);
      
      // Récupérer la structure par ID
      const structureData = await structuresAPI.getById(params.id);
      
      console.log('Structure récupérée:', structureData);
      
      if (structureData) {
        setStructure(structureData);
        setCommentairesLocaux(structureData.avis || []);

        // Charger les produits de cette structure
        const produitsData = await produitsAPI.getAll();
        const produitsFiltres = produitsData.filter(p => p.structure_id === params.id);
        setProduits(produitsFiltres);

        // Tracker la vue
        try {
          await statistiquesAPI.enregistrerElementPopulaire(
            'structure',
            structureData.id,
            structureData.nom
          );
        } catch (statsError) {
          console.error('Erreur tracking stats:', statsError);
          // Ne pas bloquer l'affichage si le tracking échoue
        }
      } else {
        console.error('Structure non trouvée');
      }
    } catch (error) {
      console.error('Erreur chargement structure:', error);
      console.error('Détails erreur:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const ajouterAuPanier = (produit) => {
    setPanier([...panier, { ...produit, quantite: 1 }]);
  };

  const retirerDuPanier = (index) => {
    setPanier(panier.filter((_, i) => i !== index));
  };

  const totalPanier = panier.reduce((sum, item) => sum + (item.prix * item.quantite), 0);

  const ajouterCommentaire = () => {
    if (!nouveauCommentaire.nom || !nouveauCommentaire.commentaire) {
      alert('Veuillez remplir tous les champs');
      return;
    }

    const commentaire = {
      id: commentairesLocaux.length + 1,
      ...nouveauCommentaire,
      date: new Date().toISOString().split('T')[0]
    };

    setCommentairesLocaux([commentaire, ...commentairesLocaux]);
    setNouveauCommentaire({ nom: '', note: 5, commentaire: '' });
    alert('✅ Votre avis a été publié avec succès !');
  };

  const envoyerFormulaireAction = () => {
    if (!formulaireAction.nom || !formulaireAction.telephone || !formulaireAction.email) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    // Construction du sujet selon la catégorie
    let sujet = '';
    let corpsEmail = `
Nouvelle demande depuis ${structure.nom}
----------------------------------------

Nom: ${formulaireAction.nom}
Téléphone: ${formulaireAction.telephone}
Email: ${formulaireAction.email}

`;

    if (structure.categorie?.nom === 'Restaurant') {
      sujet = `Nouvelle commande - ${structure.nom}`;
      corpsEmail += `
COMMANDE:
${formulaireAction.plats}

Adresse de livraison:
${formulaireAction.adresseLivraison}

Message additionnel:
${formulaireAction.message}
`;
    } else if (structure.categorie?.nom === 'Boutique' || structure.categorie?.nom === 'Salon') {
      sujet = `Demande de rendez-vous - ${structure.nom}`;
      corpsEmail += `
RENDEZ-VOUS SOUHAITÉ:
Date préférée: ${formulaireAction.datePreferee}
Heure préférée: ${formulaireAction.heurePreferee}

Message:
${formulaireAction.message}
`;
    } else if (structure.categorie?.nom === 'Service') {
      sujet = `Demande de devis - ${structure.nom}`;
      corpsEmail += `
TYPE DE SERVICE: ${formulaireAction.typeService}
Budget estimé: ${formulaireAction.budget}

Description de la demande:
${formulaireAction.message}
`;
    }

    // Créer le lien mailto
    const emailStructure = structure.email || 'contact@chezmonami.com';
    const mailtoLink = `mailto:${emailStructure}?subject=${encodeURIComponent(sujet)}&body=${encodeURIComponent(corpsEmail)}`;
    
    window.location.href = mailtoLink;
    
    // Réinitialiser et fermer
    setFormulaireAction({
      nom: '',
      telephone: '',
      email: '',
      message: '',
      plats: '',
      adresseLivraison: '',
      datePreferee: '',
      heurePreferee: '',
      typeService: '',
      budget: ''
    });
    setShowFormulaireAction(false);
    alert('✅ Votre demande a été préparée ! Veuillez valider l\'envoi dans votre application email.');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!structure) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <p className="text-xl text-gray-600 mb-4">Structure non trouvée</p>
          <Link href="/" className="btn-primary">
            Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }

  const isBoutique = produits.length > 0;

  // Génération de l'URL Google Maps avec adresse complète
  const adresseComplete = structure.adresse 
    ? `${structure.adresse}, ${structure.ville?.nom}, ${structure.pays?.nom}`
    : `${structure.nom}, ${structure.ville?.nom}, ${structure.pays?.nom}`;
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(adresseComplete)}`;
  const googleMapsEmbedUrl = `https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(adresseComplete)}&zoom=15`;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header avec retour */}
      <header className="bg-white shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-primary hover:text-primary-dark font-semibold"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
              Retour
            </button>
            
            {isBoutique && panier.length > 0 && (
              <button
                onClick={() => setShowPanier(true)}
                className="flex items-center gap-2 bg-accent text-white px-4 py-2 rounded-lg hover:bg-accent-light font-semibold"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Panier ({panier.length})
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Galerie d'images */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
          <div className="relative">
            <img
              src={structure.images?.[imageActive] || '/placeholder-structure.jpg'}
              alt={structure.nom}
              className="w-full h-96 object-cover"
            />
            {structure.images && structure.images.length > 1 && (
              <>
                <button
                  onClick={() => setImageActive(Math.max(0, imageActive - 1))}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-3 rounded-full hover:bg-black/70"
                  disabled={imageActive === 0}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => setImageActive(Math.min(structure.images.length - 1, imageActive + 1))}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-3 rounded-full hover:bg-black/70"
                  disabled={imageActive === structure.images.length - 1}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}
            {structure.categorie && (
              <span className="absolute top-4 right-4 px-4 py-2 rounded-full text-sm font-bold text-white shadow-lg bg-primary">
                {structure.categorie.icon} {structure.categorie.nom}
              </span>
            )}
          </div>
          
          {structure.images && structure.images.length > 1 && (
            <div className="flex gap-2 p-4 overflow-x-auto bg-gray-50">
              {structure.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setImageActive(i)}
                  className={`flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden transition ${
                    i === imageActive ? 'ring-4 ring-primary' : 'opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Colonne principale */}
          <div className="lg:col-span-2 space-y-6">
            {/* En-tête structure */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h1 className="text-4xl font-bold text-gray-800 mb-3">{structure.nom}</h1>
              
              <div className="flex items-center gap-2 mb-4">
                <StarRating note={structure.note || 0} taille={24} />
                <span className="text-lg font-semibold text-gray-700">
                  ({structure.nombre_avis || 0} avis)
                </span>
              </div>

              <div className="flex flex-wrap gap-4 text-gray-600 mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xl">📍</span>
                  <span className="font-medium">{structure.ville?.nom}, {structure.pays?.nom}</span>
                </div>
                {structure.horaires && (
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🕒</span>
                    <span>{structure.horaires}</span>
                  </div>
                )}
              </div>

              {structure.adresse && (
                <div className="flex items-start gap-2 mb-4 p-3 bg-gray-50 rounded-lg">
                  <span className="text-lg">📮</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700 mb-1">Adresse complète</p>
                    <p className="text-gray-600">{structure.adresse}</p>
                  </div>
                </div>
              )}

              <p className="text-lg text-gray-700 leading-relaxed">
                {structure.description}
              </p>
            </div>

            {/* Onglets */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="flex border-b">
                <button
                  onClick={() => setOngletActif('apropos')}
                  className={`flex-1 px-6 py-4 font-semibold transition ${
                    ongletActif === 'apropos'
                      ? 'bg-primary text-white'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  📋 À propos
                </button>
                <button
                  onClick={() => setOngletActif('avis')}
                  className={`flex-1 px-6 py-4 font-semibold transition ${
                    ongletActif === 'avis'
                      ? 'bg-primary text-white'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  💬 Avis ({structure?.nombre_avis || 0})
                </button>
                {isBoutique && (
                  <button
                    onClick={() => setOngletActif('produits')}
                    className={`flex-1 px-6 py-4 font-semibold transition ${
                      ongletActif === 'produits'
                        ? 'bg-primary text-white'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    🛍️ Produits ({produits.length})
                  </button>
                )}
              </div>

              <div className="p-6">
                {/* Onglet À propos */}
                {ongletActif === 'apropos' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-2xl font-bold mb-4 text-gray-800">Description détaillée</h3>
                      <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                        {structure.description_longue || structure.description}
                      </p>
                    </div>

                    {/* Carte Google Maps */}
                    <div>
                      <h3 className="text-2xl font-bold mb-4 text-gray-800">📍 Localisation</h3>
                      <div className="bg-gray-100 rounded-lg overflow-hidden">
                        <iframe
                          src={googleMapsEmbedUrl}
                          width="100%"
                          height="400"
                          style={{ border: 0 }}
                          allowFullScreen
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                          title="Carte de localisation"
                        />
                      </div>
                      <div className="mt-3 flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                        <div>
                          {structure.adresse && (
                            <p className="text-gray-700 font-medium">{structure.adresse}</p>
                          )}
                          <p className="text-gray-600">
                            {structure.ville?.nom}, {structure.pays?.nom}
                          </p>
                        </div>
                        <a
                          href={googleMapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-primary hover:text-primary-dark font-semibold"
                        >
                          Ouvrir dans Google Maps
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {/* Onglet Avis */}
                {ongletActif === 'avis' && (
                  <div className="space-y-6">
                    {/* Formulaire d'ajout d'avis */}
                    <div className="bg-gradient-to-r from-primary/5 to-primary-light/5 rounded-lg p-6">
                      <div>
                        <CommentaireForm 
                          structureId={structure.id}
                          onCommentaireAdded={handleCommentaireAdded}
                        />
                      </div>
                    </div>

                    {/* Liste des avis */}
                    <div className="space-y-4">
                      <div>
                        <CommentairesList 
                          structureId={structure.id}
                          refresh={refreshCommentaires}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Onglet Produits */}
                {ongletActif === 'produits' && isBoutique && (
                  <div className="space-y-6">
                    <h3 className="text-2xl font-bold text-gray-800">
                      🛍️ Nos produits ({produits.length})
                    </h3>
                    {produits.length === 0 ? (
                      <div className="text-center py-12 bg-gray-50 rounded-lg">
                        <div className="text-5xl mb-3">🛍️</div>
                        <p className="text-gray-600">Aucun produit disponible</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {produits.map(produit => (
                        <Link 
                          key={produit.id}
                          href={`/produit/${produit.id}`}
                          className="card overflow-hidden hover:shadow-xl transition cursor-pointer"
                        >
                          <img
                            src={produit.images?.[0] || '/placeholder-produit.jpg'}
                            alt={produit.nom}
                            className="w-full h-40 object-cover"
                          />
                          <div className="p-3">
                            <h4 className="font-bold text-sm mb-2 line-clamp-2">{produit.nom}</h4>
                            <p className="text-lg font-bold text-primary mb-3">
                              {produit.prix} {structure.pays?.devise || 'FCFA'}
                            </p>
                            <div className="btn-accent w-full text-sm py-2 text-center">
                              Voir le produit
                            </div>
                          </div>
                        </Link>
                      ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar - Informations de contact */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold mb-4 text-gray-800">📞 Informations de contact</h3>
                <div className="space-y-3">
                  {structure.telephone && (
                    <a
                      href={`tel:${structure.telephone}`}
                      className="flex items-center gap-3 p-3 bg-green-50 rounded-lg hover:bg-green-100 transition"
                    >
                      <div className="w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center">
                        📞
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500">Téléphone</p>
                        <p className="font-semibold text-gray-800">{structure.telephone}</p>
                      </div>
                    </a>
                  )}

                  {structure.email && (
                    <a
                      href={`mailto:${structure.email}`}
                      className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition"
                    >
                      <div className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center">
                        ✉️
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500">Email</p>
                        <p className="font-semibold text-gray-800 text-sm break-all">{structure.email}</p>
                      </div>
                    </a>
                  )}

                  {structure.site_web && (
                    <a
                      href={structure.site_web}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition"
                    >
                      <div className="w-10 h-10 bg-purple-500 text-white rounded-full flex items-center justify-center">
                        🌐
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500">Site web</p>
                        <p className="font-semibold text-purple-600">Visiter →</p>
                      </div>
                    </a>
                  )}
                </div>
              </div>

              {structure.horaires && (
                <div className="bg-gradient-to-br from-primary to-primary-dark text-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-bold mb-3">🕒 Horaires</h3>
                  <p className="text-white/90">{structure.horaires}</p>
                </div>
              )}

              {/* Boutons d'action selon la catégorie */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold mb-4 text-gray-800">🎯 Actions</h3>
                <div className="space-y-3">
                  {/* Boutique ou Salon = Prendre rendez-vous */}
                  {(structure.categorie?.nom === 'boutique' || 
                      structure.categorie?.nom === 'Salon' || 
                      structure.categorie?.nom === 'Salons' ||  // ← AJOUTER
                      structure.categorie?.nom === 'boutique' || 
                      structure.categorie?.nom === 'boutiques' ||
                      structure.categorie?.nom === 'salon' ||
                      structure.categorie?.nom === 'salons') && (
                    <>
                      <button
                        onClick={() => setShowFormulaireAction(true)}
                        className="w-full flex items-center justify-center gap-3 p-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition font-semibold"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Prendre rendez-vous
                      </button>
                      
                    </>
                  )}

                  {/* Restaurant = Passer une commande */}
                  {(structure.categorie?.nom === 'Restaurant' || 
                    structure.categorie?.nom === 'Restaurants' || 
                    structure.categorie?.nom === 'restaurant') && (

                    <>
                      <button
                        onClick={() => setShowFormulaireAction(true)}
                        className="w-full flex items-center justify-center gap-3 p-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition font-semibold"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        Passer une commande
                      </button>
                      
                    </>
                  )}

                  {/* Service = Demander un devis */}
                  {(structure.categorie?.nom === 'Service' || 
                      structure.categorie?.nom === 'Services' || 
                      structure.categorie?.nom === 'service') && (
                    <>
                      <button
                        onClick={() => setShowFormulaireAction(true)}
                        className="w-full flex items-center justify-center gap-3 p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition font-semibold"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Demander un devis
                      </button>
                      
                    </>
                  )}

                  {/* Bouton générique WhatsApp pour autres catégories */}
                  {structure.categorie?.nom !== 'Boutique' && 
                   structure.categorie?.nom !== 'boutique' && 
                   structure.categorie?.nom !== 'Salon' && 
                   structure.categorie?.nom !== 'salon' && 
                   structure.categorie?.nom !== 'Restaurant' && 
                   structure.categorie?.nom !== 'restaurant' && 
                   structure.categorie?.nom !== 'Service' && 
                   structure.categorie?.nom !== 'service' && 
                   structure.telephone && (
                    <a
                      href={`https://wa.me/${(structure.telephone || '212673623053').replace(/[\s\-+()]/g, '')}?text=${encodeURIComponent(`Bonjour, je souhaite avoir plus d'informations sur ${structure.nom}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-3 p-4 bg-gradient-to-r from-primary to-primary-dark text-white rounded-lg hover:from-primary-dark hover:to-primary transition font-semibold"
                    >
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      Contacter via WhatsApp
                    </a>
                  )}

                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Panier */}
      {showPanier && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-2xl font-bold">🛍️ Votre panier</h2>
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
                  <p className="text-xl text-gray-600">Votre panier est vide</p>
                </div>
              ) : (
                <>
                  <div className="space-y-4 mb-6">
                    {panier.map((item, index) => (
                      <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                        <img
                          src={item.images?.[0] || '/placeholder-produit.jpg'}
                          alt={item.nom}
                          className="w-20 h-20 object-cover rounded"
                        />
                        <div className="flex-1">
                          <h4 className="font-bold">{item.nom}</h4>
                          <p className="text-primary font-bold">{item.prix} {structure.pays?.devise || 'FCFA'}</p>
                        </div>
                        <button
                          onClick={() => retirerDuPanier(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between text-xl font-bold mb-4">
                      <span>Total</span>
                      <span className="text-primary">{totalPanier} {structure.pays?.devise || 'FCFA'}</span>
                    </div>
                    <button className="btn-accent w-full">
                      Commander via WhatsApp
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Formulaire Action (Rendez-vous / Commande / Devis) */}
      {showFormulaireAction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-2xl font-bold">
                {structure.categorie?.nom === 'Restaurant' && '🍽️ Passer une commande'}
                {(structure.categorie?.nom === 'Boutique' || structure.categorie?.nom === 'Salon') && '📅 Prendre rendez-vous'}
                {structure.categorie?.nom === 'Service' && '📋 Demander un devis'}
              </h2>
              <button
                onClick={() => setShowFormulaireAction(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Champs communs */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Votre nom *</label>
                <input
                  type="text"
                  placeholder="Ex: Jean Dupont"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
                  value={formulaireAction.nom}
                  onChange={(e) => setFormulaireAction({ ...formulaireAction, nom: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone *</label>
                <input
                  type="tel"
                  placeholder="Ex: +212 6 12 34 56 78"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
                  value={formulaireAction.telephone}
                  onChange={(e) => setFormulaireAction({ ...formulaireAction, telephone: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                <input
                  type="email"
                  placeholder="Ex: jean@email.com"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
                  value={formulaireAction.email}
                  onChange={(e) => setFormulaireAction({ ...formulaireAction, email: e.target.value })}
                />
              </div>

              {/* Champs spécifiques RESTAURANT */}
              {structure.categorie?.nom === 'Restaurant' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Votre commande *</label>
                    <textarea
                      rows="4"
                      placeholder="Ex: 2x Poulet DG, 1x Ndolé, 3x Jus de bissap..."
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
                      value={formulaireAction.plats}
                      onChange={(e) => setFormulaireAction({ ...formulaireAction, plats: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Adresse de livraison *</label>
                    <textarea
                      rows="2"
                      placeholder="Ex: Quartier Bonanjo, Rue de la liberté, Immeuble X..."
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
                      value={formulaireAction.adresseLivraison}
                      onChange={(e) => setFormulaireAction({ ...formulaireAction, adresseLivraison: e.target.value })}
                    />
                  </div>
                </>
              )}

              {/* Champs spécifiques SALON / BOUTIQUE */}
              {(structure.categorie?.nom === 'Boutique' || structure.categorie?.nom === 'Salon') && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date souhaitée *</label>
                    <input
                      type="date"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
                      value={formulaireAction.datePreferee}
                      onChange={(e) => setFormulaireAction({ ...formulaireAction, datePreferee: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Heure souhaitée *</label>
                    <input
                      type="time"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
                      value={formulaireAction.heurePreferee}
                      onChange={(e) => setFormulaireAction({ ...formulaireAction, heurePreferee: e.target.value })}
                    />
                  </div>
                </>
              )}

              {/* Champs spécifiques SERVICE */}
              {structure.categorie?.nom === 'Service' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Type de service *</label>
                    <input
                      type="text"
                      placeholder="Ex: Plomberie, Peinture, Électricité..."
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
                      value={formulaireAction.typeService}
                      onChange={(e) => setFormulaireAction({ ...formulaireAction, typeService: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Budget estimé</label>
                    <input
                      type="text"
                      placeholder="Ex: 50 000 - 100 000 FCFA"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
                      value={formulaireAction.budget}
                      onChange={(e) => setFormulaireAction({ ...formulaireAction, budget: e.target.value })}
                    />
                  </div>
                </>
              )}

              {/* Message additionnel */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {structure.categorie?.nom === 'Restaurant' ? 'Informations supplémentaires' : 'Votre message'}
                </label>
                <textarea
                  rows="3"
                  placeholder="Ajoutez des détails supplémentaires..."
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
                  value={formulaireAction.message}
                  onChange={(e) => setFormulaireAction({ ...formulaireAction, message: e.target.value })}
                />
              </div>

              <button
                onClick={envoyerFormulaireAction}
                className="w-full btn-primary py-4 text-lg"
              >
                📧 Envoyer la demande par email
              </button>

              <p className="text-xs text-gray-500 text-center">
                Cette demande sera envoyée à {structure.nom} par email
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}