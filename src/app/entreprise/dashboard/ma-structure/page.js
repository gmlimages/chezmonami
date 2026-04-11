'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import EntrepriseLayout from '../../EntrepriseLayout';
import Link from 'next/link';

const CTA_TYPES = [
  { value: '', label: '— Aucun —' },
  { value: 'rdv', label: '📅 Prendre rendez-vous' },
  { value: 'reserver_table', label: '🍽️ Réserver une table' },
  { value: 'reserver_chambre', label: '🏩 Réserver une chambre' },
  { value: 'commander', label: '🛍️ Passer commande' },
  { value: 'devis', label: '📋 Demander un devis' },
  { value: 'contact', label: '📞 Nous contacter' },
];

const SERVICES_DISPO = [
  { value: 'wifi', label: 'WiFi gratuit', icon: '📶' },
  { value: 'piscine', label: 'Piscine', icon: '🏊' },
  { value: 'parking', label: 'Parking', icon: '🅿️' },
  { value: 'restaurant', label: 'Restaurant', icon: '🍽️' },
  { value: 'climatisation', label: 'Climatisation', icon: '❄️' },
  { value: 'room_service', label: 'Room Service', icon: '🛎️' },
  { value: 'gym', label: 'Salle de sport', icon: '🏋️' },
  { value: 'spa', label: 'Spa', icon: '💆' },
  { value: 'petit_dejeuner', label: 'Petit-déjeuner', icon: '🥐' },
  { value: 'blanchisserie', label: 'Blanchisserie', icon: '👔' },
];

const LANGUES_DISPO = [
  { value: 'français', label: 'Français', icon: '🇫🇷' },
  { value: 'arabe', label: 'Arabe', icon: '🇲🇦' },
  { value: 'anglais', label: 'Anglais', icon: '🇬🇧' },
  { value: 'espagnol', label: 'Espagnol', icon: '🇪🇸' },
  { value: 'allemand', label: 'Allemand', icon: '🇩🇪' },
  { value: 'italien', label: 'Italien', icon: '🇮🇹' },
  { value: 'chinois', label: 'Chinois', icon: '🇨🇳' },
];

const PAIEMENTS_DISPO = [
  { value: 'especes', label: 'Espèces', icon: '💵' },
  { value: 'carte', label: 'Carte bancaire', icon: '💳' },
  { value: 'mobile_money', label: 'Mobile Money', icon: '📱' },
  { value: 'virement', label: 'Virement bancaire', icon: '🏦' },
  { value: 'cheque', label: 'Chèque', icon: '📝' },
];

const CERTIFICATS_DISPO = [
  { value: 'iso_9001', label: 'ISO 9001', icon: '🏅' },
  { value: 'halal', label: 'Halal', icon: '☪️' },
  { value: 'bio', label: 'Bio', icon: '🌱' },
  { value: 'label_qualite', label: 'Label Qualité', icon: '⭐' },
  { value: 'hygiene', label: 'Hygiène certifiée', icon: '🧼' },
];

const JOURS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];

const HORAIRES_DEFAUT = JOURS.reduce((acc, j) => ({
  ...acc,
  [j]: { ouvert: j !== 'dimanche', heures: j !== 'dimanche' ? '09:00-18:00' : '' }
}), {});

// ── Formulaire de réclamation ────────────────────────────────────────────────

