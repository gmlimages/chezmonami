// src/app/structure/[id]/page.js - VERSION FINALE COMPLÈTE
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
  const [ongletActif, setOngletActif] = useState('apropos');
  const [loading, setLoading] = useState(true);
  const [refreshCommentaires, setRefreshCommentaires] = useState(0);
  
  // Galerie
  const [galerieOuverte, setGalerieOuverte] = useState(false);
  const [indexGalerie, setIndexGalerie] = useState(0);
  
  // Modal email
  const [showModalEmail, setShowModalEmail] = useState(false);
  const [typeCTA, setTypeCTA] = useState('');
  const [formEmail, setFormEmail] = useState({
    nom: '',
    email: '',
    telephone: '',
    message: ''
  });

  // Helpers CTA
  const getTexteCTA = (type) => {
    const textes = {
      rdv: 'Prendre rendez-vous',
      reserver_table: 'Réserver une table',
      commander: 'Passer commande',
      devis: 'Demander un devis',
      contact: 'Nous contacter'
    };
    return textes[type] || 'Nous contacter';
  };

  const getMessageWhatsApp = (type, nomStructure) => {
    const messages = {
      rdv: `Bonjour, je souhaite prendre rendez-vous chez ${nomStructure}`,
      reserver_table: `Bonjour, je souhaite réserver une table chez ${nomStructure}`,
      reserver_chambre: `Bonjour, je souhaite réserver une chambre chez ${nomStructure}`,
      commander: `Bonjour, je souhaite passer une commande chez ${nomStructure}`,
      devis: `Bonjour, je souhaite demander un devis pour ${nomStructure}`,
      contact: `Bonjour, je vous contacte concernant ${nomStructure}`
    };
    return messages[type] || `Bonjour, je vous contacte concernant ${nomStructure}`;
  };

  const getPlaceholderMessage = (type) => {
    const placeholders = {
      rdv: 'Indiquez votre disponibilité et le type de rendez-vous souhaité...',
      reserver_table: 'Nombre de personnes, date et heure souhaitées...',
      commander: 'Détails de votre commande...',
      devis: 'Décrivez votre projet ou service souhaité...',
      contact: 'Votre message...'
    };
    return placeholders[type] || 'Votre message...';
  };

  useEffect(() => {
    chargerStructure();
  }, [params.id]);

  const handleCommentaireAdded = () => {
    setRefreshCommentaires(prev => prev + 1);
    chargerStructure();
  };

  const chargerStructure = async () => {
    try {
      setLoading(true);
      const structureData = await structuresAPI.getById(params.id);
      
      if (structureData) {
        setStructure(structureData);
        const produitsData = await produitsAPI.getAll();
        const produitsFiltres = produitsData.filter(p => p.structure_id === params.id);
        setProduits(produitsFiltres);

        try {
          await statistiquesAPI.enregistrerElementPopulaire('structure', structureData.id, structureData.nom);
        } catch (statsError) {
          console.error('Erreur tracking:', statsError);
        }
      }
    } catch (error) {
      console.error('Erreur chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  const ouvrirModalEmail = (type) => {
    setTypeCTA(type);
    setFormEmail({
      nom: '',
      email: '',
      telephone: '',
      message: ''
    });
    setShowModalEmail(true);
  };

  const envoyerEmail = () => {
    const sujet = `${getTexteCTA(typeCTA)} - ${structure.nom}`;
    const corps = `
Nom: ${formEmail.nom}
Email: ${formEmail.email}
Téléphone: ${formEmail.telephone}

Message:
${formEmail.message}
    `.trim();

    window.location.href = `mailto:${structure.email}?subject=${encodeURIComponent(sujet)}&body=${encodeURIComponent(corps)}`;
    setShowModalEmail(false);
  };

  const naviguerGalerie = (direction) => {
    if (!structure.galerie) return;
    const total = structure.galerie.length;
    if (direction === 'prev') {
      setIndexGalerie(prev => prev === 0 ? total - 1 : prev - 1);
    } else {
      setIndexGalerie(prev => prev === total - 1 ? 0 : prev + 1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!structure) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600 mb-4">Structure non trouvée</p>
          <Link href="/" className="btn-primary">Retour à l'accueil</Link>
        </div>
      </div>
    );
  }

  const isBoutique = structure.categorie?.nom?.toLowerCase().includes('boutique');
  const isHotelOuAppart = ['hotel', 'appartement'].includes(structure.categorie_id?.toLowerCase());
  const images = structure.images || [];
  const galerie = structure.galerie || [];
  
  // Correction WhatsApp - format international
  const telWhatsApp = structure.telephone?.replace(/\D/g, ''); // Enlève tout sauf chiffres
  // Génération de l'URL Google Maps avec adresse complète
  const adresseComplete = structure.adresse 
    ? `${structure.adresse}, ${structure.ville?.nom}, ${structure.pays?.nom}`
    : `${structure.nom}, ${structure.ville?.nom}, ${structure.pays?.nom}`;
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(adresseComplete)}`;
  const googleMapsEmbedUrl = `https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(adresseComplete)}&zoom=15`;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header sticky */}
      <header className="bg-white shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-primary hover:text-primary-dark font-semibold">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Retour
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contenu principal */}
          <div className="lg:col-span-2">
            {/* Images de couverture */}
            {images.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
                <div className="relative h-96">
                  <img src={images[imageActive]} alt={structure.nom} className="w-full h-full object-cover" />
                  {images.length > 1 && (
                    <>
                      <button 
                        onClick={() => setImageActive(prev => prev === 0 ? images.length - 1 : prev - 1)} 
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition shadow-lg"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <button 
                        onClick={() => setImageActive(prev => prev === images.length - 1 ? 0 : prev + 1)} 
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition shadow-lg"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                        {imageActive + 1} / {images.length}
                      </div>
                    </>
                  )}
                </div>
                {images.length > 1 && (
                  <div className="p-4 flex gap-2 overflow-x-auto">
                    {images.map((img, index) => (
                      <button 
                        key={index} 
                        onClick={() => setImageActive(index)} 
                        className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition ${imageActive === index ? 'border-primary ring-2 ring-primary' : 'border-gray-200 hover:border-primary'}`}
                      >
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Infos principales */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">{structure.nom}</h1>
                  <div className="flex flex-wrap items-center gap-3 text-gray-600 mb-3">
                    <span className={`px-3 py-1 rounded-full text-white text-sm font-semibold ${structure.categorie?.color}`}>
                      {structure.categorie?.icon} {structure.categorie?.nom}
                    </span>
                    <span className="flex items-center gap-1">📍 {structure.ville?.nom}, {structure.pays?.nom}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <StarRating note={structure.note || 0} taille={24} />
                    <span className="text-gray-600">({structure.nombre_avis || 0} avis)</span>
                  </div>
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed">{structure.description}</p>
            </div>

            {/* 📸 GALERIE PHOTOS SUPPLÉMENTAIRES */}
            {galerie.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <span>🖼️</span>
                  <span>Galerie photos</span>
                  <span className="text-sm font-normal text-gray-500">({galerie.length})</span>
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {galerie.map((img, index) => {
                    const imgUrl = typeof img === 'string' ? img : img.url;
                    const imgAlt = typeof img === 'object' ? img.alt : 'Photo';
                    return (
                      <div 
                        key={index} 
                        onClick={() => { 
                          setIndexGalerie(index); 
                          setGalerieOuverte(true); 
                        }} 
                        className="aspect-square rounded-xl overflow-hidden cursor-pointer hover:opacity-90 hover:scale-105 transition-all duration-200 shadow-md hover:shadow-xl"
                      >
                        <img 
                          src={imgUrl} 
                          alt={imgAlt} 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 🏨 SERVICES INCLUS (Hôtels/Appartements) */}
            {isHotelOuAppart && structure.services_inclus && structure.services_inclus.length > 0 && (
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-lg p-6 mb-6">
                <h3 className="text-2xl font-bold mb-4 text-blue-900">✨ Services inclus</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {structure.services_inclus.map(service => (
                    <div key={service} className="flex items-center gap-2 bg-white px-4 py-3 rounded-lg shadow-sm">
                      <span className="text-green-600 font-bold text-lg">✓</span>
                      <span className="capitalize font-medium text-gray-800">{service.replace('_', ' ')}</span>
                    </div>
                  ))}
                </div>
                
                {structure.politique_annulation && (
                  <div className="mt-6 pt-6 border-t border-blue-200">
                    <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                      <span>📋</span>
                      <span>Politique d'annulation</span>
                    </h4>
                    <p className="text-gray-700 bg-white p-4 rounded-lg leading-relaxed">{structure.politique_annulation}</p>
                  </div>
                )}
              </div>
            )}

            {/* Onglets */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="flex border-b">
                <button 
                  onClick={() => setOngletActif('apropos')} 
                  className={`flex-1 px-6 py-4 font-semibold transition ${ongletActif === 'apropos' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  📖 À propos
                </button>
                <button 
                  onClick={() => setOngletActif('avis')} 
                  className={`flex-1 px-6 py-4 font-semibold transition ${ongletActif === 'avis' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  💬 Avis ({structure?.nombre_avis || 0})
                </button>
                {isBoutique && (
                  <button 
                    onClick={() => setOngletActif('produits')} 
                    className={`flex-1 px-6 py-4 font-semibold transition ${ongletActif === 'produits' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    🛍️ Produits ({produits.length})
                  </button>
                )}
              </div>

              <div className="p-6">
                {ongletActif === 'apropos' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-2xl font-bold mb-4 text-gray-800">Description détaillée</h3>
                      <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                        {structure.description_longue || structure.description}
                      </p>
                    </div>

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
                          title="Carte de localisation"
                        />
                      </div>
                      <div className="mt-3 flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                        <div>
                          {structure.adresse && <p className="text-gray-700 font-medium mb-1">{structure.adresse}</p>}
                          <p className="text-gray-600">{structure.ville?.nom}, {structure.pays?.nom}</p>
                        </div>
                        <a 
                          href={googleMapsUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="flex items-center gap-2 text-primary hover:text-primary-dark font-semibold"
                        >
                          Ouvrir dans Maps
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {ongletActif === 'avis' && (
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-primary/5 to-primary-light/5 rounded-lg p-6">
                      <CommentaireForm 
                        structureId={structure.id}
                        onCommentaireAdded={handleCommentaireAdded}
                      />
                    </div>
                    <div>
                      <CommentairesList 
                        structureId={structure.id}
                        refresh={refreshCommentaires}
                      />
                    </div>
                  </div>
                )}

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
                            className="card overflow-hidden hover:shadow-xl transition-all hover:scale-105 cursor-pointer"
                          >
                            <img 
                              src={produit.images?.[0] || '/placeholder.jpg'} 
                              alt={produit.nom} 
                              className="w-full h-40 object-cover" 
                            />
                            <div className="p-3">
                              <h4 className="font-bold text-sm mb-2 line-clamp-2">{produit.nom}</h4>
                              <p className="text-lg font-bold text-primary mb-2">
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

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Contact */}
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
                        <p className="font-semibold text-purple-600 text-sm">Visiter →</p>
                      </div>
                    </a>
                  )}
                </div>
              </div>

              {/* Horaires */}
              {structure.horaires && (
                <div className="bg-gradient-to-br from-primary to-primary-dark text-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-bold mb-3">🕒 Horaires</h3>
                  <p className="text-white/90 leading-relaxed">{structure.horaires}</p>
                </div>
              )}

              {/* 🎯 BOUTONS CTA DYNAMIQUES - Repositionnés ici */}
              {structure.cta_principal && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-xl font-bold mb-4 text-gray-800">🎯 Actions rapides</h3>
                  <div className="space-y-3">
                    {/* CTA Principal - WhatsApp */}
                    {structure.canaux_contact?.includes('whatsapp') && telWhatsApp && (
                      <a 
                        href={`https://wa.me/${telWhatsApp}?text=${encodeURIComponent(getMessageWhatsApp(structure.cta_principal, structure.nom))}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="w-full flex items-center justify-center gap-3 p-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition font-semibold shadow-lg"
                      >
                        <span className="text-2xl">📱</span>
                        <span>{getTexteCTA(structure.cta_principal)}</span>
                      </a>
                    )}
                    
                    {/* CTA Principal - Email */}
                    {structure.canaux_contact?.includes('email') && (
                      <button 
                        onClick={() => ouvrirModalEmail(structure.cta_principal)}
                        className="w-full flex items-center justify-center gap-3 p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition font-semibold shadow-lg"
                      >
                        <span className="text-2xl">✉️</span>
                        <span>{getTexteCTA(structure.cta_principal)}</span>
                      </button>
                    )}

                    {/* CTA Secondaire - WhatsApp */}
                    {structure.cta_secondaire && structure.canaux_contact?.includes('whatsapp') && telWhatsApp && (
                      <a 
                        href={`https://wa.me/${telWhatsApp}?text=${encodeURIComponent(getMessageWhatsApp(structure.cta_secondaire, structure.nom))}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="w-full flex items-center justify-center gap-3 p-4 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition font-semibold"
                      >
                        <span className="text-2xl">📱</span>
                        <span>{getTexteCTA(structure.cta_secondaire)}</span>
                      </a>
                    )}

                    {/* CTA Secondaire - Email */}
                    {structure.cta_secondaire && structure.canaux_contact?.includes('email') && (
                      <button 
                        onClick={() => ouvrirModalEmail(structure.cta_secondaire)}
                        className="w-full flex items-center justify-center gap-3 p-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-semibold"
                      >
                        <span className="text-2xl">✉️</span>
                        <span>{getTexteCTA(structure.cta_secondaire)}</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 🖼️ MODAL GALERIE PRO avec navigation */}
      {galerieOuverte && galerie.length > 0 && (
        <div 
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4" 
          onClick={() => setGalerieOuverte(false)}
        >
          {/* Bouton fermer */}
          <button 
            onClick={() => setGalerieOuverte(false)} 
            className="absolute top-4 right-4 text-white text-4xl hover:text-gray-300 transition z-10"
          >
            ×
          </button>

          {/* Image */}
          <div className="relative max-w-6xl max-h-[90vh] w-full" onClick={(e) => e.stopPropagation()}>
            <img 
              src={typeof galerie[indexGalerie] === 'string' ? galerie[indexGalerie] : galerie[indexGalerie].url} 
              alt="Photo galerie" 
              className="w-full h-full object-contain rounded-lg"
            />

            {/* Navigation */}
            {galerie.length > 1 && (
              <>
                <button 
                  onClick={(e) => { e.stopPropagation(); naviguerGalerie('prev'); }} 
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-14 h-14 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition shadow-2xl"
                >
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); naviguerGalerie('next'); }} 
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-14 h-14 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition shadow-2xl"
                >
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                {/* Compteur */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm font-semibold">
                  {indexGalerie + 1} / {galerie.length}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ✉️ MODAL EMAIL avec formulaire adapté */}
      {showModalEmail && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800">
                {getTexteCTA(typeCTA)}
              </h3>
              <button 
                onClick={() => setShowModalEmail(false)} 
                className="text-gray-500 hover:text-gray-700 text-3xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Votre nom *</label>
                <input 
                  type="text" 
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none" 
                  value={formEmail.nom}
                  onChange={(e) => setFormEmail({...formEmail, nom: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Votre email *</label>
                <input 
                  type="email" 
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none" 
                  value={formEmail.email}
                  onChange={(e) => setFormEmail({...formEmail, email: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Votre téléphone</label>
                <input 
                  type="tel" 
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none" 
                  value={formEmail.telephone}
                  onChange={(e) => setFormEmail({...formEmail, telephone: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Votre message *</label>
                <textarea 
                  rows="4" 
                  required
                  placeholder={getPlaceholderMessage(typeCTA)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none" 
                  value={formEmail.message}
                  onChange={(e) => setFormEmail({...formEmail, message: e.target.value})}
                />
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button 
                onClick={() => setShowModalEmail(false)} 
                className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition font-semibold"
              >
                Annuler
              </button>
              <button 
                onClick={envoyerEmail} 
                disabled={!formEmail.nom || !formEmail.email || !formEmail.message}
                className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Envoyer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}