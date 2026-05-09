// src/app/structure/[id]/page.js - VERSION FINALE AVEC NOUVEAUX CHAMPS
// ✅ Horaires détaillés, Langues, Modes paiement, Services livraison, Badges, Vidéos YouTube

'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { structuresAPI, produitsAPI, chambresAPI } from '@/lib/api';
import { isUUID } from '@/lib/slug';
import StarRating from '@/components/ui/StarRating';
import CommentaireForm from '@/components/CommentaireForm';
import CommentairesList from '@/components/CommentairesList';
import PageTracker from '@/components/PageTracker';
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';
import BoutonFavori from '@/components/BoutonFavori';
import BoutonPartage from '@/components/BoutonPartage';
import BoutonContacterEspace from '@/components/BoutonContacterEspace';
import AvisStructure from '@/components/AvisStructure';
import { JsonLd, structureSchema, breadcrumbSchema } from '@/components/JsonLd';
import { useT } from '@/lib/i18n/LangProvider';
console.log('🔍 chambresAPI disponible:', typeof chambresAPI);

export default function StructureDetail() {
  const { t, lang } = useT();
  const { userCurrency, convertPrice } = useCurrencyConverter();
  const params = useParams();
  const router = useRouter();
  const [structure, setStructure] = useState(null);
  const [produits, setProduits] = useState([]);
  const [chambres, setChambres] = useState([]);
  const [modalChambreOuverte, setModalChambreOuverte] = useState(false);
  const [chambreSelectionnee, setChambreSelectionnee] = useState(null);
  const [indexImageChambre, setIndexImageChambre] = useState(0);
  const [imageActive, setImageActive] = useState(0);
  const [ongletActif, setOngletActif] = useState('apropos');
  const [loading, setLoading] = useState(true);
  const [refreshCommentaires, setRefreshCommentaires] = useState(0);

  // Auth entreprise — accès réservé aux comptes connectés
  const [compteConnecte, setCompteConnecte] = useState(null);
  const [authVerifie, setAuthVerifie] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false); // admin connecté → bypass toutes les gates

  useEffect(() => {
    // Vérifier session admin (bypass abonnement)
    try {
      const raw = localStorage.getItem('adminAuth');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.sessionToken) { setIsAdmin(true); setAuthVerifie(true); return; }
      }
    } catch {}

    // Sinon vérifier session entreprise
    const auth = localStorage.getItem('entrepriseAuth');
    if (auth) {
      try { setCompteConnecte(JSON.parse(auth).compte); } catch {}
    }
    setAuthVerifie(true);
  }, []);
  
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

  // Modal "Demander à échanger"
  const [showModalEchange, setShowModalEchange] = useState(false);
  const [formEchange, setFormEchange] = useState({ nom: '', email: '', telephone: '', message: '' });
  const [envoyantEchange, setEnvoyantEchange] = useState(false);
  const [echangeEnvoye, setEchangeEnvoye] = useState(false);
  const [echangeErreur, setEchangeErreur] = useState('');

  const envoyerDemandeEchange = async (e) => {
    e.preventDefault();
    setEnvoyantEchange(true);
    setEchangeErreur('');
    try {
      const res = await fetch('/api/public/demandes-contact-structure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          structure_id: structure?.id,
          nom_demandeur: formEchange.nom,
          email_demandeur: formEchange.email,
          telephone_demandeur: formEchange.telephone,
          message_demandeur: formEchange.message,
          compte_demandeur_id: compteConnecte?.id || null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setEchangeEnvoye(true);
      } else {
        setEchangeErreur(data.error || t('structure_detail.erreur_generique'));
      }
    } catch { setEchangeErreur(t('structure_detail.erreur_reseau')); }
    setEnvoyantEchange(false);
  };

  // Helpers CTA
  const getTexteCTA = (type) => {
    const map = {
      rdv: t('structure_detail.cta_rdv'),
      reserver_table: t('structure_detail.cta_reserver_table'),
      reserver_chambre: t('structure_detail.cta_reserver_chambre'),
      commander: t('structure_detail.cta_commander'),
      devis: t('structure_detail.cta_devis'),
      contact: t('structure_detail.cta_contact')
    };
    return map[type] || t('structure_detail.cta_contact');
  };

  const getMessageWhatsApp = (type, nomStructure) => {
    const ctaText = getTexteCTA(type);
    return `${ctaText} - ${nomStructure}`;
  };

  const getPlaceholderMessage = (type) => {
    const map = {
      rdv: t('structure_detail.placeholder_rdv'),
      reserver_table: t('structure_detail.placeholder_reserver_table'),
      reserver_chambre: t('structure_detail.placeholder_reserver_chambre'),
      commander: t('structure_detail.placeholder_commander'),
      devis: t('structure_detail.placeholder_devis'),
      contact: t('structure_detail.placeholder_contact')
    };
    return map[type] || t('structure_detail.placeholder_contact');
  };

  // 🆕 Helper pour extraire l'ID YouTube
  const extractYoutubeId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  // 🆕 Helper pour formater les langues
  const formatLangues = (langues) => {
    if (!langues || langues.length === 0) return null;
    const languesMap = {
      'français': t('structure_detail.langue_francais'),
      'arabe': t('structure_detail.langue_arabe'),
      'anglais': t('structure_detail.langue_anglais'),
      'espagnol': t('structure_detail.langue_espagnol'),
      'allemand': t('structure_detail.langue_allemand'),
      'italien': t('structure_detail.langue_italien'),
      'chinois': t('structure_detail.langue_chinois')
    };
    return langues.map(l => languesMap[l] || l);
  };

  // 🆕 Helper pour formater les modes de paiement
  const formatModePaiement = (mode) => {
    const modesMap = {
      'especes': t('structure_detail.paiement_especes'),
      'carte': t('structure_detail.paiement_carte'),
      'mobile_money': t('structure_detail.paiement_mobile'),
      'virement': t('structure_detail.paiement_virement'),
      'cheque': t('structure_detail.paiement_cheque')
    };
    return modesMap[mode] || mode;
  };

  // 🆕 Helper pour formater les certificats
  const formatCertificat = (cert) => {
    const certsMap = {
      'iso_9001': t('structure_detail.cert_iso'),
      'halal': t('structure_detail.cert_halal'),
      'bio': t('structure_detail.cert_bio'),
      'label_qualite': t('structure_detail.cert_label_qualite'),
      'hygiene': t('structure_detail.cert_hygiene')
    };
    return certsMap[cert] || cert;
  };

  // 🆕 Helper pour calculer les années sur la plateforme
  const getAnneesPlateformе = (anneeInscription) => {
    if (!anneeInscription) return null;
    const anneeActuelle = new Date().getFullYear();
    const annees = anneeActuelle - anneeInscription;
    if (annees === 0) return t('structure_detail.nouveau_plateforme');
    if (annees === 1) return t('structure_detail.an_plateforme');
    return `${annees} ${t('structure_detail.ans_plateforme')}`;
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
    const param = params.id;
    const structureData = isUUID(param)
      ? await structuresAPI.getById(param)
      : await structuresAPI.getBySlug(param);

    if (structureData) {
      // Si on est arrivé via UUID et que la structure a un slug → redirection vers slug
      if (isUUID(param) && structureData.slug && structureData.slug !== param) {
        router.replace(`/structure/${structureData.slug}`);
        return;
      }

      setStructure(structureData);
      const produitsData = await produitsAPI.getAll();
      const produitsFiltres = produitsData.filter(p => p.structure_id === structureData.id);
      setProduits(produitsFiltres);

      // 🆕 CHAMBRES (si hôtel/appartement)
        try {
        const chambresData = await chambresAPI.getByStructure(structureData.id);
        console.log('✅ Chambres chargées:', chambresData);
        setChambres(chambresData || []);
      } catch (errChambres) {
        console.error('❌ Erreur chambres:', errChambres);
        setChambres([]);
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

  const naviguerImageChambre = (direction) => {
  if (!chambreSelectionnee || !chambreSelectionnee.images) return;
  
  setIndexImageChambre(prev => {
    if (direction === 'next') {
      return prev === chambreSelectionnee.images.length - 1 ? 0 : prev + 1;
    } else {
      return prev === 0 ? chambreSelectionnee.images.length - 1 : prev - 1;
    }
  });
};

const ouvrirModalChambre = (chambre, indexImage = 0) => {
  setChambreSelectionnee(chambre);
  setIndexImageChambre(indexImage);
  setModalChambreOuverte(true);
};

  // Gate 1 : non connecté (bypassed si admin)
  if (authVerifie && !compteConnecte && !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-4xl mx-auto mb-5">🔒</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">{t('structure_detail.acces_reserve')}</h2>
          <p className="text-gray-600 mb-6 leading-relaxed">
            {t('structure_detail.acces_reserve_desc')}
          </p>
          <div className="space-y-3">
            <Link href="/entreprise/connexion" className="btn-primary w-full block py-3 font-semibold text-center rounded-xl">
              {t('structure_detail.se_connecter_btn')}
            </Link>
            <Link href="/entreprise/inscription" className="block w-full py-3 px-4 border-2 border-primary text-primary rounded-xl font-semibold hover:bg-primary/5 transition text-center">
              {t('structure_detail.creer_compte_btn')}
            </Link>
            <Link href="/structures" className="block text-sm text-gray-500 hover:text-gray-700 mt-2 transition">
              {t('structure_detail.retour_liste')}
            </Link>
          </div>
          <div className="mt-6 p-3 bg-blue-50 rounded-xl text-left">
            <p className="text-xs font-semibold text-blue-700 mb-1">{t('structure_detail.avantages_titre')}</p>
            <ul className="text-xs text-blue-600 space-y-1">
              <li>• {t('structure_detail.avantage_1')}</li>
              <li>• {t('structure_detail.avantage_2')}</li>
              <li>• {t('structure_detail.avantage_3')}</li>
              <li>• {t('structure_detail.avantage_4')}</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // Gate 2 : connecté mais abonnement gratuit ou expiré (bypassed si admin)
  const typePayant = ['mensuel', 'trimestriel', 'semestriel', 'annuel'];
  const estPayant = typePayant.includes(compteConnecte?.abonnement);
  const dateFin = compteConnecte?.date_fin_abonnement ? new Date(compteConnecte.date_fin_abonnement) : null;
  const abonnementValide = estPayant && (!dateFin || dateFin > new Date());
  const abonnementExpire = estPayant && dateFin && dateFin <= new Date();

  if (authVerifie && compteConnecte && !abonnementValide && !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center text-4xl mx-auto mb-5">
            {abonnementExpire ? '⏰' : '💳'}
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {abonnementExpire ? t('structure_detail.abonnement_expire') : t('structure_detail.abonnement_requis')}
          </h2>
          <p className="text-gray-600 mb-2 leading-relaxed">
            {abonnementExpire
              ? t('structure_detail.abonnement_expire_desc').replace('{{date}}', dateFin.toLocaleDateString(lang === 'ar' ? 'ar' : lang === 'en' ? 'en-GB' : 'fr-FR'))
              : t('structure_detail.abonnement_gratuit_desc')}
          </p>
          <div className="space-y-3 mt-6">
            <Link
              href="/entreprise/dashboard/messages"
              className="btn-primary w-full block py-3 font-semibold text-center rounded-xl"
            >
              {t('structure_detail.contacter_admin')}
            </Link>
            <Link
              href="/entreprise/dashboard"
              className="block w-full py-3 px-4 border-2 border-gray-200 text-gray-600 rounded-xl font-semibold hover:bg-gray-50 transition text-center"
            >
              {t('structure_detail.mon_dashboard')}
            </Link>
            <Link href="/structures" className="block text-sm text-gray-500 hover:text-gray-700 transition">
              {t('structure_detail.retour_liste_court')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
          <p className="text-xl text-gray-600 mb-4">{t('structure_detail.non_trouvee')}</p>
          <Link href="/" className="btn-primary">{t('structure_detail.retour_accueil')}</Link>
        </div>
      </div>
    );
  }

  const isBoutique = structure.categorie?.nom?.toLowerCase().includes('boutique');
  const isUsine = structure.categorie?.nom?.toLowerCase().includes('usine') || 
                   structure.categorie?.nom?.toLowerCase().includes('production');
  const isHotelOuAppart = ['hotel', 'appartement'].includes(structure.categorie_id?.toLowerCase());
  const images = structure.images || [];
  const galerie = structure.galerie || [];
  
  // Correction WhatsApp - format international
  const telWhatsApp = structure.telephone?.replace(/\D/g, '');
  
  // Génération de l'URL Google Maps avec adresse complète
  const adresseComplete = structure.adresse 
    ? `${structure.adresse}, ${structure.ville?.nom}, ${structure.pays?.nom}`
    : `${structure.nom}, ${structure.ville?.nom}, ${structure.pays?.nom}`;
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(adresseComplete)}`;
  const googleMapsEmbedUrl = `https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(adresseComplete)}&zoom=15`;

  // 🆕 Extraction des vidéos YouTube
  const videoId1 = extractYoutubeId(structure.youtube_video_url);
  const videoId2 = extractYoutubeId(structure.youtube_video_url_2);
  const hasVideos = videoId1 || videoId2;

  return (
    <>
      {/* ✅ TRACKING AVEC ID STRUCTURE */}
      {structure && (
        <PageTracker
          pageType="structure_detail"
          elementId={structure.id}
          elementType="structure"
        />
      )}
      {structure && <JsonLd data={structureSchema(structure)} />}
      {structure && (
        <JsonLd
          data={breadcrumbSchema([
            { name: 'Accueil', url: '/' },
            { name: 'Structures', url: '/structures' },
            { name: structure.nom, url: `/structure/${structure.slug || structure.id}` },
          ])}
        />
      )}
    <div className="min-h-screen bg-gray-50">
      {/* Header sticky */}
      <header className="bg-white shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-primary hover:text-primary-dark font-semibold">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            {t('structure_detail.retour')}
          </button>
        </div>
      </header>

      {/* Hero Section avec carousel d'images */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="relative h-96 bg-gray-200 rounded-xl overflow-hidden">
        {images.length > 0 ? (
          <>
            <img 
              src={images[imageActive]} 
              alt={structure.nom} 
              className="w-full h-full object-cover"
            />
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
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setImageActive(index)}
                      className={`w-3 h-3 rounded-full transition ${
                        index === imageActive ? 'bg-white scale-125' : 'bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Colonne principale */}
          <div className="lg:col-span-2 space-y-6">
            {/* En-tête avec nom, note et badges */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-start justify-between mb-4 gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold text-gray-800">{structure.nom}</h1>
                    {/* 🆕 BADGE VÉRIFIÉ */}
                    {structure.verifie && (
                      <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-bold rounded-full flex items-center gap-1">
                        {t('structure_detail.verifie')}
                      </span>
                    )}
                    {/* Badge "Profil complet" — affiché si la fiche est bien remplie */}
                    {(() => {
                      const s = structure;
                      const totalImg = (Array.isArray(s.images) ? s.images.length : 0)
                        + (Array.isArray(s.galerie) ? s.galerie.length : 0);
                      const ok =
                        (s.description?.trim().length || 0) >= 50
                        && (s.description_longue?.trim().length || 0) >= 200
                        && totalImg >= 3
                        && Boolean(s.telephone)
                        && Boolean(s.adresse)
                        && (Boolean(s.horaires) || (s.horaires_detailles && Object.keys(s.horaires_detailles).length > 0))
                        && (Boolean(s.site_web) || (Array.isArray(s.canaux_contact) && s.canaux_contact.length > 0));
                      if (!ok) return null;
                      return (
                        <span
                          title="Profil complet — toutes les informations clés sont renseignées"
                          className="px-3 py-1 bg-emerald-100 text-emerald-800 text-sm font-bold rounded-full flex items-center gap-1"
                        >
                          ⭐ Profil complet
                        </span>
                      );
                    })()}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                    <span className={`px-3 py-1 rounded-full text-white font-semibold ${structure.categorie?.color}`}>
                      {structure.categorie?.icon} {structure.categorie?.nom}
                    </span>
                    <span className="flex items-center gap-1">
                      📍 {structure.ville?.nom}, {structure.pays?.nom}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg key={star} className="w-4 h-4" fill={star <= (structure.note || 0) ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" className={star <= (structure.note || 0) ? "text-yellow-400" : "text-gray-300"} />
                        </svg>
                      ))}
                    </div>
                    <span className="text-xs text-gray-600">
                      ({structure.nombre_avis || 0} {t('structure_detail.avis')})
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <BoutonFavori type="structures" id={structure.id} variant="inline" showLabel />
                  <BoutonPartage titre={structure.nom} description={structure.description} variant="compact" />
                  <BoutonContacterEspace structureId={structure.id} type="structure" nom={structure.nom} variant="outline" />
                </div>
              </div>

              {/* 🆕 BADGES ET STATISTIQUES */}
              <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t">
                {/* Années sur la plateforme */}
                {structure.annee_inscription && (
                  <span className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium flex items-center gap-2">
                    📅 {getAnneesPlateformе(structure.annee_inscription)}
                  </span>
                )}

                {/* Année de création */}
                {structure.annee_creation && (
                  <span className="px-4 py-2 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium flex items-center gap-2">
                    {t('structure_detail.fondee_en')} {structure.annee_creation}
                  </span>
                )}

                {/* Nombre d'employés */}
                {structure.nombre_employes && (
                  <span className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium flex items-center gap-2">
                    👥 {structure.nombre_employes} {structure.nombre_employes > 1 ? t('structure_detail.employe_pluriel') : t('structure_detail.employe_singulier')}
                  </span>
                )}

                {/* Produits vendus (boutique/usine) */}
                {(isBoutique || isUsine) && structure.nombre_produits_vendus > 0 && (
                  <span className="px-4 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium flex items-center gap-2">
                    📦 {structure.nombre_produits_vendus.toLocaleString()} {structure.nombre_produits_vendus > 1 ? t('structure_detail.produit_vendu_pluriel') : t('structure_detail.produit_vendu_singulier')}
                  </span>
                )}

                {/* Certificats */}
                {structure.certificats && structure.certificats.length > 0 && structure.certificats.map(cert => (
                  <span key={cert} className="px-4 py-2 bg-yellow-50 text-yellow-700 rounded-lg text-sm font-medium">
                    {formatCertificat(cert)}
                  </span>
                ))}
              </div>

              <p className="text-gray-700 mt-4">{structure.description}</p>
            </div>

            {/* Onglets */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="flex border-b">
                <button
                  onClick={() => setOngletActif('apropos')}
                  className={`flex-1 px-6 py-4 font-semibold transition ${
                    ongletActif === 'apropos'
                      ? 'text-primary border-b-2 border-primary bg-primary/5'
                      : 'text-gray-600 hover:text-primary'
                  }`}
                >
                  {t('structure_detail.tab_apropos')}
                </button>
                {produits.length > 0 && (
                  <button
                    onClick={() => setOngletActif('produits')}
                    className={`flex-1 px-6 py-4 font-semibold transition ${
                      ongletActif === 'produits'
                        ? 'text-primary border-b-2 border-primary bg-primary/5'
                        : 'text-gray-600 hover:text-primary'
                    }`}
                  >
                    {t('structure_detail.tab_produits')} ({produits.length})
                  </button>
                )}

                {/* 🆕 ONGLET CHAMBRES */}
                {isHotelOuAppart && chambres.length > 0 && (
                  <button
                    onClick={() => setOngletActif('chambres')}
                    className={`flex-1 px-6 py-4 font-semibold transition ${
                      ongletActif === 'chambres'
                        ? 'text-primary border-b-2 border-primary bg-primary/5'
                        : 'text-gray-600 hover:text-primary'
                    }`}
                  >
                    {t('structure_detail.tab_chambres')} ({chambres.length})
                  </button>
                )}



                <button
                  onClick={() => setOngletActif('avis')}
                  className={`flex-1 px-6 py-4 font-semibold transition ${
                    ongletActif === 'avis'
                      ? 'text-primary border-b-2 border-primary bg-primary/5'
                      : 'text-gray-600 hover:text-primary'
                  }`}
                >
                  {t('structure_detail.tab_avis')} ({structure.nombre_avis || 0})
                </button>
              </div>

              <div className="p-6">
                {/* ONGLET À PROPOS */}
                {ongletActif === 'apropos' && (
                  <div className="space-y-6">
                    {structure.description_longue && (
                      <div>
                        <h3 className="text-xl font-bold text-gray-800 mb-3">{t('structure_detail.description_detaillee')}</h3>
                        <p className="text-gray-700 leading-relaxed whitespace-pre-line">{structure.description_longue}</p>
                      </div>
                    )}

                    {/* Services hôtel */}
                    {isHotelOuAppart && structure.services_inclus && structure.services_inclus.length > 0 && (
                      <div>
                        <h3 className="text-xl font-bold text-gray-800 mb-3">{t('structure_detail.services_inclus')}</h3>
                        <div className="grid md:grid-cols-2 gap-3">
                          {structure.services_inclus.map(service => {
                            const servicesMap = {
                              'wifi': { icon: '📶', label: t('structure_detail.service_wifi') },
                              'piscine': { icon: '🏊', label: t('structure_detail.service_piscine') },
                              'parking': { icon: '🅿️', label: t('structure_detail.service_parking') },
                              'restaurant': { icon: '🍽️', label: t('structure_detail.service_restaurant') },
                              'climatisation': { icon: '❄️', label: t('structure_detail.service_climatisation') },
                              'room_service': { icon: '🛎️', label: t('structure_detail.service_room_service') },
                              'gym': { icon: '🏋️', label: t('structure_detail.service_gym') },
                              'spa': { icon: '💆', label: t('structure_detail.service_spa') },
                              'petit_dejeuner': { icon: '🥐', label: t('structure_detail.service_petit_dejeuner') },
                              'blanchisserie': { icon: '👔', label: t('structure_detail.service_blanchisserie') }
                            };
                            const serviceInfo = servicesMap[service] || { icon: '✓', label: service };
                            return (
                              <div key={service} className="flex items-center gap-2 text-gray-700">
                                <span className="text-2xl">{serviceInfo.icon}</span>
                                <span>{serviceInfo.label}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {structure.politique_annulation && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <h4 className="font-semibold text-amber-800 mb-2">{t('structure_detail.politique_annulation')}</h4>
                        <p className="text-amber-700 text-sm">{structure.politique_annulation}</p>
                      </div>
                    )}

                    {/* 🆕 GALERIE PHOTOS */}
                    {galerie && galerie.length > 0 && (
                      <div>
                        <h3 className="text-xl font-bold text-gray-800 mb-4">{t('structure_detail.galerie_photos')}</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {galerie.slice(0, 8).map((photo, index) => (
                            <div
                              key={index}
                              className="relative aspect-square rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition group"
                              onClick={() => {
                                setIndexGalerie(index);
                                setGalerieOuverte(true);
                              }}
                            >
                              <img
                                src={typeof photo === 'string' ? photo : photo.url}
                                alt={`Photo ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                              {index === 7 && galerie.length > 8 && (
                                <div className="absolute inset-0 bg-black/70 flex items-center justify-center text-white font-bold text-xl">
                                  +{galerie.length - 8}
                                </div>
                              )}
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-center justify-center">
                                <svg className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                </svg>
                              </div>
                            </div>
                          ))}
                        </div>
                        {galerie.length > 8 && (
                          <button
                            onClick={() => {
                              setIndexGalerie(0);
                              setGalerieOuverte(true);
                            }}
                            className="mt-4 w-full py-3 border-2 border-primary text-primary rounded-lg hover:bg-primary hover:text-white transition font-semibold"
                          >
                            {t('structure_detail.voir_toutes_photos')} ({galerie.length})
                          </button>
                        )}
                      </div>
                    )}

                    {/* 🆕 VIDÉOS YOUTUBE */}
                    {hasVideos && (
                      <div>
                        <h3 className="text-xl font-bold text-gray-800 mb-4">{t('structure_detail.videos_presentation')}</h3>
                        <div className="space-y-4">
                          {videoId1 && (
                            <div className="aspect-video rounded-lg overflow-hidden">
                              <iframe
                                src={`https://www.youtube.com/embed/${videoId1}?rel=0`}
                                loading="lazy"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                className="w-full h-full"
                              />
                            </div>
                          )}
                          {videoId2 && (
                            <div className="aspect-video rounded-lg overflow-hidden">
                              <iframe
                                src={`https://www.youtube.com/embed/${videoId2}?rel=0`}
                                loading="lazy"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                className="w-full h-full"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ONGLET PRODUITS */}
                {ongletActif === 'produits' && (
                  <div className="grid md:grid-cols-2 gap-6">
                    {produits.map(produit => (
                      <Link
                        key={produit.id}
                        href={`/produit/${produit.id}`}
                        className="bg-gray-50 rounded-lg overflow-hidden hover:shadow-lg transition group"
                      >
                        {produit.images?.[0] && (
                          <img
                            src={produit.images[0]}
                            alt={produit.nom}
                            className="w-full h-48 object-cover group-hover:scale-105 transition"
                          />
                        )}
                        <div className="p-4">
                          <h4 className="font-bold text-gray-800 mb-2">{produit.nom}</h4>
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{produit.description}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-xl font-bold text-primary">
                              {convertPrice(produit.prix, produit.pays?.devise).toLocaleString()} {userCurrency}
                            </span>
                            <span className="text-sm text-primary font-semibold">{t('structure_detail.voir_produit')}</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}


                {/* 🆕 ONGLET CHAMBRES */}
                {ongletActif === 'chambres' && (
                  <div className="grid md:grid-cols-2 gap-6">
                    {chambres.map(chambre => {
                      const equipMap = {
                        'wifi': `📶 ${t('structure_detail.equip_wifi')}`,
                        'climatisation': `❄️ ${t('structure_detail.equip_clim')}`,
                        'tv': `📺 ${t('structure_detail.equip_tv')}`,
                        'balcon': `🌅 ${t('structure_detail.equip_balcon')}`,
                        'vue_mer': `🌊 ${t('structure_detail.equip_vue_mer')}`,
                        'minibar': `🍷 ${t('structure_detail.equip_minibar')}`,
                        'coffre_fort': `🔒 ${t('structure_detail.equip_coffre')}`,
                        'bureau': `🖊️ ${t('structure_detail.equip_bureau')}`,
                        'jacuzzi': `🛁 ${t('structure_detail.equip_jacuzzi')}`,
                        'douche': `🚿 ${t('structure_detail.equip_douche')}`,
                      };

                      const typeIcons = {
                        'simple': '🛏️',
                        'double': '🛏️🛏️',
                        'twin': '🛏️🛏️',
                        'familiale': '👨‍👩‍👧‍👦',
                        'suite': '🏰',
                        'vip': '👑',
                      };
                      
                      return (
                        <div 
                          key={chambre.id} 
                          className={`bg-gray-50 rounded-xl overflow-hidden hover:shadow-lg transition border-2 ${
                            chambre.disponible ? 'border-green-200' : 'border-red-200'
                          }`}
                        >
                          
                          {/* Image - CLIQUABLE */}
                          <div 
                            className="relative h-48 bg-gray-100 cursor-pointer group"
                            onClick={() => ouvrirModalChambre(chambre, 0)}
                          >
                            {chambre.images && chambre.images.length > 0 ? (
                              <>
                                <img
                                  src={chambre.images[0]}
                                  alt={chambre.nom_affiche}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                />
                                {/* Indicateur survol */}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                  <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-full p-3">
                                    <svg className="w-8 h-8 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                    </svg>
                                  </div>
                                </div>
                                {/* Badge nombre d'images */}
                                {chambre.images.length > 1 && (
                                  <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded-full text-xs font-bold">
                                    📷 {chambre.images.length}
                                  </div>
                                )}
                              </>
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <span className="text-6xl">{typeIcons[chambre.type_chambre] || '🛏️'}</span>
                              </div>
                            )}
                            
                            {/* Badge statut */}
                            <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-sm font-bold ${
                              chambre.disponible 
                                ? 'bg-green-100 text-green-800 border-2 border-green-300' 
                                : 'bg-red-100 text-red-800 border-2 border-red-300'
                            }`}>
                              {chambre.disponible ? t('structure_detail.chambre_disponible') : t('structure_detail.chambre_complet')}
                            </div>
                          </div>
                          
                          {/* Contenu */}
                          <div className="p-4">
                            <h4 className="font-bold text-lg text-gray-800 mb-2">
                              {typeIcons[chambre.type_chambre] || '🛏️'} {chambre.nom_affiche}
                            </h4>
                            
                            {chambre.description && (
                              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{chambre.description}</p>
                            )}
                            
                            {/* Prix */}
                            <div className="mb-3">
                              {chambre.prix_min && chambre.prix_max ? (
                                <>
                                  <p className="text-sm text-gray-600 mb-1">{t('structure_detail.a_partir_de')}</p>
                                  <p className="text-2xl font-bold text-primary">
                                    {convertPrice(chambre.prix_min, chambre.devise).toLocaleString()} - {convertPrice(chambre.prix_max, chambre.devise).toLocaleString()} {userCurrency}
                                  </p>
                                </>
                              ) : (
                                <>
                                  <p className="text-sm text-gray-600 mb-1">{t('structure_detail.prix_par_nuit')}</p>
                                  <p className="text-2xl font-bold text-primary">
                                    {convertPrice(chambre.prix_standard, chambre.devise).toLocaleString()} {userCurrency}
                                  </p>
                                </>
                              )}
                            </div>
                            
                            {/* Équipements */}
                            {chambre.equipements && chambre.equipements.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold text-gray-500 mb-2">{t('structure_detail.equipements_label')}</p>
                                <div className="flex flex-wrap gap-2">
                                  {chambre.equipements.slice(0, 6).map(equip => (
                                    <span
                                      key={equip}
                                      className="px-2 py-1 bg-white rounded text-xs border border-gray-200"
                                      title={equipMap[equip] || equip}
                                    >
                                      {equipMap[equip]?.split(' ')[0] || '✓'}
                                    </span>
                                  ))}
                                  {chambre.equipements.length > 6 && (
                                    <span className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">
                                      +{chambre.equipements.length - 6}
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}




                {/* ONGLET AVIS */}
                {ongletActif === 'avis' && (
                  <div className="space-y-6">
                    <CommentaireForm
                      structureId={structure.id}
                      onCommentaireAdded={handleCommentaireAdded}
                    />
                    <CommentairesList
                      structureId={structure.id}
                      refresh={refreshCommentaires}
                    />
                    {/* Avis B2B (entreprises uniquement) */}
                    <AvisStructure structureId={structure.id} />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar droite */}
          <div className="space-y-6">
            {/* 🆕 INFORMATIONS PRATIQUES ENRICHIES */}
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-24">
              <h3 className="text-xl font-bold text-gray-800 mb-4">{t('structure_detail.infos_pratiques')}</h3>
              
              <div className="space-y-4">
                {/* Téléphone */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">{t('structure_detail.telephone_label')}</p>
                    <a href={`tel:${structure.telephone}`} className="text-gray-800 font-semibold hover:text-primary transition">
                      {structure.telephone}
                    </a>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">{t('structure_detail.email_label')}</p>
                    <a href={`mailto:${structure.email}`} className="text-gray-800 font-semibold hover:text-primary transition break-all">
                      {structure.email}
                    </a>
                  </div>
                </div>

                {/* Horaires simples */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">{t('structure_detail.horaires_label')}</p>
                    <p className="text-gray-800 font-semibold">{structure.horaires}</p>
                  </div>
                </div>

                {/* 🆕 HORAIRES DÉTAILLÉS */}
                {structure.horaires_detailles && Object.keys(structure.horaires_detailles).length > 0 && (
                  <div className="pt-4 border-t">
                    <p className="text-sm font-semibold text-gray-700 mb-3">{t('structure_detail.horaires_detailles')}</p>
                    <div className="space-y-2">
                      {['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'].map(jour => {
                        const horaire = structure.horaires_detailles[jour];
                        if (!horaire) return null;
                        return (
                          <div key={jour} className="flex justify-between items-center text-sm">
                            <span className="text-gray-600 capitalize font-medium">{t(`structure_detail.jour_${jour}`)}</span>
                            <span className={`${horaire.ouvert ? 'text-green-600 font-semibold' : 'text-red-600'}`}>
                              {horaire.ouvert ? horaire.heures : t('structure_detail.ferme')}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 🆕 LANGUES PARLÉES */}
                {structure.langues_parlees && structure.langues_parlees.length > 0 && (
                  <div className="pt-4 border-t">
                    <p className="text-sm font-semibold text-gray-700 mb-3">{t('structure_detail.langues_parlees')}</p>
                    <div className="flex flex-wrap gap-2">
                      {formatLangues(structure.langues_parlees).map((langue, index) => (
                        <span key={index} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                          {langue}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 🆕 MODES DE PAIEMENT */}
                {structure.modes_paiement && structure.modes_paiement.length > 0 && (
                  <div className="pt-4 border-t">
                    <p className="text-sm font-semibold text-gray-700 mb-3">{t('structure_detail.modes_paiement')}</p>
                    <div className="space-y-2">
                      {structure.modes_paiement.map(mode => (
                        <div key={mode} className="text-sm text-gray-700">
                          {formatModePaiement(mode)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 🆕 SERVICES PROPOSÉS */}
                {(structure.livraison_locale || structure.livraison_internationale || structure.click_and_collect || structure.sur_place) && (
                  <div className="pt-4 border-t">
                    <p className="text-sm font-semibold text-gray-700 mb-3">{t('structure_detail.services_proposes')}</p>
                    <div className="space-y-2">
                      {structure.livraison_locale && (
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <span className="text-green-600">✓</span>
                          <span>{t('structure_detail.livraison_locale')}</span>
                        </div>
                      )}
                      {structure.livraison_internationale && (
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <span className="text-green-600">✓</span>
                          <span>{t('structure_detail.livraison_internationale')}</span>
                        </div>
                      )}
                      {structure.click_and_collect && (
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <span className="text-green-600">✓</span>
                          <span>{t('structure_detail.click_collect')}</span>
                        </div>
                      )}
                      {structure.sur_place && (
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <span className="text-green-600">✓</span>
                          <span>{t('structure_detail.sur_place')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Adresse et carte */}
                {structure.adresse && (
                  <div className="flex items-start gap-3 pt-4 border-t">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600 mb-1">{t('structure_detail.adresse_label')}</p>
                      <p className="text-gray-800 font-semibold mb-2">{structure.adresse}</p>
                      <a 
                        href={googleMapsUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline font-semibold"
                      >
                        {t('structure_detail.voir_google_maps')}
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Carte Google Maps */}
              <div className="mt-6">
                <iframe
                  src={googleMapsEmbedUrl}
                  width="100%"
                  height="200"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="rounded-lg"
                />
              </div>

              {/* CTAs */}
              {/* ── Bouton "Demander à échanger" — visible par tous ── */}
              <div className="mt-6 pt-6 border-t">
                <button
                  onClick={() => { setShowModalEchange(true); setEchangeEnvoye(false); setEchangeErreur('');
                    setFormEchange({
                      nom: compteConnecte?.nom_contact || '',
                      email: compteConnecte?.email || '',
                      telephone: '',
                      message: '',
                    });
                  }}
                  className="w-full flex items-center justify-center gap-3 p-4 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl hover:opacity-90 transition font-semibold shadow-sm"
                >
                  <span className="text-xl">🤝</span>
                  <span>{t('structure_detail.demander_echanger')}</span>
                </button>
                <p className="text-xs text-gray-400 text-center mt-2">{t('structure_detail.verifie_admin')}</p>
              </div>

              {(structure.cta_principal || structure.cta_secondaire) && structure.canaux_contact && structure.canaux_contact.length > 0 && (
                <div className="mt-6 space-y-3 pt-6 border-t">
                  <h4 className="font-bold text-gray-800 mb-4">{t('structure_detail.contactez_nous')}</h4>
                  
                  <div className="space-y-3">
                    {/* CTA Principal - WhatsApp */}
                    {structure.cta_principal && structure.canaux_contact?.includes('whatsapp') && telWhatsApp && (
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
          <div className="relative max-w-6xl w-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <img
              src={typeof galerie[indexGalerie] === 'string' ? galerie[indexGalerie] : galerie[indexGalerie].url}
              alt="Photo galerie"
              className="max-w-full max-h-[90vh] w-auto h-auto object-contain rounded-lg mx-auto block"
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

      {/* 🖼️ MODAL GALERIE CHAMBRE - VERSION ENRICHIE */}
      {modalChambreOuverte && chambreSelectionnee && chambreSelectionnee.images && chambreSelectionnee.images.length > 0 && (
        <div 
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4" 
          onClick={() => setModalChambreOuverte(false)}
        >
          {/* Bouton fermer */}
          <button 
            onClick={() => setModalChambreOuverte(false)} 
            className="absolute top-4 right-4 text-white text-4xl hover:text-gray-300 transition z-10"
          >
            ×
          </button>

          {/* Layout 2 colonnes sur desktop */}
          <div className="relative max-w-7xl w-full h-[90vh] flex flex-col md:flex-row gap-4" onClick={(e) => e.stopPropagation()}>
            
            {/* COLONNE GAUCHE - IMAGE */}
            <div className="flex-1 relative bg-black rounded-lg overflow-hidden">
              {/* Image principale */}
              <img 
                src={chambreSelectionnee.images[indexImageChambre]} 
                alt={`${chambreSelectionnee.nom_affiche} - Photo ${indexImageChambre + 1}`} 
                className="w-full h-full object-contain"
              />

              {/* Navigation */}
              {chambreSelectionnee.images.length > 1 && (
                <>
                  <button 
                    onClick={(e) => { e.stopPropagation(); naviguerImageChambre('prev'); }} 
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition shadow-2xl"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); naviguerImageChambre('next'); }} 
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition shadow-2xl"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>

                  {/* Compteur */}
                  <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-bold">
                    {indexImageChambre + 1} / {chambreSelectionnee.images.length}
                  </div>

                  {/* Miniatures */}
                  <div className="absolute bottom-4 left-4 right-4 flex gap-2 justify-center overflow-x-auto pb-2 scrollbar-hide">
                    {chambreSelectionnee.images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={(e) => { e.stopPropagation(); setIndexImageChambre(idx); }}
                        className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition ${
                          idx === indexImageChambre 
                            ? 'border-primary scale-110' 
                            : 'border-white/30 opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img 
                          src={img} 
                          alt={`Miniature ${idx + 1}`} 
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* COLONNE DROITE - INFOS */}
            <div className="w-full md:w-96 bg-white rounded-lg overflow-y-auto p-6 space-y-4">
              {/* En-tête */}
              <div className="border-b pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-3xl">
                    {{
                      'simple': '🛏️',
                      'double': '🛏️🛏️',
                      'twin': '🛏️🛏️',
                      'familiale': '👨‍👩‍👧‍👦',
                      'suite': '🏰',
                      'vip': '👑',
                    }[chambreSelectionnee.type_chambre] || '🛏️'}
                  </span>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">{chambreSelectionnee.nom_affiche}</h3>
                    <p className="text-sm text-gray-500 capitalize">{chambreSelectionnee.type_chambre}</p>
                  </div>
                </div>

                {/* Prix */}
                <div className="bg-primary/10 rounded-lg p-3 mt-3">
                  {chambreSelectionnee.prix_min && chambreSelectionnee.prix_max ? (
                    <>
                      <p className="text-3xl font-bold text-primary">
                        {convertPrice(chambreSelectionnee.prix_min, structure.pays?.devise).toLocaleString()} - {convertPrice(chambreSelectionnee.prix_max, structure.pays?.devise).toLocaleString()} {userCurrency}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {t('structure_detail.prix_standard')} : {convertPrice(chambreSelectionnee.prix_standard, structure.pays?.devise).toLocaleString()} {userCurrency}
                      </p>
                    </>
                  ) : (
                    <p className="text-3xl font-bold text-primary">
                      {convertPrice(chambreSelectionnee.prix_standard, structure.pays?.devise).toLocaleString()} {userCurrency}
                    </p>
                  )}
                </div>

                {/* Statut */}
                <div className={`mt-3 px-4 py-2 rounded-lg text-center font-bold ${
                  chambreSelectionnee.disponible 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {chambreSelectionnee.disponible ? `✅ ${t('structure_detail.disponible')}` : `❌ ${t('structure_detail.complet')}`}
                </div>
              </div>

              {/* Description */}
              {chambreSelectionnee.description && (
                <div>
                  <h4 className="font-bold text-gray-800 mb-2">{t('structure_detail.description_titre')}</h4>
                  <p className="text-sm text-gray-700 leading-relaxed">{chambreSelectionnee.description}</p>
                </div>
              )}

              {/* Équipements */}
              {chambreSelectionnee.equipements && chambreSelectionnee.equipements.length > 0 && (
                <div>
                  <h4 className="font-bold text-gray-800 mb-3">{t('structure_detail.equipements_titre')}</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {chambreSelectionnee.equipements.map(equip => {
                      const equipMap = {
                        'wifi': { icon: '📶', label: t('structure_detail.equip_wifi') },
                        'climatisation': { icon: '❄️', label: t('structure_detail.equip_clim') },
                        'tv': { icon: '📺', label: t('structure_detail.equip_tv') },
                        'balcon': { icon: '🌅', label: t('structure_detail.equip_balcon') },
                        'vue_mer': { icon: '🌊', label: t('structure_detail.equip_vue_mer') },
                        'minibar': { icon: '🍷', label: t('structure_detail.equip_minibar') },
                        'coffre_fort': { icon: '🔒', label: t('structure_detail.equip_coffre') },
                        'bureau': { icon: '🖊️', label: t('structure_detail.equip_bureau') },
                        'jacuzzi': { icon: '🛁', label: t('structure_detail.equip_jacuzzi') },
                        'baignoire': { icon: '🛁', label: t('structure_detail.equip_baignoire') },
                        'douche': { icon: '🚿', label: t('structure_detail.equip_douche') },
                        'peignoirs': { icon: '👘', label: t('structure_detail.equip_peignoirs') },
                        'seche_cheveux': { icon: '💨', label: t('structure_detail.equip_seche') },
                        'telephone': { icon: '☎️', label: t('structure_detail.equip_tel') },
                      };
                      const equipInfo = equipMap[equip] || { icon: '✓', label: equip };
                      return (
                        <div key={equip} className="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
                          <span className="text-xl">{equipInfo.icon}</span>
                          <span className="text-sm text-gray-700">{equipInfo.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* CTAs */}
              <div className="pt-4 border-t space-y-2">
                {structure.telephone && (
                  <a
                    href={`https://wa.me/${structure.telephone.replace(/\D/g, '')}?text=${encodeURIComponent(
                      `Bonjour, je souhaite réserver la ${chambreSelectionnee.nom_affiche} à ${structure.nom}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold text-center transition"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {t('structure_detail.reserver_whatsapp')}
                  </a>
                )}
                {structure.email && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setModalChambreOuverte(false);
                      ouvrirModalEmail('reserver_chambre');
                    }}
                    className="block w-full px-4 py-3 bg-primary hover:bg-primary-dark text-white rounded-lg font-semibold text-center transition"
                  >
                    {t('structure_detail.reserver_email')}
                  </button>
                )}
                {structure.telephone && !structure.telephone.match(/^[\d\s\-\+\(\)]+$/) && (
                  <a
                    href={`tel:${structure.telephone}`}
                    className="block w-full px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold text-center transition"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {t('structure_detail.appeler_directement')}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🤝 MODAL DEMANDER À ÉCHANGER */}
      {showModalEchange && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-5 border-b flex-shrink-0">
              <div>
                <h3 className="font-bold text-gray-800 text-base">{t('structure_detail.modal_echange_titre')}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{structure?.nom}</p>
              </div>
              <button
                onClick={() => setShowModalEchange(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200"
              >✕</button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {echangeEnvoye ? (
                <div className="text-center py-8 space-y-3">
                  <div className="text-5xl">✅</div>
                  <p className="font-bold text-gray-800">{t('structure_detail.demande_envoyee')}</p>
                  <p className="text-sm text-gray-500">
                    {t('structure_detail.demande_envoyee_desc')}
                  </p>
                  <button
                    onClick={() => setShowModalEchange(false)}
                    className="mt-4 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition"
                  >
                    {t('structure_detail.fermer_btn')}
                  </button>
                </div>
              ) : (
                <form onSubmit={envoyerDemandeEchange} className="space-y-4">
                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-700">
                    {t('structure_detail.info_admin')}
                  </div>

                  {echangeErreur && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">{echangeErreur}</div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('structure_detail.votre_nom')} <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        required
                        value={formEchange.nom}
                        onChange={e => setFormEchange(f => ({ ...f, nom: e.target.value }))}
                        className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('structure_detail.email_label')} <span className="text-red-500">*</span></label>
                      <input
                        type="email"
                        required
                        value={formEchange.email}
                        onChange={e => setFormEchange(f => ({ ...f, email: e.target.value }))}
                        className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('structure_detail.telephone_optionnel_label')} <span className="text-gray-400 font-normal">{t('structure_detail.optionnel')}</span></label>
                    <input
                      type="tel"
                      value={formEchange.telephone}
                      onChange={e => setFormEchange(f => ({ ...f, telephone: e.target.value }))}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('structure_detail.message_label')} <span className="text-gray-400 font-normal">{t('structure_detail.optionnel')}</span></label>
                    <textarea
                      rows={3}
                      value={formEchange.message}
                      onChange={e => setFormEchange(f => ({ ...f, message: e.target.value }))}
                      placeholder={t('structure_detail.placeholder_echange')}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={envoyantEchange}
                    className="w-full py-3 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary/90 transition disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {envoyantEchange ? (
                      <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> {t('structure_detail.envoi_en_cours')}</>
                    ) : (
                      <>{t('structure_detail.envoyer_demande')}</>
                    )}
                  </button>
                </form>
              )}
            </div>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('structure_detail.votre_nom_label')}</label>
                <input 
                  type="text" 
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none" 
                  value={formEmail.nom}
                  onChange={(e) => setFormEmail({...formEmail, nom: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('structure_detail.votre_email_label')}</label>
                <input 
                  type="email" 
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none" 
                  value={formEmail.email}
                  onChange={(e) => setFormEmail({...formEmail, email: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('structure_detail.votre_telephone_label')}</label>
                <input 
                  type="tel" 
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none" 
                  value={formEmail.telephone}
                  onChange={(e) => setFormEmail({...formEmail, telephone: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('structure_detail.votre_message_label')}</label>
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
                {t('structure_detail.annuler')}
              </button>
              <button
                onClick={envoyerEmail}
                disabled={!formEmail.nom || !formEmail.email || !formEmail.message}
                className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('structure_detail.envoyer')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}