function ReclamationForm({ token, onSuccess, onError }) {
  const [rechercheQuery, setRechercheQuery] = useState('');
  const [resultats, setResultats] = useState([]);
  const [rechercheLoading, setRechercheLoading] = useState(false);
  const [structureSelectionnee, setStructureSelectionnee] = useState(null);
  const [messageReclamation, setMessageReclamation] = useState('');
  const [soumettant, setSoumettant] = useState(false);

  useEffect(() => {
    if (rechercheQuery.length < 2) { setResultats([]); return; }
    const timer = setTimeout(async () => {
      setRechercheLoading(true);
      try {
        const res = await fetch(`/api/entreprise/structures/recherche?q=${encodeURIComponent(rechercheQuery)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const { structures } = await res.json();
          setResultats(structures || []);
        }
      } catch {}
      setRechercheLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [rechercheQuery, token]);

  const soumettreReclamation = async () => {
    if (!structureSelectionnee) return;
    setSoumettant(true);
    try {
      const res = await fetch('/api/entreprise/reclamation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ structure_id: structureSelectionnee.id, message: messageReclamation }),
      });
      const data = await res.json();
      if (res.ok) {
        if (onSuccess) onSuccess("Réclamation envoyée ! L'administration traitera votre demande sous peu.");
      } else {
        if (onError) onError(data.error || 'Erreur lors de l\'envoi.');
      }
    } catch {
      if (onError) onError('Erreur réseau. Veuillez réessayer.');
    }
    setSoumettant(false);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
      <p className="text-sm text-gray-600">
        Votre entreprise est déjà dans l&apos;annuaire ? Recherchez-la et soumettez une réclamation.
      </p>

      {!structureSelectionnee ? (
        <div>
          <div className="relative mb-3">
            <input
              type="text"
              placeholder="Rechercher par nom d'entreprise..."
              className="input-field w-full pr-10"
              value={rechercheQuery}
              onChange={e => setRechercheQuery(e.target.value)}
            />
            {rechercheLoading && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
          {resultats.length > 0 && (
            <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
              {resultats.map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => { setStructureSelectionnee(s); setRechercheQuery(''); setResultats([]); }}
                  className="w-full text-left px-4 py-3 hover:bg-primary/5 transition"
                >
                  <p className="font-semibold text-gray-800 text-sm">{s.nom}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {s.categories?.icon} {s.categories?.nom}
                    {s.villes?.nom && ` • ${s.villes.nom}`}
                  </p>
                </button>
              ))}
            </div>
          )}
          {rechercheQuery.length >= 2 && !rechercheLoading && resultats.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-3">
              Aucune structure trouvée pour &quot;{rechercheQuery}&quot;
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-primary/5 border border-primary/20 rounded-xl">
            <span className="text-2xl">{structureSelectionnee.categories?.icon || '🏢'}</span>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-800">{structureSelectionnee.nom}</p>
              <p className="text-xs text-gray-500">
                {structureSelectionnee.categories?.nom}
                {structureSelectionnee.villes?.nom && ` • ${structureSelectionnee.villes.nom}`}
              </p>
            </div>
            <button type="button" onClick={() => setStructureSelectionnee(null)} className="text-gray-400 hover:text-gray-600 text-sm">✕</button>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Message (optionnel)</label>
            <textarea
              rows={3}
              placeholder="Expliquez pourquoi cette fiche vous appartient..."
              className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              value={messageReclamation}
              onChange={e => setMessageReclamation(e.target.value)}
            />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setStructureSelectionnee(null)} className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-gray-700 text-sm font-medium hover:bg-gray-50">Changer</button>
            <button type="button" onClick={soumettreReclamation} disabled={soumettant} className="flex-1 btn-primary py-2.5 text-sm font-semibold disabled:opacity-50">
              {soumettant ? 'Envoi...' : '📨 Soumettre'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Page principale ───────────────────────────────────────────────────────────

export default function MaStructurePage() {
  const [token, setToken] = useState('');
  const [structure, setStructure] = useState(null);
  const [reclamation, setReclamation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [section, setSection] = useState('infos');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [ongletCreation, setOngletCreation] = useState('creer');
  const [listePays, setListePays] = useState([]);
  const [listeVilles, setListeVilles] = useState([]);
  const [listeCats, setListeCats] = useState([]);
  // Suppression fiche
  const [showSupprModal, setShowSupprModal] = useState(false);
  const [motifSuppression, setMotifSuppression] = useState('');
  const [envoyantSuppression, setEnvoyantSuppression] = useState(false);

  // Formulaire
  const [form, setForm] = useState({
    nom: '',
    categorie_id: '',
    description: '',
    description_longue: '',
    pays_id: '',
    ville_id: '',
    adresse: '',
    site_web: '',
    annee_creation: '',
    nombre_employes: '',
    images: [],
    galerie: [],
    youtube_video_url: '',
    youtube_video_url_2: '',
    horaires_detailles: HORAIRES_DEFAUT,
    langues_parlees: [],
    modes_paiement: [],
    services_inclus: [],
    certificats: [],
    livraison_locale: false,
    livraison_internationale: false,
    click_and_collect: false,
    sur_place: true,
    cta_principal: '',
    cta_secondaire: '',
    politique_annulation: '',
  });

  useEffect(() => {
    const auth = localStorage.getItem('entrepriseAuth');
    if (!auth) return;
    const { token: t } = JSON.parse(auth);
    setToken(t);
    chargerStructure(t);
    chargerReclamation(t);
    // Charger pays et villes
    supabase.from('pays').select('id, nom').order('nom').then(({ data }) => setListePays(data || []));
    supabase.from('villes').select('id, nom, pays_id').order('nom').then(({ data }) => setListeVilles(data || []));
    supabase.from('categories').select('id, nom, icon').order('nom').then(({ data }) => setListeCats(data || []));
  }, []);

  const chargerReclamation = async (t) => {
    try {
      const res = await fetch('/api/entreprise/reclamation', {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (res.ok) {
        const { reclamation: r } = await res.json();
        setReclamation(r);
      }
    } catch {}
  };

  const demanderSuppression = async () => {
    setEnvoyantSuppression(true);
    try {
      const res = await fetch('/api/entreprise/demande-suppression-fiche', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ motif: motifSuppression }),
      });
      if (res.ok) {
        setShowSupprModal(false);
        setMotifSuppression('');
        setMessage({ type: 'succes', text: 'Votre demande de suppression a été transmise à l\'administration.' });
      } else {
        const data = await res.json();
        setMessage({ type: 'erreur', text: data.error || 'Erreur lors de la demande.' });
      }
    } catch {
      setMessage({ type: 'erreur', text: 'Erreur réseau.' });
    }
    setEnvoyantSuppression(false);
  };

  const chargerStructure = async (t) => {
    setLoading(true);
    try {
      const res = await fetch('/api/entreprise/ma-structure', {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (res.ok) {
        const { structure: s } = await res.json();
        setStructure(s);
        setForm({
          nom: s.nom || '',
          categorie_id: s.categorie_id || '',
          description: s.description || '',
          description_longue: s.description_longue || '',
          pays_id: s.pays_id || '',
          ville_id: s.ville_id || '',
          adresse: s.adresse || '',
          site_web: s.site_web || '',
          annee_creation: s.annee_creation || '',
          nombre_employes: s.nombre_employes || '',
          images: s.images || [],
          galerie: s.galerie || [],
          youtube_video_url: s.youtube_video_url || '',
          youtube_video_url_2: s.youtube_video_url_2 || '',
          horaires_detailles: s.horaires_detailles || HORAIRES_DEFAUT,
          langues_parlees: s.langues_parlees || [],
          modes_paiement: s.modes_paiement || [],
          services_inclus: s.services_inclus || [],
          certificats: s.certificats || [],
          livraison_locale: s.livraison_locale || false,
          livraison_internationale: s.livraison_internationale || false,
          click_and_collect: s.click_and_collect || false,
          sur_place: s.sur_place !== undefined ? s.sur_place : true,
          cta_principal: s.cta_principal || '',
          cta_secondaire: s.cta_secondaire || '',
          politique_annulation: s.politique_annulation || '',
        });
      }
    } catch {}
    setLoading(false);
  };

  const toggle = (champ, valeur) => {
    setForm(f => {
      const arr = f[champ] || [];
      return {
        ...f,
        [champ]: arr.includes(valeur) ? arr.filter(v => v !== valeur) : [...arr, valeur],
      };
    });
  };

  // Upload image vers Supabase Storage
  const uploadImage = async (file, dossier = 'structures') => {
    const ext = file.name.split('.').pop();
    const path = `${dossier}/${structure?.id || 'nouveau'}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('images').upload(path, file, { upsert: true });
    if (error) throw error;
    const { data: urlData } = supabase.storage.from('images').getPublicUrl(path);
    return urlData.publicUrl;
  };

  const handleImagePrincipale = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setMessage({ type: 'erreur', text: 'Image trop lourde (max 5 Mo)' }); return; }
    setUploadingImage(true);
    try {
      const url = await uploadImage(file);
      setForm(f => ({ ...f, images: [url, ...(f.images || []).slice(1)] }));
    } catch { setMessage({ type: 'erreur', text: "Erreur lors de l'upload" }); }
    setUploadingImage(false);
    e.target.value = '';
  };

  const handleGalerieAdd = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploadingImage(true);
    try {
      const urls = await Promise.all(files.map(f => uploadImage(f, 'galerie')));
      setForm(f => ({ ...f, galerie: [...(f.galerie || []), ...urls] }));
    } catch { setMessage({ type: 'erreur', text: "Erreur lors de l'upload" }); }
    setUploadingImage(false);
    e.target.value = '';
  };

  const supprimerImageGalerie = (index) => {
    setForm(f => ({ ...f, galerie: f.galerie.filter((_, i) => i !== index) }));
  };

  // type = 'brouillon' | 'soumettre' | 'modifier'
  const sauvegarder = async (type = 'brouillon') => {
    if (!form.nom.trim()) { setMessage({ type: 'erreur', text: 'Le nom est obligatoire' }); return; }
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      const isCreation = !structure;
      const statut = type === 'soumettre' ? 'soumis' : type === 'brouillon' ? 'brouillon' : structure?.statut;
      const res = await fetch(
        isCreation ? '/api/entreprise/structures' : '/api/entreprise/ma-structure',
        {
          method: isCreation ? 'POST' : 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ ...form, statut }),
        }
      );
      const data = await res.json();
      if (res.ok) {
        if (isCreation) {
          await chargerStructure(token);
        } else {
          setStructure(data.structure);
        }
        if (type === 'modifier') {
          setMessage({ type: 'succes', text: 'Modifications enregistrées avec succès.' });
        } else if (type === 'soumettre') {
          setMessage({ type: 'succes', text: 'Fiche soumise pour vérification ! L\'administration examinera vos informations prochainement.' });
        } else {
          setMessage({ type: 'brouillon', text: 'Brouillon enregistré. Vous pouvez continuer à compléter votre fiche.' });
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setMessage({ type: 'erreur', text: data.error });
      }
    } catch {
      setMessage({ type: 'erreur', text: 'Erreur réseau. Veuillez réessayer.' });
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <EntrepriseLayout titre="Ma fiche entreprise">
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </EntrepriseLayout>
    );
  }

  const SECTIONS = [
    { key: 'infos', label: 'Informations', icon: '📋' },
    { key: 'medias', label: 'Médias', icon: '🖼️' },
    { key: 'horaires', label: 'Horaires', icon: '🕐' },
    { key: 'services', label: 'Services', icon: '⚙️' },
    { key: 'cta', label: 'Contact & CTA', icon: '📞' },
  ];

  return (
    <EntrepriseLayout titre="Ma fiche entreprise">
      <form onSubmit={e => e.preventDefault()} className="max-w-3xl mx-auto space-y-5">

        {/* Message global — toujours visible peu importe l'état */}
        {message.text && (
          <div className={`p-4 rounded-xl text-sm font-medium border ${
            message.type === 'succes'    ? 'bg-green-50 text-green-700 border-green-200' :
            message.type === 'brouillon' ? 'bg-gray-50 text-gray-700 border-gray-300' :
                                           'bg-red-50 text-red-700 border-red-200'
          }`}>
            {message.type === 'succes' ? '✅ ' : message.type === 'brouillon' ? '💾 ' : '❌ '}
            {message.text}
          </div>
        )}

        {/* ── Pas de structure ── */}
        {!structure && (
          <>
            {reclamation?.statut === 'en_attente' ? (
              /* Réclamation en attente — tout est masqué, juste le bandeau */
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex items-start gap-3">
                <span className="text-3xl flex-shrink-0">⏳</span>
                <div>
                  <p className="font-semibold text-amber-800 text-base">Demande de réclamation en cours de traitement</p>
                  <p className="text-sm text-amber-700 mt-1">
                    Vous avez réclamé la fiche <strong>{reclamation.structures?.nom}</strong>. L&apos;administration traitera votre demande sous peu. Vous serez notifié du résultat.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Réclamation refusée */}
                {reclamation?.statut === 'refusee' && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0">❌</span>
                    <div>
                      <p className="font-semibold text-red-800">Réclamation refusée</p>
                      <p className="text-sm text-red-700 mt-0.5">
                        Votre réclamation pour <strong>{reclamation.structures?.nom}</strong> a été refusée.
                        {reclamation.message_admin && <span> Motif : {reclamation.message_admin}</span>}
                      </p>
                      <p className="text-sm text-red-600 mt-1">Vous pouvez créer une nouvelle fiche ou soumettre une nouvelle réclamation.</p>
                    </div>
                  </div>
                )}

                {/* Bandeau info */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">🏢</span>
                  <div>
                    <p className="font-semibold text-amber-800">Aucune fiche liée à votre compte</p>
                    <p className="text-sm text-amber-700 mt-0.5">
                      Remplissez le formulaire pour créer votre fiche, ou réclamez une fiche existante.
                    </p>
                  </div>
                </div>

                {/* Onglets Créer / Réclamer */}
                <div className="flex bg-white rounded-xl border border-gray-200 p-1 gap-1">
                  <button
                    type="button"
                    onClick={() => setOngletCreation('creer')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition ${
                      ongletCreation === 'creer' ? 'bg-primary text-white shadow' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    ✨ Créer une nouvelle fiche
                  </button>
                  <button
                    type="button"
                    onClick={() => setOngletCreation('reclamer')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition ${
                      ongletCreation === 'reclamer' ? 'bg-primary text-white shadow' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    🔍 Réclamer une fiche existante
                  </button>
                </div>

                {ongletCreation === 'reclamer' && (
                  <ReclamationForm
                    token={token}
                    onSuccess={(msg) => {
                      setMessage({ type: 'succes', text: msg });
                      chargerReclamation(token);
                    }}
                    onError={(err) => setMessage({ type: 'erreur', text: err })}
                  />
                )}
              </>
            )}
          </>
        )}

        {/* Bandeau fiche soumise en attente de validation */}
        {structure?.statut === 'soumis' && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
            <span className="text-2xl flex-shrink-0">📋</span>
            <div>
              <p className="font-semibold text-blue-800">Fiche soumise — en attente de validation</p>
              <p className="text-sm text-blue-700 mt-0.5">
                Votre fiche est en cours d&apos;examen par l&apos;administration et ne sera visible publiquement qu&apos;après validation. Vous pouvez continuer à modifier vos informations.
              </p>
            </div>
          </div>
        )}

        {/* Bandeau fiche publiée */}
        {structure?.statut === 'publie' && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
            <span className="text-2xl">🌐</span>
            <p className="text-sm text-green-800 font-medium">Votre fiche est publiée et visible publiquement.</p>
          </div>
        )}

        {/* ── Formulaire complet : création ou édition ── */}
        {(structure || (ongletCreation === 'creer' && reclamation?.statut !== 'en_attente')) && (<>

        {/* En-tête fiche (mode édition seulement) */}
        {structure && <div className="bg-white rounded-2xl border border-gray-200 p-5 flex items-start gap-4">
          <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
            {form.images?.[0] ? (
              <img src={form.images[0]} alt={form.nom} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl bg-primary/10">
                {structure.categorie?.icon || '🏢'}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-bold text-gray-800 text-lg truncate">{structure.nom}</h2>
            <div className="flex flex-wrap gap-2 mt-1">
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                {structure.categorie?.icon} {structure.categorie?.nom}
              </span>
              {structure.ville && (
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                  📍 {structure.ville.nom}, {structure.pays?.nom}
                </span>
              )}
              {structure.verifie && (
                <span className="text-xs text-green-700 bg-green-100 px-2 py-0.5 rounded-full font-medium">✅ Vérifiée</span>
              )}
            </div>
          </div>
          <Link
            href={`/structure/${structure.id}`}
            target="_blank"
            className="text-xs text-primary hover:underline flex-shrink-0 font-medium"
          >
            Voir la fiche →
          </Link>
        </div>}

        {/* Onglets sections */}
        <div className="bg-white rounded-xl border border-gray-200 p-1.5 flex gap-1 overflow-x-auto">
          {SECTIONS.map(s => (
            <button
              key={s.key}
              type="button"
              onClick={() => setSection(s.key)}
              className={`flex-1 min-w-max flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs sm:text-sm font-semibold transition whitespace-nowrap ${
                section === s.key ? 'bg-primary text-white shadow' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span>{s.icon}</span>
              <span>{s.label}</span>
            </button>
          ))}
        </div>

        {/* ── SECTION INFORMATIONS ── */}
        {section === 'infos' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
              <h3 className="font-bold text-gray-800">Informations générales</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom de la structure <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  className="input-field w-full"
                  value={form.nom}
                  onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Catégorie</label>
                <select
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                  value={form.categorie_id}
                  onChange={e => setForm(f => ({ ...f, categorie_id: e.target.value }))}
                >
                  <option value="">— Sélectionner une catégorie —</option>
                  {listeCats.map(c => (
                    <option key={c.id} value={c.id}>{c.icon} {c.nom}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description courte</label>
                <textarea
                  rows={2}
                  maxLength={300}
                  placeholder="Résumé en 1-2 phrases affiché dans les listes..."
                  className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                />
                <p className="text-xs text-gray-400 text-right">{form.description.length}/300</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description complète</label>
                <textarea
                  rows={5}
                  placeholder="Présentation détaillée de votre entreprise, vos services, votre histoire..."
                  className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                  value={form.description_longue}
                  onChange={e => setForm(f => ({ ...f, description_longue: e.target.value }))}
                />
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
              <h3 className="font-bold text-gray-800">Coordonnées</h3>

              {/* Téléphone et email : gérés par l'admin */}
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl">
                <p className="text-xs font-semibold text-blue-700 mb-2">📞 Contacts affichés sur votre fiche</p>
                {structure ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-blue-600 mb-0.5">Téléphone</p>
                      <p className="text-sm font-medium text-blue-800 bg-white/60 px-3 py-2 rounded-lg border border-blue-100">
                        {structure.telephone || '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-blue-600 mb-0.5">Email</p>
                      <p className="text-sm font-medium text-blue-800 bg-white/60 px-3 py-2 rounded-lg border border-blue-100 truncate">
                        {structure.email || '—'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-blue-700">
                    Le téléphone et l&apos;email seront définis par l&apos;administration après validation de votre fiche.
                  </p>
                )}
                <p className="text-xs text-blue-500 mt-2">
                  ℹ️ Ces contacts sont gérés par l&apos;administration. Contactez-nous pour les modifier.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Pays</label>
                  <select
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                    value={form.pays_id}
                    onChange={e => setForm(f => ({ ...f, pays_id: e.target.value, ville_id: '' }))}
                  >
                    <option value="">— Sélectionner un pays —</option>
                    {listePays.map(p => (
                      <option key={p.id} value={p.id}>{p.nom}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Ville</label>
                  <select
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50"
                    value={form.ville_id}
                    onChange={e => setForm(f => ({ ...f, ville_id: e.target.value }))}
                    disabled={!form.pays_id}
                  >
                    <option value="">— Sélectionner une ville —</option>
                    {listeVilles.filter(v => v.pays_id === form.pays_id).map(v => (
                      <option key={v.id} value={v.id}>{v.nom}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Adresse</label>
                <input
                  type="text"
                  placeholder="Rue, quartier..."
                  className="input-field w-full"
                  value={form.adresse}
                  onChange={e => setForm(f => ({ ...f, adresse: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Site web</label>
                <input
                  type="url"
                  placeholder="https://www.monentreprise.com"
                  className="input-field w-full"
                  value={form.site_web}
                  onChange={e => setForm(f => ({ ...f, site_web: e.target.value }))}
                />
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
              <h3 className="font-bold text-gray-800">À propos</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Année de création</label>
                  <input
                    type="number"
                    min="1900"
                    max={new Date().getFullYear()}
                    placeholder="Ex: 2015"
                    className="input-field w-full"
                    value={form.annee_creation}
                    onChange={e => setForm(f => ({ ...f, annee_creation: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre d&apos;employés</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Ex: 25"
                    className="input-field w-full"
                    value={form.nombre_employes}
                    onChange={e => setForm(f => ({ ...f, nombre_employes: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── SECTION MÉDIAS ── */}
        {section === 'medias' && (
          <div className="space-y-4">
            {/* Image principale */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
              <h3 className="font-bold text-gray-800">Image principale</h3>
              <p className="text-xs text-gray-500">C&apos;est la première image affichée sur votre fiche. Formats : JPG, PNG, WEBP • Max 5 Mo</p>
              <div className="flex items-center gap-4">
                <div className="w-28 h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200">
                  {form.images?.[0] ? (
                    <img src={form.images[0]} alt="Principale" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl text-gray-400">🖼️</div>
                  )}
                </div>
                <label className="cursor-pointer px-4 py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-600 hover:border-primary hover:text-primary transition">
                  {uploadingImage ? '⏳ Upload...' : '📷 Changer l\'image principale'}
                  <input type="file" accept="image/*" className="hidden" onChange={handleImagePrincipale} disabled={uploadingImage} />
                </label>
              </div>
            </div>

            {/* Galerie */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-800">Galerie photos</h3>
                <span className="text-xs text-gray-400">{(form.galerie || []).length} photo(s)</span>
              </div>

              {(form.galerie || []).length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {form.galerie.map((url, idx) => (
                    <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden bg-gray-100">
                      <img src={url} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => supprimerImageGalerie(idx)}
                        className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition flex items-center justify-center"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <label className="cursor-pointer flex items-center gap-3 px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-600 hover:border-primary hover:text-primary transition">
                {uploadingImage ? '⏳ Upload en cours...' : '➕ Ajouter des photos à la galerie'}
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleGalerieAdd} disabled={uploadingImage} />
              </label>
            </div>

            {/* Vidéos YouTube */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
              <h3 className="font-bold text-gray-800">Vidéos YouTube</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Vidéo principale</label>
                <input
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="input-field w-full"
                  value={form.youtube_video_url}
                  onChange={e => setForm(f => ({ ...f, youtube_video_url: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Vidéo secondaire</label>
                <input
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="input-field w-full"
                  value={form.youtube_video_url_2}
                  onChange={e => setForm(f => ({ ...f, youtube_video_url_2: e.target.value }))}
                />
              </div>
            </div>
          </div>
        )}

        {/* ── SECTION HORAIRES ── */}
        {section === 'horaires' && (
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h3 className="font-bold text-gray-800">Horaires d&apos;ouverture</h3>
            <div className="space-y-3">
              {JOURS.map(jour => (
                <div key={jour} className="grid grid-cols-[5.5rem_5rem_1fr] items-center gap-2 min-w-0">
                  <span className="text-sm font-medium text-gray-700 capitalize truncate">{jour}</span>
                  <label className="flex items-center gap-1.5 cursor-pointer flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={form.horaires_detailles?.[jour]?.ouvert || false}
                      onChange={e => setForm(f => ({
                        ...f,
                        horaires_detailles: {
                          ...f.horaires_detailles,
                          [jour]: { ...f.horaires_detailles?.[jour], ouvert: e.target.checked }
                        }
                      }))}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-xs text-gray-600">Ouvert</span>
                  </label>
                  {form.horaires_detailles?.[jour]?.ouvert ? (
                    <input
                      type="text"
                      placeholder="09:00-18:00"
                      className="min-w-0 w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                      value={form.horaires_detailles?.[jour]?.heures || ''}
                      onChange={e => setForm(f => ({
                        ...f,
                        horaires_detailles: {
                          ...f.horaires_detailles,
                          [jour]: { ...f.horaires_detailles?.[jour], heures: e.target.value }
                        }
                      }))}
                    />
                  ) : (
                    <span className="text-xs text-gray-400 italic">Fermé</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── SECTION SERVICES ── */}
        {section === 'services' && (
          <div className="space-y-4">
            {/* Services inclus */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
              <h3 className="font-bold text-gray-800">Services & équipements</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {SERVICES_DISPO.map(s => (
                  <label key={s.value} className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition text-sm ${
                    (form.services_inclus || []).includes(s.value)
                      ? 'border-primary bg-primary/5 text-primary font-medium'
                      : 'border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}>
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={(form.services_inclus || []).includes(s.value)}
                      onChange={() => toggle('services_inclus', s.value)}
                    />
                    <span>{s.icon}</span>
                    <span>{s.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Langues parlées */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
              <h3 className="font-bold text-gray-800">Langues parlées</h3>
              <div className="flex flex-wrap gap-2">
                {LANGUES_DISPO.map(l => (
                  <label key={l.value} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border cursor-pointer transition text-sm ${
                    (form.langues_parlees || []).includes(l.value)
                      ? 'border-primary bg-primary text-white font-medium'
                      : 'border-gray-300 text-gray-700 hover:border-gray-400'
                  }`}>
                    <input type="checkbox" className="hidden" checked={(form.langues_parlees || []).includes(l.value)} onChange={() => toggle('langues_parlees', l.value)} />
                    <span>{l.icon}</span>
                    <span>{l.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Modes de paiement */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
              <h3 className="font-bold text-gray-800">Modes de paiement acceptés</h3>
              <div className="flex flex-wrap gap-2">
                {PAIEMENTS_DISPO.map(p => (
                  <label key={p.value} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border cursor-pointer transition text-sm ${
                    (form.modes_paiement || []).includes(p.value)
                      ? 'border-primary bg-primary text-white font-medium'
                      : 'border-gray-300 text-gray-700 hover:border-gray-400'
                  }`}>
                    <input type="checkbox" className="hidden" checked={(form.modes_paiement || []).includes(p.value)} onChange={() => toggle('modes_paiement', p.value)} />
                    <span>{p.icon}</span>
                    <span>{p.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Certificats */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
              <h3 className="font-bold text-gray-800">Certifications & labels</h3>

              {/* Suggestions rapides */}
              <div>
                <p className="text-xs text-gray-500 mb-2">Suggestions rapides</p>
                <div className="flex flex-wrap gap-2">
                  {CERTIFICATS_DISPO.map(c => {
                    const dejaDans = (form.certificats || []).includes(c.label);
                    return (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => toggle('certificats', c.label)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition text-sm ${
                          dejaDans
                            ? 'border-amber-500 bg-amber-50 text-amber-700 font-medium'
                            : 'border-gray-300 text-gray-700 hover:border-gray-400'
                        }`}
                      >
                        <span>{c.icon}</span>
                        <span>{c.label}</span>
                        {dejaDans && <span className="ml-0.5 text-amber-500">✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Saisie libre */}
              <div>
                <p className="text-xs text-gray-500 mb-2">Ajouter une certification personnalisée</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ex: NF EN ISO 22000, HACCP, Label Tourisme..."
                    className="input-field flex-1"
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const val = e.target.value.trim();
                        if (val && !(form.certificats || []).includes(val)) {
                          setForm(f => ({ ...f, certificats: [...(f.certificats || []), val] }));
                        }
                        e.target.value = '';
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-200 transition"
                    onClick={e => {
                      const input = e.currentTarget.previousSibling;
                      const val = input.value.trim();
                      if (val && !(form.certificats || []).includes(val)) {
                        setForm(f => ({ ...f, certificats: [...(f.certificats || []), val] }));
                      }
                      input.value = '';
                    }}
                  >
                    + Ajouter
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">Appuyez sur Entrée ou cliquez sur « Ajouter »</p>
              </div>

              {/* Liste des certifications sélectionnées */}
              {(form.certificats || []).length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-2">Certifications sélectionnées</p>
                  <div className="flex flex-wrap gap-2">
                    {(form.certificats || []).map((cert, i) => (
                      <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-full text-sm text-amber-800 font-medium">
                        🏅 {cert}
                        <button
                          type="button"
                          onClick={() => setForm(f => ({ ...f, certificats: f.certificats.filter((_, idx) => idx !== i) }))}
                          className="ml-0.5 text-amber-400 hover:text-amber-700 transition font-bold leading-none"
                          title="Supprimer"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── SECTION CONTACT & CTA ── */}
        {section === 'cta' && (
          <div className="space-y-4">
            {/* Modes de vente/livraison */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
              <h3 className="font-bold text-gray-800">Modes de vente</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: 'sur_place', label: 'Sur place', icon: '🏪' },
                  { key: 'click_and_collect', label: 'Click & Collect', icon: '📦' },
                  { key: 'livraison_locale', label: 'Livraison locale', icon: '🛵' },
                  { key: 'livraison_internationale', label: 'Livraison internationale', icon: '✈️' },
                ].map(item => (
                  <label key={item.key} className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition ${
                    form[item.key] ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-primary"
                      checked={form[item.key] || false}
                      onChange={e => setForm(f => ({ ...f, [item.key]: e.target.checked }))}
                    />
                    <span>{item.icon}</span>
                    <span className="text-sm font-medium text-gray-700">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
              <h3 className="font-bold text-gray-800">Boutons d&apos;action (CTA)</h3>
              <p className="text-xs text-gray-500">Ces boutons apparaissent sur votre fiche pour inviter les visiteurs à agir</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">CTA principal</label>
                  <select
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                    value={form.cta_principal}
                    onChange={e => setForm(f => ({ ...f, cta_principal: e.target.value }))}
                  >
                    {CTA_TYPES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">CTA secondaire</label>
                  <select
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                    value={form.cta_secondaire}
                    onChange={e => setForm(f => ({ ...f, cta_secondaire: e.target.value }))}
                  >
                    {CTA_TYPES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Politique d'annulation */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
              <h3 className="font-bold text-gray-800">Politique d&apos;annulation</h3>
              <textarea
                rows={3}
                placeholder="Décrivez votre politique d'annulation et de remboursement..."
                className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                value={form.politique_annulation}
                onChange={e => setForm(f => ({ ...f, politique_annulation: e.target.value }))}
              />
            </div>
          </div>
        )}

        {/* Boutons Brouillon / Soumettre */}
        <div className="sticky bottom-4 z-10">
          <div className="bg-white/90 backdrop-blur-sm border border-gray-200 shadow-lg rounded-2xl p-3 flex flex-col sm:flex-row gap-3">
            {(!structure || structure?.statut === 'brouillon') && (
              <button
                type="button"
                onClick={() => sauvegarder('brouillon')}
                disabled={saving || uploadingImage}
                className="flex-1 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm flex items-center justify-center gap-2"
              >
                {saving ? (
                  <><span className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" /> Sauvegarde...</>
                ) : '💾 Enregistrer en brouillon'}
              </button>
            )}
            <button
              type="button"
              onClick={() => sauvegarder(structure ? (structure?.statut === 'brouillon' ? 'soumettre' : 'modifier') : 'soumettre')}
              disabled={saving || uploadingImage}
              className="flex-1 py-3 btn-primary font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed shadow text-sm flex items-center justify-center gap-2"
            >
              {saving ? (
                <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Sauvegarde...</>
              ) : !structure || structure?.statut === 'brouillon' ? '📤 Soumettre pour validation' : '✏️ Enregistrer les modifications'}
            </button>
          </div>
          <p className="text-center text-xs text-gray-400 mt-1.5">
            Vous pouvez modifier votre fiche à tout moment, même après soumission.
          </p>
        </div>

        {/* Bouton suppression fiche — mode édition seulement */}
        {structure && (
          <div className="flex justify-center pb-2">
            <button
              type="button"
              onClick={() => setShowSupprModal(true)}
              className="text-sm text-red-500 hover:text-red-700 underline underline-offset-2 transition"
            >
              🗑️ Demander la suppression de cette fiche
            </button>
          </div>
        )}

        </>)}

      </form>

      {/* Modal demande de suppression */}
      {showSupprModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-800">Demander la suppression de la fiche</h3>
            <p className="text-sm text-gray-600">
              Votre demande sera transmise à l&apos;administration. La suppression sera effectuée après validation.
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Motif (optionnel)</label>
              <textarea
                rows={3}
                placeholder="Expliquez pourquoi vous souhaitez supprimer cette fiche..."
                className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                value={motifSuppression}
                onChange={e => setMotifSuppression(e.target.value)}
              />
            </div>
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => { setShowSupprModal(false); setMotifSuppression(''); }}
                className="flex-1 py-2.5 border border-gray-300 rounded-xl text-gray-700 text-sm font-medium hover:bg-gray-50 transition"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={demanderSuppression}
                disabled={envoyantSuppression}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-semibold transition disabled:opacity-50"
              >
                {envoyantSuppression ? 'Envoi...' : '🗑️ Envoyer la demande'}
              </button>
            </div>
          </div>
        </div>
      )}

    </EntrepriseLayout>
  );
}
